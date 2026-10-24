const Appointment = require("../models/Appointment");
const Doctor = require("../models/Doctor");

exports.createAppointment = async (req, res) => {
  const { doctorId, startAt, reason } = req.body || {};

  if (
    typeof doctorId !== "string" ||
    !/^[a-fA-F0-9]{24}$/.test(doctorId) ||
    typeof startAt !== "string" ||
    !/(Z|[+-]\d{2}:\d{2})$/.test(startAt) ||
    typeof reason !== "string" ||
    !reason.trim() ||
    reason.trim().length > 500
  ) {
    return res.status(400).json({
      message: "Provide a doctor, valid slot, and reason of up to 500 characters"
    });
  }

  const requestedStart = new Date(startAt);

  if (
    !Number.isFinite(requestedStart.getTime()) ||
    requestedStart <= new Date()
  ) {
    return res.status(400).json({
      message: "Choose a valid future slot"
    });
  }

  try {
    const doctor = await Doctor.findOne({
      _id: doctorId,
      isActive: true
    });

    if (!doctor) {
      return res.status(404).json({
        message: "Doctor is not available"
      });
    }

    // Use the doctor's stored slot, not a client-supplied end time.
    const slot = doctor.availability.find(
      (item) =>
        item.startAt.getTime() === requestedStart.getTime() &&
        item.endAt - item.startAt === 30 * 60 * 1000
    );

    if (!slot) {
      return res.status(400).json({
        message: "This is not a published appointment slot"
      });
    }

    const appointment = await Appointment.create({
      patientId: req.user._id,
      doctorId: doctor._id,
      startAt: slot.startAt,
      endAt: slot.endAt,
      reason: reason.trim(),
      status: "booked"
    });

    return res.status(201).json({
      message: "Appointment booked successfully",
      appointment
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: "This slot was just booked. Choose another slot."
      });
    }

    console.error("Booking error:", error);

    return res.status(500).json({
      message: "Unable to book the appointment"
    });
  }
};

exports.getMyAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.find({
      patientId: req.user._id
    })
      .populate("doctorId", "name specialization")
      .sort({ startAt: 1 });

    return res.json({ appointments });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Unable to load appointments"
    });
  }
};

exports.cancelAppointment = async (req, res) => {
  if (!/^[a-fA-F0-9]{24}$/.test(req.params.id)) {
    return res.status(400).json({
      message: "Invalid appointment ID"
    });
  }

  try {
    const appointment = await Appointment.findOneAndUpdate(
      {
        _id: req.params.id,
        patientId: req.user._id,
        status: "booked",
        startAt: { $gt: new Date() }
      },
      { $set: { status: "cancelled" } },
      { new: true, runValidators: true }
    );

    if (!appointment) {
      return res.status(409).json({
        message: "This appointment cannot be cancelled"
      });
    }

    return res.json({
      message: "Appointment cancelled",
      appointment
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Unable to cancel the appointment"
    });
  }
};

exports.rescheduleAppointment = async (req, res) => {
  const { id } = req.params;
  const { startAt } = req.body || {};

  if (
    !/^[a-fA-F0-9]{24}$/.test(id) ||
    typeof startAt !== "string" ||
    !/(Z|[+-]\d{2}:\d{2})$/.test(startAt)
  ) {
    return res.status(400).json({
      message: "Provide a valid appointment ID and time"
    });
  }

  const requestedStart = new Date(startAt);

  if (
    !Number.isFinite(requestedStart.getTime()) ||
    requestedStart <= new Date()
  ) {
    return res.status(400).json({
      message: "Choose a future appointment slot"
    });
  }

  try {
    const existing = await Appointment.findOne({
      _id: id,
      patientId: req.user._id,
      status: "booked",
      startAt: { $gt: new Date() }
    });

    if (!existing) {
      return res.status(409).json({
        message: "This appointment cannot be rescheduled"
      });
    }

    const doctor = await Doctor.findOne({
      _id: existing.doctorId,
      isActive: true
    });

    if (!doctor) {
      return res.status(409).json({
        message: "This doctor is currently unavailable"
      });
    }

    const slot = doctor.availability.find(
      (item) =>
        item.startAt.getTime() === requestedStart.getTime() &&
        item.endAt - item.startAt === 30 * 60 * 1000
    );

    if (!slot) {
      return res.status(400).json({
        message: "Choose a published appointment slot"
      });
    }

    if (slot.startAt.getTime() === existing.startAt.getTime()) {
      return res.status(400).json({
        message: "Choose a different appointment time"
      });
    }

    const appointment = await Appointment.findOneAndUpdate(
      {
        _id: existing._id,
        patientId: req.user._id,
        status: "booked",
        // Prevent overwriting another simultaneous reschedule.
        startAt: {
          $eq: existing.startAt,
          $gt: new Date()
        }
      },
      {
        $set: {
          startAt: slot.startAt,
          endAt: slot.endAt
        }
      },
      { new: true, runValidators: true }
    );

    if (!appointment) {
      return res.status(409).json({
        message: "The appointment changed. Refresh and try again."
      });
    }

    return res.json({
      message: "Appointment rescheduled successfully",
      appointment
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: "That slot was just booked. Choose another slot."
      });
    }

    console.error("Rescheduling error:", error);

    return res.status(500).json({
      message: "Unable to reschedule the appointment"
    });
  }
};

exports.getAdminAppointments = async (req, res) => {
  const { status = "" } = req.query;

  const allowedStatuses = ["booked", "cancelled", "completed"];

  if (
    typeof status !== "string" ||
    (status && !allowedStatuses.includes(status))
  ) {
    return res.status(400).json({
      message: "Invalid appointment status"
    });
  }

  try {
    const filter = status ? { status } : {};

    const appointments = await Appointment.find(filter)
      .populate("patientId", "name email phone")
      .populate("doctorId", "name specialization")
      .sort({ startAt: -1 });

    return res.json({ appointments });
  } catch (error) {
    console.error("Admin appointment listing error:", error);

    return res.status(500).json({
      message: "Unable to load appointments"
    });
  }
};

exports.completeAppointment = async (req, res) => {
  if (!/^[a-fA-F0-9]{24}$/.test(req.params.id)) {
    return res.status(400).json({
      message: "Invalid appointment ID"
    });
  }

  try {
    const appointment = await Appointment.findOneAndUpdate(
      {
        _id: req.params.id,
        status: "booked",
        endAt: { $lte: new Date() }
      },
      {
        $set: { status: "completed" }
      },
      {
        new: true,
        runValidators: true
      }
    );

    if (!appointment) {
      return res.status(409).json({
        message:
          "Only booked appointments whose end time has passed can be completed"
      });
    }

    return res.json({
      message: "Appointment marked as completed",
      appointment
    });
  } catch (error) {
    console.error("Complete appointment error:", error);

    return res.status(500).json({
      message: "Unable to complete the appointment"
    });
  }
};

exports.deleteCancelledAppointment = async (req, res) => {
  if (!/^[a-fA-F0-9]{24}$/.test(req.params.id)) {
    return res.status(400).json({
      message: "Invalid appointment ID"
    });
  }

  try {
    // Check the status and delete in one database operation.
    const appointment = await Appointment.findOneAndDelete({
      _id: req.params.id,
      status: "cancelled"
    });

    if (!appointment) {
      return res.status(409).json({
        message:
          "Only cancelled appointments can be deleted, or this record no longer exists"
      });
    }

    return res.json({
      message: "Cancelled appointment permanently deleted"
    });
  } catch (error) {
    console.error("Delete appointment error:", error);

    return res.status(500).json({
      message: "Unable to delete the appointment"
    });
  }
};
const Doctor = require("../models/Doctor");
const Appointment = require("../models/Appointment");

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function handleError(error, res) {
  if (error.name === "ValidationError") {
    return res.status(400).json({
      message: Object.values(error.errors)
        .map((item) => item.message)
        .join(", ")
    });
  }

  console.error("Doctor API error:", error);

  return res.status(500).json({
    message: "Unable to process the doctor request"
  });
}

// Only accept the fields supported by this stage.
function validateBody(body, partial = false) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new Error("Send a valid JSON object");
  }

  const allowed = [
    "name",
    "specialization",
    "qualifications",
    "consultationFee",
    "isActive"
  ];

  if (Object.keys(body).some((key) => !allowed.includes(key))) {
    throw new Error("The request contains unsupported fields");
  }

  if (!partial) {
    for (const field of [
      "name",
      "specialization",
      "consultationFee"
    ]) {
      if (body[field] === undefined) {
        throw new Error(`${field} is required`);
      }
    }
  }

  const data = {};

  for (const field of ["name", "specialization", "qualifications"]) {
    if (body[field] !== undefined) {
      if (typeof body[field] !== "string") {
        throw new Error(`${field} must be text`);
      }

      data[field] = body[field].trim();

      const maximum = field === "qualifications" ? 500 : 100;

      if (
        data[field].length > maximum ||
        (field !== "qualifications" && data[field].length < 2)
      ) {
        throw new Error(`Enter a valid ${field}`);
      }
    }
  }

  if (body.consultationFee !== undefined) {
    if (
      typeof body.consultationFee !== "number" ||
      !Number.isFinite(body.consultationFee) ||
      body.consultationFee < 0
    ) {
      throw new Error("Consultation fee must be a non-negative number");
    }

    data.consultationFee = body.consultationFee;
  }

  if (body.isActive !== undefined) {
    if (typeof body.isActive !== "boolean") {
      throw new Error("isActive must be true or false");
    }

    data.isActive = body.isActive;
  }

  if (Object.keys(data).length === 0) {
    throw new Error("Provide at least one field to update");
  }

  return data;
}

exports.getDoctors = async (req, res) => {
  try {
    const {
      search = "",
      specialization = "",
      sort = "name"
    } = req.query;

    if (
      typeof search !== "string" ||
      typeof specialization !== "string" ||
      typeof sort !== "string" ||
      search.length > 100 ||
      specialization.length > 100
    ) {
      return res.status(400).json({
        message: "Invalid search or filter"
      });
    }

    const sortOptions = {
      name: { name: 1, _id: 1 },
      feeAsc: { consultationFee: 1, _id: 1 },
      feeDesc: { consultationFee: -1, _id: 1 }
    };

    if (!Object.hasOwn(sortOptions, sort)) {
      return res.status(400).json({
        message: "Invalid sort option"
      });
    }

    const filter = { isActive: true };

    if (search.trim()) {
      filter.name = {
        $regex: escapeRegex(search.trim()),
        $options: "i"
      };
    }

    if (specialization.trim()) {
      filter.specialization = {
        $regex: `^${escapeRegex(specialization.trim())}$`,
        $options: "i"
      };
    }

    const doctors = await Doctor.find(filter)
      .sort(sortOptions[sort]);

    // Keep the dropdown independent of the current search.
    const specializations = await Doctor.distinct(
      "specialization",
      { isActive: true }
    );

    return res.json({
      doctors,
      specializations: specializations.sort()
    });
  } catch (error) {
    return handleError(error, res);
  }
};

exports.getDoctor = async (req, res) => {
  try {
    const doctor = await Doctor.findOne({
      _id: req.params.id,
      isActive: true
    });

    if (!doctor) {
      return res.status(404).json({
        message: "Doctor not found"
      });
    }

    return res.json({ doctor });
  } catch (error) {
    return handleError(error, res);
  }
};

exports.createDoctor = async (req, res) => {
  let data;

  try {
    data = validateBody(req.body);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }

  try {
    const doctor = await Doctor.create(data);

    return res.status(201).json({
      message: "Doctor added successfully",
      doctor
    });
  } catch (error) {
    return handleError(error, res);
  }
};

exports.updateDoctor = async (req, res) => {
  let data;

  try {
    data = validateBody(req.body, true);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }

  try {
    const doctor = await Doctor.findByIdAndUpdate(
      req.params.id,
      { $set: data },
      {
        new: true,
        runValidators: true
      }
    );

    if (!doctor) {
      return res.status(404).json({
        message: "Doctor not found"
      });
    }

    return res.json({
      message: "Doctor updated successfully",
      doctor
    });
  } catch (error) {
    return handleError(error, res);
  }
};

exports.deleteDoctor = async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id);

    if (!doctor) {
      return res.status(404).json({
        message: "Doctor not found"
      });
    }

    const hasAppointments = await Appointment.exists({
      doctorId: doctor._id
    });

    if (hasAppointments) {
      return res.status(409).json({
        message:
          "This doctor has appointments. Deactivate the doctor instead."
      });
    }

    await Doctor.deleteOne({ _id: doctor._id });

    return res.json({
      message: "Doctor deleted successfully"
    });
  } catch (error) {
    return handleError(error, res);
  }
};

exports.getAdminDoctors = async (req, res) => {
  try {
    const doctors = await Doctor.find().sort({ name: 1 });
    return res.json({ doctors });
  } catch (error) {
    return handleError(error, res);
  }
};

exports.addSlot = async (req, res) => {
  const value = req.body?.startAt;

  if (
    typeof value !== "string" ||
    !/(Z|[+-]\d{2}:\d{2})$/.test(value)
  ) {
    return res.status(400).json({
      message: "Provide a date and time with a timezone"
    });
  }

  const startAt = new Date(value);

  if (
    !Number.isFinite(startAt.getTime()) ||
    startAt <= new Date() ||
    startAt.getUTCSeconds() !== 0 ||
    startAt.getUTCMilliseconds() !== 0
  ) {
    return res.status(400).json({
      message: "Choose a future appointment time in whole minutes"
    });
  }

  const endAt = new Date(startAt.getTime() + 30 * 60 * 1000);

  try {
    // Atomically add only if there is no overlapping slot.
    const doctor = await Doctor.findOneAndUpdate(
      {
        _id: req.params.id,
        isActive: true,
        availability: {
          $not: {
            $elemMatch: {
              startAt: { $lt: endAt },
              endAt: { $gt: startAt }
            }
          }
        }
      },
      {
        $push: {
          availability: { startAt, endAt }
        }
      },
      { new: true, runValidators: true }
    );

    if (!doctor) {
      return res.status(409).json({
        message:
          "Doctor is unavailable, inactive, or this slot overlaps another slot"
      });
    }

    return res.status(201).json({
      message: "30-minute slot added",
      doctor
    });
  } catch (error) {
    return handleError(error, res);
  }
};

exports.getAvailableSlots = async (req, res) => {
  try {
    const doctor = await Doctor.findOne({
      _id: req.params.id,
      isActive: true
    });

    if (!doctor) {
      return res.status(404).json({
        message: "Doctor not found"
      });
    }

    const bookings = await Appointment.find({
      doctorId: doctor._id,
      status: "booked"
    }).select("startAt");

    const taken = new Set(
      bookings.map((booking) => booking.startAt.getTime())
    );

    const now = Date.now();

    const slots = doctor.availability
      .filter((slot) => {
        const duration = slot.endAt - slot.startAt;

        return (
          slot.startAt.getTime() > now &&
          duration === 30 * 60 * 1000 &&
          !taken.has(slot.startAt.getTime())
        );
      })
      .sort((a, b) => a.startAt - b.startAt);

    return res.json({ doctor, slots });
  } catch (error) {
    return handleError(error, res);
  }
};
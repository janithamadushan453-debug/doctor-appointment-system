const express = require("express");

const {
  createAppointment,
  getMyAppointments,
  cancelAppointment,
  rescheduleAppointment,
  getAdminAppointments,
  completeAppointment,
  deleteCancelledAppointment
} = require("../controllers/appointmentController");

const {
  protect,
  adminOnly
} = require("../middleware/authMiddleware");

const router = express.Router();

router.use(protect);

// Admin routes
router.get("/admin/all", adminOnly, getAdminAppointments);

router.patch(
  "/:id/complete",
  adminOnly,
  completeAppointment
);

router.delete(
  "/:id",
  adminOnly,
  deleteCancelledAppointment
);

// Patient routes
router.get("/my", getMyAppointments);
router.post("/", createAppointment);
router.patch("/:id/cancel", cancelAppointment);
router.patch("/:id/reschedule", rescheduleAppointment);

module.exports = router;
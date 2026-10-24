const express = require("express");

const {
  getDoctors,
  getDoctor,
  createDoctor,
  updateDoctor,
  deleteDoctor,
  getAdminDoctors,
  addSlot,
  getAvailableSlots
} = require("../controllers/doctorController");

const {
  protect,
  adminOnly
} = require("../middleware/authMiddleware");

const router = express.Router();

router.param("id", (req, res, next, id) => {
  if (!/^[a-fA-F0-9]{24}$/.test(id)) {
    return res.status(400).json({
      message: "Invalid doctor ID"
    });
  }

  return next();
});

// Put named routes before /:id.
router.get("/admin/all", protect, adminOnly, getAdminDoctors);

router.get("/", getDoctors);
router.get("/:id/slots", getAvailableSlots);
router.get("/:id", getDoctor);

router.post("/", protect, adminOnly, createDoctor);
router.post("/:id/slots", protect, adminOnly, addSlot);
router.patch("/:id", protect, adminOnly, updateDoctor);
router.delete("/:id", protect, adminOnly, deleteDoctor);

module.exports = router;
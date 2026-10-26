const express = require("express");

const {
  register,
  login,
  getMe,
  updateProfile,
  changePassword
} = require("../controllers/authController");

const {
  protect
} = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/register", register);
router.post("/login", login);

router.get("/me", protect, getMe);
router.patch("/profile", protect, updateProfile);
router.patch("/password", protect, changePassword);

module.exports = router;
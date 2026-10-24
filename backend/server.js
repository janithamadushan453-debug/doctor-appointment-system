require("dotenv").config();

const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const User = require("./models/User");
const Doctor = require("./models/Doctor");
const Appointment = require("./models/Appointment");
const authRoutes = require("./routes/authRoutes");
const doctorRoutes = require("./routes/doctorRoutes");
const appointmentRoutes = require("./routes/appointmentRoutes");

const app = express();

app.use(cors({
  origin: process.env.CLIENT_ORIGIN
}));

app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api/doctors", doctorRoutes);
app.use("/api/appointments", appointmentRoutes);

app.get("/api/health", (req, res) => {
  res.json({ message: "Doctor Appointment API is running" });
});

// Add application routes here as you build them.

app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: "Something went wrong" });
});

async function startServer() {
  try {
    if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET is missing from .env");
}
    await connectDB();

    // Ensure model collections and indexes are ready locally.
    await Promise.all([
      User.init(),
      Doctor.init(),
      Appointment.init()
    ]);

    const port = process.env.PORT || 5000;

    app.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });
  } catch (error) {
    console.error("Startup failed:", error.message);
    process.exit(1);
  }
}

startServer();
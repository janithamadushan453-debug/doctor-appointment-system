const mongoose = require("mongoose");

const doctorSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    specialization: {
      type: String,
      required: true,
      trim: true
    },
    qualifications: {
      type: String,
      trim: true
    },
    consultationFee: {
      type: Number,
      required: true,
      min: 0
    },
    availability: [
      {
        startAt: {
          type: Date,
          required: true
        },
        endAt: {
          type: Date,
          required: true
        }
      }
    ],
    isActive: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Doctor", doctorSchema);
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
    photoUrl: {
  type: String,
  default: "",
  maxlength: 2000
},
experienceYears: {
  type: Number,
  default: 0,
  min: 0,
  max: 80
},
languages: {
  type: String,
  default: "",
  maxlength: 200
},
clinicLocation: {
  type: String,
  default: "",
  maxlength: 300
},
bio: {
  type: String,
  default: "",
  maxlength: 2000
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
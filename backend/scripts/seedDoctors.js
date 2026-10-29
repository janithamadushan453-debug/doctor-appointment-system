const Doctor = require("../models/Doctor");

const sampleDoctors = [
  {
    name: "Dr. Nimal Perera",
    specialization: "Cardiology",
    qualifications: "MBBS, MD",
    experienceYears: 15,
    consultationFee: 2500,
    languages: "Sinhala, English",
    clinicLocation: "Demo Clinic, Colombo"
  },
  {
    name: "Dr. Amali Silva",
    specialization: "Dermatology",
    qualifications: "MBBS, MD",
    experienceYears: 8,
    consultationFee: 3000,
    languages: "Sinhala, English",
    clinicLocation: "Demo Clinic, Galle"
  },
  {
    name: "Dr. Kasun Fernando",
    specialization: "General Medicine",
    qualifications: "MBBS, MD",
    experienceYears: 10,
    consultationFee: 2000,
    languages: "Sinhala, English",
    clinicLocation: "Demo Clinic, Matara"
  },
  {
    name: "Dr. Kavitha Rajan",
    specialization: "Paediatrics",
    qualifications: "MBBS, MD",
    experienceYears: 12,
    consultationFee: 2500,
    languages: "Tamil, English",
    clinicLocation: "Demo Clinic, Jaffna"
  },
  {
    name: "Dr. Malini Jayawardena",
    specialization: "Gynaecology",
    qualifications: "MBBS, MD",
    experienceYears: 14,
    consultationFee: 3500,
    languages: "Sinhala, English",
    clinicLocation: "Demo Clinic, Kandy"
  },
  {
    name: "Dr. Arjun Kumar",
    specialization: "Orthopaedics",
    qualifications: "MBBS, MS",
    experienceYears: 11,
    consultationFee: 3000,
    languages: "Tamil, Sinhala, English",
    clinicLocation: "Demo Clinic, Kurunegala"
  }
];

async function seedDoctors() {
  // Only populate a completely empty doctor collection.
  const existingDoctor = await Doctor.exists({});

  if (existingDoctor) {
    console.log("Doctor data already exists. Sample setup skipped.");
    return;
  }

  await Doctor.insertMany(
    sampleDoctors.map((doctor) => ({
      ...doctor,
      photoUrl: "",
      bio:
        "Fictitious doctor profile for demonstrating this university project.",
      isActive: true,
      availability: []
    }))
  );

  console.log("Six sample doctors added successfully.");
}

module.exports = seedDoctors;
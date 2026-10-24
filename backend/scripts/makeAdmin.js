require("dotenv").config();

const mongoose = require("mongoose");
const User = require("../models/User");

async function main() {
  const email = process.argv[2]?.trim().toLowerCase();

  if (!email) {
    throw new Error(
      "Usage: node scripts/makeAdmin.js your-email@example.com"
    );
  }

  await mongoose.connect(process.env.MONGODB_URI);

  const user = await User.findOneAndUpdate(
    { email },
    { $set: { role: "admin" } },
    { new: true, runValidators: true }
  );

  if (!user) {
    throw new Error("Register this account first");
  }

  console.log(`Admin access granted to ${user.email}`);
}

main()
  .catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
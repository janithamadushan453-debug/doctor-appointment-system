const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

function publicUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role
  };
}

function createToken(user) {
  return jwt.sign(
    {
      sub: user._id.toString(),
      tokenVersion: user.tokenVersion ?? 0
    },
    process.env.JWT_SECRET,
    {
      algorithm: "HS256",
      expiresIn: "1h"
    }
  );
}

exports.register = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body || {};

    if (
      typeof name !== "string" ||
      typeof email !== "string" ||
      typeof password !== "string" ||
      typeof phone !== "string"
    ) {
      return res.status(400).json({
        message: "Name, email, password and phone are required"
      });
    }

    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = phone.trim();

    if (cleanName.length < 2 || cleanName.length > 100) {
      return res.status(400).json({
        message: "Name must contain 2 to 100 characters"
      });
    }

    if (
      cleanEmail.length > 254 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)
    ) {
      return res.status(400).json({
        message: "Enter a valid email address"
      });
    }

    if (
      password.length < 8 ||
      Buffer.byteLength(password, "utf8") > 72
    ) {
      return res.status(400).json({
        message: "Password must have at least 8 characters and at most 72 bytes"
      });
    }

    if (!/^\+?[0-9]{9,15}$/.test(cleanPhone)) {
      return res.status(400).json({
        message: "Enter a phone number with 9 to 15 digits, optionally starting with +"
      });
    }

    const existingUser = await User.findOne({
      email: cleanEmail
    });

    if (existingUser) {
      return res.status(409).json({
        message: "This email is already registered"
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await User.create({
      name: cleanName,
      email: cleanEmail,
      passwordHash,
      phone: cleanPhone,
      role: "patient"
    });

    return res.status(201).json({
      message: "Registration successful",
      token: createToken(user),
      user: publicUser(user)
    });
  } catch (error) {
    // Also handles simultaneous registrations with one email.
    if (error.code === 11000) {
      return res.status(409).json({
        message: "This email is already registered"
      });
    }

    console.error("Registration error:", error);

    return res.status(500).json({
      message: "Unable to register. Please try again."
    });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body || {};

    if (
      typeof email !== "string" ||
      typeof password !== "string" ||
      !email.trim() ||
      !password
    ) {
      return res.status(400).json({
        message: "Email and password are required"
      });
    }

    const user = await User.findOne({
      email: email.trim().toLowerCase()
    }).select("+passwordHash +tokenVersion");

    const passwordMatches =
      user && await bcrypt.compare(password, user.passwordHash);

    if (!passwordMatches) {
      return res.status(401).json({
        message: "Invalid email or password"
      });
    }

    return res.json({
      message: "Login successful",
      token: createToken(user),
      user: publicUser(user)
    });
  } catch (error) {
    console.error("Login error:", error);

    return res.status(500).json({
      message: "Unable to log in. Please try again."
    });
  }
};

exports.getMe = (req, res) => {
  return res.json({
    user: publicUser(req.user)
  });
};

exports.updateProfile = async (req, res) => {
  const { name, phone } = req.body || {};

  if (
    typeof name !== "string" ||
    typeof phone !== "string"
  ) {
    return res.status(400).json({
      message: "Name and phone number are required"
    });
  }

  const cleanName = name.trim();
  const cleanPhone = phone.trim();

  if (cleanName.length < 2 || cleanName.length > 100) {
    return res.status(400).json({
      message: "Name must contain 2 to 100 characters"
    });
  }

  if (!/^\+?[0-9]{9,15}$/.test(cleanPhone)) {
    return res.status(400).json({
      message:
        "Enter 9 to 15 phone digits, optionally starting with +"
    });
  }

  try {
    // Explicitly update only these two fields.
    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        $set: {
          name: cleanName,
          phone: cleanPhone
        }
      },
      {
        new: true,
        runValidators: true
      }
    );

    if (!user) {
      return res.status(404).json({
        message: "Account not found"
      });
    }

    return res.json({
      message: "Profile updated successfully",
      user: publicUser(user)
    });
  } catch (error) {
    console.error("Update profile error:", error);

    return res.status(500).json({
      message: "Unable to update your profile"
    });
  }
};

exports.changePassword = async (req, res) => {
  const {
    currentPassword,
    newPassword
  } = req.body || {};

  if (
    typeof currentPassword !== "string" ||
    typeof newPassword !== "string" ||
    !currentPassword
  ) {
    return res.status(400).json({
      message: "Current password and new password are required"
    });
  }

  if (
    newPassword.length < 8 ||
    Buffer.byteLength(newPassword, "utf8") > 72
  ) {
    return res.status(400).json({
      message:
        "New password must have at least 8 characters and at most 72 bytes"
    });
  }

  try {
    const user = await User.findById(req.user._id)
      .select("+passwordHash");

    if (!user) {
      return res.status(404).json({
        message: "Account not found"
      });
    }

    const matches = await bcrypt.compare(
      currentPassword,
      user.passwordHash
    );

    if (!matches) {
      return res.status(400).json({
        message: "Current password is incorrect"
      });
    }

    const samePassword = await bcrypt.compare(
      newPassword,
      user.passwordHash
    );

    if (samePassword) {
      return res.status(400).json({
        message: "Choose a different new password"
      });
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);

    // Prevent two simultaneous changes from overwriting each other.
    const result = await User.updateOne(
      {
        _id: user._id,
        passwordHash: user.passwordHash
      },
      {
        $set: { passwordHash },
        $inc: { tokenVersion: 1 }
      },
      { runValidators: true }
    );

    if (result.modifiedCount !== 1) {
      return res.status(409).json({
        message: "Your account changed. Log in again and retry."
      });
    }

    return res.json({
      message: "Password changed successfully. Please log in again."
    });
  } catch (error) {
    console.error("Change password error:", error);

    return res.status(500).json({
      message: "Unable to change your password"
    });
  }
};
const jwt = require("jsonwebtoken");
const User = require("../models/User");

exports.protect = async (req, res, next) => {
  const authorization = req.headers.authorization || "";
  const parts = authorization.split(" ");

  if (
    parts.length !== 2 ||
    parts[0] !== "Bearer" ||
    !parts[1]
  ) {
    return res.status(401).json({
      message: "Please log in to continue"
    });
  }

  let payload;

  try {
    payload = jwt.verify(
      parts[1],
      process.env.JWT_SECRET,
      { algorithms: ["HS256"] }
    );
  } catch {
    return res.status(401).json({
      message: "Invalid or expired token. Please log in again."
    });
  }

  if (
    typeof payload !== "object" ||
    typeof payload.sub !== "string" ||
    !/^[a-fA-F0-9]{24}$/.test(payload.sub)
  ) {
    return res.status(401).json({
      message: "Invalid authentication token"
    });
  }

  try {
    const user = await User.findById(payload.sub)
  .select("+tokenVersion");
    if (!user) {
      return res.status(401).json({
        message: "Account no longer exists"
      });
    }

    if (
  !Number.isInteger(payload.tokenVersion) ||
  payload.tokenVersion !== (user.tokenVersion ?? 0)
) {
  return res.status(401).json({
    message: "Your session has expired. Please log in again."
  });
}

    req.user = user;
    return next();
  } catch (error) {
    console.error("Authentication error:", error);

    return res.status(500).json({
      message: "Unable to verify your account"
    });
  }
};

exports.adminOnly = (req, res, next) => {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({
      message: "Admin access required"
    });
  }

  return next();
};
const jwt = require("jsonwebtoken");
const CustomError = require("../errors");
const User = require("../models/User");

const authentication = async (req, _, next) => {
  let token;
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new CustomError.UnauthenticatedError(
      "Authentication Invalid, missing header"
    );
  }

  try {
    // Get token from auth header
    token = authHeader.split(" ")[1];
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // Get user from token
    req.user = await User.findById(decoded.id).select("-password");

    next();
  } catch (error) {
    throw new CustomError.UnauthenticatedError(
      "Authentication Invalid, token failed"
    );
  }

  if (!token) {
    throw new CustomError.UnauthenticatedError(
      "Authentication Invalid, no token"
    );
  }
};

const authorization = async (req, _, next) => {
  if (req.user && req.user.isAdmin) {
    next();
  } else {
    throw new CustomError.UnauthorizedError("Not authorized as an admin");
  }
};

module.exports = { authentication, authorization };

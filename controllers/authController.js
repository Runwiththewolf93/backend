const User = require("../models/User");
const { StatusCodes } = require("http-status-codes");
const CustomError = require("../errors");

const register = async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    throw new CustomError.BadRequestError("Please provide all values");
  }

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new CustomError.BadRequestError("Email already exists");
  }

  const user = await User.create({ name, email, password });

  const token = user.createJWT();

  res.status(StatusCodes.CREATED).json({
    _id: user._id,
    name: user.name,
    email: user.email,
    token,
  });
};

const login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    throw new CustomError.BadRequestError("Please provide all values");
  }

  const user = await User.findOne({ email });
  if (!user) {
    throw new CustomError.UnauthenticatedError("Invalid credentials");
  }

  const isPasswordCorrect = await user.comparePassword(password);
  if (!isPasswordCorrect) {
    throw new CustomError.UnauthenticatedError("Invalid credentials");
  }

  const token = user.createJWT();

  res.status(StatusCodes.OK).json({
    _id: user._id,
    name: user.name,
    email: user.email,
    token,
  });
};

module.exports = { register, login };

// open john smilga react project, mern jobify, e-commerce starter-cookies, e-commerce brad traversy

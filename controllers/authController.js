const User = require("../models/User");
const { StatusCodes } = require("http-status-codes");
const CustomError = require("../errors");

// @desc Register a new user
// @route POST /api/v1/auth/register
// @access Public
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
    isAdmin: user.isAdmin,
    token,
  });
};

// @desc Login an existing user
// @route POST /api/v1/auth/login
// @access Public
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
    isAdmin: user.isAdmin,
    token,
  });
};

// @desc Get all users
// @route GET /api/v1/users
// access Private
const getAllUsers = async (_, res) => {
  const users = await User.find({});
  res.status(StatusCodes.OK).json(users);
};

// @desc Update a user
// @route PUT /api/v1/auth/update/:userId
// @access Private / Admin
const updateUser = async (req, res) => {
  const { name, email, isAdmin } = req.body;
  const { userId } = req.params;

  const user = await User.findById(userId);
  if (!user) {
    throw new CustomError.NotFoundError("User not found");
  }

  user.name = name || user.name;
  user.email = email || user.email;
  user.isAdmin = isAdmin !== undefined ? isAdmin : user.isAdmin;

  await user.save();

  res.status(StatusCodes.OK).json({
    _id: user._id,
    name: user.name,
    email: user.email,
    isAdmin: user.isAdmin,
  });
};

// @desc Delete a user
// @route DELETE /api/v1/auth/delete/:userId
// @access Private / Admin
const deleteUser = async (req, res) => {
  const { userId } = req.params;

  const user = await User.findById(userId);
  if (!user) {
    throw new CustomError.NotFoundError("User not found");
  }

  await user.deleteOne();

  res.status(StatusCodes.OK).json({ msg: "User deleted successfully" });
};

// @desc Update a user's password
// @route PATCH /api/v1/auth/updateUserPassword
// @access Private
const updateUserPassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    throw new CustomError.BadRequestError("Please provide all values");
  }

  const user = await User.findById(req.user._id);
  if (!user) {
    throw new CustomError.NotFoundError("User not found");
  }

  const isPasswordCorrect = await user.comparePassword(currentPassword);
  if (!isPasswordCorrect) {
    throw new CustomError.UnauthenticatedError("Invalid current password");
  }

  if (currentPassword === newPassword) {
    throw new CustomError.BadRequestError(
      "Current password and new password are the same"
    );
  }

  user.password = newPassword;
  await user.save();

  res.status(StatusCodes.OK).json({ msg: "Password updated successfully" });
};

module.exports = {
  register,
  login,
  getAllUsers,
  updateUser,
  deleteUser,
  updateUserPassword,
};

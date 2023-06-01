const User = require("../models/User");
const { StatusCodes } = require("http-status-codes");
const CustomError = require("../errors");
const Joi = require("joi");
const crypto = require("crypto");
const sgMail = require("@sendgrid/mail");
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// @desc Register a new user
// @route POST /api/v1/auth/register
// @access Public
const register = async (req, res) => {
  const registerSchema = Joi.object({
    name: Joi.string().required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
  });

  const { error, value } = registerSchema.validate(req.body);

  if (error) {
    throw new CustomError.BadRequestError(error.details[0].message);
  }

  const { name, email, password } = value;

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
  const loginSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
  });

  const { error, value } = loginSchema.validate(req.body);

  if (error) {
    throw new CustomError.BadRequestError(error.details[0].message);
  }

  const { email, password } = value;

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
  const { userId } = req.params;

  const user = await User.findById(userId);
  if (!user) {
    throw new CustomError.NotFoundError("User not found");
  }

  const updateSchema = Joi.object({
    name: Joi.string(),
    email: Joi.string().email(),
    isAdmin: Joi.boolean(),
  });

  const { error, value } = updateSchema.validate(req.body);
  if (error) {
    throw new CustomError.BadRequestError(error.details[0].message);
  }

  const { name, email, isAdmin } = value;

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
  const paramsSchema = Joi.object({
    userId: Joi.string().required(),
  });

  const { error, value } = paramsSchema.validate(req.params);
  if (error) {
    throw new CustomError.BadRequestError(error.details[0].message);
  }

  const { userId } = value;

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
  const bodySchema = Joi.object({
    currentPassword: Joi.string().min(6).required(),
    newPassword: Joi.string().min(6).required(),
  });

  const { error, value } = bodySchema.validate(req.body);
  if (error) {
    throw new CustomError.BadRequestError(error.details[0].message);
  }

  const { currentPassword, newPassword } = value;

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

// @desc Generate and store password reset token, send email
// @route POST /api/v1/auth/forgotPassword
// @access Public
const forgotPassword = async (req, res) => {
  const schema = Joi.object({
    email: Joi.string().email().required(),
  });

  const { error, value } = schema.validate(req.body);
  if (error) {
    throw new CustomError.BadRequestError(error.details[0].message);
  }

  const { email } = value;

  const user = await User.findOne({ email });
  if (!user) {
    throw new CustomError.NotFoundError("User not found");
  }

  // Generate and set password reset token
  user.resetPasswordToken = crypto.randomBytes(20).toString("hex");
  user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

  await user.save();

  // Send email
  const msg = {
    to: email,
    from: "stevan38a@gmail.com",
    subject: "Password Reset",
    text: `You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n
    Please click on the following link, or paste this into your browser to complete the process within one hour of receiving it:\n\n
    http://localhost:3000/reset-password/${user.resetPasswordToken}\n\n
    If you did not request this, please ignore this email and your password will remain unchanged.\n`,
  };

  try {
    await sgMail.send(msg);
    res.send(`An email has been sent to ${email} with further instructions.`);
  } catch (error) {
    res.send(error);
    if (error.response) {
      console.error(error.response.body);
    }
  }
};

// @desc Reset user password, invalidate token, send email
// @route POST /api/v1/auth/resetPassword/:token
// @access Private
const resetPassword = async (req, res) => {
  const { token } = req.params;

  const schema = Joi.object({
    password: Joi.string().min(6).required(),
  });

  const { error, value } = schema.validate(req.body);
  if (error) {
    throw new CustomError.BadRequestError(error.details[0].message);
  }

  const { password } = value;

  const user = await User.findOne({
    resetPasswordToken: token,
    resetPasswordExpires: { $gt: Date.now() },
  });

  if (!user) {
    throw new CustomError.NotFoundError("User not found");
  }

  // Set the new password
  user.password = password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;

  await user.save();

  // Send confirmation email
  const msg = {
    to: user.email,
    from: "stevan38a@gmail.com",
    subject: "Your password has been changed",
    text: `Hello ${user.name},\n\n
    This is a confirmation that the password for your account ${user.email} has just been changed.\n`,
  };

  try {
    await sgMail.send(msg);
    res.send("Success! Your password has been changed.");
  } catch (error) {
    res.send(error);
    if (error.response) {
      console.error(error.response.body);
    }
  }
};

module.exports = {
  register,
  login,
  getAllUsers,
  updateUser,
  deleteUser,
  updateUserPassword,
  forgotPassword,
  resetPassword,
};

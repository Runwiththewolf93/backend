const Blog = require("../models/Blog");
const { StatusCodes } = require("http-status-codes");
const CustomError = require("../errors");
const Joi = require("joi");

const getAllBlogPosts = async (req, res) => {
  const blogPosts = await Blog.find({})
    .populate("user", "name email")
    .sort("createdAt");

  res.status(StatusCodes.OK).json(blogPosts);
};

const createBlogPost = async (req, res) => {
  const schema = Joi.object({
    title: Joi.string().required().max(100),
    avatar: Joi.string().required(),
    content: Joi.string().required().max(1000),
    images: Joi.array().items(Joi.string().required()).length(3).required(),
  });
  const { error, value } = schema.validate(req.body);

  if (error) {
    throw new CustomError.BadRequestError(error.details[0].message);
  }

  const { title, avatar, content, images } = value;
  const user = req.user.userId;

  const blogPost = await Blog.create({ title, avatar, content, images, user });

  res.status(StatusCodes.CREATED).json(blogPost);
};

const getSingleBlogPost = async (req, res) => {
  const { id } = req.params;

  const blogPost = await Blog.findById(id);
  if (!blogPost) {
    throw new CustomError.NotFoundError(`No blog post with id : ${id}`);
  }

  res.status(StatusCodes.OK).json(blogPost);
};

const updateBlogPost = async (req, res) => {
  const { id } = req.params;

  const updateSchema = Joi.object({
    title: Joi.string().max(100),
    avatar: Joi.string(),
    content: Joi.string().max(1000),
    images: Joi.array().items(Joi.string()).length(3),
  });

  const { error, value } = updateSchema.validate(req.body);
  if (error) {
    throw new CustomError.BadRequestError(error.details[0].message);
  }

  const updatedBlogPost = await Blog.findByIdAndUpdate(
    { _id: id },
    { $set: value },
    {
      new: true,
      runValidators: true,
    }
  ).populate("user", "name email");

  if (!updatedBlogPost) {
    throw new CustomError.NotFoundError(`No product with id : ${id}`);
  }

  res.status(StatusCodes.OK).json(updatedBlogPost);
};

const deleteBlogPost = async (req, res) => {
  const { id } = req.params;

  const deletedBlogPost = await Blog.findByIdAndDelete({ _id: id });

  if (!deletedBlogPost) {
    throw new CustomError.NotFoundError(`No blog post with id : ${id}`);
  }

  res.status(StatusCodes.OK).json({
    message: `Blog post with id ${id} has been deleted successfully.`,
  });
};

module.exports = {
  getAllBlogPosts,
  createBlogPost,
  getSingleBlogPost,
  updateBlogPost,
  deleteBlogPost,
};

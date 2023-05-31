const Blog = require("../models/Blog");
const { StatusCodes } = require("http-status-codes");
const CustomError = require("../errors");
const Joi = require("joi");

// @desc Fetch all blog posts
// @route GET /api/v1/blog
// @access Private
const getAllBlogPosts = async (req, res) => {
  const blogPosts = await Blog.find({})
    .populate("user", "name email")
    .sort("createdAt");

  res.status(StatusCodes.OK).json(blogPosts);
};

// @desc Create new blog post
// @route POST /api/v1/blog
// @access Private
const createBlogPost = async (req, res) => {
  const createSchema = Joi.object({
    title: Joi.string().required(),
    content: Joi.string().required(),
    avatar: Joi.string(),
    images: Joi.array().items(Joi.string()).length(3),
  });

  const { error, value } = createSchema.validate(req.body);
  if (error) {
    throw new CustomError.BadRequestError(error.details[0].message);
  }

  const { title, content, avatar: avatarUrl, images: imagesUrl } = value;
  const user = req.user.id;

  if (!title || !content) {
    throw new CustomError.BadRequestError("Please provide all values");
  }

  const avatar =
    req.files && req.files["avatar"] && req.files["avatar"][0]
      ? req.files["avatar"][0].path
      : avatarUrl;

  let images =
    req.files && req.files["images"]
      ? req.files["images"].map(image => image.path)
      : imagesUrl;

  const blogPost = await Blog.create({ title, avatar, content, images, user });

  res.status(StatusCodes.CREATED).json(blogPost);
};

// @desc Get single blog post
// @route GET /api/v1/blog/:id
// @access Public
const getSingleBlogPost = async (req, res) => {
  const { id } = req.params;

  const blogPost = await Blog.findById(id).populate("user", "name email");

  if (!blogPost) {
    throw new CustomError.NotFoundError(`No blog post with id : ${id}`);
  }

  res.status(StatusCodes.OK).json(blogPost);
};

// @desc Update existing blog post
// @route PATCH /api/v1/blog/:id
// @access Private
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

  const blogPost = await Blog.findById(id).populate("user", "name email");

  if (!blogPost) {
    throw new CustomError.NotFoundError(`No product with id : ${id}`);
  }

  if (req.user.id !== blogPost.user.id) {
    throw new CustomError.UnauthorizedError(
      "You are not authorized to modify this blog post"
    );
  }

  const updatedBlogPost = await Blog.findByIdAndUpdate(
    { _id: id },
    { $set: value },
    {
      new: true,
      runValidators: true,
    }
  ).populate("user", "name email");

  res.status(StatusCodes.OK).json(updatedBlogPost);
};

// @desc Delete existing blog post
// @route DELETE /api/v1/blog/:id
// @access Private
const deleteBlogPost = async (req, res) => {
  const { id } = req.params;

  const blogPost = await Blog.findById(id);

  if (!blogPost) {
    throw new CustomError.NotFoundError(`No blog post with id : ${id}`);
  }

  if (req.user.id !== blogPost.user.toString()) {
    throw new CustomError.UnauthorizedError(
      "You are not authorized to delete this blog post"
    );
  }

  await Blog.findByIdAndDelete({ _id: id });

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

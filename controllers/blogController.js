const Blog = require("../models/Blog");
const { StatusCodes } = require("http-status-codes");
const CustomError = require("../errors");
const Joi = require("joi");
const deleteImagesFromCloudinary = require("../helper/helper");
const mongoose = require("mongoose");

// @desc Fetch all blog posts
// @route GET /api/v1/blog
// @access Private
const getAllBlogPosts = async (req, res) => {
  const blogPosts = await Blog.find()
    .populate("user", "name email")
    .sort("createdAt");

  if (blogPosts.length === 0) {
    throw new CustomError.NotFoundError("No blog posts found");
  }

  res.status(StatusCodes.OK).json(blogPosts);
};

// @desc Fetch filtered blog posts
// @route POST /api/v1/blog/filtered
// @access Private
const getFilteredBlogPosts = async (req, res) => {
  const schema = Joi.object({
    blogIds: Joi.array().items(Joi.string().length(24).hex()),
    page: Joi.number().integer().min(1).required(),
    limit: Joi.number().integer().min(1).max(5).required(),
    sort: Joi.string().valid("createdAt", "updatedAt", "totalVotes").required(),
    order: Joi.string().valid("asc", "desc").required(),
  });

  const { error, value } = schema.validate(req.body);

  if (error) {
    throw new CustomError.BadRequestError(error.details[0].message);
  }

  const { blogIds, page, limit, sort, order } = value;

  const sortOrder = order === "desc" ? -1 : 1;

  // Exclude the IDs of the blog posts that have already been loaded
  const excludedIds = blogIds ? [...blogIds] : [];

  // Fetch the blog posts with the remaining IDs, limiting the number of blog posts to 'limit'
  const blogPosts = await Blog.find({ _id: { $nin: excludedIds } })
    .populate("user", "name email")
    .sort({ [sort]: sortOrder })
    .limit(limit);

  const totalPosts = await Blog.countDocuments();
  const hasMore = (page - 1) * limit + blogPosts.length < totalPosts;
  console.log(blogPosts.map(b => b._id));

  res.status(StatusCodes.OK).json({ posts: blogPosts, hasMore });
};

// @desc Create new blog post
// @route POST /api/v1/blog
// @access Private
const createBlogPost = async (req, res) => {
  const createSchema = Joi.object({
    title: Joi.string().required(),
    avatar: Joi.string(),
    content: Joi.string().required(),
    images: Joi.array().items(Joi.string()).length(3),
  });

  const { error, value } = createSchema.validate(req.body);
  if (error) {
    throw new CustomError.BadRequestError(error.details[0].message);
  }

  const { title, avatar, content, images } = value;
  const user = req.user;

  const blogPost = await Blog.create({ user, title, avatar, content, images });

  res.status(StatusCodes.CREATED).json(blogPost);
};

// @desc Upload blog post images
// @route POST /api/v1/blog/images
// @access Private
const uploadBlogImages = async (req, res) => {
  // Using multer middleware
  const avatar =
    req.files && req.files["avatar"] ? req.files["avatar"][0].path : null;
  const images =
    req.files && req.files["images"]
      ? req.files["images"].map(image => image.path)
      : null;

  res
    .status(StatusCodes.OK)
    .json({ message: "Images uploaded successfully.", avatar, images });
};

// @desc Get single blog post
// @route GET /api/v1/blog/:id
// @access Public
const getSingleBlogPost = async (req, res) => {
  const { error, value } = Joi.object({
    id: Joi.string().length(24).hex().required(),
  }).validate(req.params);

  if (error) {
    throw new CustomError.BadRequestError(error.details[0].message);
  }

  const { id } = value;

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

  // Replace images in Cloudinary
  const oldImages = [...blogPost.images, blogPost.avatar];
  await deleteImagesFromCloudinary(oldImages);

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
// ask how this exactly works.

// @desc Delete existing blog post
// @route DELETE /api/v1/blog/:id
// @access Private
const deleteBlogPost = async (req, res) => {
  const { error, value } = Joi.object({
    id: Joi.string().length(24).hex().required(),
  }).validate(req.params);

  if (error) {
    throw new CustomError.BadRequestError(error.details[0].message);
  }

  const { id } = value;

  const blogPost = await Blog.findById(id);

  if (!blogPost) {
    throw new CustomError.NotFoundError(`No blog post with id : ${id}`);
  }

  if (req.user.id !== blogPost.user.toString()) {
    throw new CustomError.UnauthorizedError(
      "You are not authorized to delete this blog post"
    );
  }

  // Delete images from Cloudinary
  const oldImages = [...blogPost.images, blogPost.avatar];
  await deleteImagesFromCloudinary(oldImages);

  await Blog.findByIdAndDelete({ _id: id });

  res.status(StatusCodes.OK).json({
    message: `Blog post with id ${id} has been deleted successfully.`,
  });
};

module.exports = {
  getAllBlogPosts,
  getFilteredBlogPosts,
  getSingleBlogPost,
  createBlogPost,
  uploadBlogImages,
  updateBlogPost,
  deleteBlogPost,
};

const Blog = require("../models/Blog");
const { StatusCodes } = require("http-status-codes");
const CustomError = require("../errors");
const Joi = require("joi");
const deleteImagesFromCloudinary = require("../helper/helper");

// @desc Fetch all blog posts
// @route GET /api/v1/blog
// @access Private
const getAllBlogPosts = async (req, res) => {
  const blogPosts = await Blog.find()
    .populate("user", "name email")
    .sort("createdAt");

  if (!blogPosts) {
    throw new CustomError.NotFoundError("No blog posts found");
  }

  res.status(StatusCodes.OK).json(blogPosts);
};

// @desc Fetch filtered blog posts
// @route GET /api/v1/blog/filtered
// @access Private
const getFilteredBlogPosts = async (req, res) => {
  const sort = req.query.sort || "createdAt";
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 5;
  const skip = (page - 1) * limit;
  const order = req.query.order || "asc"; // change to desc later

  const sortOrder = order === "desc" ? -1 : 1;

  const blogPosts = await Blog.aggregate([
    {
      $lookup: {
        from: "users",
        let: { userId: "$user" },
        pipeline: [
          { $match: { $expr: { $eq: ["$_id", "$$userId"] } } },
          { $project: { name: 1, email: 1 } },
        ],
        as: "user",
      },
    },
    {
      $unwind: "$user",
    },
    {
      $addFields: {
        totalVotes: { $ifNull: ["$totalVotes", 0] },
      },
    },
    {
      $sort: { [sort]: sortOrder },
    },
    {
      $skip: skip,
    },
    {
      $limit: limit,
    },
  ]);

  const totalPosts = await Blog.countDocuments();
  const hasMore = skip + limit < totalPosts;
  console.log(blogPosts);

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

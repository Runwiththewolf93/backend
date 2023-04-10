const Blog = require("../models/Blog");
const { StatusCodes } = require("http-status-codes");
const CustomError = require("../errors");

const getAllBlogPosts = async (req, res) => {
  const blogPosts = await Blog.find({})
    .populate("user", "name email")
    .sort("createdAt");

  res.status(StatusCodes.OK).json(blogPosts);
};

module.exports = { getAllBlogPosts };

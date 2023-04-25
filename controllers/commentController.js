const Comment = require("../models/Comment");
const { StatusCodes } = require("http-status-codes");
const CustomError = require("../errors");

// @desc Get all comments for a single blog post
// @route GET /api/v1/comment/blogId/:blogId
// @access Private
const getAllCommentsBlogPost = async (req, res) => {
  const { blogId } = req;

  const comments = await Comment.find({ blog: blogId }).populate(
    "user",
    "name email"
  );
  if (!comments) {
    throw new CustomError.NotFoundError(
      `No comments found for blog post with id : ${blogId}`
    );
  }

  res.status(StatusCodes.OK).json(comments);
};

// @desc Get all comments for logged-in user
// @route GET /api/v1/comment/user
// @access Private
const getAllCommentsUser = async (req, res) => {
  const { user } = req;

  const comments = await Comment.find({ user: user._id }).populate(
    "blog",
    "title"
  );
  if (!comments) {
    throw new CustomError.NotFoundError(
      `No comments found for user with id : ${user._id}`
    );
  }

  res.status(StatusCodes.OK).json(comments);
};

// @desc Create a comment for a single blog post
// @route POST /api/v1/comment/blogId/:blogId
// @access Private
const createCommentBlogPost = async (req, res) => {
  const { blogId } = req;
  const { comment } = req.body;
  const userId = req.user._id;

  const newComment = await Comment.create({
    comment,
    user: userId,
    blog: blogId,
  });
  if (!newComment) {
    throw new CustomError.BadRequestError(
      `Comment could not be created for blog post with id : ${blogId}`
    );
  }

  res.status(StatusCodes.CREATED).json(newComment);
};

// @desc Update a comment for a single blog post
// @route PUT /api/v1/comment/blogId/:blogId/commentId/:commentId
// @access Private
const updateCommentBlogPost = async (req, res) => {
  const { blogId, commentId } = req;
  const { comment } = req.body;
  const userId = req.user._id;

  const updatedComment = await Comment.findOneAndUpdate(
    { _id: commentId, blog: blogId, user: userId },
    { comment },
    { new: true }
  );

  if (!updatedComment) {
    throw new CustomError.NotFoundError(
      `Comment with id : ${commentId} not found for blog post with id : ${blogId}`
    );
  }

  res.status(StatusCodes.OK).json(updatedComment);
};

// @desc Delete a comment for a single blog post
// @route DELETE /api/v1/comment/blogId/:blogId/commentId/:commentId
// @access Private
const deleteCommentBlogPost = async (req, res) => {
  const { blogId, commentId } = req;
  const userId = req.user._id;

  const deletedComment = await Comment.findOneAndDelete({
    _id: commentId,
    blog: blogId,
    user: userId,
  });

  if (!deletedComment) {
    throw new CustomError.NotFoundError(
      `Comment with id : ${commentId} not found for blog post with id : ${blogId}`
    );
  }

  res.status(StatusCodes.OK).json(deletedComment);
};

module.exports = {
  getAllCommentsBlogPost,
  getAllCommentsUser,
  createCommentBlogPost,
  updateCommentBlogPost,
  deleteCommentBlogPost,
};

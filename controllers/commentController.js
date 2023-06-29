const Comment = require("../models/Comment");
const { StatusCodes } = require("http-status-codes");
const CustomError = require("../errors");
const Joi = require("joi");
const mongoose = require("mongoose");

// @desc Get all comments for a single blog post
// @route GET /api/v1/comment/blogId/:blogId
// @access Private
const getAllCommentsBlogPost = async (req, res) => {
  const paramsSchema = Joi.object({
    blogId: Joi.string().required(),
  });

  const { error, value } = paramsSchema.validate(req.params);
  if (error) {
    throw new CustomError.BadRequestError(error.details[0].message);
  }

  const { blogId } = value;

  const comments = await Comment.find({ blog: blogId }).populate(
    "user",
    "name email"
  );

  if (comments.length === 0) {
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
  const schema = Joi.object({
    user: Joi.object().required(),
  });

  const { error, value } = schema.validate(req, { allowUnknown: true });
  if (error) {
    throw new CustomError.BadRequestError(error.details[0].message);
  }

  const { user } = value;

  const comments = await Comment.find({ user: user._id }).populate(
    "blog",
    "title"
  );

  if (comments.length === 0) {
    throw new CustomError.NotFoundError(
      `No comments found for user with id : ${user._id}`
    );
  }

  res.status(StatusCodes.OK).json(comments);
};

// @desc Get all comments for all blog posts
// @route GET /api/v1/comment/
// @access Private
const getAllComments = async (_, res) => {
  const comments = await Comment.find()
    .populate("user", "name email")
    .sort("createdAt");

  if (comments.length === 0) {
    throw new CustomError.NotFoundError("No comments found");
  }

  res.status(StatusCodes.OK).json(comments);
};

// @desc Create a comment for a single blog post
// @route POST /api/v1/comment/blogId/:blogId
// @access Private
const createCommentBlogPost = async (req, res) => {
  const schema = Joi.object({
    comment: Joi.string().required(),
  });

  const { error, value } = schema.validate(req.body);
  if (error) {
    throw new CustomError.BadRequestError(error.details[0].message);
  }

  const { comment } = value;
  const { blogId } = req;
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
  const schema = Joi.object({
    editedComment: Joi.string().required(),
  });

  const { error, value } = schema.validate(req.body);
  if (error) {
    throw new CustomError.BadRequestError(error.details[0].message);
  }

  const { editedComment } = value;
  const { blogId, commentId } = req;
  const userId = req.user._id;

  const updatedComment = await Comment.findOneAndUpdate(
    { _id: commentId, blog: blogId, user: userId },
    { comment: editedComment },
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

// @desc Delete all comments for a single blog post
// @route DELETE /api/v1/comment/blogId/:blogId
// @access Private
const deleteAllCommentsBlogPost = async (req, res) => {
  const { blogId } = req;

  const deletedComments = await Comment.deleteMany({
    blog: blogId,
  });

  // Instead of throwing an error, we return a message
  if (deletedComments.deletedCount === 0) {
    return res
      .status(StatusCodes.OK)
      .json({ msg: `No comments found for blog post with id : ${blogId}` });
  }

  res.status(StatusCodes.OK).json(deletedComments);
};

// @desc Fetch comments for filtered blog posts
// @route POST /api/v1/comment/filter
// @access Private
const getFilteredComments = async (req, res) => {
  const schema = Joi.object({
    blogIds: Joi.array().items(Joi.string().length(24).hex()).required(),
  });

  const { error, value } = schema.validate(req.body);

  if (error) {
    throw new CustomError.BadRequestError(error.details[0].message);
  }

  const { blogIds } = value;

  const comments = await Comment.find({
    blog: { $in: blogIds },
  }).populate("user", "name email");

  // Count comments per blog post
  const commentCounts = {};

  // Filter comments to limit to 5 per blog post
  const limitedComments = comments.filter(comment => {
    const blogId = comment.blog.toString();
    if (!commentCounts[blogId]) {
      commentCounts[blogId] = 0;
    }
    if (commentCounts[blogId] < 5) {
      commentCounts[blogId]++;
      return true;
    }
    return false;
  });

  res.status(StatusCodes.OK).json(limitedComments || []);
};

// @desc Fetch additional comments for a blog post
// @route POST /api/v1/comment/more
// @access Private
const getMoreComments = async (req, res) => {
  const schema = Joi.object({
    blogId: Joi.string().length(24).hex().required(),
    commentIds: Joi.array().items(Joi.string().length(24).hex()).required(),
    limit: Joi.number().integer().min(1).max(5).required(),
    sort: Joi.string().valid("createdAt", "updatedAt", "totalVotes").required(),
    order: Joi.string().valid("asc", "desc").required(),
  });

  const { error, value } = schema.validate(req.body);

  if (error) {
    throw new CustomError.BadRequestError(error.details[0].message);
  }

  const { blogId, commentIds, limit, sort, order } = value;

  const sortOrder = order === "desc" ? -1 : 1;

  console.log(`limit: ${limit}, sort: ${sort}, order: ${order}`);

  // Exclude the IDs of the comments that have already been loaded
  const excludedIds = [...commentIds];
  console.log("excludedIds", excludedIds);

  // Fetch the comments with the remaining IDs, limiting the number of comments to `limit`
  const comments = await Comment.find({
    blog: blogId,
    _id: { $nin: excludedIds },
  })
    .sort({ [sort]: sortOrder })
    .limit(limit)
    .populate("user", "name email");

  console.log(`comments: ${comments.map(i => i._id)}`);

  res.status(StatusCodes.OK).json(comments || []);
};

module.exports = {
  getAllCommentsBlogPost,
  getAllCommentsUser,
  getAllComments,
  createCommentBlogPost,
  updateCommentBlogPost,
  deleteCommentBlogPost,
  deleteAllCommentsBlogPost,
  getFilteredComments,
  getMoreComments,
};

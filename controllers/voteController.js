const Vote = require("../models/Vote");
const Blog = require("../models/Blog");
const Comment = require("../models/Comment");
const { StatusCodes } = require("http-status-codes");
const CustomError = require("../errors");

//@desc Get all votes
//@route GET /api/v1/vote
//@access Private
const getAllVotes = async (req, res) => {
  const votes = await Vote.find({});

  res.status(StatusCodes.OK).json(votes);
};

// @desc Update vote count for blog post
// @route POST /api/v1/vote/blogId/:blogId
// @access Private
const updateBlogVoteCount = async (req, res) => {
  const { blogId } = req;
  const userId = req.user._id;

  const blogPost = await Blog.findById(blogId);
  if (!blogPost) {
    throw new CustomError.NotFoundError(`No blog post with id ${blogId}`);
  }

  const vote = Number(req.query.vote);

  // check if vote is valid
  if (![1, 0, -1].includes(vote)) {
    throw new CustomError.BadRequestError("Invalid vote type");
  }

  const existingVote = await Vote.findOne({ user: userId, post: blogId });

  if (!existingVote) {
    const newVote = new Vote({ user: userId, post: blogId, vote });
    await newVote.save();
    blogPost.totalVotes += vote;
    await blogPost.save();
    return res.status(StatusCodes.CREATED).json({
      msg: "Vote Added",
      totalVotes: blogPost.totalVotes,
      vote: newVote,
    });
  } else if (existingVote.vote === vote) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ msg: "Vote already exists" });
  } else {
    const oldVote = existingVote.vote;
    existingVote.vote = vote;
    await existingVote.save();
    if (oldVote === 1) {
      blogPost.totalVotes -= 1;
    } else if (oldVote === -1) {
      blogPost.totalVotes += 1;
    }
    if (vote === 1) {
      blogPost.totalVotes += 1;
    } else if (vote === -1) {
      blogPost.totalVotes -= 1;
    }
    await blogPost.save();
    return res.status(StatusCodes.OK).json({
      msg: "Vote updated",
      totalVotes: blogPost.totalVotes,
      vote: existingVote,
    });
  }
};

// @desc Update vote count for comment
// @route POST /api/v1/vote/commentId/:commentId
// @access Private
const updateCommentVoteCount = async (req, res) => {
  const { commentId } = req;
  const userId = req.user._id;

  const comment = await Comment.findById(commentId);
  if (!comment) {
    throw new CustomError.NotFoundError(`No comment with id ${commentId}`);
  }

  const vote = Number(req.query.vote);

  // check if vote is valid
  if (![1, 0, -1].includes(vote)) {
    throw new CustomError.BadRequestError("Invalid vote type");
  }

  const existingVote = await Vote.findOne({ user: userId, post: commentId });

  if (!existingVote) {
    const newVote = new Vote({ user: userId, post: commentId, vote });
    await newVote.save();
    comment.totalVotes += vote;
    await comment.save();
    return res.status(StatusCodes.CREATED).json({
      msg: "Vote Added",
      totalVotes: comment.totalVotes,
      vote: newVote,
    });
  } else if (existingVote.vote === vote) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ msg: "Vote already exists" });
  } else {
    const oldVote = existingVote.vote;
    existingVote.vote = vote;
    await existingVote.save();
    if (oldVote === 1) {
      comment.totalVotes -= 1;
    } else if (oldVote === -1) {
      comment.totalVotes += 1;
    }
    if (vote === 1) {
      comment.totalVotes += 1;
    } else if (vote === -1) {
      comment.totalVotes -= 1;
    }
    await comment.save();
    return res.status(StatusCodes.OK).json({
      msg: "Vote updated",
      totalVotes: comment.totalVotes,
      vote: existingVote,
    });
  }
};

// @desc Delete vote count for blog post
// @route DELETE /api/v1/vote/blogId/:blogId
// @access Private
const deleteBlogVoteCount = async (req, res) => {
  const { blogId } = req;
  const userId = req.user._id;

  const blogPost = await Blog.findById(blogId);
  if (!blogPost) {
    throw new CustomError.NotFoundError(`No blog post with id ${blogId}`);
  }

  const existingVote = await Vote.findOne({ user: userId, post: blogId });

  if (!existingVote) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ msg: "Vote does not exist" });
  } else {
    const oldVote = existingVote.vote;

    // Subtract the user's vote from the blog's totalVotes
    if (oldVote === 1) {
      blogPost.totalVotes -= 1;
    } else if (oldVote === -1) {
      blogPost.totalVotes += 1;
    }

    await blogPost.save();

    // Keep a copy of the vote to return before deleting
    const voteToDelete = existingVote;
    await existingVote.deleteOne();

    return res.status(StatusCodes.OK).json({
      msg: "Vote deleted",
      totalVotes: blogPost.totalVotes,
      vote: voteToDelete,
    });
  }
};

// @desc Delete vote count for comment
// @route DELETE /api/v1/vote/commentId/:commentId
// @access Private
const deleteCommentVoteCount = async (req, res) => {
  const { commentId } = req;
  const userId = req.user._id;

  const comment = await Comment.findById(commentId);
  if (!comment) {
    throw new CustomError.NotFoundError(`No comment with id ${commentId}`);
  }

  const existingVote = await Vote.findOne({ user: userId, post: commentId });

  if (!existingVote) {
    res.status(StatusCodes.BAD_REQUEST).json({ msg: "Vote does not exist" });
  } else {
    const oldVote = existingVote.vote;

    // Subtract the user's vote from the comment's totalVotes
    if (oldVote === 1) {
      comment.totalVotes -= 1;
    } else if (oldVote === -1) {
      comment.totalVotes += 1;
    }

    await comment.save();

    // Keep a copy of the vote to return before deleting
    const voteToDelete = existingVote;
    await existingVote.deleteOne();

    return res.status(StatusCodes.OK).json({
      msg: "Vote deleted",
      totalVotes: comment.totalVotes,
      vote: voteToDelete,
    });
  }
};

// @desc Delete vote count for all comments of a blog post
// @route DELETE /api/v1/vote/blogId/:blogId/comments
// @access Private
const deleteAllCommentVotesForBlog = async (req, res) => {
  const { blogId } = req;

  // Find all comments for the blog post
  const comments = await Comment.find({ blog: blogId });
  const commentIds = comments.map(comment => comment._id);

  // Delete all votes where the post field is in commentIds
  await Vote.deleteMany({ post: { $in: commentIds } });

  res.status(StatusCodes.OK).json({ msg: "All comment votes deleted" });
};

module.exports = {
  getAllVotes,
  updateBlogVoteCount,
  updateCommentVoteCount,
  deleteBlogVoteCount,
  deleteCommentVoteCount,
  deleteAllCommentVotesForBlog,
};

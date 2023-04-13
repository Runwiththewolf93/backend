const CustomError = require("../errors");

const blogIdExtraction = (req, _, next) => {
  const { blogId } = req.params;
  if (!blogId) {
    throw new CustomError.BadRequestError("Blog ID is required");
  }

  req.blogId = blogId;
  next();
};

const commentIdExtraction = (req, _, next) => {
  const { commentId } = req.params;
  if (!commentId) {
    throw new CustomError.BadRequestError("Comment ID is required");
  }

  req.commentId = commentId;
  next();
};

module.exports = { blogIdExtraction, commentIdExtraction };

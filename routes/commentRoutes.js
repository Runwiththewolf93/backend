const express = require("express");
const router = express.Router();

const authentication = require("../middleware/authentication");
const {
  blogIdExtraction,
  commentIdExtraction,
} = require("../middleware/extraction");
const {
  getAllCommentsBlogPost,
  createCommentBlogPost,
  updateCommentBlogPost,
  deleteCommentBlogPost,
} = require("../controllers/commentController");

router
  .route("/:blogId")
  .get(authentication, blogIdExtraction, getAllCommentsBlogPost)
  .post(authentication, blogIdExtraction, createCommentBlogPost);

router
  .route("/:blogId/:commentId")
  .put(
    authentication,
    blogIdExtraction,
    commentIdExtraction,
    updateCommentBlogPost
  )
  .delete(
    authentication,
    blogIdExtraction,
    commentIdExtraction,
    deleteCommentBlogPost
  );

module.exports = router;

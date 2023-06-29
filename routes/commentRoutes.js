const express = require("express");
const router = express.Router();

const { authentication } = require("../middleware/authentication");
const {
  blogIdExtraction,
  commentIdExtraction,
} = require("../middleware/extraction");
const {
  getAllCommentsBlogPost,
  getAllCommentsUser,
  getAllComments,
  createCommentBlogPost,
  updateCommentBlogPost,
  deleteCommentBlogPost,
  deleteAllCommentsBlogPost,
  getFilteredComments,
  getMoreComments,
} = require("../controllers/commentController");

router.route("/").get(authentication, getAllComments);

router.route("/user").get(authentication, getAllCommentsUser);

router
  .route("/blogId/:blogId")
  .get(authentication, blogIdExtraction, getAllCommentsBlogPost)
  .post(authentication, blogIdExtraction, createCommentBlogPost)
  .delete(authentication, blogIdExtraction, deleteAllCommentsBlogPost);

router
  .route("/blogId/:blogId/commentId/:commentId")
  .patch(
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

router.route("/filter").post(authentication, getFilteredComments);
router.route("/more").post(authentication, getMoreComments);

module.exports = router;

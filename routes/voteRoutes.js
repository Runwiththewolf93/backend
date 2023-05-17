const express = require("express");
const router = express.Router();
const { authentication } = require("../middleware/authentication");
const {
  blogIdExtraction,
  commentIdExtraction,
} = require("../middleware/extraction");
const {
  getAllVotes,
  updateBlogVoteCount,
  updateCommentVoteCount,
  deleteBlogVoteCount,
  deleteCommentVoteCount,
} = require("../controllers/voteController");

router.route("/").get(authentication, getAllVotes);

router
  .route("/blogId/:blogId")
  .post(authentication, blogIdExtraction, updateBlogVoteCount)
  .delete(authentication, blogIdExtraction, deleteBlogVoteCount);

router
  .route("/commentId/:commentId")
  .post(authentication, commentIdExtraction, updateCommentVoteCount)
  .delete(authentication, commentIdExtraction, deleteCommentVoteCount);

module.exports = router;

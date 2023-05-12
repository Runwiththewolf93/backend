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
} = require("../controllers/voteController");

router.route("/").get(authentication, getAllVotes);

router
  .route("/blogId/:blogId")
  .post(authentication, blogIdExtraction, updateBlogVoteCount);

router
  .route("/commentId/:commentId")
  .post(authentication, commentIdExtraction, updateCommentVoteCount);

module.exports = router;

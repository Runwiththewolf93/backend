const express = require("express");
const router = express.Router();
const { authentication } = require("../middleware/authentication");
const {
  getAllBlogPosts,
  createBlogPost,
  getSingleBlogPost,
  updateBlogPost,
  deleteBlogPost,
} = require("../controllers/blogController");

router
  .route("/")
  .get(authentication, getAllBlogPosts)
  .post(authentication, createBlogPost);

router
  .route("/:id")
  .get(getSingleBlogPost)
  .patch(authentication, updateBlogPost)
  .delete(authentication, deleteBlogPost);

module.exports = router;

const express = require("express");
const router = express.Router();
const authenticateUser = require("../middleware/authentication");
const {
  getAllBlogPosts,
  createBlogPost,
  getSingleBlogPost,
  updateBlogPost,
  deleteBlogPost,
} = require("../controllers/blogController");

router
  .route("/")
  .get(authenticateUser, getAllBlogPosts)
  .post(authenticateUser, createBlogPost);

router
  .route("/:id")
  .get(getSingleBlogPost)
  .patch(authenticateUser, updateBlogPost)
  .delete(authenticateUser, deleteBlogPost);

module.exports = router;

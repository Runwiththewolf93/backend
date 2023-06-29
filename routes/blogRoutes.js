const express = require("express");
const router = express.Router();
const { authentication } = require("../middleware/authentication");
const {
  getAllBlogPosts,
  getFilteredBlogPosts,
  getSingleBlogPost,
  createBlogPost,
  uploadBlogImages,
  updateBlogPost,
  deleteBlogPost,
} = require("../controllers/blogController");
const upload = require("../middleware/multer");

router
  .route("/")
  .get(authentication, getAllBlogPosts)
  .post(authentication, createBlogPost);

router.route("/filtered").post(authentication, getFilteredBlogPosts);

router
  .route("/:id")
  .get(getSingleBlogPost)
  .patch(authentication, updateBlogPost)
  .delete(authentication, deleteBlogPost);

router.route("/images").post(
  authentication,
  upload.fields([
    { name: "avatar", maxCount: 1 },
    { name: "images", maxCount: 3 },
  ]),
  uploadBlogImages
);

module.exports = router;

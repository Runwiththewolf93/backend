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
const upload = require("../middleware/multer");

router
  .route("/")
  .get(authentication, getAllBlogPosts)
  .post(
    authentication,
    upload.fields([
      { name: "avatar", maxCount: 1 },
      { name: "images", maxCount: 3 },
    ]),
    createBlogPost
  );

router
  .route("/:id")
  .get(getSingleBlogPost)
  .patch(
    authentication,
    upload.fields([
      { name: "avatar", maxCount: 1 },
      { name: "images", maxCount: 3 },
    ]),
    updateBlogPost
  )
  .delete(authentication, deleteBlogPost);

module.exports = router;

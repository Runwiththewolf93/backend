const express = require("express");
const router = express.Router();
const authenticateUser = require("../middleware/authentication");
const { getAllBlogPosts } = require("../controllers/blogController");

router.route("/").get(authenticateUser, getAllBlogPosts);

module.exports = router;

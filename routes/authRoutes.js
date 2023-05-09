const express = require("express");
const router = express.Router();
const { authentication } = require("../middleware/authentication");
const {
  register,
  login,
  getAllUsers,
} = require("../controllers/authController");

router.route("/register").post(register);
router.route("/login").post(login);
router.route("/users").get(authentication, getAllUsers);

module.exports = router;

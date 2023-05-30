const express = require("express");
const router = express.Router();
const {
  authentication,
  authorization,
} = require("../middleware/authentication");
const {
  register,
  login,
  getAllUsers,
  updateUser,
  deleteUser,
} = require("../controllers/authController");

router.route("/register").post(register);
router.route("/login").post(login);
router.route("/users").get(authentication, getAllUsers);
router.route("/update/:userId").put(authentication, authorization, updateUser);
router
  .route("/delete/:userId")
  .delete(authentication, authorization, deleteUser);

module.exports = router;

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
  updateUserPassword,
  forgotPassword,
  resetPassword,
} = require("../controllers/authController");

router.route("/register").post(register);
router.route("/login").post(login);
router.route("/users").get(authentication, getAllUsers);
router.route("/update/:userId").put(authentication, authorization, updateUser);
router
  .route("/delete/:userId")
  .delete(authentication, authorization, deleteUser);
router.route("/updateUserPassword").patch(authentication, updateUserPassword);
router.route("/forgotPassword").post(forgotPassword);
router.route("/resetPassword/:token").post(resetPassword);

module.exports = router;

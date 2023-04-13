const mongoose = require("mongoose");

const CommentSchema = mongoose.Schema(
  {
    comment: {
      type: String,
      required: [true, "Please enter a comment"],
      maxlength: [1000, "Comment cannot be greater than 1000 characters"],
    },
    user: { type: mongoose.Types.ObjectId, ref: "User", required: true },
    blog: { type: mongoose.Types.ObjectId, ref: "Blog", required: true },
  },
  { timestamps: true }
);

const Comment = mongoose.model("Comment", CommentSchema);
module.exports = Comment;

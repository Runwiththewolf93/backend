const mongoose = require("mongoose");

const BlogSchema = mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Please provide a title"],
      maxlength: [100, "Title cannot be more than 100 characters"],
    },
    avatar: {
      type: String,
      required: true,
      default: "/public/uploads/Portrait_Placeholder.png",
    },
    content: {
      type: String,
      required: [true, "Please provide blog post description"],
      maxlength: [1000, "Description cannot be greater than 1000 characters"],
    },
    images: [
      {
        type: String,
        required: true,
        default: "/public/uploads/Images_Placeholder.png",
      },
      {
        type: String,
        required: true,
        default: "/public/uploads/Images_Placeholder.png",
      },
      {
        type: String,
        required: true,
        default: "/public/uploads/Images_Placeholder.png",
      },
    ],
    user: { type: mongoose.Types.ObjectId, ref: "User", required: true },
    totalVotes: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const Blog = mongoose.model("Blog", BlogSchema);

module.exports = Blog;

const mongoose = require("mongoose");

const BlogSchema = mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Please provide a title"],
      maxlength: [100, "Title cannot be more than 100 characters"],
    },
    date: {
      type: Date,
      default: Date.now,
    },
    avatar: {
      type: String,
      required: true,
      default: "/public/uploads/couch.png",
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
        default: "/public/uploads/example.jpeg",
      },
      {
        type: String,
        required: true,
        default: "/public/uploads/example.jpeg",
      },
      {
        type: String,
        required: true,
        default: "/public/uploads/example.jpeg",
      },
    ],
  },
  { timestamps: true }
);

const Blog = mongoose.model("Blog", BlogSchema);

module.exports = Blog;

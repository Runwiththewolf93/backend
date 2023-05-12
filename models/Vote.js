const mongoose = require("mongoose");

const VoteSchema = mongoose.Schema(
  {
    user: { type: mongoose.Types.ObjectId, ref: "User", required: true },
    post: {
      type: mongoose.Types.ObjectId,
      ref: "Blog" || "Comment",
      required: true,
    },
    vote: { type: Number, required: true, enum: [-1, 0, 1], default: 0 },
  },
  { timestamps: true }
);

const Vote = mongoose.model("Vote", VoteSchema);

module.exports = Vote;

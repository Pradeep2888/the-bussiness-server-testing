const mongoose = require("mongoose");

const blogCommentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please provide your name"],
  },
  email: {
    type: String,
    required: [true, "Please provide your email"],
  },
  postid: {
    type: String,
    required: [true, "Please provide postid"],
  },
  message: {
    type: String,
    required: [true, "Please Provide message"],
  },
  active: {
    type: Boolean,
    default: false,
  },
  date: {
    type: Date,
    default: Date.now(),
  },
});

const blogCommentModal = mongoose.model("blogComment", blogCommentSchema);

module.exports = blogCommentModal;

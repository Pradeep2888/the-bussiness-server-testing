const mongoose = require("mongoose");

const blogCategorySchema = new mongoose.Schema({
  name: {
    type: String,
    unique: true,
    lowercase: true,
    required: [true, "Please provide your email"],
  },
  date: {
    type: Date,
    default: Date.now(),
  },
});

const blogCategoryModal = mongoose.model("blogCategory", blogCategorySchema);

module.exports = blogCategoryModal;

const mongoose = require("mongoose");

const blogSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, "Please provide blog Title"],
  },
  alt: { type: String, required: [true, "Please provide blog alt text"] },
  description: {
    type: String,
    required: [true, "Please provide blog description"],
  },
  image: {
    type: String,
    required: [true, "Please provide blog image"],
  },
  metaTitle: {
    type: String,
    required: [true, "Please provide blog meta-title"],
  },
  metaDescription: {
    type: String,
    required: [true, "Please tell us your meta-description"],
  },
  metaKeywords: {
    type: String,
    required: [true, "Please tell us your meta-keywords"],
  },
  tags: {
    type: String,
    required: [true, "Please Provide tags"],
  },
  category: {
    type: String,
    required: [true, "Please Provide category"],
  },
  faq: {
    type: Array,
    required: [true, "Please Provide faq"],
  },
  table: {
    type: String,
  },
  date: {
    type: Date,
    default: Date.now(),
  },
});

const blog = mongoose.model("blog", blogSchema);

module.exports = blog;

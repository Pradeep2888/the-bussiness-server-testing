const mongoose = require("mongoose");

const review = new mongoose.Schema({
  userId: {
    type: String,
    required: [true, "user id is required"],
  },
  listingId: {
    type: String,
    required: [true, "listing id is required"],
  },
  name: {
    type: String,
    required: [true, "user name is required"],
  },
  email: {
    type: String,
    required: [true, "user email is required"],
  },
  title: {
    type: String,
    required: [true, "review title is required"],
  },
  review: {
    type: String,
    required: [true, "review is required"],
  },
  rating: {
    type: Number,
    required: [true, "review rating is requesting"],
  },
  date: {
    type: Date,
    default: Date.now(),
  },
  active: {
    type: Boolean,
    default: null,
    allowNull: true,
  },
  response: [
    {
      reply: String,
      date: {
        type: Date,
      },
    },
  ],
});

const reviewModal = new mongoose.model("reveiw", review);

module.exports = reviewModal;

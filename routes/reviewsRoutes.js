const express = require("express");
const {
  reportReview,
  contactAdmin,
  topReviews,
} = require("../controllers/reviewController");
const { validUser } = require("../controllers/authController");

const router = express.Router();

router.route("/report").post(validUser, reportReview);
router.route("/contact").post(validUser, contactAdmin);
router.route("/topReviewer").get(topReviews);

module.exports = router;

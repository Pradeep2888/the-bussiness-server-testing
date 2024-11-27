const express = require("express");
const {
  userLogin,
  userSignup,
  validUser,
  updatePassword,
  verifyUserLink,
} = require("../controllers/authController");
const {
  getUserReviews,
  deteteUserReviews,
  GetUserData,
  updateUserData,
  getUserListing,
  createUserWithListing,
  reviewStats,
  ListingStats,
  deleteUserListing,
  getTopRatingUser,
  reviewOnMylisting,
  updateUserReview,
  sendOtp,
  otpValidator,
  passwordResetHandler,
} = require("../controllers/userController");
const router = express.Router();

router.route("/signup").post(userSignup);
router.route("/login").post(userLogin);
router.route("/updatePassword").post(validUser, updatePassword);
router.route("/u-verify/:vcode/:uid").get(verifyUserLink);

// ----------------------------------

router
  .route("/user/reviews")
  .get(validUser, getUserReviews)
  .delete(validUser, deteteUserReviews)
  .patch(validUser, updateUserReview);

router
  .route("/user")
  .get(validUser, GetUserData)
  .post(validUser, updateUserData);

router.route("/user/reviews/:id").get(validUser, reviewOnMylisting);

router.route("/user-l").post(createUserWithListing);
router
  .route("/b-listing/:id?")
  .get(validUser, getUserListing)
  .delete(validUser, deleteUserListing);

router.route("/top-reviewers").get(getTopRatingUser);

router.route("/review-stats").get(validUser, reviewStats);
router.route("/business-stats").get(validUser, ListingStats);

router.route("/reset/otp").post(sendOtp);
router.route("/reset/verify").post(otpValidator);
router.route("/reset/update").post(passwordResetHandler);

module.exports = router;

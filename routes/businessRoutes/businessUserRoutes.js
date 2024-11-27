const express = require("express");
const {
  businessUserSignup,
  completePasswordVerification,
  updatedpassword,
  businessUserLogin,
  validBusinessUser,
} = require("../../business-controller/businessAuth");

const {
  userProfile,
  upadateProfile,
  upadatePassword,
  updateBusinessProfile,
  getAllListingCategory,
  getAdController,
  updateAdController,
  uploadBusinessMedia,
  getBusinessDetails,
} = require("../../business-controller/businessProfileController");

const {
  businessReviewStats,
  businessReviewStatsCalc,
  getAllReviewsForBusinessUser,
  businessReviewReply,
  businessContact,
  getReviewOnReport,
  reviewReportHandler,
} = require("../../business-controller/businessReviewController");
const {
  newSubscription,
  subValidator,
  getMedia,
  deleteMedia,
  getSubscriptionDetails,
  getSubscriptionHistory,
} = require("../../business-controller/businessSubscriptionController");

const {
  getListingPremiumStatus,
} = require("../../controllers/listingController");

const router = express.Router();

router.route("/signup").post(businessUserSignup);
router.route("/signin").post(businessUserLogin);
router
  .route("/check-valid-pass")
  .post(completePasswordVerification)
  .put(updatedpassword);

router
  .route("/user")
  .get(validBusinessUser, userProfile)
  .put(validBusinessUser, upadateProfile)
  .patch(validBusinessUser, updateBusinessProfile);

router
  .route("/review/stats")
  .put(validBusinessUser, businessReviewStats)
  .get(validBusinessUser, businessReviewStatsCalc);

router
  .route("/review")
  .get(validBusinessUser, getAllReviewsForBusinessUser)
  .post(validBusinessUser, businessReviewReply);

router.route("/user/updatePassword").put(validBusinessUser, upadatePassword);
router
  .route("/report")
  .get(validBusinessUser, getReviewOnReport)
  .post(validBusinessUser, reviewReportHandler);

router.route("/user/contact").get(validBusinessUser, businessContact);
router.route("/category").get(validBusinessUser, getAllListingCategory);

router
  .route("/advertisement")
  .get(validBusinessUser, getAdController)
  .put(validBusinessUser, updateAdController);

router
  .route("/media/:id?")
  .post(validBusinessUser, subValidator, uploadBusinessMedia)
  .get(validBusinessUser, subValidator, getMedia)
  .delete(validBusinessUser, subValidator, deleteMedia);

router
  .route("/subscription")
  .post(validBusinessUser, newSubscription)
  .get(validBusinessUser, subValidator);

router
  .route("/subscription/details")
  .get(validBusinessUser, getSubscriptionDetails);

router
  .route("/subscription/history")
  .get(validBusinessUser, getSubscriptionHistory);

router.route("/score").get(getBusinessDetails);

module.exports = router;

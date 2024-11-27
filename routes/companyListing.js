const express = require("express");
const {
  createCompanyListing,
  reviewPostHandler,
  getReviewHandler,
  claimListingHandler,
  RegNewListing,
  verifiyListingConfirmation,
  findRegCompany,
  updateListing,
  listingByCateController,
  getCategoryReviews,
  ListingSearch,
  getReviewByCategory,
  replyUserReviews,
  lisingCategory,
  getTopCategory,
  getListingAdvertisment,
  getListingPremiumStatus,
  getListingMedia,
} = require("../controllers/listingController");

const { validUser } = require("../controllers/authController");

const router = express.Router();

router.route("/listing").put(createCompanyListing);

router
  .route("/listing/review")
  .put(validUser, reviewPostHandler)
  .get(getReviewHandler)
  .patch(validUser, replyUserReviews);

router.route("/listing/category").get(lisingCategory);
router.route("/listing/getTop5Category").get(getTopCategory);

router.route("/listing/add").put(validUser, RegNewListing);

router.route("/listing/search/:id").get(listingByCateController);

router.route("/listing/type-x/:id").get(ListingSearch);

router.route("/listing/find/:id").get(validUser, findRegCompany);

router.route("/listing/upd-listing").post(validUser, updateListing);

router.route("/listing/claim").post(validUser, claimListingHandler);

router.route("/listing/verify/:vcode/:uid").get(verifiyListingConfirmation);

router.route("/listing/review/:id").get(getReviewByCategory);
router.route("/listing/advertisment/:id?").get(getListingAdvertisment);
router.route("/listing/media/:id?").get(getListingMedia);
router.route("/listing_m_details").post(getListingPremiumStatus);

module.exports = router;

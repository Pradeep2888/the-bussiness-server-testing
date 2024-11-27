const express = require("express");
const {
  getBlogList,
  getBlogbyid,
  getBlogsuggestion,
  commentBlog,
  getBlogDataHandler,
  BlogCategoryInsertHandler,
  getBlogCategoryHandler,
  updateBlogCategoryHandler,
  deleteBlogCategoryHandler,
  getFooterData,
  updateFooterData,
  PostFooterData,
  deleteFooterData,
} = require("../controllers/blogController");

const router = express.Router();

router.route("/blog").get(getBlogList);
router.route("/blog/:id").get(getBlogbyid);
router.route("/blog/suggestion/:id").get(getBlogsuggestion);
router.route("/blog/comment/:id?").put(commentBlog).get(getBlogDataHandler);

router
  .route("/setting")
  .get(getFooterData)
  .patch(updateFooterData)
  .post(PostFooterData)
  .delete(deleteFooterData);

router
  .route("/category/blog/:id?")
  .post(BlogCategoryInsertHandler)
  .get(getBlogCategoryHandler)
  .patch(updateBlogCategoryHandler)
  .delete(deleteBlogCategoryHandler);

module.exports = router;

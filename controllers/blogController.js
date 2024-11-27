const catchAsync = require("../utils/catchAsync");

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

exports.getBlogList = catchAsync(async (req, res, next) => {
  const blogList = await prisma.blog.findMany();
  res.status(200).json({ status: "success", data: blogList });
});

exports.getBlogbyid = catchAsync(async (req, res, next) => {
  const id = req.params.id;
  const blogList = await prisma.blog.findFirst({
    where: {
      id,
    },
  });
  res.status(200).json({ status: "success", data: blogList });
});

exports.getBlogsuggestion = catchAsync(async (req, res, next) => {
  const id = req.params.id;

  const suggestions = await prisma.$queryRaw`
  SELECT *
  FROM Blog
  WHERE id != ${id}
  ORDER BY RAND()
  LIMIT 2
`;

  res.status(200).json({ status: "success", data: suggestions });
});

exports.commentBlog = catchAsync(async (req, res, next) => {
  await prisma.blogComment.create({
    data: req.body,
  });

  res.status(201).json({ status: "success" });
});

exports.blogCommentDeleteHandler = catchAsync(async (req, res, next) => {
  await prisma.blogComment.delete({
    where: {
      id: req.params.id,
    },
  });

  res.status(200).json({
    message: "success",
  });
});

exports.changeActiveStatus = catchAsync(async (req, res, next) => {
  await prisma.blogComment.update({
    where: {
      id: req.params.id,
    },
    data: {
      active: req.body.status,
    },
  });

  res.status(200).json({
    message: "success",
  });
});

exports.getBlogDataHandler = catchAsync(async (req, res, next) => {
  const limit = 5;
  const page = req.query.page * 1 || 1;
  const skip = (page - 1) * limit;

  const le = await prisma.blogComment.count({
    where: {
      postid: req.params.id,
      active: true,
    },
  });

  const data = await prisma.blogComment.findMany({
    where: {
      postid: req.params.id,
      active: true,
    },
    skip: skip,
    take: limit,
    orderBy: {
      date: "desc",
    },
  });

  res.status(200).json({
    status: "success",
    le,
    data,
  });
});

exports.BlogCategoryInsertHandler = catchAsync(async (req, res, next) => {
  const ex = await prisma.blogCategory.create({
    data: req.body,
  });

  res.status(201).json({
    message: "new category successfully created",
    data: ex,
  });
});

exports.getBlogCategoryHandler = catchAsync(async (req, res, next) => {
  const ex = await prisma.blogCategory.findMany();

  res.status(200).json({
    message: "success",
    data: ex,
  });
});

exports.updateBlogCategoryHandler = catchAsync(async (req, res, next) => {
  const ex = await prisma.blogCategory.update({
    where: {
      id: req.body.id,
    },
    data: {
      name: req.body.name,
    },
  });

  res.status(200).json({
    message: "category updated successfully",
    data: ex,
  });
});

exports.deleteBlogCategoryHandler = catchAsync(async (req, res, next) => {
  await prisma.blogCategory.delete({
    where: {
      id: req.params.id,
    },
  });

  res.status(204).json({
    message: "category deleted successfully",
  });
});

exports.getFooterData = catchAsync(async (req, res, next) => {
  const data = await prisma.footerSetting.findMany();

  res.status(200).json({
    message: "success",
    data,
  });
});

exports.updateFooterData = catchAsync(async (req, res, next) => {
  await prisma.footerSetting.update({
    where: {
      id: req.body.id,
    },
    data: {
      content: req.body.content,
      topsearches: req.body.topsearches,
    },
  });

  res.status(200).json({
    message: "success",
  });
});

exports.PostFooterData = catchAsync(async (req, res, next) => {
  await prisma.footerSetting.create({
    data: {
      content: req.body.content,
      topsearches: req.body.topsearches,
    },
  });

  res.status(200).json({
    message: "success",
  });
});

exports.deleteFooterData = catchAsync(async (req, res, next) => {
  await prisma.footerSetting.deleteMany({
    where: {
      id: req.query.we,
    },
  });

  res.status(204).json({
    message: "Data deleted successfully",
  });
});

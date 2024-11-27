const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

exports.businessReviewStats = catchAsync(async (req, res, err) => {
  const businessId = req.body.userId;

  const sda = await prisma.businessPrimaryDetails.findFirst({
    where: {
      userid: businessId,
    },
  });

  const reviewCounts = await prisma.review.groupBy({
    by: ["active"],
    _count: {
      _all: true,
    },
    where: {
      listingId: sda.id,
    },
  });

  const stats = {};
  for (const { active, _count } of reviewCounts) {
    stats[active] = _count._all;
  }

  res.status(200).json({
    message: "Success",
    status: 200,
    data: stats,
  });
});

exports.businessReviewStatsCalc = catchAsync(async (req, res, err) => {
  const businessId = req.body.userId;

  const sda = await prisma.businessPrimaryDetails.findFirst({
    where: {
      userid: businessId,
    },
  });

  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1;
  const currentYear = currentDate.getFullYear();

  const previousMonth = currentMonth === 1 ? 12 : currentMonth - 1;
  const previousYear = currentMonth === 1 ? currentYear - 1 : currentYear;

  const currentMonthReviews = await prisma.review.count({
    where: {
      listingId: sda.id,
      createdAt: {
        gte: new Date(`${currentYear}-${currentMonth}-01`),
      },
    },
  });

  const previousMonthReviews = await prisma.review.count({
    where: {
      listingId: sda.id,
      createdAt: {
        gte: new Date(`${previousYear}-${previousMonth}-01`),
        lt: new Date(`${currentYear}-${currentMonth}-01`),
      },
    },
  });

  const total = await prisma.review.count({
    where: {
      listingId: sda.id,
    },
  });

  const averageRating = await prisma.review.aggregate({
    _avg: {
      rating: true,
    },
    where: {
      listingId: sda.id,
    },
  });

  const percentageChange =
    previousMonthReviews !== 0
      ? ((currentMonthReviews - previousMonthReviews) / previousMonthReviews) *
        100
      : 100;

  res.status(200).json({
    currentMonthReviews,
    previousMonthReviews,
    percentageChange,
    total,
    averageRating: averageRating._avg.rating,
  });
});

exports.getAllReviewsForBusinessUser = catchAsync(async (req, res, err) => {
  const sda = await prisma.businessPrimaryDetails.findFirst({
    where: {
      userid: req.body.userId,
    },
  });

  let filter = { createdAt: "desc" };
  let modifier = { listingId: sda.id };

  if (req.query.sort) {
    delete filter.createdAt;
    filter.rating = req.query.sort === "lth" ? "asc" : "desc";
  } else {
    filter.createdAt = "desc";
  }

  if (req.query.filter) {
    modifier.active = JSON.parse(req.query.filter);
  }

  if (req.query.r) {
    modifier.rating = Number(req.query.r);
  }

  const page = req.query.page || 1;
  const limit = 5;
  const skip = limit * (page - 1);

  const reviews = await prisma.review.findMany({
    skip: skip,
    take: limit,
    include: {
      user: {
        select: {
          name: true,
          email: true,
        },
      },
    },
    orderBy: {
      ...filter,
    },
    where: {
      ...modifier,
    },
  });

  const total = await prisma.review.count({
    orderBy: {
      ...filter,
    },
    where: {
      ...modifier,
    },
  });

  res.status(200).json({
    message: "success",
    reviews,
    total,
  });
});

exports.businessReviewReply = catchAsync(async (req, res, err) => {
  await prisma.review.updateMany({
    where: {
      id: req.body.id,
    },
    data: {
      reply: req.body.reply,
    },
  });

  res.status(200).json({
    message: "success",
  });
});

exports.businessContact = catchAsync(async (req, res, err) => {
  const data = await prisma.contactBusinessAdmin.findMany({
    where: {
      listingId: req.body.userId,
    },
  });

  res.status(200).json({
    message: "success",
    data,
  });
});

exports.getReviewOnReport = catchAsync(async (req, res, err) => {
  const business = await prisma.businessPrimaryDetails.findFirst({
    where: {
      userid: req.body.userId,
    },
  });

  const data = await prisma.$queryRaw`
    SELECT
      r.*,
      c.name,
      c.email,
      z.review,
      z.email AS review_email,
      z.name AS review_user,
      z.rating,
      z.active
  FROM
      review_report r
  LEFT JOIN users c ON
      c.id = r.userId
  LEFT JOIN reviews z ON
      r.reviewId = z.id
  WHERE
      r.listingId = ${business.id}`;

  res.status(200).json({
    message: "success",
    data,
  });
});

exports.reviewReportHandler = catchAsync(async (req, res, err) => {
  await prisma.review.update({
    where: {
      id: req.body.id,
    },
    data: {
      active: req.body.status,
    },
  });

  res.status(200).json({
    message: "status updated successfully",
  });
});

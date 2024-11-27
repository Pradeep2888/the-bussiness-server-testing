const catchAsync = require("../utils/catchAsync");
const reviewModal = require("../models/reviewModal");
const User = require("../models/userModel");
const companyModal = require("../models/companyListingModal");
const sendEmail = require("../utils/email");

const fs = require("fs");

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const bcrypt = require("bcryptjs");

exports.getUserReviews = catchAsync(async (req, res, next) => {
  const page = req.query.page * 1 || 1;
  const skip = (page - 1) * 5;

  const tf =
    req.query.f === "true" ? true : req.query.f === "false" ? false : null;
  const o = req.query.f !== "all" && req.query.f ? { active: tf } : {};

  const totalCount = await prisma.review.findMany({
    where: {
      userId: req.body.userId,
      ...o,
    },
  });

  const totalDocuments = totalCount.length ?? 0;

  const review = await prisma.review.findMany({
    where: {
      userId: req.body.userId,
      ...o,
    },
    include: {
      listing: {
        select: {
          icon: true,
          website: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    skip: skip,
    take: 5,
  });

  res.status(200).json({
    length: totalDocuments,
    message: "success",
    status: 200,
    data: review,
  });
});

exports.deteteUserReviews = catchAsync(async (req, res, next) => {
  const deletdReview = await prisma.review.delete({
    where: {
      id: req.query.id,
    },
  });

  res.status(200).json({
    message: "success",
    status: 200,
    data: deletdReview,
  });
});

exports.GetUserData = catchAsync(async (req, res, next) => {
  const userData = await prisma.user.findUnique({
    where: {
      id: req.body.userId,
    },
    select: {
      id: false,
      verification: false,
      name: true,
      email: true,
      verified: true,
      image: true,
      address: true,
      phone: true,
    },
  });

  res.status(200).json({
    message: "success",
    status: 200,
    data: userData,
  });
});

exports.updateUserData = catchAsync(async (req, res, next) => {
  const userData = await prisma.user.update({
    where: {
      id: req.body.userId,
    },
    data: {
      name: req.body.name,
      phone: req.body.phone,
      address: req.body.address,
      image: req.body.image,
    },
  });

  res.status(200).json({
    message: "success",
    status: 200,
    data: userData,
  });
});

exports.getUserListing = catchAsync(async (req, res, next) => {
  const page = req.query.page * 1 || 1;
  const skip = (page - 1) * 5;

  const tf =
    req.query.f === "true" ? true : req.query.f === "false" ? false : null;
  const o = req.query.f !== "all" && req.query.f ? { hasadmin: tf } : {};

  const [listingData, totalDocuments] = await Promise.all([
    prisma.companyListing.findMany({
      where: {
        userId: req.body.userId,
        ...o,
      },
      select: {
        id: true,
        companyName: true,
        categoryId: true,
        websiteLink: true,
        logo: true,
      },
      skip: skip,
      take: 5,
    }),
    prisma.companyListing.count({
      where: {
        userId: req.body.userId,
        ...o,
      },
    }),
  ]);

  const listingIds = listingData.map((listing) => listing.id);

  const reviews = await prisma.review.findMany({
    where: {
      listingId: {
        in: listingIds,
      },
    },
    select: {
      rating: true,
    },
  });

  const reviewsMap = {};

  reviews.forEach((review) => {
    if (!reviewsMap[review.listingId]) {
      reviewsMap[review.listingId] = {
        totalRating: 0,
        totalReviews: 0,
      };
    }
    reviewsMap[review.listingId].totalRating += review.rating;
    reviewsMap[review.listingId].totalReviews += 1;
  });

  listingData.forEach((listing) => {
    const reviewStats = reviewsMap[listing.id];
    if (reviewStats) {
      listing.averageRating =
        reviewStats.totalReviews > 0
          ? reviewStats.totalRating / reviewStats.totalReviews
          : 0;
      listing.totalReviews = reviewStats.totalReviews;
    } else {
      listing.averageRating = 0;
      listing.totalReviews = 0;
    }
  });

  res.status(200).json({
    length: totalDocuments,
    message: "success",
    status: 200,
    data: listingData,
  });
});

exports.deleteUserListing = catchAsync(async (req, res, next) => {
  await prisma.companyListing.delete({
    where: { id: req.params.id },
  });

  res.status(204).json({
    message: "listing deleted Successfully",
  });
});

exports.createUserWithListing = catchAsync(async (req, res, next) => {
  let password = require("crypto").randomBytes(8).toString("hex");

  const code = require("crypto").randomBytes(6).toString("hex");

  const cryptPassword = await bcrypt.hash(password, 12);

  const newuser = await prisma.user.create({
    data: {
      email: req.body.email,
      name: req.body.email.split("@")[0],
      password: cryptPassword,
      verified: true,
    },
  });

  newuser.password = undefined;

  const message = `Your new account has been successfully created. Here are your account details : \n
  ,your email: ${req.body.email} and password: ${password} \n
  your verification link to verify your listing is  \n https://reviewsix.vercel.app/api/v1/company/listing/verify/${code}/${newuser.id}
  `;

  await prisma.companyListing.update({
    where: {
      websiteLink: req.body.email.split("@")[1],
    },
    data: {
      verifyCode: code,
    },
  });

  let x = fs.readFileSync(__dirname + "/emailTemp.html", "utf8");

  let y = x
    .replace("{{name}}", req.body.email.split("@")[0])
    .replace("{{email}}", req.body.email)
    .replace("{{password}}", password)
    .replace(
      "{{link}}",
      `https://reviewsix.vercel.app/api/v1/company/listing/verify/${code}/${newuser.id}`
    );

  try {
    await sendEmail({
      email: req.body.email,
      subject: "Welcome to the business rating",
      message,
      html: y,
    });

    res.status(201).json({
      message: "success",
      status: 201,
    });
  } catch (err) {
    return next(
      new AppError("There was an error sending the email. Try again later!"),
      500
    );
  }
});

exports.reviewStats = catchAsync(async (req, res, err) => {
  const userId = req.body.userId;

  const reviewCounts = await prisma.review.groupBy({
    by: ["active"],
    _count: {
      _all: true,
    },
    where: {
      userId: userId,
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

exports.getTopRatingUser = catchAsync(async (req, res, next) => {
  const data = await reviewModal.aggregate([
    {
      $group: {
        _id: "$userId",
        total: {
          $sum: 1,
        },
      },
    },
    {
      $sort: {
        total: -1,
      },
    },
    {
      $addFields: {
        ii: {
          $toObjectId: "$_id",
        },
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "ii",
        foreignField: "_id",
        as: "user",
      },
    },
    {
      $unwind: "$user",
    },
    {
      $project: {
        user: 1,
      },
    },
    {
      $unset: [
        "user.password",
        "user.email",
        "user.verification",
        "user.verified",
        "user.address",
        "user.phone",
      ],
    },
  ]);

  res.json({
    message: "success",
    data,
  });
});

exports.reviewOnMylisting = catchAsync(async (req, res, next) => {
  const data = await prisma.review.findMany({
    where: {
      listingId: req.params.id,
    },
  });

  res.status(200).json({
    message: "success",
    data,
  });
});

exports.updateUserReview = catchAsync(async (req, res, next) => {
  await prisma.review.updateMany({
    where: {
      id: req.body.id,
    },
    data: {
      title: req.body.title,
      review: req.body.review,
      rating: req.body.rating,
      active: null,
    },
  });

  res.status(200).json({
    message: "updated",
  });
});

exports.ListingStats = catchAsync(async (req, res, err) => {
  const userId = req.body.userId;

  const listingStats = await prisma.companyListing.groupBy({
    by: ["hasadmin"],
    _count: {
      _all: true,
    },
    where: {
      userId: userId,
    },
  });

  const result = listingStats.reduce((acc, { hasadmin, _count }) => {
    acc[hasadmin] = _count._all;
    return acc;
  }, {});

  res.status(200).json({
    data: result,
  });
});

function generateRandomSixDigitNumber() {
  const min = 100000;
  const max = 999999;

  return Math.floor(Math.random() * (max - min + 1)) + min;
}

exports.sendOtp = catchAsync(async (req, res, next) => {
  const randomBytes = generateRandomSixDigitNumber();

  const enrypt = await bcrypt.hash(randomBytes.toString(), 10);

  const message = `Here is your one-time password for Password reset: ${randomBytes}`;

  const user = await prisma.user.findFirst({
    where: {
      email: req.body.email,
    },
  });

  if (!user) {
    res.status(404).json({
      message: "not found",
      status: 200,
    });
  }

  if (user) {
    await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        verification: enrypt,
      },
    });

    try {
      await sendEmail({
        email: req.body.email,
        subject: "Reset your passowrd",
        message,
      });

      res.status(200).json({
        message: "success",
        status: 200,
      });
    } catch (err) {
      return next(
        new AppError("There was an error sending the email. Try again later!"),
        500
      );
    }
  }
});

exports.otpValidator = catchAsync(async (req, res, next) => {
  const user = await prisma.user.findFirst({
    where: {
      email: req.body.email,
    },
  });

  const verify = await bcrypt.compare(req.body.code, user.verification);

  if (verify) {
    res.status(200).json({
      message: "verified",
      status: 200,
    });
  } else {
    res.status(202).json({
      message: "wrong otp",
      status: 202,
    });
  }
});

exports.passwordResetHandler = catchAsync(async (req, res, next) => {
  if (!req.body.email) {
    res.status(401).json({
      message: "Token Expire or Invalid user",
      status: 202,
    });
  }

  const user = await prisma.user.findFirst({
    where: {
      email: req.body.email,
    },
  });

  if (!user) {
    res.status(401).json({
      message: "Token Expire or Invalid user",
      status: 202,
    });
  }
  const verify = await bcrypt.compare(req.body.code, user.verification);

  if (verify) {
    const password = await bcrypt.hash(req.body.password, 12);

    await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        password: password,
      },
    });

    res.status(200).json({
      message: "password updated sucessfully",
      status: 200,
    });
  } else {
    res.status(401).json({
      message: "Token Expire or Invalid user",
      status: 401,
    });
  }
});

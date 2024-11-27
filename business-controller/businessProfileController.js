const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");
const bcrypt = require("bcryptjs");

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

exports.userProfile = catchAsync(async (req, res, next) => {
  const data = await prisma.businessUsers.findFirst({
    where: {
      id: req.body.userId,
    },
    include: {
      details: true,
    },
  });

  data.password = undefined;
  data.static_code = undefined;
  // data.acountType = undefined;
  data.complete = undefined;
  data.verified = undefined;
  data.verification = undefined;

  res.status(200).json({
    status: "success",
    data,
  });
});

exports.upadateProfile = catchAsync(async (req, res, next) => {
  await prisma.businessUsers.update({
    where: {
      id: req.body.userId,
    },
    data: {
      fname: req.body.fname,
      lname: req.body.lname,
    },
  });

  res.status(200).json({
    status: "success",
    message: "user detail updated successfully",
  });
});

exports.upadatePassword = catchAsync(async (req, res, next) => {
  if (!req.body.password || !req.body.newpassword) {
    next(new AppError("inValid inputs", 400));
  }

  const user = await prisma.businessUsers.findUnique({
    where: {
      id: req.body.userId,
    },
  });

  if (!user || !(await bcrypt.compare(req.body.password, user.password))) {
    next(new AppError("wrong password", 404));
  }

  req.body.newpassword = await bcrypt.hash(req.body.newpassword, 10);

  await prisma.businessUsers.update({
    where: {
      id: req.body.userId,
    },
    data: {
      password: req.body.newpassword,
    },
  });

  res.status(200).json({
    status: "success",
    message: "password updated successfully",
  });
});

exports.updateBusinessProfile = catchAsync(async (req, res, next) => {
  await prisma.businessUsers.update({
    where: {
      id: req.body.userId,
    },
    data: {
      address: req.body.location,
      companyname: req.body.businessname,
      website: req.body.website,
    },
  });

  await prisma.businessPrimaryDetails.updateMany({
    where: {
      userid: req.body.userId,
    },
    data: {
      about: req.body.about,
      colorScheme: req.body.colorScheme,
      sociallinks: JSON.stringify(req.body.socialLinks),
      about: req.body.about,
      icon: req.body.icon,
      banner: req.body.banner,
      category: req.body.category,
      workemail: req.body.workemail,
      address: req.body.location,
      companyname: req.body.businessname,
      phone: req.body.phone,
    },
  });

  res.status(200).json({
    status: "success",
    message: "password updated successfully",
  });
});

exports.getAllListingCategory = catchAsync(async (req, res, next) => {
  const data = await prisma.category.findMany({});

  res.status(200).json({
    status: "success",
    data,
  });
});

exports.updateAdController = catchAsync(async (req, res, next) => {
  await prisma.businessAdvertisement.updateMany({
    where: { userId: req.body.userId },
    data: { ads: req.body.ads },
  });

  res.status(200).json({
    status: "success updated",
  });
});

exports.getAdController = catchAsync(async (req, res, next) => {
  let data =
    await prisma.$queryRaw`SELECT * FROM business_advertisement WHERE userId = ${req.body.userId}`;

  res.status(200).json({
    status: "success",
    data,
  });
});

exports.uploadBusinessMedia = catchAsync(async (req, res, next) => {
  req.body.businessUsersId = req.body.userId;
  delete req.body.userId;

  await prisma.businessMedia.create({
    data: req.body,
  });

  res.status(201).json({
    status: "Media successfully inserted",
  });
});

exports.getBusinessDetails = catchAsync(async (req, res, next) => {
  const data = await prisma.businessPrimaryDetails.findFirst({
    where: {
      website: {
        contains: req.query.id,
      },
    },
  });

  let review;
  let avg;

  if (data) {
    review = await prisma.review.count({
      where: {
        listingId: data.id,
        active: true,
      },
    });

    avg = await prisma.$queryRaw`
    SELECT AVG(rating) AS average_rating
    FROM reviews
    WHERE listingId = ${data.id} AND active = 1;
   `;
  }

  res.status(200).json({
    message: "success",
    data,
    review: review ?? 0,
    avg: avg ? avg[0] : {},
  });
});

const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const currentDate = new Date();
const futureDate = new Date();

futureDate.setDate(currentDate.getDate() + 30);

const isoFormattedCurrentDate = currentDate.toISOString();
const isoFormattedFutureDate = futureDate.toISOString();

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

exports.subValidator = catchAsync(async (req, res, next) => {
  const premium = await prisma.premiumUser.findFirst({
    where: {
      userId: req.body.userId,
    },
  });

  if (!premium) {
    return res.status(200).json({
      data: {
        m69_sub: false,
      },
    });
  }

  const data = await prisma.subscription.findFirst({
    where: { id: premium.subscriptionId },
  });

  if (!data) {
    return res.status(200).json({
      data: {
        m69_sub: false,
      },
    });
  }

  if (premium.currentPlanEnd < currentDate) {
    return res.status(200).json({
      data: {
        m69_sub: false,
        p69_d: "expire",
      },
    });
  }

  if (req.query.notb_69) {
    return res.status(200).json({
      data: {
        m69_sub: true,
      },
    });
  } else {
    next();
  }
});

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

exports.newSubscription = catchAsync(async (req, res, next) => {
  const reg = await prisma.subscription.findFirst({
    where: {
      userId: req.body.userId,
    },
  });

  let data;

  if (!reg) {
    data = await prisma.subscription.create({
      data: {
        userId: req.body.userId,
        listingid: req.body.listingid,
        paymentId: req.body.userId,
      },
    });
  }

  req.body.subscriptionId = reg ? reg.id : data.id;
  req.body.planActive = true;
  req.body.currentPlanStart = isoFormattedCurrentDate;
  req.body.currentPlanEnd = isoFormattedFutureDate;

  await prisma.premiumUser.create({
    data: req.body,
  });

  await prisma.businessAdvertisement.create({
    data: {
      userId: req.body.userId,
      listingid: req.body.listingid,
    },
  });

  res.status(201).json({
    message: "success",
  });
});

exports.getMedia = catchAsync(async (req, res, next) => {
  const data = await prisma.businessMedia.findMany({
    where: {
      businessUsersId: req.body.userId,
    },
  });

  res.status(200).json({
    message: "success",
    data,
  });
});

exports.deleteMedia = catchAsync(async (req, res, next) => {
  await prisma.businessMedia.deleteMany({
    where: {
      id: req.params.id,
    },
  });

  res.status(204).json({
    message: "deleted successully",
  });
});

exports.getSubscriptionDetails = catchAsync(async (req, res, next) => {
  await prisma.premiumUser.updateMany({
    where: {
      currentPlanEnd: {
        lt: currentDate,
      },
    },
    data: {
      planActive: false,
    },
  });

  const data = await prisma.premiumUser.findMany({
    where: {
      userId: req.body.userId,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  res.status(200).json({
    message: "success",
    data: data[0],
  });
});

exports.getSubscriptionHistory = catchAsync(async (req, res, next) => {
  const data = await prisma.$queryRaw`SELECT
    c.*, p.currentPlanStart, p.currentPlanEnd, p.planActive
    FROM
      subscription c
    LEFT JOIN
     premium_user p ON c.id = p.subscriptionId WHERE c.userId = ${req.body.userId}`;

  res.status(200).json({
    message: "success",
    data,
  });
});

exports.renewSubscription = catchAsync(async (req, res, next) => {
  const data = await prisma.subscription.create({
    data: {
      userId: req.body.userId,
      listingid: req.body.listingid,
      paymentId: req.body.userId,
    },
  });

  req.body.subscriptionId = data.id;
  req.body.planActive = true;
  req.body.currentPlanStart = isoFormattedCurrentDate;
  req.body.currentPlanEnd = isoFormattedFutureDate;

  await prisma.premiumUser.update({
    where: {
      userId: req.body.userId,
    },
    data: {
      subscriptionId: data.id,
      planActive: true,
      currentPlanStart: isoFormattedCurrentDate,
      currentPlanEnd: isoFormattedFutureDate,
    },
  });
});

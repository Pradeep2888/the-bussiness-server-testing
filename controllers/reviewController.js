const { PrismaClient } = require("@prisma/client");
const catchAsync = require("../utils/catchAsync");
const prisma = new PrismaClient();

const sendEmail = require("../utils/email");
const fs = require("fs");

exports.reportReview = catchAsync(async (req, res, next) => {
  const company = await prisma.businessPrimaryDetails.findFirst({
    where: {
      id: req.body.listingId,
    },
  });

  const user = await prisma.user.findFirst({
    where: {
      id: req.body.userId,
    },
  });

  await prisma.reviewReport.create({
    data: req.body,
  });

  let l = fs.readFileSync(__dirname + "/falging.html", "utf8");

  let z = l
    .replaceAll("{{name}}", user.name)
    .replaceAll("{{company}}", company.website);

  try {
    await sendEmail({
      email: user.email,
      subject: "Review Flagged for Moderation",
      html: z,
    });

    res.status(201).json({
      message: "success",
    });
  } catch (err) {
    return next(
      new AppError("There was an error sending the email. Try again later!"),
      500
    );
  }
});

exports.contactAdmin = catchAsync(async (req, res, next) => {
  req.body.question = req.body.message;
  delete req.body.message;

  await prisma.contactBusinessAdmin.create({
    data: req.body,
  });

  res.status(201).json({
    message: "success",
  });
});

exports.topReviews = catchAsync(async (req, res, next) => {
  const data =
    await prisma.$queryRaw`SELECT name,image FROM users WHERE isTOP = 1 `;

  res.status(200).json({
    message: "success",
    data,
  });
});

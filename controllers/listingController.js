const companyModal = require("../models/companyListingModal");
const reviewModal = require("../models/reviewModal");
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");
const sendEmail = require("../utils/email");

const natural = require("natural");

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const fs = require("fs");
const { URL } = require("url");

function ensureHttps(url) {
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    return "https://" + url;
  }
  return url;
}

exports.createCompanyListing = catchAsync(async (req, res, next) => {
  const securedUrl = ensureHttps(req.body.websiteLink);

  const existingListing = await prisma.businessPrimaryDetails.findFirst({
    where: {
      website: {
        contains: req.body.websiteLink,
      },
    },
  });

  if (existingListing) {
    if (existingListing.taken) {
      const data = await prisma.businessUsers.findFirst({
        where: {
          id: existingListing.userid,
        },
        include: {
          details: true,
        },
      });

      data.password = undefined;
      data.static_code = undefined;
      data.acountType = undefined;
      data.complete = undefined;
      data.verified = undefined;
      data.verification = undefined;

      res.status(200).json({
        message: "success",
        status: 200,
        data,
      });
    } else {
      res.status(200).json({
        message: "success",
        status: 200,
        data: { details: [existingListing] },
      });
    }
  } else {
    const newListing = await prisma.businessPrimaryDetails.create({
      data: {
        website: securedUrl,
      },
    });

    res.status(200).json({
      message: "success",
      status: 200,
      data: { details: [newListing] },
    });
  }
});

exports.reviewPostHandler = catchAsync(async (req, res, next) => {
  const user = await prisma.businessUsers.findFirst({
    where: { id: req.body.matrix },
  });

  delete req.body.matrix;

  req.body.businessUserId = "";

  if (req.body.matrix) {
    req.body.businessUserId = req.body.matrix;
  }

  const review = await prisma.review.create({
    data: req.body,
  });

  if (user) {
    const message = ``;

    let x = fs.readFileSync(__dirname + "/newReview.html", "utf8");
    let l = fs.readFileSync(__dirname + "/reviewModration.html", "utf8");

    let y = x
      .replace("{{name}}", user.fname)
      .replace("{{link}}", ``)
      .replace("{{company}}", user.companyname);

    let z = l
      .replace("{{name}}", user.fname)
      .replace("{{link}}", ``)
      .replace("{{company}}", user.companyname);

    try {
      await sendEmail({
        email: user.email,
        subject: "Your listing just got a new review!",
        message,
        html: y,
      });

      await sendEmail({
        email: req.body.email,
        subject: "Your review is under moderation",
        message,
        html: z,
      });

      res.status(201).json({
        message: "success",
        status: 201,
        data: review,
      });
    } catch (err) {
      console.log(err);
      return next(
        new AppError("There was an error sending the email. Try again later!"),
        500
      );
    }
  } else {
    res.status(201).json({
      message: "success",
      status: 201,
      data: review,
    });
  }
});

exports.getReviewHandler = catchAsync(async (req, res, next) => {
  const reviews = await prisma.review.findMany({
    where: {
      listingId: req.query.id,
      active: true,
    },
    include: {
      user: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const avg = await prisma.$queryRaw`
   SELECT AVG(rating) AS average_rating
   FROM reviews
   WHERE listingId = ${req.query.id} AND active = 1;
  `;

  res.status(200).json({
    message: "success",
    status: 200,
    data: reviews,
    avg,
  });
});

exports.claimListingHandler = catchAsync(async (req, res, next) => {
  const code = require("crypto").randomBytes(14).toString("hex");
  const message = `your verification link \n https://reviewsix.vercel.app/api/v1/company/listing/verify/${code}/${req.body.userId}`;

  const review = await prisma.companyListing.update({
    where: {
      id: req.body.id,
    },
    data: {
      verifyCode: code,
    },
  });

  try {
    await sendEmail({
      email: req.body.email,
      subject: "Your email verification code",
      message,
    });

    res.status(200).json({
      message: "success",
      status: 200,
      data: review,
    });
  } catch (err) {
    return next(
      new AppError("There was an error sending the email. Try again later!"),
      500
    );
  }
});

exports.RegNewListing = catchAsync(async (req, res, next) => {

  console.log(req.body)
  try {
    const isListed = await prisma.business_listing.findFirst({
      where: {
        websiteLink: req.body.websiteLink,
      },
    });

    const newListing = await prisma.business_listing.create({
      data: { ...req.body },
    });

    res.status(200).json({
      message: "success",
      status: 200,
    });

  }
  catch (error) {
    console.log(error)
    res.status(200).json({
      message: "success",
      status: 200,
    });

  }
});

exports.findRegCompany = catchAsync(async (req, res, next) => {
  const listing = await prisma.companyListing.findFirst({
    where: {
      id: req.params.id,
    },
  });

  res.status(200).json({
    message: "success",
    status: 200,
    data: listing,
  });
});

exports.updateListing = catchAsync(async (req, res, next) => {
  const updatedListing = await prisma.companyListing.update({
    where: {
      id: req.body.id,
    },
    data: {
      about: req.body.about,
      address: req.body.address,
      categoryId: req?.body?.categoryId?.toLowerCase(),
      companyName: req.body.companyName,
      email: req.body.email,
      logo: req.body.logo,
      phone: req.body.phone,
      city: req.body.city,
      pincode: req.body.pincode,
      physical: req.body.physical,
    },
  });

  res.status(200).json({
    message: "success",
    status: 200,
    data: updatedListing,
  });
});

exports.verifiyListingConfirmation = catchAsync(async (req, res, next) => {
  const isList = await prisma.companyListing.findFirst({
    where: {
      verifyCode: req.params.vcode,
      status: false,
    },
  });

  if (isList) {
    await prisma.companyListing.updateMany({
      where: {
        verifyCode: req.params.vcode,
      },
      data: {
        status: true,
        userId: req.params.uid,
      },
    });

    res.send("<h3>verification complete check your account</h3>");
  } else {
    res.send("<p style='text-align:center;color:red;'>Link expire .....</p>");
  }
});

exports.listingByCateController = catchAsync(async (req, res, next) => {
  const page = req.query.page * 1 || 1;
  const skip = (page - 1) * 8;

  req.params.id = req.params.id.replaceAll("-", " ");

  const data = await prisma.$queryRaw`
  SELECT
    c.*,
    CAST(AVG(r.rating) AS DECIMAL(10, 2)) AS averageRating,
    CAST(COUNT(r.id) AS DECIMAL(10, 0)) AS totalReviews,
    business_users.companyname
  FROM
    business_primary_details c
  LEFT JOIN
    reviews r ON c.id = r.listingId
  LEFT JOIN
  business_users ON c.userid = business_users.id
  WHERE
    c.category LIKE  CONCAT('%', ${req.params.id}, '%')
  GROUP BY
    c.id
  LIMIT
    8
  OFFSET
    ${skip};
`;

  const size = await prisma.$queryRaw`
  SELECT
    COUNT(id) AS size
  FROM
  business_primary_details
  WHERE
    category = ${req.params.id};
`;

  function toJson(data) {
    return JSON.stringify(data, (_, v) =>
      typeof v === "bigint" ? `${v}n` : v
    ).replace(/"(-?\d+)n"/g, (_, a) => a);
  }

  res.status(200).json({
    message: "success",
    length: +toJson(size[0].size) || 0,
    data,
  });
});

exports.getListingPremiumStatus = catchAsync(async (req, res, next) => {
  const listing = await prisma.businessPrimaryDetails.findFirst({
    where: {
      website: {
        contains: req.body.websiteLink,
      },
    },
  });

  let PremiumDetails;
  if (listing) {
    PremiumDetails = await prisma.premiumUser.findFirst({
      where: {
        listingid: listing.id,
      },
    });
  }

  if (!PremiumDetails) {
    return res.status(200).json({
      message: "success",
      data: {
        hasp: false,
      },
    });
  }

  if (PremiumDetails && PremiumDetails.currentPlanEnd < Date.now()) {
    return res.status(200).json({
      message: "success",
      data: {
        hasp: false,
      },
    });
  }

  return res.status(200).json({
    message: "success",
    data: {
      hasp: true,
    },
  });
});

exports.getReviewByCategory = catchAsync(async (req, res, err) => {
  let data = await prisma.businessPrimaryDetails.findMany({
    where: {
      category: {
        contains: req.params.id,
      },
    },
    include: {
      Review: true,
    },
  });

  data = data
    .flatMap((e) =>
      e.Review.map((l) => ({ ...l, websiteLink: e.website, logo: e.icon }))
    )

    .filter((e) => e.active === true);

  res.status(200).json({
    message: "success",
    data,
  });
});

exports.replyUserReviews = catchAsync(async (req, res, err) => {
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

exports.lisingCategory = catchAsync(async (req, res, err) => {
  const page = req.query.page || 1;
  const limit = 18;
  const skip = limit * (page - 1);
  const patter =
    req.query.filter && req.query.filter.length === 1 ? req.query.filter : "A";

  const filterQuery = req.query.filter ? { title: { startsWith: patter } } : {};

  let data;
  if (!req.query.puchi) {
    data = await prisma.category.findMany({
      skip: skip,
      take: limit,
      orderBy: {
        title: "asc",
      },
      where: {
        ...filterQuery,
      },
    });
  } else {
    data = await prisma.category.findMany({});
  }

  const length = await prisma.category.count({
    where: {
      ...filterQuery,
    },
  });

  res.status(200).json({
    message: "success",
    data,
    length,
  });
});

exports.getTopCategory = catchAsync(async (req, res, err) => {
  const data = await prisma.category.findMany({
    where: {
      onTop: true,
    },
    take: 5,
  });

  res.status(200).json({
    message: "success",
    data,
  });
});

exports.getListingAdvertisment = catchAsync(async (req, res, err) => {
  const data = await prisma.businessAdvertisement.findMany({
    where: {
      listingid: req.params.id,
    },
  });

  console.log(data);

  res.status(200).json({
    message: "success",
    data,
  });
});

exports.getListingMedia = catchAsync(async (req, res, err) => {
  const data = await prisma.businessMedia.findMany({
    where: {
      listingId: req.params.id,
    },
  });

  res.status(200).json({
    message: "success",
    data,
  });
});

exports.ListingSearch = catchAsync(async (req, res, next) => {
  const searchQuery = req.params.id.toLowerCase();
  const allDocuments = await prisma.businessPrimaryDetails.findMany();
  const results = [];

  console.log(searchQuery);

  const queryTokens = searchQuery.split(" ");

  for (const doc of allDocuments) {
    const url = new URL(ensureHttps(doc.website));

    const domain = url.hostname.toLowerCase();

    const domainTokens = domain.split(".");
    const titleScore = calculateSimilarityScore(queryTokens, domainTokens);

    if (titleScore > 0.5) {
      results.push(doc);
    }
  }

  const top5Results = results.slice(0, 5);

  res.status(200).json({
    message: "success",
    results: top5Results,
  });
});

function calculateSimilarityScore(queryTokens, documentTokens) {
  const score = queryTokens.reduce((totalScore, queryToken) => {
    const tokenScores = documentTokens.map(
      (documentToken) =>
        1 -
        natural.LevenshteinDistance(queryToken, documentToken) /
        Math.max(queryToken.length, documentToken.length)
    );

    return totalScore + Math.max(...tokenScores);
  }, 0);

  return score / queryTokens.length;
}

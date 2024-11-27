const User = require("../models/userModel");
const catchAsync = require("../utils/catchAsync");
const crypto = require("crypto");
const sendEmail = require("../utils/email");
const AppError = require("../utils/appError");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const dns = require("dns");

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const fs = require("fs");
const path = require("path");

function ensureHttps(url) {
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    return "https://" + url;
  }
  return url;
}

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user.id);

  const jwtExpiresInMilliseconds =
    parseInt(process.env.JWT_EXPIRES_IN) * 24 * 60 * 60 * 1000;

  const cookieOptions = {
    expires: new Date(Date.now() + jwtExpiresInMilliseconds),
    httpOnly: true,
    sameSite: "None",
  };

  if (process.env.NODE_ENV === "production") cookieOptions.secure = true;

  res.cookie("jwt", token, cookieOptions);

  user.password = undefined;

  res.status(statusCode).json({
    status: "success",
    token,
  });
};

function checkDomainExistence(domain) {
  return new Promise((resolve, reject) => {
    dns.resolve(domain, (err) => {
      if (err) {
        if (err.code === "ENOTFOUND") {
          resolve(false);
        } else {
          reject(err);
        }
      } else {
        resolve(true);
      }
    });
  });
}

function removeHttpsAndWww(url) {
  let cleanedUrl = url?.replace("www.", "");

  return cleanedUrl;
}

exports.businessUserSignup = catchAsync(async (req, res, next) => {
  req.body.website = ensureHttps(req.body.website);
  req.body.website = removeHttpsAndWww(req.body.website);

  if (req.body.website) {
    try {
      const exists = await checkDomainExistence(
        req.body.website.replace(/^(https?|ftp):\/\//, "")
      );

      if (!exists) {
        return res.status(401).json({
          message: "invalid website",
        });
      }
    } catch (error) {
      return res.status(401).json({
        message: "invalid website",
      });
    }
  }

  const varificationToken = crypto.randomBytes(24).toString("hex");

  if (req.body.static_code && req.body.acountType === "gmail") {
    req.body.static_code = await bcrypt.hash(req.body.static_code, 10);
  }

  const Taken = await prisma.businessPrimaryDetails.findFirst({
    where: {
      website: {
        contains: req.body.website,
      },
    },
  });

  if (Taken && Taken.taken) {
    return res.status(404).json({
      message:
        "This website has already been registered. Please use a different website or contact support for assistance.",
      status: "fail",
    });
  }

  let newUser;

  if (!Taken || Taken?.taken === false) {
    newUser = await prisma.businessUsers.create({
      data: {
        verification: varificationToken,
        ...req.body,
      },
    });
  }

  if (Taken && Taken.website) {
    await prisma.businessPrimaryDetails.update({
      where: { id: Taken.id },
      data: {
        taken: true,
        userid: newUser.id,
        address: req.body.address,
        phone: req.body.phone,
        companyname: req.body.companyname,
        workemail: req.body.email,
      },
    });
  } else {
    await prisma.businessPrimaryDetails.create({
      data: {
        website: req.body.website,
        taken: true,
        userid: newUser.id,
        address: req.body.address,
        phone: req.body.phone,
        companyname: req.body.companyname,
        workemail: req.body.email,
      },
    });
  }

  const filePath = path.join(
    __dirname,
    "..",
    "/controllers/accountRegister.html"
  );

  const hog = fs.readFileSync(filePath, "utf8");

  const message = `https://business.thebusinessrating.com/password/${varificationToken}/${newUser.id}`;

  try {
    await sendEmail({
      email: req.body.email,
      subject: "Your Account Verification",
      html: hog
        .replace("{{link}}", message)
        .replace("{{name}}", req.body.fname),
    });

    createSendToken(newUser, 201, res);
  } catch (err) {
    return next(
      new AppError("There was an error sending the email. Try again later!"),
      500
    );
  }
});

exports.completePasswordVerification = catchAsync(async (req, res, next) => {
  if (!req.body.token && !req.body.id) {
    res.status(401).json({
      message: "verification complete! unauthorized user",
    });
  }

  const user = await prisma.businessUsers.findFirst({
    where: { verification: req.body.token, id: req.body.id, verified: false },
  });

  if (!user) {
    res.status(401).json({
      message: "verification complete! unauthorized user",
    });
  }

  if (user && user.acountType === "gmail") {
    await prisma.businessUsers.updateMany({
      where: {
        id: user.id,
      },
      data: {
        verified: true,
      },
    });

    res.status(203).json({
      message: "verification complete",
    });
  }

  if (user && user.acountType === "regular") {
    res.status(200).json({
      message: "verification complete",
    });
  }
});

exports.updatedpassword = catchAsync(async (req, res, next) => {
  if (!req.body.password) {
    res.status(400).json({
      message: "invalid data. please complete the filds",
    });
  }

  req.body.password = await bcrypt.hash(req.body.password, 10);

  await prisma.businessUsers.update({
    where: {
      id: req.body.id,
      verified: false,
    },
    data: {
      password: req.body.password,
      verified: true,
    },
  });

  res.status(202).json({
    message: "Password updated successfully",
  });
});

exports.businessUserLogin = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new AppError("Please provide email and password!", 400));
  }

  const user = await prisma.businessUsers.findFirst({
    where: {
      email: email,
    },
  });

  if (!user) {
    return next(new AppError("Incorrect email or password", 401));
  }

  if (user && user.acountType === "regular") {
    if (!(await bcrypt.compare(password, user.password))) {
      return next(new AppError("Incorrect email or password", 401));
    }
  } else if (user && user.acountType === "gmail") {
    if (!(await bcrypt.compare(password, user.static_code))) {
      return next(new AppError("Incorrect email or password", 401));
    }
  }

  createSendToken(user, 200, res);
});

exports.validBusinessUser = (req, res, next) => {
  let token = req.headers["authorization"]?.split(" ")[1];

  try {
    if (!token || req.headers["authorization"]?.split(" ")[0] !== "Bearer") {
      return res.status(401).json({
        status: 401,
        message: "Unauthorized Access. Please log in again",
      });
    }

    const isVerified = jwt.verify(token, process.env.JWT_SECRET);

    if (isVerified) {
      req.body.userId = isVerified.id;
      next();
    }
  } catch (error) {
    if (error) {
      if (
        error.message === "invalid token" ||
        error.name === "JsonWebTokenError"
      ) {
        return res.status(401).json({
          status: 401,
          message: "Unauthorized Access. Please log in again",
        });
      }
      if (
        error.message === "jwt expired" ||
        error.name === "TokenExpiredError"
      ) {
        return res.status(401).json({
          status: 401,
          message: "Session Expired. Please log in again",
        });
      }
    }

    return res.status(500).json({
      message: "Internal Server Error",
      text: "Something went wrong. Try again",
    });
  }
};

exports.updateBusinessUserPassword = catchAsync(async (req, res, next) => {
  const user = await User.findOne({ id: req.body.userId }).select("+password");

  if (
    !user ||
    !(await user.correctPassword(req.body.password, user.password))
  ) {
    return next(new AppError("Incorrect password", 401));
  }

  const p = await bcrypt.hash(req.body.newpassword, 12);

  const updated = await User.findByIdAndUpdate(
    { id: req.body.userId },
    { password: p }
  );

  res.status(200).json({
    status: "success",
    updated,
  });
});

const User = require("../models/userModel");
const catchAsync = require("../utils/catchAsync");
const crypto = require("crypto");
const sendEmail = require("../utils/email");
const AppError = require("../utils/appError");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const fs = require("fs");

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user.id);

  user.password = undefined;

  res.status(statusCode).json({
    status: "success",
    token,
    data: {
      user,
    },
  });
};

exports.userSignup = catchAsync(async (req, res, next) => {
  const varificationToken = crypto.randomBytes(24).toString("hex");

  const cryptPassword = await bcrypt.hash(req.body.password, 12);

  const newUser = await prisma.user.create({
    data: {
      name: req.body.name,
      email: req.body.email,
      password: cryptPassword,
      verification: varificationToken,
    },
  });

  const message = ``;

  let x = fs.readFileSync(__dirname + "/accountRegister.html", "utf8");

  let y = x
    .replace("{{name}}", req.body.name)
    .replace(
      "{{link}}",
      `https://reviewsix.vercel.app/api/v1/u-verify/${varificationToken}/${newUser.id}`
    );

  try {
    await sendEmail({
      email: req.body.email,
      subject: "Email Verification: Thank you for registering with us!",
      message,
      html: y,
    });

    createSendToken(newUser, 201, res);
  } catch (err) {
    return next(
      new AppError("There was an error sending the email. Try again later!"),
      500
    );
  }
});

exports.userLogin = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new AppError("Please provide email and password!", 400));
  }

  const user = await prisma.user.findFirst({
    where: {
      email: email,
    },
  });

  if (!user || !(await bcrypt.compare(password, user.password))) {
    return next(new AppError("Incorrect email or password", 401));
  }

  createSendToken(user, 200, res);
});

exports.validUser = (req, res, next) => {
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

// exports.updatePassword = catchAsync(async (req, res, next) => {
//   const user = await User.findOne({ id: req.body.userId }).select("+password");

//   if (
//     !user ||
//     !(await user.correctPassword(req.body.password, user.password))
//   ) {
//     return next(new AppError("Incorrect password", 401));
//   }

//   const p = await bcrypt.hash(req.body.newpassword, 12);

//   const updated = await User.findByIdAndUpdate(
//     { id: req.body.userId },
//     { password: p }
//   );

//   res.status(200).json({
//     status: "success",
//     updated,
//   });
// });

exports.updatePassword = catchAsync(async (req, res, next) => {
  // Fetch the user by ID and include the password field
  const user = await prisma.user.findUnique({
    where: { id: req.body.userId },
    select: { password: true },
  });

  // Check if user exists and if the current password is correct
  if (!user || !(await bcrypt.compare(req.body.password, user.password))) {
    return next(new AppError("Incorrect password", 401));
  }

  // Hash the new password
  const hashedPassword = await bcrypt.hash(req.body.newpassword, 12);

  // Update the user's password
  const updatedUser = await prisma.user.update({
    where: { id: req.body.userId },
    data: { password: hashedPassword },
  });

  // Respond with success
  res.status(200).json({
    status: "success",
    data: updatedUser,
  });
});


exports.verifyUserLink = catchAsync(async (req, res, next) => {
  const isUser = await prisma.user.findUnique({
    where: {
      id: req.params.uid,
      verification: req.params.vcode,
      verified: false,
    },
  });

  if (isUser) {
    await prisma.user.updateMany({
      where: {
        id: req.params.uid,
      },
      data: {
        verified: true,
      },
    });

    res.redirect("https://thebusinessrating.com");
    // res.send(`<h3 style='text-align:center;'>Verification complete</h3>`);
  } else {
    res.send(`<p style='text-align:center;color:red;'>Link expired ...</p>`);
  }
});

//8921657a-4500-413f-9aed-c7630e03c1a8
//91155c07-57fe-4d71-b04f-eaa85a3c3693

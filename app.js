const express = require("express");
const helmet = require("helmet");

const bodyParser = require("body-parser");
const cors = require("cors");

const dotenv = require("dotenv");
var cookieParser = require("cookie-parser");

const AppError = require("./utils/appError");
const globalErrorHandler = require("./controllers/errorController");

const userRouter = require("./routes/userRoutes");
const contentRouter = require("./routes/contentRoutes");

const companyRouter = require("./routes/companyListing");
const adminRoutes = require("./routes/adminRoutes");
const reviewRoutes = require("./routes/reviewsRoutes");
const businessRoute = require("./routes/businessRoutes/businessUserRoutes");

dotenv.config({ path: "./config.env" });
dotenv.config({ path: "./config.env" });

const app = express();
const port = process.env.PORT || 3000;

// Connect to MongoDB

// Middleware
app.use(express.static(`${__dirname}`));
app.use(bodyParser.json({ limit: "10mb" }));
app.use(bodyParser.urlencoded({ extended: true, limit: "10mb" }));
app.use(express.json());
app.use(helmet());
app.use(express.json());
app.use(cookieParser());

// Enable CORS
app.use(
  cors({
    origin: [
      "https://business.thebusinessrating.com",
      "https://thebusinessrating.com",
      "https://thepreview.pro",
      "https://uploadimage.thebusinessrating.com",
      "http://localhost:5173",
      "http://localhost:5174",
    ],
    credentials: true,
  })
);



// Testing Root route
app.get("/", (req, res) => {
  console.log()
  res.send({
    message:req.headers
  });
});

// Routes
app.use("/api/v1", userRouter);
app.use("/api/v1/admin", adminRoutes);
app.use("/api/v1/company", companyRouter);
app.use("/api/v1/content", contentRouter);
app.use("/api/v1/review", reviewRoutes);
app.use("/api/v1/business", businessRoute);

// Handle undefined routes
// app.all("*", (req, res, next) => {
//   next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
// });

// Global error handling
app.use(globalErrorHandler);

// Start the server
const server = app.listen(port, () => {
  console.log(`App running on port ${port}...`);
});

// Handle unhandled rejections
process.on("unhandledRejection", (err) => {
  console.log("UNHANDLED REJECTION! 💥 Shutting down...");
  console.log(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});

// Handle uncaught exceptions
process.on("uncaughtException", (err) => {
  console.log("UNCAUGHT EXCEPTION! 💥 Shutting down...");
  console.log(err.name, err.message);
  process.exit(1);
});

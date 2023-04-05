// dotenv config
require("dotenv").config();
// async errors config
require("express-async-errors");

// express config
const express = require("express");
const app = express();

// rest of the packages
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const fileUpload = require("express-fileupload");
const rateLimiter = require("express-rate-limit");
const helmet = require("helmet");
const xss = require("xss-clean");
const cors = require("cors");
const mongoSanitize = require("express-mongo-sanitize");

// error handlers
const notFoundMiddleware = require("./middleware/not-found");
const errorHandlerMiddleware = require("./middleware/error-handler");

// database config
const connectDB = require("./db/connect");

// router config
const authRouter = require("./routes/authRoutes");

// middleware config
app.set("trust proxy", 1);
app.use(rateLimiter({ windowMs: 15 * 60 * 1000, max: 60 }));
app.use(helmet());
app.use(cors());
app.use(xss());
app.use(mongoSanitize());

app.use(morgan("tiny"));
app.use(express.json());
app.use(fileUpload());
app.use(cookieParser(process.env.JWT_SECRET));
app.use(express.static("./public"));

// home route
app.get("/", (req, res) => {
  res.send("<h1>Welcome to my blog app!</h1>");
});
app.get("/api/v1", (req, res) => {
  console.log(req.signedCookies);
  res.send("<h1>Welcome to my blog app!</h1>");
});

// routes
app.use("/api/v1/auth", authRouter);

app.use(notFoundMiddleware);
app.use(errorHandlerMiddleware);

// server config
const port = process.env.PORT || 5000;
const start = async () => {
  try {
    await connectDB(process.env.MONGO_URL);
    app.listen(port, () => {
      console.log(`Server listening on port ${port}`);
    });
  } catch (error) {
    console.error(error);
  }
};

start();

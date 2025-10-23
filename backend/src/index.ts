import path from "path";
import dotenv from "dotenv";

// Force load from project root (works in dev + prod)
dotenv.config({ path: path.resolve(process.cwd(), ".env") });
console.log("Loaded env from:", path.resolve(process.cwd(), ".env"));

import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import { authRouter } from "./routes/authRouter";
import { userRouter } from "./routes/userRouter";
import { dbConnect } from "./config/mongoose";
import session from "express-session";
import { initPassport } from "./services/passportAuth";

const app = express();
const PORT = process.env.PORT || 4000;

app.use(
  session({
    secret: process.env.SESSION_SECRET || "temporary_secret",
    resave: false,
    saveUninitialized: false,
  }),
);

const passport = initPassport();
app.use(passport.initialize());
app.use(passport.session());
app.use(express.json());
app.use(cors({ credentials: true }));
app.use(cookieParser());

// API ENDPOINTS-
app.use("/api/auth", authRouter(passport));
app.use("/api/user", userRouter);

const startServer = async () => {
  try {
    // connecting to db
    await dbConnect();
    app.listen(PORT, () => {
      console.log("💻Server started on PORT:", PORT);
    });
  } catch (err) {
    console.error("Failed to connect to MongoDB:", err);
    process.exit(1); // exit if DB connection fails
  }
};

startServer();

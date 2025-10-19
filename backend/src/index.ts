import dotenv from "dotenv";

// Force load from project root (works in dev + prod)
dotenv.config({ path: path.resolve(process.cwd(), ".env") });
console.log("Loaded env from:", path.resolve(process.cwd(), ".env"));
console.log(process.env);
console.log("MONGODB_URL:", process.env.MONGODB_URL);

import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import { authRouter } from "./routes/authRouter.js";
import { userRouter } from "./routes/userRouter.js";
import { dbConnect } from "./config/mongoose.js";
import path from "path";

const app = express();
const PORT = process.env.PORT || 4000;

app.use(express.json());
app.use(cors({ credentials: true }));
app.use(cookieParser());

// API ENDPOINTS-
app.use("/api/auth", authRouter);
app.use("/api/user", userRouter);

const startServer = async () => {
  try {
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

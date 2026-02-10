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
import { redisConnect } from "./config/redis";
import { streamRouter } from "./routes/streamRouter";
import { initSocket } from "./config/socket";
import http from "http";

const app = express();
const PORT = process.env.PORT || 4000;
const server = http.createServer;

app.use(express.json());
app.use(cors({ credentials: true }));
app.use(cookieParser());

// API ENDPOINTS-
app.use("/api/auth", authRouter());
app.use("/api/user", userRouter);
app.use("/api/stream", streamRouter);

const startServer = async () => {
  try {
    // connecting to db
    await dbConnect();

    // connecting to redis
    await redisConnect();

    // await socket.io server connection
    await initSocket(server);

    app.listen(PORT, () => {
      console.log("💻Server started on PORT:", PORT);
    });
  } catch (err) {
    console.error("Failed to start the server:", err);
    process.exit(1); // exit if DB connection fails
  }
};

startServer();

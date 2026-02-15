import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import { authRouter } from "./routes/authRouter";
import { userRouter } from "./routes/userRouter";
import { dbConnect } from "@shared/ontos/";
import { streamRouter } from "./routes/streamRouter";

const app = express();
const PORT = process.env.API_GATEWAY_PORT;

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

    app.listen(PORT, () => {
      console.log("💻api-gateway started on PORT:", PORT);
    });
  } catch (err) {
    console.error("Failed to start the server:", err);
    process.exit(1); // exit if DB connection fails
  }
};

startServer();

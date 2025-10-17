import express from "express";
import cors from "cors";
import { authRouter } from "./routes/authRouter.js";

const app = express();
const PORT = process.env.PORT || 4000;

app.use(express.json());
app.use(cors({ credentials: true }));

// API ENDPOINTS-
app.use("/auth", authRouter);

app.listen(PORT, () => {
  console.log("server started on PORT:", PORT);
});

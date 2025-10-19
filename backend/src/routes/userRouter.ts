import { Router } from "express";
import { search } from "../controller/search.js";

export const userRouter = Router();

userRouter.post("/search", search);

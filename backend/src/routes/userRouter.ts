import { Router } from "express";
import { followXUnfollow } from "../controller/user/follow";
import { authVerify } from "../middlewares/jwtVerify";
import { search } from "../controller/user/search";
import { getFollowers } from "../controller/user/followers";

export const userRouter: Router = Router();

userRouter.get("/search", search);
userRouter.post("/follow", authVerify, followXUnfollow);
userRouter.get("/:userId/followers", authVerify, getFollowers);

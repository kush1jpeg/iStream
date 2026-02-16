import { Router } from "express";
import { followXUnfollow } from "../controller/user/followUnfollow";
import { authVerify } from "../middlewares/jwtVerify";
import { search } from "../controller/user/search";
import { getFollowers } from "../controller/user/followers";
import { getFollowing } from "../controller/user/follows";
import { getNotifications } from "../controller/user/getNotifs";

export const userRouter: Router = Router();

userRouter.get("/search", search);
// userRouter.get("/:userId/stats", getUserStats); // full Userinfo;
// userRouter.put("/me", authVerify, updateMyProfile);
userRouter.post("/follow", authVerify, followXUnfollow);
userRouter.get("/:userId/followers", getFollowers);
userRouter.get("/:userId/following", getFollowing);
// userRouter.get("/:streamId/like", authVerify, likeXUnlike);
userRouter.get("/notify", authVerify, getNotifications);

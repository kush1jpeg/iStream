import { Router } from "express";
import { followXUnfollow } from "../controller/user/followUnfollow";
import { authVerify } from "../middlewares/jwtVerify";
import { search } from "../controller/user/search";
import { getFollowers } from "../controller/user/followers";
import { getFollowing } from "../controller/user/follows";
import {
  getNotifications,
  updateLastReadNotification,
} from "../controller/user/getNotifs";
import { updateProfile } from "../controller/user/updateProfile";
import { getProfile } from "../controller/user/getProfile";
import { createOrder } from "../controller/payment/superchat/createOrder";
import { verifyPayment } from "../controller/payment/superchat/verifyCallback";
import { getUserById } from "../controller/user/getUserStats";
import { followingLiveSSE } from "../controller/user/sidebarSSE";
import { getSignedLink } from "../controller/user/getSignedLink";
import {
  uploadAvatar,
  uploadBanner,
} from "../controller/user/uploadUserCloudinary";

export const userRouter: Router = Router();

userRouter.get("/search", search);
userRouter.get("/:userId/stats", getUserById); // full Userinfo;
userRouter.get("/me", authVerify, getProfile);
userRouter.patch("/me", authVerify, updateProfile); // partial updates
userRouter.post("/follow", authVerify, followXUnfollow);
userRouter.get("/:userId/followers", getFollowers);
userRouter.get("/:userId/following", getFollowing);
// userRouter.get("/:streamId/like", authVerify, likeXUnlike);
userRouter.get("/notify", authVerify, getNotifications);

userRouter.post("/upload/avatar", authVerify, uploadAvatar);
userRouter.get(
  "/get/signed-link?type=avatar|banner|thumbnail",
  authVerify,
  getSignedLink,
);
userRouter.post("/upload/banner", authVerify, uploadBanner);

userRouter.get("/sidebar/update", authVerify, followingLiveSSE);
userRouter.post(
  "/update/lastReadNotif",
  authVerify,
  updateLastReadNotification,
);

// superchat
userRouter.post("/superchat", authVerify, createOrder);
userRouter.post("/rzp/verify", authVerify, verifyPayment);

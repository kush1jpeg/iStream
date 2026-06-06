import { Router } from "express";
import { authVerify } from "../middlewares/jwtVerify";
import { isVerified } from "../middlewares/verified";
import { startStream } from "../controller/stream/startStream";
import { initiateStream } from "../controller/stream/initiateStream";
import { deleteStream } from "../controller/stream/deleteStream";
import { getAvailableLiveStreams } from "../controller/stream/getLiveStreams";
import { getIStream } from "../controller/stream/getIStream";
import { createOrder } from "../controller/payment/superchat/createOrder";
import { verifyPayment } from "../controller/payment/superchat/verifyCallback";
import { endStream } from "../controller/stream/endStream";
import { uploadThumbnail } from "../controller/stream/uploadStreamCloudinary";
import { getStreamId } from "../controller/stream/getStreamId";
import { likeStream } from "../controller/stream/likeStream";
import { getAvailableVods } from "../controller/stream/getVOD";
import { listHomePage } from "../controller/stream/listHomePage";

export const streamRouter: Router = Router();

// user: payments + hls serve
streamRouter.get("/live", getAvailableLiveStreams); // returns all active live streams
streamRouter.get("/vod", getAvailableVods); // returns all past iStreams(vod)
streamRouter.get("/home", listHomePage);
streamRouter.get("/getId", getStreamId);
streamRouter.get("/:streamId", getIStream);
streamRouter.post("/:streamId/end", authVerify, isVerified, endStream);
streamRouter.delete("/:streamId/delete", authVerify, isVerified, deleteStream);

streamRouter.post("/:streamId/superchat-initiate", authVerify, createOrder);
streamRouter.post("/:streamId/superchat-verify", verifyPayment);

streamRouter.post("/initiate", authVerify, isVerified, initiateStream);
streamRouter.post("/start", authVerify, isVerified, startStream);
streamRouter.post("/upload/thumbnail", authVerify, isVerified, uploadThumbnail);
streamRouter.post("/like/:streamId", authVerify, likeStream);

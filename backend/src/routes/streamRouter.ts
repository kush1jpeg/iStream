import { Router } from "express";
import { authVerify } from "../middlewares/jwtVerify";
import { isVerified } from "../middlewares/verified";
import { startStream } from "../controller/stream/startStream";
import { initiateStream } from "../controller/stream/initiateStream";
import { deleteStream } from "../controller/stream/deleteStream";
import { getLiveStreams } from "../controller/stream/getLiveStreams";
import { getIStream } from "../controller/stream/getIStream";
import { createOrder } from "../controller/payment/superchat/createOrder";
import { verifyPayment } from "../controller/payment/superchat/verifyCallback";
import { endStream } from "../controller/stream/endStream";

export const streamRouter: Router = Router();

// user: payments + hls serve
streamRouter.get("/live", getLiveStreams); // returns all active live streams
streamRouter.get("/:streamId", getIStream);
streamRouter.post("/:streamId/superchat-initiate", createOrder);
streamRouter.post("/:streamId/superchat", verifyPayment);

streamRouter.post("/initiate", authVerify, isVerified, initiateStream);
streamRouter.post("/start", authVerify, isVerified, startStream);

streamRouter.post("/:streamId/end", authVerify, isVerified, endStream);
streamRouter.delete("/:streamId/delete", authVerify, isVerified, deleteStream);

// *** make FFmpeg write using streamId instead of streamKey: to not expose streamkey in the hls url ,
// and also hash the stream key; for further shite protection

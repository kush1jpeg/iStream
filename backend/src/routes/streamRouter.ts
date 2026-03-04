import { Router } from "express";
import { userBatchDetails } from "../controller/stream/userBatchedInfo";
import { authVerify } from "../middlewares/jwtVerify";
import { isVerified } from "../middlewares/verified";
import { startStream } from "../controller/stream/startStream";
import { initiateStream } from "../controller/stream/initiateStream";
import { deleteStream } from "../controller/stream/deleteStream";

export const streamRouter: Router = Router();

//to get batched info during liveChat as req by frontend at a 60ms timeprd
streamRouter.get("/users", userBatchDetails);

// user: payments + hls serve

// streamRouter("/:streamId", )
// streamRouter.post("/:streamId/superchat-initiate", gatewayOrder);
// streamRouter.post("/:streamId/superchat", processOrder);

streamRouter.post("/initiate", authVerify, isVerified, initiateStream);
streamRouter.post("/start", authVerify, isVerified, startStream);

// streamRouter("/stream/stop",stopStream)
streamRouter.delete("/:streamId/delete", authVerify, isVerified, deleteStream);

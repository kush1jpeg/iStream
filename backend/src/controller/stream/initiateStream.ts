import type { Request, Response } from "express";
import crypto from "crypto";
import { streamModel } from "../../models/stream";
const rtmpUrl = Number(process.env.REDIS_PORT) || 6379;

export const initiateStream = async (req: Request, res: Response) => {
  const { title, description, tags } = req.body;
  if (!title || !tags) {
    return res.status(400).json({ message: "Title and tags are required" });
  }
  const streamKey = crypto.randomBytes(15).toString("hex");
  const streamKeyHash = crypto
    .createHash("sha256")
    .update(streamKey)
    .digest("hex");

  //Verify by hashing incoming key in mediamtx
  const stream = await streamModel.create({
    streamerId: req.id,
    title,
    description,
    tags,
    streamKeyHash,
  });

  return res.status(201).json({
    success: true,
    message:
      "Stream initialized. Copy the stream key now — it will not be shown again.",
    data: {
      title,
      streamId: stream._id,
      streamKey: streamKey,
      rtmpUrl,
    },
  });
};

import type { Request, Response } from "express";
import crypto from "crypto";
import { streamModel } from "../../models/stream";
import { getFullLink } from "../user/getSignedLink";
const rtmpUrl = process.env.RTMP_URL || "rtmp://localhost:1935/live";

export const initiateStream = async (req: Request, res: Response) => {
  const { title, description, tags } = req.body;
  if (!title || !tags) {
    return res.status(400).json({ message: "Title and tags are required" });
  }
  const streamKey = crypto.randomBytes(15).toString("hex");

  const stream = await streamModel.create({
    streamerId: req.id,
    title,
    description,
    tags,
    streamKey,
    expiresAt: new Date(Date.now() + 0.5 * 60 * 60 * 1000), // 0.5 hour
  });

  return res.status(201).json({
    success: true,
    message:
      "Stream initialized. Copy the stream key now — it will not be shown again.",
    data: {
      title,
      tags,
      streamId: stream.id,
      streamKey,
      rtmpUrl,
    },
  });
};

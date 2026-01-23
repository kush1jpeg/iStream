import type { Request, Response } from "express";
import crypto from "crypto";

export const initiateStream = async (req: Request, res: Response) => {
  const { title, description, tags } = req.body;
  if (!title || !tags) {
    return res.status(400).json({ message: "Title is required" });
  }
  const streamKey = crypto.randomBytes(8).toString("hex");

  const stream = await Stream.create({
    streamerId: req.user.id, // injected by auth middleware
    title,
    description,
    tags,
    streamKeyHash,
    status: "ended", // default, explicit > implicit
  });
};

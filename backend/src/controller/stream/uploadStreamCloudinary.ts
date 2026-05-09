import type { Request, Response } from "express";
import { getFullLink } from "../user/getSignedLink";
import { streamModel } from "../../models/stream";

export const uploadThumbnail = async (req: Request, res: Response) => {
  const { publicId, streamId } = await req.body;
  const url = getFullLink(publicId);

  await streamModel.findByIdAndUpdate(streamId, { thumbnail: publicId });
  return res.status(200).json({ success: true, url });
};

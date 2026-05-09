import type { Request, Response } from "express";
import { userModel } from "../../models/user";
import { getFullLink } from "./getSignedLink";

export const uploadAvatar = async (req: Request, res: Response) => {
  const publicId = await req.body;
  const url = getFullLink(publicId);

  await userModel.findByIdAndUpdate(req.id, { avatar: publicId });
  return res.status(200).json({ success: true, url });
};

export const uploadBanner = async (req: Request, res: Response) => {
  const publicId = await req.body;
  const url = getFullLink(publicId);

  await userModel.findByIdAndUpdate(req.id, { banner: publicId });
  return res.status(200).json({ success: true, url });
};

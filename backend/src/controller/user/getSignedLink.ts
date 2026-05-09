import type { Request, Response } from "express";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const getSignedLink = async (req: Request, res: Response) => {
  const timestamp = Math.round(new Date().getTime() / 1000);
  const type = req.query.type;
  const secret = process.env.CLOUDINARY_API_SECRET;
  if (!secret) return;
  const signature = cloudinary.utils.api_sign_request(
    {
      timestamp,
      folder: type,
    },
    secret,
  );
  res.json({
    timestamp,
    signature,
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    folder: type,
  });
};

export const getFullLink = (publicId: string) => {
  return cloudinary.url(publicId);
};

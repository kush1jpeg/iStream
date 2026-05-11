import type { Request, Response } from "express";
import { userModel } from "../../models/user";
import { getFullLink } from "./getSignedLink";

export const uploadImage = async (req: Request, res: Response) => {
  try {
    const { publicId } = req.body;
    const type = req.query.type;

    if (!publicId) {
      return res.status(400).json({
        success: false,
        message: "Missing publicId",
      });
    }

    const url = getFullLink(publicId);

    await userModel.findByIdAndUpdate(req.id, {
      [type as string]: publicId,
    });

    return res.status(200).json({
      success: true,
      url,
    });
  } catch (err) {
    console.error("UPLOAD AVATAR ERROR:", err);

    return res.status(500).json({
      success: false,
      error: String(err),
    });
  }
};

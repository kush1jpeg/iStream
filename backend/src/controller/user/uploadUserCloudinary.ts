import type { Request, Response } from "express";
import { userModel } from "../../models/user";
import { getFullLink } from "./getSignedLink";

export const uploadImage = async (req: Request, res: Response) => {
  try {
    const { publicId } = req.body;
    const type = req.query.type as "avatar" | "banner";

    if (!publicId) {
      return res.status(400).json({
        success: false,
        message: "Missing publicId",
      });
    }

    if (!["avatar", "banner"].includes(type)) {
      return res.status(400).json({
        success: false,
        message: "Invalid type",
      });
    }

    const url = getFullLink(publicId);

    await userModel.findByIdAndUpdate(req.id, {
      [`${type}.value`]: publicId,
      [`${type}.isCloud`]: true,
    });

    return res.status(200).json({
      success: true,
      url,
    });
  } catch (err) {
    console.error("UPLOAD IMAGE ERROR:", err);

    return res.status(500).json({
      success: false,
      error: String(err),
    });
  }
};

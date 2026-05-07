import { Request, Response } from "express";
import { shopItemModel } from "../../../models/item";

export const searchShopItems = async (req: Request, res: Response) => {
  const query = (req.query.user as string)?.trim();
  const type = req.query.type as string | undefined;

  if (!query || query.length < 3) {
    return res.status(200).json({ success: true, data: [] });
  }

  if (type && !["animation", "frame"].includes(type)) {
    return res.status(400).json({ success: false, message: "invalid type" });
  }

  const filter: Record<string, any> = {
    active: true,
    name: { $regex: query, $options: "i" },
    ...(type && { type }),
  };

  const items = await shopItemModel
    .find(filter)
    .select("name description price type imageURL")
    .limit(20)
    .lean();

  return res.status(200).json({ success: true, data: items });
};

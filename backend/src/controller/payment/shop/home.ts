import { shopItemModel } from "../../../models/item";
import { Request, Response } from "express";

export const getShopHomepage = async (req: Request, res: Response) => {
  const page = Number(req.query.page) || 1;
  const LIMIT = 10;
  const skip = (page - 1) * LIMIT;

  const [data, total] = await Promise.all([
    shopItemModel
      .find({ active: true })
      .select("name description price type imageURL")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(LIMIT)
      .lean(),
    shopItemModel.countDocuments({ active: true }),
  ]);

  return res.status(200).json({
    success: true,
    data,
    hasMore: page * LIMIT < total,
    page,
  });
};

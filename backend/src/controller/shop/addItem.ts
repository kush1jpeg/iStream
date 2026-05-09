import { Request, Response } from "express";
import { shopItemModel } from "../../models/item";

export const getShopHomepage = async (req: Request, res: Response) => {
  const { name, description, price, type, imageURL, active } = req.body;

  const data = await shopItemModel.create({
    name,
    description,
    price,
    type,
    imageURL,
    active,
  });

  return res.status(200).json({
    msg: "Item published",
    success: true,
    data,
  });
};

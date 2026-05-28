import { Request, Response } from "express";
import { shopItemModel } from "../../models/item";

export const addItem = async (req: Request, res: Response) => {
  const { name, description, price, type, imageURL, active, stickers } =
    req.body;

  if (!name || !price || !type) {
    return res
      .status(400)
      .json({ success: false, message: "name, price and type are required" });
  }

  if (!["animation", "frame", "stickerPack"].includes(type)) {
    return res.status(400).json({ success: false, message: "invalid type" });
  }

  if (type === "stickerPack" && (!stickers || !stickers.length)) {
    return res
      .status(400)
      .json({
        success: false,
        message: "sticker_pack requires stickers array",
      });
  }

  const data = await shopItemModel.create({
    name,
    description,
    price,
    type,
    imageURL,
    active: active ?? false,
    stickers: type === "stickerPack" ? stickers : [],
  });

  return res.status(201).json({
    success: true,
    message: "Item published",
    data,
  });
};

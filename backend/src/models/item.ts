import mongoose, { model } from "mongoose";
import { IShopItem } from "@istream/shared";

const itemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String },
    price: { type: Number, required: true, min: 0 },
    type: {
      type: String,
      enum: ["animation", "frame", "stickerPack", "sticker"],
      required: true,
    },
    imageURL: { type: String },
    stickers: [
      {
        name: { type: String },
        imageURL: { type: String },
      },
    ],
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    active: { type: Boolean, default: true }, // can be deactivated
  },
  {
    timestamps: true,
  },
);

itemSchema.index({ price: 1 });

export const shopItemModel: mongoose.Model<IShopItem> =
  mongoose.models.shopItem || model("shopItem", itemSchema);

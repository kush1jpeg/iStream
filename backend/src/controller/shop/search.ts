import type { Request, Response } from "express";
import { shopItemModel } from "../../models/item";

export const searchShop = async (req: Request, res: Response) => {
  try {
    const query = typeof req.query.q === "string" ? req.query.q.trim() : "";

    if (query.length < 2) {
      return res.json([]);
    }

    const filter = typeof req.query.type === "string" ? req.query.type : null;
    const matchStage: any = { active: true };
    if (filter) matchStage.type = filter;

    const foundItems = await shopItemModel.aggregate([
      {
        $search: {
          index: "istream",
          text: {
            query: query,
            path: "name",
            fuzzy: {
              maxEdits: 2,
              prefixLength: 0,
              maxExpansions: 50,
            },
          },
        },
      },
      {
        $match: matchStage,
      },
      {
        $limit: 20,
      },
      {
        $project: {
          name: 1,
          description: 1,
          price: 1,
          type: 1,
          imageURL: 1,
          stickers: 1,
          active: 1,
        },
      },
    ]);

    return res.status(200).json(foundItems);
  } catch (error) {
    console.error("Search Error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

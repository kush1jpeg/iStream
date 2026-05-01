import type { Request, Response } from "express";
import { shopItemModel } from "../../models/item";

export const search = async (req: Request, res: Response) => {
  try {
    const query = String(req.query.user).trim();
    const filter = req.query.type ? String(req.query.type).trim() : null;
    const matchStage: Record<string, any> = { active: true };
    if (filter) matchStage.type = filter;

    if (!query || query.trim().length < 2) {
      return res.json([]);
    }

    const foundItems = await shopItemModel.aggregate([
      {
        $search: {
          index: "shopItem",
          autocomplete: {
            query,
            path: "name",
            fuzzy: { maxEdits: 1 },
          },
        },
      },
      { $match: matchStage },
      {
        $limit: 10,
      },
      {
        $project: {
          name: 1,
          description: 1,
          price: 1,
          imageURL: 1,
          type: 1,
        },
      },
    ]);

    res.json(foundItems);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Search failed" });
  }
};

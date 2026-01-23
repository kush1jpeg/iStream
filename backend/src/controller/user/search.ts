import type { Request, Response } from "express";
import { userModel } from "../../models/user";

export const search = async (req: Request, res: Response) => {
  try {
    const query = String(req.query.user).trim();

    if (!query || query.length < 2) {
      return res.json([]);
    }

    const foundUsers = await userModel.aggregate([
      {
        $search: {
          index: "istream",
          autocomplete: {
            query,
            path: "username",
            fuzzy: { maxEdits: 1 },
          },
        },
      },
      {
        $limit: 10,
      },
      {
        $project: {
          username: 1,
          avatar: 1,
          followerCount: 1,
          isStreaming: 1,
        },
      },
    ]);

    res.json(foundUsers);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Search failed" });
  }
};

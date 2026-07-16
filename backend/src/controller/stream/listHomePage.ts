import type { Request, Response } from "express";
import { getVods } from "./getAllVOD";
import { getLiveStreams } from "./getLiveStreams";

export const listHomePage = async (req: Request, res: Response) => {
  const page = Number(req.query.page) || 1;
  const cursor = Number(req.query.cursor) || 0;
  const limit = Number(req.query.limit) || 20;
  try {
    const [vod, live] = await Promise.all([
      getVods(page, limit),
      getLiveStreams(cursor, limit),
    ]);

    return res.status(201).json({
      success: true,
      vod,
      live,
    });
  } catch (error) {
    console.error(error);
  }
};

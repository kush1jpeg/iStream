import type { Request, Response } from "express";
import { getVods } from "./getVOD";
import { getLiveStreams } from "./getLiveStreams";

export const listHomePage = async (req: Request, res: Response) => {
  const page = Number(req.query.vod) || 1;
  const cursor = Number(req.query.live) || 1;
  const limit = 20;
  try {
    const [live, vod] = await Promise.all([
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

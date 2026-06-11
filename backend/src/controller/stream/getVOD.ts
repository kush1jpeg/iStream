import type { Request, Response } from "express";
import { streamModel } from "../../models/stream";

const VOD_PATH = `${process.env.R2_PUBLIC_URL}/hls/live`;

export const getAvailableVods = async (req: Request, res: Response) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = 20;
    const data = await getVods(page, limit);
    return res.status(200).json(data);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export async function getVods(page: number, limit: number) {
  const vods = await streamModel
    .find({ status: "ended" })
    .sort({ endedAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .populate("streamerId", "username avatar");

  const total = await streamModel.countDocuments({ status: "ended" });

  const vodsWithUrl = vods.map((vod) => ({
    _id: vod._id,
    title: vod.title,
    description: vod.description,
    thumbnail: vod.thumbnail,
    tags: vod.tags,
    viewers: vod.viewers,
    views: vod.views,
    startedAt: vod.startedAt,
    endedAt: vod.endedAt,
    streamer: vod.streamerId,
    VOD_PATH: `${VOD_PATH}/${vod.streamKey}/master.m3u8`,
  }));

  return {
    vods: vodsWithUrl,
    page,
    total,
    hasMore: page * limit < total,
  };
}

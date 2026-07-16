import type { Request, Response } from "express";
import mongoose from "mongoose";
import { streamModel } from "../../models/stream";
import { getFullLink } from "../user/getSignedLink";

interface PopulatedStreamer {
  _id: mongoose.Types.ObjectId;
  username: string;
  avatar: { isCloud: boolean; value: string };
}

export const getVodById = async (req: Request, res: Response) => {
  try {
    const { vodId } = req.params;
    if (!vodId) {
      return res
        .status(400)
        .json({ success: false, message: "VOD ID required" });
    }
    if (!mongoose.Types.ObjectId.isValid(vodId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid VOD ID" });
    }

    const vod = await streamModel
      .findOne({ _id: vodId, status: "ended" })
      .populate<{
        streamerId: PopulatedStreamer;
      }>("streamerId", "username avatar");

    if (!vod) {
      return res.status(404).json({ success: false, message: "VOD not found" });
    }
    const avatarUrl = vod.streamerId.avatar?.isCloud
      ? getFullLink(vod.streamerId.avatar.value)
      : (vod.streamerId.avatar?.value ?? null);

    const otherVods = await streamModel
      .find({
        _id: { $ne: vod._id },
        streamerId: vod.streamerId._id,
        status: "ended",
      })
      .sort({ createdAt: -1 })
      .limit(8);

    res.set("Cache-Control", "no-store");
    return res.status(200).json({
      success: true,
      vod: {
        _id: vod._id,
        title: vod.title,
        description: vod.description,
        thumbnail: vod.thumbnail,
        tags: vod.tags,
        viewers: vod.viewers,
        views: vod.views,
        startedAt: vod.startedAt,
        endedAt: vod.endedAt,
        streamer: {
          _id: vod.streamerId._id,
          username: vod.streamerId.username,
          avatar: avatarUrl,
        },
        VOD_PATH: `/vod/${vod._id}/master.m3u8`,
        moreVods: otherVods.map((otherVod) => ({
          _id: otherVod._id,
          title: otherVod.title,
          thumbnail: otherVod.thumbnail,
          views: otherVod.views,
          createdAt: otherVod.get("createdAt"),
          duration: Math.max(
            0,
            Math.floor(
              ((otherVod.endedAt?.getTime() ?? 0) -
                (otherVod.startedAt?.getTime() ?? 0)) /
                1000,
            ),
          ),
        })),
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

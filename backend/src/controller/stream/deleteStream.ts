import { Request, Response } from "express";
import { streamModel } from "../../models/stream";
import { redis } from "../../config/redis";
import { getPublishChannel } from "../../config/rabbitmq";

export const deleteStream = async (req: Request, res: Response) => {
  try {
    const { streamId } = req.params;
    const userId = req.id;

    if (!streamId) {
      return res
        .status(400)
        .json({ success: false, message: "Stream ID required" });
    }

    // Fetch stream to check existence & ownership
    const stream = await streamModel.findById(streamId);
    if (!stream) {
      return res
        .status(404)
        .json({ success: false, message: "Stream not found" });
    }

    if (stream.streamerId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized to delete this stream",
      });
    }

    // marking the status as delete-pending to prevent any further actions on this stream
    stream.status = "delete-pending";
    await stream.save();


    // triggering the r2 delete
    const payload = Buffer.from(JSON.stringify({ streamId, path: `hls/live/${stream.streamKey}` }));
    const channel = await getPublishChannel();
    channel.sendToQueue("delete-vod", payload, {
      persistent: true,
      headers: { "x-retry-count": 0 },
    });

    // Delete from redis just incase the stream ;
    const pipeline = redis.multi();
    pipeline.del(`stream:${streamId}`);
    pipeline.del(`live:user:${userId}`);
    pipeline.srem(`live:streams`, streamId);
    pipeline.del(`streamKey:${stream.streamKey}`);
    await pipeline.exec();

    return res.status(200).json({
      success: true,
      message: "Stream permanently deleted",
      data: { streamId },
    });
  } catch (error) {
    console.error("Error deleting stream:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};
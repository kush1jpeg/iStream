import { Request, Response } from "express";
import { streamModel } from "../../models/stream";

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

    // Delete from DB
    await streamModel.findByIdAndDelete(streamId);

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

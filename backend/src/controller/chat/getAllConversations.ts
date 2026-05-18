import type { Request, Response } from "express";
import { conversationModel } from "../../models/conversation";

export const getAllConversations = async (req: Request, res: Response) => {
  const userId = req.id;

  console.log("sending all conv");
  try {
    const conversations = await conversationModel
      .find({
        participants: userId,
      })
      .select(
        "lastMessage participants isGroup groupName avatar conversationKey",
      )
      .populate({
        path: "participants",
        select: "username avatar isVerified isLive",
      })
      .sort({ updatedAt: -1 });
    console.log("bkend", conversations);

    return res.status(200).json({
      success: true,
      conversations,
    });
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch conversations",
    });
  }
};

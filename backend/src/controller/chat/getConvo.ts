import { Request, Response } from "express";
import { conversationModel } from "../../models/conversation";
import { msgModel } from "../../models/msgPvt";
import { getFullLink } from "../user/getSignedLink";

export const getConversationMessages = async (req: Request, res: Response) => {
  try {
    const userId = req.id;
    const { conversationKey, page = 1, limit = 10 } = req.query;

    if (!conversationKey) {
      return res.status(400).json({
        success: false,
        message: "conversationKey required",
      });
    }

    // verify user and get the whole participant data too;
    const conversation = await conversationModel
      .findOne({
        conversationKey,
        participants: userId,
      })

    if (!conversation) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    const pageNum = Math.max(Number(page), 1);
    const limitNum = Math.min(Number(limit), 50);

    const rawMessages = await msgModel
      .find({
        conversationKey,
      })
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .populate({
        path: "senderId",
        select: "username avatar",
      })
      .lean();
      
      const messages = rawMessages.map((msg: any) => ({
  ...msg,
  senderId: {
    ...msg.senderId,
    avatar: msg.senderId?.avatar?.isCloud
      ? getFullLink(msg.senderId.avatar.value)
      : msg.senderId?.avatar?.value,
  },
}));

    return res.status(200).json({
      success: true,
      messages: messages.reverse(),
      hasMore: messages.length === limitNum,
    });
  } catch (err) {
    console.error("GET_CONVO_MSG_ERR:", err);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch messages",
    });
  }
};

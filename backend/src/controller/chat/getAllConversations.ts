import type { Request, Response } from "express";
import { conversationModel } from "../../models/conversation";
import { getFullLink } from "../user/getSignedLink";

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
       .populate({
        path: "lastMessage",
        select: "message createdAt", // adjust fields to whatever msgPvt has
      })
      .sort({ updatedAt: -1 })
      .lean();

    const data = conversations.map((conv) => ({
      ...conv,
      participants: conv.participants.map((user: any) => ({
        ...user,
        avatar: user.avatar?.isCloud
          ? getFullLink(user.avatar.value)
          : user.avatar?.value,
      })),
    }));

    console.log("allConve", data);
    return res.status(200).json({
      success: true,
      conversations: data,
    });
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch conversations",
    });
  }
};

import { Request, Response } from "express";
import { conversationModel } from "../../models/conversation";
import mongoose from "mongoose";

function getKey(userId: string, receiverId: string) {
  return [userId, receiverId].sort().join(":");
}

export const createConvo = async (req: Request, res: Response) => {
  try {
    const myId = req.id;
    if (!myId) return res.status(400).json({ message: "Invalid userID" });

    const { receiverId, type, avatar } = req.body;

    if (!receiverId || receiverId === myId.toString()) {
      return res.status(400).json({ message: "Invalid receiverId" });
    }

    const conversationKey = getKey(myId, receiverId);

    let convo = await conversationModel
      .findOne({ conversationKey })
      .populate("participants", "username avatar");

    if (convo) {
      return res.json({ conversation: convo });
    }

    convo = await conversationModel.create({
      participants: [myId, receiverId],
      conversationKey,
      isGroup: type === "group",
      avatar,
    });

    convo = await convo.populate("participants", "username avatar");

    return res.status(201).json({ conversation: convo });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "server error" });
  }
};

export const createGroupConvo = async (req: Request, res: Response) => {
  const userId = req.id;
  const { groupName, avatar, members } = req.body;

  if (!groupName || !members || members.length === 0) {
    return res
      .status(400)
      .json({ success: false, message: "groupName and members required" });
  }

  if (members.length < 2) {
    return res.status(400).json({
      success: false,
      message: "group needs at least 2 other members",
    });
  }

  try {
    const allMembers = [...new Set([userId, ...members])]; // dedupe + add creator

    const group = await conversationModel.create({
      isGroup: true,
      groupName,
      avatar: avatar || null,
      participants: allMembers,
      conversationKey: new mongoose.Types.ObjectId().toString(), // unique key for groups
      createdBy: userId,
    });

    return res
      .status(201)
      .json({ success: true, conversationKey: group.conversationKey });
  } catch (err) {
    console.error("createGroup error:", err);
    return res
      .status(500)
      .json({ success: false, message: "internal server error" });
  }
};

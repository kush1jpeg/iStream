import { Request, Response } from "express";
import { conversationModel } from "../../models/conversation";

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

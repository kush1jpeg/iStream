import { Request, Response } from "express";
import { conversationModel } from "../../models/conversation";
import { msgModel } from "../../models/msgPvt";

export const deleteConvo = async (req: Request, res: Response) => {
  try {
    const { conversationKey } = req.params;
    await msgModel.deleteMany({ conversationKey });
    const convo = await conversationModel.findOneAndDelete({
      conversationKey,
    });

    if (!convo) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    return res
      .status(201)
      .json({ success: true, msg: "Conversation deleted successfully" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "server error" });
  }
};

import type { Request, Response } from "express";
import { getSidebarData } from "../../socket/registerSidebarHandler";

export const getSuggestions = async (req: Request, res: Response) => {
  const userId = req.id;

  if (!userId) {
    return res.status(401).json({ success: false, message: "unauthorized" });
  }

  try {
    const data = await getSidebarData(userId);
    return res.status(200).json({ success: true, data });
  } catch (err) {
    console.error("getSuggestions error:", err);
    return res
      .status(500)
      .json({ success: false, message: "internal server error" });
  }
};

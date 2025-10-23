import type { Request, Response } from "express";

export const search = async (req: Request, res: Response) => {
  try {
  } catch (err) {
    return res.status(500).json({ message: "Server error during logout" });
  }
};

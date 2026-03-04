import { Request, Response } from "express";
import { userModel } from "../../models/user";
import { notifyModel } from "../../models/notifications";
import { Types } from "mongoose";

async function getNewNotifs(userId: string, lastReadId: Types.ObjectId | null) {
  const newNotifications = await notifyModel
    .find({
      userId,
      ...(lastReadId ? { _id: { $gt: lastReadId } } : {}), // if lastReadId exists, fetch newer ones
    })
    .sort({ _id: 1 })
    .limit(40); // avoid flooding
  return newNotifications;
}
// make a route inorder to update the lastReadNotificationId

export const getNotifications = async (req: Request, res: Response) => {
  const userId = req.id;

  const user = await userModel
    .findById(userId)
    .select("lastReadNotificationId");

  if (!user || !userId) throw new Error("user not found");

  const newNotifications = await getNewNotifs(
    userId,
    user.lastReadNotificationId ?? null,
  );

  return res.status(200).json(newNotifications);
};

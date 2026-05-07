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
  if (!userId) throw new Error("Unauthorized");

  const user = await userModel
    .findById(userId)
    .select("lastReadNotificationId");

  if (!user) throw new Error("user not found");

  const newNotifications = await getNewNotifs(
    userId,
    user.lastReadNotificationId ?? null,
  );

  return res.status(200).json(newNotifications);
};

export const updateLastReadNotification = async (
  req: Request,
  res: Response,
) => {
  const userId = req.id;
  if (!userId) throw new Error("Unauthorized");

  const notifId = req.body.notifId;
  if (!notifId) {
    return res.status(400).json({ error: "notifId required" });
  }
  const notif = await notifyModel.findOne({
    _id: notifId,
    userId: userId,
  });

  if (!notif) {
    return res.status(404).json({ error: "Notification not found" });
  }
  const user = await userModel.findByIdAndUpdate(userId, {
    lastReadNotificationId: notifId,
  });

  if (!user) throw new Error("user not found");

  return res.status(200).json({ msg: "lastReadNotificationId updated" });
};

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
  if (!userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const notifId = req.body.notifId;
  if (!notifId || !Types.ObjectId.isValid(notifId)) {
    return res.status(400).json({ message: "Valid notifId required" });
  }

  const notif = await notifyModel.findOne({
    _id: notifId,
    userId,
  }).select("_id");

  if (!notif) {
    return res.status(404).json({ message: "Notification not found" });
  }

  const user = await userModel.findById(userId).select("lastReadNotificationId");
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  // A delayed request from another tab must not move the read cursor backwards.
  if (
    !user.lastReadNotificationId ||
    user.lastReadNotificationId.toString() < notif._id.toString()
  ) {
    user.lastReadNotificationId = notif._id;
    await user.save();
  }

  return res.status(200).json({
    success: true,
    lastReadNotificationId: user.lastReadNotificationId,
  });
};

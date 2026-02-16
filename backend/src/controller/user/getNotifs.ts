import { Request, Response } from "express";
import { userModel } from "../../models/user";
import { notifyModel } from "../../models/notifications";

async function getNewNotifs(userId: string, lastReadId: string | null) {
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
  const user = await userModel
    .findById(userId)
    .select("lastReadNotificationId");
  if (!user || !userId) throw new Error("user not found");
  const lastReadId = user.lastReadNotificationId;
  if (!lastReadId || !(await notifyModel.exists({ _id: lastReadId }))) {
    const newNotifications = await getNewNotifs(userId, null);
    return res.status(200).json(newNotifications);
  } else {
    const newNotifications = await getNewNotifs(
      userId,
      JSON.stringify(lastReadId),
    );
    return res.status(200).json(newNotifications);
  }
};

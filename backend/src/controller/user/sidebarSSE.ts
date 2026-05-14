// import type { Request, Response } from "express";
// import { redis } from "../../config/redis";
// import { followModel } from "../../models/follow";
// import { userModel } from "../../models/user";
//
// export const followingLiveSSE = async (req: Request, res: Response) => {
//   const userId = req.id;
//   const page = Number(req.query.page as string) || 1;
//
//   const initialData = await getFollowingLiveStatus(userId!, page);
//   res.json(`data: ${JSON.stringify(initialData)}\n\n`);
//
//   // meant to add pub-sub but fuck it
//   // const sub = new Redis();
//   // await sub.subscribe("notifications");
//   //
//   // sub.on("message", (_, message) => {
//   //   try {
//   //     const payload = JSON.parse(message);
//   //     if (payload.type === "stream" && payload.userId.toString() === userId) {
//   //       res.write(`data: ${JSON.stringify(payload)}\n\n`);
//   //     }
//   //   } catch (err) {
//   //     console.error("SSE parse error:", err);
//   //   }
//   // });
//   //
//   // req.on("close", () => {
//   //   sub.unsubscribe();
//   //   sub.disconnect();
//   // });
// };
//
// const getFollowingLiveStatus = async (userId: string, page: number) => {
//   const LIMIT = 5;
//   const skip = (page - 1) * LIMIT;
//
//   const following = await followModel
//     .find({ followerId: userId })
//     .sort({ createdAt: -1 })
//     .skip(skip)
//     .limit(LIMIT)
//     .select("followedId")
//     .lean();
//
//   if (following.length === 0) {
//     // returning random5 incase of no following
//     const randomUsers = await userModel.aggregate([
//       {
//         $match: {
//           isLive: true,
//         },
//       },
//       {
//         $sample: { size: 5 },
//       },
//     ]);
//     if (randomUsers.length === 0)
//       return { success: true, data: [], hasMore: false };
//     else return { success: true, data: randomUsers, hasMore: false };
//   }
//
//   const followingIds = following.map((f) => f.followedId.toString());
//
//   const pipeline = redis.pipeline();
//   followingIds.forEach((id) => pipeline.get(`live:user:${id}`));
//   const results = await pipeline.exec();
//
//   if (!results || results.length === 0) {
//     return { success: true, data: [], hasMore: false };
//   }
//
//   const data = results.map((res, i) => {
//     const raw = res?.[1];
//     if (!raw) {
//       return {
//         userId: followingIds[i],
//         isLive: false,
//       };
//     }
//
//     return JSON.parse(raw as string);
//   });
//
//   return {
//     success: true,
//     data,
//     hasMore: following.length === LIMIT,
//     page,
//   };
// };

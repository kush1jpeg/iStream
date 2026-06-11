import { redisClient } from "../config/redis.js";

export const handleInactive = async (req, res) => {
  const { MTX_PATH } = req.body;

  if (!MTX_PATH) return res.status(400).json({ error: "MTX_PATH required" });
  try {
    const streamKey = MTX_PATH.split("/")[1];
    const status = await redisClient.hget(`stream:${streamKey}`, "status");

    if (!status) {
      return res
        .status(404)
        .json({ error: "stream not found or already terminated" });
    }

    await redisClient.hset(`stream:${streamKey}`, {
      status: "inactive",
      inactiveSince: Date.now(),
    });
    return res.status(201).json({ msg: "stream set to inactive" });
  } catch (err) {
    console.error("handleInactive error:", err);
    res.status(500).json({ error: "internal server error" });
  }
};

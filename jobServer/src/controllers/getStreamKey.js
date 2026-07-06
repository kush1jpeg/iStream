// nginx auth_request calls this with X-Original-URI set to the original request path, e.g. /hls/<streamId>
import { redisClient } from "../config/redis";

export const resolveStream = async (req, res) => {
  try {
    const originalUri = req.headers["x-original-uri"];
    if (!originalUri) {
      return res.status(400).json({ error: "X-Original-URI header required" });
    }

    // /hls/<streamId>/<anything> -> captures streamId
    const match = originalUri.match(/^\/hls\/([^/]+)\//);
    if (!match) {
      return res.status(400).json({ error: "malformed request path" });
    }

    const streamId = match[1];

    const streamData = await redisClient.hgetall(`stream:${streamId}`);
    if (!streamData || Object.keys(streamData).length === 0) {
      return res.status(404).json({ error: "stream not found" });
    }

    const { streamKey, status } = streamData;

    if (!streamKey) {
      console.error(`stream:${streamId} has no streamKey field`);
      return res.status(500).json({ error: "internal server error" });
    }

    if (status == "pending" || status == "ended") {
      return res.status(403).json({ error: "stream is not currently live" });
    }

    if (status == "inactive") {
      return res.status(403).json({ error: "waiting for streamer to connect" });
    }

    // nginx reads this header via $upstream_http_x_stream_key
    res.setHeader("X-Stream-Key", streamKey);
    return res.status(200).end();
  } catch (err) {
    console.error("resolveStream error:", err);
    return res.status(500).json({ error: "internal server error" });
  }
};

import chokidar from "chokidar";
import { uploadSegment } from "../cloudflare/consumer.js";
import { logger } from "../index.js";
import { redis } from "../config/redis.js";

export async function initWatcher(MTX_PATH) {
  const watcher = chokidar.watch(`/hls/${MTX_PATH}`, {
    persistent: true,
    ignored: /(^|[\/\\])\../, // hidden files
    awaitWriteFinish: {
      stabilityThreshold: 2000,
      pollInterval: 100,
    },
  });
  logger.info(`watcher[chokidar] started successfully`);

  watcher.on("add", async (filePath) => {
    if (!filePath.endsWith(".ts")) return;
    // .ts → queue for upload
    await publishStreamLog(
      `[WATCHER] queuing .ts: ${filePath}`,
      MTX_PATH,
      "info",
    );

    await redis.rpush(
      `upload:queue:${MTX_PATH}`,
      JSON.stringify({
        filePath,
        MTX_PATH,
        retries: 0,
        enqueuedAt: Date.now(),
      }),
    );
  });

  // m3u8 updates on every change — upload directly, no queue needed
  watcher.on("change", async (filePath) => {
    if (!filePath.endsWith(".m3u8")) return;
    try {
      await uploadSegment(filePath, MTX_PATH);
      await publishStreamLog(
        `[VOD] updated playlist ${filePath}`,
        MTX_PATH,
        "info",
      );
    } catch (err) {
      await publishStreamLog(
        `[VOD] m3u8 upload failed ${filePath}: ${err}`,
        MTX_PATH,
        "err",
      );
      logger.error();
    }
  });

  return watcher;
}

export async function publishStreamLog(msg, MTX_PATH, type) {
  const streamKey = MTX_PATH.split("/")[1];
  console.log(`[stream:log]- ${msg} for streamKey: ${streamKey}`);
  const streamId = await redis.get(`streamKey:${streamKey}`);
  if (!streamId) {
    logger.warn(`[stream:log] no streamId found for ${streamKey}`);
    return;
  }

  const streamData = await redis.hgetall(`stream:${streamId}`);
  if (!streamData?.streamer) {
    logger.warn(`[stream:log] no streamer data for ${streamId}`);
    return;
  }

  const userId = streamData.streamerId;
  const data = {
    type: "stream",
    msg,
    userId,
    streamId,
    createdAt: Date.now(),
  };

  if (type === "info") logger.info(msg);
  else logger.error(msg);

  await redis.publish(`stream:log:${userId}`, JSON.stringify(data));
}

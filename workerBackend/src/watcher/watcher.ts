import chokidar from "chokidar";
import { uploadSegment } from "../cloudflare/consumer";
import { logger } from "..";

export async function initWatcher(MTX_PATH) {
  const watcher = chokidar.watch(`/hls/live${MTX_PATH}`, {
    persistent: true,
    ignored: /(^|[\/\\])\../, // hidden files
    awaitWriteFinish: {
      stabilityThreshold: 2000,
      pollInterval: 100,
    },
  });
  logger.info(`watcher[chokidar] started successfully`);

  // m3u8 updates on every change — upload directly, no queue needed
  watcher.on("change", async (filePath) => {
    if (!filePath.endsWith(".m3u8")) return;
    try {
      await uploadSegment(filePath, MTX_PATH);
      logger.info(`[VOD] updated playlist ${filePath}`);
    } catch (err) {
      logger.error(`[VOD] m3u8 upload failed ${filePath}:`, err);
    }
  }); // m3u8 updates on every change — upload directly, no queue needed
  watcher.on("change", async (filePath) => {
    if (!filePath.endsWith(".m3u8")) return;
    try {
      await uploadSegment(filePath, MTX_PATH);
      logger.info(`[VOD] updated playlist ${filePath}`);
    } catch (err) {
      logger.error(`[VOD] m3u8 upload failed ${filePath}:`, err);
    }
  });

  return watcher;
}

import { logger } from "..";
import { redis } from "../config/redis";
import { uploadSegment } from "./consumer";
import fs from "fs";

export async function drainUploadQueue(streamId: string) {
  while (true) {
    const result = await redis.lpop(`upload:queue:${streamId}`);
    if (!result) break; // queue empty, exit loop

    const job = JSON.parse(result);
    try {
      await uploadSegment(job.filePath, job.MTX_PATH);
      fs.unlinkSync(job.filePath);
      logger.info(`[VOD] drained ${job.filePath}`);
    } catch (err) {
      if (job.retries < 3) {
        await new Promise((r) =>
          setTimeout(r, 1000 * Math.pow(2, job.retries)),
        );
        await redis.rpush(
          `upload:queue:${streamId}`,
          JSON.stringify({
            ...job,
            retries: job.retries + 1,
          }),
        );
      } else {
        // push to dlq or dlx
        logger.error(`[VOD] dead lettered: ${job.filePath}`);
      }
    }
  }
}

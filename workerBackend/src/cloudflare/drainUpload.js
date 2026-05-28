import { logger } from "../index.js";
import { redis } from "../config/redis.js";
import { uploadSegment } from "./consumer.js";
import fs from "fs";

export async function drainUploadQueue(streamId) {
  while (true) {
    const result = await redis.lpop(`upload:queue:${streamId}`);
    if (!result) break; // queue empty, exit loop

    const job = JSON.parse(result);
    try {
      await uploadSegment(job.filePath, job.MTX_PATH);
      fs.unlinkSync(job.filePath);
      await publishStreamLog(
        `[VOD] drained ${job.filePath}`,
        job.MTX_PATH,
        "info",
      );
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
        await publishStreamLog(
          `[VOD] dead lettered: ${job.filePath}`,
          job.MTX_PATH,
          "err",
        );
      }
    }
  }
}

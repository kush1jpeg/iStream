import { redis } from "../config/redis.js";
import { logger } from "../index.js";
import fs from "fs";
import path from "path";

export async function startUploadConsumer(MTX_PATH) {
  await publishStreamLog(
    `[CONSUMER blpop] started for ${MTX_PATH}`,
    MTX_PATH,
    "info",
  );
  while (true) {
    // BLPOP blocks until item available- no polling
    const result = await redis.blpop(`upload:queue:${MTX_PATH}`, 5);
    if (!result) continue;
    await publishStreamLog("starting upload to R2", MTX_PATH, "info");

    const job = JSON.parse(result[1]);

    try {
      await uploadSegment(job.filePath, job.MTX_PATH);
      await publishStreamLog(
        `starting upload to R2, ${job.filePath}`,
        MTX_PATH,
        "info",
      );
      fs.unlinkSync(job.filePath);
      /* deleting it as soon as it pushes to r2; cant store it in disk though there is a condition(very rare)
       that it is not streamed but pushed first and deleted */
      await publishStreamLog(`del - ${job.filePath}`, MTX_PATH, "info");
    } catch (err) {
      await publishStreamLog(`[VOD] upload failed:, ${err}`, MTX_PATH, "err");

      if (job.retries < 3) {
        await new Promise((resolve) =>
          setTimeout(resolve, 1000 * Math.pow(2, job.retries)),
        );
        await redis.rpush(
          `upload:queue:${MTX_PATH}`,
          JSON.stringify({
            ...job,
            retries: job.retries + 1,
          }),
        );
      } else {
        // push into a dlq/dlx
        await publishStreamLog(
          `[VOD] segment dead lettered: ${job.filePath}`,
          MTX_PATH,
          "err",
        );
      }
    }
  }
}

import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  ListObjectsV2Command,
} from "@aws-sdk/client-s3"; // docs
import { publishStreamLog } from "../watcher/watcher.js";

const r2 = new S3Client({
  region: "auto", // Required by AWS SDK, not used by R2
  // Provide your R2 endpoint: https://<ACCOUNT_ID>.r2.cloudflarestorage.com
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    // Provide your R2 Access Key ID and Secret Access Key
    accessKeyId: process.env.R2_ACCESS_KEYID,
    secretAccessKey: process.env.R2_SECRET_KEY,
  },
});

export async function uploadSegment(filePath, MTX_PATH) {
  if (!fs.statSync(filePath).size > 0) return;

  const fileName = path.basename(filePath);
  const isM3u8 = fileName.endsWith(".m3u8");

  // /hls/live/kush/v0/seg0.ts -> MTX_PATH/v0/seg0.ts
  const relativePath = filePath.split(`/hls/live/`)[1]; // /kush/v0/seg0.ts
  const streamPath = relativePath.split("/").slice(1).join("/"); // v0/seg0.ts

  logger.info(
    `filePath ${filePath}, [rel]${relativePath}    streamPath${streamPath}`,
  );

  const key = `hls/${MTX_PATH}/${streamPath}`;
  logger.info(`[VOD] uploading ${key}`);

  const body = fs.readFileSync(filePath);

  await r2.send(
    new PutObjectCommand({
      Bucket: process.env.R2_BUCKET,
      Key: key,
      Body: body,
      ContentType: isM3u8 ? "application/vnd.apple.mpegurl" : "video/mp2t",
      CacheControl: isM3u8
        ? "no-cache" // m3u8 must always be fresh
        : "max-age=31536000", // .ts segments are immutable
    }),
  );

  logger.info(`[VOD] uploaded ${key}`);
}

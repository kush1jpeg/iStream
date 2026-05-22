import { redis } from "../config/redis";
import fs from "fs";
import path from "path";

export async function startUploadConsumer(MTX_PATH) {
  while (true) {
    // BLPOP blocks until item available- no polling
    const result = await redis.blpop(`upload:queue:${MTX_PATH}`, 0);
    if (!result) continue;

    const job = JSON.parse(result[1]);

    try {
      await uploadSegment(job.filePath, job.MTX_PATH);
      fs.unlinkSync(job.filePath);
      console.log(`[VOD] uploaded ${job.filePath}`);
    } catch (err) {
      console.error(`[VOD] upload failed:`, err);

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
        console.error(`[VOD] segment dead lettered: ${job.filePath}`);
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
  const fileName = path.basename(filePath);
  const isM3u8 = fileName.endsWith(".m3u8");

  // /hls/live/kush/v0/seg0.ts → MTX_PATH/v0/seg0.ts
  const relativePath = filePath.split(`/hls/live/`)[1]; // /kush/v0/seg0.ts
  const streamPath = relativePath.split("/").slice(1).join("/"); // v0/seg0.ts

  const key = `hls/${MTX_PATH}/${streamPath}`;

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

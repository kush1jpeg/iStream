import { Request, Response } from "express";
import { streamModel } from "../models/stream";
import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export const r2 = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEYID!,
    secretAccessKey: process.env.R2_SECRET_KEY!,
  },
});

// X-Original-URI looks like: /vod/<vodId>/<file...>
// e.g. /vod/6a5524.../master.m3u8  or  /vod/6a5524.../1080/segment_003.ts
const URI_REGEX = /^\/vod\/([^/]+)\/(.+)$/;

export async function resolveVod(req: Request, res: Response) {
  const originalUri = req.headers["x-original-uri"] as string;
  if (!originalUri) {
    return res.status(400).end();
  }
  console.log(
    `[resolveVod] Request received to resolve VOD, originalUri: ${originalUri}`,
  );

  const match = originalUri.match(URI_REGEX);
  if (!match) {
    return res.status(400).end();
  }

  const [, vodId, filePath] = match;

  try {
    const vod = await streamModel
      .findById(vodId)
      .select("streamKey status")
      .lean();

    if (!vod) {
      return res.status(404).end();
    }

    const objectKey = `hls/live/${vod.streamKey}/${filePath}`;

    const signedUrl = await getSignedUrl(
      r2,
      new GetObjectCommand({
        Bucket: process.env.R2_BUCKET!,
        Key: objectKey,
      }),
      { expiresIn: 350 },
    );

    res.setHeader("X-Vod-Url", signedUrl);
    return res.status(200).end();
  } catch (err) {
    console.error(
      "[resolveVod] failed for vodId:",
      vodId,
      "file:",
      filePath,
      err,
    );
    return res.status(500).end();
  }
}


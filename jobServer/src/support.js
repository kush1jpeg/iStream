import { redisClient } from "./config/redis.js";

export async function verifyStreamKey(streamKey) {
  // checking redis;
  if (await redisClient.exists(`streamKey:${streamKey}`)) {
    console.log("streamKey is verified", streamKey);
    return 1;
  } else {
    console.log("streamKey Not verified", streamKey);
    return 0;
  }
}

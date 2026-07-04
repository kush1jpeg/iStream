import { redisClient } from "../config/redis";
import { vi } from "vitest";
import * as publishStreamLogModule from "./publishStreamLogs";
import * as terminateModule from "../helpers/pushToTerminate.js";
import { verifyStreamKey } from "./support";
import * as checkLoadModule from "../controllers/checkStreamLoadStatus.js";

describe("verify stream-Keys for pending/inactive cases", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("allows pending streams after detecting under-load", async () => {
    vi.spyOn(redisClient, "get").mockResolvedValue("kush"); // mock get streamKey
    vi.spyOn(redisClient, "expire").mockResolvedValue(1);
    vi.spyOn(redisClient, "hset").mockResolvedValue(1);
    vi.spyOn(redisClient, "hgetall").mockResolvedValue({
      status: "pending",
      streamerId: "1243234",
    }); // mock hget

    const publishLog = vi
      .spyOn(publishStreamLogModule, "publishStreamLog")
      .mockImplementation(() => {});

    // mocking loadStatus here cuz i have seperate tests for that;
    const checkLoad = vi
      .spyOn(checkLoadModule, "checkStreamLoadStatus")
      .mockImplementation(() => {
        return { allowed: true };
      });

    const terminateSpy = vi
      .spyOn(terminateModule, "pushToTerminateStream")
      .mockImplementation(() => {});

    const result = await verifyStreamKey("kush");

    expect(result).toEqual(true);
    expect(terminateSpy).not.toHaveBeenCalled(); // nothing should be terminated on the happy path
  });
});

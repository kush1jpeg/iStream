import { redisClient } from "../config/redis";
import { checkStreamLoadStatus } from "./checkStreamLoadStatus";
import * as terminateModule from "../helpers/pushToTerminate.js";
import { vi } from "vitest";

const MAX_CONCURRENT_STREAMS = process.env.MAX_CONCURRENT_STREAMS || 4;

describe("checkStreamLoadStatus", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("allows the stream when under capacity", async () => {
    vi.spyOn(redisClient, "scard").mockResolvedValue(3); // well under MAX_CONCURRENT_STREAMS
    const terminateSpy = vi
      .spyOn(terminateModule, "pushToTerminateStream")
      .mockImplementation(() => {});

    const result = await checkStreamLoadStatus("key1", "stream1", "user1");

    expect(result).toEqual({ allowed: true });
    expect(terminateSpy).not.toHaveBeenCalled(); // nothing should be terminated on the happy path
  });

  it("rejects and terminates when at exactly MAX_CONCURRENT_STREAMS", async () => {
    vi.spyOn(redisClient, "scard").mockResolvedValue(MAX_CONCURRENT_STREAMS);
    const terminateSpy = vi
      .spyOn(terminateModule, "pushToTerminateStream")
      .mockImplementation(() => {});

    const result = await checkStreamLoadStatus("key1", "stream1", "user1");

    expect(result).toEqual({ allowed: false });
    expect(terminateSpy).toHaveBeenCalledWith("stream1", "user1");
    expect(terminateSpy).toHaveBeenCalledTimes(1);
  });

  it("rejects when over capacity", async () => {
    vi.spyOn(redisClient, "scard").mockResolvedValue(
      MAX_CONCURRENT_STREAMS + 50,
    );
    vi.spyOn(terminateModule, "pushToTerminateStream").mockImplementation(
      () => {},
    );

    const result = await checkStreamLoadStatus("key1", "stream1", "user1");

    expect(result).toEqual({ allowed: false });
  });
});

import { filterUnsent } from "./filterUnsent";

describe("filterUnsent", () => {
  it("removes a user who is already in the sent set", () => {
    const notifications = [
      { userId: "a", actorId: "x", type: "stream", createdAt: new Date() },
      { userId: "b", actorId: "x", type: "stream", createdAt: new Date() },
    ];
    const alreadySent = new Set(["a"]); // pretend 'a' already got notified

    const result = filterUnsent(notifications, alreadySent);

    expect(result).toHaveLength(1); // only 1 should survive
    expect(result[0].userId).toBe("b"); // and it should be 'b', not 'a'
  });

  it("returns empty array when everyone is already sent", () => {
    const notifications = [
      { userId: "a", actorId: "x", type: "stream", createdAt: new Date() },
    ];
    const alreadySent = new Set(["a"]);
    const result = filterUnsent(notifications, alreadySent);
    expect(result).toHaveLength(0);
  });

  it("returns everyone when the set is empty", () => {
    const notifications = [
      { userId: "a", actorId: "x", type: "stream", createdAt: new Date() },
      { userId: "b", actorId: "x", type: "stream", createdAt: new Date() },
    ];
    const alreadySent = new Set([]);
    const result = filterUnsent(notifications, alreadySent);
    expect(result).toHaveLength(2);
  });
});

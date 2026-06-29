# Socket.IO Reference

This document maps the socket system rooted at `backend/src/config/socket.ts`.
It is meant as a future-agent guide: read this before changing socket events,
rooms, namespaces, Redis keys, or RabbitMQ consumers.

## Runtime Position

The HTTP server is created in `backend/src/index.ts` and passed into
`initSocket(server)` after MongoDB, Redis, RabbitMQ, cron jobs, and stream
health consumers have been initialized. Socket.IO shares the same HTTP server
and port as the Express API.

The backend currently uses:

- `socket.io` `^4.8.3`
- `@socket.io/redis-adapter` `^8.3.0`
- `ioredis` `^5.9.2`
- `amqplib` `^0.10.9`

## Global Initialization

`initSocket(server)` creates a Socket.IO server with CORS configured from
`FRONTEND_URL`, defaulting to `http://localhost:8080`.

```ts
const io = new Server(server, {
  cors: { origin: frontend_url, credentials: true },
});
```

The Socket.IO Redis adapter is then installed:

```ts
const subClient = redis.duplicate();
io.adapter(createAdapter(redis, subClient));
```

The adapter is important for horizontal scaling. Socket.IO rooms and emits can
propagate across multiple backend instances as long as every instance uses the
same Redis deployment. This is separate from the app-level Redis pub/sub client
called `redisSub` in `backend/src/config/redis.ts`.

## Authentication Model

The default namespace `/` is public. These namespaces require authentication:

- `/live`
- `/dm`
- `/group`
- `/notify`
- `/sidebar`

Authentication is done with `socketAuthMiddleware` from
`backend/src/middlewares/jwtVerify.ts`.

The middleware reads the `cookie` header from the Socket.IO handshake, parses an
`accessToken`, verifies it with `jwtkey`, then attaches these values:

- `socket.data.userId`: JWT `id`
- `socket.data.username`: username loaded from MongoDB `userModel`

If the cookie, token, decoded `id`, or user lookup is missing/invalid, the
middleware rejects the namespace connection with `AUTH_MISSING` or
`AUTH_INVALID`.

Important consequence: clients must connect with credentials/cookies enabled.
For browser clients, the Socket.IO client should be configured with
`withCredentials: true`.

## Namespace Overview

| Namespace | Auth | Main purpose | Handler |
| --- | --- | --- | --- |
| `/` | No | Public stream room joins/leaves, status counts, ping check | `registerStreamHandler` |
| `/live` | Yes | Authenticated live chat and superchat delivery | `registerLiveChatHandler`, `superchatHandler` |
| `/dm` | Yes | One-to-one direct messages | `registerPvtChatHandler` |
| `/group` | Yes | Group chat messages using group conversation keys | `registerGroupChatHandler` |
| `/notify` | Yes | Per-user notifications and stream logs bridged from Redis pub/sub | `registerNotifyHandler`, `redisSubNotifyListener` |
| `/sidebar` | Yes | Initial sidebar recommendations and live sidebar updates | `registerSidebarHandler`, `SidebarRedisListener` |

## Default Namespace: `/`

The default namespace is reachable by all users, authenticated or not. On
connection it registers:

- `ping:check`
- `stream:join`
- `stream:leave`
- default `disconnect` logging

It also broadcasts a global status count every 5 seconds.

### Event: `ping:check`

Client emits:

```ts
socket.emit("ping:check", clientTime);
```

Server responds only to that socket:

```ts
socket.emit("pong:check", clientTime);
```

The server does not calculate latency. The client can calculate round trip time
by comparing its current time when `pong:check` arrives against the echoed
`clientTime`.

### Event: `stream:join`

Client emits on `/`:

```ts
socket.emit("stream:join", { streamId });
```

Server flow:

1. Checks Redis key `stream:{streamId}` exists.
2. If the stream hash does not exist, emits `"error"` with
   `"Stream does not exist"` back to the caller.
3. Joins the socket to room `{streamId}`.
4. Increments `stream:{streamId}.viewers` by `1`.
5. Increments `stream:{streamId}.views` by `1`.
6. Emits updated counts to everyone in room `{streamId}`:
   - `stream:viewers`
   - `stream:views`

Server emits:

```ts
io.to(streamId).emit("stream:viewers", Number(viewers));
io.to(streamId).emit("stream:views", Number(views));
```

Important detail: `views` is a total counter and increments on every join.
`viewers` is meant to represent active viewers and should be decremented on
`stream:leave`.

### Event: `stream:leave`

Client emits on `/`:

```ts
socket.emit("stream:leave", { streamId });
```

Server flow:

1. Leaves room `{streamId}`.
2. Runs a Redis Lua script against `stream:{streamId}` to decrement `viewers`
   without going below zero.
3. Emits the updated viewer count to room `{streamId}`.

Server emits:

```ts
io.to(streamId).emit("stream:viewers", Number(viewers));
```

Current caveat: the handler does not verify that `stream:{streamId}` exists on
leave. If a stream has ended and Redis cleanup already deleted the hash, the Lua
script returns `0` and the room receives `stream:viewers: 0`.

### Broadcast: `statusbar:count`

Every 5 seconds, the root namespace broadcasts:

```ts
io.emit("statusbar:count", {
  clients,
  streams,
});
```

Where:

- `clients` is `io.engine.clientsCount`, the total Engine.IO connection count.
  This is not unique users. Multiple tabs and multiple namespace connections can
  affect the count.
- `streams` is `SCARD live:streams`.

This broadcast is sent on the default namespace only.

## Live Namespace: `/live`

`/live` is authenticated. It is responsible for chat messages inside stream
rooms and for superchat events after payment verification.

Important room convention: live chat emits to `streamId` rooms, but the room is
joined by `stream:join` on the default namespace. Socket.IO rooms are scoped per
namespace. A client that only joins `streamId` on `/` is not automatically in
the same room on `/live`.

Therefore, for `/live` chat to reach a viewer through `socket.to(streamId)` or
`io.to(streamId)`, the client must also join the `streamId` room in the `/live`
namespace or the server must be changed to join it there. As written,
`registerLiveChatHandler` does not define a `/live` join event.

### Event: `stream:send`

Client emits on `/live`:

```ts
liveSocket.emit("stream:send", { streamId, msg });
```

Server flow:

1. Reads `userId` and `username` from `socket.data`, populated by auth.
2. Checks Redis key `stream:{streamId}` exists.
3. If the stream does not exist, emits `"error"` with
   `"Stream does not exist"` to the sender.
4. Emits the chat message to every other socket in room `{streamId}` in the
   `/live` namespace.

Server emits:

```ts
socket.to(streamId).emit("stream:chat", {
  msg,
  userId,
  username,
  createdAt: Date.now(),
});
```

Because `socket.to(room)` excludes the sender, the sender does not receive their
own `stream:chat` event from the server. The UI must optimistically render it or
listen for some other acknowledgement if one is later added.

### RabbitMQ Consumer: `superchatHandler`

`superchatHandler(io.of("/live"))` is registered once during socket
initialization, before the `/live` connection handler.

Startup in `backend/src/index.ts` asserts:

- exchange `payment`, type `topic`
- queue `payment_superchat`
- binding `payment_superchat` to exchange `payment` with routing key
  `payment.superchat`

After Razorpay verification, `backend/src/controller/payment/superchat/verifyCallback.ts`
publishes the saved payment transaction to exchange `payment` with routing key
`payment.superchat`.

`superchatHandler` consumes queue `payment_superchat`. For each message:

1. Parses the payment payload.
2. Builds a smaller `superchat` object.
3. Emits to room `{payload.streamId}` in `/live`.
4. Acknowledges the RabbitMQ message.

Server emits:

```ts
io.to(payload.streamId!.toString()).emit("superchat", JSON.stringify(superchat));
```

Payload fields:

- `userId`
- `username`
- `message`
- `amount`
- `streamId`
- `userPfp`
- `currency`
- `status`
- `createdAt`

Current caveat: this event emits a JSON string, not an object. Clients must
`JSON.parse` it unless this is changed.

## Direct Message Namespace: `/dm`

`/dm` is authenticated and handles one-to-one conversations.

Room convention:

```ts
[userId, receiverId].sort().join(":")
```

This deterministic key is the same no matter which participant initiates the
chat. It is also stored as `conversation.conversationKey` in MongoDB.

Related Mongo models:

- `conversationModel` in `backend/src/models/conversation.ts`
- `msgModel` in `backend/src/models/msgPvt.ts`

Related REST setup:

- `createConvo` creates one-to-one conversations and uses the same sorted key.
- `getConversationMessages` fetches paginated message history by
  `conversationKey`.

### Event: `dm:join`

Client emits on `/dm`:

```ts
dmSocket.emit("dm:join", { receiverId });
```

Server flow:

1. Rejects silently if `receiverId` is missing.
2. Rejects silently if `receiverId === socket.data.userId`.
3. Builds room id by sorting sender and receiver ids.
4. Calls `conversationModel.findOneAndUpdate({ conversationKey: roomId, isGroup: false })`.
5. Joins the socket to room `{roomId}`.

Current caveat: `findOneAndUpdate` has no update document. In Mongoose this is
not useful and may error depending on runtime behavior. The join does not check
that the conversation exists or that the current user is a participant. The
`dm:send` path performs the real authorization check.

On caught errors, server emits:

```ts
socket.emit("dm:error", { code: "DM_JOIN_FAILED" });
```

### Event: `dm:send`

Client emits on `/dm`:

```ts
dmSocket.emit("dm:send", { receiverId, message });
```

Server flow:

1. Rejects silently if `receiverId` or `message` is missing.
2. Builds the sorted one-to-one room id.
3. Finds `conversationModel` by `conversationKey`.
4. Rejects silently if the conversation does not exist.
5. Checks `socket.data.userId` is in `conversation.participants`.
6. Creates a `msgPvt` document with:
   - `senderId`
   - `conversationKey`
   - `message`
7. Emits `dm:message` to other sockets in the room.
8. Emits `dm:sent` to the sender.
9. Sets `conversation.lastMessage` to the new message id and saves.

Server emits to recipient room members:

```ts
socket.to(roomId).emit("dm:message", {
  senderId: userId,
  receiverId,
  message,
});
```

Server emits to sender:

```ts
socket.emit("dm:sent", { ok: true });
```

On caught errors:

```ts
socket.emit("dm:error", { code: "DM_SEND_FAILED" });
```

Current caveat: the emitted `dm:message` does not include the persisted message
id, `createdAt`, or `conversationKey`. The client may need to refetch or infer
those.

### Event: `dm:read`

Client emits on `/dm`:

```ts
dmSocket.emit("dm:read", { conversationKey });
```

Server flow:

1. Marks all messages in `conversationKey` not sent by the current user as read
   by adding the current user id to `readBy`.
2. Loads the conversation by `conversationKey`.
3. Confirms the current user is a participant.
4. For each other participant, emits `message:read` to the one-to-one room.

Server emits:

```ts
socket.to(getRoomId(userId, participantId.toString())).emit("message:read", {
  conversationKey,
  readerId: userId,
});
```

On caught errors:

```ts
socket.emit("dm:error", { code: "DM_READ_FAILED" });
```

Current caveat: the update happens before the conversation membership check.
If a malicious user knows a `conversationKey`, the current code can mark
messages as read before discovering they are not a participant.

### Event: `dm:leave`

Client emits on `/dm`:

```ts
dmSocket.emit("dm:leave", { receiverId });
```

Server leaves the sorted one-to-one room. Missing `receiverId` is ignored.

## Group Namespace: `/group`

`/group` is authenticated and handles group conversations. It intentionally
reuses the `dm:*` event names even though it is a separate namespace.

Room convention: the room id is the group's `conversationKey`. Groups are
created by `createGroupConvo`, which uses a new Mongo ObjectId string as the
`conversationKey`.

### Event: `dm:join`

Client emits on `/group`:

```ts
groupSocket.emit("dm:join", { conversationKey });
```

Server flow:

1. Validates `conversationKey`.
2. Finds a conversation by `conversationKey`.
3. Emits `dm:error` `GROUP_NOT_FOUND` if missing.
4. Checks current user is in `group.participants`.
5. Emits `dm:error` `NOT_A_MEMBER` if not.
6. Joins room `{conversationKey}`.

Possible errors:

- `{ code: "INVALID_PAYLOAD" }`
- `{ code: "GROUP_NOT_FOUND" }`
- `{ code: "NOT_A_MEMBER" }`
- `{ code: "DM_JOIN_FAILED" }`

### Event: `dm:send`

Client emits on `/group`:

```ts
groupSocket.emit("dm:send", { conversationKey, message });
```

Server flow:

1. Validates both fields.
2. Finds conversation by `conversationKey`.
3. Confirms current user is a participant.
4. Creates a `msgPvt` document.
5. Emits `dm:message` to all other sockets in room `{conversationKey}`.
6. Emits `dm:sent` to sender.
7. Updates `conversation.lastMessage`.

Server emits to room members except sender:

```ts
socket.to(conversationKey).emit("dm:message", {
  senderId: userId,
  message,
});
```

Server emits to sender:

```ts
socket.emit("dm:sent", { ok: true });
```

Possible errors:

- `{ code: "INVALID_PAYLOAD" }`
- `{ code: "DM_SEND_FAILED" }`

Current caveat: as with one-to-one DMs, the live event payload does not include
message id, `createdAt`, or populated sender info.

### Event: `dm:read`

Client emits on `/group`:

```ts
groupSocket.emit("dm:read", { conversationKey });
```

Server flow:

1. Validates `conversationKey`.
2. Adds current user id to `readBy` for all messages in that conversation not
   sent by the current user.
3. Loads the conversation.
4. Confirms membership.
5. Emits `message:read` to room `{conversationKey}`.

Server emits:

```ts
socket.to(conversationKey).emit("message:read", {
  conversationKey,
  readerId: userId,
});
```

Current caveats:

- The code uses `conversationModel.findById(conversationKey)` here, while other
  group paths use `findOne({ conversationKey })`. This only works if the
  `conversationKey` is also the document `_id`. That is currently true for
  newly created groups because `createGroupConvo` sets `conversationKey` to a
  fresh ObjectId string, but it is a fragile assumption.
- The `forEach` over `otherParticipants` emits the same room-wide
  `message:read` once per other participant, so group members may receive
  duplicate read events.
- As in one-to-one DMs, the message update happens before membership is
  confirmed.

### Event: `dm:leave`

Client emits on `/group`:

```ts
groupSocket.emit("dm:leave", { conversationKey });
```

Server leaves room `{conversationKey}`. Missing `conversationKey` emits:

```ts
socket.emit("dm:error", { code: "INVALID_PAYLOAD" });
```

## Notification Namespace: `/notify`

`/notify` is authenticated. It maps each connected user to a room named by
their user id and bridges Redis pub/sub channels into that room.

### Connection Behavior

On connection:

```ts
socket.join(socket.data.userId);
```

This allows the namespace to target all active sockets for a user with:

```ts
io.to(userId).emit(...)
```

### Redis Pattern Listener

`redisSubNotifyListener(io.of("/notify"))` is registered once during socket
initialization. It subscribes to patterns:

- `notifications:*`
- `stream:log*`

When a pub/sub message arrives, the listener calculates:

```ts
const userId = channel.split(":")[1];
```

Then:

- For pattern `notifications:*`, emits event `notifications` with the raw
  message string to room `{userId}`.
- For pattern `stream:log*`, emits event `stream:logs` with the raw message
  string to room `{userId}`.

Server emits:

```ts
io.to(userId).emit("notifications", msg);
io.to(userId).emit("stream:logs", msg);
```

Expected Redis publish shapes:

```txt
PUBLISH notifications:{userId} "{...}"
PUBLISH stream:log:{userId} "{...}"
```

Current caveat: this backend contains the subscriber, but the exact publisher
for `notifications:{userId}` and `stream:log*` is not in the inspected socket
entrypoint. `publishNotifs` publishes to RabbitMQ exchange `notification`, not
directly to Redis pub/sub. Another worker/service likely consumes RabbitMQ and
publishes these Redis messages.

Current caveat: messages are delivered as raw strings. Clients should parse JSON
where appropriate.

## Sidebar Namespace: `/sidebar`

`/sidebar` is authenticated and is intended to provide quick sidebar data:
followed users who are live, followed users who are offline, and fallback users.

### Intended Connection Behavior

The intended behavior appears to be:

1. Join a room named by the current user's id.
2. Load sidebar data with `getSidebarData(userId)`.
3. Emit `sidebar:init` to the connecting socket.
4. Listen for Redis notifications and emit `sidebar:update` to affected users.

Initial server emit:

```ts
socket.emit("sidebar:init", {
  live,
  offline,
});
```

Where each user has:

- `_id`
- `username`
- `avatar`
- `currentFrame`
- `isLive`

### Actual Registered Behavior

`config/socket.ts` already runs inside:

```ts
io.of("/sidebar").on("connection", (socket) => {
  registerSidebarHandler(sidebar, socket);
});
```

But `registerSidebarHandler` adds another namespace-level connection listener:

```ts
export function registerSidebarHandler(io: Namespace, socket: Socket) {
  io.on("connection", async (socket) => {
    ...
  });
}
```

This means the first `/sidebar` connection calls `registerSidebarHandler`, which
registers an additional connection listener for future connections. Each later
connection can register yet another listener. This can cause duplicate
`sidebar:init` handling and listener growth over time.

The simpler intended implementation would likely act on the provided `socket`
directly, not call `io.on("connection")` again inside the handler.

### Data Source: `getSidebarData`

`getSidebarData(userId)` works as follows:

1. Query `followModel` for users followed by `userId`, excluding self.
2. If the user follows nobody, call `getRandomFallback(userId)`.
3. For each followed user, read Redis key `live:user:{followedId}`.
4. If the key exists, treat that followed user as live.
5. If the key does not exist, treat them as offline.
6. Load live users from MongoDB `userModel`.
7. Load up to 5 offline users from MongoDB `userModel`.
8. If total results are fewer than 7, sample random additional users from
   MongoDB and append them to `offline`.

Redis keys involved:

- `live:user:{userId}` -> stream id if that user is live
- `live:streams` -> set of active stream ids
- `stream:{streamId}` -> stream hash

### Fallback Behavior

If the user follows nobody:

1. Read `SMEMBERS live:streams`.
2. If streams exist, randomly select up to 5 stream ids.
3. Read each `stream:{streamId}` hash.
4. Return live users from those stream hashes, excluding the requesting user.
5. If no live streams exist, sample 5 random users from MongoDB and return them
   as offline.

Current caveat: `streamer` is stored in Redis as a JSON string by
`startStream`, but `getRandomFallback` treats `item.streamer` like an object.
Unless `ioredis` or a caller parses this elsewhere, fallback live users may have
empty usernames/avatars because `item.streamer?.username` does not work on a
JSON string.

### Redis Listener: `SidebarRedisListener`

`SidebarRedisListener(io.of("/sidebar"))` is registered once during socket
initialization. It subscribes to Redis channel:

```txt
notifications
```

On each message:

1. Parse JSON.
2. Check `payload.type === "stream"`.
3. Check `payload.userId === userId`.
4. Emit `sidebar:update` to room `{payload.userId}`.

Server emits:

```ts
io.to(payload.userId).emit("sidebar:update", payload);
```

Current caveat: `userId` is a module-level variable. It is overwritten by the
latest connection handled inside `registerSidebarHandler`. That means sidebar
updates can be filtered against the wrong user when multiple users are
connected. In a multi-user server this should be considered unsafe.

Current caveat: `publishNotifs` publishes stream notifications to RabbitMQ,
while this listener subscribes to Redis channel `notifications`. Unless another
worker republishes RabbitMQ notification messages into Redis channel
`notifications`, `sidebar:update` will not fire from `startStream` alone.

## Stream Redis State

The socket code depends heavily on Redis state created by stream controllers.

### Created by `startStream`

When a streamer starts a stream, `backend/src/controller/stream/startStream.ts`
creates:

```txt
HSET stream:{streamId} ...
SET live:user:{userId} {streamId}
SADD live:streams {streamId}
SET streamKey:{streamKey} {streamId} EX 15
```

Fields stored in `stream:{streamId}` include:

- `streamer`: JSON string with username, avatar, frame, animation
- `stream`: JSON string with title, description, thumbnail, tags
- `streamerId`
- `streamId`
- `HLS_PATH`
- `inactiveSince`
- `status`
- `viewers`
- `likes`
- `views`
- `createdAt`

Socket handlers use this state for:

- checking whether a stream exists before joining or sending chat
- incrementing `viewers` and `views`
- global stream count via `live:streams`
- sidebar live/offline decisions via `live:user:{id}`

### Deleted by `endStream` / `terminateStream`

When a stream ends:

```txt
DEL stream:{streamId}
DEL live:user:{userId}
SREM live:streams {streamId}
DEL streamKey:{streamKey}
DEL stream:likes:{streamId}
```

Before deletion, final `viewers`, `views`, and `likes` are copied from Redis
back into the MongoDB stream document.

### Health Poller Interaction

`startStreamHealthPoller` runs every 30 seconds. It scans `live:streams` and
marks streams as:

- `inactive` if current status is `live` or `pending`
- `ended` after 10 minutes of inactivity, then removes from `live:streams` and
  publishes `stream.end` to RabbitMQ

This is not a Socket.IO handler, but it affects socket behavior because once the
Redis hash or live set changes, joins, status counts, and sidebar data change.

## RabbitMQ State

Socket.IO directly consumes RabbitMQ only for superchat delivery.

Startup creates:

- exchange `notification`, type `direct`
- exchange `stream`, type `topic`
- queue `stream_end`, bound to `stream` with `stream.end`
- exchange `payment`, type `topic`
- queue `payment_superchat`, bound to `payment` with `payment.superchat`

Socket path:

```txt
Razorpay verify
  -> publish exchange payment, routing key payment.superchat
  -> queue payment_superchat
  -> /live superchatHandler consumes
  -> emit "superchat" to /live room {streamId}
```

Notification path visible in this repo:

```txt
publishNotifs
  -> publish exchange notification, routing key msg.type
```

The socket notification namespace listens to Redis pub/sub, not RabbitMQ. There
must be another bridge/consumer for RabbitMQ notification messages if clients
are expected to receive them through `/notify` or `/sidebar`.

## Event Contract Summary

### Client to Server

| Namespace | Event | Payload | Notes |
| --- | --- | --- | --- |
| `/` | `ping:check` | `clientTime: number` | Echoed back as `pong:check`. |
| `/` | `stream:join` | `{ streamId }` | Joins stream room and increments viewers/views. |
| `/` | `stream:leave` | `{ streamId }` | Leaves stream room and decrements viewers. |
| `/live` | `stream:send` | `{ streamId, msg }` | Requires auth and stream Redis hash. |
| `/dm` | `dm:join` | `{ receiverId }` | Joins sorted one-to-one room. |
| `/dm` | `dm:send` | `{ receiverId, message }` | Persists message and emits to room. |
| `/dm` | `dm:read` | `{ conversationKey }` | Marks messages read. |
| `/dm` | `dm:leave` | `{ receiverId }` | Leaves sorted one-to-one room. |
| `/group` | `dm:join` | `{ conversationKey }` | Joins group room after membership check. |
| `/group` | `dm:send` | `{ conversationKey, message }` | Persists message and emits to group. |
| `/group` | `dm:read` | `{ conversationKey }` | Marks messages read and emits read event. |
| `/group` | `dm:leave` | `{ conversationKey }` | Leaves group room. |

### Server to Client

| Namespace | Event | Payload | Notes |
| --- | --- | --- | --- |
| `/` | `pong:check` | `clientTime` | Echo response. |
| `/` | `stream:viewers` | `number` | Sent to stream room. |
| `/` | `stream:views` | `number` | Sent to stream room on join. |
| `/` | `statusbar:count` | `{ clients, streams }` | Broadcast every 5 seconds. |
| `/live` | `stream:chat` | `{ msg, userId, username, createdAt }` | Sender excluded. |
| `/live` | `superchat` | JSON string | Emitted to stream room from RabbitMQ payment queue. |
| `/dm` | `dm:message` | `{ senderId, receiverId, message }` | Sender excluded. |
| `/dm` | `dm:sent` | `{ ok: true }` | Sender acknowledgement. |
| `/dm` | `message:read` | `{ conversationKey, readerId }` | Sent to other participant room. |
| `/dm` | `dm:error` | `{ code }` | Error codes vary by handler. |
| `/group` | `dm:message` | `{ senderId, message }` | Sender excluded. |
| `/group` | `dm:sent` | `{ ok: true }` | Sender acknowledgement. |
| `/group` | `message:read` | `{ conversationKey, readerId }` | May duplicate in current code. |
| `/group` | `dm:error` | `{ code }` | Error codes vary by handler. |
| `/notify` | `notifications` | raw string | From Redis `notifications:*`. |
| `/notify` | `stream:logs` | raw string | From Redis `stream:log*`. |
| `/sidebar` | `sidebar:init` | `{ live, offline }` | Intended initial sidebar state. |
| `/sidebar` | `sidebar:update` | parsed payload object | From Redis `notifications` channel. |

## Rooms Summary

| Room name | Namespace | Who joins | Used for |
| --- | --- | --- | --- |
| `{streamId}` | `/` | Viewers via `stream:join` | Viewer/view count updates. |
| `{streamId}` | `/live` | Not currently joined by this server | Live chat and superchat target room. |
| `{sortedUserIdA}:{sortedUserIdB}` | `/dm` | DM participants via `dm:join` | One-to-one messages/read receipts. |
| `{conversationKey}` | `/group` | Group members via `dm:join` | Group messages/read receipts. |
| `{userId}` | `/notify` | User socket on connect | User notifications/logs. |
| `{userId}` | `/sidebar` | Intended user socket on connect | Sidebar updates. |

Remember: Socket.IO rooms are namespace-local. A socket in room `abc` on `/`
is not in room `abc` on `/live`, `/dm`, or any other namespace.

## Current Watch-Outs

These are not necessarily requested fixes, but they matter when reasoning about
the current behavior.

1. `/live` has no join handler for stream rooms, but live chat and superchat
   emit to `/live` room `{streamId}`. Joining `{streamId}` on `/` does not place
   the socket into `/live` room `{streamId}`.
2. `/sidebar` registers a nested `io.on("connection")` listener inside an
   existing connection handler. This can multiply listeners and duplicate
   `sidebar:init`.
3. `/sidebar` uses a module-level `userId`, which is overwritten by later
   connections and can break per-user filtering.
4. `redisSub` is shared by notification and sidebar listeners. It subscribes to
   both exact channels and patterns and has both `message` and `pmessage`
   handlers. This is legal for Redis pub/sub, but changes should be careful not
   to accidentally add duplicate listeners during hot reload or repeated init.
5. DM/group read handlers update messages before confirming the current user is
   a participant.
6. Group `dm:read` uses `findById(conversationKey)` while other group handlers
   use `findOne({ conversationKey })`.
7. Group `dm:read` emits the same `message:read` event once per other
   participant, even though the emit targets the entire room each time.
8. Superchat and notification/log payloads are emitted as strings, while most
   chat events emit objects.
9. Several validation failures return silently instead of emitting an error,
   especially in `/dm`.
10. `statusbar:count.clients` counts Engine.IO connections, not unique logged-in
   users.

## Suggested Mental Model

Think of the socket layer as three connected systems:

1. Stream presence and counts are Redis-backed. The default namespace joins
   stream rooms and mutates `stream:{streamId}` counters.
2. Chat messages are Mongo-backed. DM/group sockets validate conversations,
   persist `msgPvt` documents, then fan out room events.
3. Notifications and superchats are broker-backed. Superchat uses RabbitMQ
   directly from `/live`; notifications appear to require a RabbitMQ-to-Redis
   bridge before `/notify` and `/sidebar` receive them.

When changing any event, check all three layers: the namespace room, the backing
state, and whether the payload is object or string.

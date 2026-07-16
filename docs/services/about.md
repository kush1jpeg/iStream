
iStream is constructed as a multi-service distributed platform where each container has a clearly defined runtime responsibility and failure domain.

The service topology is intentionally split into: ingest, orchestration, transcoding, storage/delivery, and application layers. This architecture enables live RTMP ingest, adaptive HLS delivery, real-time chat/payment flows, and autoscaling containerized FFmpeg workers.

## Service responsibilities

- [**nginx**](/config/nginx/nginx.conf): nginx sits as a single entry point on port 8888, handling three jobs behind one gateway 

    - proxying API and Socket.IO traffic to the backend with rate limiting, and resolving both live and VOD playback through an identity-indirection pattern.
    - Both live ingest and R2 storage paths are keyed by streamKey internally. Exposing that key in any client-facing URL would leak an ingest-adjacent credential, effectively handing out the keys to impersonate a broadcast, not just access a video. nginx closes that gap: each HLS request triggers an internal `auth_request` subrequest to a resolver endpoint (job-server for live, backend for VOD), which looks up the real storage location server-side and returns it only in a response header, invisible to the client. For live streams, nginx rewrites the path locally and serves segments from disk. For VOD, since content lives in a private R2 bucket, the resolver returns a short-lived presigned URL, and nginx proxies the actual bytes back to the client rather than redirecting — so neither the signature nor the streamKey ever reaches the client.
    - Both the resolve paths are cached (`proxy_cache`, keyed per exact file rather than per stream) so repeated segment requests during playback don't hammer the resolver on every `.ts` file. The result is  a public-facing player where the only thing ever exposed to a client is an opaque, meaningless identifier and the real ingest credentials and storage layout stay entirely server-side.....handled by the nginx.

- [**mediamtx**](/config/mediamtx/): functions as the RTMP ingest gateway. It accepts streaming connections from OBS or any RTMP client, then triggers a `runOnReady` webhook to the `job-server`. This decouples stream ingest from authorization and job scheduling.
[read about mediamtx ->](https://mediamtx.org/)

- **rabbitmq**: is the central message broker. It carries the `stream.jobs` direct exchange for worker dispatch, a `payment` topic exchange for payment/superchat routing, and a `notification` direct exchange for notifications. This event-driven layer isolates the stream processing pipeline from backend API state and allows replayable, asynchronous worker orchestration.

- **redis**: maintains live state and coordination data. It stores active stream metadata, worker heartbeat status, idle/busy worker sets, and health flags used by the autoscaler. Redis is the fast in-memory source of truth for routing decisions and runtime service orchestration.

- [**auto-scaler**](/autoScaler/): This service implements a polling-based reconciliation loop rather than event-driven scaling and evaluates cluster state derived from Redis hashes (`workers`) and per-worker heartbeat keys (`worker:heartbeat:<containerId>`). These signals are used to infer worker liveness, utilization pressure, and scheduling capacity -> basically removing stale or crashed workers when they exceed the configured timeout threshold. It also removes idle workers after sustained inactivity to optimize resource usage.

Overall, this module acts as a lightweight, orchestration system, a simplified, custom-built alternative to K8-style autoscaling tailored specifically for FFmpeg workloads.

Right now this is a very brute-force, very beginner-like architecture cuz it assumes just reactive control-
  - check current busy workers
  - instantly spawn or kill

instead a better optimization would have been making a system which scales based on demand over time- sorta of a prediction system based lets say a variable called pressure score which gets updated and the scale up and scale down is smooth and slow not instant like right now;


- [**job-server**](/jobServer/): is the first validation gate for ingest jobs. It receives `MediaMTX` webhook notifications, validates stream keys against Redis, and publishes stream jobs to RabbitMQ. This makes the system resilient by ensuring only authorized ingest streams enter the worker queue, also handles the rolling lease mechanism to detect weather the streamer is streaming/disconnected/forgot the stream after creating it.

- [**backend**](/backend/): is the primary application service. It runs Express + Socket.io, sets up RabbitMQ exchanges, connects to MongoDB for persistent data, manages Redis state, and exposes API routes for auth, user, stream, chat, and shop/payment flows. The backend also handles OAuth configuration, payment exchange bindings, and notification publish semantics.

I have had planned to split the concerns - like seperate auth-service, payment-gateway, user-service like a chad microservice architecture, grpc calling, but it adds too much unnecessary complexity + it would be a time-waste for now;

- [**shared**](/shared/): is a shared helper package to use types, helper functions across the whole project;

- [**notification-service**](/notification/): is a separated delivery microservice that consumes the notification exchange and sends out emails or user alerts. By isolating notification processing, the system avoids coupling email delivery failures to core streaming availability. There should have had been multiple services instead of tightly coupling different frequency-events into one single process/server- for eg- consumeStreamNotifs doing a 500-follower batch will starve consumeOTPMails in the same event loop. A cleaner and more scalable approach would be seperate concerns handled by seperate services would have looked like -

  - notification-service/
    → consumes: follow_queue, like_queue, chat_queue
    → light, stateless, scale freely
    → prefetch: 10

  - stream-fanout-service/
    → consumes: stream_queue only
    → heavy, long-running batches
    → prefetch: 1, scale carefully

  - mail-service/
    → consumes: otp_queue
    → I/O bound on SMTP, scale independently

  - payment-service/
    → consumes: payment_queue
    → never share a process with anything else
    → prefetch: 1, dead letter queue mandatory

also when i would use k8, i would be able to add replicas for a particular service.

- [**workerBackend**](/workerBackend/): is the FFmpeg worker runtime. Each worker consumes a `stream.jobs` message from RabbitMQ, pulls the RTMP source from `MediaMTX`, spawns the `ffmpeg` process, writes HLS segments into the shared volume, and uploads VOD segments to Cloudflare R2. Workers also report status back into Redis via pub/sub to enable the streamer stay updated regarding the stream status, enabling clean autoscaler-driven lifecycle management.

```bash
TTL update to autoscaler
         ↓
FFmpeg writes segment.ts
         ↓
Watcher fires - RPUSH segment path to Redis list
         ↓
Separate upload consumer loop - BLPOP from Redis list
         ↓
Upload to R2
         ↓
Success → delete local file
Failure → RPUSH back to queue with retry count
         ↓
Max retries → dead letter queue/exchange + alert
```


## Why this?

This service design demonstrates a mature separation of concerns acc to my llm, but mostly it was inspired from different systems videos; it can be that the current architectural design/implementation is actually bad, pls point it out and help me improve my understanding.

- ingest is isolated from authorization
- event dispatch is handled by RabbitMQ
- runtime orchestration is handled by a dedicated autoscaler
- live delivery and VOD storage are separated
- application concerns are decoupled from media processing concerns
- each custom-built service has a /health checkpoint to know about the service health;

### Read Next -

- [Architecture](./architecture.md)
- [Contributing](./contributing.md)

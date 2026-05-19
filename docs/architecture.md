# iStream Architecture

## Overview

```mermaid
graph TD
    subgraph Client["🖥️  Client"]
        OBS[OBS / Streaming Client]
        FE[Frontend\nhls.js + React]
    end

    subgraph Ingest["📡  Ingest"]
        MTX[MediaMTX\nRTMP Server\nport 1935]
    end

    subgraph Orchestration["⚙️  Orchestration"]
        JS[Job Server\nvalidates stream key\nenqueues jobs]
        RMQ[(RabbitMQ\nstream.jobs)]
        AS[Autoscaler\nDockerode]
    end

    subgraph Workers["🎬  Transcoding Workers"]
        W1[FFmpeg Worker 1]
        W2[FFmpeg Worker 2]
        WN[FFmpeg Worker N]
    end

    subgraph Storage["💾  Storage"]
        VOL[(hls_data\nDocker Volume)]
        R2[(Cloudflare R2\nVOD Storage)]
    end

    subgraph Serving["🌐  Serving"]
        NGX[Nginx\nStatic HLS Server]
        BE[Backend\nREST + Socket.io]
    end

    subgraph Data["🗄️  Data"]
        RD[(Redis\nLive State)]
        MDB[(MongoDB\nPersistent Data)]
    end

    OBS -->|RTMP| MTX
    MTX -->|runOnReady webhook| JS
    JS -->|validate key| RD
    JS -->|enqueue job| RMQ
    RMQ -->|consume| W1
    RMQ -->|consume| W2
    RMQ -->|consume| WN
    AS -->|spawn / kill| W1
    AS -->|spawn / kill| W2
    AS -->|spawn / kill| WN
    AS -->|heartbeat check| RD
    W1 -->|HLS segments| VOL
    W2 -->|HLS segments| VOL
    WN -->|HLS segments| VOL
    W1 -->|VOD upload| R2
    VOL -->|read only| NGX
    NGX -->|serve HLS| FE
    BE -->|REST + WS| FE
    BE -->|read / write| RD
    BE -->|read / write| MDB
    FE -->|VOD request| BE
    BE -->|R2 URL| FE
    FE -->|fetch segments| R2

    classDef client fill:#0f172a,stroke:#6366f1,color:#c7d2fe
    classDef ingest fill:#0f172a,stroke:#06b6d4,color:#cffafe
    classDef orchestration fill:#0f172a,stroke:#6366f1,color:#c7d2fe
    classDef worker fill:#0f172a,stroke:#8b5cf6,color:#ede9fe
    classDef storage fill:#0f172a,stroke:#0ea5e9,color:#e0f2fe
    classDef serving fill:#0f172a,stroke:#06b6d4,color:#cffafe
    classDef data fill:#0f172a,stroke:#8b5cf6,color:#ede9fe

    class OBS,FE client
    class MTX ingest
    class JS,RMQ,AS orchestration
    class W1,W2,WN worker
    class VOL,R2 storage
    class NGX,BE serving
    class RD,MDB data
```

---

## Streaming Pipeline

> From OBS hitting the ingest server to the viewer receiving HLS in their browser.

```mermaid
sequenceDiagram
    actor Streamer
    participant OBS
    participant MediaMTX
    participant JobServer
    participant Redis
    participant RabbitMQ
    participant Worker
    participant Volume
    participant Nginx
    actor Viewer

    Streamer->>OBS: click Start Streaming
    OBS->>MediaMTX: RTMP connect (port 1935)
    MediaMTX->>JobServer: POST runOnReady { MTX_PATH }
    JobServer->>Redis: GET streamKey hash to streamId
    JobServer->>RabbitMQ: publish job { MTX_PATH }
    RabbitMQ->>Worker: deliver job
    Worker->>Redis: HSET workers id busy
    Worker->>MediaMTX: pull RTMP stream
    Worker->>Volume: write /hls/live/key/master.m3u8
    Worker->>Volume: write /hls/live/key/v0/index0.ts
    Worker->>Volume: write /hls/live/key/v1/index0.ts
    Viewer->>Nginx: GET /hls/live/key/master.m3u8
    Nginx->>Volume: read file
    Nginx-->>Viewer: master.m3u8
    Viewer->>Nginx: GET /hls/live/key/v1/index0.ts
    Nginx-->>Viewer: video segment
```

---

## VOD Recording Pipeline

> Segments are uploaded to Cloudflare R2 as FFmpeg writes them. Disk usage stays constant regardless of stream duration.

```mermaid
flowchart LR
    subgraph WC["Worker Container"]
        FFM["FFmpeg Process"]
        WATCH["Chokidar Watcher\nawaitWriteFinish 500ms"]
    end

    subgraph HV["hls_data Volume"]
        LIVE["hls/live/streamKey\nmaster.m3u8\nhls_list_size=6\ndelete_segments"]
        VOD["hls/vod/streamKey\nindex.m3u8\nhls_list_size=0\nappend_list"]
    end

    subgraph CR2["Cloudflare R2"]
        R2["vods/streamId\nindex.m3u8\nsegments"]
    end

    FFM -->|"1080p copy + 480p transcode"| LIVE
    FFM -->|"1080p copy only no re-encode"| VOD
    VOD -->|"file add event"| WATCH
    WATCH -->|"upload .ts segment"| R2
    WATCH -->|"upload updated m3u8"| R2
    WATCH -->|"delete .ts after upload"| VOD
```

---

## Autoscaler — Worker Lifecycle

```mermaid
stateDiagram-v2
    [*] --> idle : container spawned\nMIN_WORKERS on startup
    idle --> busy : job consumed from RabbitMQ
    busy --> uploading : FFmpeg exits\nstream ended
    uploading --> idle : R2 upload complete\nlocal cleanup done
    idle --> [*] : autoscaler scales down\ntotal > MIN_WORKERS
    busy --> dead : SIGKILL detected\nheartbeat timeout 15s
    uploading --> dead : SIGKILL detected\nheartbeat timeout 15s
    dead --> [*] : autoscaler removes\ncontainer and Redis entry
```

---

## Auth Flow

```mermaid
sequenceDiagram
    participant Client
    participant Backend
    participant MongoDB

    Client->>Backend: POST /api/auth/login
    Backend->>MongoDB: find user, verify bcrypt hash
    MongoDB-->>Backend: user document
    Backend-->>Client: HTTP-only cookie JWT 15min + refreshToken 7d

    Note over Client,Backend: token expired

    Client->>Backend: any request returns 401
    Client->>Backend: POST /api/auth/refresh-token
    Backend->>Backend: verify and rotate refresh token
    Backend-->>Client: new JWT cookie + new refreshToken cookie
    Client->>Backend: retry original request
    Backend-->>Client: success
```

---

## RabbitMQ Exchange Topology

```mermaid
flowchart LR
    subgraph Producers
        JS[Job Server]
        BE[Backend]
    end

    subgraph Exchanges
        SE[stream.jobs\ndirect]
        PE[payment\ntopic]
        NE[notification\ndirect]
    end

    subgraph Queues
        SQ[stream.jobs]
        SCQ[superchat_queue\npayment.superchat]
        PNQ[payment_notify_queue\npayment.*]
        NQ[notification_queue]
    end

    subgraph Consumers
        W[FFmpeg Workers]
        SH[Superchat Handler\nSocket.io]
        NS[Notification Service\nNodemailer]
    end

    JS -->|enqueue| SE --> SQ --> W
    BE -->|payment.superchat| PE --> SCQ --> SH
    PE --> PNQ --> NS
    BE -->|follow.notify| NE --> NQ --> NS
```

---

## Redis Data Model

```mermaid
flowchart TD
    subgraph Live Stream State
        LS[live:streams\nSET of streamIds]
        SD[stream:streamId\nHASH\nstreamer, title, viewers, hlsUrl]
        LU[live:user:userId\nSTRING → streamId]
        SK[streamKey:hash\nSTRING → streamId]
    end

    subgraph Worker State
        WK[workers\nHASH\ncontainerId → idle/busy/uploading/dead]
        HB[heartbeat\nHASH\ncontainerId → timestamp]
    end

    subgraph Presence
        OU[live:user:userId\nSET of userIds+streamIds]
    end

    LS -->|lookup| SD
    LU -->|maps to| SD
    SK -->|authenticates| SD
    WK -->|paired with| HB
```

---

## Autoscaler — Worker Lifecycle

```mermaid
stateDiagram-v2
    [*] --> idle : container spawned\nMIN_WORKERS on startup
    idle --> busy : job consumed from RabbitMQ
    busy --> uploading : FFmpeg exits\nstream ended
    uploading --> idle : R2 upload complete\nlocal cleanup done
    idle --> [*] : autoscaler scales down\ntotal > MIN_WORKERS
    busy --> dead : SIGKILL detected\nheartbeat timeout 15s
    uploading --> dead : SIGKILL detected\nheartbeat timeout 15s
    dead --> [*] : autoscaler removes\ncontainer and Redis entry
```

---

## Auth Flow

```mermaid
sequenceDiagram
    participant Client
    participant Backend
    participant MongoDB

    Client->>Backend: POST /api/auth/login
    Backend->>MongoDB: find user, verify bcrypt hash
    MongoDB-->>Backend: user document
    Backend-->>Client: HTTP-only cookie JWT 15min + refreshToken 7d

    Note over Client,Backend: token expired

    Client->>Backend: any request returns 401
    Client->>Backend: POST /api/auth/refresh-token
    Backend->>Backend: verify and rotate refresh token
    Backend-->>Client: new JWT cookie + new refreshToken cookie
    Client->>Backend: retry original request
    Backend-->>Client: success
```

---

## RabbitMQ Exchange Topology

```mermaid
flowchart LR
    subgraph Producers
        JS[Job Server]
        BE[Backend]
    end

    subgraph Exchanges
        SE[stream.jobs\ndirect]
        PE[payment\ntopic]
        NE[notification\ndirect]
    end

    subgraph Queues
        SQ[stream.jobs]
        SCQ[superchat_queue\npayment.superchat]
        PNQ[payment_notify_queue\npayment.*]
        NQ[notification_queue]
    end

    subgraph Consumers
        W[FFmpeg Workers]
        SH[Superchat Handler\nSocket.io]
        NS[Notification Service\nNodemailer]
    end

    JS -->|enqueue| SE --> SQ --> W
    BE -->|payment.superchat| PE --> SCQ --> SH
    PE --> PNQ --> NS
    BE -->|follow.notify| NE --> NQ --> NS
```

---

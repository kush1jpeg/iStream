<h1 align="center">
  <br/>
  <img src="/frontend/public/icon.png" width="180" alt="Logo"/>
  <br/>
  iStream
  <br/>
</h1>

<h4 align="center">

</h4>

<p align="center" style="display:flex; flex-wrap:wrap; justify-content:center; gap:10px">
  <a href="docs/architecture.md">Architecture</a> •
  <a href="#getting-started">Getting Started</a> •
  <a href="docs/tilt-setup.md">Tilt Setup</a> •
  <a href="docs/api-reference.md">API Reference</a> •
  <a href="docs/contributing.md">Contributing</a>
</p>

<p align="center" style="display:flex; flex-wrap:wrap; justify-content:center; gap:10px;">
  <img src="https://img.shields.io/badge/Node.js-339933?style=flat-square&logo=node.js&logoColor=white"/>
  <img src="https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat-square&logo=typescript&logoColor=white"/>
  <img src="https://img.shields.io/badge/FFmpeg-ABR-FF0000?style=flat-square&logo=ffmpeg&logoColor=white"/>
  <img src="https://img.shields.io/badge/Docker-Compose-2496ED?style=flat-square&logo=docker&logoColor=white"/>
  <img src="https://img.shields.io/badge/Redis-7.x-DC382D?style=flat-square&logo=redis&logoColor=white"/>
  <img src="https://img.shields.io/badge/RabbitMQ-3.x-FF6600?style=flat-square&logo=rabbitmq&logoColor=white"/>
  <img src="https://img.shields.io/badge/React-Vite-61DAFB?style=flat-square&logo=react&logoColor=black"/>
  <img src="https://img.shields.io/badge/Nginx-HLS/PROXY_server-009639?style=flat-square&logo=nginx&logoColor=white"/>
  <img src="https://img.shields.io/badge/MediaMTX-RTMP_Ingest-FF6B35?style=flat-square&logo=webrtc&logoColor=white"/>
  <img src="https://img.shields.io/badge/MongoDB-Atlas-47A248?style=flat-square&logo=mongodb&logoColor=white"/>
  <img src="https://img.shields.io/badge/Cloudflare-R2-F38020?style=flat-square&logo=cloudflare&logoColor=white"/>
  <img src="https://img.shields.io/badge/License-BSD_3--Clause-A020F0?style=flat-square"/>
</p>

---

---

## What is iStream?

iStream is an adaptive bitrate live streaming platform built from scratch (leaving the frontend) - no managed streaming services, no shortcuts, handling the complete pipeline from RTMP ingest through FFmpeg -> transcoding into diff qualities -> HLS delivery (live/VOD)

With dynamic worker autoscaling, VOD recording of the stream with segment-level R2 uploads, comes alongside as modern distributed architechture, superchat support, integration of payment-gateway, seperate notification service for isolated deliveries via queue/exchangers, and many more.

The goal was not to use managed streaming services but to build every layer: from RTMP ingest to HLS delivery, from autoscaling worker containers to real-time socket communication.


## Getting Started

### What you need

- Docker installed and running. iStream is composed of multiple services and relies on containers for the full local stack.
- Tilt installed. Tilt is the recommended entry point because it understands the repo’s `Tiltfile`, watches source changes, and manages service dependency ordering automatically;
- if you want to run the stack without Tilt, but note that you will lose Tilt’s live rebuild, multi-service log UI, and selective service startup features.not a necessity but definitely a requirement for dev - [setup](/docs/tilt-setup.md)

### Start the service

From the repository root, simply run:

```bash
tilt up
```

This launches the development stack managed by the top-level `Tiltfile`.

If you do not want to use Tilt, you can fall back to Docker Compose with:

```bash
docker compose up
```

But this will not provide the live development workflow, automatic rebuilds, or the service introspection that Tilt adds.

### For contributors

If you are contributing code, please read these docs first:

- [architecture](docs/architecture.md) — to understand how the streaming pipeline, jobs, workers, and storage fit together.
- [contribute](docs/contributing.md) — a humble request


## Contact

Built by **kush1jpeg**

- GitHub: [@kush1jpeg](https://github.com/kush1jpeg)
- LinkedIn: [kushagra-gupta-dystopia](https://www.linkedin.com/in/kushagra-gupta-dystopia)
- Blog: [kush1jpeg.github.io](https://kush1jpeg.github.io)
- Email: [kushuvikas@gmail.com](mailto:kushuvikas@gmail.com)

---

> **[hire me before someone else does](mailto:kushuvikas@gmail.com)**


## License

iStream is licensed under the [BSD 3-Clause License](./LICENSE).

Copyright (c) 2025, Kushagra Gupta([@owner](https://github.com/kush1jpeg)). All rights reserved.

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following described conditions are met.

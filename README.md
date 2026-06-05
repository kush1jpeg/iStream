<h1 align="center">
  <img src="/frontend/public/icon.png" width="180" alt="Logo" />
  <br/>
  iStream
  <br/>
</h1>

<p align="center" style="display:flex; flex-wrap:wrap; justify-content:center; gap:10px">
  <a href="docs/architecture.md">Architecture</a> •
  <a href="docs/getting-started.md">Getting Started</a> •
  <a href="docs/tilt-setup.md">Tilt Setup</a> •
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

## What is iStream?

iStream is an abs supported distributed live streaming platform engineered to reproduce a production-grade streaming stack without managed streaming services, handling the complete pipeline from RTMP ingest through FFmpeg -> transcoding into diff qualities -> HLS delivery : live -> via a static nginx server : VOD -> via cloudflare R2. 

With dynamic worker autoscaling, segment-level R2 uploads and minimal disk writes, iStream comes alongside as a modern architechture with chat support via namespaces, integration of payment-gateway for superchats, seperate notification service for isolated deliveries via queue/exchangers.

The goal was not to use managed streaming services but to build every layer: from RTMP ingest to HLS delivery, from autoscaling worker containers to real-time socket communication.

In short: iStream aims to demonstrate a composable streaming platform with distributed processing, real-time state management, and object-storage-backed VOD delivery.



### For contributors

[Open an issue here->](https://github.com/kush1jpeg/iStream/issues) for suggestions, bugs, etc;

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

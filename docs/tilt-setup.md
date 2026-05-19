## Why Tilt over plain Docker Compose

Docker Compose works fine for running a stack, but it has no concept of development workflow. Every code change means manually running `docker compose up --build`, waiting for the full build, and hoping you remembered to rebuild the right service. With eight services in iStream, this becomes genuinely painful.

Tilt solves this by watching source files and rebuilding only the service that changed, injecting the new binary or restarting the container automatically. It also gives a single terminal UI showing logs from all services simultaneously, colour-coded and filterable, instead of eight separate terminal windows or a wall of interleaved Docker Compose output. The Tiltfile also lets us define resource dependencies and selective startup - running only the streaming services with `tilt up -- --test stream` without bringing up the shop, payments, or notification stack. For a project this architecturally complex, Tilt helps me alot 

# Tilt Setup

This document explains how to start the iStream development environment with Tilt.

## What you need first

- A Git checkout of this repository on the machine where you want to run iStream.
- Docker installed and running.
- Tilt installed on your machine. If Tilt is not installed yet, install it from [https://docs.tilt.dev/index.html](https://docs.tilt.dev/index.html).

## Start Tilt

From the repository root, run:

```bash
tilt up
```

This will load the default development stack from the top-level `Tiltfile`.

## Alternate startup modes

The `Tiltfile` supports a `test` flag for selective service startup:

- `docker-compose.yml` — default full stack.
- `docker-compose.backend.yml` — loaded when `backend` is included in `--test`.
- `docker-compose.stream.yml` — loaded when `stream` is included in `--test`.

Examples:

```bash
tilt up -- --test stream
```

```bash
tilt up -- --test backend --test stream
```

## Notes

- The Tilt configuration is defined in the top-level `Tiltfile`.
- Use the Tilt web UI to inspect resources, logs, and service status.
- To stop the Tilt-managed services, run:

```bash
tilt down
```

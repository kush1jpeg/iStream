# Getting Started

## @essentials

These are the services and accounts you need before you can run iStream locally:

- **Cloudinary** — used for user image uploads, thumbnails, and signed upload URLs in the backend.
- **Cloudflare R2** — used for VOD segment storage and serving HLS content from the object store to view the streams in future.
- **Google Console** — used for OAuth login via Google in the backend.
- **Docker** — required to run the local container stack and build the worker image.
- **Tilt** — the recommended development launcher for this repo -> [set it up](/docs/tilt-setup.md):

## Setup environment files

Each service folder that requires configuration has an `.env.example` file. Copy that file into the same folder as `.env` and fill in the values:

- `autoScaler/example.env` → `autoScaler/.env`
- `backend/example.env` → `backend/.env`
- `jobServer/example.env` → `jobServer/.env`
- `notification/example.env` → `notification/.env`
- `frontend/example.env` → `frontend/.env`


The values in these files are service-specific. Fill them from the account credentials and local endpoints you are using.

> Note: `workerBackend` does not currently include a `.env.example` in the repo. Its runtime variables are supplied by the autoscaler using dockerode, when it spawns worker containers.

## Build the worker image manually

iStream expects the autoscaler to launch worker containers from a local worker image. Build and tag that image before starting Tilt:

```bash
docker build -t abs_istream-ffmpeg-worker:latest ./workerBackend
```

Then make sure `autoScaler/.env` contains the same tag under `IMAGE=`:

```env
IMAGE=abs_istream-ffmpeg-worker:latest
```

If you want to verify the image exists locally, run:

```bash
docker images | grep abs_istream-ffmpeg-worker
```

## Seeding the iStream Shop Collection in the DB

The seed script populates the database with default shop items (e.g. frames and sticker packs). This is useful for development, testing, or resetting data.

```bash
cd backend
npm run seed
```


## Start the project

From the repository root, start the full development stack with Tilt.

```bash
tilt up
```

This is the recommended path because Tilt manages the dev workflow, watches source files, and keeps all containers in sync.
If you choose not to use Tilt, you can still start the stack with Docker Compose:

```bash
docker compose up
```

for starting the frontend/  or [visit->](/frontend/README.md) 
```bash
npm i

npm run dev 
```

## Visit next -

- [streaming-setup](./streaming-setup.md)
- [service-overview](./services/about.md)
- [Architecture](./architecture.md)
- [Contributing](./contributing.md)

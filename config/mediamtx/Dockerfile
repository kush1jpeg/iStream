FROM bluenviron/mediamtx:1 AS mediamtx
FROM ubuntu:24.04

COPY --from=mediamtx /mediamtx /
COPY --from=mediamtx /mediamtx.yml /

RUN apt update && apt install -y \
   gstreamer1.0-tools curl

ENTRYPOINT [ "/mediamtx" ]

// Build ffmpeg command
export const ffmpegStreamingVod = (RTMP_URL, MTX_PATH) => [
  "-i",
  `${RTMP_URL}/${MTX_PATH}`,

  // 1080p
  "-map",
  "v:0",
  "-map",
  "a:0",
  "-c:v:0",
  "copy",

  // // 720p
  // "-map",
  // "v:0",
  // "-map",
  // "a:0",
  // "-c:v:1",
  // "libx264",
  // "-preset",
  // "veryfast",
  // "-tune",
  // "zerolatency",
  // "-s:v:1",
  // "1280x720",
  // "-b:v:1",
  // "3000k",

  // 480p
  "-map",
  "v:0",
  "-map",
  "a:0",
  "-c:v:2",
  "libx264",
  "-preset",
  "veryfast",
  "-tune",
  "zerolatency",
  "-s:v:2",
  "854x480",
  "-b:v:2",
  "1200k",

  "-c:a",
  "aac",
  "-ar",
  "48000",
  "-f",
  "hls",
  "-hls_time",
  "4",
  "-hls_list_size",
  "0",
  "-hls_flags",
  "append_list",
  "-var_stream_map",
  "v:0,a:0 v:1,a:1", // for just 1080 and 480
  //  "v:0,a:0 v:1,a:1 v:2,a:2", // for 1080,720 and 480
  "-master_pl_name",
  "master.m3u8",
  `/hls/live/${MTX_PATH}/v%v/index.m3u8`,
];

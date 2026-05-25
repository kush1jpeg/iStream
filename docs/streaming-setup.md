
# Streaming Setup — Connecting OBS to iStream

This guide walks you through configuring Open Broadcaster Software (OBS) to stream to iStream using RTMP.

## Prerequisites

Before starting, ensure you have:

- OBS Studio installed (version 28.0 or later)
- An active iStream account;
- A stream key obtained from the iStream dashboard (initiate a stream and iStream dynamically provides u with a different streamKey everytime for safety purposes )

## Obtaining Your Stream Key

1. Log in to your iStream dashboard
2. Navigate to **Go Live** button on the sidebar
3. Fill the details and Click **Initiate Stream**
4. Your stream key will be displayed — copy it and keep it secure, also note the RTMP ingest URL provided (typically `rtmp://your-domain/live`) in dev-(rtmp://localhost:1935/live) or whatever u have configured

## OBS Configuration

### Step 1: Open Stream Settings

1. Launch OBS Studio
2. Click **Settings** (bottom-right corner)
3. Select **Stream** from the left sidebar

### Step 2: Configure the Stream Connection

1. Under **Service**, select **Custom...**
2. In the **Server** field, enter your RTMP ingest URL:
   ```
   rtmp://your-domain/live
   ```
3. In the **Stream Key** field, paste your stream key from the iStream dashboard
4. Leave **Use authentication** unchecked unless otherwise instructed

### Step 3: Configure Output Settings for maximum efficiency(skip in dev)

Click the **Output** tab and configure the following under **Streaming**:

| Setting | Recommended Value | Notes |
|---------|---|---|
| Encoder | x264 | CPU-based H.264 encoding |
| Bitrate | 4500–6000 kbps | For 1080p @ 60fps |
| Keyframe Interval | 2 seconds | Required for HLS segment alignment |
| Preset | veryfast | Balances quality and CPU usage |
| Profile | high | Supports adaptive bitrate |

**Example Output Settings:**
- Video Bitrate: `6000` kbps
- Audio Bitrate: `160` kbps
- CPU Usage Preset: `veryfast`
- Profile: `high`
- Keyframe Interval: `2`

### Step 4: Configure Video Settings

Click the **Video** tab and set:

| Setting | Value |
|---------|-------|
| Base Canvas Resolution | 1920 × 1080 |
| Output (Scaled) Resolution | 1920 × 1080 |
| Common FPS Values | 60 |

These settings ensure full 1080p @ 60fps streaming.

### Step 5: Apply Settings

Click **Apply** and then **OK** to save your configuration.

## Going Live

### Starting Your Stream

1. In OBS, click the **Start Streaming** button
2. Wait for the connection to establish (you will see status indicators)
3. Once connected, navigate to your iStream dashboard
4. Click **Go Live** to mark the stream as active on the platform

### Viewer Access

Once live, viewers can access your stream using the viewer URL provided in your iStream dashboard. The URL format is typically:
```
https://your-domain/watch/{stream_id}
```

Share this URL with your audience to begin viewing.

## Common Issues and Fixes

### Stream Key Invalid

**Symptom:** OBS shows "Authentication failed" or "Invalid stream key"

**Solution:**
1. Regenerate your stream key from the iStream dashboard
2. Copy the new key carefully (no extra spaces)
3. Update the **Stream Key** field in OBS Settings
4. Click **Apply** and reconnect

### Connection Failed

**Symptom:** "Failed to connect to server" error

**Solution:**
- Verify the RTMP server URL is correct
- Check your internet connection
- Verify your firewall is not blocking RTMP (port 1935)
- Contact your network administrator if using a corporate network
- Ensure iStream streaming infrastructure is online

### High Latency

**Symptom:** Delay between your stream and viewer reception

**Solution:**
- Reduce bitrate to 4500 kbps
- Switch encoder preset to `veryfast` (if not already set)
- Check your local network bandwidth
- Move closer to your Wi-Fi router or use Ethernet

### Dropped Frames

**Symptom:** "Skipped frames due to rendering lag" messages

**Solution:**
- Reduce output resolution to 1920 × 1080 (if higher)
- Lower bitrate to 4500 kbps
- Switch preset to `veryfast`
- Close unnecessary applications to free CPU resources
- Check CPU usage in OBS stats

## Technical Notes

### Keyframe Interval (2 Seconds)

The keyframe interval must be set to **2 seconds** (or every 120 frames at 60fps). iStream uses HTTP Live Streaming (HLS) for adaptive delivery, which segments video into 2-second chunks. Keyframes must align with these segments for optimal quality and seek-ability.

### Adaptive Bitrate Output

iStream automatically produces multiple quality variants from your 1080p60 source:

- **1080p passthrough**: Full resolution stream (uses your bitrate setting)
- **480p transcode**: Optimized for mobile and congested networks

Viewers automatically receive the highest quality their connection supports. This means low-bandwidth users get a smooth 480p experience while high-bandwidth users receive pristine 1080p.

**Important:** Always stream at high quality (6000 kbps, 1080p). iStream handles transcoding like a chad! ; you do not need to create multiple sources.
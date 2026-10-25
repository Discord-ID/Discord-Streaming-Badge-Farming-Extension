# Discord Streaming Badge Farming Extension

A lightweight, zero-build Chrome Manifest V3 browser extension that automatically joins Discord voice channels and streams a virtual loop screenshare (`videostream.mp4`) for Discord ID badge streaming farming. Works on desktop browsers and mobile Chromium browsers (Lemur / Kiwi).

> **Community & Support:** Join the official Discord Indonesia server at [discord.gg/idn](https://discord.gg/idn).

---

## Important Notice

> **Note:** This extension is designed specifically for members of **Discord ID** (`discord.gg/idn`). You must be a member of the server to activate the badge streaming rooms.

> **Caution:** Automating activities on Discord should be done responsibly. Use this tool at your own discretion.

---

## What It Does

This extension automates the entire screenshare farming workflow on Discord Web:

- **Auto Join Voice Room:** Automatically scans candidate badge farming rooms and connects to the least populated voice channel.
- **Channel Pinning:** Clicking any room in the dashboard pins that channel for the current session; auto-reconnect will return to your selected room.
- **Virtual Screenshare (Go Live):** Automatically starts streaming using an offscreen video element with audio muxing (480p @ 60 FPS) via a universal `getDisplayMedia` polyfill.
- **Auto Restream:** Automatically detects if your stream was closed or stopped and restarts screenshare within 2 seconds without leaving voice.
- **Smart Auto Reconnect:** Monitors voice health. If disconnected, automatically counts down based on your dashboard settings (1–10 minutes) and rejoins your room.
- **10-Hour Farming Cycle:** Automatically streams for your configured target (default: 10h), takes a short rest break (default: 5m), and restarts seamlessly.
- **Merah Putih UI Dashboard:** Modern 860×560px executor-style dashboard, live duration counters, and floating trigger widget.
- **Zero-Build Architecture:** Pure JavaScript. No Node.js, npm, TypeScript, or bundler required. Ready to load immediately.

---

## Supported Voice Channels (Discord ID)

Target Guild: `1419245943999692854` (Discord ID)

1. `🐝・Badge Farming I` (`1532531180229103626`)
2. `🐝・Badge Farming II` (`1562379518864269382`)
3. `🐝・Badge Farming III` (`1562514091589898250`)

---

## Installation (Desktop)

1. Clone or download this repository.
2. Open Chrome, Edge, or Brave and navigate to `chrome://extensions/`.
3. Enable **Developer mode** (toggle in the top-right corner).
4. Click **Load unpacked** and select the extension folder.
5. Open [Discord Web](https://discord.com/channels/@me) in your browser.
6. The floating trigger widget will appear on the right side of the screen!

---

## Mobile Version Supported (Android)

You can run this extension on Android using **Lemur Browser** or **Kiwi Browser**:

1. Download **Lemur Browser** from the [Google Play Store](https://play.google.com/store/apps/details?id=com.lemurbrowser.exts).
2. Open Lemur Browser and tap the **Extensions** menu (the four-square icon).
3. Enable **Developer mode**.
4. Tap **Load unpacked** (or upload the extension folder / zip).
5. Open `https://discord.com/channels/@me` in desktop mode.
6. The extension will automatically mount the virtual display media polyfill and start streaming!

---

## How to Use

1. Navigate to any server or channel on Discord (`https://discord.com/channels/*`).
2. If you are not yet in Discord ID, a native prompt will invite you to join [discord.gg/idn](https://discord.gg/idn).
3. Click the floating red broadcast widget on the right edge to open the **Dashboard**.
4. **Dashboard Tab:**
   - View live stream status, duration timer (`HH:MM:SS`), session target, and next cooldown countdown.
   - See available voice channels and click **Join** to switch rooms on the fly.
   - Use **Restart** to reload Discord, or **Stop Streaming** / **Join Streaming** to toggle manually.
5. **Settings Tab:**
   - **Auto Join Voice Channel:** Toggle auto-connecting to the quietest room.
   - **Auto Screenshare (Go Live):** Toggle automatic Go Live streaming.
   - **Auto Reconnect Voice:** Toggle automatic reconnection if voice disconnects.
   - **Reconnect Delay:** Set delay before rejoining (1, 2, 3, 5, or 10 minutes).
   - **Session Duration:** Set how long to stream per session (1–24 hours).
   - **Cooldown Interval:** Set rest duration between sessions (1–30 minutes).

---

## How It Works

- **Direct Webpack Store Extraction:** Hooks into Discord's internal Webpack 5 modules without monkeypatching global prototypes, accessing `UserStore`, `SelectedChannelStore`, `RTCConnectionStore`, and `ApplicationStreamStore`.
- **Universal Media Polyfill:** Injects a custom `getDisplayMedia` interceptor that routes `videostream.mp4` through a WebAudio context and canvas/video track with auto-looping and constraint immunization.
- **Client Anti-Crash Protections:** Built-in guards prevent gateway connection resets (`Boolean.prototype.includes` shim and string ID validation).
- **Shadow DOM Isolation:** The entire UI is encapsulated within a closed Shadow Root to avoid CSS bleed into Discord's native styles.

---

## Troubleshooting

- **Floating Widget Doesn't Appear:**
  - Ensure you are on `https://discord.com/channels/*` (the extension only activates inside Discord server/chat views, not on the homepage).
  - Check that the extension is enabled in `chrome://extensions/`.
- **Stream Not Starting:**
  - Make sure you are a member of the official Discord ID server (`discord.gg/idn`).
  - Check that third-party video autoplay permissions are granted in your browser settings.
- **Audio Routing:**
  - The extension uses WebAudio routing to feed video audio tracks into Discord. If audio is muted by browser policy, click anywhere inside the Discord tab to resume the audio context.

---

## Technical Details

- **Manifest Version:** MV3 (Manifest V3)
- **Language:** Pure JavaScript (ES2022)
- **Permissions:** `storage`, `declarativeNetRequest`
- **Build System:** None (Instant Plug-and-Play)

---

## License & Disclaimer

This project is for educational and badge farming automation research. The author is not responsible for any misuse or disciplinary action taken by Discord.

Distributed under the MIT License.

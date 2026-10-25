# Privacy Policy for Discord Streaming Badge Farming Extension

**Last Updated:** October 25, 2026

## Introduction

Discord Streaming Badge Farming Extension ("the Extension") is a lightweight Chrome browser extension designed to automate virtual screenshare streaming for Discord badge farming in the Discord web client. This privacy policy explains how the Extension handles user data and information.

## Data Collection

**The Extension does not collect, store, or transmit any user data.**

The Extension operates entirely locally within your browser and does not:

- Collect personally identifiable information (name, address, email, phone number, identification numbers)
- Collect health information
- Collect financial or payment information
- Collect authentication credentials (passwords, auth tokens, session secrets, PINs)
- Collect personal communications (direct messages, channel chats, audio recordings)
- Collect location data (GPS coordinates, IP addresses, country or city data)
- Collect web browsing history or activity across other websites
- Collect keystrokes, mouse trails, or private user inputs
- Transmit any data to external telemetry servers, third-party analytics, or remote tracking services
- Store sensitive personal data in external cloud storage

## How the Extension Works

The Extension:

- Only operates on `https://discord.com/channels/*` (and canary/ptb subdomains)
- Modifies the User-Agent header for Discord requests via Chrome's native `declarativeNetRequest` API to present standard desktop Chrome capabilities
- Intercepts `navigator.mediaDevices.getDisplayMedia` locally using an in-memory loopback video element (`assets/videostream.mp4`) to feed Discord a virtual screenshare track
- Inspects Discord's internal client stores (via React Flux stores in the page's MAIN world) strictly to read voice channel connection states, active stream status, and guild membership verification
- Saves user-configurable preferences (stream duration, cooldown intervals, auto-reconnect delay) strictly inside the user's local browser `localStorage` under `discordScreenshareConfig`
- Renders an in-page Shadow DOM settings modal and floating trigger widget locally without injecting external web trackers

All operations run purely on your machine. The Extension never communicates with any third-party servers.

## Permissions

The Extension declares minimal Manifest V3 permissions:

- **Host Permissions (`https://discord.com/*`, `https://canary.discord.com/*`, `https://ptb.discord.com/*`)**: Required to run content scripts on Discord web pages and interact with Discord's voice and stream interfaces.
- **declarativeNetRequest**: Required to safely normalize HTTP request headers for Discord desktop web compliance.
- **storage**: Required to save your local UI preferences (stream session hours, cooldown minutes, auto-reconnect delay) within your browser.

These permissions are utilized solely for the Extension's core virtual screenshare automation and are never used to harvest or exfiltrate private data.

## Third-Party Services

The Extension does not integrate with any third-party services, analytics SDKs, advertising platforms, or external data collectors. All actions occur strictly between your browser and Discord's standard endpoints.

## Data Sharing

The Extension never shares, sells, leases, or transmits any data to third parties because no user data is collected in the first place.

## User Rights

Because the Extension collects no personal data, there is no personal information to access, modify, export, or delete. Users can change or clear local preferences via the in-page settings panel or uninstall the Extension at any time through `chrome://extensions/`.

## Changes to This Privacy Policy

We may update this privacy policy periodically to reflect future features or regulatory updates. Any changes will be indicated with an updated "Last Updated" date at the top of this document. Continued use of the Extension constitutes acceptance of the current policy.

## Contact & Support

For questions, feedback, or support regarding this privacy policy and the Extension:
- Discord ID Community Server: [discord.gg/idn](https://discord.gg/idn)
- GitHub Repository: [Discord-Streaming-Badge-Farming-Extension](https://github.com/Discord-ID/Discord-Streaming-Badge-Farming-Extension)

## Compliance

This Extension complies with:
- Chrome Web Store Developer Program Policies
- General Data Protection Regulation (GDPR)
- California Consumer Privacy Act (CCPA)
- Global privacy and security best practices

---

**Summary:** This Extension operates 100% locally on your machine. It does not harvest, log, or transmit personal data, tokens, or communications to any external server.

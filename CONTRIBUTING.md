# Contributing to Discord Streaming Badge Farming Extension

Thank you for your interest in contributing to the Discord Streaming Badge Farming Extension! Contributions such as focused bug fixes, voice channel balancer improvements, performance optimizations, mobile browser compatibility, and documentation refinements are warmly welcomed.

---

## Codebase Architecture

Before contributing, familiarize yourself with the modular structure of the extension:

```text
├── manifest.json              # Chrome Manifest V3 configuration & permissions
├── background.js              # Background service worker (toolbar click handler)
├── bridge.js                  # Isolated content script (extension asset URLs & user-agent polyfill)
├── rules.json                 # DeclarativeNetRequest header modification rules
├── assets/                    # Icons, badge graphics, and loop video asset
└── src/
    ├── config.js              # Default guild/channel IDs, storage & cookie persistence
    ├── index.js               # Main world entrypoint & client readiness initializer
    ├── automation/
    │   ├── runner.js          # Farming lifecycle daemon (auto-stream, restream, reconnect)
    │   └── watcher.js         # Connection readiness and voice state polling
    ├── constants/
    │   ├── dispatches.js      # Internal Discord Flux dispatch action constants
    │   └── media.js           # Media sample rate and resolution settings
    ├── discord/
    │   ├── webpack.js         # Webpack 5 chunk traversal and store discovery
    │   ├── stores.js          # Flux store extractors (UserStore, ChannelStore, etc.)
    │   ├── actions.js         # Voice channel selection and leave actions
    │   ├── dispatches.js      # Safe deferred Flux dispatcher
    │   ├── navigation.js      # In-app voice channel URL transition router
    │   ├── restapi.js         # Internal HTTP client resolver
    │   ├── streams.js         # Go Live stream trigger and stop creators
    │   ├── userAccess.js      # Discord ID membership and channel permission checker
    │   └── voiceChannels.js   # Dynamic occupant counter and room balancing algorithm
    ├── media/
    │   ├── hook.js            # Universal getDisplayMedia WebRTC interceptor
    │   ├── audiomux.js        # Dynamic 2D canvas stream and WebAudio mixer
    │   └── video.js           # Offscreen video player element factory
    └── ui/
        ├── index.js           # Shadow DOM lifecycle, event wiring, and poller
        ├── modal.js           # Streaming Dashboard HTML structure
        ├── checkerModal.js    # Pre-flight server verification alert HTML
        ├── icons.js           # Feather/Discord SVG icon helpers
        └── styles.js          # Scoped Shadow DOM CSS stylesheet
```

---

## Contribution Guidelines

### 1. Zero-Build Principle
This project strictly avoids complex build toolchains (Webpack, Vite, Rollup, Babel, TypeScript). The extension must remain **100% pure Vanilla JavaScript** that can be directly loaded into Chromium via **Load unpacked**.
- Do not introduce npm runtime dependencies or package managers (`node_modules`).
- Ensure all modules attach cleanly to the global `window.DiscordStreamer` namespace within self-invoking functions (`(() => { ... })()`).

### 2. Code Quality & Conventions
- **Clean Code**: Do not commit commented-out dead code, temporary debug statements, or verbose AI-generated filler comments. Keep comments concise and strictly technical.
- **Log Prefix**: All console log, warning, and error messages must use the standard prefix:
  ```javascript
  console.log('[Discord Indonesia] Your message here');
  ```
- **Snowflake Validation**: Never hardcode account-specific user IDs. Always use standard snowflake validation:
  ```javascript
  /^\d{17,20}$/.test(channelId)
  ```
- **Shadow DOM Isolation**: Any new UI elements must be mounted inside the extension's Shadow Root (`#discord-id-streamer-host`) and styled via `src/ui/styles.js` to prevent CSS collisions with Discord.
- **Store Safety**: Never access properties on unverified modules without checking against i18n proxies (`$$baseObject` / `$$loader`).

### 3. Syntax Verification
Before submitting any changes, verify that every JavaScript file passes syntax validation:

```powershell
Get-ChildItem -Path src, bridge.js, background.js -Recurse -Filter *.js | ForEach-Object { node -c $_.FullName }
```

---

## Reporting Issues

If you encounter a bug or unexpected behavior:

1. Check existing [GitHub Issues](https://github.com/Discord-ID/Discord-Streaming-Badge-Farming-Extension/issues) to ensure the problem has not already been reported.
2. Open a new issue using a descriptive title.
3. Include the following details in your report:
   - Extension version (e.g., `1.0.0`).
   - Browser & OS (e.g., Chrome 124 on Windows 11, Kiwi Browser on Android 14).
   - Console logs (look for messages starting with `[Discord Indonesia]`).
   - Steps to reproduce the issue.
   - Expected vs. actual behavior.

---

## Pull Request Process

1. **Fork the Repository**: Create your personal fork on GitHub.
2. **Branch from `development`**:
   Always create your feature or bugfix branch off the **`development`** branch:
   ```bash
   git checkout -b fix/reconnect-timeout-delay origin/development
   ```
3. **Commit with Conventional Commits**:
   Write clear, structured commit messages in English following the Conventional Commits specification:
   ```text
   feat: add custom reconnect countdown interval
   fix: resolve voice channel occupant counter edge case
   docs: update mobile kiwi browser installation steps
   refactor: simplify displayMedia canvas resolution logic
   ```
4. **Target the `development` Branch**:
   Submit your Pull Request targeting `development` (never target `main` directly for work-in-progress features).
5. **PR Description**: Provide a brief summary of the problem resolved, the implementation approach, and confirmation that syntax checks passed.

---

## Community & Support

Join the official **Discord Indonesia** community for live discussions, feedback, and badge farming voice channels:

- **Discord Server**: [discord.gg/idn](https://discord.gg/idn)
- **GitHub Discussions**: [Discussions Tab](https://github.com/Discord-ID/Discord-Streaming-Badge-Farming-Extension/discussions)

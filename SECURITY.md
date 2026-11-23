# Security Policy

## Supported versions

Security updates are provided for the latest published version of the Discord Streaming Badge Farming Extension. Please ensure you are running the latest release on the `development` or `main` branch before reporting an issue.

| Version | Supported |
|---|---|
| `1.0.x` | :white_check_mark: Active support |
| `< 1.0.0` | :x: End of life / unsupported |

---

## Security boundary & Architecture

Discord Streaming Badge Farming Extension is a client-side Chrome Manifest V3 browser extension operating within the user's active Discord Web tab (`https://discord.com/*`). It executes with the browser tab's user privileges and communicates via isolated messaging.

### Threat model

- **Trusted Authority:** The user's authenticated browser profile and Discord Web session. The extension operates with standard extension permissions (`declarativeNetRequest`, `activeTab` via toolbar action) and does not possess elevated system privileges.
- **Untrusted Data:** Inbound Gateway events, third-party network payloads, and unverified channel IDs. The extension validates all channel identifiers using standard 64-bit Discord snowflake regex (`/^\d{17,20}$/`) before performing actions.
- **Credential Privacy:** 
  - The extension **never** reads, stores, logs, or transmits user passwords, Discord authorization tokens (`tokens`), or session cookies to any external server.
  - All operations interact exclusively with Discord's in-memory Flux stores (`UserStore`, `VoiceStateStore`, `ApplicationStreamStore`) already loaded in the client.
- **Execution Boundaries:**
  - In-page communication between `bridge.js` (isolated world) and the client script (`index.js`, main world) is strictly gated by origin validation (`window.location.origin`) and a dedicated message signature (`source: 'discord-extension-isolated'`).
  - The UI is entirely encapsulated inside an isolated **Shadow Root** (`discord-id-streamer-host`), preventing DOM tampering, style bleed, or script injection from foreign web elements.
  - Media stream interception routes through an offscreen `<canvas>` and `AudioContext` without opening external socket listeners.

### Intended security properties

- **No Monkeypatching of Discord Prototypes:** The extension never mutates global JavaScript prototypes (`Object.prototype`, `Array.prototype`, `Function.prototype`) to avoid destabilizing the Discord client or causing gateway disconnects.
- **Proxy Filter Safety:** Webpack module discovery filters out Discord i18n proxy objects (`$$baseObject` and `$$loader`) to prevent unintended execution traps or memory leaks during store traversal.
- **Zero Third-Party Bundles:** The entire codebase is written in pure vanilla JavaScript with zero third-party npm runtime dependencies, eliminating supply-chain attack vectors.

### Limits and user responsibilities

- **Host Environment:** The extension relies on the security of the host browser (Chrome, Brave, Edge, Kiwi, Lemur). It cannot protect against compromised browser profiles, malicious companion extensions, or malware executing on the host machine.
- **Official Sources:** Only install the extension from the official [Discord-ID/Discord-Streaming-Badge-Farming-Extension](https://github.com/Discord-ID/Discord-Streaming-Badge-Farming-Extension) repository. Avoid third-party forks or re-hosted archives that may inject unauthorized payload scripts.
- **Personalization Requirement:** The extension facilitates screen sharing automation, but badge logging is governed by Discord's servers. Users must manage their own account data settings (`User Settings > Data & Privacy > Use data to personalize my Discord experience`).

### Vulnerability scope

Please report suspected security issues privately, including:
- Any condition that could expose Discord authorization tokens, cookies, or user account secrets.
- Message bridge injection vulnerabilities permitting unauthorized window event dispatching.
- Cross-Site Scripting (XSS) or Shadow DOM encapsulation bypasses.
- Network requests made to domains other than Discord's official infrastructure.

*Note: Discord server-side voice timeouts, rate limits, or account action policies are governed by Discord Inc. and do not constitute vulnerabilities within this extension.*

---

## Reporting a vulnerability

**Do not report security vulnerabilities through public GitHub issues, discussions, or pull requests.**

1. **GitHub Private Vulnerability Reporting (Preferred):**
   Navigate to the repository's **Security** tab and click **Report a vulnerability** to submit an advisory privately.
2. **Discord Security Ticket (Alternative):**
   Join the official Discord Indonesia community at [discord.gg/idn](https://discord.gg/idn) and open a private support ticket with the server administration team.

When submitting a vulnerability report, please include:
- Extension version (e.g., `1.0.0`).
- Browser name and version (e.g., Chrome 124, Brave, Kiwi Browser).
- Detailed description of the vulnerability and its potential impact.
- Step-by-step reproduction instructions or a minimal proof of concept.

Maintainers will review the report, acknowledge receipt within 48 hours, and coordinate necessary fixes prior to public disclosure.

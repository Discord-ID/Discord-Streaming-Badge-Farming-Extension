export const uiStyles = `
:host {
  color: #f2f3f5;
  font-size: 14px;
  line-height: 1.5;
}

*,
*::before,
*::after,
button,
input,
select,
textarea,
span,
div,
p,
h1,
h2,
h3,
h4,
a {
  box-sizing: border-box;
  font-family: "gg sans", "Plus Jakarta Sans", "Inter", "Noto Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif !important;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* Custom Sleek Dark Scrollbar */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.16);
  border-radius: 9999px;
  transition: background-color 0.2s ease;
}

::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.32);
}

/* Minimalist Floating Trigger Widget (46x46 Squircle on Right Edge) */
.discord-id-trigger {
  position: fixed;
  right: 16px;
  top: 50%;
  transform: translateY(-50%);
  z-index: 2147483640;
  width: 46px;
  height: 46px;
  background-color: #1e1f22;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5), 0 0 12px rgba(138, 30, 37, 0.25);
  transition: transform 0.18s cubic-bezier(0.16, 1, 0.3, 1), background-color 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease;
  user-select: none;
}

.discord-id-trigger:hover {
  background-color: #2b2d31;
  border-color: #8a1e25;
  transform: translateY(-50%) scale(1.08);
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.6), 0 0 16px rgba(138, 30, 37, 0.4);
}

.discord-id-trigger .trigger-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
}

.discord-id-trigger .status-dot {
  position: absolute;
  top: -3px;
  right: -3px;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background-color: #23a55a;
  border: 2px solid #1e1f22;
  box-shadow: 0 0 6px #23a55a;
}

.discord-id-trigger.idle .status-dot {
  background-color: #f23f43;
  box-shadow: 0 0 6px #f23f43;
}

.discord-id-trigger.cooldown .status-dot {
  background-color: #f0b232;
  box-shadow: 0 0 6px #f0b232;
}

.discord-id-trigger.gated .status-dot {
  background-color: #eab308;
  box-shadow: 0 0 6px #eab308;
}

/* Modal Overlay (Dark Backdrop) */
.discord-id-overlay {
  position: fixed;
  inset: 0;
  background-color: rgba(11, 12, 14, 0.82);
  backdrop-filter: blur(4px);
  z-index: 2147483645;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.18s ease;
}

.discord-id-overlay.open {
  opacity: 1;
  pointer-events: auto;
}

/* Wide Desktop Modal Window (860px x 560px Roblox Executor / Discord Native Style) */
.discord-id-modal {
  position: relative;
  width: 860px;
  height: 560px;
  max-width: calc(100vw - 32px);
  max-height: calc(100vh - 32px);
  background-color: #313338;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.7);
  display: flex;
  overflow: hidden;
  color: #f2f3f5;
  transform: scale(0.97) translateY(8px);
  transition: transform 0.18s cubic-bezier(0.16, 1, 0.3, 1);
}

.discord-id-overlay.open .discord-id-modal {
  transform: scale(1) translateY(0);
}

/* Close Button (Top Right) */
.modal-close-btn {
  position: absolute;
  top: 14px;
  right: 14px;
  width: 34px;
  height: 34px;
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 50%;
  color: #b5bac1;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.15s ease, color 0.15s ease, border-color 0.15s ease;
  z-index: 20;
}

.modal-close-btn:hover {
  background-color: rgba(255, 255, 255, 0.1);
  color: #ffffff;
  border-color: #ffffff;
}

/* Sidebar Left Panel (Width: 230px) */
.modal-sidebar {
  width: 230px;
  background-color: #2b2d31;
  padding: 22px 14px 18px 18px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  border-right: 1px solid rgba(255, 255, 255, 0.06);
  flex-shrink: 0;
}

.sidebar-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding-bottom: 16px;
  margin-bottom: 16px;
}

.sidebar-logo {
  width: 36px;
  height: 36px;
  background-color: #8a1e25;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(138, 30, 37, 0.4);
}

.sidebar-logo-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 10px;
  display: block;
  user-select: none;
}

.sidebar-title-group {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.sidebar-title-main {
  font-size: 15px;
  font-weight: 800;
  color: #ffffff;
  letter-spacing: -0.01em;
}

.sidebar-title-sub {
  font-size: 11px;
  font-weight: 600;
  color: #949ba4;
  letter-spacing: 0.02em;
}

/* Nav Tabs */
.sidebar-nav {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 12px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 600;
  color: #949ba4;
  cursor: pointer;
  transition: background-color 0.15s ease, color 0.15s ease;
  user-select: none;
}

.nav-item:hover {
  background-color: rgba(255, 255, 255, 0.04);
  color: #dbdee1;
}

.nav-item.active {
  background-color: #8a1e25;
  color: #ffffff;
}

.nav-item.active .nav-icon {
  color: #ffffff;
}

.nav-icon {
  display: flex;
  align-items: center;
  color: #949ba4;
}

/* Sidebar Footer: Join Discord ID Link Button */
.sidebar-footer {
  margin-top: auto;
  padding-top: 14px;
  border-top: 1px solid rgba(255, 255, 255, 0.07);
}

.join-discord-card {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  background-color: #1e1f22;
  border: 1px solid rgba(138, 30, 37, 0.3);
  border-radius: 8px;
  text-decoration: none;
  cursor: pointer;
  transition: background-color 0.15s ease, border-color 0.15s ease, transform 0.1s ease;
}

.join-discord-card:hover {
  background-color: rgba(138, 30, 37, 0.18);
  border-color: #8a1e25;
  transform: translateY(-1px);
}

.join-discord-icon {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  background-color: #8a1e25;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.join-discord-text {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.join-discord-title {
  font-size: 12px;
  font-weight: 700;
  color: #ffffff;
}

.join-discord-url {
  font-size: 11px;
  color: #949ba4;
}

/* Main Content Area (Right Panel) */
.modal-content-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background-color: #313338;
}

.tab-page {
  display: none;
  flex: 1;
  padding: 24px 28px;
  overflow-y: auto;
}

.tab-page.active {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.page-title {
  font-size: 18px;
  font-weight: 800;
  color: #ffffff;
  margin: 0 0 2px 0;
  letter-spacing: -0.01em;
}

.page-subtitle {
  font-size: 13px;
  color: #949ba4;
  margin: 0 0 10px 0;
}

/* Cards (Executor Surface Style) */
.content-card {
  background-color: #2b2d31;
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 10px;
  padding: 16px 18px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.status-row {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.status-mini-box {
  background-color: #1e1f22;
  border: 1px solid rgba(255, 255, 255, 0.04);
  border-radius: 8px;
  padding: 12px 14px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.status-mini-box.highlight {
  border-color: rgba(138, 30, 37, 0.4);
}

.mini-icon {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background-color: rgba(255, 255, 255, 0.05);
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.status-mini-box.highlight .mini-icon {
  background-color: #8a1e25;
}

.mini-details {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.mini-label {
  font-size: 11px;
  font-weight: 700;
  color: #949ba4;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.mini-value {
  font-size: 13px;
  font-weight: 800;
  color: #ffffff;
}

/* Stats 3-Column Grid */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}

.stats-card {
  background-color: #1e1f22;
  border: 1px solid rgba(255, 255, 255, 0.04);
  border-radius: 8px;
  padding: 10px 12px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.stats-icon {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  background-color: rgba(255, 255, 255, 0.05);
  color: #dbdee1;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.stats-details {
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
}

.stats-label {
  font-size: 10px;
  font-weight: 700;
  color: #949ba4;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  white-space: nowrap;
}

.stats-value {
  font-family: Consolas, monospace !important;
  font-size: 13px;
  font-weight: 800;
  color: #ffffff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Channel Balancer List */
.channel-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: #1e1f22;
  border: 1px solid rgba(255, 255, 255, 0.04);
  border-radius: 8px;
  padding: 11px 14px;
  transition: border-color 0.15s ease;
}

.channel-item.active {
  border-color: #8a1e25;
  background-color: rgba(138, 30, 37, 0.1);
}

.channel-item-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.channel-name-text {
  font-size: 13px;
  font-weight: 700;
  color: #ffffff;
}

.channel-item.active .channel-name-text {
  color: #ff858d;
}

.channel-count-text {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  color: #949ba4;
  margin-left: 8px;
}

.channel-item-right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.channel-live-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.channel-live-dot.dot-green {
  background-color: #23a55a;
  box-shadow: 0 0 6px #23a55a;
}

.channel-live-dot.dot-red {
  background-color: #f23f43;
  box-shadow: 0 0 6px #f23f43;
}

.channel-join-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 5px 12px;
  font-size: 11px;
  font-weight: 700;
  border-radius: 6px;
  border: 1px solid transparent;
  cursor: pointer;
  transition: all 0.15s ease;
  user-select: none;
  background-color: #8a1e25;
  color: #ffffff;
}

.channel-join-btn:hover:not(:disabled):not(.active) {
  background-color: #71171d;
  box-shadow: 0 2px 8px rgba(138, 30, 37, 0.4);
}

.channel-join-btn.active {
  background-color: rgba(35, 165, 90, 0.18);
  color: #57f287;
  border-color: rgba(35, 165, 90, 0.35);
  cursor: default;
  pointer-events: none;
}

.channel-join-btn:disabled,
.channel-join-btn.disabled {
  background-color: rgba(255, 255, 255, 0.05);
  color: #80848e;
  border-color: transparent;
  cursor: not-allowed;
  pointer-events: none;
}

/* Action Buttons Bar */
.action-buttons-row {
  display: flex;
  gap: 12px;
  margin-top: 4px;
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 700;
  padding: 10px 18px;
  border-radius: 8px;
  border: 1px solid transparent;
  cursor: pointer;
  transition: all 0.15s ease;
  user-select: none;
}

.btn-primary-red {
  background-color: #8a1e25;
  color: #ffffff;
}

.btn-primary-red:hover {
  background-color: #71171d;
  box-shadow: 0 4px 12px rgba(138, 30, 37, 0.4);
}

.btn:disabled, .btn.disabled {
  opacity: 0.4 !important;
  cursor: not-allowed !important;
  pointer-events: none !important;
  filter: grayscale(0.6);
}

/* Settings Switch Rows */
.setting-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 0;
}

.setting-texts {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.setting-title {
  font-size: 13px;
  font-weight: 700;
  color: #ffffff;
}

.setting-desc {
  font-size: 12px;
  color: #949ba4;
}

.setting-select-menu {
  background-color: #1e1f22;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  color: #ffffff;
  font-size: 13px;
  font-weight: 700;
  padding: 7px 12px;
  outline: none;
  cursor: pointer;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

.setting-select-menu:focus {
  border-color: #8a1e25;
  box-shadow: 0 0 0 2px rgba(138, 30, 37, 0.25);
}

.setting-select-menu option {
  background-color: #1e1f22;
  color: #ffffff;
  padding: 6px;
}

.setting-select-menu:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

/* Discord Native Toggle Switch */
.switch {
  position: relative;
  display: inline-block;
  width: 40px;
  height: 22px;
}

.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  cursor: pointer;
  inset: 0;
  background-color: #80848e;
  border-radius: 9999px;
  transition: background-color 0.2s ease;
}

.slider::before {
  position: absolute;
  content: "";
  height: 16px;
  width: 16px;
  left: 3px;
  bottom: 3px;
  background-color: #ffffff;
  border-radius: 50%;
  transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}

.switch input:checked + .slider {
  background-color: #8a1e25;
}

.switch input:checked + .slider::before {
  transform: translateX(18px);
}

.switch.disabled {
  opacity: 0.45;
  pointer-events: none;
}

/* Discord Native Checker / Consent Modal (440px Alert Style) */
.discord-checker-overlay {
  position: fixed;
  inset: 0;
  background-color: rgba(11, 12, 14, 0.85);
  backdrop-filter: blur(4px);
  z-index: 2147483647;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.16s ease;
}

.discord-checker-overlay.open {
  opacity: 1;
  pointer-events: auto;
}

.discord-checker-dialog {
  position: relative;
  width: 440px;
  max-width: calc(100vw - 32px);
  background-color: #1e1f22;
  border-radius: 16px;
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.75);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  color: #f2f3f5;
  border: 1px solid rgba(255, 255, 255, 0.08);
  transform: scale(0.96) translateY(6px);
  transition: transform 0.18s cubic-bezier(0.16, 1, 0.3, 1);
}

.discord-checker-overlay.open .discord-checker-dialog {
  transform: scale(1) translateY(0);
}

.discord-checker-close-btn {
  position: absolute;
  top: 14px;
  right: 14px;
  width: 32px;
  height: 32px;
  background: transparent;
  border: none;
  border-radius: 50%;
  color: #dbdee1;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
  transition: background-color 0.15s ease, color 0.15s ease;
}

.discord-checker-close-btn:hover {
  background-color: rgba(255, 255, 255, 0.1);
  color: #ffffff;
}

.discord-checker-header {
  position: relative;
  background: linear-gradient(180deg, #4a1216 0%, #2c0e11 55%, #1e1f22 100%);
  padding: 32px 24px 14px 24px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.discord-checker-badge-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 14px;
}

.discord-checker-badge-img {
  width: 108px;
  height: 108px;
  object-fit: contain;
  user-select: none;
  pointer-events: none;
  border-radius: 16px;
  filter: drop-shadow(0 6px 18px rgba(0, 0, 0, 0.55));
}

.discord-checker-title {
  font-size: 21px;
  font-weight: 800;
  color: #ffffff;
  margin: 0 0 4px 0;
  line-height: 1.25;
  text-align: center;
  letter-spacing: -0.02em;
}

.discord-checker-subtitle {
  font-size: 13px;
  font-weight: 600;
  color: #949ba4;
  margin: 0;
  text-align: center;
}

.discord-checker-content {
  padding: 18px 24px 20px 24px;
  font-size: 14px;
  line-height: 1.5;
  color: #dbdee1;
  text-align: center;
}

.discord-checker-content p {
  margin: 0 0 8px 0;
}

.discord-checker-hint {
  margin-top: 10px;
  font-size: 12px;
  color: #949ba4;
  line-height: 1.4;
}

.discord-checker-footer {
  background-color: #1e1f22;
  padding: 0 24px 24px 24px;
  display: flex;
  gap: 12px;
  align-items: center;
}

.btn-checker-secondary {
  flex: 1;
  height: 42px;
  background-color: #2b2d31;
  color: #ffffff;
  border: 1px solid rgba(255, 255, 255, 0.08);
  font-size: 14px;
  font-weight: 700;
  border-radius: 8px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: background-color 0.15s ease;
}

.btn-checker-secondary:hover {
  background-color: #35373c;
}

.btn-checker-primary {
  flex: 1.3;
  height: 42px;
  background-color: #8a1e25;
  color: #ffffff;
  border: none;
  font-size: 14px;
  font-weight: 700;
  border-radius: 8px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  text-decoration: none;
  transition: background-color 0.15s ease, box-shadow 0.15s ease;
  box-shadow: 0 2px 6px rgba(138, 30, 37, 0.4);
}

.btn-checker-primary:hover {
  background-color: #71171d;
  box-shadow: 0 4px 12px rgba(138, 30, 37, 0.5);
}
`;

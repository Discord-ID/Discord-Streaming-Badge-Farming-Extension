(function () {
  'use strict';
  try {
    const videoUrl = chrome.runtime.getURL('assets/videostream.mp4');
    document.documentElement.dataset.discordVideoUrl = videoUrl;

    const iconUrl = chrome.runtime.getURL('assets/icon.png');
    document.documentElement.dataset.discordIconUrl = iconUrl;

    const badgeUrl = chrome.runtime.getURL('assets/stream-badge.png');
    document.documentElement.dataset.discordBadgeUrl = badgeUrl;
  } catch (error) {
    console.error('[Discord Indonesia] Bridge failed to resolve extension asset URLs:', error);
  }

  const desktopUserAgent =
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

  try {
    Object.defineProperty(navigator, 'userAgent', {
      get: () => desktopUserAgent,
      configurable: true,
    });
    Object.defineProperty(navigator, 'platform', {
      get: () => 'Win32',
      configurable: true,
    });
    Object.defineProperty(navigator, 'maxTouchPoints', {
      get: () => 0,
      configurable: true,
    });
  } catch {}
})();

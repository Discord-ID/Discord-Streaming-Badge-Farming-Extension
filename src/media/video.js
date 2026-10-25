(() => {
  const DS = (window.DiscordStreamer = window.DiscordStreamer || {});

  function createOffscreenVideo(targetUrl) {
    let video = document.getElementById('virtualScreenPlayer');

    if (!video) {
      video = document.createElement('video');
      video.id = 'virtualScreenPlayer';
      video.crossOrigin = 'anonymous';
      video.playsInline = true;
      video.preload = 'auto';
      video.loop = true;
      video.muted = true;

      video.style.position = 'fixed';
      video.style.top = '-9999px';
      video.style.left = '-9999px';
      video.style.width = '1px';
      video.style.height = '1px';
      video.style.opacity = '0';
      video.style.pointerEvents = 'none';

      const mount = () => {
        const container = document.body || document.documentElement;
        if (container && !container.contains(video)) {
          container.appendChild(video);
        }
      };

      if (document.body || document.documentElement) {
        mount();
      } else {
        window.addEventListener('DOMContentLoaded', mount, { once: true });
      }
    }

    const resolvedUrl =
      targetUrl ||
      document.documentElement.dataset.discordVideoUrl ||
      video.src;

    if (!resolvedUrl) {
      console.error('[Discord Indonesia] Video asset URL missing; check bridge.js or extension assets');
      return video;
    }

    if (video.src !== resolvedUrl) {
      video.src = resolvedUrl;
      video.load();
    }

    video.onended = () => {
      video.currentTime = 0;
      video.play().catch(() => {});
    };

    video.onstalled = () => {
      if (video && video.paused) {
        video.play().catch(() => {});
      }
    };

    let retryCount = 0;
    video.onerror = () => {
      if (retryCount >= 3) {
        console.error('[Discord Indonesia] Video load failed after 3 attempts. Stopping retry.');
        return;
      }
      retryCount++;
      console.warn(`[Discord Indonesia] Video load error, retry ${retryCount}/3...`);
      setTimeout(() => {
        if (video) {
          video.load();
          video.play().catch(() => {});
        }
      }, 1500);
    };

    video.play().catch((err) => {
      console.warn('[Discord Indonesia] Initial play deferred until interaction:', err?.message);
    });

    return video;
  }

  DS.createOffscreenVideo = createOffscreenVideo;
})();

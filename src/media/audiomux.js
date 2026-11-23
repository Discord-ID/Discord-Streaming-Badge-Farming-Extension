(() => {
  const DS = (window.DiscordStreamer = window.DiscordStreamer || {});

  let activeAnimId = null;

  function createMuxedStream(videoElement, targetQuality, targetFps) {
    const config = typeof DS.loadConfig === 'function' ? DS.loadConfig() : {};
    const quality = targetQuality || config.streamQuality || '480p';
    const fps = targetFps || config.streamFps || DS.mediaSettings?.fps || 30;

    let videoTrack = null;
    let rawAudioTrack = null;

    if (quality === '480p' || quality === '720p') {
      const targetWidth = quality === '480p' ? 854 : 1280;
      const targetHeight = quality === '480p' ? 480 : 720;

      let canvas = document.getElementById('virtualScreenCanvas');
      if (!canvas) {
        canvas = document.createElement('canvas');
        canvas.id = 'virtualScreenCanvas';
        canvas.style.position = 'fixed';
        canvas.style.bottom = '0';
        canvas.style.right = '0';
        canvas.style.opacity = '0.001';
        canvas.style.pointerEvents = 'none';
        canvas.style.zIndex = '-999999';
        document.body.appendChild(canvas);
      }
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const ctx = canvas.getContext('2d', { alpha: false });

      if (activeAnimId) cancelAnimationFrame(activeAnimId);
      const render = () => {
        if (videoElement && !videoElement.paused && !videoElement.ended) {
          ctx.drawImage(videoElement, 0, 0, targetWidth, targetHeight);
        }
        activeAnimId = requestAnimationFrame(render);
      };
      render();

      const canvasStream = canvas.captureStream ? canvas.captureStream(fps) : canvas.mozCaptureStream(fps);
      videoTrack = canvasStream?.getVideoTracks?.()[0];
    } else {
      const captureMethod = videoElement.captureStream || videoElement.mozCaptureStream;
      if (!captureMethod) {
        throw new Error('[Discord Indonesia] captureStream unsupported');
      }
      const rawStream = captureMethod.call(videoElement, fps);
      videoTrack = rawStream?.getVideoTracks?.()[0];
      rawAudioTrack = rawStream?.getAudioTracks?.()[0];
    }

    const muxedStream = new MediaStream();
    if (videoTrack) {
      const origApply = videoTrack.applyConstraints?.bind(videoTrack);
      videoTrack.applyConstraints = async (c) => {
        try {
          if (origApply) return await origApply(c);
        } catch {
          return Promise.resolve();
        }
      };
      muxedStream.addTrack(videoTrack);
    }

    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      const audioSampleRate = DS.mediaSettings?.audioSampleRate || 48000;
      const audioContext = new AudioContextClass({ sampleRate: audioSampleRate });
      const sourceNode = audioContext.createMediaElementSource(videoElement);
      const streamDestination = audioContext.createMediaStreamDestination();

      sourceNode.connect(streamDestination);

      const audioTrack = streamDestination.stream.getAudioTracks()[0];
      if (audioTrack) {
        muxedStream.addTrack(audioTrack);
      }
    } catch {
      if (!rawAudioTrack && (videoElement.captureStream || videoElement.mozCaptureStream)) {
        const raw = (videoElement.captureStream || videoElement.mozCaptureStream).call(videoElement, fps);
        rawAudioTrack = raw?.getAudioTracks?.()[0];
      }
      if (rawAudioTrack) {
        muxedStream.addTrack(rawAudioTrack);
      }
    }

    return muxedStream;
  }

  DS.createMuxedStream = createMuxedStream;
})();

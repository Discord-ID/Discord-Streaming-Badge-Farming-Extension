(() => {
  const DS = (window.DiscordStreamer = window.DiscordStreamer || {});

  function createMuxedStream(videoElement) {
    const captureMethod = videoElement.captureStream || videoElement.mozCaptureStream;

    if (!captureMethod) {
      throw new Error('[Discord Indonesia] captureStream unsupported');
    }

    const fps = DS.mediaSettings?.fps || 60;
    const rawStream = captureMethod.call(videoElement, fps);
    const videoTrack = rawStream.getVideoTracks()[0];

    const muxedStream = new MediaStream();
    if (videoTrack) {
      const origApply = typeof videoTrack.applyConstraints === 'function' ? videoTrack.applyConstraints.bind(videoTrack) : null;
      videoTrack.applyConstraints = async function (constraints) {
        try {
          if (origApply) {
            await origApply(constraints);
          }
        } catch {}
        return Promise.resolve();
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
    } catch (err) {
      console.warn('[Discord Indonesia] WebAudio routing failed, using native audio track:', err);
      const directAudioTrack = rawStream.getAudioTracks()[0];
      if (directAudioTrack) {
        muxedStream.addTrack(directAudioTrack);
      }
    }

    return muxedStream;
  }

  DS.createMuxedStream = createMuxedStream;
})();

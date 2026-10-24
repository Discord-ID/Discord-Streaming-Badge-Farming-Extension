import { mediaSettings } from '../constants/media';

export function createMuxedStream(videoElement: HTMLVideoElement): MediaStream {
  const captureMethod =
    (videoElement as unknown as { captureStream?: (fps: number) => MediaStream }).captureStream ||
    (videoElement as unknown as { mozCaptureStream?: (fps: number) => MediaStream }).mozCaptureStream;

  if (!captureMethod) {
    throw new Error('[Discord Indonesia] captureStream unsupported');
  }

  const rawStream = captureMethod.call(videoElement, mediaSettings.fps);
  const videoTrack = rawStream.getVideoTracks()[0];

  const muxedStream = new MediaStream();
  if (videoTrack) {
    const origApply = typeof videoTrack.applyConstraints === 'function' ? videoTrack.applyConstraints.bind(videoTrack) : null;
    videoTrack.applyConstraints = async function (constraints?: MediaTrackConstraints): Promise<void> {
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
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const audioContext = new AudioContextClass({ sampleRate: mediaSettings.audioSampleRate });
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

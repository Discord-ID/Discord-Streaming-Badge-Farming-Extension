import { loadConfig, saveConfig } from './config';
import { runAutomation, stopStreamCycle, isStreamCycleActive } from './automation/runner';
import { installDisplayMediaHook } from './media/hook';
import { createOffscreenVideo } from './media/video';
import { createMuxedStream } from './media/audiomux';
import { selectVoiceChannel, leaveVoiceChannel } from './discord/actions';
import { triggerGoLiveStream, stopGoLiveStream } from './discord/streams';
import { rankChannelsByLowestUserCount, connectToOptimalVoiceChannel } from './discord/voiceChannels';
import { getRestClient } from './discord/restapi';
import { safeDispatch } from './discord/dispatches';
import { initUI } from './ui';

declare global {
  interface Window {
    discordScreenshare: {
      loadConfig: typeof loadConfig;
      saveConfig: typeof saveConfig;
      joinVoice: (guildId: string | null, channelId: string) => void;
      leaveVoice: () => void;
      startStream: (guildId: string | null, channelId: string) => void;
      stopStream: (guildId: string | null, channelId: string) => void;
      rankChannels: typeof rankChannelsByLowestUserCount;
      connectOptimal: typeof connectToOptimalVoiceChannel;
      stopCycle: typeof stopStreamCycle;
      isCycleActive: typeof isStreamCycleActive;
      setVideoUrl: (url: string) => void;
      rest: typeof getRestClient;
      dispatch: typeof safeDispatch;
    };
  }
}

window.discordScreenshare = {
  loadConfig,
  saveConfig,
  joinVoice: selectVoiceChannel,
  leaveVoice: leaveVoiceChannel,
  startStream: triggerGoLiveStream,
  stopStream: stopGoLiveStream,
  rankChannels: rankChannelsByLowestUserCount,
  connectOptimal: connectToOptimalVoiceChannel,
  stopCycle: stopStreamCycle,
  isCycleActive: isStreamCycleActive,
  setVideoUrl: (url: string) => {
    saveConfig({ videoUrl: url });
    const video = createOffscreenVideo(url);
    installDisplayMediaHook(() => createMuxedStream(video));
    console.log(`[Discord Indonesia] Video URL updated: ${url}`);
  },
  rest: getRestClient,
  dispatch: safeDispatch,
};

(function init() {
  const desktopUserAgent =
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';
  try {
    Object.defineProperty(navigator, 'userAgent', { get: () => desktopUserAgent, configurable: true });
    Object.defineProperty(navigator, 'platform', { get: () => 'Win32', configurable: true });
    Object.defineProperty(navigator, 'maxTouchPoints', { get: () => 0, configurable: true });
  } catch {}

  if (!window.location.pathname.startsWith('/channels/')) {
    return;
  }

  const config = loadConfig();

  try {
    initUI();
  } catch (err) {
    console.warn('[Discord Indonesia] UI initialization error:', err);
  }

  runAutomation(config).catch((err) => {
    console.error('[Discord Indonesia] Extension init failed:', err);
  });
})();

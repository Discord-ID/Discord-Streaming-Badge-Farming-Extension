import type { ExtensionConfig } from '../types/config';
import { loadConfig } from '../config';
import { waitForClientReady, isVoiceActive } from './watcher';
import { connectToOptimalVoiceChannel } from '../discord/voiceChannels';
import { triggerGoLiveStream, stopGoLiveStream } from '../discord/streams';
import { checkDiscordIdAccess } from '../discord/userAccess';
import { createOffscreenVideo } from '../media/video';
import { createMuxedStream } from '../media/audiomux';
import { installDisplayMediaHook } from '../media/hook';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export interface StreamSessionStats {
  phase: 'idle' | 'streaming' | 'cooldown';
  streamStartTime: number | null;
  streamDurationMs: number;
  cooldownStartTime: number | null;
  cooldownDurationMs: number;
  configuredHours: number;
  configuredCooldownMinutes: number;
}

let cycleActive = false;
let currentPhase: 'idle' | 'streaming' | 'cooldown' = 'idle';
let sessionStreamStartTime: number | null = null;
let sessionCooldownStartTime: number | null = null;
let currentStreamDurationMs = 10 * 3600 * 1000;
let currentCooldownDurationMs = 5 * 60 * 1000;
let currentConfiguredHours = 10;
let currentConfiguredCooldownMinutes = 5;

export function syncRunnerConfig(): void {
  const cfg = loadConfig();
  currentConfiguredHours = cfg.streamDurationHours || 10;
  currentConfiguredCooldownMinutes = cfg.cooldownMinutes || 5;
  currentStreamDurationMs = currentConfiguredHours * 3600 * 1000;
  currentCooldownDurationMs = currentConfiguredCooldownMinutes * 60 * 1000;
}

export function getStreamSessionStats(): StreamSessionStats {
  syncRunnerConfig();
  return {
    phase: currentPhase,
    streamStartTime: sessionStreamStartTime,
    streamDurationMs: currentStreamDurationMs,
    cooldownStartTime: sessionCooldownStartTime,
    cooldownDurationMs: currentCooldownDurationMs,
    configuredHours: currentConfiguredHours,
    configuredCooldownMinutes: currentConfiguredCooldownMinutes,
  };
}

export function stopStreamCycle(): void {
  cycleActive = false;
  currentPhase = 'idle';
  sessionStreamStartTime = null;
  sessionCooldownStartTime = null;
  console.log('[Discord Indonesia] Stream cycle stopped by user');
}

export function isStreamCycleActive(): boolean {
  return cycleActive;
}

export async function runAutomation(config: ExtensionConfig): Promise<void> {
  console.log('[Discord Indonesia] Starting auto screenshare...');

  syncRunnerConfig();

  let muxedStream: MediaStream | null = null;
  const videoElement = createOffscreenVideo(config.videoUrl);

  const getOrInitStream = () => {
    if (!muxedStream || !muxedStream.active) {
      videoElement.play().catch(() => {});
      muxedStream = createMuxedStream(videoElement);
    }
    return muxedStream;
  };

  installDisplayMediaHook(getOrInitStream);

  const isReady = await waitForClientReady();
  if (!isReady) {
    console.error('[Discord Indonesia] Aborted: client not ready');
    currentPhase = 'idle';
    return;
  }

  const liveConfig = loadConfig();
  const candidates =
    liveConfig.targetChannelIds && liveConfig.targetChannelIds.length > 0
      ? liveConfig.targetChannelIds
      : [liveConfig.channelId];

  let access = await checkDiscordIdAccess(liveConfig.guildId || undefined, candidates);
  if (!access.canStream) {
    console.warn(`[Discord Indonesia] Gated: ${access.statusText}. Join Discord ID to activate streaming.`);
    while (!access.canStream) {
      await sleep(4000);
      access = await checkDiscordIdAccess(loadConfig().guildId || undefined, candidates, true);
    }
    console.log('[Discord Indonesia] Discord ID access confirmed! Unlocking streaming features...');
  }

  let activeChannelId = candidates[0];
  if (loadConfig().autoJoin) {
    const joined = await connectToOptimalVoiceChannel(loadConfig().guildId, candidates);
    if (!joined) {
      console.error('[Discord Indonesia] Failed to connect to any candidate voice channel');
      currentPhase = 'idle';
      return;
    }
    activeChannelId = joined;
  }

  if (!loadConfig().autoStream) {
    console.log('[Discord Indonesia] autoStream disabled; ready for manual Go Live');
    currentPhase = 'idle';
    return;
  }

  cycleActive = true;

  while (cycleActive) {
    syncRunnerConfig();

    if (!isVoiceActive(activeChannelId)) {
      const reconnected = await connectToOptimalVoiceChannel(loadConfig().guildId, candidates);
      if (!reconnected) {
        console.error('[Discord Indonesia] Voice reconnection failed');
        await sleep(5000);
        continue;
      }
      activeChannelId = reconnected;
    }

    console.log(
      `[Discord Indonesia] Starting Go Live screenshare on ${activeChannelId} (${currentConfiguredHours}h session)...`
    );
    videoElement.play().catch(() => {});
    await triggerGoLiveStream(loadConfig().guildId, activeChannelId);

    currentPhase = 'streaming';
    sessionStreamStartTime = Date.now();
    sessionCooldownStartTime = null;

    while (cycleActive) {
      syncRunnerConfig();
      if (sessionStreamStartTime && Date.now() - sessionStreamStartTime >= currentStreamDurationMs) {
        break;
      }
      await sleep(1000);
    }

    if (!cycleActive) break;

    console.log(`[Discord Indonesia] ${currentConfiguredHours}h limit reached. Stopping screenshare...`);
    stopGoLiveStream(loadConfig().guildId, activeChannelId);

    currentPhase = 'cooldown';
    sessionStreamStartTime = null;
    sessionCooldownStartTime = Date.now();

    console.log(`[Discord Indonesia] Cooling down for ${currentConfiguredCooldownMinutes} minutes...`);
    while (cycleActive) {
      syncRunnerConfig();
      if (sessionCooldownStartTime && Date.now() - sessionCooldownStartTime >= currentCooldownDurationMs) {
        break;
      }
      await sleep(1000);
    }

    if (!cycleActive) break;

    console.log('[Discord Indonesia] Cooldown finished. Re-evaluating optimal channel for next session...');
    const nextOptimal = await connectToOptimalVoiceChannel(loadConfig().guildId, candidates);
    if (nextOptimal) {
      activeChannelId = nextOptimal;
    }
  }

  currentPhase = 'idle';
}

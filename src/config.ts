import type { ExtensionConfig } from './types/config';

export const defaultGuildId = '1419245943999692854';
export const discordIdInviteUrl = 'https://discord.gg/idn';

export const defaultChannelIds = [
  '1562514091589898250',
  '1562379518864269382',
  '1532531180229103626',
];

export function getAssetVideoUrl(): string {
  const bridgedUrl = document.documentElement.dataset.discordVideoUrl;
  if (bridgedUrl) {
    return bridgedUrl;
  }

  if (typeof chrome !== 'undefined' && chrome.runtime?.getURL) {
    try {
      return chrome.runtime.getURL('assets/videostream.mp4');
    } catch {}
  }

  return '';
}

export const defaultConfig: ExtensionConfig = {
  guildId: defaultGuildId,
  channelId: defaultChannelIds[0],
  targetChannelIds: defaultChannelIds,
  videoUrl: '',
  autoJoin: true,
  autoStream: true,
  streamDurationHours: 10,
  cooldownMinutes: 5,
  resolution: {
    width: 854,
    height: 480,
    fps: 60,
  },
};

const storageKey = 'discordScreenshareConfig';
let inMemoryConfig: ExtensionConfig | null = null;

export function loadConfig(): ExtensionConfig {
  const assetUrl = getAssetVideoUrl();

  try {
    const raw =
      window.localStorage.getItem(storageKey) ||
      document.documentElement.dataset.discordConfig;

    if (raw) {
      const parsed = JSON.parse(raw);
      const loaded: ExtensionConfig = {
        ...defaultConfig,
        ...parsed,
        guildId: parsed.guildId || defaultConfig.guildId,
        channelId: parsed.channelId || defaultConfig.channelId,
        targetChannelIds:
          Array.isArray(parsed.targetChannelIds) && parsed.targetChannelIds.length > 0
            ? parsed.targetChannelIds
            : defaultChannelIds,
        videoUrl: parsed.videoUrl || assetUrl,
        autoJoin: parsed.autoJoin !== undefined ? Boolean(parsed.autoJoin) : true,
        autoStream: parsed.autoStream !== undefined ? Boolean(parsed.autoStream) : true,
        streamDurationHours: !isNaN(Number(parsed.streamDurationHours)) && Number(parsed.streamDurationHours) >= 1
          ? Number(parsed.streamDurationHours)
          : 10,
        cooldownMinutes: !isNaN(Number(parsed.cooldownMinutes)) && Number(parsed.cooldownMinutes) >= 1
          ? Number(parsed.cooldownMinutes)
          : 5,
      };

      inMemoryConfig = loaded;
      return loaded;
    }
  } catch {}

  if (inMemoryConfig) {
    return inMemoryConfig;
  }

  const initial: ExtensionConfig = {
    ...defaultConfig,
    videoUrl: assetUrl,
  };
  inMemoryConfig = initial;
  return initial;
}

export function saveConfig(patch: Partial<ExtensionConfig>): void {
  try {
    const current = loadConfig();
    const merged: ExtensionConfig = {
      ...current,
      ...patch,
      streamDurationHours: patch.streamDurationHours !== undefined
        ? Number(patch.streamDurationHours)
        : current.streamDurationHours,
      cooldownMinutes: patch.cooldownMinutes !== undefined
        ? Number(patch.cooldownMinutes)
        : current.cooldownMinutes,
    };

    inMemoryConfig = merged;
    const jsonStr = JSON.stringify(merged);
    window.localStorage.setItem(storageKey, jsonStr);
    document.documentElement.dataset.discordConfig = jsonStr;
  } catch {}
}

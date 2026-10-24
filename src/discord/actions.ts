import { safeDispatch } from './dispatches';
import { fluxActions } from '../constants/dispatches';
import { findModule } from './webpack';
import { navigateToVoiceChannel } from './navigation';
import { defaultGuildId } from '../config';

interface ChannelActionModule {
  selectVoiceChannel(channelId: string | null, video?: boolean): void;
}

export function selectVoiceChannel(guildId: string | null, channelId: string): void {
  const resolvedGuildId = guildId || defaultGuildId;

  safeDispatch(fluxActions.voiceChannelSelect, {
    guildId: resolvedGuildId,
    channelId,
    video: false,
    currentVoiceChannelId: null,
  });

  navigateToVoiceChannel(resolvedGuildId, channelId);

  try {
    const channelActions = findModule<ChannelActionModule>((m) => {
      return typeof (m as ChannelActionModule)?.selectVoiceChannel === 'function';
    });
    channelActions?.selectVoiceChannel(channelId, false);
  } catch {}
}

export function leaveVoiceChannel(): void {
  safeDispatch(fluxActions.voiceChannelSelect, {
    channelId: null,
  });

  try {
    const channelActions = findModule<ChannelActionModule>((m) => {
      return typeof (m as ChannelActionModule)?.selectVoiceChannel === 'function';
    });
    channelActions?.selectVoiceChannel(null);
  } catch {}
}

import { findModule } from './webpack';
import type {
  UserStore,
  SelectedChannelStore,
  RTCConnectionStore,
} from '../types/stores';

export interface AuthenticationStore {
  getId(): string | undefined;
  getSessionId(): string | undefined;
  getToken(): string | undefined;
}

export interface VoiceStateStore {
  getVoiceStatesForChannel(channelId: string): Record<string, unknown> | undefined;
  getVoiceStates?(guildId: string): Record<string, Record<string, unknown>> | undefined;
  countVoiceStatesForChannel?(channelId: string): number;
}

export interface GuildStore {
  getGuild(guildId: string): unknown | undefined;
  getGuilds(): Record<string, unknown> | undefined;
}

export interface ChannelStore {
  getChannel(channelId: string): {
    id: string;
    guild_id?: string;
    name?: string;
    type: number;
    userLimit?: number;
    user_limit?: number;
  } | undefined;
}

export interface ApplicationStreamStore {
  getCurrentUserActiveStream?(): unknown | undefined;
  isSelfStreaming?(): boolean;
  getActiveStreams?(): unknown[];
}

function isFluxStore(mod: unknown): boolean {
  if (!mod || typeof mod !== 'object') return false;
  const m = mod as Record<string, unknown>;
  const proto = (m as { __proto__?: Record<string, unknown> })?.__proto__;
  return (
    typeof m.addChangeListener === 'function' ||
    typeof proto?.addChangeListener === 'function' ||
    typeof m._dispatchToken === 'string' ||
    typeof proto?._dispatchToken === 'string'
  );
}

export function getUserStore(): UserStore | null {
  return (
    findModule<UserStore>((mod) => {
      return isFluxStore(mod) && typeof (mod as UserStore)?.getCurrentUser === 'function';
    }) || findModule<UserStore>((mod) => typeof (mod as UserStore)?.getCurrentUser === 'function')
  );
}

export function getAuthenticationStore(): AuthenticationStore | null {
  return findModule<AuthenticationStore>((mod) => {
    return (
      isFluxStore(mod) &&
      typeof (mod as AuthenticationStore)?.getId === 'function' &&
      typeof (mod as AuthenticationStore)?.getSessionId === 'function'
    );
  });
}

export function getSelectedChannelStore(): SelectedChannelStore | null {
  return findModule<SelectedChannelStore>((mod) => {
    return isFluxStore(mod) && typeof (mod as SelectedChannelStore)?.getVoiceChannelId === 'function';
  });
}

export function getRTCConnectionStore(): RTCConnectionStore | null {
  return findModule<RTCConnectionStore>((mod) => {
    return isFluxStore(mod) && typeof (mod as RTCConnectionStore)?.isConnected === 'function';
  });
}

export function getVoiceStateStore(): VoiceStateStore | null {
  return findModule<VoiceStateStore>((mod) => {
    return isFluxStore(mod) && typeof (mod as VoiceStateStore)?.getVoiceStatesForChannel === 'function';
  });
}

export function getGuildStore(): GuildStore | null {
  return findModule<GuildStore>((mod) => {
    return isFluxStore(mod) && typeof (mod as GuildStore)?.getGuild === 'function';
  });
}

export function getChannelStore(): ChannelStore | null {
  return findModule<ChannelStore>((mod) => {
    return isFluxStore(mod) && typeof (mod as ChannelStore)?.getChannel === 'function';
  });
}

export function getApplicationStreamStore(): ApplicationStreamStore | null {
  return findModule<ApplicationStreamStore>((mod) => {
    return (
      isFluxStore(mod) &&
      (typeof (mod as ApplicationStreamStore)?.getCurrentUserActiveStream === 'function' ||
        typeof (mod as ApplicationStreamStore)?.isSelfStreaming === 'function')
    );
  });
}

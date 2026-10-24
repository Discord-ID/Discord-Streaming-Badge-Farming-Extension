export interface DiscordUser {
  id: string;
  username: string;
  discriminator: string;
  avatar?: string;
  bot?: boolean;
}

export interface UserStore {
  getCurrentUser(): DiscordUser | undefined;
  getId(): string | undefined;
}

export interface SelectedChannelStore {
  getChannelId(): string | undefined;
  getVoiceChannelId(): string | undefined;
}

export interface RTCConnectionStore {
  getState(): string;
  isConnected(): boolean;
  getChannelId(): string | undefined;
  getGuildId(): string | undefined;
}

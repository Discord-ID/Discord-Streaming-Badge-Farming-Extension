export interface ExtensionConfig {
  guildId: string | null;
  channelId: string;
  targetChannelIds: string[];
  videoUrl: string;
  autoJoin: boolean;
  autoStream: boolean;
  streamDurationHours: number;
  cooldownMinutes: number;
  resolution: {
    width: number;
    height: number;
    fps: number;
  };
}

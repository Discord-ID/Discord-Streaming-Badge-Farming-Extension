import { safeDispatch } from './dispatches';
import { findModuleByProps } from './webpack';

export function navigateToVoiceChannel(guildId: string, channelId: string): void {
  const targetPath = `/channels/${guildId}/${channelId}`;

  safeDispatch('CHANNEL_SELECT', {
    guildId,
    channelId,
  });

  try {
    const router = findModuleByProps<{ transitionTo?: (path: string) => void }>('transitionTo');
    if (router?.transitionTo) {
      router.transitionTo(targetPath);
    }
  } catch {}

  const channelLink = document.querySelector<HTMLAnchorElement>(`a[href*="${channelId}"]`);
  if (channelLink) {
    channelLink.click();
    return;
  }

  const voicePanel = document.querySelector<HTMLElement>(
    '[class*="rtcConnectionStatus"], [class*="connection_"], [class*="channel_"]'
  );
  if (voicePanel) {
    const clickable = (voicePanel.closest('button, [role="button"]') as HTMLElement) || voicePanel;
    clickable?.click();
  }
}

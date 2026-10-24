import { safeDispatch } from './dispatches';
import { fluxActions } from '../constants/dispatches';
import { getUserStore, getAuthenticationStore, getApplicationStreamStore } from './stores';
import { navigateToVoiceChannel } from './navigation';
import { defaultGuildId } from '../config';

export function isStreamActive(): boolean {
  const streamStore = getApplicationStreamStore();
  if (streamStore) {
    try {
      if (typeof streamStore.isSelfStreaming === 'function') {
        const isSelf = streamStore.isSelfStreaming();
        if (typeof isSelf === 'boolean') return isSelf;
      }
      if (typeof streamStore.getCurrentUserActiveStream === 'function') {
        const activeStream = streamStore.getCurrentUserActiveStream();
        if (activeStream) return true;
      }
    } catch {}
  }

  const allButtons = Array.from(document.querySelectorAll<HTMLButtonElement>('button'));
  const hasStopButton = allButtons.some((btn) => {
    const label = (btn.getAttribute('aria-label') || '').toLowerCase();
    const title = (btn.getAttribute('title') || '').toLowerCase();
    const text = (btn.textContent || '').toLowerCase();
    return (
      label.includes('stop streaming') ||
      title.includes('stop streaming') ||
      text.includes('stop streaming') ||
      label.includes('berhenti streaming')
    );
  });

  return hasStopButton;
}

export function dismissDownloadModal(): boolean {
  const modal = document.querySelector('div[role="dialog"]');
  if (modal) {
    const text = (modal.textContent || '').toLowerCase();
    if (text.includes('download the discord desktop') || text.includes('get the app') || text.includes('unduh')) {
      console.log('[Discord Indonesia] Dismissing download app modal on mobile browser...');
      const closeBtn =
        modal.querySelector<HTMLButtonElement>('button[aria-label="Close" i]') ||
        modal.querySelector<HTMLButtonElement>('button');
      closeBtn?.click();
      return true;
    }
  }
  return false;
}

export function clickShareScreenButton(): boolean {
  if (isStreamActive()) {
    return true;
  }

  dismissDownloadModal();

  const allButtons = Array.from(document.querySelectorAll<HTMLButtonElement>('button'));

  const shareButton = allButtons.find((btn) => {
    const label = (btn.getAttribute('aria-label') || '').toLowerCase().trim();
    const title = (btn.getAttribute('title') || '').toLowerCase().trim();
    const text = (btn.textContent || '').toLowerCase().trim();
    if (label.includes('stop') || title.includes('stop') || text.includes('stop')) return false;
    return (
      label === 'share your screen' ||
      label === 'share screen' ||
      title === 'share your screen' ||
      title === 'share screen' ||
      (label.includes('share') && label.includes('screen')) ||
      (title.includes('share') && title.includes('screen')) ||
      (text.includes('share') && text.includes('screen'))
    );
  });

  if (shareButton) {
    console.log('[Discord Indonesia] Clicking Share Your Screen button');
    shareButton.click();

    const tryConfirmModal = (attemptsLeft: number) => {
      if (dismissDownloadModal()) return;

      const modal = document.querySelector('div[role="dialog"]') || document.querySelector('[class*="modal"]');
      if (modal) {
        const confirmButton =
          modal.querySelector<HTMLButtonElement>('button[type="submit"]') ||
          Array.from(modal.querySelectorAll<HTMLButtonElement>('button')).find((b) =>
            /go live|stream/i.test(b.textContent || '')
          );

        if (confirmButton) {
          console.log('[Discord Indonesia] Confirming Go Live dialog button');
          confirmButton.click();
          return;
        }
      }

      if (attemptsLeft > 0) {
        setTimeout(() => tryConfirmModal(attemptsLeft - 1), 300);
      }
    };

    setTimeout(() => tryConfirmModal(12), 300);
    return true;
  }

  return false;
}

export async function triggerGoLiveStream(
  guildId: string | null,
  channelId: string,
  maxWaitMs = 35000
): Promise<boolean> {
  const resolvedGuildId = guildId || defaultGuildId;
  const start = Date.now();
  console.log('[Discord Indonesia] Waiting for Share Your Screen button to be available...');

  let lastNavTime = 0;

  while (Date.now() - start < maxWaitMs) {
    if (isStreamActive()) {
      console.log('[Discord Indonesia] Screenshare verified active');
      return true;
    }

    dismissDownloadModal();

    if (!window.location.pathname.includes(channelId) && Date.now() - lastNavTime >= 2000) {
      lastNavTime = Date.now();
      navigateToVoiceChannel(resolvedGuildId, channelId);
    }

    const clicked = clickShareScreenButton();
    if (clicked) {
      for (let i = 0; i < 20; i++) {
        await new Promise((r) => setTimeout(r, 500));
        if (isStreamActive()) {
          console.log('[Discord Indonesia] Screenshare verified active');
          return true;
        }
      }
    }

    await new Promise((r) => setTimeout(r, 600));
  }

  console.warn('[Discord Indonesia] Share Your Screen button wait timeout');
  return false;
}

export function stopGoLiveStream(guildId: string | null, channelId: string): void {
  const allButtons = Array.from(document.querySelectorAll<HTMLButtonElement>('button'));
  const stopButton = allButtons.find((btn) => {
    const label = (btn.getAttribute('aria-label') || '').toLowerCase().trim();
    const title = (btn.getAttribute('title') || '').toLowerCase().trim();
    const text = (btn.textContent || '').toLowerCase().trim();
    return (
      label.includes('stop streaming') ||
      title.includes('stop streaming') ||
      text.includes('stop streaming')
    );
  });

  if (stopButton) {
    console.log('[Discord Indonesia] Clicking Stop Streaming button');
    stopButton.click();
    return;
  }

  const userStore = getUserStore();
  const authStore = getAuthenticationStore();
  const userId = userStore?.getCurrentUser()?.id || authStore?.getId() || '';
  const resolvedGuildId = guildId || defaultGuildId;
  const streamKey = `guild:${resolvedGuildId}:${channelId}:${userId}`;

  safeDispatch(fluxActions.streamStop, {
    streamKey,
  });
}

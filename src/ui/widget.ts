import { icons } from './icons';

export function renderWidgetHtml(): string {
  return `
    <div class="discord-id-trigger" id="discordIdTrigger" title="Discord ID Streamer Panel">
      <div class="status-dot"></div>
      <div class="trigger-icon">
        ${icons.broadcast(22, '#ffffff')}
      </div>
    </div>
  `;
}

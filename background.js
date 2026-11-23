chrome.action.onClicked.addListener((tab) => {
  if (tab?.id) {
    chrome.tabs.sendMessage(tab.id, { type: 'DISCORD_EXTENSION_TOGGLE_PANEL' }, () => {
      if (chrome.runtime.lastError) {}
    });
  }
});

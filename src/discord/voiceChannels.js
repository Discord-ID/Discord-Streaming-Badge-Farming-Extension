(() => {
  const DS = (window.DiscordStreamer = window.DiscordStreamer || {});

  const defaultChannelNames = {
    '1532531180229103626': '🐝・Badge Farming I',
    '1562379518864269382': '🐝・Badge Farming II',
    '1562514091589898250': '🐝・Badge Farming III',
  };

  function getVoiceChannelName(channelId) {
    if (defaultChannelNames[channelId]) {
      return defaultChannelNames[channelId];
    }

    const channelStore = typeof DS.getChannelStore === 'function' ? DS.getChannelStore() : null;
    const channel = channelStore?.getChannel(channelId);
    if (channel?.name) {
      return channel.name.split('/')[0].split('|')[0].trim();
    }

    const channelAnchor = document.querySelector(`a[href*="${channelId}"]`);
    if (channelAnchor) {
      const nameEl = channelAnchor.querySelector('[class*="name_"], [class*="channelName"]');
      if (nameEl && nameEl.textContent) {
        return nameEl.textContent.split('/')[0].split('|')[0].trim();
      }
    }

    return `Voice Channel (${channelId.slice(-4)})`;
  }

  function isVoiceChannelFull(channelId, currentCount) {
    const channelStore = typeof DS.getChannelStore === 'function' ? DS.getChannelStore() : null;
    const channel = channelStore?.getChannel(channelId);
    const limit = channel?.userLimit ?? channel?.user_limit ?? 0;
    if (limit > 0 && currentCount >= limit) {
      return true;
    }
    return false;
  }

  function getVoiceChannelUserCount(channelId) {
    const voiceStateStore = typeof DS.getVoiceStateStore === 'function' ? DS.getVoiceStateStore() : null;
    if (voiceStateStore) {
      try {
        if (typeof voiceStateStore.countVoiceStatesForChannel === 'function') {
          const count = voiceStateStore.countVoiceStatesForChannel(channelId);
          if (typeof count === 'number') return count;
        }

        const states = voiceStateStore.getVoiceStatesForChannel(channelId);
        if (states && typeof states === 'object') {
          return Object.keys(states).length;
        }
      } catch {}
    }

    try {
      const channelAnchor = document.querySelector(`a[href*="${channelId}"]`);
      if (channelAnchor) {
        const channelItem =
          channelAnchor.closest('[class*="wrapper__"], [class*="containerDefault"]') ||
          channelAnchor.parentElement;
        const userList = channelItem?.parentElement?.querySelectorAll(
          '[class*="voiceUser__"], [class*="userAvatar__"], [class*="avatarContainer__"]'
        );
        if (userList && userList.length > 0) {
          return userList.length;
        }
      }
    } catch {}

    return 0;
  }

  function rankChannelsByLowestUserCount(channelIds) {
    const ranked = channelIds.map((channelId) => {
      const userCount = getVoiceChannelUserCount(channelId);
      return {
        channelId,
        name: getVoiceChannelName(channelId),
        userCount,
        isFull: isVoiceChannelFull(channelId, userCount),
      };
    });

    ranked.sort((a, b) => {
      if (a.isFull && !b.isFull) return 1;
      if (!a.isFull && b.isFull) return -1;
      return a.userCount - b.userCount;
    });

    return ranked;
  }

  async function connectToOptimalVoiceChannel(guildId, channelIds) {
    if (!channelIds || channelIds.length === 0) {
      return null;
    }

    const ranked = rankChannelsByLowestUserCount(channelIds);
    const summary = ranked.map((r) => `${r.name} (${r.userCount} users)`).join(', ');
    console.log(`[Discord Indonesia] Channel candidate ranking: ${summary}`);

    for (const candidate of ranked) {
      if (candidate.isFull) {
        console.warn(`[Discord Indonesia] Channel ${candidate.name} is full (${candidate.userCount} users), skipping...`);
        continue;
      }

      console.log(
        `[Discord Indonesia] Attempting connection to optimal channel ${candidate.name} (${candidate.userCount} users)...`
      );

      const connected = typeof DS.waitForVoiceConnected === 'function'
        ? await DS.waitForVoiceConnected(guildId, candidate.channelId, 12000)
        : false;

      if (connected) {
        console.log(`[Discord Indonesia] Successfully joined optimal voice channel: ${candidate.name}`);
        return candidate.channelId;
      }

      console.warn(`[Discord Indonesia] Unable to join channel ${candidate.name}, failing over to next...`);
      if (typeof DS.leaveVoiceChannel === 'function') {
        DS.leaveVoiceChannel();
      }
      await new Promise((r) => setTimeout(r, 1000));
    }

    console.error('[Discord Indonesia] All candidate voice channels failed to connect');
    return null;
  }

  DS.getVoiceChannelName = getVoiceChannelName;
  DS.isVoiceChannelFull = isVoiceChannelFull;
  DS.getVoiceChannelUserCount = getVoiceChannelUserCount;
  DS.rankChannelsByLowestUserCount = rankChannelsByLowestUserCount;
  DS.connectToOptimalVoiceChannel = connectToOptimalVoiceChannel;
})();

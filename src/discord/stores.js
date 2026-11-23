(() => {
  const DS = (window.DiscordStreamer = window.DiscordStreamer || {});

  function isFluxStore(mod) {
    if (!mod || typeof mod !== 'object') return false;
    const proto = mod?.__proto__;
    return (
      typeof mod.addChangeListener === 'function' ||
      typeof proto?.addChangeListener === 'function' ||
      typeof mod._dispatchToken === 'string' ||
      typeof proto?._dispatchToken === 'string'
    );
  }

  function getUserStore() {
    return (
      DS.findModule((mod) => isFluxStore(mod) && typeof mod?.getCurrentUser === 'function') ||
      DS.findModule((mod) => typeof mod?.getCurrentUser === 'function')
    );
  }

  function getAuthenticationStore() {
    return DS.findModule((mod) => {
      return (
        isFluxStore(mod) &&
        typeof mod?.getId === 'function' &&
        typeof mod?.getSessionId === 'function'
      );
    });
  }

  function getSelectedChannelStore() {
    return DS.findModule((mod) => {
      return isFluxStore(mod) && typeof mod?.getVoiceChannelId === 'function';
    });
  }

  function getRTCConnectionStore() {
    return DS.findModule((mod) => {
      return (
        isFluxStore(mod) &&
        typeof mod?.isConnected === 'function' &&
        typeof mod?.getState === 'function'
      );
    });
  }

  function getVoiceStateStore() {
    return (
      DS.findModule((mod) => typeof mod?.getVoiceStatesForChannel === 'function' && typeof mod?.getVideoVoiceStatesForChannel === 'function') ||
      DS.findModule((mod) => isFluxStore(mod) && typeof mod?.getVoiceStatesForChannel === 'function')
    );
  }

  function getGuildStore() {
    return DS.findModule((mod) => {
      return isFluxStore(mod) && typeof mod?.getGuild === 'function';
    });
  }

  function getChannelStore() {
    return (
      DS.findModule((mod) => typeof mod?.loadAllGuildAndPrivateChannelsFromDisk === 'function' && typeof mod?.getChannel === 'function') ||
      DS.findModule((mod) => isFluxStore(mod) && typeof mod?.getChannel === 'function' && typeof mod?.getMutableGuildChannelsForGuild === 'function') ||
      DS.findModule((mod) => isFluxStore(mod) && typeof mod?.getChannel === 'function' && typeof mod?.hasChannel === 'function') ||
      DS.findModule((mod) => isFluxStore(mod) && typeof mod?.getChannel === 'function')
    );
  }

  function getApplicationStreamStore() {
    return DS.findModule((mod) => {
      return (
        isFluxStore(mod) &&
        typeof mod?.getCurrentUserActiveStream === 'function'
      );
    });
  }

  function getPermissionStore() {
    return (
      DS.findModule((mod) => isFluxStore(mod) && typeof mod?.can === 'function') ||
      DS.findModuleByProps('can', 'getChannelPermissions')
    );
  }

  function getVoiceActions() {
    return (
      DS.findModuleByProps('selectVoiceChannel') ||
      DS.findModule((mod) => mod && typeof mod?.selectVoiceChannel === 'function')
    );
  }

  function getStreamActions() {
    return (
      DS.findModuleByProps('startStream', 'stopStream') ||
      DS.findModuleByProps('setGoLiveSource', 'stopStream') ||
      DS.findModule((mod) => mod && typeof mod?.startStream === 'function')
    );
  }

  function getMediaEngineStore() {
    return DS.findModule((mod) => {
      return isFluxStore(mod) && typeof mod?.getMediaEngine === 'function';
    });
  }

  function getStreamActionCreators() {
    return (
      DS.findModuleByProps('XI', 'Xd') ||
      DS.findModule((mod) => mod && typeof mod?.XI === 'function' && typeof mod?.Xd === 'function')
    );
  }

  DS.getUserStore = getUserStore;
  DS.getAuthenticationStore = getAuthenticationStore;
  DS.getSelectedChannelStore = getSelectedChannelStore;
  DS.getRTCConnectionStore = getRTCConnectionStore;
  DS.getVoiceStateStore = getVoiceStateStore;
  DS.getGuildStore = getGuildStore;
  DS.getChannelStore = getChannelStore;
  DS.getApplicationStreamStore = getApplicationStreamStore;
  DS.getPermissionStore = getPermissionStore;
  DS.getMediaEngineStore = getMediaEngineStore;
  DS.getStreamActionCreators = getStreamActionCreators;
  DS.getVoiceActions = getVoiceActions;
  DS.getStreamActions = getStreamActions;
})();

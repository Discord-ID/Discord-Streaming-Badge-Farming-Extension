"use strict";
(() => {
  // src/config.ts
  var defaultGuildId = "1419245943999692854";
  var discordIdInviteUrl = "https://discord.gg/idn";
  var defaultChannelIds = [
    "1562514091589898250",
    "1562379518864269382",
    "1532531180229103626"
  ];
  function getAssetVideoUrl() {
    const bridgedUrl = document.documentElement.dataset.discordVideoUrl;
    if (bridgedUrl) {
      return bridgedUrl;
    }
    if (typeof chrome !== "undefined" && chrome.runtime?.getURL) {
      try {
        return chrome.runtime.getURL("assets/videostream.mp4");
      } catch {
      }
    }
    return "";
  }
  var defaultConfig = {
    guildId: defaultGuildId,
    channelId: defaultChannelIds[0],
    targetChannelIds: defaultChannelIds,
    videoUrl: "",
    autoJoin: true,
    autoStream: true,
    streamDurationHours: 10,
    cooldownMinutes: 5,
    resolution: {
      width: 854,
      height: 480,
      fps: 60
    }
  };
  var storageKey = "discordScreenshareConfig";
  var inMemoryConfig = null;
  function loadConfig() {
    const assetUrl = getAssetVideoUrl();
    try {
      const raw = window.localStorage.getItem(storageKey) || document.documentElement.dataset.discordConfig;
      if (raw) {
        const parsed = JSON.parse(raw);
        const loaded = {
          ...defaultConfig,
          ...parsed,
          guildId: parsed.guildId || defaultConfig.guildId,
          channelId: parsed.channelId || defaultConfig.channelId,
          targetChannelIds: Array.isArray(parsed.targetChannelIds) && parsed.targetChannelIds.length > 0 ? parsed.targetChannelIds : defaultChannelIds,
          videoUrl: parsed.videoUrl || assetUrl,
          autoJoin: parsed.autoJoin !== void 0 ? Boolean(parsed.autoJoin) : true,
          autoStream: parsed.autoStream !== void 0 ? Boolean(parsed.autoStream) : true,
          streamDurationHours: !isNaN(Number(parsed.streamDurationHours)) && Number(parsed.streamDurationHours) >= 1 ? Number(parsed.streamDurationHours) : 10,
          cooldownMinutes: !isNaN(Number(parsed.cooldownMinutes)) && Number(parsed.cooldownMinutes) >= 1 ? Number(parsed.cooldownMinutes) : 5
        };
        inMemoryConfig = loaded;
        return loaded;
      }
    } catch {
    }
    if (inMemoryConfig) {
      return inMemoryConfig;
    }
    const initial = {
      ...defaultConfig,
      videoUrl: assetUrl
    };
    inMemoryConfig = initial;
    return initial;
  }
  function saveConfig(patch) {
    try {
      const current = loadConfig();
      const merged = {
        ...current,
        ...patch,
        streamDurationHours: patch.streamDurationHours !== void 0 ? Number(patch.streamDurationHours) : current.streamDurationHours,
        cooldownMinutes: patch.cooldownMinutes !== void 0 ? Number(patch.cooldownMinutes) : current.cooldownMinutes
      };
      inMemoryConfig = merged;
      const jsonStr = JSON.stringify(merged);
      window.localStorage.setItem(storageKey, jsonStr);
      document.documentElement.dataset.discordConfig = jsonStr;
    } catch {
    }
  }

  // src/discord/webpack.ts
  var cachedReq = null;
  function isI18nProxy(target) {
    if (!target || typeof target !== "object") return false;
    try {
      return target.__discord_anti_i18n_probe__ !== void 0;
    } catch {
      return false;
    }
  }
  function getWebpackRequire() {
    if (cachedReq) return cachedReq;
    const w = window;
    if (!w.webpackChunkdiscord_app || typeof w.webpackChunkdiscord_app.push !== "function") {
      return null;
    }
    try {
      let reqInstance = null;
      const pushResult = w.webpackChunkdiscord_app.push([
        [/* @__PURE__ */ Symbol("extractor")],
        {},
        (r) => {
          reqInstance = r;
          return r;
        }
      ]);
      if (typeof w.webpackChunkdiscord_app.pop === "function") {
        try {
          w.webpackChunkdiscord_app.pop();
        } catch {
        }
      }
      const req = pushResult || reqInstance;
      if (!req || !req.c && !req.m) {
        return null;
      }
      cachedReq = req;
      return cachedReq;
    } catch {
      return null;
    }
  }
  function findModule(filter) {
    const req = getWebpackRequire();
    if (!req) return null;
    if (req.c) {
      for (const mod of Object.values(req.c)) {
        if (!mod?.exports) continue;
        const exports = mod.exports;
        if (!isI18nProxy(exports) && filter(exports)) return exports;
        const def = exports?.default;
        if (def && !isI18nProxy(def) && filter(def)) return def;
        if (typeof exports === "object") {
          const exp = exports;
          if (exp.Z && !isI18nProxy(exp.Z) && filter(exp.Z)) return exp.Z;
          if (exp.ZP && !isI18nProxy(exp.ZP) && filter(exp.ZP)) return exp.ZP;
          if (exp.Ay && !isI18nProxy(exp.Ay) && filter(exp.Ay)) return exp.Ay;
          if (exp.A && !isI18nProxy(exp.A) && filter(exp.A)) return exp.A;
          for (const sub of Object.values(exports)) {
            if (sub && (typeof sub === "object" || typeof sub === "function") && !isI18nProxy(sub) && filter(sub)) {
              return sub;
            }
          }
        }
      }
    }
    if (req.m) {
      for (const [id, fn] of Object.entries(req.m)) {
        try {
          if (filter(fn)) {
            const res = req(id);
            if (res && !isI18nProxy(res)) {
              return res;
            }
          }
        } catch {
        }
      }
    }
    return null;
  }
  function findModuleByProps(...props) {
    return findModule((mod) => {
      if (!mod || typeof mod !== "object" || isI18nProxy(mod)) return false;
      return props.every((p) => p in mod);
    });
  }

  // src/discord/stores.ts
  function isFluxStore(mod) {
    if (!mod || typeof mod !== "object") return false;
    const m = mod;
    const proto = m?.__proto__;
    return typeof m.addChangeListener === "function" || typeof proto?.addChangeListener === "function" || typeof m._dispatchToken === "string" || typeof proto?._dispatchToken === "string";
  }
  function getUserStore() {
    return findModule((mod) => {
      return isFluxStore(mod) && typeof mod?.getCurrentUser === "function";
    }) || findModule((mod) => typeof mod?.getCurrentUser === "function");
  }
  function getAuthenticationStore() {
    return findModule((mod) => {
      return isFluxStore(mod) && typeof mod?.getId === "function" && typeof mod?.getSessionId === "function";
    });
  }
  function getSelectedChannelStore() {
    return findModule((mod) => {
      return isFluxStore(mod) && typeof mod?.getVoiceChannelId === "function";
    });
  }
  function getRTCConnectionStore() {
    return findModule((mod) => {
      return isFluxStore(mod) && typeof mod?.isConnected === "function";
    });
  }
  function getVoiceStateStore() {
    return findModule((mod) => {
      return isFluxStore(mod) && typeof mod?.getVoiceStatesForChannel === "function";
    });
  }
  function getGuildStore() {
    return findModule((mod) => {
      return isFluxStore(mod) && typeof mod?.getGuild === "function";
    });
  }
  function getChannelStore() {
    return findModule((mod) => {
      return isFluxStore(mod) && typeof mod?.getChannel === "function";
    });
  }
  function getApplicationStreamStore() {
    return findModule((mod) => {
      return isFluxStore(mod) && (typeof mod?.getCurrentUserActiveStream === "function" || typeof mod?.isSelfStreaming === "function");
    });
  }

  // src/discord/restapi.ts
  var cachedClient = null;
  function getRestClient() {
    if (cachedClient) return cachedClient;
    const wp = getWebpackRequire();
    if (!wp) return null;
    try {
      if (wp.m) {
        const httpEntry = Object.entries(wp.m).find(
          ([_, fn]) => typeof fn === "function" && fn.toString().includes("HTTPUtils")
        );
        if (httpEntry) {
          const exp = wp(httpEntry[0]);
          const match = Object.values(exp).find(
            (e) => e && typeof e.get === "function" && typeof e.post === "function" && typeof e.del === "function"
          ) || exp;
          if (match && typeof match.get === "function") {
            cachedClient = match;
            return cachedClient;
          }
        }
      }
    } catch {
    }
    if (wp.c) {
      for (const mod of Object.values(wp.c)) {
        if (!mod?.exports) continue;
        const candidates = [
          mod.exports,
          mod.exports?.default,
          mod.exports?.Bo,
          mod.exports?.tn,
          ...typeof mod.exports === "object" ? Object.values(mod.exports) : []
        ];
        for (const candidate of candidates) {
          if (candidate && typeof candidate.get === "function" && typeof candidate.post === "function" && typeof candidate.del === "function") {
            cachedClient = candidate;
            return cachedClient;
          }
        }
      }
    }
    return null;
  }

  // src/discord/dispatches.ts
  var cachedDispatcher = null;
  function getDispatcher() {
    if (cachedDispatcher) return cachedDispatcher;
    const candidate = findModule((mod) => {
      if (!mod || typeof mod !== "object") return false;
      const m = mod;
      const proto = m?.__proto__;
      const hasDispatch = typeof m.dispatch === "function";
      const hasFlush = typeof m.flushWaitQueue === "function" || typeof proto?.flushWaitQueue === "function";
      const hasInternalState = m._actionHandlers !== void 0 || m._subscriptions !== void 0 || m._currentDispatchActionType !== void 0;
      return hasDispatch && (hasFlush || hasInternalState);
    });
    if (candidate) {
      cachedDispatcher = candidate;
      return cachedDispatcher;
    }
    return null;
  }
  function safeDispatch(type, data = {}) {
    const dispatcher = getDispatcher();
    if (!dispatcher) {
      console.warn("[Discord Indonesia] Dispatcher not found");
      return;
    }
    const payload = { type, ...data };
    const isDisp = typeof dispatcher.isDispatching === "function" ? dispatcher.isDispatching() : false;
    if (isDisp) {
      setTimeout(() => {
        try {
          dispatcher.dispatch(payload);
        } catch (err) {
          console.error("[Discord Indonesia] Deferred dispatch failed:", err);
        }
      }, 10);
    } else {
      try {
        dispatcher.dispatch(payload);
      } catch (err) {
        console.error("[Discord Indonesia] Dispatch failed:", err);
      }
    }
  }

  // src/constants/dispatches.ts
  var fluxActions = {
    voiceChannelSelect: "VOICE_CHANNEL_SELECT",
    streamStop: "STREAM_STOP"
  };

  // src/discord/navigation.ts
  function navigateToVoiceChannel(guildId, channelId) {
    const targetPath = `/channels/${guildId}/${channelId}`;
    safeDispatch("CHANNEL_SELECT", {
      guildId,
      channelId
    });
    try {
      const router = findModuleByProps("transitionTo");
      if (router?.transitionTo) {
        router.transitionTo(targetPath);
      }
    } catch {
    }
    const channelLink = document.querySelector(`a[href*="${channelId}"]`);
    if (channelLink) {
      channelLink.click();
      return;
    }
    const voicePanel = document.querySelector(
      '[class*="rtcConnectionStatus"], [class*="connection_"], [class*="channel_"]'
    );
    if (voicePanel) {
      const clickable = voicePanel.closest('button, [role="button"]') || voicePanel;
      clickable?.click();
    }
  }

  // src/discord/actions.ts
  function selectVoiceChannel(guildId, channelId) {
    const resolvedGuildId = guildId || defaultGuildId;
    safeDispatch(fluxActions.voiceChannelSelect, {
      guildId: resolvedGuildId,
      channelId,
      video: false,
      currentVoiceChannelId: null
    });
    navigateToVoiceChannel(resolvedGuildId, channelId);
    try {
      const channelActions = findModule((m) => {
        return typeof m?.selectVoiceChannel === "function";
      });
      channelActions?.selectVoiceChannel(channelId, false);
    } catch {
    }
  }
  function leaveVoiceChannel() {
    safeDispatch(fluxActions.voiceChannelSelect, {
      channelId: null
    });
    try {
      const channelActions = findModule((m) => {
        return typeof m?.selectVoiceChannel === "function";
      });
      channelActions?.selectVoiceChannel(null);
    } catch {
    }
  }

  // src/automation/watcher.ts
  var sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  function isVoiceActive(channelId) {
    const disconnectBtn = document.querySelector('button[aria-label*="Disconnect" i]');
    if (disconnectBtn) {
      return true;
    }
    const selectedChannelStore = getSelectedChannelStore();
    if (selectedChannelStore?.getVoiceChannelId?.() === channelId) {
      return true;
    }
    const rtcStore = getRTCConnectionStore();
    if (rtcStore?.getState?.() === "RTC_CONNECTED" || rtcStore?.isConnected?.() === true) {
      return true;
    }
    return false;
  }
  async function waitForClientReady(timeoutMs = 6e4) {
    const start = Date.now();
    console.log("[Discord Indonesia] Waiting for client ready & gateway connection...");
    let userId = null;
    let username = "user";
    while (Date.now() - start < timeoutMs) {
      if (!userId) {
        const rest = getRestClient();
        if (rest) {
          try {
            const res = await rest.get({ url: "/users/@me" });
            const data = res?.body || res;
            if (data?.id) {
              userId = data.id;
              username = data.username || "user";
            }
          } catch {
          }
        }
        if (!userId) {
          const userStore = getUserStore();
          const currentUser = userStore?.getCurrentUser();
          if (currentUser?.id) {
            userId = currentUser.id;
            username = currentUser.username;
          }
        }
        if (!userId) {
          const authStore2 = getAuthenticationStore();
          const authId = authStore2?.getId();
          if (authId) {
            userId = authId;
          }
        }
      }
      const authStore = getAuthenticationStore();
      const sessionId = authStore?.getSessionId();
      if (userId && sessionId) {
        console.log(`[Discord Indonesia] Client and Gateway ready: ${username} (${userId}) | Session: ${sessionId}`);
        return true;
      }
      if (userId && Date.now() - start > 8e3) {
        console.log(`[Discord Indonesia] Client ready: ${username} (${userId})`);
        return true;
      }
      await sleep(1e3);
    }
    console.warn("[Discord Indonesia] Client ready wait timeout");
    return false;
  }
  async function waitForVoiceConnected(guildId, channelId, timeoutMs = 45e3) {
    const start = Date.now();
    console.log("[Discord Indonesia] Connecting to voice channel...");
    console.log(`[Discord Indonesia] Joining voice channel ${channelId}...`);
    selectVoiceChannel(guildId, channelId);
    let retried = false;
    while (Date.now() - start < timeoutMs) {
      if (isVoiceActive(channelId)) {
        console.log(`[Discord Indonesia] Voice connected: ${channelId}`);
        console.log("[Discord Indonesia] Stabilizing voice session before streaming (3.5s)...");
        await sleep(3500);
        return true;
      }
      if (!retried && Date.now() - start > 8e3) {
        retried = true;
        console.log(`[Discord Indonesia] Retrying join voice channel ${channelId}...`);
        selectVoiceChannel(guildId, channelId);
      }
      await sleep(500);
    }
    console.warn("[Discord Indonesia] Voice connection wait timeout");
    return false;
  }

  // src/discord/voiceChannels.ts
  var defaultChannelNames = {
    "1532531180229103626": "\u{1F41D}\u30FBBadge Farming I",
    "1562379518864269382": "\u{1F41D}\u30FBBadge Farming II",
    "1562514091589898250": "\u{1F41D}\u30FBBadge Farming III"
  };
  function getVoiceChannelName(channelId) {
    if (defaultChannelNames[channelId]) {
      return defaultChannelNames[channelId];
    }
    const channelStore = getChannelStore();
    const channel = channelStore?.getChannel(channelId);
    if (channel?.name) {
      return channel.name.split("/")[0].split("|")[0].trim();
    }
    const channelAnchor = document.querySelector(`a[href*="${channelId}"]`);
    if (channelAnchor) {
      const nameEl = channelAnchor.querySelector('[class*="name_"], [class*="channelName"]');
      if (nameEl && nameEl.textContent) {
        return nameEl.textContent.split("/")[0].split("|")[0].trim();
      }
    }
    return `Voice Channel (${channelId.slice(-4)})`;
  }
  function isVoiceChannelFull(channelId, currentCount) {
    const channelStore = getChannelStore();
    const channel = channelStore?.getChannel(channelId);
    const limit = channel?.userLimit ?? channel?.user_limit ?? 0;
    if (limit > 0 && currentCount >= limit) {
      return true;
    }
    return false;
  }
  function getVoiceChannelUserCount(channelId) {
    const voiceStateStore = getVoiceStateStore();
    if (voiceStateStore) {
      try {
        if (typeof voiceStateStore.countVoiceStatesForChannel === "function") {
          const count = voiceStateStore.countVoiceStatesForChannel(channelId);
          if (typeof count === "number") return count;
        }
        const states = voiceStateStore.getVoiceStatesForChannel(channelId);
        if (states && typeof states === "object") {
          return Object.keys(states).length;
        }
      } catch {
      }
    }
    try {
      const channelAnchor = document.querySelector(`a[href*="${channelId}"]`);
      if (channelAnchor) {
        const channelItem = channelAnchor.closest('[class*="wrapper__"], [class*="containerDefault"]') || channelAnchor.parentElement;
        const userList = channelItem?.parentElement?.querySelectorAll(
          '[class*="voiceUser__"], [class*="userAvatar__"], [class*="avatarContainer__"]'
        );
        if (userList && userList.length > 0) {
          return userList.length;
        }
      }
    } catch {
    }
    return 0;
  }
  function rankChannelsByLowestUserCount(channelIds) {
    const ranked = channelIds.map((channelId) => {
      const userCount = getVoiceChannelUserCount(channelId);
      return {
        channelId,
        name: getVoiceChannelName(channelId),
        userCount,
        isFull: isVoiceChannelFull(channelId, userCount)
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
    const summary = ranked.map((r) => `${r.name} (${r.userCount} users)`).join(", ");
    console.log(`[Discord Indonesia] Channel candidate ranking: ${summary}`);
    for (const candidate of ranked) {
      if (candidate.isFull) {
        console.warn(`[Discord Indonesia] Channel ${candidate.name} is full (${candidate.userCount} users), skipping...`);
        continue;
      }
      console.log(
        `[Discord Indonesia] Attempting connection to optimal channel ${candidate.name} (${candidate.userCount} users)...`
      );
      const connected = await waitForVoiceConnected(guildId, candidate.channelId, 12e3);
      if (connected) {
        console.log(`[Discord Indonesia] Successfully joined optimal voice channel: ${candidate.name}`);
        return candidate.channelId;
      }
      console.warn(`[Discord Indonesia] Unable to join channel ${candidate.name}, failing over to next...`);
      leaveVoiceChannel();
      await new Promise((r) => setTimeout(r, 1e3));
    }
    console.error("[Discord Indonesia] All candidate voice channels failed to connect");
    return null;
  }

  // src/discord/streams.ts
  function isStreamActive() {
    const streamStore = getApplicationStreamStore();
    if (streamStore) {
      try {
        if (typeof streamStore.isSelfStreaming === "function") {
          const isSelf = streamStore.isSelfStreaming();
          if (typeof isSelf === "boolean") return isSelf;
        }
        if (typeof streamStore.getCurrentUserActiveStream === "function") {
          const activeStream = streamStore.getCurrentUserActiveStream();
          if (activeStream) return true;
        }
      } catch {
      }
    }
    const allButtons = Array.from(document.querySelectorAll("button"));
    const hasStopButton = allButtons.some((btn) => {
      const label = (btn.getAttribute("aria-label") || "").toLowerCase();
      const title = (btn.getAttribute("title") || "").toLowerCase();
      const text = (btn.textContent || "").toLowerCase();
      return label.includes("stop streaming") || title.includes("stop streaming") || text.includes("stop streaming") || label.includes("berhenti streaming");
    });
    return hasStopButton;
  }
  function dismissDownloadModal() {
    const modal = document.querySelector('div[role="dialog"]');
    if (modal) {
      const text = (modal.textContent || "").toLowerCase();
      if (text.includes("download the discord desktop") || text.includes("get the app") || text.includes("unduh")) {
        console.log("[Discord Indonesia] Dismissing download app modal on mobile browser...");
        const closeBtn = modal.querySelector('button[aria-label="Close" i]') || modal.querySelector("button");
        closeBtn?.click();
        return true;
      }
    }
    return false;
  }
  function clickShareScreenButton() {
    if (isStreamActive()) {
      return true;
    }
    dismissDownloadModal();
    const allButtons = Array.from(document.querySelectorAll("button"));
    const shareButton = allButtons.find((btn) => {
      const label = (btn.getAttribute("aria-label") || "").toLowerCase().trim();
      const title = (btn.getAttribute("title") || "").toLowerCase().trim();
      const text = (btn.textContent || "").toLowerCase().trim();
      if (label.includes("stop") || title.includes("stop") || text.includes("stop")) return false;
      return label === "share your screen" || label === "share screen" || title === "share your screen" || title === "share screen" || label.includes("share") && label.includes("screen") || title.includes("share") && title.includes("screen") || text.includes("share") && text.includes("screen");
    });
    if (shareButton) {
      console.log("[Discord Indonesia] Clicking Share Your Screen button");
      shareButton.click();
      const tryConfirmModal = (attemptsLeft) => {
        if (dismissDownloadModal()) return;
        const modal = document.querySelector('div[role="dialog"]') || document.querySelector('[class*="modal"]');
        if (modal) {
          const confirmButton = modal.querySelector('button[type="submit"]') || Array.from(modal.querySelectorAll("button")).find(
            (b) => /go live|stream/i.test(b.textContent || "")
          );
          if (confirmButton) {
            console.log("[Discord Indonesia] Confirming Go Live dialog button");
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
  async function triggerGoLiveStream(guildId, channelId, maxWaitMs = 35e3) {
    const resolvedGuildId = guildId || defaultGuildId;
    const start = Date.now();
    console.log("[Discord Indonesia] Waiting for Share Your Screen button to be available...");
    let lastNavTime = 0;
    while (Date.now() - start < maxWaitMs) {
      if (isStreamActive()) {
        console.log("[Discord Indonesia] Screenshare verified active");
        return true;
      }
      dismissDownloadModal();
      if (!window.location.pathname.includes(channelId) && Date.now() - lastNavTime >= 2e3) {
        lastNavTime = Date.now();
        navigateToVoiceChannel(resolvedGuildId, channelId);
      }
      const clicked = clickShareScreenButton();
      if (clicked) {
        for (let i = 0; i < 20; i++) {
          await new Promise((r) => setTimeout(r, 500));
          if (isStreamActive()) {
            console.log("[Discord Indonesia] Screenshare verified active");
            return true;
          }
        }
      }
      await new Promise((r) => setTimeout(r, 600));
    }
    console.warn("[Discord Indonesia] Share Your Screen button wait timeout");
    return false;
  }
  function stopGoLiveStream(guildId, channelId) {
    const allButtons = Array.from(document.querySelectorAll("button"));
    const stopButton = allButtons.find((btn) => {
      const label = (btn.getAttribute("aria-label") || "").toLowerCase().trim();
      const title = (btn.getAttribute("title") || "").toLowerCase().trim();
      const text = (btn.textContent || "").toLowerCase().trim();
      return label.includes("stop streaming") || title.includes("stop streaming") || text.includes("stop streaming");
    });
    if (stopButton) {
      console.log("[Discord Indonesia] Clicking Stop Streaming button");
      stopButton.click();
      return;
    }
    const userStore = getUserStore();
    const authStore = getAuthenticationStore();
    const userId = userStore?.getCurrentUser()?.id || authStore?.getId() || "";
    const resolvedGuildId = guildId || defaultGuildId;
    const streamKey = `guild:${resolvedGuildId}:${channelId}:${userId}`;
    safeDispatch(fluxActions.streamStop, {
      streamKey
    });
  }

  // src/discord/userAccess.ts
  var cachedState = {
    isMember: false,
    voiceFound: false,
    canStream: false,
    statusText: "Checking user access..."
  };
  var lastCheckTime = 0;
  function getCachedAccess() {
    return cachedState;
  }
  async function checkDiscordIdAccess(targetGuildId = defaultGuildId, candidateChannelIds = defaultChannelIds, forceRefresh = false) {
    const now = Date.now();
    if (!forceRefresh && lastCheckTime > 0 && now - lastCheckTime < 1e4) {
      return cachedState;
    }
    lastCheckTime = now;
    let isMember = false;
    const guildStore = getGuildStore();
    if (guildStore) {
      try {
        if (guildStore.getGuild(targetGuildId)) {
          isMember = true;
        } else {
          const guilds = guildStore.getGuilds();
          if (guilds && typeof guilds === "object" && targetGuildId in guilds) {
            isMember = true;
          }
        }
      } catch {
      }
    }
    if (!isMember) {
      const domIcon = document.querySelector(`nav a[href*="${targetGuildId}"]`);
      if (domIcon) {
        isMember = true;
      }
    }
    if (!isMember) {
      const rest = getRestClient();
      if (rest) {
        try {
          const res = await rest.get({
            url: `/users/@me/guilds/${targetGuildId}/member`
          });
          if (res && (res.status === 200 || res.ok || res.body?.joined_at || res.body?.user)) {
            isMember = true;
          }
        } catch (err) {
          const status = err?.status;
          if (status === 404) {
            isMember = false;
          }
        }
      }
    }
    let voiceFound = false;
    const channelStore = getChannelStore();
    if (isMember) {
      for (const channelId of candidateChannelIds) {
        if (channelStore?.getChannel(channelId)) {
          voiceFound = true;
          break;
        }
        if (document.querySelector(`a[href*="${channelId}"]`)) {
          voiceFound = true;
          break;
        }
      }
      if (!voiceFound && isMember) {
        voiceFound = true;
      }
    }
    const canStream = isMember && voiceFound;
    let statusText = "User Verified";
    if (!isMember) {
      statusText = "Join Discord ID First";
    } else if (!voiceFound) {
      statusText = "Voice Channels Not Found";
    }
    cachedState = {
      isMember,
      voiceFound,
      canStream,
      statusText
    };
    return cachedState;
  }

  // src/media/video.ts
  function createOffscreenVideo(targetUrl) {
    let video = document.getElementById("virtualScreenPlayer");
    if (!video) {
      video = document.createElement("video");
      video.id = "virtualScreenPlayer";
      video.crossOrigin = "anonymous";
      video.playsInline = true;
      video.preload = "auto";
      video.loop = true;
      video.muted = true;
      video.style.position = "fixed";
      video.style.top = "-9999px";
      video.style.left = "-9999px";
      video.style.width = "1px";
      video.style.height = "1px";
      video.style.opacity = "0";
      video.style.pointerEvents = "none";
      const mount = () => {
        const container = document.body || document.documentElement;
        if (container && !container.contains(video)) {
          container.appendChild(video);
        }
      };
      if (document.body || document.documentElement) {
        mount();
      } else {
        window.addEventListener("DOMContentLoaded", mount, { once: true });
      }
    }
    const resolvedUrl = targetUrl || document.documentElement.dataset.discordVideoUrl || video.src;
    if (!resolvedUrl) {
      console.error("[Discord Indonesia] Video asset URL missing; check bridge.js or extension assets");
      return video;
    }
    if (video.src !== resolvedUrl) {
      video.src = resolvedUrl;
      video.load();
    }
    video.onended = () => {
      video.currentTime = 0;
      video.play().catch(() => {
      });
    };
    video.onstalled = () => {
      if (video && video.paused) {
        video.play().catch(() => {
        });
      }
    };
    let retryCount = 0;
    video.onerror = () => {
      if (retryCount >= 3) {
        console.error("[Discord Indonesia] Video load failed after 3 attempts. Stopping retry.");
        return;
      }
      retryCount++;
      console.warn(`[Discord Indonesia] Video load error, retry ${retryCount}/3...`);
      setTimeout(() => {
        if (video) {
          video.load();
          video.play().catch(() => {
          });
        }
      }, 1500);
    };
    video.play().catch((err) => {
      console.warn("[Discord Indonesia] Initial play deferred until interaction:", err.message);
    });
    return video;
  }

  // src/constants/media.ts
  var mediaSettings = {
    width: 854,
    height: 480,
    fps: 60,
    audioSampleRate: 48e3
  };

  // src/media/audiomux.ts
  function createMuxedStream(videoElement) {
    const captureMethod = videoElement.captureStream || videoElement.mozCaptureStream;
    if (!captureMethod) {
      throw new Error("[Discord Indonesia] captureStream unsupported");
    }
    const rawStream = captureMethod.call(videoElement, mediaSettings.fps);
    const videoTrack = rawStream.getVideoTracks()[0];
    const muxedStream = new MediaStream();
    if (videoTrack) {
      const origApply = typeof videoTrack.applyConstraints === "function" ? videoTrack.applyConstraints.bind(videoTrack) : null;
      videoTrack.applyConstraints = async function(constraints) {
        try {
          if (origApply) {
            await origApply(constraints);
          }
        } catch {
        }
        return Promise.resolve();
      };
      muxedStream.addTrack(videoTrack);
    }
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      const audioContext = new AudioContextClass({ sampleRate: mediaSettings.audioSampleRate });
      const sourceNode = audioContext.createMediaElementSource(videoElement);
      const streamDestination = audioContext.createMediaStreamDestination();
      sourceNode.connect(streamDestination);
      const audioTrack = streamDestination.stream.getAudioTracks()[0];
      if (audioTrack) {
        muxedStream.addTrack(audioTrack);
      }
    } catch (err) {
      console.warn("[Discord Indonesia] WebAudio routing failed, using native audio track:", err);
      const directAudioTrack = rawStream.getAudioTracks()[0];
      if (directAudioTrack) {
        muxedStream.addTrack(directAudioTrack);
      }
    }
    return muxedStream;
  }

  // src/media/hook.ts
  var originalGetDisplayMedia = null;
  var activeStreamProvider = null;
  function installDisplayMediaHook(streamProvider) {
    activeStreamProvider = streamProvider;
    if (typeof navigator.mediaDevices === "undefined") {
      try {
        navigator.mediaDevices = {};
      } catch {
      }
    }
    if (!navigator.mediaDevices) {
      console.error("[Discord Indonesia] navigator.mediaDevices unavailable");
      return;
    }
    if (typeof navigator.mediaDevices.getDisplayMedia === "function") {
      originalGetDisplayMedia = navigator.mediaDevices.getDisplayMedia.bind(navigator.mediaDevices);
    }
    const hookFunction = async function(constraints) {
      if (activeStreamProvider) {
        console.log("[Discord Indonesia] getDisplayMedia intercepted: injecting virtual stream (480p 60fps)");
        try {
          const stream = await activeStreamProvider();
          return stream;
        } catch (err) {
          console.error("[Discord Indonesia] Virtual stream error, falling back to native:", err);
        }
      }
      if (originalGetDisplayMedia) {
        return originalGetDisplayMedia(constraints);
      }
      throw new Error("No native getDisplayMedia implementation");
    };
    try {
      Object.defineProperty(navigator.mediaDevices, "getDisplayMedia", {
        value: hookFunction,
        writable: true,
        configurable: true
      });
    } catch {
      navigator.mediaDevices.getDisplayMedia = hookFunction;
    }
    console.log("[Discord Indonesia] Universal display media polyfill active");
  }

  // src/automation/runner.ts
  var sleep2 = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  var cycleActive = false;
  var currentPhase = "idle";
  var sessionStreamStartTime = null;
  var sessionCooldownStartTime = null;
  var currentStreamDurationMs = 10 * 3600 * 1e3;
  var currentCooldownDurationMs = 5 * 60 * 1e3;
  var currentConfiguredHours = 10;
  var currentConfiguredCooldownMinutes = 5;
  function syncRunnerConfig() {
    const cfg = loadConfig();
    currentConfiguredHours = cfg.streamDurationHours || 10;
    currentConfiguredCooldownMinutes = cfg.cooldownMinutes || 5;
    currentStreamDurationMs = currentConfiguredHours * 3600 * 1e3;
    currentCooldownDurationMs = currentConfiguredCooldownMinutes * 60 * 1e3;
  }
  function getStreamSessionStats() {
    syncRunnerConfig();
    return {
      phase: currentPhase,
      streamStartTime: sessionStreamStartTime,
      streamDurationMs: currentStreamDurationMs,
      cooldownStartTime: sessionCooldownStartTime,
      cooldownDurationMs: currentCooldownDurationMs,
      configuredHours: currentConfiguredHours,
      configuredCooldownMinutes: currentConfiguredCooldownMinutes
    };
  }
  function stopStreamCycle() {
    cycleActive = false;
    currentPhase = "idle";
    sessionStreamStartTime = null;
    sessionCooldownStartTime = null;
    console.log("[Discord Indonesia] Stream cycle stopped by user");
  }
  function isStreamCycleActive() {
    return cycleActive;
  }
  async function runAutomation(config) {
    console.log("[Discord Indonesia] Starting auto screenshare...");
    syncRunnerConfig();
    let muxedStream = null;
    const videoElement = createOffscreenVideo(config.videoUrl);
    const getOrInitStream = () => {
      if (!muxedStream || !muxedStream.active) {
        videoElement.play().catch(() => {
        });
        muxedStream = createMuxedStream(videoElement);
      }
      return muxedStream;
    };
    installDisplayMediaHook(getOrInitStream);
    const isReady = await waitForClientReady();
    if (!isReady) {
      console.error("[Discord Indonesia] Aborted: client not ready");
      currentPhase = "idle";
      return;
    }
    const liveConfig = loadConfig();
    const candidates = liveConfig.targetChannelIds && liveConfig.targetChannelIds.length > 0 ? liveConfig.targetChannelIds : [liveConfig.channelId];
    let access = await checkDiscordIdAccess(liveConfig.guildId || void 0, candidates);
    if (!access.canStream) {
      console.warn(`[Discord Indonesia] Gated: ${access.statusText}. Join Discord ID to activate streaming.`);
      while (!access.canStream) {
        await sleep2(4e3);
        access = await checkDiscordIdAccess(loadConfig().guildId || void 0, candidates, true);
      }
      console.log("[Discord Indonesia] Discord ID access confirmed! Unlocking streaming features...");
    }
    let activeChannelId = candidates[0];
    if (loadConfig().autoJoin) {
      const joined = await connectToOptimalVoiceChannel(loadConfig().guildId, candidates);
      if (!joined) {
        console.error("[Discord Indonesia] Failed to connect to any candidate voice channel");
        currentPhase = "idle";
        return;
      }
      activeChannelId = joined;
    }
    if (!loadConfig().autoStream) {
      console.log("[Discord Indonesia] autoStream disabled; ready for manual Go Live");
      currentPhase = "idle";
      return;
    }
    cycleActive = true;
    while (cycleActive) {
      syncRunnerConfig();
      if (!isVoiceActive(activeChannelId)) {
        const reconnected = await connectToOptimalVoiceChannel(loadConfig().guildId, candidates);
        if (!reconnected) {
          console.error("[Discord Indonesia] Voice reconnection failed");
          await sleep2(5e3);
          continue;
        }
        activeChannelId = reconnected;
      }
      console.log(
        `[Discord Indonesia] Starting Go Live screenshare on ${activeChannelId} (${currentConfiguredHours}h session)...`
      );
      videoElement.play().catch(() => {
      });
      await triggerGoLiveStream(loadConfig().guildId, activeChannelId);
      currentPhase = "streaming";
      sessionStreamStartTime = Date.now();
      sessionCooldownStartTime = null;
      while (cycleActive) {
        syncRunnerConfig();
        if (sessionStreamStartTime && Date.now() - sessionStreamStartTime >= currentStreamDurationMs) {
          break;
        }
        await sleep2(1e3);
      }
      if (!cycleActive) break;
      console.log(`[Discord Indonesia] ${currentConfiguredHours}h limit reached. Stopping screenshare...`);
      stopGoLiveStream(loadConfig().guildId, activeChannelId);
      currentPhase = "cooldown";
      sessionStreamStartTime = null;
      sessionCooldownStartTime = Date.now();
      console.log(`[Discord Indonesia] Cooling down for ${currentConfiguredCooldownMinutes} minutes...`);
      while (cycleActive) {
        syncRunnerConfig();
        if (sessionCooldownStartTime && Date.now() - sessionCooldownStartTime >= currentCooldownDurationMs) {
          break;
        }
        await sleep2(1e3);
      }
      if (!cycleActive) break;
      console.log("[Discord Indonesia] Cooldown finished. Re-evaluating optimal channel for next session...");
      const nextOptimal = await connectToOptimalVoiceChannel(loadConfig().guildId, candidates);
      if (nextOptimal) {
        activeChannelId = nextOptimal;
      }
    }
    currentPhase = "idle";
  }

  // src/ui/styles.ts
  var uiStyles = `
:host {
  color: #f2f3f5;
  font-size: 14px;
  line-height: 1.5;
}

*,
*::before,
*::after,
button,
input,
select,
textarea,
span,
div,
p,
h1,
h2,
h3,
h4,
a {
  box-sizing: border-box;
  font-family: "gg sans", "Plus Jakarta Sans", "Inter", "Noto Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif !important;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* Custom Sleek Dark Scrollbar */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.16);
  border-radius: 9999px;
  transition: background-color 0.2s ease;
}

::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.32);
}

/* Minimalist Floating Trigger Widget (46x46 Squircle on Right Edge) */
.discord-id-trigger {
  position: fixed;
  right: 16px;
  top: 50%;
  transform: translateY(-50%);
  z-index: 2147483640;
  width: 46px;
  height: 46px;
  background-color: #1e1f22;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5), 0 0 12px rgba(138, 30, 37, 0.25);
  transition: transform 0.18s cubic-bezier(0.16, 1, 0.3, 1), background-color 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease;
  user-select: none;
}

.discord-id-trigger:hover {
  background-color: #2b2d31;
  border-color: #8a1e25;
  transform: translateY(-50%) scale(1.08);
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.6), 0 0 16px rgba(138, 30, 37, 0.4);
}

.discord-id-trigger .trigger-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
}

.discord-id-trigger .status-dot {
  position: absolute;
  top: -3px;
  right: -3px;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background-color: #23a55a;
  border: 2px solid #1e1f22;
  box-shadow: 0 0 6px #23a55a;
}

.discord-id-trigger.idle .status-dot {
  background-color: #f23f43;
  box-shadow: 0 0 6px #f23f43;
}

.discord-id-trigger.cooldown .status-dot {
  background-color: #f0b232;
  box-shadow: 0 0 6px #f0b232;
}

.discord-id-trigger.gated .status-dot {
  background-color: #eab308;
  box-shadow: 0 0 6px #eab308;
}

/* Modal Overlay (Dark Backdrop) */
.discord-id-overlay {
  position: fixed;
  inset: 0;
  background-color: rgba(11, 12, 14, 0.82);
  backdrop-filter: blur(4px);
  z-index: 2147483645;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.18s ease;
}

.discord-id-overlay.open {
  opacity: 1;
  pointer-events: auto;
}

/* Wide Desktop Modal Window (860px x 560px Roblox Executor / Discord Native Style) */
.discord-id-modal {
  position: relative;
  width: 860px;
  height: 560px;
  max-width: calc(100vw - 32px);
  max-height: calc(100vh - 32px);
  background-color: #313338;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.7);
  display: flex;
  overflow: hidden;
  color: #f2f3f5;
  transform: scale(0.97) translateY(8px);
  transition: transform 0.18s cubic-bezier(0.16, 1, 0.3, 1);
}

.discord-id-overlay.open .discord-id-modal {
  transform: scale(1) translateY(0);
}

/* Close Button (Top Right) */
.modal-close-btn {
  position: absolute;
  top: 14px;
  right: 14px;
  width: 34px;
  height: 34px;
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 50%;
  color: #b5bac1;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.15s ease, color 0.15s ease, border-color 0.15s ease;
  z-index: 20;
}

.modal-close-btn:hover {
  background-color: rgba(255, 255, 255, 0.1);
  color: #ffffff;
  border-color: #ffffff;
}

/* Sidebar Left Panel (Width: 230px) */
.modal-sidebar {
  width: 230px;
  background-color: #2b2d31;
  padding: 22px 14px 18px 18px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  border-right: 1px solid rgba(255, 255, 255, 0.06);
  flex-shrink: 0;
}

.sidebar-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding-bottom: 16px;
  margin-bottom: 16px;
}

.sidebar-logo {
  width: 36px;
  height: 36px;
  background-color: #8a1e25;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(138, 30, 37, 0.4);
}

.sidebar-logo-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 10px;
  display: block;
  user-select: none;
}

.sidebar-title-group {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.sidebar-title-main {
  font-size: 15px;
  font-weight: 800;
  color: #ffffff;
  letter-spacing: -0.01em;
}

.sidebar-title-sub {
  font-size: 11px;
  font-weight: 600;
  color: #949ba4;
  letter-spacing: 0.02em;
}

/* Nav Tabs */
.sidebar-nav {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 12px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 600;
  color: #949ba4;
  cursor: pointer;
  transition: background-color 0.15s ease, color 0.15s ease;
  user-select: none;
}

.nav-item:hover {
  background-color: rgba(255, 255, 255, 0.04);
  color: #dbdee1;
}

.nav-item.active {
  background-color: #8a1e25;
  color: #ffffff;
}

.nav-item.active .nav-icon {
  color: #ffffff;
}

.nav-icon {
  display: flex;
  align-items: center;
  color: #949ba4;
}

/* Sidebar Footer: Join Discord ID Link Button */
.sidebar-footer {
  margin-top: auto;
  padding-top: 14px;
  border-top: 1px solid rgba(255, 255, 255, 0.07);
}

.join-discord-card {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  background-color: #1e1f22;
  border: 1px solid rgba(138, 30, 37, 0.3);
  border-radius: 8px;
  text-decoration: none;
  cursor: pointer;
  transition: background-color 0.15s ease, border-color 0.15s ease, transform 0.1s ease;
}

.join-discord-card:hover {
  background-color: rgba(138, 30, 37, 0.18);
  border-color: #8a1e25;
  transform: translateY(-1px);
}

.join-discord-icon {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  background-color: #8a1e25;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.join-discord-text {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.join-discord-title {
  font-size: 12px;
  font-weight: 700;
  color: #ffffff;
}

.join-discord-url {
  font-size: 11px;
  color: #949ba4;
}

/* Main Content Area (Right Panel) */
.modal-content-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background-color: #313338;
}

.tab-page {
  display: none;
  flex: 1;
  padding: 24px 28px;
  overflow-y: auto;
}

.tab-page.active {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.page-title {
  font-size: 18px;
  font-weight: 800;
  color: #ffffff;
  margin: 0 0 2px 0;
  letter-spacing: -0.01em;
}

.page-subtitle {
  font-size: 13px;
  color: #949ba4;
  margin: 0 0 10px 0;
}

/* Cards (Executor Surface Style) */
.content-card {
  background-color: #2b2d31;
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 10px;
  padding: 16px 18px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.status-row {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.status-mini-box {
  background-color: #1e1f22;
  border: 1px solid rgba(255, 255, 255, 0.04);
  border-radius: 8px;
  padding: 12px 14px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.status-mini-box.highlight {
  border-color: rgba(138, 30, 37, 0.4);
}

.mini-icon {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background-color: rgba(255, 255, 255, 0.05);
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.status-mini-box.highlight .mini-icon {
  background-color: #8a1e25;
}

.mini-details {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.mini-label {
  font-size: 11px;
  font-weight: 700;
  color: #949ba4;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.mini-value {
  font-size: 13px;
  font-weight: 800;
  color: #ffffff;
}

/* Stats 3-Column Grid */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}

.stats-card {
  background-color: #1e1f22;
  border: 1px solid rgba(255, 255, 255, 0.04);
  border-radius: 8px;
  padding: 10px 12px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.stats-icon {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  background-color: rgba(255, 255, 255, 0.05);
  color: #dbdee1;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.stats-details {
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
}

.stats-label {
  font-size: 10px;
  font-weight: 700;
  color: #949ba4;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  white-space: nowrap;
}

.stats-value {
  font-family: Consolas, monospace !important;
  font-size: 13px;
  font-weight: 800;
  color: #ffffff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Channel Balancer List */
.channel-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: #1e1f22;
  border: 1px solid rgba(255, 255, 255, 0.04);
  border-radius: 8px;
  padding: 11px 14px;
  transition: border-color 0.15s ease;
}

.channel-item.active {
  border-color: #8a1e25;
  background-color: rgba(138, 30, 37, 0.1);
}

.channel-item-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.channel-name-text {
  font-size: 13px;
  font-weight: 700;
  color: #ffffff;
}

.channel-item.active .channel-name-text {
  color: #ff858d;
}

.channel-count-text {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  color: #949ba4;
  margin-left: 8px;
}

.channel-item-right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.channel-live-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.channel-live-dot.dot-green {
  background-color: #23a55a;
  box-shadow: 0 0 6px #23a55a;
}

.channel-live-dot.dot-red {
  background-color: #f23f43;
  box-shadow: 0 0 6px #f23f43;
}

.channel-join-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 5px 12px;
  font-size: 11px;
  font-weight: 700;
  border-radius: 6px;
  border: 1px solid transparent;
  cursor: pointer;
  transition: all 0.15s ease;
  user-select: none;
  background-color: #8a1e25;
  color: #ffffff;
}

.channel-join-btn:hover:not(:disabled):not(.active) {
  background-color: #71171d;
  box-shadow: 0 2px 8px rgba(138, 30, 37, 0.4);
}

.channel-join-btn.active {
  background-color: rgba(35, 165, 90, 0.18);
  color: #57f287;
  border-color: rgba(35, 165, 90, 0.35);
  cursor: default;
  pointer-events: none;
}

.channel-join-btn:disabled,
.channel-join-btn.disabled {
  background-color: rgba(255, 255, 255, 0.05);
  color: #80848e;
  border-color: transparent;
  cursor: not-allowed;
  pointer-events: none;
}

/* Action Buttons Bar */
.action-buttons-row {
  display: flex;
  gap: 12px;
  margin-top: 4px;
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 700;
  padding: 10px 18px;
  border-radius: 8px;
  border: 1px solid transparent;
  cursor: pointer;
  transition: all 0.15s ease;
  user-select: none;
}

.btn-primary-red {
  background-color: #8a1e25;
  color: #ffffff;
}

.btn-primary-red:hover {
  background-color: #71171d;
  box-shadow: 0 4px 12px rgba(138, 30, 37, 0.4);
}

.btn:disabled, .btn.disabled {
  opacity: 0.4 !important;
  cursor: not-allowed !important;
  pointer-events: none !important;
  filter: grayscale(0.6);
}

/* Settings Switch Rows */
.setting-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 0;
}

.setting-texts {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.setting-title {
  font-size: 13px;
  font-weight: 700;
  color: #ffffff;
}

.setting-desc {
  font-size: 12px;
  color: #949ba4;
}

.setting-select-menu {
  background-color: #1e1f22;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  color: #ffffff;
  font-size: 13px;
  font-weight: 700;
  padding: 7px 12px;
  outline: none;
  cursor: pointer;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

.setting-select-menu:focus {
  border-color: #8a1e25;
  box-shadow: 0 0 0 2px rgba(138, 30, 37, 0.25);
}

.setting-select-menu option {
  background-color: #1e1f22;
  color: #ffffff;
  padding: 6px;
}

.setting-select-menu:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

/* Discord Native Toggle Switch */
.switch {
  position: relative;
  display: inline-block;
  width: 40px;
  height: 22px;
}

.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  cursor: pointer;
  inset: 0;
  background-color: #80848e;
  border-radius: 9999px;
  transition: background-color 0.2s ease;
}

.slider::before {
  position: absolute;
  content: "";
  height: 16px;
  width: 16px;
  left: 3px;
  bottom: 3px;
  background-color: #ffffff;
  border-radius: 50%;
  transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}

.switch input:checked + .slider {
  background-color: #8a1e25;
}

.switch input:checked + .slider::before {
  transform: translateX(18px);
}

.switch.disabled {
  opacity: 0.45;
  pointer-events: none;
}

/* Discord Native Checker / Consent Modal (440px Alert Style) */
.discord-checker-overlay {
  position: fixed;
  inset: 0;
  background-color: rgba(11, 12, 14, 0.85);
  backdrop-filter: blur(4px);
  z-index: 2147483647;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.16s ease;
}

.discord-checker-overlay.open {
  opacity: 1;
  pointer-events: auto;
}

.discord-checker-dialog {
  position: relative;
  width: 440px;
  max-width: calc(100vw - 32px);
  background-color: #1e1f22;
  border-radius: 16px;
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.75);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  color: #f2f3f5;
  border: 1px solid rgba(255, 255, 255, 0.08);
  transform: scale(0.96) translateY(6px);
  transition: transform 0.18s cubic-bezier(0.16, 1, 0.3, 1);
}

.discord-checker-overlay.open .discord-checker-dialog {
  transform: scale(1) translateY(0);
}

.discord-checker-close-btn {
  position: absolute;
  top: 14px;
  right: 14px;
  width: 32px;
  height: 32px;
  background: transparent;
  border: none;
  border-radius: 50%;
  color: #dbdee1;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
  transition: background-color 0.15s ease, color 0.15s ease;
}

.discord-checker-close-btn:hover {
  background-color: rgba(255, 255, 255, 0.1);
  color: #ffffff;
}

.discord-checker-header {
  position: relative;
  background: linear-gradient(180deg, #4a1216 0%, #2c0e11 55%, #1e1f22 100%);
  padding: 32px 24px 14px 24px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.discord-checker-badge-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 14px;
}

.discord-checker-badge-img {
  width: 108px;
  height: 108px;
  object-fit: contain;
  user-select: none;
  pointer-events: none;
  border-radius: 16px;
  filter: drop-shadow(0 6px 18px rgba(0, 0, 0, 0.55));
}

.discord-checker-title {
  font-size: 21px;
  font-weight: 800;
  color: #ffffff;
  margin: 0 0 4px 0;
  line-height: 1.25;
  text-align: center;
  letter-spacing: -0.02em;
}

.discord-checker-subtitle {
  font-size: 13px;
  font-weight: 600;
  color: #949ba4;
  margin: 0;
  text-align: center;
}

.discord-checker-content {
  padding: 18px 24px 20px 24px;
  font-size: 14px;
  line-height: 1.5;
  color: #dbdee1;
  text-align: center;
}

.discord-checker-content p {
  margin: 0 0 8px 0;
}

.discord-checker-hint {
  margin-top: 10px;
  font-size: 12px;
  color: #949ba4;
  line-height: 1.4;
}

.discord-checker-footer {
  background-color: #1e1f22;
  padding: 0 24px 24px 24px;
  display: flex;
  gap: 12px;
  align-items: center;
}

.btn-checker-secondary {
  flex: 1;
  height: 42px;
  background-color: #2b2d31;
  color: #ffffff;
  border: 1px solid rgba(255, 255, 255, 0.08);
  font-size: 14px;
  font-weight: 700;
  border-radius: 8px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: background-color 0.15s ease;
}

.btn-checker-secondary:hover {
  background-color: #35373c;
}

.btn-checker-primary {
  flex: 1.3;
  height: 42px;
  background-color: #8a1e25;
  color: #ffffff;
  border: none;
  font-size: 14px;
  font-weight: 700;
  border-radius: 8px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  text-decoration: none;
  transition: background-color 0.15s ease, box-shadow 0.15s ease;
  box-shadow: 0 2px 6px rgba(138, 30, 37, 0.4);
}

.btn-checker-primary:hover {
  background-color: #71171d;
  box-shadow: 0 4px 12px rgba(138, 30, 37, 0.5);
}
`;

  // src/ui/icons.ts
  function createSvg(inner, size = 18, color = "currentColor", viewBox = "0 0 24 24") {
    return `<svg width="${size}" height="${size}" viewBox="${viewBox}" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block;vertical-align:middle;flex-shrink:0;">${inner}</svg>`;
  }
  var icons = {
    discord: (size = 20, color = "#FFFFFF") => `<svg width="${size}" height="${size}" viewBox="0 0 127.14 96.36" fill="${color}" style="display:inline-block;vertical-align:middle;flex-shrink:0;"><path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.25,105.25,0,0,0,126.6,80.22h0C129.24,52.84,122.09,29.11,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.86,53,48.81,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.25,60,73.25,53s5-12.74,11.44-12.74S96.23,46,96.12,53,91.08,65.69,84.69,65.69Z"/></svg>`,
    dashboard: (size = 18, color = "currentColor") => createSvg(
      `<rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect>`,
      size,
      color
    ),
    gear: (size = 18, color = "currentColor") => createSvg(
      `<circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>`,
      size,
      color
    ),
    headphones: (size = 18, color = "currentColor") => createSvg(
      `<path d="M3 18v-6a9 9 0 0 1 18 0v6"></path><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"></path>`,
      size,
      color
    ),
    desktop: (size = 18, color = "currentColor") => createSvg(
      `<rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line>`,
      size,
      color
    ),
    users: (size = 16, color = "currentColor") => createSvg(
      `<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path>`,
      size,
      color
    ),
    clock: (size = 16, color = "currentColor") => createSvg(
      `<circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline>`,
      size,
      color
    ),
    broadcast: (size = 18, color = "currentColor") => createSvg(
      `<path d="M4.9 19.1C1 15.2 1 8.8 4.9 4.9"></path><path d="M7.8 16.2c-2.3-2.3-2.3-6.1 0-8.5"></path><circle cx="12" cy="12" r="2"></circle><path d="M16.2 7.8c2.3 2.3 2.3 6.1 0 8.5"></path><path d="M19.1 4.9C23 8.8 23 15.1 19.1 19"></path>`,
      size,
      color
    ),
    externalLink: (size = 14, color = "currentColor") => createSvg(
      `<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line>`,
      size,
      color
    ),
    refresh: (size = 16, color = "currentColor") => createSvg(
      `<polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>`,
      size,
      color
    ),
    stop: (size = 16, color = "currentColor") => createSvg(
      `<rect x="4" y="4" width="16" height="16" rx="2" ry="2"></rect>`,
      size,
      color
    ),
    close: (size = 18, color = "currentColor") => createSvg(
      `<line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line>`,
      size,
      color
    )
  };

  // src/ui/widget.ts
  function renderWidgetHtml() {
    return `
    <div class="discord-id-trigger" id="discordIdTrigger" title="Discord ID Streamer Panel">
      <div class="status-dot"></div>
      <div class="trigger-icon">
        ${icons.broadcast(22, "#ffffff")}
      </div>
    </div>
  `;
  }

  // src/ui/modal.ts
  function getIconUrl() {
    const datasetUrl = document.documentElement.dataset.discordIconUrl;
    if (datasetUrl) {
      return datasetUrl;
    }
    if (typeof chrome !== "undefined" && chrome.runtime?.getURL) {
      try {
        return chrome.runtime.getURL("assets/icon.png");
      } catch {
      }
    }
    return "assets/icon.png";
  }
  function renderModalHtml() {
    const config = loadConfig();
    const channels = config.targetChannelIds || [];
    const access = getCachedAccess();
    const iconUrl = getIconUrl();
    const isVerified = access.canStream;
    return `
    <div class="discord-id-overlay" id="discordIdOverlay">
      <div class="discord-id-modal" role="dialog" aria-modal="true">
        <button class="modal-close-btn" id="modalCloseBtn" aria-label="Close Settings">
          ${icons.close(16)}
        </button>

        <div class="modal-sidebar">
          <div>
            <div class="sidebar-header">
              <div class="sidebar-logo">
                <img class="sidebar-logo-img" src="${iconUrl}" alt="Discord ID" draggable="false" />
              </div>
              <div class="sidebar-title-group">
                <span class="sidebar-title-main">Discord ID</span>
                <span class="sidebar-title-sub">Badge Streaming Farming</span>
              </div>
            </div>

            <div class="sidebar-nav">
              <div class="nav-item active" data-tab="dashboard">
                <span class="nav-icon">${icons.dashboard(16)}</span>
                <span>Dashboard</span>
              </div>

              <div class="nav-item" data-tab="settings">
                <span class="nav-icon">${icons.gear(16)}</span>
                <span>Settings</span>
              </div>
            </div>
          </div>

          <div class="sidebar-footer">
            <a href="${discordIdInviteUrl}" target="_blank" rel="noopener noreferrer" class="join-discord-card" id="sidebarJoinCard">
              <div class="join-discord-icon">
                ${icons.discord(16, "#ffffff")}
              </div>
              <div class="join-discord-text">
                <span class="join-discord-title">Join Discord ID</span>
                <span class="join-discord-url">discord.gg/idn</span>
              </div>
              <span style="margin-left:auto;color:#949ba4;">${icons.externalLink(13)}</span>
            </a>
          </div>
        </div>

        <div class="modal-content-area">
          <div class="tab-page active" id="tab-dashboard">
            <div>
              <h2 class="page-title">Dashboard</h2>
              <p class="page-subtitle">Live stream status and voice rooms</p>
            </div>

            <div class="status-row">
              <div class="status-mini-box highlight">
                <div class="mini-icon">${icons.broadcast(18, "#ffffff")}</div>
                <div class="mini-details">
                  <span class="mini-label">Live Status</span>
                  <span class="mini-value" id="statusLiveValue">${isVerified ? "Checking..." : "Locked (Join Server First)"}</span>
                </div>
              </div>

              <div class="status-mini-box">
                <div class="mini-icon">${icons.desktop(18, "#ffffff")}</div>
                <div class="mini-details">
                  <span class="mini-label">Stream Quality</span>
                  <span class="mini-value">480p \u2022 60 FPS</span>
                </div>
              </div>
            </div>

            <div class="stats-grid">
              <div class="stats-card">
                <div class="stats-icon">${icons.clock(16, "#ffffff")}</div>
                <div class="stats-details">
                  <span class="stats-label">Stream Duration</span>
                  <span class="stats-value" id="statDurationValue">00:00:00</span>
                </div>
              </div>

              <div class="stats-card">
                <div class="stats-icon">${icons.desktop(16, "#ffffff")}</div>
                <div class="stats-details">
                  <span class="stats-label">Session Target</span>
                  <span class="stats-value" id="statSessionTarget">${config.streamDurationHours || 10}h</span>
                </div>
              </div>

              <div class="stats-card">
                <div class="stats-icon">${icons.refresh(15, "#ffffff")}</div>
                <div class="stats-details">
                  <span class="stats-label">Next Cooldown</span>
                  <span class="stats-value" id="statCooldownValue">--:--:--</span>
                </div>
              </div>
            </div>

            <div class="content-card">
              <div style="font-size:12px;font-weight:700;color:#949ba4;text-transform:uppercase;letter-spacing:0.04em;">
                Voice Channel Available
              </div>

              <div class="channel-list" id="channelListContainer">
                ${channels.map((channelId) => {
      const count = isVerified ? getVoiceChannelUserCount(channelId) : 0;
      const active = isVerified && isVoiceActive(channelId);
      const name = getVoiceChannelName(channelId);
      const isFull = isVerified && isVoiceChannelFull(channelId, count);
      return `
                      <div class="channel-item ${active ? "active" : ""}">
                        <div class="channel-item-left">
                          <span style="color:${active ? "#ff858d" : "#949ba4"};">${icons.headphones(16)}</span>
                          <span class="channel-name-text">${name}</span>
                          <span class="channel-count-text">${icons.users(13)} ${isVerified ? `${count} in room` : "Locked"}</span>
                        </div>
                        <div class="channel-item-right">
                          <span class="channel-live-dot ${isFull || !isVerified ? "dot-red" : "dot-green"}"></span>
                          <button class="channel-join-btn ${active ? "active" : isFull || !isVerified ? "disabled" : ""}" data-channel-id="${channelId}" ${active || isFull || !isVerified ? "disabled" : ""}>
                            ${active ? "Active" : isFull ? "Full" : "Join"}
                          </button>
                        </div>
                      </div>
                    `;
    }).join("")}
              </div>
            </div>

            <div class="action-buttons-row">
              <button class="btn btn-primary-red ${!isVerified ? "disabled" : ""}" id="btnRestartStream" ${!isVerified ? "disabled" : ""} title="Restart Discord & reload extension">
                <span>${icons.refresh(15)}</span>
                <span>Restart</span>
              </button>

              <button class="btn btn-primary-red ${!isVerified ? "disabled" : ""}" id="btnToggleStream" ${!isVerified ? "disabled" : ""}>
                <span id="btnToggleStreamIcon">${isStreamActive() ? icons.stop(15) : icons.broadcast(15)}</span>
                <span id="btnToggleStreamText">${isStreamActive() ? "Stop Streaming" : "Join Streaming"}</span>
              </button>
            </div>
          </div>

          <div class="tab-page" id="tab-settings">
            <div>
              <h2 class="page-title">Streaming Settings</h2>
              <p class="page-subtitle">Stream settings & cooldown interval</p>
            </div>

            <div class="content-card">
              <div class="setting-item">
                <div class="setting-texts">
                  <span class="setting-title">Auto Join Voice Channel</span>
                  <span class="setting-desc">Auto connect to the quietest voice room</span>
                </div>
                <label class="switch ${!isVerified ? "disabled" : ""}">
                  <input type="checkbox" id="settingAutoJoin" ${config.autoJoin ? "checked" : ""} ${!isVerified ? "disabled" : ""} />
                  <span class="slider"></span>
                </label>
              </div>

              <div class="setting-item" style="border-top:1px solid rgba(255,255,255,0.05);padding-top:12px;">
                <div class="setting-texts">
                  <span class="setting-title">Auto Screenshare (Go Live)</span>
                  <span class="setting-desc">Auto start screenshare after joining voice</span>
                </div>
                <label class="switch ${!isVerified ? "disabled" : ""}">
                  <input type="checkbox" id="settingAutoStream" ${config.autoStream ? "checked" : ""} ${!isVerified ? "disabled" : ""} />
                  <span class="slider"></span>
                </label>
              </div>

              <div class="setting-item" style="border-top:1px solid rgba(255,255,255,0.05);padding-top:12px;">
                <div class="setting-texts">
                  <span class="setting-title">Session Duration (Hours)</span>
                  <span class="setting-desc">How long to stream before taking a break</span>
                </div>
                <select class="setting-select-menu" id="settingDuration" ${!isVerified ? "disabled" : ""}>
                  ${[1, 2, 4, 6, 8, 10, 12, 16, 24].map(
      (h) => `<option value="${h}" ${(Number(config.streamDurationHours) || 10) === h ? "selected" : ""}>${h} Hour${h > 1 ? "s" : ""}</option>`
    ).join("")}
                </select>
              </div>

              <div class="setting-item" style="border-top:1px solid rgba(255,255,255,0.05);padding-top:12px;">
                <div class="setting-texts">
                  <span class="setting-title">Cooldown Interval (Minutes)</span>
                  <span class="setting-desc">Rest time before starting the next stream</span>
                </div>
                <select class="setting-select-menu" id="settingCooldown" ${!isVerified ? "disabled" : ""}>
                  ${[1, 2, 3, 5, 10, 15, 30].map(
      (m) => `<option value="${m}" ${(Number(config.cooldownMinutes) || 5) === m ? "selected" : ""}>${m} Minute${m > 1 ? "s" : ""}</option>`
    ).join("")}
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
  }

  // src/ui/checkerModal.ts
  function getBadgeUrl() {
    const datasetUrl = document.documentElement.dataset.discordBadgeUrl;
    if (datasetUrl) {
      return datasetUrl;
    }
    if (typeof chrome !== "undefined" && chrome.runtime?.getURL) {
      try {
        return chrome.runtime.getURL("assets/stream-badge.png");
      } catch {
      }
    }
    return "assets/stream-badge.png";
  }
  function renderCheckerModalHtml() {
    const badgeUrl = getBadgeUrl();
    return `
    <div class="discord-checker-overlay" id="discordCheckerOverlay">
      <div class="discord-checker-dialog" role="dialog" aria-modal="true" aria-labelledby="discord-checker-title">
        <button class="discord-checker-close-btn" id="discordCheckerCloseBtn" aria-label="Close">
          ${icons.close(18)}
        </button>

        <div class="discord-checker-header">
          <div class="discord-checker-badge-wrapper">
            <img class="discord-checker-badge-img" src="${badgeUrl}" alt="Discord ID Badge" draggable="false" />
          </div>
          <h1 class="discord-checker-title" id="discord-checker-title">Join Discord Indonesia First</h1>
          <p class="discord-checker-subtitle">Badge Streaming Farming</p>
        </div>

        <div class="discord-checker-content">
          <p>
            You must join the official <strong>Discord Indonesia</strong> server to activate voice streaming and badge farming.
          </p>
          <p class="discord-checker-hint">
            If you have already joined or encounter connection issues, click <strong>Restart</strong> to reload your Discord session.
          </p>
        </div>

        <footer class="discord-checker-footer">
          <button class="btn btn-checker-secondary" id="btnCheckerRestart" type="button">
            <span>${icons.refresh(14)}</span>
            <span>Restart</span>
          </button>
          <a href="${discordIdInviteUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-checker-primary" id="btnCheckerJoin">
            <span>${icons.discord(16, "#ffffff")}</span>
            <span>Join Discord ID</span>
            <span>${icons.externalLink(12)}</span>
          </a>
        </footer>
      </div>
    </div>
  `;
  }

  // src/ui/index.ts
  var shadowRoot = null;
  var checkerDismissed = false;
  function initUI() {
    if (document.getElementById("discord-id-streamer-host")) {
      return;
    }
    const host = document.createElement("div");
    host.id = "discord-id-streamer-host";
    (document.body || document.documentElement).appendChild(host);
    shadowRoot = host.attachShadow({ mode: "open" });
    const styleEl = document.createElement("style");
    styleEl.textContent = uiStyles;
    shadowRoot.appendChild(styleEl);
    const container = document.createElement("div");
    container.innerHTML = `${renderWidgetHtml()}${renderModalHtml()}${renderCheckerModalHtml()}`;
    shadowRoot.appendChild(container);
    wireUiEvents(shadowRoot);
    startUiStatusPoller(shadowRoot);
  }
  function wireUiEvents(root) {
    const trigger = root.getElementById("discordIdTrigger");
    const overlay = root.getElementById("discordIdOverlay");
    const closeBtn = root.getElementById("modalCloseBtn");
    const checkerOverlay = root.getElementById("discordCheckerOverlay");
    const checkerCloseBtn = root.getElementById("discordCheckerCloseBtn");
    const btnCheckerRestart = root.getElementById("btnCheckerRestart");
    const openModal = async () => {
      const config = loadConfig();
      const autoJoinEl = root.getElementById("settingAutoJoin");
      const autoStreamEl = root.getElementById("settingAutoStream");
      const durationEl = root.getElementById("settingDuration");
      const cooldownEl = root.getElementById("settingCooldown");
      if (autoJoinEl) autoJoinEl.checked = Boolean(config.autoJoin);
      if (autoStreamEl) autoStreamEl.checked = Boolean(config.autoStream);
      if (durationEl) durationEl.value = String(config.streamDurationHours || 10);
      if (cooldownEl) cooldownEl.value = String(config.cooldownMinutes || 5);
      const channels = config.targetChannelIds || [];
      const access = await checkDiscordIdAccess(config.guildId || void 0, channels);
      if (!access.canStream) {
        checkerDismissed = false;
        checkerOverlay?.classList.add("open");
        overlay?.classList.remove("open");
      } else {
        overlay?.classList.add("open");
        checkerOverlay?.classList.remove("open");
      }
      refreshModalValues(root);
    };
    const closeModal = () => {
      overlay?.classList.remove("open");
    };
    trigger?.addEventListener("click", openModal);
    closeBtn?.addEventListener("click", closeModal);
    overlay?.addEventListener("click", (e) => {
      if (e.target === overlay) {
        closeModal();
      }
    });
    checkerCloseBtn?.addEventListener("click", () => {
      checkerDismissed = true;
      checkerOverlay?.classList.remove("open");
    });
    checkerOverlay?.addEventListener("click", (e) => {
      if (e.target === checkerOverlay) {
        checkerDismissed = true;
        checkerOverlay?.classList.remove("open");
      }
    });
    const btnCheckerJoin = root.getElementById("btnCheckerJoin");
    btnCheckerJoin?.addEventListener("click", () => {
      checkerOverlay?.classList.remove("open");
    });
    const sidebarJoin = root.getElementById("sidebarJoinCard");
    sidebarJoin?.addEventListener("click", () => {
      overlay?.classList.remove("open");
    });
    btnCheckerRestart?.addEventListener("click", () => {
      console.log("[Discord Indonesia] Reloading Discord page via checker modal...");
      window.location.reload();
    });
    const navItems = root.querySelectorAll(".nav-item");
    navItems.forEach((item) => {
      item.addEventListener("click", () => {
        const tabName = item.getAttribute("data-tab");
        if (!tabName) return;
        navItems.forEach((n) => n.classList.remove("active"));
        item.classList.add("active");
        const pages = root.querySelectorAll(".tab-page");
        pages.forEach((p) => p.classList.remove("active"));
        const targetPage = root.getElementById(`tab-${tabName}`);
        targetPage?.classList.add("active");
      });
    });
    root.addEventListener("click", async (e) => {
      const target = e.target?.closest(".channel-join-btn");
      if (!target || target.disabled || target.classList.contains("active")) return;
      const channelId = target.getAttribute("data-channel-id");
      if (!channelId) return;
      const config = loadConfig();
      const channelName = getVoiceChannelName(channelId);
      console.log(`[Discord Indonesia] User manual join requested for: ${channelName} (${channelId})`);
      target.textContent = "Joining...";
      target.disabled = true;
      selectVoiceChannel(config.guildId, channelId);
      const connected = await waitForVoiceConnected(config.guildId, channelId, 15e3);
      if (connected) {
        await triggerGoLiveStream(config.guildId, channelId);
      }
      refreshModalValues(root);
    });
    const autoJoinInput = root.getElementById("settingAutoJoin");
    const autoStreamInput = root.getElementById("settingAutoStream");
    const durationSelect = root.getElementById("settingDuration");
    const cooldownSelect = root.getElementById("settingCooldown");
    autoJoinInput?.addEventListener("change", () => {
      saveConfig({ autoJoin: autoJoinInput.checked });
      syncRunnerConfig();
      refreshModalValues(root);
    });
    autoStreamInput?.addEventListener("change", () => {
      saveConfig({ autoStream: autoStreamInput.checked });
      syncRunnerConfig();
      refreshModalValues(root);
    });
    durationSelect?.addEventListener("change", () => {
      const val = parseInt(durationSelect.value, 10);
      if (!isNaN(val) && val >= 1) {
        saveConfig({ streamDurationHours: val });
        syncRunnerConfig();
        refreshModalValues(root);
      }
    });
    cooldownSelect?.addEventListener("change", () => {
      const val = parseInt(cooldownSelect.value, 10);
      if (!isNaN(val) && val >= 1) {
        saveConfig({ cooldownMinutes: val });
        syncRunnerConfig();
        refreshModalValues(root);
      }
    });
    const btnRestart = root.getElementById("btnRestartStream");
    btnRestart?.addEventListener("click", () => {
      console.log("[Discord Indonesia] Reloading Discord website and restarting extension...");
      window.location.reload();
    });
    const btnToggle = root.getElementById("btnToggleStream");
    btnToggle?.addEventListener("click", async () => {
      if (!getCachedAccess().canStream) {
        return;
      }
      const config = loadConfig();
      const channels = config.targetChannelIds || [];
      const isAnyActive = channels.some((ch) => isVoiceActive(ch)) || isStreamActive();
      if (isAnyActive) {
        console.log("[Discord Indonesia] Stopping stream and leaving voice channel via UI...");
        stopStreamCycle();
        stopGoLiveStream(config.guildId, config.channelId);
        leaveVoiceChannel();
      } else {
        console.log("[Discord Indonesia] Starting voice connection and stream via UI...");
        runAutomation(config).catch((err) => console.error("[Discord Indonesia] Join stream failed:", err));
      }
      refreshModalValues(root);
    });
  }
  function formatTime(ms) {
    if (ms <= 0 || !Number.isFinite(ms)) return "00:00:00";
    const totalSecs = Math.floor(ms / 1e3);
    const hours = Math.floor(totalSecs / 3600);
    const minutes = Math.floor(totalSecs % 3600 / 60);
    const seconds = totalSecs % 60;
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }
  async function refreshModalValues(root) {
    const config = loadConfig();
    const channels = config.targetChannelIds || [];
    const access = await checkDiscordIdAccess(config.guildId || void 0, channels);
    const isVerified = access.canStream;
    const checkerOverlay = root.getElementById("discordCheckerOverlay");
    const trigger = root.getElementById("discordIdTrigger");
    if (!isVerified) {
      if (!checkerDismissed) {
        checkerOverlay?.classList.add("open");
      }
      trigger?.classList.add("gated");
    } else {
      checkerOverlay?.classList.remove("open");
      trigger?.classList.remove("gated");
    }
    const btnRestart = root.getElementById("btnRestartStream");
    const btnToggle = root.getElementById("btnToggleStream");
    const btnToggleIcon = root.getElementById("btnToggleStreamIcon");
    const btnToggleText = root.getElementById("btnToggleStreamText");
    const autoJoinInput = root.getElementById("settingAutoJoin");
    const autoStreamInput = root.getElementById("settingAutoStream");
    const durationSelect = root.getElementById("settingDuration");
    const cooldownSelect = root.getElementById("settingCooldown");
    if (btnRestart) {
      btnRestart.disabled = !isVerified;
      btnRestart.classList.toggle("disabled", !isVerified);
    }
    if (btnToggle) {
      btnToggle.disabled = !isVerified;
      btnToggle.classList.toggle("disabled", !isVerified);
    }
    if (autoJoinInput) {
      autoJoinInput.disabled = !isVerified;
      autoJoinInput.closest(".switch")?.classList.toggle("disabled", !isVerified);
    }
    if (autoStreamInput) {
      autoStreamInput.disabled = !isVerified;
      autoStreamInput.closest(".switch")?.classList.toggle("disabled", !isVerified);
    }
    if (durationSelect) durationSelect.disabled = !isVerified;
    if (cooldownSelect) cooldownSelect.disabled = !isVerified;
    const isAnyVoiceActive = channels.some((ch) => isVoiceActive(ch)) || isStreamActive();
    if (btnToggleText && btnToggleIcon) {
      if (isAnyVoiceActive) {
        btnToggleIcon.innerHTML = icons.stop(15);
        btnToggleText.textContent = "Stop Streaming";
      } else {
        btnToggleIcon.innerHTML = icons.broadcast(15);
        btnToggleText.textContent = "Join Streaming";
      }
    }
    const statusValue = root.getElementById("statusLiveValue");
    const streaming = isStreamActive();
    const cycling = isStreamCycleActive();
    const sessionStats = getStreamSessionStats();
    if (statusValue) {
      if (!isVerified) {
        statusValue.textContent = !access.isMember ? "Locked (Join Server First)" : "Locked (Channels Missing)";
      } else if (streaming) {
        statusValue.textContent = "Live Streaming";
        trigger?.classList.remove("idle", "cooldown");
      } else if (cycling) {
        statusValue.textContent = "Standby / Cooldown";
        trigger?.classList.remove("idle");
        trigger?.classList.add("cooldown");
      } else {
        statusValue.textContent = "Idle";
        trigger?.classList.remove("cooldown");
        trigger?.classList.add("idle");
      }
    }
    const statDuration = root.getElementById("statDurationValue");
    const statTarget = root.getElementById("statSessionTarget");
    const statCooldown = root.getElementById("statCooldownValue");
    if (statTarget) {
      statTarget.textContent = `${config.streamDurationHours || 10}h`;
    }
    if (statDuration) {
      if (streaming && sessionStats.streamStartTime) {
        const elapsed = Math.max(0, Date.now() - sessionStats.streamStartTime);
        statDuration.textContent = formatTime(elapsed);
      } else if (streaming) {
        statDuration.textContent = "Active";
      } else {
        statDuration.textContent = "00:00:00";
      }
    }
    if (statCooldown) {
      if (sessionStats.phase === "streaming" && sessionStats.streamStartTime) {
        const remaining = Math.max(0, sessionStats.streamDurationMs - (Date.now() - sessionStats.streamStartTime));
        statCooldown.textContent = `in ${formatTime(remaining)}`;
      } else if (sessionStats.phase === "cooldown" && sessionStats.cooldownStartTime) {
        const remaining = Math.max(0, sessionStats.cooldownDurationMs - (Date.now() - sessionStats.cooldownStartTime));
        statCooldown.textContent = `Break ${formatTime(remaining)}`;
      } else {
        statCooldown.textContent = "--:--:--";
      }
    }
    const container = root.getElementById("channelListContainer");
    if (container) {
      const cards = container.querySelectorAll(".channel-item");
      channels.forEach((channelId, idx) => {
        const cardItem = cards[idx];
        if (cardItem) {
          const count = isVerified ? getVoiceChannelUserCount(channelId) : 0;
          const active = isVerified && isVoiceActive(channelId);
          const name = getVoiceChannelName(channelId);
          const isFull = isVerified && isVoiceChannelFull(channelId, count);
          cardItem.classList.toggle("active", active);
          const nameLabel = cardItem.querySelector(".channel-name-text");
          if (nameLabel) {
            nameLabel.textContent = name;
          }
          const countLabel = cardItem.querySelector(".channel-count-text");
          if (countLabel) {
            countLabel.innerHTML = `${icons.users(13)} ${isVerified ? `${count} in room` : "Locked"}`;
          }
          const dot = cardItem.querySelector(".channel-live-dot");
          if (dot) {
            dot.className = `channel-live-dot ${isFull || !isVerified ? "dot-red" : "dot-green"}`;
          }
          const joinBtn = cardItem.querySelector(".channel-join-btn");
          if (joinBtn) {
            joinBtn.textContent = active ? "Active" : isFull ? "Full" : "Join";
            joinBtn.classList.toggle("active", active);
            joinBtn.classList.toggle("disabled", isFull || !isVerified);
            joinBtn.disabled = active || isFull || !isVerified;
          }
        }
      });
    }
  }
  function startUiStatusPoller(root) {
    setInterval(() => {
      refreshModalValues(root).catch(() => {
      });
    }, 1e3);
  }

  // src/index.ts
  window.discordScreenshare = {
    loadConfig,
    saveConfig,
    joinVoice: selectVoiceChannel,
    leaveVoice: leaveVoiceChannel,
    startStream: triggerGoLiveStream,
    stopStream: stopGoLiveStream,
    rankChannels: rankChannelsByLowestUserCount,
    connectOptimal: connectToOptimalVoiceChannel,
    stopCycle: stopStreamCycle,
    isCycleActive: isStreamCycleActive,
    setVideoUrl: (url) => {
      saveConfig({ videoUrl: url });
      const video = createOffscreenVideo(url);
      installDisplayMediaHook(() => createMuxedStream(video));
      console.log(`[Discord Indonesia] Video URL updated: ${url}`);
    },
    rest: getRestClient,
    dispatch: safeDispatch
  };
  (function init() {
    const desktopUserAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";
    try {
      Object.defineProperty(navigator, "userAgent", { get: () => desktopUserAgent, configurable: true });
      Object.defineProperty(navigator, "platform", { get: () => "Win32", configurable: true });
      Object.defineProperty(navigator, "maxTouchPoints", { get: () => 0, configurable: true });
    } catch {
    }
    if (!window.location.pathname.startsWith("/channels/")) {
      return;
    }
    const config = loadConfig();
    try {
      initUI();
    } catch (err) {
      console.warn("[Discord Indonesia] UI initialization error:", err);
    }
    runAutomation(config).catch((err) => {
      console.error("[Discord Indonesia] Extension init failed:", err);
    });
  })();
})();

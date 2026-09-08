(function () {
  var q = new URLSearchParams(location.search);
  var key = window.GAMEPAL_VIEW_KEY || q.get("k") || "";
  var origin = String(window.VAULT_ORIGIN || "").replace(/\/$/, "") || location.origin;
  var videoId = q.get("video") || "";
  var gameId = q.get("game") || "";
  var jump = Number(q.get("t") || 0) || 0;
  var titleEl = document.getElementById("bookTitle");
  var player = document.getElementById("player");
  var playBtn = document.getElementById("playBtn");
  var waitEl = document.getElementById("watchWait");
  var menu = document.getElementById("readerSettingsMenu");
  var catcher = document.getElementById("readerSettingsCatch");
  var gear = document.getElementById("configButton");
  var chapterEntry = document.getElementById("chapterEntry");
  var endMask = document.getElementById("endMask");
  var chapterTags = [];
  var chapterSheet = null;
  var duration = 0;
  var segmentSec = 4;
  var lastSave = 0;
  var readySent = false;
  var hls = null;
  var mediaReady = Promise.resolve();
  var prefetchTimer = 0;
  var lastPrefetch = -1;
  var wanted = 0;
  var lastSeekT = 0;
  var userSeekAt = 0;
  var holdUntil = 0;
  var restoring = false;
  var recoveries = 0;
  var userArmed = 0;
  var appleTouch = /iP(hone|od|ad)/.test(navigator.userAgent || "")
    || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  if (appleTouch) document.documentElement.classList.add("is-ios");

  function withKey(path) {
    var u = new URL(path, origin + "/");
    if (key) u.searchParams.set("k", key);
    if (gameId && !u.searchParams.get("game")) u.searchParams.set("game", gameId);
    return u.href;
  }
  function mediaUrl() {
    return withKey("/media.mp4?video=" + encodeURIComponent(videoId));
  }
  function playlistUrl() {
    return withKey("/media.m3u8?video=" + encodeURIComponent(videoId) + "&hv=d3");
  }
  function segmentUrl(index) {
    return withKey("/media-seg.ts?video=" + encodeURIComponent(videoId) + "&i=" + index + "&hv=d3");
  }
  function coverUrl() {
    return withKey("/cover?video=" + encodeURIComponent(videoId));
  }
  function nativeHls() {
    var ua = navigator.userAgent || "";
    var ios = /iP(hone|od|ad)/.test(ua);
    var safari = /Safari/i.test(ua) && !/Chrome|Chromium|Edg|Android/i.test(ua);
    return (ios || safari) && !!(player && player.canPlayType && player.canPlayType("application/vnd.apple.mpegurl"));
  }
  function loadScript(src) {
    return new Promise(function (resolve, reject) {
      var s = document.createElement("script");
      s.src = src;
      s.onload = function () { resolve(); };
      s.onerror = function () { reject(new Error("script")); };
      document.head.appendChild(s);
    });
  }
  function loadHls() {
    if (window.Hls) return Promise.resolve();
    return loadScript("https://cdn.jsdelivr.net/npm/hls.js@1.6.13/dist/hls.min.js");
  }
  function prefetchAt(sec) {
    var index = Math.max(0, Math.floor((sec || 0) / segmentSec));
    if (index === lastPrefetch) return;
    lastPrefetch = index;
    fetch(segmentUrl(index), { cache: "force-cache", mode: "cors" }).catch(function () {});
  }
  function markWanted(sec) {
    var n = Math.max(0, Number(sec) || 0);
    wanted = n;
    lastSeekT = n;
    userSeekAt = Date.now();
  }
  function restoreWanted() {
    if (!player || wanted <= 2) return;
    restoring = true;
    try { player.currentTime = wanted; } catch (e) {}
    if (hls) {
      try { hls.startLoad(wanted); } catch (e) {}
    }
    prefetchAt(wanted);
    holdUntil = Date.now() + 1200;
    setTimeout(function () { restoring = false; }, 200);
  }
  function isSnapBack(t) {
    return wanted > 8 && t < 2 && (Date.now() - userSeekAt) < 4000 && Math.abs(t - lastSeekT) > 8;
  }
  function userIsScrubbing() {
    return (Date.now() - userArmed) < 2500;
  }
  function onUserSeek() {
    if (!player || restoring) return;
    clearTimeout(prefetchTimer);
    prefetchTimer = setTimeout(function () {
      prefetchAt(player.currentTime);
    }, 80);
    if (!userIsScrubbing()) return;
    var t = player.currentTime || 0;
    if (Date.now() < holdUntil || isSnapBack(t)) {
      restoreWanted();
      return;
    }
    markWanted(t);
  }
  function bindSeekPrefetch() {
    if (!player || player.dataset.prefetchOn) return;
    player.dataset.prefetchOn = "1";
    ["pointerdown", "mousedown", "touchstart"].forEach(function (ev) {
      player.addEventListener(ev, function () { userArmed = Date.now(); });
    });
    player.addEventListener("seeking", onUserSeek);
    player.addEventListener("seeked", onUserSeek);
  }
  function closeWatch() {
    try { player.pause(); } catch (e) {}
    if (hls) {
      try { hls.destroy(); } catch (e) {}
      hls = null;
    }
    try { window.parent.postMessage({ fami: "close-reader", gamepal: "close" }, location.origin); } catch (e) {}
  }
  function ready() {
    if (readySent) return;
    readySent = true;
    try { window.parent.postMessage({ fami: "reader-ready" }, location.origin); } catch (e) {}
  }
  function savePos(sec, done) {
    if (!done && (restoring || (player && player.seeking) || Date.now() < holdUntil)) return;
    if (!done && wanted > 2 && (sec || 0) < 2) return;
    var now = Date.now();
    if (!done && now - lastSave < 4000) return;
    lastSave = now;
    var body = { position: Math.max(0, Math.floor(sec || 0)), game: gameId, video: videoId };
    if (done) body.finished = true;
    fetch(withKey("/api/prefs?video=" + encodeURIComponent(videoId)), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).catch(function () {});
  }
  function showEnd(on) {
    if (endMask) endMask.hidden = !on;
  }
  function startPlay() {
    mediaReady.then(function () {
      if (player && !player.getAttribute("src") && !hls) player.src = mediaUrl();
      player.playsInline = true;
      var p = player.play();
      if (p && p.then) p.catch(function () {});
      if (playBtn) playBtn.hidden = true;
      if (waitEl) waitEl.hidden = true;
    });
  }
  function seekWhenReady(pos) {
    if (!player) return;
    if (pos > 2) markWanted(pos);
    function go() {
      if (wanted <= 2) return;
      restoreWanted();
    }
    if (player.readyState >= 1) go();
    else player.addEventListener("loadedmetadata", go, { once: true });
  }
  function attachMp4() {
    var keep = wanted > 2 ? wanted : (player && player.currentTime) || 0;
    if (hls) {
      try { hls.destroy(); } catch (e) {}
      hls = null;
    }
    player.src = mediaUrl();
    bindSeekPrefetch();
    if (keep > 2) {
      markWanted(keep);
      player.addEventListener("loadedmetadata", function () { restoreWanted(); }, { once: true });
    }
  }
  function attachHlsJs() {
    recoveries = 0;
    return loadHls().then(function () {
      if (!window.Hls || !window.Hls.isSupported()) {
        attachMp4();
        return;
      }
      hls = new window.Hls({
        enableWorker: true,
        startFragPrefetch: true,
        maxBufferLength: 8,
        maxMaxBufferLength: 16,
        maxBufferHole: 2,
        startPosition: wanted > 2 ? wanted : -1,
      });
      window.__watchHls = hls;
      hls.loadSource(playlistUrl());
      hls.attachMedia(player);
      hls.on(window.Hls.Events.MEDIA_ATTACHED, function () {
        if (wanted > 2) {
          try { hls.startLoad(wanted); } catch (e) {}
        }
      });
      hls.on(window.Hls.Events.ERROR, function (_evt, data) {
        if (!data || !data.fatal) return;
        if (data.type === window.Hls.ErrorTypes.NETWORK_ERROR) {
          try { hls.startLoad(); } catch (e) {}
          return;
        }
        if (data.type === window.Hls.ErrorTypes.MEDIA_ERROR && recoveries < 2) {
          recoveries += 1;
          try { hls.recoverMediaError(); } catch (e) { attachMp4(); }
          return;
        }
        attachMp4();
      });
      bindSeekPrefetch();
    }).catch(function () {
      attachMp4();
    });
  }
  function attachMedia() {
    if (!player) return Promise.resolve();
    player.playsInline = true;
    player.setAttribute("crossorigin", "anonymous");
    if (nativeHls()) {
      player.src = playlistUrl();
      bindSeekPrefetch();
      return Promise.resolve();
    }
    return attachHlsJs();
  }

  document.addEventListener("contextmenu", function (e) { e.preventDefault(); });
  if (titleEl) titleEl.textContent = "";
  if (player) player.poster = coverUrl();

  function bindWatchChrome() {
    var gate = window.FamiGate || window.YRoomGate;
    if (gate && gate.blockWebChrome) gate.blockWebChrome();
    if (gate && gate.bindKeyboard) gate.bindKeyboard();
  }
  bindWatchChrome();

  mediaReady = fetch(withKey("/api/video?video=" + encodeURIComponent(videoId)))
    .then(function (r) { return r.json(); })
    .then(function (info) {
      if (titleEl) titleEl.textContent = (info && info.title) || "";
      duration = Number(info && info.duration) || 0;
      segmentSec = Number(info && info.segment) || 4;
      chapterTags = Array.isArray(info && info.tags) ? info.tags : [];
      if (chapterEntry) chapterEntry.hidden = !chapterTags.length;
      return fetch(withKey("/api/prefs?video=" + encodeURIComponent(videoId))).then(function (r) { return r.json(); });
    })
    .then(function (prefs) {
      var pos = jump > 2 ? jump : (Number(prefs && prefs.position) || 0);
      return attachMedia().then(function () {
        seekWhenReady(pos);
        if (waitEl) waitEl.hidden = true;
        ready();
      });
    })
    .catch(function () {
      if (waitEl) waitEl.textContent = "維護中,請5分鐘後再試";
      ready();
    });

  if (playBtn) {
    playBtn.addEventListener("click", function () {
      startPlay();
    });
  }
  if (player) {
    player.addEventListener("play", function () {
      if (playBtn) playBtn.hidden = true;
      if (waitEl) waitEl.hidden = true;
    });
    player.addEventListener("timeupdate", function () {
      var t = player.currentTime || 0;
      if (userIsScrubbing() && isSnapBack(t)) {
        restoreWanted();
        return;
      }
      if (!player.seeking && !restoring && Date.now() >= holdUntil && t > 2) {
        wanted = t;
      }
      savePos(t, false);
    });
    player.addEventListener("pause", function () {
      savePos(player.currentTime, false);
    });
    player.addEventListener("ended", function () {
      savePos(duration || player.currentTime, true);
      showEnd(true);
    });
  }
  document.getElementById("endAgain").addEventListener("click", function () {
    showEnd(false);
    markWanted(0);
    try { player.currentTime = 0; } catch (e) {}
    startPlay();
  });
  document.getElementById("endHome").addEventListener("click", closeWatch);
  document.getElementById("backShelf").addEventListener("click", closeWatch);
  document.getElementById("backToShelf").addEventListener("click", closeWatch);

  function placeMenu() {
    if (!menu || !gear) return;
    var box = gear.getBoundingClientRect();
    menu.style.position = "fixed";
    menu.style.right = Math.max(12, window.innerWidth - box.right) + "px";
    menu.style.top = Math.round(box.bottom + 8) + "px";
  }
  function closeMenu() {
    if (menu) menu.hidden = true;
    if (catcher) catcher.hidden = true;
    document.documentElement.classList.remove("settings-open");
    if (gear) {
      gear.setAttribute("aria-expanded", "false");
      gear.classList.remove("is-live");
    }
  }
  function openMenu() {
    if (catcher) catcher.hidden = false;
    if (menu) {
      document.body.appendChild(menu);
      menu.hidden = false;
      placeMenu();
    }
    document.documentElement.classList.add("settings-open");
    if (gear) {
      gear.setAttribute("aria-expanded", "true");
      gear.classList.add("is-live");
    }
  }
  if (gear) {
    gear.addEventListener("click", function (ev) {
      ev.preventDefault();
      if (menu && menu.hidden) openMenu();
      else closeMenu();
    });
  }
  if (catcher) catcher.addEventListener("click", closeMenu);

  function jumpTo(sec) {
    var pos = Math.max(0, Number(sec) || 0);
    closeChapterFind();
    closeMenu();
    seekWhenReady(pos);
    startPlay();
  }

  function closeChapterFind() {
    if (chapterSheet) {
      chapterSheet.remove();
      chapterSheet = null;
    }
    document.documentElement.classList.remove("tag-modal-open");
  }

  function openChapterFind() {
    closeMenu();
    if (chapterSheet) {
      closeChapterFind();
      return;
    }
    if (!chapterTags.length) return;
    var mask = document.createElement("div");
    mask.className = "batch-tag-mask list-tag-mask";
    var card = document.createElement("div");
    card.className = "batch-tag-sheet list-tag-sheet";
    var head = document.createElement("div");
    head.className = "batch-tag-head";
    var title = document.createElement("p");
    title.textContent = "段落";
    var close = document.createElement("button");
    close.type = "button";
    close.className = "batch-tag-close";
    close.setAttribute("aria-label", "關閉");
    close.textContent = "×";
    close.addEventListener("click", closeChapterFind);
    head.appendChild(title);
    head.appendChild(close);
    var body = document.createElement("div");
    body.className = "list-tag-body";
    var form = document.createElement("form");
    form.className = "tag-picker-form";
    form.autocomplete = "off";
    var input = document.createElement("input");
    input.className = "tag-search-input";
    input.placeholder = "找段落？";
    var go = document.createElement("button");
    go.type = "button";
    go.className = "tag-apply";
    go.innerHTML = '<span class="tag-apply-face">看這一段</span>';
    form.appendChild(input);
    var suggest = document.createElement("div");
    suggest.className = "tag-picker-suggest";
    body.appendChild(form);
    body.appendChild(suggest);
    card.appendChild(head);
    card.appendChild(body);
    card.appendChild(go);
    mask.appendChild(card);
    document.body.appendChild(mask);
    chapterSheet = mask;
    document.documentElement.classList.add("tag-modal-open");
    if (window.FamiGate && window.FamiGate.lockSheetPage) window.FamiGate.lockSheetPage(mask);
    var down = false;
    mask.addEventListener("pointerdown", function (ev) { down = ev.target === mask; });
    mask.addEventListener("pointerup", function (ev) {
      if (down && ev.target === mask) closeChapterFind();
      down = false;
    });

    function visibleTags() {
      var q = String(input.value || "").trim();
      if (!q) return chapterTags.slice();
      var folded = q.replace(/\s+/g, "");
      return chapterTags.filter(function (tag) {
        var label = String(tag.label || tag.id || "");
        return label.indexOf(q) >= 0 || label.replace(/\s+/g, "").indexOf(folded) >= 0;
      });
    }

    function paintSuggest() {
      suggest.innerHTML = "";
      var tags = visibleTags();
      if (!tags.length) return;
      var cap = document.createElement("p");
      cap.className = "tag-suggest-title";
      cap.textContent = input.value.trim() ? "標籤" : "段落";
      suggest.appendChild(cap);
      tags.forEach(function (tag) {
        var chip = document.createElement("button");
        chip.type = "button";
        chip.className = "tag-chip";
        chip.textContent = tag.label || tag.id || "";
        chip.addEventListener("click", function () { jumpTo(tag.start); });
        suggest.appendChild(chip);
      });
    }

    input.addEventListener("input", paintSuggest);
    function applyChapter() {
      var tags = visibleTags();
      if (tags.length) jumpTo(tags[0].start);
    }
    form.addEventListener("submit", function (ev) {
      ev.preventDefault();
      applyChapter();
    });
    go.addEventListener("click", applyChapter);
    paintSuggest();
  }

  if (chapterEntry) {
    chapterEntry.addEventListener("click", function (ev) {
      ev.preventDefault();
      openChapterFind();
    });
  }
})();

(function () {
  const hall = document.getElementById("hall");
  const statusEl = document.getElementById("status");
  const invitePanel = document.getElementById("invite-panel");
  const goBtn = document.getElementById("invite-go");
  const nameForm = document.getElementById("invite-name-form");
  const nameInput = document.getElementById("invite-name");
  const nameErr = document.getElementById("invite-name-err");
  const waitEl = document.getElementById("invite-wait");
  const waitBar = document.getElementById("invite-wait-bar");
  const safariNote = document.getElementById("invite-safari");
  const homeInstall = document.getElementById("home-install");
  const feed = document.getElementById("feed");
  const tagBoard = document.getElementById("tag-board");
  const shelfBack = document.getElementById("shelf-back");
  const bookCoverInput = document.getElementById("book-cover-input");
  const cabHud = document.getElementById("cab-hud");
  const faceImg = document.getElementById("face-img");
  const readerName = document.getElementById("reader-name");
  const coverInput = document.getElementById("cover-input");
  const backdropInput = document.getElementById("backdrop-input");
  const stageBg = document.getElementById("stage-bg");
  const homeHead = document.getElementById("home-head");
  const GEAR = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9.6 3.8l.6-1.3h3.6l.6 1.3 1.6.7 1.4-.5 2.5 2.5-.5 1.4.7 1.6 1.3.6v3.6l-1.3.6-.7 1.6.5 1.4-2.5 2.5-1.4-.5-1.6.7-.6 1.3h-3.6l-.6-1.3-1.6-.7-1.4.5-2.5-2.5.5-1.4-.7-1.6-1.3-.6v-3.6l1.3-.6.7-1.6-.5-1.4L6.6 4l1.4.5 1.6-.7z" fill="none" stroke="currentColor" stroke-width="1.45" stroke-linejoin="round"/><circle cx="12" cy="11.9" r="3.2" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>';
  const CAMERA = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="8" width="17" height="11.5" rx="2" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="M8 8l1.4-2.4h5.2L16 8" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/><circle cx="12" cy="13.6" r="3" fill="none" stroke="currentColor" stroke-width="1.7"/></svg>';
  const SCENE = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="5.5" width="17" height="13" rx="2" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="M5.5 16.2l4.2-4.6 3 3.2 2.2-2.4 3.6 3.8" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/><circle cx="9" cy="9.2" r="1.3" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>';
  const HEART = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20C10.5 18.4 7.3 15.8 5.4 11.9C4 9.1 5.2 6 8.4 6c1.8 0 3 1.1 3.6 2.2C12.6 7.1 13.8 6 15.6 6c3.2 0 4.4 3.1 3 5.9C16.7 15.8 13.5 18.4 12 20Z"/></svg>';
  const LIST = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 7h12M6 12h12M6 17h8" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>';
  const MEM = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="4" width="14" height="16" rx="2" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M8 9h8M8 13h6" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>';
  const PLUS = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>';
  const TRASH = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 8V6.8A1.8 1.8 0 0 1 9.8 5h4.4A1.8 1.8 0 0 1 16 6.8V8M5 8h14M9 11v7M12 11v7M15 11v7M7 8l.8 12.2A1.6 1.6 0 0 0 9.4 22h5.2a1.6 1.6 0 0 0 1.6-1.8L17 8" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  const MAP = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8.5 5.5l7-2 5 2.2v13.8l-5-2.2-7 2-5-2.2V5.5l5 2.2z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="M8.5 7.7v10.8M15.5 3.5v10.8" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>';
  let key = "";
  let busy = false;
  let settingsWrap = null;
  let settingsCatch = null;
  let catalog = {};
  let hostTab = "play";
  let openGame = "";
  let chatGame = "";
  let chatId = "1";
  let rooms = [];
  let chatBusy = false;
  let chatGearWrap = null;
  let paintedTurns = 0;
  let lookLive = 0;
  let lookSeq = 0;
  let ready = false;
  let booting = false;
  let bootTimer = 0;
  let holdTimer = 0;
  let holdFired = false;
  let selected = new Set();
  let selectMode = false;
  let readerOpen = false;
  let readerStaySeq = 0;
  let readerReadyTimer = 0;
  let askTarget = "";
  let askKind = "";

  function setBoot(on, text) {
    if (!hall) return;
    hall.classList.toggle("is-booting", !!on);
    hall.classList.toggle("with-feed", true);
    if (statusEl && text != null) statusEl.textContent = text;
  }

  function setCabRun(on) {
    const cover = document.querySelector("#cab-hud .cab-cover");
    if (cover) cover.classList.toggle("is-run", !!on);
  }

  function layoutStage() {
    if (!stageBg || !hall || stageBg.hidden) return;
    const hallBox = hall.getBoundingClientRect();
    const tags = document.getElementById("tag-board");
    const startBox = tags && !tags.hidden ? tags.getBoundingClientRect() : (feed ? feed.getBoundingClientRect() : null);
    const endBox = feed ? feed.getBoundingClientRect() : startBox;
    const start = startBox ? Math.max(0, startBox.top - hallBox.top) : 180;
    const end = endBox ? Math.max(start + 24, endBox.top - hallBox.top) : start + 80;
    const fade = "linear-gradient(to bottom, #000 0, #000 " + Math.round(start) + "px, transparent " + Math.round(end) + "px)";
    stageBg.style.height = Math.round(end) + "px";
    stageBg.style.webkitMaskImage = fade;
    stageBg.style.maskImage = fade;
  }

  function paintStage(reader) {
    if (!stageBg || !hall) return;
    if (reader && reader.has_backdrop && reader.id) {
      hall.classList.add("has-backdrop");
      stageBg.style.backgroundImage = "url(" + window.FamiGate.origin() + "/backdrop?person=" + encodeURIComponent(reader.id) + "&k=" + encodeURIComponent(key) + "&r=" + (reader.backdrop_rev || 0) + ")";
      stageBg.hidden = false;
      if (readerName) readerName.classList.add("is-on-dark");
      requestAnimationFrame(layoutStage);
    } else {
      hall.classList.remove("has-backdrop");
      if (readerName) readerName.classList.remove("is-on-light", "is-on-dark");
      stageBg.hidden = true;
      stageBg.style.backgroundImage = "";
    }
  }

  function insButton(className, svg, label) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "ins-icon " + className;
    btn.setAttribute("aria-label", label);
    btn.title = label;
    btn.innerHTML = '<span class="ins-ring"></span><span class="ins-face">' + svg + "</span>";
    return btn;
  }

  function jobBadge(svg) {
    const badge = document.createElement("span");
    badge.className = "ins-icon job-icon";
    badge.setAttribute("aria-hidden", "true");
    badge.innerHTML = '<span class="ins-ring"></span><span class="ins-face">' + svg + "</span>";
    return badge;
  }

  function setJobRun(entry, on) {
    if (!entry) return;
    entry.classList.toggle("is-run", !!on);
    entry.disabled = !!on;
  }

  function showWaitCard(title) {
    const mask = document.getElementById("waitMask");
    const head = document.getElementById("waitTitle");
    const pct = document.getElementById("waitPct");
    if (head) head.textContent = title;
    if (pct) pct.textContent = "0%";
    if (mask) mask.hidden = false;
  }

  function hideWaitCard() {
    const mask = document.getElementById("waitMask");
    if (mask) mask.hidden = true;
  }

  function closeSettings() {
    document.querySelectorAll(".settings-menu").forEach(function (menu) { menu.hidden = true; });
    if (settingsCatch) settingsCatch.hidden = true;
    document.querySelectorAll(".settings-toggle").forEach(function (toggle) {
      toggle.setAttribute("aria-expanded", "false");
      toggle.classList.remove("is-live");
    });
    document.documentElement.classList.remove("settings-open");
  }

  function ensureSettingsCatch() {
    if (settingsCatch && settingsCatch.isConnected) return settingsCatch;
    settingsCatch = document.createElement("div");
    settingsCatch.className = "settings-catch";
    settingsCatch.hidden = true;
    settingsCatch.addEventListener("click", closeSettings);
    document.body.appendChild(settingsCatch);
    return settingsCatch;
  }

  function placeSettingsMenu(toggle, menu) {
    const box = toggle.getBoundingClientRect();
    menu.style.position = "fixed";
    menu.style.right = Math.max(12, window.innerWidth - box.right) + "px";
    menu.style.top = Math.round(box.bottom + 8) + "px";
  }

  function ensureSettings() {
    const host = document.querySelector("#cab-hud .cab-wrap");
    const existing = document.getElementById("album-settings");
    if (settingsWrap && settingsWrap.isConnected) return settingsWrap;
    settingsWrap = existing && existing.isConnected ? existing : document.createElement("div");
    const wrap = settingsWrap;
    wrap.id = "album-settings";
    wrap.className = "album-settings";
    wrap.hidden = true;
    wrap.innerHTML = "";
    const toggle = insButton("settings-toggle", GEAR, "設定");
    toggle.setAttribute("aria-expanded", "false");
    const menu = document.createElement("div");
    menu.className = "settings-menu";
    menu.setAttribute("role", "menu");
    menu.hidden = true;
    function gearRow(svg, label, job, onClick) {
      const row = document.createElement("button");
      row.type = "button";
      row.className = "settings-entry";
      row.dataset.job = job;
      row.appendChild(jobBadge(svg));
      const text = document.createElement("span");
      text.textContent = label;
      row.appendChild(text);
      row.addEventListener("click", function () {
        closeSettings();
        onClick();
      });
      return row;
    }
    menu.appendChild(gearRow(CAMERA, "更換頭像", "cover", function () { if (coverInput) coverInput.click(); }));
    menu.appendChild(gearRow(SCENE, "更換背景", "backdrop", function () { if (backdropInput) backdropInput.click(); }));
    menu.appendChild(gearRow(LIST, "工作佇列", "queue", function () { openQueue(); }));
    menu.appendChild(gearRow(MEM, "記憶", "memory", function () { openMemory(); }));
    toggle.addEventListener("click", function (ev) {
      ev.preventDefault();
      ev.stopPropagation();
      const open = menu.hidden;
      if (open) {
        const catcher = ensureSettingsCatch();
        catcher.hidden = false;
        document.body.appendChild(menu);
        menu.hidden = false;
        document.documentElement.classList.add("settings-open");
        requestAnimationFrame(function () { placeSettingsMenu(toggle, menu); });
      } else closeSettings();
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      toggle.classList.toggle("is-live", open);
    });
    wrap.appendChild(toggle);
    wrap.appendChild(menu);
    if (host) host.appendChild(wrap);
    return wrap;
  }

  function showInvite() {
    if (!hall) return;
    hall.classList.add("is-invite");
    hall.classList.remove("is-booting");
    if (invitePanel) invitePanel.hidden = false;
    if (window.FamiGate.needsSafari()) {
      if (safariNote) safariNote.hidden = false;
      if (goBtn) goBtn.hidden = true;
    }
  }

  function hideInvite() {
    if (hall) hall.classList.remove("is-invite");
    if (invitePanel) invitePanel.hidden = true;
  }

  function startWait() {
    goBtn.hidden = true;
    nameForm.hidden = true;
    waitEl.hidden = false;
    if (window.PalMark) window.PalMark.mountBar(waitBar);
  }

  function renderMe(reader) {
    if (!reader || !cabHud) return;
    if (readerName) readerName.textContent = reader.display_name || "";
    if (faceImg) {
      faceImg.src = reader.has_cover
        ? window.FamiGate.origin() + "/cover?person=" + encodeURIComponent(reader.id) + "&k=" + encodeURIComponent(key) + "&r=" + (reader.cover_rev || 0)
        : "./face-default.jpg?v=1";
      faceImg.hidden = false;
    }
    cabHud.hidden = false;
    if (homeHead) homeHead.hidden = false;
    const settings = ensureSettings();
    settings.hidden = false;
    paintStage(reader);
  }

  function thumbUrl(item) {
    return window.FamiGate.origin() + "/thumb?id=" + encodeURIComponent(item.id) + "&k=" + encodeURIComponent(key);
  }

  function showRail(on) {
    const rail = document.getElementById("photo-rail");
    if (!rail) return;
    rail.hidden = !on;
    document.documentElement.classList.toggle("has-rail", !!on);
    if (on && !rail.dataset.ready) {
      rail.dataset.ready = "1";
      const trash = insButton("rail-trash", TRASH, "丟掉");
      trash.addEventListener("click", askTrashGames);
      const cover = insButton("rail-cover", CAMERA, "換封面");
      cover.addEventListener("click", function () {
        if (!bookCoverInput || !selected.size) return;
        bookCoverInput.value = "";
        bookCoverInput.click();
      });
      const heart = insButton("rail-heart", HEART, "愛心");
      heart.addEventListener("click", heartSelected);
      rail.appendChild(trash);
      rail.appendChild(cover);
      rail.appendChild(heart);
    }
  }

  function paintPicks() {
    document.querySelectorAll("#feed .tile").forEach(function (el) {
      el.classList.toggle("is-pick", selected.has(el.dataset.id));
    });
    showRail(selectMode && selected.size > 0);
    document.documentElement.classList.toggle("is-select", selectMode);
  }

  function enterSelect(id) {
    selectMode = true;
    if (id) selected.add(id);
    paintPicks();
  }

  function togglePick(id) {
    if (selected.has(id)) selected.delete(id);
    else selected.add(id);
    selectMode = selected.size > 0;
    paintPicks();
  }

  function clearSelect() {
    selected = new Set();
    selectMode = false;
    paintPicks();
  }

  async function heartSelected() {
    const ids = Array.from(selected);
    for (const id of ids) {
      const item = catalog[id];
      if (!item || item.kind === "todo") continue;
      await window.FamiGate.api("/api/fav", key, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: id, on: !item.favorite }),
        timeout: 15000,
      });
    }
    clearSelect();
    loadShelf();
  }

  function tileEl(item) {
    catalog[item.id] = item;
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "tile";
    btn.dataset.id = item.id;
    if (item.has_cover) {
      const img = document.createElement("img");
      img.alt = item.title || "";
      img.decoding = "async";
      img.src = thumbUrl(item);
      img.addEventListener("load", function () { img.classList.add("is-on"); });
      img.addEventListener("error", function () { img.hidden = true; });
      if (img.complete && img.naturalWidth) img.classList.add("is-on");
      btn.appendChild(img);
    }
    const shield = document.createElement("span");
    shield.className = "tile-shield";
    btn.appendChild(shield);
    if (item.favorite) {
      const heart = document.createElement("span");
      heart.className = "tile-heart";
      heart.innerHTML = HEART;
      btn.appendChild(heart);
    }
    const name = document.createElement("span");
    name.className = "tile-pct";
    name.textContent = item.title || "";
    btn.appendChild(name);
    btn.addEventListener("pointerdown", function (ev) {
      if (ev.button && ev.button !== 0) return;
      holdTimer = window.setTimeout(function () {
        holdFired = true;
        if (selectMode && selected.has(item.id) && selected.size === 1) {
          clearSelect();
          return;
        }
        enterSelect(item.id);
      }, 480);
    });
    function cancelHold() {
      window.clearTimeout(holdTimer);
      holdTimer = 0;
    }
    btn.addEventListener("pointerup", cancelHold);
    btn.addEventListener("pointercancel", cancelHold);
    btn.addEventListener("click", function (ev) {
      ev.preventDefault();
      if (holdFired) {
        holdFired = false;
        return;
      }
      if (selectMode) {
        togglePick(item.id);
        return;
      }
      if (item.kind === "todo") {
        askDone(item);
        return;
      }
      openGameLayer(item.id);
    });
    return btn;
  }

  function paintPlus() {
    if (!feed || openGame) return;
    const old = feed.querySelector(".tile-add");
    if (old) old.remove();
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "tile tile-add";
    btn.dataset.id = "__plus__";
    btn.setAttribute("aria-label", "佔位框");
    const plus = document.createElement("span");
    plus.className = "tile-plus";
    plus.innerHTML = PLUS;
    btn.appendChild(plus);
    btn.addEventListener("click", function (ev) {
      ev.preventDefault();
      openNewGame();
    });
    feed.appendChild(btn);
  }

  function paintModes() {
    const bar = document.getElementById("mode-bar");
    if (!bar) return;
    bar.querySelectorAll(".mode-btn").forEach(function (el) {
      el.classList.toggle("is-on", el.dataset.mode === hostTab);
    });
  }

  function paintLayer() {
    const onShelf = !openGame;
    const onChat = !onShelf && hostTab.indexOf("chat:") === 0;
    const onTodo = !onShelf && hostTab === "todo";
    if (hall) {
      hall.classList.toggle("is-chat", onChat);
      hall.classList.toggle("is-todo", onTodo);
    }
    document.documentElement.classList.toggle("is-chat", onChat);
    document.documentElement.classList.toggle("is-todo", onTodo);
    const pane = document.getElementById("homeChat");
    const list = document.getElementById("todoList");
    if (pane) pane.hidden = !onChat;
    if (list) list.hidden = !onTodo;
    if (feed) feed.hidden = !onShelf;
    if (shelfBack) shelfBack.hidden = onShelf;
    const gear = document.getElementById("chat-settings");
    if (gear) gear.hidden = !onChat;
  }

  function pickTab(tab) {
    if (tab === "add-chat") {
      addChatRoom();
      return;
    }
    hostTab = tab || (openGame ? "todo" : "play");
    if (hostTab.indexOf("chat:") === 0) {
      chatId = hostTab.slice(5) || "1";
    }
    clearSelect();
    paintModes();
    paintLayer();
    if (hostTab.indexOf("chat:") === 0) loadChatHistory();
    else if (hostTab === "todo") loadShelf();
    else loadShelf();
  }

  function ensureModes() {
    const bar = document.getElementById("mode-bar");
    if (!bar) return;
    bar.innerHTML = "";
    bar.hidden = false;
    if (tagBoard) tagBoard.hidden = false;
    const buttons = [];
    if (!openGame) {
      buttons.push(["play", "遊戲"]);
    } else {
      buttons.push(["todo", "待辦"]);
      rooms.forEach(function (room, i) {
        buttons.push(["chat:" + room.id, "紀錄" + (i + 1)]);
      });
      if (rooms.length < 3) buttons.push(["add-chat", "+"]);
    }
    buttons.forEach(function (pair) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "mode-btn" + (hostTab === pair[0] ? " is-on" : "");
      btn.dataset.mode = pair[0];
      btn.textContent = pair[1];
      btn.addEventListener("click", function () { pickTab(pair[0]); });
      bar.appendChild(btn);
    });
    if (shelfBack) shelfBack.hidden = !openGame;
    ensureChatGear();
  }

  function firstGameId() {
    const ids = Object.keys(catalog).filter(function (id) {
      return catalog[id] && catalog[id].kind === "game";
    });
    return openGame || ids[0] || "";
  }

  async function openGameLayer(id) {
    if (!id) return;
    openGame = id;
    chatGame = id;
    clearSelect();
    const memo = await window.FamiGate.api("/api/memory?game=" + encodeURIComponent(id), key, { timeout: 15000 });
    rooms = ((memo.j && memo.j.chats) || []).slice();
    if (!rooms.length) rooms = [{ id: "1" }];
    chatId = rooms[0].id;
    hostTab = "chat:" + chatId;
    ensureModes();
    paintLayer();
    loadChatHistory();
  }

  function closeGameLayer() {
    openGame = "";
    hostTab = "play";
    rooms = [];
    chatId = "1";
    ensureModes();
    paintLayer();
    loadShelf();
  }

  function closeAct() {
    const mask = document.getElementById("actMask");
    if (mask) mask.hidden = true;
  }

  function bindMaskClose(maskId, closeFn) {
    const mask = document.getElementById(maskId);
    if (!mask) return;
    if (window.FamiGate && window.FamiGate.lockSheetPage) window.FamiGate.lockSheetPage(mask);
    let down = false;
    mask.addEventListener("pointerdown", function (ev) { down = ev.target === mask; });
    mask.addEventListener("pointerup", function (ev) {
      if (down && ev.target === mask) closeFn();
      down = false;
    });
  }

  function chatImgUrl(id) {
    return window.FamiGate.origin() + "/guide-img?id=" + encodeURIComponent(id) + "&game=" + encodeURIComponent(chatGame) + "&k=" + encodeURIComponent(key);
  }

  function fillTalk(el, text) {
    const parts = String(text || "").split(/(https?:\/\/[^\s<>]+)/g);
    parts.forEach(function (part, i) {
      if (i % 2 === 1) {
        const a = document.createElement("a");
        a.href = part;
        a.target = "_blank";
        a.rel = "noopener noreferrer";
        a.textContent = part;
        el.appendChild(a);
      } else if (part) {
        el.appendChild(document.createTextNode(part));
      }
    });
  }

  function chatLine(text, who, images, kind) {
    const logEl = document.getElementById("playLog");
    if (!logEl) return null;
    const wrap = document.createElement("div");
    wrap.className = "play-line is-" + who + (kind ? " is-" + kind : "");
    const bubble = document.createElement("div");
    bubble.className = "play-bubble";
    if (text) {
      const p = document.createElement("p");
      fillTalk(p, text);
      bubble.appendChild(p);
    }
    (images || []).forEach(function (im) {
      const img = document.createElement("img");
      img.className = "play-shot";
      img.alt = im.caption || "";
      img.src = chatImgUrl(im.id);
      img.addEventListener("load", function () { img.classList.add("is-on"); });
      bubble.appendChild(img);
      if (im.caption) {
        const cap = document.createElement("span");
        cap.className = "play-shot-cap";
        cap.textContent = im.caption;
        bubble.appendChild(cap);
      }
    });
    wrap.appendChild(bubble);
    logEl.appendChild(wrap);
    logEl.scrollTop = logEl.scrollHeight;
    return wrap;
  }

  function jobText(phase, pct) {
    const label = phase || "找攻略中…";
    return (pct === 0 || pct) ? label + " " + pct + "%" : label;
  }

  function sameQ(a, b) {
    return String(a || "").trim() === String(b || "").trim();
  }

  function lookReady(job, turns, from, q) {
    const list = turns || [];
    const fresh = list.slice(from);
    const hit = q
      ? fresh.some(function (t) { return t && t.a && sameQ(t.q, q); })
      : fresh.some(function (t) { return t && t.a; });
    if (hit) return true;
    if (job.state === "failed" && (!job.q || !q || sameQ(job.q, q))) return true;
    if (q && job.q && sameQ(job.q, q) && job.state === "done" && list.length > from) {
      const last = list[list.length - 1];
      if (last && last.a && sameQ(last.q, q)) return true;
    }
    return false;
  }

  function scrubJobBubbles() {
    const logEl = document.getElementById("playLog");
    if (!logEl) return;
    logEl.querySelectorAll(".play-line.is-job").forEach(function (el) { el.remove(); });
  }

  function showLook(phase, pct) {
    const waitEl = document.getElementById("playWait");
    const waitBar = document.getElementById("playWaitBar");
    const jobEl = document.getElementById("playJob");
    const text = jobText(phase, pct);
    scrubJobBubbles();
    if (jobEl) jobEl.textContent = text;
    if (waitEl) {
      waitEl.hidden = false;
      waitEl.setAttribute("aria-label", text);
    }
    if (window.PalMark && waitBar) window.PalMark.mountBar(waitBar);
  }

  function hideLook() {
    const waitEl = document.getElementById("playWait");
    scrubJobBubbles();
    if (waitEl) waitEl.hidden = true;
  }

  function chatQuery() {
    return "game=" + encodeURIComponent(chatGame || openGame) + "&chat=" + encodeURIComponent(chatId || "1");
  }

  async function loadChatHistory() {
    const logEl = document.getElementById("playLog");
    if (!logEl) return;
    logEl.innerHTML = "";
    const x = await window.FamiGate.api("/api/memory?" + chatQuery(), key, { timeout: 15000 });
    if (x.j && x.j.chats) rooms = x.j.chats.slice();
    const turns = (x.j && x.j.turns) || [];
    if (!turns.length) {
      chatLine("跟我說你卡在哪。地圖、門、道具、敵人，需要圖我會貼給你。", "pal");
    }
    turns.forEach(function (t) {
      if (t.q) chatLine(t.q, "me");
      if (t.a || (t.images && t.images.length)) chatLine(t.a || "", "pal", t.images);
    });
    paintedTurns = turns.length;
    const job = (x.j && x.j.job) || {};
    if (job.state === "running" && lookLive === 0) {
      showLook(job.phase || "找攻略中…", job.progress);
      setLookRun(true);
      watchLook(job.q || "", paintedTurns);
    }
  }

  function setLookRun(on) {
    lookLive = on ? 1 : 0;
    setCabRun(!!on);
    setJobRun(document.querySelector('.settings-entry[data-job="queue"]'), !!on);
  }

  function paintFresh(turns, q) {
    if (paintedTurns >= turns.length) {
      return;
    }
    for (let i = paintedTurns; i < turns.length; i++) {
      const t = turns[i];
      if (t && (t.a || (t.images && t.images.length))) chatLine(t.a || "", "pal", t.images);
    }
    paintedTurns = turns.length;
  }

  function sleep(ms) {
    return new Promise(function (resolve) { window.setTimeout(resolve, ms); });
  }

  async function watchLook(q, from) {
    const seq = ++lookSeq;
    const start = Date.now();
    let misses = 0;
    try {
      while (Date.now() - start < 210000) {
        if (seq !== lookSeq) return;
        try {
          const x = await window.FamiGate.api("/api/memory?" + chatQuery(), key, { timeout: 20000 });
          if (seq !== lookSeq) return;
          misses = 0;
          const job = (x.j && x.j.job) || {};
          const turns = (x.j && x.j.turns) || [];
          if (job.state === "running") {
            showLook(job.phase || "找攻略中…", job.progress);
          }
          if (lookReady(job, turns, from, q)) {
            hideLook();
            paintFresh(turns, q);
            return;
          }
        } catch (err) {
          misses += 1;
          if (misses >= 12) throw err;
        }
        if (seq !== lookSeq) return;
        await sleep(1500);
      }
      chatLine("家裡還沒回。再試一次。", "pal");
    } catch (e) {
      chatLine("家裡還沒回。再試一次。", "pal");
    } finally {
      if (seq === lookSeq) {
        hideLook();
        setLookRun(false);
        chatBusy = false;
      }
    }
  }

  async function sendChat() {
    if (chatBusy) return;
    const input = document.getElementById("playInput");
    const text = ((input && input.value) || "").trim();
    if (!text) return;
    chatBusy = true;
    if (input) input.value = "";
    chatLine(text, "me");
    showLook("找攻略中…", 8);
    setLookRun(true);
    const from = paintedTurns;
    try {
      const x = await window.FamiGate.api("/api/chat", key, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ game: chatGame || openGame, chat: chatId || "1", text: text }),
        timeout: 45000,
      });
      if (x.j && x.j.pending) {
        const job = x.j.job || {};
        showLook(job.phase || "找攻略中…", job.progress == null ? 28 : job.progress);
        watchLook(text, from);
        return;
      }
      const reply = (x.j && x.j.reply) || (x.j && x.j.error) || "這回合沒問到";
      chatLine(reply, "pal", (x.j && x.j.images) || []);
      hideLook();
      setLookRun(false);
      chatBusy = false;
    } catch (e) {
      chatLine("家裡還沒回。再試一次。", "pal");
      hideLook();
      setLookRun(false);
      chatBusy = false;
    }
  }

  function stayOverlayUrl(n) {
    const raw = (location.hash || "").replace(/^#/, "").replace(/&?stay=\d+/g, "").replace(/&$/, "");
    return location.pathname + location.search + "#" + (raw ? raw + "&stay=" + n : "stay=" + n);
  }

  function cleanOverlayUrl() {
    const raw = (location.hash || "").replace(/^#/, "").replace(/&?stay=\d+/g, "").replace(/&$/, "");
    return location.pathname + location.search + (raw ? "#" + raw : "");
  }

  function padOverlay() {
    if (!readerOpen) return;
    try {
      readerStaySeq += 1;
      history.pushState({ famiReader: 1, n: readerStaySeq }, "", stayOverlayUrl(readerStaySeq));
      readerStaySeq += 1;
      history.pushState({ famiReader: 1, n: readerStaySeq }, "", stayOverlayUrl(readerStaySeq));
    } catch (e) {}
  }

  function closeReader() {
    const layer = document.getElementById("reader-layer");
    const frame = document.getElementById("reader-frame");
    readerOpen = false;
    document.documentElement.classList.remove("is-reading");
    if (layer) {
      layer.hidden = true;
      layer.classList.remove("is-live");
    }
    if (frame) {
      try { frame.src = "about:blank"; } catch (e) {}
    }
    try { history.replaceState({}, "", cleanOverlayUrl()); } catch (e) {}
    window.clearTimeout(readerReadyTimer);
  }

  function showReaderLive() {
    const layer = document.getElementById("reader-layer");
    if (!layer || !readerOpen) return;
    layer.classList.add("is-live");
    window.clearTimeout(readerReadyTimer);
    const hint = document.getElementById("reader-hint");
    if (hint) hint.hidden = true;
  }

  function openPlay(id, title) {
    const layer = document.getElementById("reader-layer");
    const frame = document.getElementById("reader-frame");
    if (!layer || !frame) {
      location.href = "./play.html?id=" + encodeURIComponent(id) + "&k=" + encodeURIComponent(key) + "#k=" + encodeURIComponent(key);
      return;
    }
    document.documentElement.classList.add("is-reading");
    layer.hidden = false;
    layer.classList.remove("is-live");
    const wasOpen = readerOpen;
    readerOpen = true;
    if (!wasOpen) padOverlay();
    frame.src = "./play.html?id=" + encodeURIComponent(id) + "&k=" + encodeURIComponent(key) + "#k=" + encodeURIComponent(key);
    window.setTimeout(function () {
      if (readerOpen) layer.classList.add("is-live");
    }, 400);
    if (title) {
      const hint = document.getElementById("reader-hint");
      const wait = hint && hint.querySelector(".read-wait");
      if (wait) wait.textContent = "打開陪玩";
      if (hint) hint.hidden = false;
    }
  }

  function openMap(id) {
    const gid = id || chatGame || openGame || "elden-ring";
    const layer = document.getElementById("reader-layer");
    const frame = document.getElementById("reader-frame");
    const href = "./map.html?v=16&id=" + encodeURIComponent(gid) + "&chat=" + encodeURIComponent(chatId || "1") + "&k=" + encodeURIComponent(key) + "#k=" + encodeURIComponent(key);
    if (!layer || !frame) {
      location.href = href;
      return;
    }
    document.documentElement.classList.add("is-reading");
    layer.hidden = false;
    layer.classList.remove("is-live");
    const wasOpen = readerOpen;
    readerOpen = true;
    if (!wasOpen) padOverlay();
    const hint = document.getElementById("reader-hint");
    const wait = hint && hint.querySelector(".read-wait");
    if (wait) wait.textContent = "打開地圖";
    if (hint) hint.hidden = false;
    frame.src = href;
    window.clearTimeout(readerReadyTimer);
    readerReadyTimer = window.setTimeout(showReaderLive, 15000);
  }

  function todoSub(item) {
    const bits = [];
    if (item.no_label) bits.push(item.no_label);
    if (item.step && item.steps) bits.push(item.step + "/" + item.steps);
    if (item.detail) bits.push(item.detail);
    return bits.join(" · ");
  }

  function todoRow(item) {
    catalog[item.id] = item;
    const row = document.createElement("div");
    row.className = "todo-row" + (item.done ? " is-done" : "");
    row.dataset.id = item.id;
    const mark = document.createElement("button");
    mark.type = "button";
    mark.className = "todo-mark";
    mark.setAttribute("aria-label", item.done ? "已完成" : "完成");
    mark.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6.5 12.5l3.5 3.5 7.5-8" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    if (!item.done) {
      mark.addEventListener("click", function (ev) {
        ev.preventDefault();
        ev.stopPropagation();
        askDone(item);
      });
    }
    const body = document.createElement("span");
    body.className = "todo-body";
    const title = document.createElement("span");
    title.className = "todo-title";
    title.textContent = item.step && item.steps
      ? (item.step + "/" + item.steps + " " + (item.title || ""))
      : (item.title || "");
    body.appendChild(title);
    const sub = todoSub(item);
    if (sub) {
      const line = document.createElement("span");
      line.className = "todo-sub";
      line.textContent = sub;
      body.appendChild(line);
    }
    row.appendChild(mark);
    row.appendChild(body);
    return row;
  }

  async function loadShelf() {
    const tab = openGame ? "todo" : "play";
    const gameQ = openGame ? "&game=" + encodeURIComponent(openGame) : "";
    const x = await window.FamiGate.api("/api/shelf?tab=" + encodeURIComponent(tab) + gameQ, key, { timeout: 20000 });
    if (!x.j) return;
    catalog = {};
    if (hostTab === "todo") {
      const list = document.getElementById("todoList");
      if (!list) return;
      list.innerHTML = "";
      const items = x.j.items || [];
      if (!items.length) {
        const empty = document.createElement("p");
        empty.className = "todo-empty";
        empty.textContent = "還沒有待辦。跟我說要排什麼，我會加進來。";
        list.appendChild(empty);
      } else {
        items.forEach(function (it) { list.appendChild(todoRow(it)); });
      }
      if (feed) feed.innerHTML = "";
      if (tagBoard) tagBoard.hidden = false;
      paintLayer();
      layoutStage();
      return;
    }
    if (!feed) return;
    feed.innerHTML = "";
    (x.j.items || []).forEach(function (it) { feed.appendChild(tileEl(it)); });
    paintPlus();
    if (tagBoard) tagBoard.hidden = false;
    paintPicks();
    paintLayer();
    layoutStage();
  }

  function fillAct(title, nodes) {
    const mask = document.getElementById("actMask");
    const head = document.getElementById("actTitle");
    const body = document.getElementById("actBody");
    if (head) head.textContent = title;
    if (body) {
      body.innerHTML = "";
      nodes.forEach(function (n) { body.appendChild(n); });
    }
    if (mask) mask.hidden = false;
  }

  async function openQueue() {
    const gid = firstGameId();
    const x = await window.FamiGate.api("/api/memory?game=" + encodeURIComponent(gid), key, { timeout: 15000 });
    const items = (x.j && x.j.todos) || [];
    const nodes = [];
    const form = document.createElement("form");
    form.className = "tag-picker-form";
    form.innerHTML = '<input class="tag-search-input" id="todoAdd" maxlength="80" placeholder="新的待辦"/><button type="submit" class="tag-apply"><span class="tag-apply-face">確認</span></button>';
    form.addEventListener("submit", async function (e) {
      e.preventDefault();
      const input = document.getElementById("todoAdd");
      const title = (input && input.value || "").trim();
      if (!title) return;
      await window.FamiGate.api("/api/todo", key, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ op: "add", game: gid, title: title }),
        timeout: 15000,
      });
      openQueue();
      if (hostTab === "todo") loadShelf();
      else if (openGame) loadShelf();
    });
    nodes.push(form);
    const job = (x.j && x.j.job) || {};
    if (job.state === "running" && job.phase) {
      const run = document.createElement("p");
      run.textContent = job.phase;
      nodes.push(run);
    }
    const note = document.createElement("p");
    note.textContent = items.length ? "待辦在「待辦」那一頁，一行一件。" : "還沒有待辦。";
    nodes.push(note);
    fillAct("工作佇列", nodes);
  }

  async function openMemory() {
    const gid = firstGameId();
    const x = await window.FamiGate.api("/api/memory?" + chatQuery(), key, { timeout: 15000 });
    const facts = (x.j && x.j.facts) || [];
    const nodes = [];
    const p = document.createElement("p");
    p.textContent = facts.length ? facts.join("\n") : "還沒記下進度。陪玩時說了會記得。";
    p.style.whiteSpace = "pre-wrap";
    nodes.push(p);
    fillAct("記憶", nodes);
  }

  function closeAsk() {
    const mask = document.getElementById("askMask");
    if (mask) mask.hidden = true;
    askTarget = "";
    askKind = "";
  }

  function showAsk(kind, id, message, destroy) {
    askKind = kind;
    askTarget = id;
    const mask = document.getElementById("askMask");
    const text = document.getElementById("askText");
    const yes = document.getElementById("askYes");
    const ok = document.getElementById("askOk");
    if (text) text.textContent = message;
    if (yes) yes.hidden = !destroy;
    if (ok) ok.hidden = !!destroy;
    if (mask) mask.hidden = false;
  }

  function askDone(item) {
    showAsk("todo", item.id, "這件事已完成?", false);
  }

  function askTrashGames() {
    if (!selected.size) return;
    showAsk("del-game", "", "刪掉這款遊戲?", true);
  }

  function askDeleteChat() {
    showAsk("del-chat", chatId, "刪掉這個紀錄? 地圖進度也會一起刪。", true);
  }

  function askArchiveChat() {
    showAsk("archive", chatId, "把這個紀錄的對話收進封存?", false);
  }

  function ensureChatGear() {
    const host = document.getElementById("chat-settings");
    if (!host) return;
    if (chatGearWrap && chatGearWrap.isConnected) {
      host.hidden = hostTab.indexOf("chat:") !== 0;
      return;
    }
    chatGearWrap = host;
    host.innerHTML = "";
    const toggle = insButton("settings-toggle", GEAR, "設定");
    toggle.setAttribute("aria-expanded", "false");
    const menu = document.createElement("div");
    menu.className = "settings-menu";
    menu.setAttribute("role", "menu");
    menu.hidden = true;
    function row(svg, label, job, onClick) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "settings-entry";
      btn.dataset.job = job;
      btn.appendChild(jobBadge(svg));
      const text = document.createElement("span");
      text.textContent = label;
      btn.appendChild(text);
      btn.addEventListener("click", function () {
        closeSettings();
        onClick();
      });
      return btn;
    }
    menu.appendChild(row(MAP, "地圖", "map", function () { openMap(chatGame || openGame); }));
    menu.appendChild(row(TRASH, "刪除", "drop-chat", askDeleteChat));
    menu.appendChild(row(MEM, "封存", "archive-chat", askArchiveChat));
    menu.appendChild(row(CAMERA, "拍照", "shot", takeShot));
    toggle.addEventListener("click", function (ev) {
      ev.preventDefault();
      ev.stopPropagation();
      const open = menu.hidden;
      if (open) {
        const catcher = ensureSettingsCatch();
        catcher.hidden = false;
        document.body.appendChild(menu);
        menu.hidden = false;
        document.documentElement.classList.add("settings-open");
        requestAnimationFrame(function () { placeSettingsMenu(toggle, menu); });
      } else closeSettings();
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      toggle.classList.toggle("is-live", open);
    });
    host.appendChild(toggle);
    host.appendChild(menu);
    host.hidden = hostTab.indexOf("chat:") !== 0;
  }

  function openNewGame() {
    const form = document.createElement("form");
    form.className = "tag-picker-form";
    form.innerHTML = '<input class="tag-search-input" id="gameAdd" maxlength="40" placeholder="遊戲名"/><button type="submit" class="tag-apply"><span class="tag-apply-face">確認</span></button>';
    form.addEventListener("submit", async function (e) {
      e.preventDefault();
      const input = document.getElementById("gameAdd");
      const title = ((input && input.value) || "").trim();
      if (!title) return;
      await window.FamiGate.api("/api/game", key, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ op: "add", title: title }),
        timeout: 15000,
      });
      closeAct();
      loadShelf();
    });
    fillAct("新遊戲", [form]);
  }

  async function addChatRoom() {
    if (!openGame || rooms.length >= 3) return;
    const x = await window.FamiGate.api("/api/room", key, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ op: "add", game: openGame }),
      timeout: 15000,
    });
    rooms = ((x.j && x.j.chats) || rooms).slice();
    const nid = (x.j && x.j.id) || (rooms[rooms.length - 1] && rooms[rooms.length - 1].id);
    if (nid) {
      chatId = nid;
      hostTab = "chat:" + nid;
    }
    ensureModes();
    paintLayer();
    loadChatHistory();
  }

  async function afterRoomChange(x) {
    rooms = ((x.j && x.j.chats) || []).slice();
    if (!rooms.length) {
      hostTab = "todo";
      chatId = "1";
      ensureModes();
      paintLayer();
      loadShelf();
      return;
    }
    const still = rooms.some(function (r) { return r.id === chatId; });
    if (!still) chatId = rooms[0].id;
    hostTab = "chat:" + chatId;
    ensureModes();
    paintLayer();
    loadChatHistory();
  }

  async function takeShot() {
    if (!openGame) return;
    const entry = document.querySelector('.settings-entry[data-job="shot"]');
    setJobRun(entry, true);
    setCabRun(true);
    try {
      await window.FamiGate.api("/api/shot", key, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ game: openGame }),
        timeout: 20000,
      });
    } finally {
      setJobRun(entry, false);
      setCabRun(false);
    }
  }

  async function loadShelfSafe() {
    try { await loadShelf(); } catch (e) {}
  }

  function refreshOrigin() {
    return fetch("./config.js?t=" + Date.now(), { cache: "no-store" })
      .then(function (r) { return r.text(); })
      .then(function (text) {
        const m = /VAULT_ORIGIN\s*=\s*"(https?:\/\/[^"]+)"/.exec(text);
        if (m) window.VAULT_ORIGIN = m[1];
      })
      .catch(function () {});
  }

  function scheduleReconnect() {
    if (ready || bootTimer) return;
    bootTimer = window.setTimeout(function () {
      bootTimer = 0;
      refreshOrigin().then(boot);
    }, 12000);
  }

  async function boot() {
    if (booting || ready) return;
    booting = true;
    window.FamiGate.blockWebChrome();
    window.FamiGate.bindKeyboard();
    setBoot(true, "正在連接遊戲櫃…");
    key = window.GAMEPAL_VIEW_KEY || window.FamiGate.currentKey();
    if (window.GAMEPAL_FORCE_INVITE) key = window.GAMEPAL_URL_KEY || "";
    try {
      if (!window.FamiGate.origin()) {
        if (statusEl) statusEl.textContent = "維護中,請5分鐘後再試";
        scheduleReconnect();
        return;
      }
      await window.FamiGate.api("/api/public", "", { timeout: 8000 }).catch(function () { return null; });
      if (!key) {
        setBoot(false);
        if (window.GAMEPAL_FORCE_INVITE || window.GAMEPAL_URL_KEY) showInvite();
        else if (statusEl) statusEl.textContent = "請用邀請連結打開";
        return;
      }
      const x = await window.FamiGate.api("/api/door", key, { timeout: 20000 });
      if (!x.res || !x.res.ok || !x.j) {
        if (statusEl) statusEl.textContent = "維護中,請5分鐘後再試";
        scheduleReconnect();
        return;
      }
      if (x.j.kind === "invite") {
        setBoot(false);
        showInvite();
        if (statusEl) statusEl.textContent = "";
        return;
      }
      hideInvite();
      const blobs = document.querySelector(".blobs");
      if (blobs) blobs.hidden = true;
      window.FamiGate.savePersonal(key);
      window.FamiGate.pinKey(key);
      renderMe(x.j.reader);
      ensureModes();
      setBoot(false, "");
      if (statusEl) statusEl.textContent = "";
      pickTab(hostTab);
      ready = true;
      if (typeof navigator.standalone === "boolean" && !navigator.standalone) {
        const seen = localStorage.getItem("gamepal.installed");
        if (!seen && homeInstall) homeInstall.hidden = false;
      }
    } catch (e) {
      if (statusEl) statusEl.textContent = "維護中,請5分鐘後再試";
      scheduleReconnect();
    } finally {
      booting = false;
    }
  }

  if (goBtn) goBtn.addEventListener("click", function () {
    if (busy) return;
    if (window.FamiGate.needsSafari()) return;
    goBtn.hidden = true;
    if (!nameForm || !nameInput) return;
    nameForm.hidden = false;
    nameInput.readOnly = true;
    nameInput.addEventListener("touchend", function once(ev) {
      if (Math.hypot(ev.changedTouches[0].clientX - (this._x || 0), ev.changedTouches[0].clientY - (this._y || 0)) > 12) return;
      nameInput.readOnly = false;
      nameInput.focus();
    });
    nameInput.addEventListener("touchstart", function (ev) {
      this._x = ev.touches[0].clientX;
      this._y = ev.touches[0].clientY;
    });
    setTimeout(function () {
      nameInput.readOnly = false;
      nameInput.focus();
    }, 50);
  });

  if (nameForm) nameForm.addEventListener("submit", async function (e) {
    e.preventDefault();
    if (busy) return;
    const inviteKey = window.GAMEPAL_URL_KEY || window.FamiGate.currentKey();
    if (!inviteKey) {
      if (nameErr) nameErr.textContent = "請用邀請連結打開";
      return;
    }
    busy = true;
    startWait();
    const name = (nameInput.value || "").trim();
    try {
      const x = await window.FamiGate.api("/api/invite/name", inviteKey, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name }),
        timeout: 20000,
      });
      if (!x.res.ok || !x.j || !x.j.token) {
        nameErr.textContent = (x.j && x.j.error) || "請再試一次";
        waitEl.hidden = true;
        nameForm.hidden = false;
        busy = false;
        return;
      }
      window.FamiGate.savePersonal(x.j.token);
      location.href = "./index.html?k=" + encodeURIComponent(x.j.token) + "#k=" + encodeURIComponent(x.j.token);
    } catch (err) {
      nameErr.textContent = "家裡還沒開";
      waitEl.hidden = true;
      nameForm.hidden = false;
      busy = false;
    }
  });

  const homeInstalled = document.getElementById("home-installed");
  if (homeInstalled) homeInstalled.addEventListener("click", function () {
    try { localStorage.setItem("gamepal.installed", "1"); } catch (e) {}
    if (homeInstall) homeInstall.hidden = true;
  });

  if (coverInput) coverInput.addEventListener("change", async function () {
    const file = coverInput.files && coverInput.files[0];
    if (!file) return;
    const entry = document.querySelector('.settings-entry[data-job="cover"]');
    setJobRun(entry, true);
    setCabRun(true);
    try {
      const fd = new FormData();
      fd.append("cover", file);
      await fetch(window.FamiGate.origin() + "/api/cover?k=" + encodeURIComponent(key), { method: "POST", body: fd });
      const door = await window.FamiGate.api("/api/door", key, { timeout: 15000 });
      if (door.j && door.j.reader) renderMe(door.j.reader);
    } finally {
      setJobRun(entry, false);
      setCabRun(false);
      coverInput.value = "";
    }
  });

  if (backdropInput) backdropInput.addEventListener("change", async function () {
    const file = backdropInput.files && backdropInput.files[0];
    if (!file) return;
    const entry = document.querySelector('.settings-entry[data-job="backdrop"]');
    setJobRun(entry, true);
    showWaitCard("更換背景中");
    try {
      const fd = new FormData();
      fd.append("backdrop", file);
      await fetch(window.FamiGate.origin() + "/api/backdrop?k=" + encodeURIComponent(key), { method: "POST", body: fd });
      const door = await window.FamiGate.api("/api/door", key, { timeout: 15000 });
      if (door.j && door.j.reader) renderMe(door.j.reader);
    } finally {
      setJobRun(entry, false);
      hideWaitCard();
      backdropInput.value = "";
    }
  });

  const playForm = document.getElementById("playForm");
  if (playForm) playForm.addEventListener("submit", function (e) {
    e.preventDefault();
    sendChat();
  });
  const actClose = document.getElementById("actClose");
  if (actClose) actClose.addEventListener("click", closeAct);
  bindMaskClose("actMask", closeAct);
  bindMaskClose("askMask", closeAsk);
  const askNo = document.getElementById("askNo");
  const askYes = document.getElementById("askYes");
  const askOk = document.getElementById("askOk");
  if (askNo) askNo.addEventListener("click", closeAsk);
  async function finishAsk() {
    const kind = askKind;
    const target = askTarget;
    const ids = Array.from(selected);
    closeAsk();
    if (kind === "todo" && target) {
      await window.FamiGate.api("/api/todo", key, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ op: "done", id: target, done: true }),
        timeout: 15000,
      });
      loadShelfSafe();
      return;
    }
    if (kind === "archive" && openGame && target) {
      const x = await window.FamiGate.api("/api/room", key, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ op: "archive", game: openGame, chat: target }),
        timeout: 20000,
      });
      afterRoomChange(x);
      return;
    }
    if (kind === "del-chat" && openGame && target) {
      const x = await window.FamiGate.api("/api/room", key, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ op: "delete", game: openGame, chat: target }),
        timeout: 15000,
      });
      afterRoomChange(x);
      return;
    }
    if (kind === "del-game") {
      for (let i = 0; i < ids.length; i++) {
        await window.FamiGate.api("/api/game", key, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ op: "delete", id: ids[i] }),
          timeout: 15000,
        });
      }
      clearSelect();
      loadShelf();
    }
  }
  if (askOk) askOk.addEventListener("click", finishAsk);
  if (askYes) askYes.addEventListener("click", finishAsk);
  if (shelfBack) shelfBack.addEventListener("click", function (ev) {
    ev.preventDefault();
    closeGameLayer();
  });
  if (bookCoverInput) bookCoverInput.addEventListener("change", async function () {
    const file = bookCoverInput.files && bookCoverInput.files[0];
    if (!file || !selected.size) return;
    const btn = document.querySelector(".rail-cover");
    if (btn) btn.classList.add("is-run");
    showWaitCard("更換封面中");
    try {
      const ids = Array.from(selected);
      for (let i = 0; i < ids.length; i++) {
        const fd = new FormData();
        fd.append("cover", file, file.name || "cover.jpg");
        await fetch(window.FamiGate.origin() + "/api/game-cover?id=" + encodeURIComponent(ids[i]) + "&k=" + encodeURIComponent(key), { method: "POST", body: fd });
      }
    } finally {
      hideWaitCard();
      if (btn) btn.classList.remove("is-run");
      bookCoverInput.value = "";
      clearSelect();
      loadShelf();
    }
  });
  const readerBack = document.getElementById("reader-back");
  if (readerBack) readerBack.addEventListener("click", closeReader);
  window.addEventListener("message", function (ev) {
    if (ev.data && ev.data.gamepal === "close") closeReader();
    const kind = ev.data && ev.data.fami;
    if (kind === "reader-ready") showReaderLive();
    else if (kind === "reader-loading" && readerOpen) {
      const layer = document.getElementById("reader-layer");
      if (layer) layer.classList.remove("is-live");
      const hint = document.getElementById("reader-hint");
      if (hint) hint.hidden = false;
    }
  });
  window.addEventListener("popstate", function () {
    if (readerOpen) closeReader();
  });
  window.addEventListener("resize", layoutStage);
  if (feed || goBtn) boot();
})();

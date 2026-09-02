(function () {
  const q = new URLSearchParams(location.search);
  const key = window.FamiGate ? window.FamiGate.currentKey() : (q.get("k") || "");
  const gameId = q.get("id") || "elden-ring";
  const recordId = q.get("chat") || "1";
  const titleEl = document.getElementById("bookTitle");
  const chipsEl = document.getElementById("mapChips");
  const findEl = document.getElementById("mapFind");
  const hitsEl = document.getElementById("mapHits");
  const canvas = document.getElementById("mapCanvas");
  const hintEl = document.getElementById("mapHint");
  const menu = document.getElementById("readerSettingsMenu");
  const catcher = document.getElementById("readerSettingsCatch");
  const toggle = document.getElementById("configButton");
  const ctx = canvas.getContext("2d");
  const cache = new Map();
  const pointers = new Map();
  const MAP_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8.5 5.5l7-2 5 2.2v13.8l-5-2.2-7 2-5-2.2V5.5l5 2.2z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="M8.5 7.7v10.8M15.5 3.5v10.8" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>';
  const HASH = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10 4l-1.2 16M15.2 4l-1.2 16M4.5 9h15M4 15h15" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>';
  const TRASH = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 8V6.8A1.8 1.8 0 0 1 9.8 5h4.4A1.8 1.8 0 0 1 16 6.8V8M5 8h14M9 11v7M12 11v7M15 11v7M7 8l.8 12.2A1.6 1.6 0 0 0 9.4 22h5.2a1.6 1.6 0 0 0 1.6-1.8L17 8" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  const LIST = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 7h12M6 12h12M6 17h8" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>';
  const COLORS = [
    { hex: "#c13584", name: "粉" },
    { hex: "#d62976", name: "紅" },
    { hex: "#e8c56b", name: "金" },
    { hex: "#262626", name: "墨" },
    { hex: "#962fbf", name: "紫" },
    { hex: "#4f5bd5", name: "藍" }
  ];
  const markMenu = document.getElementById("markMenu");
  let pack = null;
  let layer = null;
  let cam = { x: 0, y: 0, s: 0.2 };
  let drag = null;
  let pinch = null;
  let hit = null;
  let markHit = null;
  let marks = [];
  let lastColor = COLORS[0].hex;
  let placing = false;
  let draft = null;
  let dropId = "";
  let penBtn = null;
  let lootOn = true;
  let shown = {};
  let doneIds = {};
  let hideDone = false;
  let pinHits = [];
  let focusSet = null;
  let hitRows = [];
  const NAME_SPAN_TILES = 16;
  const MARK_SCALE = 0.75;
  const NAME_FONT = "700 12px -apple-system, BlinkMacSystemFont, 'PingFang TC', 'Microsoft JhengHei', sans-serif";
  let drawQ = 0;
  let zoomLive = 0;
  let zoomWait = 0;
  let announced = false;

  function embedded() {
    try { return window.parent && window.parent !== window; } catch (e) { return false; }
  }

  function goBack() {
    if (embedded() && window.parent) {
      try { window.parent.postMessage({ gamepal: "close" }, "*"); } catch (e) {}
      return;
    }
    location.href = "./index.html?k=" + encodeURIComponent(key) + "#k=" + encodeURIComponent(key);
  }

  function closeMenu() {
    if (menu) menu.hidden = true;
    if (markMenu) markMenu.hidden = true;
    if (catcher) catcher.hidden = true;
    if (toggle) {
      toggle.setAttribute("aria-expanded", "false");
      toggle.classList.remove("is-live");
    }
    document.documentElement.classList.remove("settings-open");
  }

  function closeAct() {
    const mask = document.getElementById("actMask");
    if (mask) mask.hidden = true;
    draft = null;
  }

  function filterMask() {
    return document.getElementById("filterMask");
  }

  function wideMap() {
    return window.matchMedia("(min-width: 900px)").matches;
  }

  function filterChip() {
    return chipsEl ? chipsEl.querySelector(".mode-find") : null;
  }

  function syncFilterChip() {
    const btn = filterChip();
    const mask = filterMask();
    if (btn) btn.classList.toggle("is-on", !!(mask && !mask.hidden));
  }

  function closeFilter() {
    const mask = filterMask();
    if (!mask) return;
    mask.hidden = true;
    mask.classList.remove("is-dock");
    document.documentElement.classList.remove("tag-modal-open");
    syncFilterChip();
  }

  function openFilter() {
    const mask = filterMask();
    if (!mask) return;
    fillFilter();
    mask.hidden = false;
    if (wideMap()) mask.classList.add("is-dock");
    else {
      mask.classList.remove("is-dock");
      document.documentElement.classList.add("tag-modal-open");
    }
    syncFilterChip();
  }

  function closeAsk() {
    const mask = document.getElementById("askMask");
    if (mask) mask.hidden = true;
    dropId = "";
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

  function insButton(cls, svg, label) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "ins-icon " + cls;
    btn.setAttribute("aria-label", label);
    btn.innerHTML = '<span class="ins-ring"></span><span class="ins-face">' + svg + "</span>";
    return btn;
  }

  function applyMarks(j) {
    marks = (j && j.marks) || [];
    const c = (j && (j.color || j.mark_color)) || "";
    if (c) lastColor = c;
  }

  function applyProgress(j) {
    if (!j) return;
    if (Array.isArray(j.done)) {
      doneIds = {};
      j.done.forEach(function (id) {
        if (id) doneIds[String(id)] = true;
      });
    }
    if (j.hide_done != null) hideDone = !!j.hide_done;
  }

  async function saveProgress(body) {
    const x = await window.FamiGate.api("/api/map-marks", key, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(Object.assign({ op: "done", game: gameId, chat: recordId }, body)),
      timeout: 15000
    });
    if (x && x.j && x.j.ok) applyProgress(x.j);
    return x;
  }

  async function toggleDone(p) {
    if (!canCheck(p)) return;
    const id = pointKey(p);
    if (!id) return;
    const on = !isDone(p);
    if (on) doneIds[id] = true;
    else delete doneIds[id];
    draw();
    const x = await saveProgress({ id: id, done: on });
    if (!x || !x.j || !x.j.ok) {
      if (on) delete doneIds[id];
      else doneIds[id] = true;
      draw();
    }
  }

  function pointKey(p) {
    return p && p.id ? String(p.id) : "";
  }

  function isDone(p) {
    const id = pointKey(p);
    return !!(id && doneIds[id]);
  }

  function isFacility(p) {
    return !!(p && p.kind === "map-point");
  }

  function canCheck(p) {
    if (!p || !pointKey(p)) return false;
    if (p.kind === "grace" || p.kind === "map-point") return false;
    return true;
  }

  function notHiddenDone(p) {
    if (!canCheck(p) || !hideDone || !isDone(p)) return true;
    return p === hit || p === markHit;
  }

  function placeNamesOn() {
    const box = canvas.getBoundingClientRect();
    return box.width / cam.s <= NAME_SPAN_TILES * tileSize();
  }

  function layerMarks() {
    if (!layer) return [];
    return marks.filter(function (p) {
      return p.ui && p.layer === layer.id && notHiddenDone(p);
    });
  }

  function paintSwatch(btn, color, on) {
    btn.classList.toggle("is-on", !!on);
    if (on) {
      btn.style.background = "";
      btn.style.color = "";
      btn.style.borderColor = "";
      return;
    }
    btn.style.background = color;
    btn.style.borderColor = color;
    const n = parseInt(String(color || "").replace("#", ""), 16);
    const light = ((n >> 16) & 255) * 299 + ((n >> 8) & 255) * 587 + (n & 255) * 114;
    btn.style.color = light > 160000 ? "#262626" : "#fff";
  }

  function setPlacing(on) {
    placing = !!on;
    if (penBtn) penBtn.classList.toggle("is-live", placing);
    if (placing) {
      markHit = null;
      hit = null;
      closeMenu();
      hintEl.textContent = "點地圖放標記";
    } else if (!document.getElementById("actMask") || document.getElementById("actMask").hidden) {
      hintEl.textContent = (layer && layer.zh) || "";
    }
  }

  function isOwn(point) {
    return !!(point && point.id && marks.some(function (m) { return m.id === point.id; }));
  }

  function origin() {
    return window.FamiGate ? window.FamiGate.origin() : "";
  }

  function overviewScale() {
    const local = layer && Number(layer.overview_scale);
    if (local > 0) return local;
    const n = pack && pack.index && Number(pack.index.overview_scale);
    return n > 0 ? n : 4;
  }

  function assetRev() {
    return (pack && pack.index && pack.index.rev) || "";
  }

  function tileUrl(mapId, level, x, y) {
    return origin() + "/map-tile?game=" + encodeURIComponent(gameId) + "&map=" + mapId + "&level=" + level + "&x=" + x + "&y=" + y + "&k=" + encodeURIComponent(key) + "&rev=" + encodeURIComponent(assetRev());
  }

  function overviewUrl(file) {
    const name = String(file || "").split("/").pop();
    return origin() + "/map-overview?game=" + encodeURIComponent(gameId) + "&file=" + encodeURIComponent(name) + "&k=" + encodeURIComponent(key) + "&rev=" + encodeURIComponent(assetRev());
  }

  function requestDraw() {
    if (drawQ) return;
    drawQ = window.requestAnimationFrame(function () {
      drawQ = 0;
      draw();
    });
  }

  function noteZoom() {
    zoomLive = 1;
    window.clearTimeout(zoomWait);
    zoomWait = window.setTimeout(function () {
      zoomLive = 0;
      requestDraw();
    }, 140);
  }

  function hideLoader() {
    const el = document.getElementById("loaderContainer");
    if (el) el.classList.add("hidden");
  }

  function announceReady() {
    if (announced) return;
    announced = true;
    hideLoader();
    try { window.parent.postMessage({ fami: "reader-ready" }, location.origin); } catch (e) {}
  }

  function loadImg(url) {
    if (cache.has(url)) return cache.get(url);
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.decoding = "async";
    img.src = url;
    cache.set(url, img);
    return img;
  }

  function tileSize() {
    return (layer && layer.tile) || 256;
  }

  function worldH() {
    if (!layer) return 1;
    return (layer.y1 + 1) * tileSize();
  }

  function contentBox() {
    const tile = tileSize();
    const x0 = (layer.cx0 != null ? layer.cx0 : layer.x0) * tile;
    const y0 = (layer.cy0 != null ? layer.cy0 : layer.y0) * tile;
    const x1 = ((layer.cx1 != null ? layer.cx1 : layer.x1) + 1) * tile;
    const y1 = ((layer.cy1 != null ? layer.cy1 : layer.y1) + 1) * tile;
    return { x0: x0, y0: y0, x1: x1, y1: y1, w: x1 - x0, h: y1 - y0 };
  }

  function gameToCanvas(ui) {
    const h = worldH();
    return {
      x: ui.x * cam.s - cam.x,
      y: (h - ui.y) * cam.s - cam.y
    };
  }

  function canvasToGame(px, py) {
    const h = worldH();
    return {
      x: (px + cam.x) / cam.s,
      y: h - (py + cam.y) / cam.s
    };
  }

  function fitLayer() {
    const world = contentBox();
    const box = canvas.getBoundingClientRect();
    cam.s = Math.min(box.width / world.w, box.height / world.h);
    cam.x = world.x0 * cam.s - (box.width - world.w * cam.s) / 2;
    cam.y = (worldH() - world.y1) * cam.s - (box.height - world.h * cam.s) / 2;
  }

  function resize() {
    const box = canvas.getBoundingClientRect();
    const ratio = window.devicePixelRatio || 1;
    canvas.width = Math.max(1, Math.floor(box.width * ratio));
    canvas.height = Math.max(1, Math.floor(box.height * ratio));
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    draw();
  }

  function isShown(key) {
    return shown[key] !== false;
  }

  function officialKey(kind) {
    return kind === "grace" ? "grace" : "place";
  }

  function layerPoints() {
    if (!pack || !layer) return [];
    const hidingGrace = !!(focusLoot() && !hit && !markHit);
    return pack.points.filter(function (p) {
      if (!p.ui || p.layer !== layer.id || !isShown(officialKey(p.kind)) || !notHiddenDone(p)) return false;
      if (hidingGrace && p.kind === "grace") return false;
      return true;
    });
  }

  function layerPointsAll() {
    if (!pack || !layer) return [];
    return pack.points.filter(function (p) {
      return p.ui && p.layer === layer.id;
    });
  }

  function allLoot() {
    return (pack && pack.loot) || [];
  }

  function layerLootAll() {
    if (!layer) return [];
    return allLoot().filter(function (p) {
      return p.ui && p.layer === layer.id;
    });
  }

  function focusLoot() {
    if (!focusSet || !focusSet.points) return null;
    const rows = focusSet.points.filter(function (p) {
      return p && p.ui && (p.kind === "drop" || p.type_zh);
    });
    return rows.length ? rows : null;
  }

  function layerLoot() {
    if (!lootOn) return [];
    const focused = focusLoot();
    const rows = focused
      ? focused.filter(function (p) { return layer && p.layer === layer.id; })
      : layerLootAll();
    return rows.filter(function (p) {
      return isShown(p.type_zh || p.kind || "drop") && notHiddenDone(p);
    });
  }

  function iconUrl(file) {
    if (!file) return "";
    return origin() + "/map-icon?game=" + encodeURIComponent(gameId) + "&file=" + encodeURIComponent(file) + "&k=" + encodeURIComponent(key) + "&rev=" + encodeURIComponent(assetRev());
  }

  function markPin(p, pt, size) {
    const hitR = Math.max(size, 28);
    pinHits.push({ p: p, kind: "pin", x: pt.x - hitR / 2, y: pt.y - hitR / 2, w: hitR, h: hitR });
  }

  function drawIcon(p, pt, big) {
    const size = p.kind === "grace" ? (big ? 32 : 24) : (big ? 26 : 20);
    const url = iconUrl(p.icon);
    if (url) {
      const img = loadImg(url);
      if (img.complete && img.naturalWidth) {
        ctx.drawImage(img, pt.x - size / 2, pt.y - size / 2, size, size);
        markPin(p, pt, size);
        return;
      }
      img.onload = requestDraw;
    }
    ctx.beginPath();
    ctx.fillStyle = p.color || (p.kind === "grace" ? "#e8c56b" : "#c13584");
    ctx.arc(pt.x, pt.y, big ? 6 : 4, 0, Math.PI * 2);
    ctx.fill();
    markPin(p, pt, size);
  }

  function pointLabel(p) {
    const name = (p && (p.name || (p.names && p.names[0]))) || "";
    const kind = (p && p.type_zh) || "";
    if (kind && kind !== name) return kind + "　" + name;
    return name;
  }

  function nameBox(pt, text, withCheck) {
    ctx.font = NAME_FONT;
    ctx.textBaseline = "top";
    const padX = 7;
    const padY = withCheck ? 5 : 3;
    const mark = withCheck ? 22 * MARK_SCALE : 0;
    const gap = withCheck ? 6 * MARK_SCALE : 0;
    const tw = ctx.measureText(text).width;
    const th = 12;
    const x = Math.round(pt.x + 10);
    const y = Math.round(pt.y - 8 - th);
    return {
      x: x - padX,
      y: y - padY,
      w: mark + gap + tw + padX * 2,
      h: Math.max(th + padY * 2, withCheck ? 22 * MARK_SCALE : th + padY * 2),
      tx: x + mark + gap,
      ty: y,
      mx: x + mark / 2,
      my: y + th / 2
    };
  }

  function drawTodoMark(x, y, on) {
    const r = 11 * MARK_SCALE;
    ctx.beginPath();
    if (on) {
      ctx.fillStyle = "#34c759";
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 2.2 * MARK_SCALE;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();
      ctx.moveTo(x - 5 * MARK_SCALE, y + 0.5 * MARK_SCALE);
      ctx.lineTo(x - 1.5 * MARK_SCALE, y + 4 * MARK_SCALE);
      ctx.lineTo(x + 5.5 * MARK_SCALE, y - 4 * MARK_SCALE);
      ctx.stroke();
    } else {
      ctx.strokeStyle = "#c7c7cc";
      ctx.lineWidth = 1.6 * MARK_SCALE;
      ctx.arc(x, y, r - 0.8 * MARK_SCALE, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  function boxesOverlap(a, b) {
    return !(a.x + a.w < b.x || b.x + b.w < a.x || a.y + a.h < b.y || b.y + b.h < a.y);
  }

  function drawNameTag(pt, text, used, point) {
    if (!text) return null;
    const showCheck = !!(point && canCheck(point) && (point === hit || point === markHit));
    const box = nameBox(pt, text, showCheck);
    if (used && used.some(function (row) { return boxesOverlap(box, row); })) return null;
    ctx.fillStyle = "#000";
    ctx.fillRect(box.x, box.y, box.w, box.h);
    if (showCheck) {
      const hitR = 14 * MARK_SCALE;
      drawTodoMark(box.mx, box.my, isDone(point));
      pinHits.push({ p: point, kind: "check", x: box.mx - hitR, y: box.my - hitR, w: hitR * 2, h: hitR * 2 });
    }
    if (point) {
      pinHits.push({ p: point, kind: "body", x: box.x, y: box.y, w: box.w, h: box.h });
    }
    ctx.fillStyle = "#fff";
    ctx.font = NAME_FONT;
    ctx.textBaseline = "top";
    ctx.fillText(text, box.tx, box.ty);
    if (used) used.push(box);
    return box;
  }

  function drawPin(p, pt, big) {
    if (p.icon) {
      drawIcon(p, pt, big);
      return;
    }
    ctx.beginPath();
    ctx.fillStyle = p.color || (p.kind === "grace" ? "#e8c56b" : "#c13584");
    ctx.arc(pt.x, pt.y, big ? 7 : 4, 0, Math.PI * 2);
    ctx.fill();
    markPin(p, pt, big ? 28 : 24);
  }

  function drawOverview() {
    if (!layer.overview) return;
    const img = loadImg(overviewUrl(layer.overview));
    if (!img.complete || !img.naturalWidth) {
      img.onload = requestDraw;
      return;
    }
    const scale = overviewScale();
    const gameW = img.naturalWidth * scale;
    const gameH = img.naturalHeight * scale;
    ctx.drawImage(img, -cam.x, (worldH() - gameH) * cam.s - cam.y, gameW * cam.s, gameH * cam.s);
  }

  function hitPin(px, py, kind) {
    for (let i = pinHits.length - 1; i >= 0; i--) {
      const row = pinHits[i];
      if (kind && row.kind !== kind) continue;
      if (px >= row.x && py >= row.y && px <= row.x + row.w && py <= row.y + row.h) return row;
    }
    return null;
  }

  function draw() {
    const box = canvas.getBoundingClientRect();
    ctx.clearRect(0, 0, box.width, box.height);
    if (!layer) return;
    pinHits = [];
    const tile = layer.tile || 256;
    const h = (layer.y1 + 1) * tile;
    const namesOn = placeNamesOn();
    drawOverview();
    if (cam.s > 0.45 && !zoomLive) {
      const a = canvasToGame(0, 0);
      const b = canvasToGame(box.width, box.height);
      const x0 = Math.max(layer.x0, Math.floor(Math.min(a.x, b.x) / tile) - 1);
      const x1 = Math.min(layer.x1, Math.ceil(Math.max(a.x, b.x) / tile) + 1);
      const y0 = Math.max(layer.y0, Math.floor(Math.min(a.y, b.y) / tile) - 1);
      const y1 = Math.min(layer.y1, Math.ceil(Math.max(a.y, b.y) / tile) + 1);
      for (let x = x0; x <= x1; x++) {
        for (let y = y0; y <= y1; y++) {
          const img = loadImg(tileUrl(layer.map, 0, x, y));
          if (!img.complete || !img.naturalWidth) {
            img.onload = requestDraw;
            continue;
          }
          ctx.drawImage(img, x * tile * cam.s - cam.x, (h - (y + 1) * tile) * cam.s - cam.y, tile * cam.s, tile * cam.s);
        }
      }
    }
    layerPoints().forEach(function (p) {
      if (isFacility(p)) return;
      const pt = gameToCanvas(p.ui);
      if (pt.x < -24 || pt.y < -24 || pt.x > box.width + 24 || pt.y > box.height + 24) return;
      drawPin(p, pt, p === hit);
    });
    layerLoot().forEach(function (p) {
      const pt = gameToCanvas(p.ui);
      if (pt.x < -20 || pt.y < -20 || pt.x > box.width + 20 || pt.y > box.height + 20) return;
      drawIcon(p, pt, p === hit);
    });
    layerMarks().forEach(function (p) {
      const pt = gameToCanvas(p.ui);
      ctx.beginPath();
      ctx.fillStyle = p.color || lastColor;
      ctx.arc(pt.x, pt.y, p === markHit ? 8 : 6, 0, Math.PI * 2);
      ctx.fill();
      markPin(p, pt, 28);
    });
    const tagged = [];
    if (namesOn) {
      layerPoints().forEach(function (p) {
        if (!isFacility(p)) return;
        if (p === hit || p === markHit) return;
        const pt = gameToCanvas(p.ui);
        if (pt.x < 8 || pt.y < 8 || pt.x > box.width - 8 || pt.y > box.height - 8) return;
        drawNameTag(pt, p.name || pointLabel(p), tagged, p);
      });
    }
    const focus = markHit || hit;
    if (focus && focus.ui) {
      const pt = gameToCanvas(focus.ui);
      drawNameTag(pt, pointLabel(focus), null, focus);
    }
    if (focusSet) {
      paintFocusHint(focus && focusSet.points && focusSet.points.indexOf(focus) >= 0 ? focus : null);
    } else if (focus && focus.ui) {
      hintEl.textContent = pointLabel(focus);
    } else if (!placing) {
      hintEl.textContent = (layer && layer.zh) || "";
    }
    paintFilterTitle();
    if (layer.overview) {
      const ov = loadImg(overviewUrl(layer.overview));
      if (ov.complete && ov.naturalWidth) announceReady();
    } else {
      announceReady();
    }
  }

  function selectPoint(p) {
    if (!p) return;
    if (isOwn(p)) {
      markHit = p;
      hit = null;
    } else {
      markHit = null;
      hit = p;
    }
    if (focusSet && focusSet.points) {
      const i = focusSet.points.indexOf(p);
      if (i >= 0) {
        focusSet.i = i;
        paintHits(hitRows);
      }
    }
  }

  function nearestOf(rows, px, py, reach) {
    let best = null;
    let bestD = reach || 22;
    rows.forEach(function (p) {
      if (!p.ui) return;
      const pt = gameToCanvas(p.ui);
      const d = Math.hypot(pt.x - px, pt.y - py);
      if (d < bestD) {
        best = p;
        bestD = d;
      }
    });
    return best ? { row: best, d: bestD } : null;
  }

  function setLayer(id) {
    layer = (pack.index.layers || []).find(function (row) { return row.id === id; }) || pack.index.layers[0];
    Array.from(chipsEl.querySelectorAll(".mode-btn")).forEach(function (btn) {
      if (btn.dataset.id) btn.classList.toggle("is-on", btn.dataset.id === layer.id);
    });
    fitLayer();
    hit = null;
    markHit = null;
    hintEl.textContent = placing ? "點地圖放標記" : (layer.zh || "");
    draw();
  }

  function jumpTo(point) {
    if (!point || !point.ui) return;
    const box = canvas.getBoundingClientRect();
    cam.s = Math.max(cam.s, 0.8);
    const h = worldH();
    cam.x = point.ui.x * cam.s - box.width / 2;
    cam.y = (h - point.ui.y) * cam.s - box.height / 2;
    if (isOwn(point)) {
      markHit = point;
      hit = null;
    } else {
      markHit = null;
      hit = point;
    }
    hintEl.textContent = pointLabel(point);
    draw();
  }

  function namesOf(p) {
    const rows = (p.names || []).slice();
    if (p.name && rows.indexOf(p.name) < 0) rows.push(p.name);
    return rows;
  }

  function foldName(s) {
    const fw = "０１２３４５６７８９";
    let out = String(s || "");
    for (let i = 0; i < 10; i++) out = out.split(fw[i]).join(String(i));
    return out.replace(/[「」『』 \t・．·\[\]【】]/g, "");
  }

  function queryFold(qv) {
    return foldName(qv).replace(/(?:在哪裡?|哪裡|位置|怎麼打|怎打|怎麼去|怎麼進|怎麼到|怎麼拿|呢|嗎|啊)+$/g, "");
  }

  function exactHit(rows, qv) {
    const qf = queryFold(qv);
    if (!qf) return null;
    const hits = (rows || []).filter(function (row) { return foldName(row.name) === qf; });
    return hits.length === 1 ? hits[0] : null;
  }

  function nameScore(name, qv) {
    const nf = foldName(name);
    const qf = queryFold(qv);
    if (!nf || !qf) return 0;
    const qStem = qf.replace(/\d+$/, "");
    const nStem = nf.replace(/\d+$/, "");
    const qRank = (qf.match(/(\d+)$/) || [])[1] || "";
    const nRank = (nf.match(/(\d+)$/) || [])[1] || "";
    const at = String(qv).indexOf(name);
    const after = at >= 0 ? String(qv).charAt(at + name.length) : "";
    if ((at >= 0 && "0123456789０１２３４５６７８９".indexOf(after) < 0) || nf === qf) return 100;
    if (qRank && nStem === qStem && nRank === qRank) return 95;
    if (nf.length >= 2 && qf.indexOf(nf) >= 0) return 90;
    if (nf.indexOf(qf) === 0 || nStem === qf) return 80;
    if (nf.indexOf(qf) >= 0) return 50;
    if (qStem.length >= 2 && nf.indexOf(qStem) >= 0) return 40;
    return 0;
  }

  function allSearchPoints() {
    return (pack.points || []).concat(allLoot()).concat(marks).filter(function (p) { return p && p.ui; });
  }

  function findHits(qv) {
    if (!qv || !pack) return [];
    const groups = {};
    allSearchPoints().forEach(function (p) {
      namesOf(p).forEach(function (n) {
        const score = nameScore(n, qv);
        if (!score) return;
        const key = n;
        if (!groups[key] || score > groups[key].score) {
          groups[key] = { name: n, score: score, points: [] };
        }
      });
    });
    Object.keys(groups).forEach(function (key) {
      groups[key].points = allSearchPoints().filter(function (p) {
        return namesOf(p).indexOf(key) >= 0;
      });
    });
    return Object.keys(groups).map(function (k) { return groups[k]; }).sort(function (a, b) {
      if (b.score !== a.score) return b.score - a.score;
      return a.name.localeCompare(b.name, "zh-Hant");
    });
  }

  function sortNamedPoints(points) {
    const order = ((pack && pack.index && pack.index.layers) || []).map(function (row) { return row.id; });
    return points.slice().sort(function (a, b) {
      const la = order.indexOf(a.layer);
      const lb = order.indexOf(b.layer);
      if (la !== lb) return (la < 0 ? 99 : la) - (lb < 0 ? 99 : lb);
      if (!a.ui || !b.ui) return 0;
      if (b.ui.y !== a.ui.y) return b.ui.y - a.ui.y;
      return a.ui.x - b.ui.x;
    });
  }

  function fitPoints(points) {
    const here = (points || []).filter(function (p) {
      return p && p.ui && layer && p.layer === layer.id;
    });
    if (!here.length) return;
    if (here.length === 1) {
      jumpTo(here[0]);
      return;
    }
    const box = canvas.getBoundingClientRect();
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    here.forEach(function (p) {
      minX = Math.min(minX, p.ui.x);
      maxX = Math.max(maxX, p.ui.x);
      minY = Math.min(minY, p.ui.y);
      maxY = Math.max(maxY, p.ui.y);
    });
    const pad = Math.max(160, (maxX - minX) * 0.1, (maxY - minY) * 0.1);
    const w = Math.max(1, maxX - minX + pad * 2);
    const hgt = Math.max(1, maxY - minY + pad * 2);
    const mask = filterMask();
    const dock = (wideMap() && mask && !mask.hidden && mask.classList.contains("is-dock"))
      ? mask.getBoundingClientRect().width
      : 0;
    const viewW = Math.max(80, box.width - dock);
    cam.s = Math.min(1.4, Math.max(0.08, Math.min(viewW / w, box.height / hgt)));
    const cx = (minX + maxX) / 2;
    const cy = (minY + maxY) / 2;
    cam.x = cx * cam.s - (dock + viewW / 2);
    cam.y = (worldH() - cy) * cam.s - box.height / 2;
    hit = null;
    markHit = null;
  }

  function paintFocusHint(point) {
    if (!focusSet || !focusSet.points || !focusSet.points.length) return;
    const n = focusSet.points.length;
    const hereN = focusSet.points.filter(function (p) { return layer && p.layer === layer.id; }).length;
    const name = focusSet.name;
    if (point && n > 1) {
      const i = focusSet.points.indexOf(point);
      if (i >= 0) {
        hintEl.textContent = name + "　" + (i + 1) + "／" + n;
        return;
      }
    }
    if (n === 1) {
      hintEl.textContent = name;
      return;
    }
    if (hereN < n) {
      hintEl.textContent = name + "　" + ((layer && layer.zh) || "本圖") + hereN + "／共" + n + "處";
      return;
    }
    hintEl.textContent = name + "　共" + n + "處";
  }

  function pickHit(row) {
    if (!row || !row.points || !row.points.length) return;
    const points = sortNamedPoints(row.points);
    const same = !!(focusSet && focusSet.name === row.name);
    const key = points[0].type_zh || officialKey(points[0].kind);
    if (key && shown[key] === false) {
      shown[key] = true;
      fillFilter();
    }
    if (same && points.length > 1) {
      focusSet.points = points;
      focusSet.i = (focusSet.i + 1 + points.length) % points.length;
      const here = points[focusSet.i];
      if (here.layer && layer && here.layer !== layer.id) setLayer(here.layer);
      jumpTo(here);
      paintHits(hitRows);
      return;
    }
    focusSet = { name: row.name, points: points, i: -1 };
    const onLayer = points.filter(function (p) { return layer && p.layer === layer.id; });
    if (!onLayer.length && points[0].layer) setLayer(points[0].layer);
    if (points.length === 1) {
      focusSet.i = 0;
      jumpTo(points[0]);
    } else {
      fitPoints(points);
      draw();
    }
    paintHits(hitRows);
  }

  function paintHits(rows) {
    if (!hitsEl) return;
    hitRows = rows || [];
    hitsEl.innerHTML = "";
    if (!rows || !rows.length) {
      hitsEl.hidden = true;
      return;
    }
    rows.slice(0, 24).forEach(function (row) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "tag-chip" + (focusSet && focusSet.name === row.name ? " is-on" : "");
      if (focusSet && focusSet.name === row.name && focusSet.i >= 0 && row.points.length > 1) {
        btn.textContent = row.name + "　" + (focusSet.i + 1) + "／" + row.points.length;
      } else {
        btn.textContent = row.name + (row.points.length > 1 ? "　" + row.points.length + "處" : "");
      }
      btn.addEventListener("click", function () { pickHit(row); });
      hitsEl.appendChild(btn);
    });
    hitsEl.hidden = false;
  }

  function zoomAt(mx, my, next) {
    const before = canvasToGame(mx, my);
    cam.s = Math.min(3, Math.max(0.08, next));
    const after = gameToCanvas(before);
    cam.x += after.x - mx;
    cam.y += after.y - my;
  }

  function localXY(ev) {
    const box = canvas.getBoundingClientRect();
    return { x: ev.clientX - box.left, y: ev.clientY - box.top };
  }

  canvas.addEventListener("pointerdown", function (ev) {
    canvas.setPointerCapture(ev.pointerId);
    pointers.set(ev.pointerId, localXY(ev));
    if (pointers.size >= 2) {
      const pts = Array.from(pointers.values());
      pinch = {
        d: Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y),
        s: cam.s,
        mx: (pts[0].x + pts[1].x) / 2,
        my: (pts[0].y + pts[1].y) / 2
      };
      drag = null;
      return;
    }
    drag = { x: ev.clientX, y: ev.clientY, cx: cam.x, cy: cam.y, moved: false };
  });
  canvas.addEventListener("pointermove", function (ev) {
    if (pointers.has(ev.pointerId)) pointers.set(ev.pointerId, localXY(ev));
    if (pinch && pointers.size >= 2) {
      const pts = Array.from(pointers.values());
      const d = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      const mx = (pts[0].x + pts[1].x) / 2;
      const my = (pts[0].y + pts[1].y) / 2;
      if (pinch.d > 8) {
        zoomAt(mx, my, pinch.s * (d / pinch.d));
        noteZoom();
      }
      cam.x += pinch.mx - mx;
      cam.y += pinch.my - my;
      pinch.mx = mx;
      pinch.my = my;
      requestDraw();
      return;
    }
    if (!drag) return;
    const dx = ev.clientX - drag.x;
    const dy = ev.clientY - drag.y;
    if (Math.hypot(dx, dy) > 4) drag.moved = true;
    cam.x = drag.cx - dx;
    cam.y = drag.cy - dy;
    requestDraw();
  });
  canvas.addEventListener("pointerup", function (ev) {
    const box = canvas.getBoundingClientRect();
    if (drag && !drag.moved && !pinch) {
      const px = ev.clientX - box.left;
      const py = ev.clientY - box.top;
      if (placing && layer) {
        draft = { ui: canvasToGame(px, py), layer: layer.id };
        setPlacing(false);
        openMarkCard();
      } else {
        const check = hitPin(px, py, "check");
        const pin = hitPin(px, py, "pin");
        const label = hitPin(px, py, "body");
        if (check && check.p) {
          toggleDone(check.p);
        } else if (pin && pin.p) {
          selectPoint(pin.p);
          if (isOwn(pin.p)) openMarkMenu(ev.clientX, ev.clientY);
          else closeMenu();
          draw();
        } else if (label && label.p) {
          selectPoint(label.p);
          if (isOwn(label.p)) openMarkMenu(ev.clientX, ev.clientY);
          else closeMenu();
          draw();
        } else {
          const own = nearestOf(layerMarks(), px, py);
          const official = nearestOf(layerPoints().filter(function (p) { return !isFacility(p); }), px, py);
          const drop = nearestOf(layerLoot(), px, py, focusSet ? 32 : 22);
          if (own && (!official || own.d <= official.d) && (!drop || own.d <= drop.d)) {
            selectPoint(own.row);
            openMarkMenu(ev.clientX, ev.clientY);
          } else if (focusSet && drop) {
            selectPoint(drop.row);
            closeMenu();
          } else if (official && (!drop || official.d <= drop.d + 6)) {
            selectPoint(official.row);
            closeMenu();
          } else if (drop) {
            selectPoint(drop.row);
            closeMenu();
          } else {
            markHit = null;
            hit = null;
            closeMenu();
          }
          draw();
        }
      }
    }
    pointers.delete(ev.pointerId);
    if (pointers.size < 2) pinch = null;
    if (pointers.size === 0) drag = null;
  });
  canvas.addEventListener("pointercancel", function (ev) {
    pointers.delete(ev.pointerId);
    pinch = null;
    drag = null;
  });
  canvas.addEventListener("wheel", function (ev) {
    ev.preventDefault();
    const box = canvas.getBoundingClientRect();
    zoomAt(ev.clientX - box.left, ev.clientY - box.top, cam.s * (ev.deltaY > 0 ? 0.9 : 1.1));
    noteZoom();
    requestDraw();
  }, { passive: false });

  findEl.addEventListener("input", function () {
    const qv = findEl.value.trim();
    if (!qv) {
      focusSet = null;
      hit = null;
      paintHits([]);
      hintEl.textContent = (layer && layer.zh) || "";
      draw();
      return;
    }
    const rows = findHits(qv);
    if (!rows.length) {
      focusSet = null;
      paintHits([]);
      hintEl.textContent = "沒有這個名字";
      return;
    }
    if (focusSet && !rows.some(function (row) { return row.name === focusSet.name; })) {
      focusSet = null;
    }
    paintHits(rows);
    const auto = rows.length === 1 ? rows[0] : exactHit(rows, qv);
    if (auto) {
      if (!focusSet || focusSet.name !== auto.name) pickHit(auto);
    } else if (!focusSet) {
      hintEl.textContent = "匹配 " + rows.length + " 個名字";
    }
  });

  function jobBadge(svg) {
    const badge = document.createElement("span");
    badge.className = "ins-icon job-icon";
    badge.setAttribute("aria-hidden", "true");
    badge.innerHTML = '<span class="ins-ring"></span><span class="ins-face">' + svg + "</span>";
    return badge;
  }

  function openMarkCard() {
    const row = draft && draft.id ? marks.find(function (m) { return m.id === draft.id; }) : null;
    const name = (row && row.name) || "";
    const color = (row && row.color) || lastColor;
    lastColor = color;
    const form = document.createElement("form");
    form.className = "apple-row";
    const input = document.createElement("input");
    input.id = "markName";
    input.maxLength = 40;
    input.placeholder = "名字";
    input.value = name;
    input.autocomplete = "off";
    form.appendChild(input);
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      saveMark();
    });
    const colors = document.createElement("div");
    colors.className = "tag-row";
    COLORS.forEach(function (c) {
      const chip = document.createElement("button");
      chip.type = "button";
      chip.className = "tag-chip";
      chip.dataset.color = c.hex;
      chip.setAttribute("aria-label", c.name);
      chip.textContent = c.name;
      paintSwatch(chip, c.hex, c.hex === lastColor);
      chip.addEventListener("click", function () {
        lastColor = c.hex;
        Array.from(colors.children).forEach(function (btn) {
          paintSwatch(btn, btn.dataset.color, btn.dataset.color === lastColor);
        });
      });
      colors.appendChild(chip);
    });
    const ok = document.createElement("button");
    ok.type = "button";
    ok.className = "tag-apply";
    ok.innerHTML = '<span class="tag-apply-face">確認</span>';
    ok.addEventListener("click", saveMark);
    fillAct("標記", [form, colors, ok]);
    window.setTimeout(function () { input.focus(); }, 50);
  }

  function openMarkMenu(vx, vy) {
    closeMenu();
    if (!markMenu || !markHit) return;
    markMenu.innerHTML = "";
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
        closeMenu();
        onClick();
      });
      return btn;
    }
    markMenu.appendChild(row(HASH, "改名／改色", "edit", function () {
      draft = { id: markHit.id, ui: markHit.ui, layer: markHit.layer };
      openMarkCard();
    }));
    markMenu.appendChild(row(TRASH, "丟棄", "drop", function () {
      dropId = markHit.id;
      const mask = document.getElementById("askMask");
      const text = document.getElementById("askText");
      if (text) text.textContent = "丟掉這個標記?";
      if (mask) mask.hidden = false;
    }));
    catcher.hidden = false;
    document.body.appendChild(markMenu);
    markMenu.hidden = false;
    document.documentElement.classList.add("settings-open");
    const w = 220;
    markMenu.style.left = Math.max(12, Math.min(window.innerWidth - w - 12, vx - 20)) + "px";
    markMenu.style.right = "auto";
    markMenu.style.top = Math.max(12, Math.min(window.innerHeight - 120, vy + 8)) + "px";
  }

  async function saveMark() {
    const input = document.getElementById("markName");
    const name = ((input && input.value) || "").trim();
    if (!name || !draft) return;
    const body = {
      op: "save",
      game: gameId,
      name: name,
      color: lastColor,
      layer: draft.layer || (layer && layer.id) || "",
      ui: draft.ui
    };
    if (draft.id) body.id = draft.id;
    const x = await window.FamiGate.api("/api/map-marks", key, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      timeout: 15000
    });
    if (!x || !x.j || !x.j.ok) return;
    applyMarks(x.j);
    const item = x.j.item;
    draft = null;
    closeAct();
    if (item) {
      if (item.layer && layer && item.layer !== layer.id) setLayer(item.layer);
      jumpTo(item);
    } else {
      draw();
    }
  }

  async function dropMark() {
    if (!dropId) {
      closeAsk();
      return;
    }
    const x = await window.FamiGate.api("/api/map-marks", key, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ op: "drop", game: gameId, id: dropId }),
      timeout: 15000
    });
    if (x && x.j && x.j.ok) applyMarks(x.j);
    if (markHit && markHit.id === dropId) markHit = null;
    dropId = "";
    closeAsk();
    hintEl.textContent = (layer && layer.zh) || "";
    draw();
  }

  function filterSpec() {
    const raw = (pack && pack.filters) || {};
    const official = raw.official && raw.official.length ? raw.official : [
      { id: "grace", zh: "賜福", kind: "grace" },
      { id: "place", zh: "設施", kind: "map-point" }
    ];
    const groups = raw.groups && raw.groups.length ? raw.groups : [
      { zh: "裝備", types: ["武器", "防具", "盾牌", "護符", "戰灰"] },
      { zh: "強化", types: ["黃金種子", "聖盃露滴", "結晶露滴", "淚滴幼體", "鍛造石", "墓地鈴蘭", "幽影樹碎片"] },
      { zh: "魔法", types: ["魔法", "禱告", "骨灰"] },
      { zh: "關鍵", types: ["鑰匙", "鈴珠", "地圖碎片", "追憶"] },
      { zh: "人物", types: ["頭目", "NPC", "入侵"] }
    ];
    return { official: official, groups: groups };
  }

  function allFilterKeys() {
    const spec = filterSpec();
    const keys = spec.official.map(function (row) { return row.id; });
    spec.groups.forEach(function (g) {
      (g.types || []).forEach(function (t) { keys.push(t); });
    });
    return keys;
  }

  function ensureShown() {
    allFilterKeys().forEach(function (key) {
      if (shown[key] === undefined) shown[key] = true;
    });
  }

  function switchHideDone() {
    const row = document.createElement("label");
    row.className = "ask-skip";
    const text = document.createElement("span");
    text.textContent = "隱藏已完成";
    const input = document.createElement("input");
    input.type = "checkbox";
    input.checked = hideDone;
    const sw = document.createElement("span");
    sw.className = "ask-sw";
    input.addEventListener("change", function () {
      hideDone = input.checked;
      saveProgress({ hide_done: hideDone });
      draw();
    });
    row.appendChild(text);
    row.appendChild(input);
    row.appendChild(sw);
    return row;
  }

  function switchRow(key, label) {
    const row = document.createElement("label");
    row.className = "ask-skip";
    const text = document.createElement("span");
    text.textContent = label;
    const input = document.createElement("input");
    input.type = "checkbox";
    input.checked = isShown(key);
    const sw = document.createElement("span");
    sw.className = "ask-sw";
    input.addEventListener("change", function () {
      shown[key] = input.checked;
      draw();
    });
    row.appendChild(text);
    row.appendChild(input);
    row.appendChild(sw);
    return row;
  }

  function fillFilter() {
    const body = document.getElementById("filterBody");
    const title = document.getElementById("filterTitle");
    if (!body) return;
    ensureShown();
    body.innerHTML = "";
    const tools = document.createElement("div");
    tools.className = "filter-tools tag-row";
    function tool(label, on) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "tag-chip";
      btn.textContent = label;
      btn.addEventListener("click", function () {
        allFilterKeys().forEach(function (key) { shown[key] = on; });
        fillFilter();
        draw();
      });
      return btn;
    }
    tools.appendChild(tool("全開", true));
    tools.appendChild(tool("全關", false));
    body.appendChild(tools);
    body.appendChild(switchHideDone());
    const spec = filterSpec();
    const officialBox = document.createElement("div");
    officialBox.className = "filter-group";
    const officialHead = document.createElement("p");
    officialHead.textContent = "官方";
    officialBox.appendChild(officialHead);
    spec.official.forEach(function (row) {
      officialBox.appendChild(switchRow(row.id, row.zh));
    });
    body.appendChild(officialBox);
    spec.groups.forEach(function (g) {
      const box = document.createElement("div");
      box.className = "filter-group";
      const head = document.createElement("p");
      head.textContent = g.zh;
      box.appendChild(head);
      (g.types || []).forEach(function (t) {
        box.appendChild(switchRow(t, t));
      });
      body.appendChild(box);
    });
    paintFilterTitle();
  }

  function paintFilterTitle() {
    const title = document.getElementById("filterTitle");
    if (title) title.textContent = "顯示　" + (layerLoot().length + layerPoints().length);
  }

  function fillMenu() {
    menu.innerHTML = "";
    (pack && pack.index.layers || []).forEach(function (row) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "settings-entry";
      btn.appendChild(jobBadge(MAP_ICON));
      const text = document.createElement("span");
      text.textContent = row.zh;
      btn.appendChild(text);
      btn.addEventListener("click", function () { closeMenu(); setLayer(row.id); });
      menu.appendChild(btn);
    });
  }

  function placeMenu() {
    const box = toggle.getBoundingClientRect();
    menu.style.position = "fixed";
    menu.style.right = Math.max(12, window.innerWidth - box.right) + "px";
    menu.style.top = Math.round(box.bottom + 8) + "px";
  }

  document.getElementById("backShelf").addEventListener("click", goBack);
  if (toggle) {
    toggle.addEventListener("click", function (ev) {
      ev.preventDefault();
      ev.stopPropagation();
      const open = menu.hidden;
      closeMenu();
      if (open) {
        fillMenu();
        catcher.hidden = false;
        document.body.appendChild(menu);
        menu.hidden = false;
        document.documentElement.classList.add("settings-open");
        placeMenu();
        toggle.setAttribute("aria-expanded", "true");
        toggle.classList.add("is-live");
      }
    });
  }
  if (catcher) catcher.addEventListener("click", closeMenu);
  const actClose = document.getElementById("actClose");
  if (actClose) actClose.addEventListener("click", closeAct);
  bindMaskClose("actMask", closeAct);
  bindMaskClose("askMask", closeAsk);
  bindMaskClose("filterMask", closeFilter);
  const filterClose = document.getElementById("filterClose");
  if (filterClose) filterClose.addEventListener("click", closeFilter);
  if (window.FamiGate && window.FamiGate.lockSheetPage && filterMask()) {
    window.FamiGate.lockSheetPage(filterMask());
  }
  const askNo = document.getElementById("askNo");
  const askYes = document.getElementById("askYes");
  if (askNo) askNo.addEventListener("click", closeAsk);
  if (askYes) askYes.addEventListener("click", dropMark);
  if (window.FamiGate && window.FamiGate.bindKeyboard) window.FamiGate.bindKeyboard();

  try { window.parent.postMessage({ fami: "reader-loading" }, location.origin); } catch (e) {}
  window.FamiGate.api("/api/map?game=" + encodeURIComponent(gameId) + "&chat=" + encodeURIComponent(recordId), key, { timeout: 30000 }).then(function (x) {
    if (!x || !x.j || !x.j.ok) {
      hintEl.textContent = "地圖還沒好";
      announceReady();
      return;
    }
    pack = x.j;
    titleEl.textContent = (pack.index && pack.index.game) || "地圖";
    chipsEl.innerHTML = "";
    (pack.index.layers || []).forEach(function (row, i) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "mode-btn" + (i === 0 ? " is-on" : "");
      btn.dataset.id = row.id;
      btn.textContent = row.zh;
      btn.addEventListener("click", function () { setLayer(row.id); });
      chipsEl.appendChild(btn);
    });
    const filterBtn = document.createElement("button");
    filterBtn.type = "button";
    filterBtn.className = "mode-btn mode-find";
    filterBtn.textContent = "篩選";
    filterBtn.addEventListener("click", function () {
      const mask = filterMask();
      if (mask && !mask.hidden) closeFilter();
      else openFilter();
    });
    chipsEl.appendChild(filterBtn);
    penBtn = insButton("map-pen", HASH, "新增標記");
    penBtn.addEventListener("click", function (ev) {
      ev.preventDefault();
      ev.stopPropagation();
      setPlacing(!placing);
    });
    chipsEl.appendChild(penBtn);
    applyMarks(pack);
    applyProgress(pack);
    ensureShown();
    setLayer((pack.index.layers[0] || {}).id);
    if (wideMap()) openFilter();
    resize();
  });
  window.addEventListener("resize", function () {
    const mask = filterMask();
    if (mask && !mask.hidden) {
      if (wideMap()) {
        mask.classList.add("is-dock");
        document.documentElement.classList.remove("tag-modal-open");
      } else {
        mask.classList.remove("is-dock");
        document.documentElement.classList.add("tag-modal-open");
      }
    }
    resize();
  });
})();

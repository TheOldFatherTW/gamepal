(function () {
  const q = new URLSearchParams(location.search);
  const key = window.FamiGate ? window.FamiGate.currentKey() : (q.get("k") || "");
  const gameId = q.get("id") || "elden-ring";
  const titleEl = document.getElementById("bookTitle");
  const chipsEl = document.getElementById("mapChips");
  const findEl = document.getElementById("mapFind");
  const canvas = document.getElementById("mapCanvas");
  const hintEl = document.getElementById("mapHint");
  const menu = document.getElementById("readerSettingsMenu");
  const catcher = document.getElementById("readerSettingsCatch");
  const toggle = document.getElementById("configButton");
  const ctx = canvas.getContext("2d");
  const cache = new Map();
  const pointers = new Map();
  const MAP_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8.5 5.5l7-2 5 2.2v13.8l-5-2.2-7 2-5-2.2V5.5l5 2.2z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="M8.5 7.7v10.8M15.5 3.5v10.8" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>';
  let pack = null;
  let layer = null;
  let cam = { x: 0, y: 0, s: 0.2 };
  let drag = null;
  let pinch = null;
  let hit = null;
  let drawQ = 0;
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
    if (catcher) catcher.hidden = true;
    if (toggle) {
      toggle.setAttribute("aria-expanded", "false");
      toggle.classList.remove("is-live");
    }
    document.documentElement.classList.remove("settings-open");
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

  function layerPoints() {
    if (!pack || !layer) return [];
    return pack.points.filter(function (p) {
      return p.ui && p.layer === layer.id;
    });
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

  function draw() {
    const box = canvas.getBoundingClientRect();
    ctx.clearRect(0, 0, box.width, box.height);
    if (!layer) return;
    const tile = layer.tile || 256;
    const h = (layer.y1 + 1) * tile;
    drawOverview();
    if (cam.s > 0.45) {
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
      const pt = gameToCanvas(p.ui);
      ctx.beginPath();
      ctx.fillStyle = p.kind === "grace" ? "#e8c56b" : "#c13584";
      ctx.arc(pt.x, pt.y, p === hit ? 7 : 4, 0, Math.PI * 2);
      ctx.fill();
    });
    if (hit && hit.ui) {
      const pt = gameToCanvas(hit.ui);
      hintEl.textContent = hit.name || (hit.names && hit.names[0]) || "";
      ctx.fillStyle = "rgba(255,255,255,0.92)";
      ctx.font = "14px -apple-system, BlinkMacSystemFont, 'PingFang TC', 'Microsoft JhengHei', sans-serif";
      ctx.fillText(hintEl.textContent, pt.x + 10, pt.y - 8);
    }
    if (layer.overview) {
      const ov = loadImg(overviewUrl(layer.overview));
      if (ov.complete && ov.naturalWidth) announceReady();
    } else {
      announceReady();
    }
  }

  function nearest(px, py) {
    let best = null;
    let bestD = 22;
    layerPoints().forEach(function (p) {
      const pt = gameToCanvas(p.ui);
      const d = Math.hypot(pt.x - px, pt.y - py);
      if (d < bestD) {
        best = p;
        bestD = d;
      }
    });
    return best;
  }

  function setLayer(id) {
    layer = (pack.index.layers || []).find(function (row) { return row.id === id; }) || pack.index.layers[0];
    Array.from(chipsEl.children).forEach(function (btn) {
      btn.classList.toggle("is-on", btn.dataset.id === layer.id);
    });
    fitLayer();
    hit = null;
    hintEl.textContent = layer.zh || "";
    draw();
  }

  function jumpTo(point) {
    if (!point || !point.ui) return;
    const box = canvas.getBoundingClientRect();
    cam.s = Math.max(cam.s, 0.8);
    const h = worldH();
    cam.x = point.ui.x * cam.s - box.width / 2;
    cam.y = (h - point.ui.y) * cam.s - box.height / 2;
    hit = point;
    hintEl.textContent = point.name || "";
    draw();
  }

  function namesOf(p) {
    const rows = (p.names || []).slice();
    if (p.name && rows.indexOf(p.name) < 0) rows.push(p.name);
    return rows;
  }

  function findPoint(qv) {
    if (!qv || !pack) return null;
    const all = pack.points || [];
    function hitName(p, exact) {
      if (!p.ui) return false;
      return namesOf(p).some(function (n) { return exact ? n === qv : n.indexOf(qv) >= 0; });
    }
    return layerPoints().find(function (p) { return hitName(p, true); })
      || all.find(function (p) { return hitName(p, true); })
      || layerPoints().find(function (p) { return hitName(p, false); })
      || all.find(function (p) { return hitName(p, false); });
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
      if (pinch.d > 8) zoomAt(mx, my, pinch.s * (d / pinch.d));
      cam.x += pinch.mx - mx;
      cam.y += pinch.my - my;
      pinch.mx = mx;
      pinch.my = my;
      draw();
      return;
    }
    if (!drag) return;
    const dx = ev.clientX - drag.x;
    const dy = ev.clientY - drag.y;
    if (Math.hypot(dx, dy) > 4) drag.moved = true;
    cam.x = drag.cx - dx;
    cam.y = drag.cy - dy;
    draw();
  });
  canvas.addEventListener("pointerup", function (ev) {
    const box = canvas.getBoundingClientRect();
    if (drag && !drag.moved && !pinch) {
      hit = nearest(ev.clientX - box.left, ev.clientY - box.top);
      hintEl.textContent = hit ? (hit.name || "") : (layer && layer.zh) || "";
      draw();
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
    draw();
  }, { passive: false });

  findEl.addEventListener("input", function () {
    const qv = findEl.value.trim();
    if (!qv) {
      hit = null;
      hintEl.textContent = (layer && layer.zh) || "";
      draw();
      return;
    }
    const hitRow = findPoint(qv);
    if (hitRow) {
      if (hitRow.layer !== layer.id) setLayer(hitRow.layer);
      jumpTo(hitRow);
    } else {
      hintEl.textContent = "沒有這個名字";
    }
  });

  function jobBadge(svg) {
    const badge = document.createElement("span");
    badge.className = "ins-icon job-icon";
    badge.setAttribute("aria-hidden", "true");
    badge.innerHTML = '<span class="ins-ring"></span><span class="ins-face">' + svg + "</span>";
    return badge;
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

  try { window.parent.postMessage({ fami: "reader-loading" }, location.origin); } catch (e) {}
  window.FamiGate.api("/api/map?game=" + encodeURIComponent(gameId), key, { timeout: 30000 }).then(function (x) {
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
    setLayer((pack.index.layers[0] || {}).id);
    resize();
  });
  window.addEventListener("resize", resize);
})();

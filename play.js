(function () {
  const q = new URLSearchParams(location.search);
  const key = window.FamiGate ? window.FamiGate.currentKey() : (q.get("k") || "");
  const gameId = q.get("id") || "elden-ring";
  const titleEl = document.getElementById("bookTitle");
  const logEl = document.getElementById("playLog");
  const form = document.getElementById("playForm");
  const input = document.getElementById("playInput");
  const waitEl = document.getElementById("playWait");
  const waitBar = document.getElementById("playWaitBar");
  const menu = document.getElementById("readerSettingsMenu");
  const catcher = document.getElementById("readerSettingsCatch");
  const toggle = document.getElementById("configButton");
  let busy = false;
  let paintedTurns = 0;
  let lookSeq = 0;

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

  function imgUrl(id) {
    return window.FamiGate.origin() + "/guide-img?id=" + encodeURIComponent(id) + "&game=" + encodeURIComponent(gameId) + "&k=" + encodeURIComponent(key);
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

  function line(text, who, images, kind) {
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
      img.src = imgUrl(im.id);
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
    if (q && job.q && sameQ(job.q, q) && job.state === "done") {
      const last = list[list.length - 1];
      if (last && last.a && sameQ(last.q, q)) return true;
    }
    return false;
  }

  function scrubJobBubbles() {
    if (!logEl) return;
    logEl.querySelectorAll(".play-line.is-job").forEach(function (el) { el.remove(); });
  }

  function showLook(phase, pct) {
    const jobEl = document.getElementById("playJob");
    const text = jobText(phase, pct);
    scrubJobBubbles();
    if (jobEl) jobEl.textContent = text;
    waitEl.hidden = false;
    waitEl.setAttribute("aria-label", text);
    if (window.PalMark) window.PalMark.mountBar(waitBar);
  }

  function hideLook() {
    scrubJobBubbles();
    waitEl.hidden = true;
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
          const x = await window.FamiGate.api("/api/memory?game=" + encodeURIComponent(gameId), key, { timeout: 20000 });
          if (seq !== lookSeq) return;
          misses = 0;
          const job = (x.j && x.j.job) || {};
          const turns = (x.j && x.j.turns) || [];
          if (job.state === "running") {
            showLook(job.phase || "找攻略中…", job.progress);
          }
          if (lookReady(job, turns, from, q)) {
            hideLook();
            if (paintedTurns >= turns.length && q) {
              const last = turns[turns.length - 1];
              if (last && (last.a || (last.images && last.images.length)) && sameQ(last.q, q)) {
                line(last.a || "", "pal", last.images);
                paintedTurns = turns.length;
                return;
              }
            }
            for (let i = from; i < turns.length; i++) {
              const t = turns[i];
              if (t && (t.a || (t.images && t.images.length))) line(t.a || "", "pal", t.images);
            }
            paintedTurns = turns.length;
            return;
          }
        } catch (err) {
          misses += 1;
          if (misses >= 12) throw err;
        }
        if (seq !== lookSeq) return;
        await sleep(1500);
      }
      line("家裡還沒回。再試一次。", "pal");
    } catch (e) {
      line("家裡還沒回。再試一次。", "pal");
    } finally {
      if (seq === lookSeq) {
        hideLook();
        busy = false;
      }
    }
  }

  function closeAct() {
    const mask = document.getElementById("actMask");
    if (mask) mask.hidden = true;
  }

  function paintTodos(items) {
    const body = document.getElementById("actBody");
    if (!body) return;
    body.innerHTML = "";
    const open = (items || []).filter(function (t) { return !t.done; });
    if (!open.length) {
      const p = document.createElement("p");
      p.textContent = "目前沒有待辦";
      body.appendChild(p);
      return;
    }
    open.forEach(function (t) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "tag-apply";
      btn.style.margin = "8px 0";
      btn.innerHTML = '<span class="tag-apply-face">完成　' + (t.title || "") + "</span>";
      btn.addEventListener("click", async function () {
        await window.FamiGate.api("/api/todo", key, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ op: "done", id: t.id, done: true }),
          timeout: 15000,
        });
        openQueue();
      });
      body.appendChild(btn);
    });
  }

  async function openQueue() {
    closeMenu();
    const mask = document.getElementById("actMask");
    const title = document.getElementById("actTitle");
    if (title) title.textContent = "工作佇列";
    if (mask) mask.hidden = false;
    const x = await window.FamiGate.api("/api/memory?game=" + encodeURIComponent(gameId), key, { timeout: 15000 });
    paintTodos(x.j && x.j.todos);
  }

  async function send() {
    if (busy) return;
    const text = (input.value || "").trim();
    if (!text) return;
    busy = true;
    input.value = "";
    line(text, "me");
    showLook("拍照中…", 8);
    const from = paintedTurns;
    try {
      const x = await window.FamiGate.api("/api/chat", key, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ game: gameId, text: text }),
        timeout: 45000,
      });
      if (x.j && x.j.pending) {
        const job = x.j.job || {};
        showLook(job.phase || "找攻略中…", job.progress == null ? 28 : job.progress);
        watchLook(text, from);
        return;
      }
      const reply = (x.j && x.j.reply) || (x.j && x.j.error) || "這回合沒問到";
      line(reply, "pal", (x.j && x.j.images) || []);
      hideLook();
      busy = false;
    } catch (e) {
      line("家裡還沒回。再試一次。", "pal");
      hideLook();
      busy = false;
    }
  }

  if (window.FamiGate) {
    window.FamiGate.blockWebChrome();
    window.FamiGate.bindKeyboard();
    if (window.FamiGate.lockSheetPage) {
      const mask = document.getElementById("actMask");
      if (mask) window.FamiGate.lockSheetPage(mask);
    }
  }

  window.FamiGate.api("/api/memory?game=" + encodeURIComponent(gameId), key, { timeout: 15000 }).then(function (x) {
    if (titleEl && x.j && x.j.game === "elden-ring") titleEl.textContent = "艾爾登法環";
    const turns = (x.j && x.j.turns) || [];
    turns.forEach(function (t) {
      if (t.q) line(t.q, "me");
      if (t.a || (t.images && t.images.length)) line(t.a || "", "pal", t.images);
    });
    paintedTurns = turns.length;
    const job = (x.j && x.j.job) || {};
    if (job.state === "running") {
      showLook(job.phase || "找攻略中…", job.progress);
      watchLook(job.q || "", paintedTurns);
    }
  }).catch(function () {});

  document.getElementById("backShelf").addEventListener("click", goBack);
  document.getElementById("backToShelf").addEventListener("click", goBack);
  document.getElementById("openQueue").addEventListener("click", function () { openQueue(); });
  document.getElementById("actClose").addEventListener("click", closeAct);
  const actMask = document.getElementById("actMask");
  let down = false;
  actMask.addEventListener("pointerdown", function (ev) { down = ev.target === actMask; });
  actMask.addEventListener("pointerup", function (ev) {
    if (down && ev.target === actMask) closeAct();
    down = false;
  });

  toggle.addEventListener("click", function (ev) {
    ev.preventDefault();
    ev.stopPropagation();
    const open = menu.hidden;
    if (open) {
      catcher.hidden = false;
      document.body.appendChild(menu);
      menu.hidden = false;
      document.documentElement.classList.add("settings-open");
      toggle.setAttribute("aria-expanded", "true");
      toggle.classList.add("is-live");
    } else closeMenu();
  });
  catcher.addEventListener("click", closeMenu);
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    send();
  });
})();

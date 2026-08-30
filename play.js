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

  function line(text, who) {
    const p = document.createElement("p");
    p.className = "play-line is-" + who;
    p.textContent = text;
    logEl.appendChild(p);
    logEl.scrollTop = logEl.scrollHeight;
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
    waitEl.hidden = false;
    if (window.PalMark) window.PalMark.mountBar(waitBar);
    try {
      const x = await window.FamiGate.api("/api/chat", key, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ game: gameId, text: text }),
        timeout: 180000,
      });
      const reply = (x.j && x.j.reply) || (x.j && x.j.error) || "這回合沒問到";
      line(reply, "pal");
    } catch (e) {
      line("家裡還沒回。再試一次。", "pal");
    } finally {
      waitEl.hidden = true;
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

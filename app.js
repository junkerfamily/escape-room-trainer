(() => {
  const STORE_KEY = "ert-progress-v1";
  const $ = (s) => document.querySelector(s);
  const nav = $("#nav"), main = $("#main"), search = $("#search");

  // ---- Persistence (safe if storage is blocked) ----
  const load = (k, fallback) => { try { return JSON.parse(localStorage.getItem(k)) ?? fallback; } catch { return fallback; } };
  const save = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };

  let progress = load(STORE_KEY, {});        // id -> { solved, hints, revealed, best }
  let collapsed = load("ert-collapsed", {});
  const autoAdvance = $("#autoAdvance");
  autoAdvance.checked = load("ert-auto", true);
  autoAdvance.onchange = () => save("ert-auto", autoAdvance.checked);

  // Ordered list follows category order
  const ordered = CATEGORIES.flatMap(c => LESSONS.filter(l => l.cat === c.id));
  const idx = (id) => ordered.findIndex(l => l.id === id);
  let current = (location.hash.slice(1) && idx(location.hash.slice(1)) >= 0) ? location.hash.slice(1) : load("ert-current", ordered[0].id);
  if (idx(current) < 0) current = ordered[0].id;

  // Per-lesson state for this view
  let view = { hintsShown: 0, startedAt: Date.now(), solvedNow: false, advanceTimer: null };
  const sessionStart = Date.now();

  const norm = (s) => s.toUpperCase()
    .replace(/→/g, "R").replace(/←/g, "L").replace(/↑/g, "U").replace(/↓/g, "D")
    .replace(/[^A-Z0-9]/g, "");
  const fmt = (sec) => `${Math.floor(sec / 60)}:${String(Math.floor(sec % 60)).padStart(2, "0")}`;
  const esc = (s) => s.replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  // ---- Sidebar ----
  function renderNav() {
    const q = search.value.trim().toLowerCase();
    nav.innerHTML = CATEGORIES.map(cat => {
      const items = LESSONS.filter(l => l.cat === cat.id &&
        (!q || (l.title + " " + l.summary + " " + l.tells.join(" ")).toLowerCase().includes(q)));
      if (!items.length) return "";
      const solved = items.filter(l => progress[l.id]?.solved).length;
      const isCollapsed = collapsed[cat.id] && !q;
      return `<div class="cat ${isCollapsed ? "collapsed" : ""}">
        <button class="cat-head" data-cat="${cat.id}"><span class="chev">▾</span><span class="icon">${cat.icon}</span>${cat.name}<span class="count">${solved}/${items.length}</span></button>
        <div class="items">${items.map(l => {
          const p = progress[l.id] || {};
          const cls = [l.id === current ? "active" : "", p.solved ? "solved" : "", p.solved && !p.hints && !p.revealed ? "clean" : ""].join(" ");
          const mark = p.solved ? (!p.hints && !p.revealed ? "★" : "✓") : "";
          return `<button class="item ${cls}" data-id="${l.id}"><span class="dot">${mark}</span>${esc(l.title)}${p.best ? `<span class="time">${fmt(p.best)}</span>` : ""}</button>`;
        }).join("")}</div></div>`;
    }).join("") || `<p style="padding:10px;color:var(--muted)">No topics match.</p>`;
    const active = nav.querySelector(".item.active");
    if (active) active.scrollIntoView({ block: "nearest" });
  }

  nav.addEventListener("click", (e) => {
    const head = e.target.closest(".cat-head");
    if (head) { collapsed[head.dataset.cat] = !collapsed[head.dataset.cat]; save("ert-collapsed", collapsed); renderNav(); return; }
    const item = e.target.closest(".item");
    if (item) go(item.dataset.id);
  });
  search.addEventListener("input", renderNav);
  search.addEventListener("keydown", (e) => {
    if (e.key === "Enter") { const first = nav.querySelector(".item"); if (first) { go(first.dataset.id); search.blur(); } }
    if (e.key === "Escape") { search.value = ""; renderNav(); search.blur(); }
  });

  // ---- Stats ----
  function renderStats() {
    const solved = ordered.filter(l => progress[l.id]?.solved).length;
    const clean = ordered.filter(l => { const p = progress[l.id]; return p?.solved && !p.hints && !p.revealed; }).length;
    $("#progressFill").style.width = (100 * solved / ordered.length) + "%";
    $("#progressText").textContent = `${solved} / ${ordered.length}`;
    $("#cleanCount").textContent = clean;
  }

  // ---- Lesson view ----
  function render() {
    const l = ordered[idx(current)];
    const cat = CATEGORIES.find(c => c.id === l.cat);
    const p = progress[l.id] || {};
    const i = idx(current);
    const prev = ordered[i - 1], next = ordered[i + 1];
    clearTimeout(view.advanceTimer);
    view = { hintsShown: p.solved ? 0 : 0, startedAt: Date.now(), solvedNow: false, advanceTimer: null };

    main.innerHTML = `<article class="lesson">
      <div class="crumbs"><span class="chip">${cat.icon} ${cat.name}</span><span>${i + 1} of ${ordered.length}</span>
        ${p.solved ? `<span style="color:var(--ok);font-weight:600">${!p.hints && !p.revealed ? "★ Solved clean" : "✓ Solved"}</span>` : ""}</div>
      <h1>${l.title}</h1>
      <p class="summary">${l.summary}</p>
      <div class="grid">
        <section class="card text">
          ${l.body}
          <h3>Spot it in the wild</h3>
          <div class="tells">${l.tells.map(t => `<span>${esc(t)}</span>`).join("")}</div>
          ${l.ref ? `<h3>Reference chart</h3>${l.ref}` : ""}
        </section>
        <section class="card visual-card">
          <div class="visual" id="visual">${l.visual}</div>
          ${l.toggle ? `<button class="btn ghost toggle-btn" id="toggleBtn">${l.toggle.label} <kbd>T</kbd></button>` : ""}
        </section>
      </div>
      <section class="card puzzle">
        <div class="puzzle-head"><h2>Your turn</h2><span class="timer" id="lessonTimer">0:00</span></div>
        <p class="prompt">${l.puzzle.prompt}</p>
        <form class="answer-row" id="answerForm" autocomplete="off">
          <input class="answer" id="answer" placeholder="Answer" aria-label="Answer" spellcheck="false">
          <button class="btn" type="submit">Check</button>
        </form>
        <div class="actions">
          <button class="btn ghost small" id="hintBtn">Hint <span id="hintCount">0/${l.puzzle.hints.length}</span> <kbd>H</kbd></button>
          <button class="btn ghost small" id="revealBtn">Reveal <kbd>R</kbd></button>
        </div>
        <div class="feedback" id="feedback" role="status"></div>
        <ul class="hints" id="hints"></ul>
        <div id="explainBox"></div>
      </section>
      <nav class="pager">
        <button class="btn ghost" id="prevBtn" ${prev ? "" : "disabled"}>← ${prev ? esc(prev.title) : ""}</button>
        <button class="btn ghost" id="nextBtn" ${next ? "" : "disabled"}>${next ? esc(next.title) : ""} →</button>
      </nav>
    </article>`;

    main.scrollTop = 0;
    $("#answerForm").onsubmit = (e) => { e.preventDefault(); if (view.solvedNow) return goNext(); check(); };
    $("#hintBtn").onclick = hint;
    $("#revealBtn").onclick = reveal;
    $("#prevBtn").onclick = () => prev && go(prev.id);
    $("#nextBtn").onclick = goNext;
    if (l.toggle) $("#toggleBtn").onclick = toggleProp;

    save("ert-current", current);
    history.replaceState(null, "", "#" + current);
    renderNav(); renderStats();
    // Focus answer box on desktop so you can type immediately
    if (window.matchMedia("(min-width: 721px)").matches) $("#answer").focus({ preventScroll: true });
  }

  function lesson() { return ordered[idx(current)]; }

  function toggleProp() {
    const l = lesson(); if (!l.toggle) return;
    $("#visual").classList.toggle(l.toggle.cls);
  }

  function hint() {
    const l = lesson(), h = l.puzzle.hints;
    if (view.hintsShown >= h.length) return;
    view.hintsShown++;
    $("#hints").insertAdjacentHTML("beforeend", `<li><b>Hint ${view.hintsShown}</b>${h[view.hintsShown - 1]}</li>`);
    $("#hintCount").textContent = `${view.hintsShown}/${h.length}`;
    if (view.hintsShown >= h.length) $("#hintBtn").disabled = true;
    const p = progress[l.id] ||= {};
    if (!p.solved) { p.hints = Math.max(p.hints || 0, view.hintsShown); save(STORE_KEY, progress); }
  }

  function showExplain(text) {
    $("#explainBox").innerHTML = `<div class="explain"><b>Why:</b> ${text}</div>`;
  }

  function check() {
    const l = lesson(), input = $("#answer"), fb = $("#feedback");
    const guess = norm(input.value);
    if (!guess) return;
    input.classList.remove("wrong", "right");
    void input.offsetWidth; // restart shake animation
    if (l.puzzle.answers.map(norm).includes(guess)) {
      const secs = (Date.now() - view.startedAt) / 1000;
      const p = progress[l.id] ||= {};
      const first = !p.solved;
      p.solved = true;
      if (!p.revealed) p.best = p.best ? Math.min(p.best, secs) : secs;
      save(STORE_KEY, progress);
      input.classList.add("right");
      view.solvedNow = true;
      const clean = !p.hints && !p.revealed;
      fb.className = "feedback ok";
      fb.textContent = `${clean ? "★ Clean solve!" : "✓ Correct!"} ${fmt(secs)}${autoAdvance.checked ? " · next up…" : " · press Enter for next"}`;
      showExplain(l.puzzle.explain);
      renderNav(); renderStats();
      if (autoAdvance.checked && first !== undefined) view.advanceTimer = setTimeout(goNext, 1400);
    } else {
      input.classList.add("wrong");
      fb.className = "feedback bad";
      fb.textContent = view.hintsShown < l.puzzle.hints.length ? "Not quite. Try a hint (H)." : "Not quite. Check the last hint again.";
    }
  }

  function reveal() {
    const l = lesson(), p = progress[l.id] ||= {};
    if (!p.solved) p.revealed = true;
    save(STORE_KEY, progress);
    $("#answer").value = l.puzzle.answers[0];
    $("#feedback").className = "feedback";
    $("#feedback").textContent = "Answer revealed. Press Check to mark it done.";
    showExplain(l.puzzle.explain);
  }

  function go(id) { if (idx(id) < 0) return; current = id; render(); }
  function goNext() {
    const i = idx(current);
    if (i < ordered.length - 1) go(ordered[i + 1].id);
    else if (ordered.every(l => progress[l.id]?.solved)) celebrate();
  }
  function goPrev() { const i = idx(current); if (i > 0) go(ordered[i - 1].id); }
  function nextUnsolved() {
    const i = idx(current);
    const rest = [...ordered.slice(i + 1), ...ordered.slice(0, i + 1)];
    const n = rest.find(l => !progress[l.id]?.solved);
    n ? go(n.id) : celebrate();
  }

  function celebrate() {
    const clean = ordered.filter(l => { const p = progress[l.id]; return p?.solved && !p.hints && !p.revealed; }).length;
    const total = ordered.reduce((s, l) => s + (progress[l.id]?.best || 0), 0);
    main.innerHTML = `<article class="lesson card done-banner">
      <h1>🔓 You escaped the training!</h1>
      <p class="summary" style="margin:12px auto">All ${ordered.length} puzzles solved · ★ ${clean} clean · total best time ${fmt(total)}</p>
      <p>Hit <b>Reset</b> to run it again and beat your times.</p></article>`;
  }

  $("#nextUnsolved").onclick = nextUnsolved;
  $("#resetBtn").onclick = () => {
    if (!confirm("Clear all progress and times?")) return;
    progress = {}; save(STORE_KEY, progress); go(ordered[0].id);
  };

  // ---- Keyboard ----
  document.addEventListener("keydown", (e) => {
    const inField = e.target.matches("input, textarea");
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    if (inField) {
      if (e.key === "Escape") e.target.blur();
      if (e.target.id === "answer" && (e.key === "ArrowDown" || e.key === "ArrowUp") && !e.target.value) {
        e.preventDefault(); e.key === "ArrowDown" ? goNext() : goPrev();
      }
      return;
    }
    const k = e.key.toLowerCase();
    if (k === "arrowdown" || k === "j") { e.preventDefault(); goNext(); }
    else if (k === "arrowup" || k === "k") { e.preventDefault(); goPrev(); }
    else if (k === "h") hint();
    else if (k === "r") reveal();
    else if (k === "t") toggleProp();
    else if (k === "n") nextUnsolved();
    else if (k === "/") { e.preventDefault(); search.focus(); }
    else if (k === "enter") { view.solvedNow ? goNext() : $("#answer")?.focus(); }
  });

  // ---- Timers ----
  setInterval(() => {
    $("#sessionTime").textContent = fmt((Date.now() - sessionStart) / 1000);
    const t = $("#lessonTimer");
    if (t && !view.solvedNow) t.textContent = fmt((Date.now() - view.startedAt) / 1000);
  }, 500);

  window.addEventListener("hashchange", () => { const id = location.hash.slice(1); if (id !== current) go(id); });
  render();
})();

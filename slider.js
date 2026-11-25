/* Interactive 3x3 sliding-tile board with a method-following coach.
   Modes: "top" (place 1 2 3), "col" (place 4 over 7, top row locked),
          "last" (spin the final 2x2), "full" (whole solve, coach walks the stages). */
const Slider = (() => {
  const GOAL = [1, 2, 3, 4, 5, 6, 7, 8, 0];
  const STAGES = {
    top: {
      tiles: [1, 2, 3], locked: [], name: "Stage 1 · Top row",
      coach: "Place 1, then 2. For 3: park 2 in the top-right corner with 3 right under it, bring the gap to 2's home, then slide 2 left and 3 up.",
    },
    col: {
      tiles: [4, 7], locked: [0, 1, 2], name: "Stage 2 · Left column (4 over 7)",
      coach: "Skip the middle row! Put 4 in the bottom-left corner and 7 right beside it, gap in 4's home. Then slide 4 up and 7 left.",
    },
    last: {
      tiles: [5, 6, 8], locked: [0, 1, 2, 3, 6], name: "Stage 3 · Spin the last square",
      coach: "Only 4 cells left. Keep walking the gap around the little square in one direction until 5, 6 and 8 click in.",
    },
  };
  const LOCKS = { top: [], col: STAGES.col.locked, last: STAGES.last.locked, full: [] };

  const nbrs = (i) => {
    const r = (i / 3) | 0, c = i % 3, o = [];
    if (r > 0) o.push(i - 3); if (r < 2) o.push(i + 3);
    if (c > 0) o.push(i - 1); if (c < 2) o.push(i + 1);
    return o;
  };
  const placed = (b, tiles) => tiles.filter((t) => b[t - 1] === t).length;
  const done = (b, tiles) => placed(b, tiles) === tiles.length;
  const stageFor = (b, mode) =>
    mode !== "full" ? mode : !done(b, [1, 2, 3]) ? "top" : !done(b, [4, 7]) ? "col" : "last";
  const lessonDone = (b, mode) =>
    mode === "top" ? done(b, [1, 2, 3]) : mode === "col" ? done(b, [1, 2, 3, 4, 7]) : done(b, [1, 2, 3, 4, 5, 6, 7, 8]);

  // Shortest path to the stage goal. Tiles that don't matter yet are treated as
  // identical, which keeps the search tiny. Returns the cells to click, in order.
  function plan(b, stageKey) {
    const { tiles, locked } = STAGES[stageKey];
    const keep = new Set(tiles), lock = new Set(locked);
    const start = b.map((v) => (v === 0 ? 0 : keep.has(v) ? v : 9));
    const goal = (a) => tiles.every((t) => a[t - 1] === t);
    if (goal(start)) return [];
    const key = (a) => a.join("");
    const seen = new Map([[key(start), null]]);
    let frontier = [start];
    while (frontier.length) {
      const next = [];
      for (const s of frontier) {
        const z = s.indexOf(0), k = key(s);
        for (const n of nbrs(z)) {
          if (lock.has(n)) continue;
          const t = s.slice(); t[z] = t[n]; t[n] = 0;
          const tk = key(t);
          if (seen.has(tk)) continue;
          seen.set(tk, [k, n]);
          if (goal(t)) {
            const path = [];
            for (let cur = tk; seen.get(cur); cur = seen.get(cur)[0]) path.unshift(seen.get(cur)[1]);
            return path;
          }
          next.push(t);
        }
      }
      frontier = next;
    }
    return null;
  }

  function scramble(mode) {
    const lock = new Set(LOCKS[mode]);
    const tiles = STAGES[mode === "full" ? "top" : mode].tiles;
    for (;;) {
      const b = GOAL.slice();
      let z = 8;
      for (let i = 0; i < 500; i++) {
        const opts = nbrs(z).filter((n) => !lock.has(n));
        const n = opts[(Math.random() * opts.length) | 0];
        b[z] = b[n]; b[n] = 0; z = n;
      }
      if (placed(b, tiles) <= Math.floor((tiles.length - 1) / 2) && !lessonDone(b, mode)) return b;
    }
  }

  function mount(el, { mode, onMove = () => {}, onStage = () => {}, onSolved = () => {} }) {
    const userLock = new Set(LOCKS[mode]);
    let b, moves, solved, hintCell, stage, autoTimer = null;

    el.innerHTML =
      GOAL.map((g, i) => `<div class="slot" style="${pos(i)}"><span>${g || ""}</span></div>`).join("") +
      [1, 2, 3, 4, 5, 6, 7, 8].map((v) => `<button class="tile" data-v="${v}" tabindex="-1"><span>${v}</span></button>`).join("");
    const tileEl = {};
    el.querySelectorAll(".tile").forEach((t) => (tileEl[t.dataset.v] = t));
    const slots = [...el.querySelectorAll(".slot")];

    function pos(i) {
      return `left:calc(8px + ${i % 3} * (100% - 16px) / 3);top:calc(8px + ${(i / 3) | 0} * (100% - 16px) / 3)`;
    }

    function draw() {
      const targets = new Set(STAGES[stage].tiles);
      b.forEach((v, i) => {
        if (!v) return;
        const t = tileEl[v];
        t.style.cssText = pos(i);
        t.classList.toggle("home", v === i + 1);
        t.classList.toggle("target", !solved && targets.has(v) && v !== i + 1);
        t.classList.toggle("locked", userLock.has(i));
        t.classList.toggle("hint", i === hintCell);
      });
      slots.forEach((s, i) => s.classList.toggle("show", !solved && targets.has(GOAL[i]) && b[i] !== GOAL[i]));
      el.classList.toggle("solved", solved);
    }

    function reset(board) {
      stopAuto();
      b = board || scramble(mode);
      moves = 0; solved = false; hintCell = -1; stage = stageFor(b, mode);
      draw(); onMove(moves); onStage(stage, false);
    }

    // Slide the tile at cell c (and any tiles between it and the gap) toward the gap.
    function slide(c) {
      if (solved || userLock.has(c)) return false;
      const z = b.indexOf(0);
      const sameRow = ((z / 3) | 0) === ((c / 3) | 0), sameCol = z % 3 === c % 3;
      if (c === z || (!sameRow && !sameCol)) return false;
      const step = sameRow ? Math.sign(c - z) : 3 * Math.sign(c - z);
      for (let g = z; g !== c; g += step) {
        if (userLock.has(g + step)) return false;
      }
      for (let g = z; g !== c; g += step) { b[g] = b[g + step]; b[g + step] = 0; moves++; }
      after();
      return true;
    }

    function after() {
      hintCell = -1;
      const s = stageFor(b, mode);
      if (s !== stage) { const order = { top: 0, col: 1, last: 2 }, adv = order[s] > order[stage]; stage = s; onStage(stage, adv); }
      if (lessonDone(b, mode)) { solved = true; stopAuto(); draw(); onMove(moves); onSolved(moves); return; }
      draw(); onMove(moves);
    }

    function hint() {
      if (solved) return false;
      const p = plan(b, stage);
      if (!p || !p.length) return false;
      hintCell = p[0]; draw();
      return true;
    }

    function stopAuto() { clearInterval(autoTimer); autoTimer = null; el.classList.remove("auto"); }
    function autoSolve() {
      if (solved || autoTimer) return false;
      el.classList.add("auto");
      autoTimer = setInterval(() => {
        const p = plan(b, stage);
        if (!p || !p.length) return stopAuto();
        const z = b.indexOf(0), n = p[0];
        b[z] = b[n]; b[n] = 0; moves++;
        after();
      }, 320);
      return true;
    }

    el.addEventListener("click", (e) => {
      const t = e.target.closest(".tile");
      if (!t || autoTimer) return;
      slide(b.indexOf(+t.dataset.v));
    });

    function handleKey(e) {
      const z = b.indexOf(0), c = z % 3, r = (z / 3) | 0;
      const target = { ArrowUp: r < 2 ? z + 3 : -1, ArrowDown: r > 0 ? z - 3 : -1, ArrowLeft: c < 2 ? z + 1 : -1, ArrowRight: c > 0 ? z - 1 : -1 }[e.key];
      if (target === undefined) return false;
      if (target >= 0 && !autoTimer) slide(target);
      return true;
    }

    reset();
    return {
      hint, autoSolve, handleKey, scramble: () => reset(),
      isSolved: () => solved, isAuto: () => !!autoTimer,
      stageInfo: () => STAGES[stage], destroy: stopAuto,
    };
  }

  return { mount, STAGES };
})();

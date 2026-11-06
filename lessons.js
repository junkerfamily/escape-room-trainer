/* Escape Room Trainer — lesson content.
   Each lesson: id, cat, title, summary, body (HTML), tells (signs you're facing it),
   visual (SVG/HTML), optional toggle {label, cls}, optional ref (HTML reference card),
   puzzle {prompt, answers[], hints[], explain}. */

const svg = (inner, w = 400, h = 260) =>
  `<svg class="viz" viewBox="0 0 ${w} ${h}" role="img" xmlns="http://www.w3.org/2000/svg">${inner}</svg>`;

const txt = (x, y, s, cls = "", size = 16, anchor = "middle") =>
  `<text x="${x}" y="${y}" class="${cls}" font-size="${size}" text-anchor="${anchor}">${s}</text>`;

const ALPHA = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

/* ---------- Generators ---------- */

const MORSE = {A:".-",B:"-...",C:"-.-.",D:"-..",E:".",F:"..-.",G:"--.",H:"....",I:"..",J:".---",K:"-.-",L:".-..",M:"--",N:"-.",O:"---",P:".--.",Q:"--.-",R:".-.",S:"...",T:"-",U:"..-",V:"...-",W:".--",X:"-..-",Y:"-.--",Z:"--.."};

function morseSvg(word) {
  let x = 0, out = "";
  const y = 120;
  [...word].forEach((ch, i) => {
    if (i) { out += `<line x1="${x + 6}" y1="${y - 24}" x2="${x + 6}" y2="${y + 24}" class="faint"/>`; x += 14; }
    for (const s of MORSE[ch]) {
      if (s === ".") { out += `<circle cx="${x + 7}" cy="${y}" r="7" class="fa"/>`; x += 22; }
      else { out += `<rect x="${x}" y="${y - 7}" width="34" height="14" rx="7" class="fa"/>`; x += 46; }
    }
  });
  const w = x + 40;
  return svg(
    `<g transform="translate(20,0)">${out}</g>` +
    txt(w / 2, 60, "The lantern blinks this pattern on a loop", "muted", 15) +
    txt(w / 2, 190, "short = dot · long = dash · gap = new letter", "muted", 13),
    Math.max(400, w), 230);
}

const MORSE_REF = `<div class="ref-grid mono">${ALPHA.split("").map(c => `<span><b>${c}</b> ${MORSE[c].replace(/\./g, "•").replace(/-/g, "–")}</span>`).join("")}</div>`;

const BRAILLE = {A:"1",B:"12",C:"14",D:"145",E:"15",F:"124",G:"1245",H:"125",I:"24",J:"245",K:"13",L:"123",M:"134",N:"1345",O:"135",P:"1234",Q:"12345",R:"1235",S:"234",T:"2345",U:"136",V:"1236",W:"2456",X:"1346",Y:"13456",Z:"1356"};

function brailleCell(ch, x, y, gap, r) {
  const pos = { 1: [0, 0], 2: [0, 1], 3: [0, 2], 4: [1, 0], 5: [1, 1], 6: [1, 2] };
  let out = "";
  for (let d = 1; d <= 6; d++) {
    const [c, rr] = pos[d];
    const on = BRAILLE[ch].includes(String(d));
    out += `<circle cx="${x + c * gap}" cy="${y + rr * gap}" r="${on ? r : r * 0.45}" class="${on ? "fa" : "dim"}"/>`;
  }
  return out;
}

function brailleSvg(word) {
  const step = 80, start = 200 - ((word.length - 1) * step) / 2 - 11;
  let out = `<rect x="30" y="50" width="340" height="150" rx="14" class="plate"/>`;
  [...word].forEach((ch, i) => (out += brailleCell(ch, start + i * step, 90, 22, 8)));
  out += txt(200, 230, "Brass plate beside the door — feel the bumps", "muted", 13);
  return svg(out);
}

const BRAILLE_REF = `<div class="ref-grid">${ALPHA.split("").map(c =>
  `<span class="braille-ref">${svg(brailleCell(c, 6, 6, 9, 3.2), 22, 30)}<b>${c}</b></span>`).join("")}</div>`;

function pigpenGlyph(ch, x, y, s) {
  const i = ALPHA.indexOf(ch);
  let lines = "", dot = false, dx = x + s / 2, dy = y + s / 2;
  if (i < 18) {
    const k = i % 9; dot = i >= 9;
    const r = Math.floor(k / 3), c = k % 3;
    if (r > 0) lines += `M${x} ${y}H${x + s}`;
    if (r < 2) lines += `M${x} ${y + s}H${x + s}`;
    if (c > 0) lines += `M${x} ${y}V${y + s}`;
    if (c < 2) lines += `M${x + s} ${y}V${y + s}`;
  } else {
    const k = (i - 18) % 4; dot = i >= 22;
    const m = s / 2;
    if (k === 0) { lines = `M${x} ${y}L${x + m} ${y + s * 0.8}L${x + s} ${y}`; dy = y + s * 0.3; }       // top: V
    if (k === 1) { lines = `M${x} ${y}L${x + s * 0.8} ${y + m}L${x} ${y + s}`; dx = x + s * 0.3; }       // left: >
    if (k === 2) { lines = `M${x + s} ${y}L${x + s * 0.2} ${y + m}L${x + s} ${y + s}`; dx = x + s * 0.7; } // right: <
    if (k === 3) { lines = `M${x} ${y + s}L${x + m} ${y + s * 0.2}L${x + s} ${y + s}`; dy = y + s * 0.7; } // bottom: ^
  }
  return `<path d="${lines}" class="ln thick"/>` + (dot ? `<circle cx="${dx}" cy="${dy}" r="${s / 12}" class="fa"/>` : "");
}

function pigpenSvg(word) {
  let key = "";
  const grid = (ox, letters, dotted) => {
    const c = 30;
    let g = `<path d="M${ox + c} 15V105M${ox + 2 * c} 15V105M${ox} ${15 + c}H${ox + 90}M${ox} ${15 + 2 * c}H${ox + 90}" class="ln"/>`;
    [...letters].forEach((L, j) => {
      const cx = ox + (j % 3) * c + 15, cy = 15 + Math.floor(j / 3) * c + 20;
      g += txt(cx - (dotted ? 3 : 0), cy, L, "", 13);
      if (dotted) g += `<circle cx="${cx + 7}" cy="${cy - 4}" r="2" class="fa"/>`;
    });
    return g;
  };
  const xs = (ox, letters, dotted) => {
    let g = `<path d="M${ox} 25L${ox + 70} 95M${ox + 70} 25L${ox} 95" class="ln"/>`;
    const p = [[35, 42], [12, 65], [58, 65], [35, 88]];
    [...letters].forEach((L, j) => {
      g += txt(ox + p[j][0] - (dotted ? 3 : 0), p[j][1], L, "", 13);
      if (dotted) g += `<circle cx="${ox + p[j][0] + 7}" cy="${p[j][1] - 4}" r="2" class="fa"/>`;
    });
    return g;
  };
  key += grid(15, "ABCDEFGHI", false) + grid(120, "JKLMNOPQR", true) + xs(230, "STUV", false) + xs(318, "WXYZ", true);
  let msg = `<rect x="20" y="135" width="360" height="110" rx="10" class="paper"/>`;
  const s = 50, step = 80, start = 200 - ((word.length - 1) * step) / 2 - s / 2;
  [...word].forEach((ch, i) => (msg += pigpenGlyph(ch, start + i * step, 165, s)));
  return svg(key + msg);
}

const SEG = { 0: "abcdef", 1: "bc", 2: "abged", 3: "abgcd", 4: "fgbc", 5: "afgcd", 6: "afgedc", 7: "abc", 8: "abcdefg", 9: "abcdfg" };
function segRects(segs, x, y) {
  const w = 40, h = 80, t = 8, hh = h / 2 - t - t / 2;
  const R = {
    a: [x + t, y, w - 2 * t, t], b: [x + w - t, y + t, t, hh], c: [x + w - t, y + h / 2 + t / 2, t, hh],
    d: [x + t, y + h - t, w - 2 * t, t], e: [x, y + h / 2 + t / 2, t, hh], f: [x, y + t, t, hh], g: [x + t, y + h / 2 - t / 2, w - 2 * t, t],
  };
  return [...segs].map(s => `<rect x="${R[s][0]}" y="${R[s][1]}" width="${R[s][2]}" height="${R[s][3]}" rx="2" class="fa"/>`).join("");
}
function overlayCards(digits) {
  let a = "", b = "";
  [...digits].forEach((d, i) => {
    const segs = [...SEG[d]];
    a += segRects(segs.filter((_, j) => j % 2 === 0).join(""), 25 + i * 60, 25);
    b += segRects(segs.filter((_, j) => j % 2 === 1).join(""), 25 + i * 60, 25);
  });
  const card = (inner, label, cls) =>
    `<div class="ov-card ${cls}">${svg(`<rect x="2" y="2" width="196" height="126" rx="10" class="card-bg"/>${inner}`, 200, 130)}<span>${label}</span></div>`;
  return `<div class="overlay-wrap">${card(a, "Card A (paper)", "ov-a")}${card(b, "Card B (clear acetate)", "ov-b")}</div>`;
}

function spiritBoard(marks) {
  let out = `<rect x="10" y="10" width="380" height="240" rx="18" class="plate"/>`;
  out += txt(40, 42, "YES", "muted", 14) + txt(360, 42, "NO", "muted", 14) + txt(200, 236, "GOODBYE", "muted", 13);
  const place = (letters, rx, ry) => letters.split("").map((L, i) => {
    const th = (160 - (140 * i) / (letters.length - 1)) * Math.PI / 180;
    return { L, x: 200 + rx * Math.cos(th), y: 212 - ry * Math.sin(th) };
  });
  const all = [...place("ABCDEFGHIJKLM", 168, 150), ...place("NOPQRSTUVWXYZ", 112, 68)];
  all.forEach(p => {
    const m = marks.indexOf(p.L);
    if (m >= 0) {
      out += `<circle cx="${p.x}" cy="${p.y - 6}" r="13" class="ring"/>`;
      out += `<circle cx="${p.x + 13}" cy="${p.y - 18}" r="8" class="fa"/>` + txt(p.x + 13, p.y - 14, m + 1, "on-accent", 11);
    }
    out += txt(p.x, p.y, p.L, "", 17);
  });
  return svg(out);
}

function cipherWheel(shift) {
  let out = "";
  const cx = 130, cy = 130;
  out += `<circle cx="${cx}" cy="${cy}" r="118" class="plate"/><circle cx="${cx}" cy="${cy}" r="88" class="ln faint-fill"/><circle cx="${cx}" cy="${cy}" r="58" class="ln"/>`;
  for (let i = 0; i < 26; i++) {
    const th = (i / 26) * 2 * Math.PI - Math.PI / 2;
    const o = (r) => [cx + r * Math.cos(th), cy + r * Math.sin(th) + 5];
    const [x1, y1] = o(103), [x2, y2] = o(73);
    out += txt(x1, y1, ALPHA[i], "", 13);
    out += txt(x2, y2, ALPHA[(i + shift) % 26], "accent-t", 12);
  }
  out += txt(cx, cy - 4, "outer = plain", "muted", 10) + txt(cx, cy + 10, "inner = coded", "accent-t", 10);
  out += `<rect x="275" y="75" width="110" height="110" rx="8" class="paper" transform="rotate(4 330 130)"/>`;
  out += txt(330, 120, "Note:", "muted", 12) + txt(330, 150, "V D I H", "mono-t", 24);
  return svg(out);
}

/* ---------- Lessons ---------- */

const CATEGORIES = [
  { id: "strategy", name: "Strategy", icon: "◎" },
  { id: "codes", name: "Codes & Ciphers", icon: "✎" },
  { id: "locks", name: "Locks & Keys", icon: "⚿" },
  { id: "logic", name: "Patterns & Logic", icon: "◇" },
  { id: "themes", name: "Themes", icon: "☗" },
];

const LESSONS = [
  /* ===== STRATEGY ===== */
  {
    id: "sweep", cat: "strategy", title: "The Room Sweep",
    summary: "Split the room into zones and search every surface: high, low, under and behind.",
    body: `<p>Most teams lose their first 5 minutes wandering. Give each person a zone instead and search it fully before moving on.</p>
      <ul><li><b>Three heights:</b> floor and under furniture, eye level, then ceiling and tops of shelves.</li>
      <li><b>Flip and open:</b> drawers, book spines, picture backs, rug corners, clock faces.</li>
      <li><b>Call out numbers and symbols</b> as you find them, even if they seem random.</li></ul>`,
    tells: ["Start of any room", "Nothing obvious to do yet", "Lock with no clue linked to it"],
    visual: svg(`
      <rect x="20" y="20" width="360" height="220" class="ln room"/>
      <path d="M200 20V240M20 130H380" class="faint dashed"/>
      ${txt(110, 125, "A", "zone", 40)}${txt(290, 125, "B", "zone", 40)}${txt(110, 230, "C", "zone", 40)}${txt(290, 230, "D", "zone", 40)}
      <rect x="20" y="236" width="50" height="8" class="door"/>${txt(45, 256, "door", "muted", 11)}
      <rect x="22" y="80" width="10" height="70" class="obj"/>${txt(27, 120, "4", "tiny", 9)}
      <rect x="70" y="26" width="110" height="22" class="obj"/>
      ${[0,1,2,3,4,5,6,7].map(i => `<rect x="${74 + i * 13}" y="29" width="9" height="16" class="obj2"/>`).join("")}${txt(113, 41, "9", "tiny", 9)}
      <rect x="185" y="150" width="100" height="60" rx="4" class="obj rug"/>${txt(279, 206, "2", "tiny", 9)}
      <circle cx="320" cy="62" r="24" class="obj"/><path d="M320 62V46M320 62L331 68" class="ln"/>${txt(320, 82, "7", "tiny", 9)}
      ${txt(27, 72, "painting", "muted", 10, "start")}${txt(125, 64, "bookshelf", "muted", 10)}${txt(235, 222, "rug", "muted", 10)}${txt(320, 102, "clock", "muted", 10)}
    `),
    puzzle: {
      prompt: "Four tiny digits are hidden on objects in this room. Read them from left to right to open a 4-digit lock.",
      answers: ["4927"],
      hints: ["Look closely at every object: painting, books, rug, clock.", "The painting on the left wall has one, and a book spine has another.", "Painting 4, bookshelf 9, rug corner 2, clock 7."],
      explain: "Painting (4), book spine (9), rug corner (2), under the clock (7). Reading order is often left to right, or clockwise from the door.",
    },
  },
  {
    id: "count", cat: "strategy", title: "Count & Color-Match",
    summary: "When a lock has colored dials or a set number of digits, look for things to count.",
    body: `<p>A lock tells you what kind of answer it wants. A 3-digit lock with colored stripes usually means: <b>count the objects of each color</b>.</p>
      <ul><li>Match the <b>number of dials</b> to the number of groups you find.</li>
      <li>The <b>order</b> comes from the lock (stripe colors), not from where the objects sit.</li>
      <li>Count twice. Teams often miss one item hidden behind another.</li></ul>`,
    tells: ["Colored dots or stripes on a lock", "Many copies of one object (candles, books, bottles)", "Item sets that come in a few colors"],
    visual: svg(`
      ${["r","g","g","b","r","g","g","r","g"].map((c, i) => `
        <rect x="${28 + i * 40}" y="70" width="18" height="${50 + (i % 3) * 12}" rx="3" class="c-${c}"/>
        <path d="M${37 + i * 40} 52q-7 10 0 16q7-6 0-16z" class="flame"/>`).join("")}
      ${txt(200, 30, "Candles on the mantel", "muted", 13)}
      <rect x="110" y="170" width="180" height="76" rx="12" class="plate"/>
      ${["r","g","b"].map((c, i) => `<rect x="${130 + i * 52}" y="180" width="36" height="8" rx="3" class="c-${c}"/>
        <rect x="${130 + i * 52}" y="195" width="36" height="40" rx="5" class="dial"/>${txt(148 + i * 52, 222, "?", "", 18)}`).join("")}
    `),
    puzzle: {
      prompt: "The lock has three dials marked red, green, blue. What is the code?",
      answers: ["351"],
      hints: ["Count the candles of each color.", "The stripe order on the lock is red → green → blue.", "Red 3, green 5, blue 1."],
      explain: "3 red, 5 green, 1 blue, entered in the lock's stripe order: 351.",
    },
  },
  {
    id: "talk", cat: "strategy", title: "Call It Out",
    summary: "Many puzzles are split so no single person can solve them. Say what you see out loud.",
    body: `<p>Good rooms hide <b>half of a clue in each of two places</b>, often in separate rooms or behind a window. Teams that narrate what they see win.</p>
      <ul><li>Say finds out loud: <i>"I've got a card with S, A, E and gaps."</i></li>
      <li>Keep a <b>clue pile</b> in one spot so everyone can see it.</li>
      <li>If two people are stuck on different things, <b>swap puzzles</b>. Fresh eyes help.</li></ul>`,
    tells: ["Cards with gaps or missing pieces", "Two rooms joined by a window, tube or intercom", "Half a picture"],
    visual: svg(`
      <rect x="20" y="50" width="170" height="130" rx="10" class="paper"/>${txt(105, 80, "Player A's card", "muted", 13)}
      ${txt(105, 140, "S _ A _ E", "mono-t", 28)}
      <rect x="210" y="50" width="170" height="130" rx="10" class="paper"/>${txt(295, 80, "Player B's card", "muted", 13)}
      ${txt(295, 140, "_ T _ K _", "mono-t", 28)}
      ${txt(200, 220, "Separate rooms, talking through a vent", "muted", 13)}
    `),
    puzzle: {
      prompt: "Combine both cards. What 5-letter word opens the letter lock?",
      answers: ["STAKE"],
      hints: ["Each card fills the other card's gaps.", "Letter 1 comes from A, letter 2 from B, and so on.", "S-T-A-K-E"],
      explain: "Fill the gaps from each card: S T A K E.",
    },
  },
  {
    id: "leftover", cat: "strategy", title: "Use It Once, Set It Aside",
    summary: "Most items are used exactly once. Put used items aside so the leftovers point to the next puzzle.",
    body: `<p>Escape room designers rarely reuse items. When something has done its job, <b>put it in a "done" pile</b>.</p>
      <ul><li>Leftover items are almost always needed for the puzzles still unsolved.</li>
      <li>Number cards, playing cards and dice often hide an <b>order</b>: sort them.</li>
      <li>Ask the game master whether a lock or prop is "in play" if you're unsure.</li></ul>`,
    tells: ["Items you haven't used yet", "Cards or tiles that can be ordered", "Halfway through the room and stuck"],
    visual: svg(`
      ${txt(70, 40, "Used:", "muted", 13)}
      ${["Brass key", "UV torch", "Old map"].map((s, i) => txt(70, 70 + i * 26, s, "struck", 14)).join("")}
      <path d="M135 30V160" class="faint"/>
      ${[["3", "♦", "L"], ["A", "♥", "G"], ["4", "♠", "D"], ["2", "♣", "O"]].map(([r, s, L], i) => `
        <g transform="translate(${150 + i * 60},${50 + (i % 2) * 14}) rotate(${(i - 1.5) * 5})">
          <rect width="52" height="76" rx="6" class="card"/>
          ${txt(10, 16, r, "", 12, "start")}${txt(10, 30, s, s === "♥" || s === "♦" ? "suit-r" : "", 12, "start")}
          ${txt(26, 58, L, "mono-t", 26)}
        </g>`).join("")}
      ${txt(270, 200, "Four playing cards, one letter each", "muted", 13)}
      ${txt(270, 222, "Lock: 4 letters", "muted", 13)}
    `),
    puzzle: {
      prompt: "The leftover cards are the last clue. What 4-letter word opens the lock?",
      answers: ["GOLD"],
      hints: ["Card ranks give you an order.", "Sort them Ace, 2, 3, 4.", "A=G, 2=O, 3=L, 4=D."],
      explain: "Sorted by rank: Ace G, 2 O, 3 L, 4 D → GOLD.",
    },
  },

  /* ===== CODES ===== */
  {
    id: "caesar", cat: "codes", title: "Caesar Shift",
    summary: "Every letter is moved the same number of places along the alphabet.",
    body: `<p>The most common cipher in escape rooms. Often there's a <b>wheel</b> or two rings of letters. Line them up and read across.</p>
      <ul><li>Look for a number nearby: that's usually the <b>shift</b>.</li>
      <li>No shift given? Try 3 (the classic), then 13 (ROT13).</li>
      <li>Short 3- or 4-letter words help: in a shifted message, the same coded letter always stands for the same real letter.</li></ul>`,
    tells: ["Two rings of letters", "Gibberish words of normal length", "A lone number like +3 or 'III'"],
    visual: cipherWheel(3),
    puzzle: {
      prompt: "The wheel shows the shift. Decode the note “V D I H”.",
      answers: ["SAFE"],
      hints: ["Find each coded letter on the inner ring.", "Read the plain letter just outside it (shift back 3).", "V→S, D→A, I→F, H→E"],
      explain: "Each letter moves back 3: V→S, D→A, I→F, H→E = SAFE.",
    },
  },
  {
    id: "a1z26", cat: "codes", title: "Letters as Numbers (A1Z26)",
    summary: "A=1, B=2 … Z=26. Numbers never higher than 26 are a giveaway.",
    body: `<p>Simple and everywhere. Works both ways: a <b>word clue for a number lock</b>, or <b>numbers for a letter lock</b>.</p>
      <ul><li>No number above 26? Think A1Z26 first.</li>
      <li>Quick anchors: <b>E=5, J=10, O=15, T=20, Y=25</b>.</li>
      <li>Watch for reversed versions (Z=1).</li></ul>`,
    tells: ["Numbers 1–26 separated by dashes or dots", "Letter lock with a numeric clue"],
    visual: svg(`
      <rect x="60" y="45" width="280" height="150" rx="8" class="paper" transform="rotate(-3 200 120)"/>
      ${txt(200, 90, "scratched into the desk:", "muted", 13)}
      ${txt(200, 145, "4 · 15 · 15 · 18", "mono-t", 32)}
      ${txt(200, 230, "Letter lock with 4 dials", "muted", 13)}
    `),
    puzzle: {
      prompt: "Turn these numbers into a 4-letter word.",
      answers: ["DOOR"],
      hints: ["Each number is a letter's place in the alphabet.", "O is the 15th letter.", "4=D, 15=O, 18=R"],
      explain: "4=D, 15=O, 15=O, 18=R → DOOR.",
    },
  },
  {
    id: "morse", cat: "codes", title: "Morse Code",
    summary: "Dots and dashes, often shown as flashing lights, beeps or knocks.",
    body: `<p>Rooms deliver Morse through <b>blinking lights, sounds, taps or long and short marks</b>. A reference chart is usually somewhere in the room, so find it first.</p>
      <ul><li>One person calls out "short / long" while another writes it down.</li>
      <li>A longer pause means a <b>new letter</b>.</li>
      <li>Memorize SOS (• • • – – – • • •), E (•) and T (–).</li></ul>`,
    tells: ["Lights that blink in a pattern", "Rhythmic beeps or knocks", "Rows of dots and dashes"],
    visual: morseSvg("CLUE"),
    ref: MORSE_REF,
    puzzle: {
      prompt: "Decode the lantern's pattern using the chart.",
      answers: ["CLUE"],
      hints: ["There are 4 letters, split by the faint lines.", "The last letter is a single dot: E.", "C (–•–•), L (•–••), U (••–), E (•)"],
      explain: "–•–• C, •–•• L, ••– U, • E → CLUE.",
    },
  },
  {
    id: "pigpen", cat: "codes", title: "Pigpen Cipher",
    summary: "Letters drawn as pieces of a tic-tac-toe grid and an X, some with dots.",
    body: `<p>Each letter becomes <b>the shape of the box around it</b> in the key. The second grid and X add a dot.</p>
      <ul><li>Find the key first. It's often on a wall, a book page or a tattoo.</li>
      <li>Match the <b>open sides</b> of each shape to a grid position.</li>
      <li>Dot or no dot tells you which half of the key to use.</li></ul>`,
    tells: ["Angular symbols made of right angles and Vs", "Some symbols have a dot", "Masonic or secret-society themes"],
    visual: pigpenSvg("GATE"),
    puzzle: {
      prompt: "Use the key at the top to decode the 4 symbols.",
      answers: ["GATE"],
      hints: ["No dots, so only use the first grid and first X.", "Symbol 3 is the left piece of the X.", "G (bottom-left), A (top-left), T (X left), E (center box)."],
      explain: "Bottom-left corner = G, top-left = A, left wedge of the X = T, full center box = E → GATE.",
    },
  },
  {
    id: "braille", cat: "codes", title: "Braille",
    summary: "Raised dots in 2×3 cells. Shown on plates, buttons or as patterns of holes.",
    body: `<p>Each cell has six dot positions. Rooms use Braille on <b>plaques, dice, egg cartons, peg boards</b>, anything with a grid of bumps.</p>
      <ul><li>The first 10 letters (A–J) use only the top four dots.</li>
      <li>K–T are A–J plus the bottom-left dot.</li>
      <li>Count positions carefully: one wrong dot changes the letter.</li></ul>`,
    tells: ["Grids of 2×3 bumps or holes", "Things meant to be touched in the dark", "Egg cartons or peg boards"],
    visual: brailleSvg("EXIT"),
    ref: BRAILLE_REF,
    puzzle: {
      prompt: "Read the plate using the chart. What does it say?",
      answers: ["EXIT"],
      hints: ["4 cells = 4 letters.", "Cell 1 has dots in the top-left and the middle-right: E.", "E, X, I, T"],
      explain: "E (dots 1·5), X (1·3·4·6), I (2·4), T (2·3·4·5) → EXIT.",
    },
  },
  {
    id: "keypad", cat: "codes", title: "Phone Keypad",
    summary: "Old phones put letters on numbers. Press 2 twice for B.",
    body: `<p>Shows up as <b>repeated digits</b> (44 = H) or as a word turned into a number (CAB = 222).</p>
      <ul><li>Repeated digits → count presses for the letter.</li>
      <li>7 and 9 have four letters (PQRS, WXYZ).</li>
      <li>A rotary or push-button phone in the room is a strong hint.</li></ul>`,
    tells: ["Groups of the same digit", "A phone prop", "Only digits 2–9 appear"],
    visual: svg(`
      <rect x="40" y="20" width="170" height="225" rx="16" class="plate"/>
      ${[["1",""],["2","ABC"],["3","DEF"],["4","GHI"],["5","JKL"],["6","MNO"],["7","PQRS"],["8","TUV"],["9","WXYZ"],["*",""],["0",""],["#",""]].map(([n, l], i) => {
        const x = 55 + (i % 3) * 50, y = 32 + Math.floor(i / 3) * 52;
        return `<rect x="${x}" y="${y}" width="40" height="44" rx="8" class="dial"/>${txt(x + 20, y + 22, n, "", 17)}${txt(x + 20, y + 37, l, "muted", 9)}`;
      }).join("")}
      <rect x="235" y="80" width="145" height="100" rx="8" class="paper" transform="rotate(3 300 130)"/>
      ${txt(307, 112, "answering machine:", "muted", 11)}${txt(307, 145, "44 2 555 555", "mono-t", 19)}
    `),
    puzzle: {
      prompt: "Decode the message left on the answering machine.",
      answers: ["HALL"],
      hints: ["Count how many times each key is pressed.", "44 = the 2nd letter on key 4.", "H, A, L, L"],
      explain: "44 = H, 2 = A, 555 = L, 555 = L → HALL.",
    },
  },
  {
    id: "roman", cat: "codes", title: "Roman Numerals",
    summary: "I V X L C D M. Popular in clocks, tombs, castles and dates.",
    body: `<p>Look for numerals on <b>clock faces, book chapters, gravestones and carved dates</b>. They often give a year for a 4-digit lock.</p>
      <ul><li>I=1, V=5, X=10, L=50, C=100, D=500, M=1000.</li>
      <li>A smaller letter <b>before</b> a bigger one is subtracted (IV = 4, CM = 900).</li>
      <li>Work left to right in chunks.</li></ul>`,
    tells: ["Carved dates", "Clock with numerals", "Chapter or volume numbers"],
    visual: svg(`
      <path d="M60 230V90a140 70 0 0 1 280 0V230" class="ln thick"/>
      <rect x="85" y="100" width="230" height="44" rx="4" class="plate"/>
      ${txt(200, 131, "MCMLXXXIV", "mono-t", 26)}
      ${txt(200, 175, "carved above the crypt door", "muted", 13)}
      <rect x="150" y="190" width="100" height="40" rx="6" class="dial"/>${txt(200, 216, "_ _ _ _", "", 18)}
    `),
    puzzle: {
      prompt: "The crypt has a 4-digit lock. What year is carved above the door?",
      answers: ["1984"],
      hints: ["Split it: M · CM · L · XXX · IV", "M=1000, CM=900", "1000 + 900 + 50 + 30 + 4"],
      explain: "M(1000) CM(900) L(50) XXX(30) IV(4) = 1984.",
    },
  },
  {
    id: "binary", cat: "codes", title: "Binary Lights",
    summary: "On/off, filled/empty, up/down: anything with two states can hide binary.",
    body: `<p>Rows of 4 switches or lights are the classic sign. Read each row as a number using place values <b>8 · 4 · 2 · 1</b>.</p>
      <ul><li>Add up the place values of the lit items.</li>
      <li>Rows of 5 often mean letters (A1Z26 in binary).</li>
      <li>Check which end is "1". It's usually the right.</li></ul>`,
    tells: ["Rows of identical lights or switches", "Only two states shown", "Tech, hacker or sci-fi themes"],
    visual: svg(`
      ${["0101", "0011", "1000"].map((row, r) => [...row].map((b, c) =>
        `<circle cx="${130 + c * 48}" cy="${60 + r * 60}" r="17" class="${b === "1" ? "bulb-on" : "bulb-off"}"/>`).join("")).join("")}
      ${["Row 1", "Row 2", "Row 3"].map((s, r) => txt(70, 65 + r * 60, s, "muted", 13)).join("")}
      ${txt(200, 245, "Server rack status lights", "muted", 13)}
    `),
    puzzle: {
      prompt: "Each row is one digit of a 3-digit code. What is it?",
      answers: ["538"],
      hints: ["The four bulbs are worth 8, 4, 2, 1 (left to right).", "Row 1: the 4 and the 1 are lit.", "4+1=5, 2+1=3, 8"],
      explain: "0101 = 5, 0011 = 3, 1000 = 8 → 538.",
    },
  },

  /* ===== LOCKS ===== */
  {
    id: "directional", cat: "locks", title: "Directional Locks",
    summary: "Push up/down/left/right. Answers come from paths, compasses, dance steps.",
    body: `<p>A directional lock opens with a sequence of moves, and <b>length can vary</b>. Clues are usually a <b>path to trace</b>.</p>
      <ul><li>Mazes, footprints, star maps, arrows on floor tiles.</li>
      <li>Compass words: N = up, E = right, S = down, W = left.</li>
      <li>Reset the lock (pull the shackle) before every try.</li></ul>`,
    tells: ["Arrows or paths in the room", "Compass rose", "A lock with a single knob"],
    visual: svg(`
      ${[0,1,2,3,4].map(c => [0,1,2,3].map(r => `<circle cx="${100 + c * 50}" cy="${50 + r * 50}" r="4" class="dim"/>`).join("")).join("")}
      <polyline points="100,50 150,50 200,50 200,100 150,100 150,150" class="path"/>
      <circle cx="100" cy="50" r="10" class="fa"/>${txt(100, 30, "START", "muted", 11)}
      ${txt(150, 157, "★", "accent-t", 22)}
      ${txt(200, 245, "Footprints painted on the floor tiles", "muted", 13)}
    `),
    puzzle: {
      prompt: "Follow the path from START to the star. Type each move as U, D, L or R.",
      answers: ["RRDLD"],
      hints: ["Count each step between dots as one move.", "Two steps right first.", "Right, Right, Down, Left, Down"],
      explain: "R, R, D, L, D. Each segment between dots is one push.",
    },
  },
  {
    id: "wordlock", cat: "locks", title: "Word Locks & Theme",
    summary: "Letter dials limit the possible words. When several fit, the theme decides.",
    body: `<p>Each letter dial only has a few letters. List what's possible, then <b>pick the word that fits the story</b>.</p>
      <ul><li>Start with the dial that has the fewest vowels.</li>
      <li>Several real words? Choose the one that matches the room's theme.</li>
      <li>Designers pick theme words: pirates → CHEST, GOLD, MAP.</li></ul>`,
    tells: ["5-dial letter lock", "Clue narrows letters but doesn't spell the word"],
    visual: svg(`
      <rect x="45" y="30" width="310" height="190" rx="18" class="plate"/>
      ${[["B","C","T"],["A","H","R"],["E","I","O"],["L","N","S"],["K","P","T"]].map((col, i) => `
        <rect x="${70 + i * 56}" y="50" width="44" height="150" rx="8" class="dial"/>
        ${col.map((L, j) => txt(92 + i * 56, 90 + j * 44, L, "mono-t", 24)).join("")}`).join("")}
      ${txt(200, 248, "Found in the captain's cabin of a pirate ship", "muted", 13)}
    `),
    puzzle: {
      prompt: "Pick one letter per dial to make a word. Several words are possible. Which fits a pirate ship?",
      answers: ["CHEST"],
      hints: ["Try words ending in T.", "CREST is a word too. What would pirates lock things in?", "C-H-E-S-T"],
      explain: "CREST and BRINK also fit, but on a pirate ship the treasure CHEST is the theme word.",
    },
  },
  {
    id: "lockmatch", cat: "locks", title: "Match Clue to Lock",
    summary: "Every clue has a shape: digits, letters, colors or directions. Match it to the right lock.",
    body: `<p>Rooms have several locks at once. Saving time means <b>knowing which lock a clue belongs to</b> without trying them all.</p>
      <ul><li>Count the answer's length and type, then match it to a lock.</li>
      <li>Number words ("eight one four") are digits, not letters.</li>
      <li>Some locks are decoys or meant for later. That's normal.</li></ul>`,
    tells: ["More locks than clues", "Clues that don't seem to fit anything"],
    visual: svg(`
      ${[["1", "3 digits", "0 0 0"], ["2", "4 letters", "A A A A"], ["3", "arrows", "↑ ↓ ← →"], ["4", "colors", "● ● ● ●"]].map(([n, l, f], i) => `
        <rect x="${18 + i * 96}" y="20" width="84" height="80" rx="10" class="plate"/>
        ${txt(60 + i * 96, 44, "Lock " + n, "", 13)}${txt(60 + i * 96, 68, f, "mono-t", 13)}${txt(60 + i * 96, 90, l, "muted", 11)}`).join("")}
      ${[["A", "W O L F"], ["B", "↑ ↑ → ↓"], ["C", "eight · one · four"]].map(([n, c], i) => `
        <rect x="${18 + i * 128}" y="135" width="116" height="80" rx="8" class="paper"/>
        ${txt(76 + i * 128, 158, "Clue " + n, "muted", 12)}${txt(76 + i * 128, 192, c, "mono-t", i === 2 ? 13 : 20)}`).join("")}
      ${txt(200, 245, "Which lock does each clue open?", "muted", 13)}
    `),
    puzzle: {
      prompt: "Give the lock numbers for clues A, B and C in order (e.g. 412).",
      answers: ["231"],
      hints: ["WOLF is 4 letters.", "Arrows go with arrows. Number words are digits.", "A→2, B→3, C→1"],
      explain: "WOLF → letter lock 2, arrows → directional 3, 'eight one four' → 3-digit lock 1. Lock 4 is a decoy for now.",
    },
  },
  {
    id: "uv", cat: "locks", title: "UV Light & Invisible Ink",
    summary: "Found a purple flashlight? Shine it on everything, including walls, ceilings and props.",
    body: `<p>UV (blacklight) torches reveal <b>invisible ink</b>. Once you have one, re-sweep the room. Clues may be on surfaces you already searched.</p>
      <ul><li>Go slow. UV writing is faint and only visible up close.</li>
      <li>Turn off room lights if you can.</li>
      <li>Check the backs of notes, under tables and inside drawers.</li></ul>`,
    tells: ["A torch with a purple bulb", "A note that seems too boring", "Dark rooms with odd blank surfaces"],
    visual: svg(`
      <rect x="40" y="30" width="320" height="200" rx="8" class="paper uv-paper"/>
      ${txt(200, 70, "Dear Sir,", "hand", 18)}
      ${txt(200, 105, "nothing of interest", "hand", 18)}
      ${txt(200, 135, "is written on this page.", "hand", 18)}
      ${txt(200, 175, "— The Butler", "hand", 16)}
      ${txt(85, 95, "8", "uv", 34)}${txt(310, 160, "1", "uv", 34)}${txt(180, 215, "6", "uv", 34)}
      <rect x="40" y="30" width="320" height="200" rx="8" class="uv-glow"/>
    `),
    toggle: { label: "Shine UV torch", cls: "uv-on" },
    puzzle: {
      prompt: "Shine the torch on the note. Hidden digits appear. Read them top to bottom.",
      answers: ["816"],
      hints: ["Press “Shine UV torch” under the picture.", "Three digits: top-left, right, bottom.", "8, then 1, then 6"],
      explain: "Under UV: 8 (top), 1 (middle), 6 (bottom) → 816.",
    },
  },
  {
    id: "mirror", cat: "locks", title: "Mirrors & Reflections",
    summary: "Backwards writing means a mirror is nearby, or the clue was meant to be seen in one.",
    body: `<p>Mirrors also reveal clues <b>painted on the ceiling</b> or behind you. Any reversed text is a strong hint.</p>
      <ul><li>Hold the clue up to a mirror, or read it through the back of the paper against a light.</li>
      <li>A mirror placed oddly in a room is almost always a clue.</li>
      <li>Phone cameras can't flip text easily. Use the room's mirror.</li></ul>`,
    tells: ["Backwards letters", "Hand mirror prop", "Mirror at a strange angle"],
    visual: svg(`
      <rect x="40" y="60" width="320" height="110" rx="10" class="paper"/>
      <g class="mirror-text">${txt(200, 132, "LANTERN", "mono-t", 46)}</g>
      ${txt(200, 215, "Scratched on the back of the wardrobe", "muted", 13)}
    `),
    toggle: { label: "Hold up the mirror", cls: "flipped" },
    puzzle: {
      prompt: "What word is written backwards?",
      answers: ["LANTERN"],
      hints: ["Read right-to-left.", "Or press “Hold up the mirror”.", "L-A-N-T-E-R-N"],
      explain: "Mirrored, it reads LANTERN, likely the next prop to search.",
    },
  },

  /* ===== LOGIC ===== */
  {
    id: "sequence", cat: "logic", title: "Number Sequences",
    summary: "Find the rule: add, multiply, or look at the gaps between numbers.",
    body: `<p>When there's a "?" at the end of a list, check <b>the differences between neighbors</b> first.</p>
      <ul><li>Constant difference → adding.</li>
      <li>Differences growing steadily → look at the gaps between the gaps.</li>
      <li>Also try: squares, primes, doubling, Fibonacci (each = sum of the two before).</li></ul>`,
    tells: ["A list ending in ?", "Numbered tiles with one missing"],
    visual: svg(`
      ${["2", "6", "12", "20", "30", "?"].map((n, i) => `
        <rect x="${22 + i * 62}" y="85" width="52" height="60" rx="8" class="${n === "?" ? "dial accent-b" : "plate"}"/>
        ${txt(48 + i * 62, 124, n, "mono-t", 22)}`).join("")}
      ${["+4", "+6", "+8", "+10"].map((d, i) => txt(79 + i * 62, 175, d, "muted dimtext", 13)).join("")}
      ${txt(200, 50, "Tiles on the vault floor", "muted", 13)}
    `),
    puzzle: {
      prompt: "What number replaces the “?”",
      answers: ["42"],
      hints: ["Look at the gaps: +4, +6, +8, +10…", "The next gap is +12.", "30 + 12"],
      explain: "Gaps grow by 2 each time: +12 → 42. (Also n×(n+1): 6×7.)",
    },
  },
  {
    id: "clock", cat: "logic", title: "Stopped Clocks",
    summary: "A clock stuck at a strange time is almost always a code.",
    body: `<p>Read the time as digits: <b>3:45 → 345 or 0345</b>. Sometimes the hands point to numbers you read separately.</p>
      <ul><li>Check if the clock has a 4-digit or 3-digit lock nearby.</li>
      <li>Moveable hands? Setting a time may <b>trigger</b> something.</li>
      <li>Several clocks? Their order matters. Look for a label or room order.</li></ul>`,
    tells: ["A clock that doesn't tick", "Hands set to an odd time", "Several clocks in one room"],
    visual: svg(`
      <circle cx="200" cy="125" r="100" class="plate"/>
      <circle cx="200" cy="125" r="88" class="ln"/>
      ${Array.from({ length: 12 }, (_, i) => {
        const th = ((i + 1) / 12) * 2 * Math.PI - Math.PI / 2;
        return txt(200 + 72 * Math.cos(th), 131 + 72 * Math.sin(th), i + 1, "", 15);
      }).join("")}
      <line x1="200" y1="125" x2="${200 + 42 * Math.cos((112.5 - 90) * Math.PI / 180)}" y2="${125 + 42 * Math.sin((112.5 - 90) * Math.PI / 180)}" class="hand thick"/>
      <line x1="200" y1="125" x2="134" y2="125" class="hand"/>
      <circle cx="200" cy="125" r="5" class="fa"/>
      ${txt(200, 250, "The grandfather clock has stopped", "muted", 13)}
    `),
    puzzle: {
      prompt: "The cabinet below has a 4-digit lock. Enter the time shown.",
      answers: ["0345", "345", "1545"],
      hints: ["The short hand is just before 4.", "The long hand points at 9 = 45 minutes.", "3:45"],
      explain: "Short hand between 3 and 4, long hand on 9 → 3:45 → 0345.",
    },
  },
  {
    id: "symbols", cat: "logic", title: "Symbol Equations",
    summary: "Symbols stand for numbers. Solve the easiest line first.",
    body: `<p>A quick algebra puzzle. Find the line with <b>only one kind of symbol</b> and work outward from there.</p>
      <ul><li>Write each symbol's value down as you find it.</li>
      <li>Then read the lock's symbol order to get the code.</li>
      <li>Symbols may also match objects in the room (stars on a ceiling…).</li></ul>`,
    tells: ["Symbols with + − × =", "A lock with symbols instead of numbers"],
    visual: svg(`
      <rect x="40" y="20" width="320" height="160" rx="10" class="paper"/>
      ${txt(200, 65, "★ + ★ = 10", "mono-t", 26)}
      ${txt(200, 110, "★ + ● = 8", "mono-t", 26)}
      ${txt(200, 155, "● × ▲ = 9", "mono-t", 26)}
      <rect x="125" y="198" width="150" height="46" rx="8" class="plate"/>
      ${txt(200, 228, "★  ●  ▲", "mono-t", 22)}
    `),
    puzzle: {
      prompt: "The lock reads ★ ● ▲. What's the 3-digit code?",
      answers: ["533"],
      hints: ["Start with ★ + ★ = 10.", "★ = 5, so ● = 3.", "3 × ▲ = 9"],
      explain: "★ = 5, ● = 3, ▲ = 3 → 533.",
    },
  },
  {
    id: "overlay", cat: "logic", title: "Overlays & Transparencies",
    summary: "Two incomplete images that make sense only when stacked.",
    body: `<p>Clear plastic sheets, cut-out grilles, tracing paper. If something looks <b>incomplete on its own</b>, look for its partner.</p>
      <ul><li>Line up corners or registration marks.</li>
      <li>Try flipping and rotating the sheet. Some only fit one way.</li>
      <li>Hold both against a light or window.</li></ul>`,
    tells: ["Transparent sheets", "Broken-looking shapes", "Cards with holes punched in them"],
    visual: overlayCards("429"),
    toggle: { label: "Overlay the cards", cls: "overlaid" },
    puzzle: {
      prompt: "Stack the cards. What 3-digit number appears?",
      answers: ["429"],
      hints: ["Press “Overlay the cards” under the picture.", "They're 7-segment digits, like on an alarm clock.", "4, 2, 9"],
      explain: "Each card holds half of the segments. Together: 4 2 9.",
    },
  },
  {
    id: "colors", cat: "logic", title: "Color Mixing",
    summary: "Primary colors combine: red+yellow=orange, blue+yellow=green, red+blue=purple.",
    body: `<p>Shows up with <b>colored lights, filters, paints and potions</b>. Overlapping filters or lights gives a new color.</p>
      <ul><li>Paint/filters: R+Y = orange, B+Y = green, R+B = purple.</li>
      <li>Light (RGB): R+G = yellow, R+B = magenta, G+B = cyan. Different rules!</li>
      <li>Answers are often the first letters of the colors.</li></ul>`,
    tells: ["Potion bottles", "Colored gels or flashlights", "A lock with color names"],
    visual: svg(`
      ${[["r", "y"], ["b", "y"], ["r", "b"]].map(([a, b], i) => `
        <circle cx="${70 + i * 130}" cy="90" r="26" class="c-${a}"/>
        <circle cx="${105 + i * 130}" cy="90" r="26" class="c-${b}"/>
        ${txt(87 + i * 130, 160, "= ?", "mono-t", 22)}
        ${txt(87 + i * 130, 192, "Flask " + (i + 1), "muted", 12)}`).join("")}
      ${txt(200, 238, "Mix two potions in each flask", "muted", 13)}
    `),
    puzzle: {
      prompt: "Mix each pair. The lock wants the first letter of each new color (3 letters).",
      answers: ["OGP", "ORANGEGREENPURPLE"],
      hints: ["These are paints and potions, not lights.", "Red + yellow = orange.", "Orange, Green, Purple"],
      explain: "Orange, Green, Purple → OGP.",
    },
  },
  {
    id: "logicgrid", cat: "logic", title: "Logic Grids",
    summary: "Who has what? Cross off what's impossible until one option is left.",
    body: `<p>Detective rooms love these. Draw a grid and <b>mark ✗ for every impossibility</b>. Each row and column ends with exactly one ✓.</p>
      <ul><li>Start with clues that rule out the most.</li>
      <li>When a row has one blank left, that's a ✓, and you can ✗ the rest of its column.</li>
      <li>Read negative clues carefully ("doesn't", "never").</li></ul>`,
    tells: ["A list of people and items", "Statements like 'X never…'", "Murder-mystery rooms"],
    visual: svg(`
      ${["Cat", "Dog", "Fish"].map((p, i) => txt(195 + i * 60, 50, p, "", 14)).join("")}
      ${["Ann", "Ben", "Cal"].map((n, i) => txt(120, 92 + i * 48, n, "", 15, "end")).join("")}
      <rect x="165" y="62" width="180" height="144" class="ln"/>
      <path d="M225 62V206M285 62V206M165 110H345M165 158H345" class="ln faint"/>
      ${txt(195, 94, "✗", "bad-t", 20)}${txt(255, 94, "✗", "bad-t", 20)}
      ${txt(200, 238, "Ann: allergic to fur  ·  Ben's pet never barks", "muted", 13)}
    `),
    puzzle: {
      prompt: "Ann is allergic to fur. Ben's pet never barks. Who owns the dog?",
      answers: ["CAL"],
      hints: ["Ann can't have a cat or a dog, so Ann has the fish.", "Ben's pet doesn't bark, and the fish is taken.", "Ben has the cat."],
      explain: "Ann → fish (no fur). Ben → cat (doesn't bark). That leaves Cal with the dog.",
    },
  },

  /* ===== THEMES ===== */
  {
    id: "pirate", cat: "themes", title: "Pirate & Treasure",
    summary: "Maps with grids, compasses, knots, ship's logs and buried chests.",
    body: `<p>Expect: <b>map coordinates, compass directions</b> (directional locks), flags, star charts and lots of chests.</p>
      <ul><li>Grid maps → a letter and number (e.g. D3) or a spot to dig/search.</li>
      <li>Compass roses → directional lock answers.</li>
      <li>Ship's logs and dates often hide numbers.</li></ul>`,
    tells: ["Ship's wheel or compass", "Parchment maps", "Barrels, rope, flags"],
    visual: svg(`
      <rect x="40" y="20" width="320" height="220" rx="8" class="paper map"/>
      ${["A", "B", "C", "D", "E"].map((L, i) => txt(95 + i * 55, 44, L, "", 14)).join("")}
      ${[1, 2, 3, 4].map((n, i) => txt(58, 82 + i * 45, n, "", 14)).join("")}
      <path d="M70 55H345M70 100H345M70 145H345M70 190H345M70 235H345M70 55V235M125 55V235M180 55V235M235 55V235M290 55V235M345 55V235" class="faint"/>
      <path d="M120 90q40 -30 80 10t90 40q20 40 -20 70t-120 -10q-50 -40 -30 -110z" class="island"/>
      ${txt(262, 177, "✕", "accent-t", 30)}
      <path d="M95 210l8 -16 8 16M103 194v-8" class="ln"/>${txt(103, 225, "N", "muted", 10)}
    `),
    puzzle: {
      prompt: "Which grid square has the X? (column letter then row number)",
      answers: ["D3", "3D"],
      hints: ["Columns are letters across the top.", "The X is in column D.", "Row 3"],
      explain: "Column D, row 3 → D3.",
    },
  },
  {
    id: "egypt", cat: "themes", title: "Egyptian Tomb",
    summary: "Hieroglyph keys, scales, scarabs, Egyptian numbers and hidden passages.",
    body: `<p>Tomb rooms mix <b>symbol substitution</b> (hieroglyph → letter), balancing scales and <b>Egyptian numbers</b>.</p>
      <ul><li>Egyptian numbers: <b>| = 1, ∩ = 10, coil = 100</b>. Just add them up.</li>
      <li>Look for a hieroglyph key on a wall or scroll.</li>
      <li>Weights and scales usually need the pans to balance.</li></ul>`,
    tells: ["Sand, gold and stone textures", "Rows of carved symbols", "Sarcophagus or canopic jars"],
    visual: svg(`
      <rect x="30" y="40" width="340" height="150" rx="6" class="plate"/>
      ${[0, 1].map(i => `<path d="M${68 + i * 46} 140a14 14 0 1 1 10 -14q0 22 -22 22" class="ln thick"/>`).join("")}
      ${[0, 1, 2, 3].map(i => `<path d="M${160 + i * 26} 150v-26a10 10 0 0 1 20 0v26" class="ln thick"/>`).join("")}
      ${[0, 1, 2, 3, 4, 5, 6].map(i => `<path d="M${276 + i * 12} 150v-38" class="ln thick"/>`).join("")}
      ${txt(200, 225, "Carved into the sarcophagus lid  ·  3-digit lock", "muted", 13)}
    `),
    puzzle: {
      prompt: "Read the Egyptian number. What's the 3-digit code?",
      answers: ["247"],
      hints: ["Coil = 100, arch (∩) = 10, stroke = 1.", "There are 2 coils and 4 arches.", "200 + 40 + 7"],
      explain: "2 coils (200) + 4 arches (40) + 7 strokes (7) = 247.",
    },
  },
  {
    id: "detective", cat: "themes", title: "Detective & Murder Mystery",
    summary: "Timelines, alibis, fingerprints and evidence boards. Eliminate suspects.",
    body: `<p>Solve the crime to escape. Expect <b>alibis, timelines, logic grids</b> and matching evidence to suspects.</p>
      <ul><li>Lay statements on a timeline. Gaps reveal the culprit.</li>
      <li>Answer locks often take the culprit's <b>name</b> or the weapon.</li>
      <li>Ignore flavor text that doesn't touch a time, place or object.</li></ul>`,
    tells: ["Suspect photos", "Witness statements", "Evidence bags and string boards"],
    visual: svg(`
      ${["8pm", "9pm", "10pm", "11pm"].map((t, i) => txt(130 + i * 80, 40, t, "muted", 12)).join("")}
      <path d="M130 50V200M210 50V200M290 50V200M370 50V200" class="faint"/>
      <path d="M250 50V200" class="bad dashed"/>${txt(250, 218, "crime 9:30", "bad-t", 12)}
      ${txt(115, 85, "Mrs. Reed", "", 13, "end")}<rect x="130" y="70" width="160" height="20" rx="4" class="bar"/>
      ${txt(115, 135, "Col. Hart", "", 13, "end")}<rect x="130" y="120" width="80" height="20" rx="4" class="bar"/><rect x="290" y="120" width="80" height="20" rx="4" class="bar"/>
      ${txt(115, 185, "Dr. Vane", "", 13, "end")}<rect x="210" y="170" width="160" height="20" rx="4" class="bar"/>
      ${txt(200, 248, "Bars = time someone can confirm their alibi", "muted", 12)}
    `),
    puzzle: {
      prompt: "Who has no alibi at the time of the crime? (surname)",
      answers: ["HART"],
      hints: ["Find the dashed line at 9:30.", "Whose bar has a gap there?", "Colonel Hart: alibis 8–9 and 10–11 only."],
      explain: "Reed (8–10) and Vane (9–11) are covered at 9:30. Hart has a gap from 9 to 10.",
    },
  },
  {
    id: "haunted", cat: "themes", title: "Haunted House",
    summary: "Spirit boards, portraits, candles, music boxes, and things that move on their own.",
    body: `<p>Horror rooms use <b>spirit boards</b> (letter sequences), <b>portraits</b> (counting or eye directions) and <b>sound cues</b>.</p>
      <ul><li>Spirit boards: the order of marked letters spells a word.</li>
      <li>Portraits: compare them. What's different is the clue.</li>
      <li>Jump scares often mark where the next clue appears.</li></ul>`,
    tells: ["Dim flickering light", "Old portraits", "A spirit board or planchette"],
    visual: spiritBoard("SOUL"),
    puzzle: {
      prompt: "The planchette visits the circled letters in numbered order. What word does it spell?",
      answers: ["SOUL"],
      hints: ["Follow the numbers 1 → 4.", "1 is on the lower row.", "S, O, U, L"],
      explain: "1 S, 2 O, 3 U, 4 L → SOUL.",
    },
  },
  {
    id: "lab", cat: "themes", title: "Sci-Fi Lab",
    summary: "Periodic tables, circuits, wires, keypads and countdown timers.",
    body: `<p>Science rooms lean on the <b>periodic table</b>: element symbols spell words, and atomic numbers become codes.</p>
      <ul><li>Numbers 1–118 next to chemistry props? Think atomic numbers.</li>
      <li>Useful: H 1, C 6, N 7, O 8, Na 11, S 16, K 19, Fe 26.</li>
      <li>Wire puzzles: follow each wire from end to end. Colors matter.</li></ul>`,
    tells: ["Lab coats, beakers, a periodic table poster", "Numbers up to ~118", "Sealed blast door with a keypad"],
    visual: svg(`
      ${[5, 8, 8, 19].map((n, i) => `
        <rect x="${50 + i * 78}" y="60" width="64" height="76" rx="6" class="plate"/>
        ${txt(62 + i * 78, 80, n, "", 13, "start")}${txt(82 + i * 78, 118, "?", "mono-t", 30)}`).join("")}
      ${txt(200, 175, "Element tiles on the reactor console", "muted", 13)}
      ${txt(200, 200, "The poster on the wall is a periodic table", "muted", 13)}
    `),
    puzzle: {
      prompt: "Swap each atomic number for its element symbol. What word appears?",
      answers: ["BOOK"],
      hints: ["5 is boron.", "8 is oxygen (O).", "19 is potassium (K)."],
      explain: "5 B, 8 O, 8 O, 19 K → BOOK.",
    },
  },
  {
    id: "heist", cat: "themes", title: "Heist & Spy",
    summary: "Safes, laser grids, dossiers and book ciphers.",
    body: `<p>Spy rooms use <b>book ciphers</b>: pairs of numbers pointing to a line and word (or page, line, word).</p>
      <ul><li><b>Line:Word</b> is the most common format.</li>
      <li>Count from 1, and count every word including "the".</li>
      <li>Safes with dials: alternate right-left-right turns.</li></ul>`,
    tells: ["Number pairs like 3:4", "A dossier or book", "Briefcases, safes, laser tripwires"],
    visual: svg(`
      <rect x="20" y="20" width="360" height="150" rx="6" class="paper"/>
      ${txt(36, 55, "1", "muted", 12, "start")}${txt(56, 55, "Every guard leaves before midnight", "hand", 16, "start")}
      ${txt(36, 95, "2", "muted", 12, "start")}${txt(56, 95, "The vault code hides under the desk", "hand", 16, "start")}
      ${txt(36, 135, "3", "muted", 12, "start")}${txt(56, 135, "Check the painting behind the clock", "hand", 16, "start")}
      <rect x="95" y="190" width="210" height="50" rx="8" class="plate"/>
      ${txt(200, 222, "2:2   3:4   3:6", "mono-t", 20)}
    `),
    puzzle: {
      prompt: "Each pair is line:word. What three-word message do you get?",
      answers: ["VAULTBEHINDCLOCK"],
      hints: ["2:2 = line 2, word 2.", "Line 2, word 2 is VAULT.", "VAULT BEHIND CLOCK"],
      explain: "2:2 vault, 3:4 behind, 3:6 clock → VAULT BEHIND CLOCK.",
    },
  },
];

// Shared look-and-feel helpers for all three pages.
// Needs config.js to be loaded first (for $ and esc).

// Each participant keeps one colour on every screen: [solid, soft]
const PALETTE = [
  ["#ffd23f", "#fff0b3"], // sun
  ["#8ec5ff", "#d8ebff"], // sky
  ["#ffa8c5", "#ffdde9"], // pink
  ["#7ee0a9", "#d2f5e2"], // mint
  ["#c4b5fd", "#e8e1ff"], // lilac
  ["#ffb68a", "#ffe1cf"], // peach
];

const reduceMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const isWide = () => window.matchMedia("(min-width: 720px)").matches;

function byCreated(a, b) {
  return new Date(a.created_at) - new Date(b.created_at) || String(a.id).localeCompare(String(b.id));
}

function colorMap(parts) {
  const map = {};
  [...parts].sort(byCreated).forEach((p, i) => (map[p.id] = PALETTE[i % PALETTE.length]));
  return map;
}

function ordinal(n) {
  const s = ["th", "st", "nd", "rd"], v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

function toast(msg) {
  const t = $("#toast");
  if (!t) return;
  t.textContent = msg;
  t.hidden = false;
  clearTimeout(t._h);
  t._h = setTimeout(() => (t.hidden = true), 2400);
}

function sortedByVotes(parts) {
  return [...parts].sort((a, b) => b.vote_count - a.vote_count || byCreated(a, b));
}

// Who is winning, in plain words (used above the leaderboard)
function standingsNote(parts, closed) {
  const total = parts.reduce((a, b) => a + b.vote_count, 0);
  if (!parts.length) return "";
  if (!closed) return total ? "Scores update the moment someone votes." : "No votes yet. The first vote will show up here.";
  if (!total) return "Voting is closed. No votes were cast.";
  const top = Math.max(...parts.map((p) => p.vote_count));
  const winners = parts.filter((p) => p.vote_count === top);
  if (winners.length > 1) return "It's a tie between " + winners.map((p) => p.name).join(" and ") + ", with " + top + " votes each.";
  return winners[0].name + " won with " + top + (top === 1 ? " vote." : " votes.");
}

// How many grid columns each ranked tile should take, so the bento has no holes.
function spansFor(n, cols) {
  const out = Array.from({ length: n }, () => ({ c: 1, r: 1 }));
  if (!n) return out;
  const m = n - 1;
  if (cols === 2) {
    out[0].c = 2;
    if (m % 2 === 1) out[n - 1].c = 2;
    return out;
  }
  if (m === 0) { out[0].c = 4; return out; }
  out[0].c = 2;
  out[0].r = m >= 3 ? 2 : 1;
  if (m === 1) { out[1].c = 2; return out; }
  if (m === 3) { out[3].c = 2; return out; }
  if (m > 4) {
    const rem = (m - 4) % 4;
    if (rem) out[n - 1].c = 4 - rem + 1;
  }
  return out;
}

// Draws the leaderboard as a bento. `parts` must already be sorted by votes, highest first.
// Tiles are updated in place so the fill level and the position swaps animate.
function renderBoard(el, parts, opts = {}) {
  el._last = [parts, opts];
  if (!el._bound) {
    el._bound = true;
    window.matchMedia("(min-width: 720px)").addEventListener("change", () => el._last && renderBoard(el, ...el._last));
  }
  if (!parts.length) {
    el.innerHTML = '<div class="tile empty">No participants yet. They will show up here as soon as they are added.</div>';
    return;
  }
  const stale = el.querySelector(".empty");
  if (stale) stale.remove();

  const closed = !!opts.closed;
  const colors = colorMap(parts);
  const top = parts[0].vote_count;
  const total = parts.reduce((a, b) => a + b.vote_count, 0);
  const spans = spansFor(parts.length, isWide() ? 4 : 2);
  const ids = new Set(parts.map((p) => p.id));

  const before = new Map();
  el.querySelectorAll(".result[data-id]").forEach((t) => {
    if (!ids.has(t.dataset.id)) t.remove();
    else before.set(t.dataset.id, t.getBoundingClientRect());
  });

  const tiles = new Map();
  const targets = [];
  let created = false;

  parts.forEach((p, i) => {
    let t = el.querySelector('.result[data-id="' + p.id + '"]');
    if (!t) {
      created = true;
      t = document.createElement("article");
      t.className = "tile result";
      t.dataset.id = p.id;
      t.style.setProperty("--p", 0);
      t.innerHTML =
        '<div class="fill"></div><div class="tile-in">' +
        '<div class="rank"></div><div><div class="name"></div><div class="proj"></div></div>' +
        '<div class="score"><span class="count"></span><span class="share"></span></div></div>';
      el.appendChild(t);
    }
    tiles.set(p.id, t);
    const [solid, soft] = colors[p.id];
    t.style.setProperty("--c", solid);
    t.style.setProperty("--soft", soft);
    t.style.order = i;
    t.style.gridColumn = "span " + spans[i].c;
    t.style.gridRow = "span " + spans[i].r;
    t.classList.toggle("lead", i === 0);

    const isTop = top > 0 && p.vote_count === top;
    t.querySelector(".rank").textContent = isTop ? (closed ? "Winner" : "In the lead") : ordinal(i + 1);
    t.querySelector(".name").textContent = p.name;
    t.querySelector(".proj").textContent = p.project;
    t.querySelector(".count").textContent = p.vote_count;
    t.querySelector(".share").textContent = total ? Math.round((p.vote_count / total) * 100) + "% of votes" : "No votes yet";
    targets.push([t, top ? (p.vote_count / top) * 100 : 0]);
  });

  if (created) void el.offsetHeight; // commit the empty fill so the first fill animates
  targets.forEach(([t, v]) => t.style.setProperty("--p", v));

  if (!reduceMotion()) {
    parts.forEach((p) => {
      const a = before.get(p.id);
      if (!a) return;
      const t = tiles.get(p.id);
      const b = t.getBoundingClientRect();
      const dx = a.left - b.left, dy = a.top - b.top;
      if (Math.abs(dx) > 2 || Math.abs(dy) > 2) {
        t.animate([{ transform: "translate(" + dx + "px," + dy + "px)" }, { transform: "none" }], {
          duration: 550,
          easing: "cubic-bezier(0.2, 0.8, 0.2, 1)",
        });
      }
    });
  }
}

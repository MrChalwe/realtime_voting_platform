// ============================================================
// Paste your Supabase details here
// Supabase Dashboard > Project Settings > API
// ============================================================
const SUPABASE_URL = "https://flhabolposwpccfzwjuf.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_LNlgjRVj9WlyTsSrg43Ufw_BwW4FaMv"; // the "anon / public" key (safe to put in frontend)

const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// small helpers shared by all pages
const $ = (s) => document.querySelector(s);
const esc = (s) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

// Results block used by voter page, admin page and big screen
function leaderboardHTML(parts, { big = false, closed = false } = {}) {
  const total = parts.reduce((a, b) => a + b.vote_count, 0);
  const top = parts.length ? parts[0].vote_count : 0;
  return parts
    .map((p, i) => {
      const pct = total ? Math.round((p.vote_count / total) * 100) : 0;
      const lead = top > 0 && p.vote_count === top;
      const medal = i === 0 && top > 0 ? "🏆" : i + 1;
      return `
      <div class="card card-p mb-2 ${lead ? "leader" : ""}">
        <div class="card-body ${big ? "py-4" : "py-3"}">
          <div class="d-flex align-items-center gap-3">
            <div class="rank ${lead ? "r1" : ""} ${big ? "rank-big" : ""}">${medal}</div>
            <div class="flex-grow-1 min-w-0">
              <div class="fw-bold ${big ? "fs-3" : ""} text-truncate">${esc(p.name)}</div>
              <div class="text-muted ${big ? "fs-5" : "small"} text-truncate">${esc(p.project)}</div>
            </div>
            <div class="text-end">
              <div class="fw-bold ${big ? "display-6" : "fs-5"}">${p.vote_count}</div>
              <div class="text-muted ${big ? "fs-6" : "small"}">${pct}%</div>
            </div>
          </div>
          <div class="bar mt-2"><span style="width:${pct}%"></span></div>
        </div>
      </div>`;
    })
    .join("");
}

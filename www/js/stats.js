let statSrc = "all", statOpen = null;
try {
  statSrc = localStorage.getItem("decklab-statsrc") || "all";
} catch (e) {
}
const deckKeys = (combos) => (combos || []).map(comboId).filter(Boolean);
function deckPhases(d) {
  const ks = deckKeys(d.combos).sort().join("#");
  if (!ks) return [];
  const out = [];
  const look = (phases, ev, date, live) => (phases || []).forEach((ph) => {
    const k = deckKeys(ph.combos).sort().join("#");
    if (k === ks) out.push({ ph, ev, date, live });
  });
  S.results.forEach((r) => look(phasesOf(r), r.event, r.date, false));
  if (S.live) look(S.live.phases, S.live.event, S.live.date, true);
  return out;
}
let deckOpen = null;
const shrink = (w, n) => (w + 1) / (n + 2);
const WINDOW = 10;
function weighted(list) {
  var _a;
  let W = 0, N = 0;
  for (const r of list) {
    if (r.draw) continue;
    const k = (_a = r.wt) != null ? _a : 1;
    N += k;
    if (r.won) W += k;
  }
  return { W, N };
}
function windowEst(list) {
  var _a;
  let W = 0, N = 0;
  for (let i = list.length - 1; i >= 0 && N < WINDOW; i--) {
    const r = list[i];
    if (r.draw) continue;
    const k = Math.min((_a = r.wt) != null ? _a : 1, WINDOW - N);
    N += k;
    if (r.won) W += k;
  }
  return shrink(W, N);
}
function deckEstimate(keys, recs) {
  const per = keys.map((k) => {
    const l = recs.filter((r) => r.key === k && !r.draw);
    const w = l.filter((r) => r.won).length;
    const q = weighted(l);
    return { k, w, n: l.length, N: q.N, est: shrink(q.W, q.N) };
  });
  return { per, est: per.reduce((a, x) => a + x.est, 0) / (per.length || 1) };
}
function deckSeries(keys, recs) {
  const win = new Map(keys.map((k) => [k, []]));
  const pts = [];
  recs.filter((r) => !r.draw).forEach((r, i) => {
    const a = win.get(r.key);
    if (!a) return;
    a.push(r);
    const m = keys.reduce((s, k) => s + windowEst(win.get(k)), 0) / keys.length;
    pts.push({ v: Math.round(m * 100), r, n: i + 1, deck: true });
  });
  return pts;
}
function deckSummary(d, all) {
  const keys = deckKeys(d.combos);
  const recs = (all || battleRecords()).filter((r) => keys.includes(r.key));
  const used = deckPhases(d);
  if (!recs.length && !used.length) return null;
  const mw = used.reduce((a, u) => {
    const m = u.ph.matches || [];
    if (m.length) {
      a[0] += m.filter((x) => x.won).length;
      a[1] += m.filter((x) => !x.won).length;
    } else {
      a[0] += +u.ph.wins || 0;
      a[1] += +u.ph.losses || 0;
    }
    return a;
  }, [0, 0]);
  const E = deckEstimate(keys, recs);
  return { keys, recs, used, mw, evs: [...new Set(used.map((u) => u.ev))], E, p: Math.round(E.est * 100) };
}
function vDeckStats(d, sum) {
  sum = sum || deckSummary(d);
  if (!sum) return `<p class="small muted">Ancora nessun risultato con questo deck o con le sue trottole.</p>`;
  const { keys, recs, evs, mw, E } = sum;
  const pts = deckSeries(keys, recs);
  return `<div class="stack" style="gap:12px">
      ${pts.length > 1 ? `<div class="stack" style="gap:4px"><span class="small muted">Andamento della stima (ogni trottola sui suoi ultimi 10 scontri da torneo di peso)</span>${lineChart(pts, 640, 130, true, "d:" + d.id)}</div>` : ""}
      ${evs.length ? `<p class="small">Usato in ${evs.length} torne${evs.length === 1 ? "o" : "i"} (${evs.map(esc).join(", ")}) \xB7 incontri <span class="mono">${mw[0]}-${mw[1]}</span></p>` : ""}
      <div class="stack" style="gap:2px"><span class="small muted">Le tre trottole, in tutti i loro scontri (anche fuori da questo deck)</span>
      ${d.combos.map((c, i) => {
    const k = keys[i];
    const l = recs.filter((r) => r.key === k);
    const co = wlOf(l);
    const est = Math.round(((E.per[i] || {}).est || 0.5) * 100);
    return `<div class="cfg"><span style="min-width:0">${esc(comboText(c))}</span><span class="mono small">${co.w}-${co.l}${co.d ? `-${co.d}` : ""} \xB7 ${l.length} scontri</span><b class="mono" title="stima">${est}%</b>${estBar(est)}</div>`;
  }).join("")}
      </div>
      <details class="small muted"><summary>Come si calcola la stima</summary><p>\xC8 la media delle tre trottole, ognuna nella sua configurazione esatta e in tutti i suoi scontri; ogni trottola pesa un terzo. Ogni scontro pesa come nel Builder: torneo 1, allenamento in arena da torneo 0,6, arena Hasbro 0,2 (difesa 0,03), mia contro mia la met\xE0, lancio da solo corretto. Con pochi scontri la stima resta vicina al 50%.</p></details>
    </div>`;
}
function kindOfBit(v) {
  const p = ref("bit", v);
  return p && p.kind || "";
}
const wlOf = (list) => list.reduce((a, r) => {
  if (r.draw) a.d++;
  else if (r.won) a.w++;
  else a.l++;
  return a;
}, { w: 0, l: 0, d: 0 });
const pct = (o) => o.w + o.l ? Math.round(o.w / (o.w + o.l) * 100) : null;
function estBar(v) {
  return `<div class="wlbar" style="height:8px" role="img" aria-label="stima ${v}% di vittorie"><span class="seg w" style="flex:${v}"></span><span class="seg l" style="flex:${100 - v}"></span></div>`;
}
function wlBar(o, h) {
  const n = o.w + o.l + o.d;
  if (!n) return "";
  const seg = (v, cls) => v ? `<span class="seg ${cls}" style="flex:${v}"></span>` : "";
  return `<div class="wlbar" style="height:${h || 10}px" role="img" aria-label="${o.w} vinti, ${o.l} persi${o.d ? `, ${o.d} pari` : ""}">${seg(o.w, "w")}${seg(o.d, "d")}${seg(o.l, "l")}</div>`;
}
function rollSeries(list) {
  const pts = [];
  const dec = list.filter((r) => !r.draw);
  dec.forEach((r, i) => {
    pts.push({ v: Math.round(windowEst(dec.slice(0, i + 1)) * 100), r, n: i + 1 });
  });
  return pts;
}
function lineChart(pts, w, h, big, key) {
  if (pts.length < 2) return `<span class="small muted">pochi scontri per un andamento</span>`;
  if (key) chartData[key] = pts;
  const pad = big ? { l: 30, r: 10, t: 8, b: 18 } : { l: 2, r: 6, t: 4, b: 4 };
  const X = (i) => pad.l + (w - pad.l - pad.r) * (i / (pts.length - 1)), Y = (v) => pad.t + (h - pad.t - pad.b) * (1 - v / 100);
  const d = pts.map((p, i) => `${i ? "L" : "M"}${X(i).toFixed(1)},${Y(p.v).toFixed(1)}`).join("");
  const area = `${d}L${X(pts.length - 1).toFixed(1)},${Y(0)}L${X(0).toFixed(1)},${Y(0)}Z`;
  const last = pts[pts.length - 1];
  const grid = big ? [0, 50, 100].map((v) => `<line x1="${pad.l}" x2="${w - pad.r}" y1="${Y(v)}" y2="${Y(v)}" class="${v === 50 ? "ref" : "grid"}"/><text x="${pad.l - 6}" y="${Y(v) + 4}" class="ax" text-anchor="end">${v}%</text>`).join("") : `<line x1="${pad.l}" x2="${w - pad.r}" y1="${Y(50)}" y2="${Y(50)}" class="ref"/>`;
  return `<svg class="lc${big ? " big" : ""}" viewBox="0 0 ${w} ${h}" width="100%" height="${h}" data-lc="${esc(key || "")}" data-w="${w}" data-h="${h}" data-big="${big ? 1 : 0}" ${big ? `data-chart="${esc(key)}"` : ""} role="img" aria-label="Stima di vittoria recente: ora ${last.v}%">
    ${grid}<path d="${area}" class="area"/><path d="${d}" class="ln"/>
    <circle cx="${X(pts.length - 1)}" cy="${Y(last.v)}" r="${big ? 4 : 3}" class="end"/>
    ${big ? `<line class="xh" x1="0" x2="0" y1="${pad.t}" y2="${h - pad.b}" visibility="hidden"/><circle class="hv" r="4" visibility="hidden"/><text x="${pad.l}" y="${h - 4}" class="ax">primo scontro</text><text x="${w - pad.r}" y="${h - 4}" class="ax" text-anchor="end">ultimo</text>` : ""}
  </svg>`;
}
let chartData = {};
function fitCharts() {
  document.querySelectorAll("svg[data-lc]").forEach((svg) => {
    const key = svg.dataset.lc, pts = chartData[key];
    if (!key || !pts) return;
    const w = Math.round(svg.getBoundingClientRect().width);
    if (!w || Math.abs(w - +svg.dataset.w) < 2) return;
    const t = document.createElement("div");
    t.innerHTML = lineChart(pts, w, +svg.dataset.h, svg.dataset.big === "1", key);
    svg.replaceWith(t.firstElementChild);
  });
}
window.addEventListener("resize", () => {
  clearTimeout(fitCharts.t);
  fitCharts.t = setTimeout(fitCharts, 120);
});
function vStats() {
  const all = battleRecords();
  const recs = all.filter((r) => statSrc === "all" || r.src === statSrc);
  const srcBtn = (k, l) => `<button class="btn ${statSrc === k ? "primary" : ""}" data-act="st-src" data-k="${k}" aria-pressed="${statSrc === k}">${l}</button>`;
  const head = `<section class="panel"><div class="deck-head"><h2>Andamento delle trottole</h2>
      <span class="row small" style="gap:10px"><span class="row" style="gap:4px"><i class="key w"></i>vinti</span><span class="row" style="gap:4px"><i class="key l"></i>persi</span><span class="row" style="gap:4px"><i class="key d"></i>pari</span></span></div>
    <div class="row" style="gap:6px">${srcBtn("all", "Tutto")}${srcBtn("torneo", "Tornei")}${srcBtn("allenamento", "Allenamenti")}</div>`;
  if (!recs.length) return head + `<div class="empty">Ancora nessuno scontro segnato uno per uno${statSrc !== "all" ? " in questa categoria" : ""}. Compariranno qui gli scontri del torneo in corso e dell'allenamento.</div></section>`;
  const byBlade = /* @__PURE__ */ new Map();
  recs.forEach((r) => {
    const a = byBlade.get(r.blade) || [];
    a.push(r);
    byBlade.set(r.blade, a);
  });
  const blades = [...byBlade.entries()].sort((a, b) => b[1].length - a[1].length);
  const rows = blades.map(([blade, list]) => {
    const o = wlOf(list), p = pct(o), open = statOpen === blade, key = "b:" + blade;
    const pts = rollSeries(list);
    const part = S.parts.find((q) => q.type === "blade" && q.name === blade);
    let body = "";
    if (open) {
      const cfg = /* @__PURE__ */ new Map();
      list.forEach((r) => {
        const k = [r.ratchet || "integrato", r.bit || "?"].join(" \xB7 ");
        const a = cfg.get(k) || [];
        a.push(r);
        cfg.set(k, a);
      });
      const big = [...cfg.entries()].filter(([, l]) => l.length >= 10).sort((a, b) => b[1].length - a[1].length);
      const small = [...cfg.entries()].filter(([, l]) => l.length < 10);
      const fin = FINISH.map(([f, l]) => {
        const w = list.filter((r) => !r.draw && r.won && r.f === f).length, x = list.filter((r) => !r.draw && !r.won && r.f === f).length;
        return { l, w, x };
      });
      const srcRow = ["torneo", "allenamento"].map((sk) => {
        const s = wlOf(list.filter((r) => r.src === sk));
        return s.w + s.l + s.d ? `<span>${sk === "torneo" ? "Tornei" : "Allenamenti"}: <span class="mono">${s.w}-${s.l}${s.d ? `-${s.d}` : ""}</span>${pct(s) != null ? ` (${pct(s)}%)` : ""}</span>` : "";
      }).filter(Boolean).join(" \xB7 ");
      body = `<div class="stack" style="gap:14px;padding:4px 0 14px">
        <div class="stack" style="gap:4px"><span class="small muted">Stima recente: ultimi 10 scontri da torneo di peso (l'allenamento conta meno)</span>${lineChart(pts, 640, 150, true, key)}</div>
        ${statSrc === "all" && srcRow ? `<p class="small">${srcRow}</p>` : ""}
        <div class="tbl"><table class="fin"><thead><tr><th>Finish</th><th>Vinti</th><th>Persi</th></tr></thead><tbody>${fin.map((x) => `<tr><td>${x.l}</td><td class="mono">${x.w}</td><td class="mono">${x.x}</td></tr>`).join("")}</tbody></table></div>
        <div class="stack" style="gap:8px"><h3>Configurazioni con almeno 10 scontri</h3>
          ${big.length ? big.map(([k, l]) => {
        const c = wlOf(l);
        const cp = pct(c);
        const bk = kindOfBit(l[0] && l[0].bit);
        return `<div class="cfg"><span class="mono" style="min-width:0">${esc(k)}${bk ? ` <span class="chip">${esc(bk)}</span>` : ""}</span><span class="mono small">${c.w}-${c.l}${c.d ? `-${c.d}` : ""} \xB7 ${l.length} scontri</span><b class="mono">${cp != null ? cp + "%" : "\u2013"}</b>${wlBar(c, 8)}${lineChart(rollSeries(l), 160, 30, false, "c:" + blade + "|" + k)}</div>`;
      }).join("") : `<p class="small muted">Nessuna configurazione ha ancora 10 scontri.</p>`}
          ${small.length ? `<p class="small muted">Altre ${small.length} configurazion${small.length === 1 ? "e" : "i"} con meno di 10 scontri: ${small.map(([k, l]) => `${esc(k)} (${l.length})`).join(", ")}.</p>` : ""}
        </div>
      </div>`;
    }
    return `<div class="bladestat">
      <button type="button" class="bs-head" data-act="st-open" data-k="${esc(blade)}" aria-expanded="${open}">
        <span style="min-width:0"><b>${esc(blade)}</b><br><span class="small muted">${list.length} scontri \xB7 ${o.w}-${o.l}${o.d ? `-${o.d}` : ""}</span></span>
        <span class="bs-spark">${lineChart(pts, 140, 34, false, "s:" + blade)}</span>
        <b class="bs-pct mono">${p != null ? p + "%" : "\u2013"}</b><span class="mono muted">${open ? "\u25B4" : "\u25BE"}</span>
      </button>
      ${wlBar(o, 10)}
      ${body}
    </div>`;
  }).join("");
  return head + `<p class="small muted">Contano gli scontri segnati uno per uno: torneo in corso e allenamenti. I tornei inseriti solo con vittorie e sconfitte non dicono quale trottola ha giocato, quindi qui non compaiono. Tocca una lama per vedere le sue configurazioni.</p>
    <div>${rows}</div></section>`;
}
let tipEl = null;
function chartHover(e) {
  var _a;
  const svg = e.target.closest && e.target.closest("svg[data-chart]");
  if (!svg) {
    if (tipEl) tipEl.hidden = true;
    document.querySelectorAll("svg[data-chart] .xh, svg[data-chart] .hv").forEach((x2) => x2.setAttribute("visibility", "hidden"));
    return;
  }
  const pts = chartData[svg.dataset.chart];
  if (!pts || pts.length < 2) return;
  const r = svg.getBoundingClientRect();
  const vb = svg.viewBox.baseVal;
  const sx = vb.width / r.width;
  const pad = { l: 30, r: 10, t: 8, b: 18 };
  const x = (e.clientX - r.left) * sx;
  const i = Math.max(0, Math.min(pts.length - 1, Math.round((x - pad.l) / (vb.width - pad.l - pad.r) * (pts.length - 1))));
  const X = pad.l + (vb.width - pad.l - pad.r) * (i / (pts.length - 1)), Y = pad.t + (vb.height - pad.t - pad.b) * (1 - pts[i].v / 100);
  const xh = svg.querySelector(".xh"), hv = svg.querySelector(".hv");
  xh.setAttribute("x1", X);
  xh.setAttribute("x2", X);
  xh.setAttribute("visibility", "visible");
  hv.setAttribute("cx", X);
  hv.setAttribute("cy", Y);
  hv.setAttribute("visibility", "visible");
  if (!tipEl) {
    tipEl = document.createElement("div");
    tipEl.className = "ctip";
    document.body.appendChild(tipEl);
  }
  const p = pts[i], rr = p.r;
  const d = new Date(rr.t).toLocaleDateString("it-IT");
  tipEl.innerHTML = `<b>Scontro ${p.n}</b> \xB7 ${rr.won ? "vinto" : "perso"}${rr.f && rr.f !== "draw" ? ` (${(FINISH.find((x2) => x2[0] === rr.f) || [, ""])[1]})` : ""}<br>${esc(rr.ratchet || "integrato")} ${esc(rr.bit || "")}<br>${d} \xB7 ${rr.src === "torneo" ? esc(rr.ev || "torneo") : "allenamento"}<br>peso <span class="mono">${String(Math.round(((_a = rr.wt) != null ? _a : 1) * 100) / 100).replace(".", ",")}</span>${rr.arena === "hasbro" ? " \xB7 Hasbro" : ""}<br>${p.deck ? `stima del deck <span class="mono">${p.v}%</span>` : `stima recente <span class="mono">${p.v}%</span>`}`;
  tipEl.hidden = false;
  const tx = Math.min(window.innerWidth - 200, e.clientX + 12);
  tipEl.style.left = tx + "px";
  tipEl.style.top = e.clientY + 14 + "px";
}
document.addEventListener("mousemove", chartHover);
document.addEventListener("touchstart", (e) => {
  const t = e.touches[0];
  if (t) chartHover({ target: document.elementFromPoint(t.clientX, t.clientY) || e.target, clientX: t.clientX, clientY: t.clientY });
}, { passive: true });

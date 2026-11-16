var __defProp = Object.defineProperty;
var __getOwnPropSymbols = Object.getOwnPropertySymbols;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __propIsEnum = Object.prototype.propertyIsEnumerable;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp.call(b, prop))
      __defNormalProp(a, prop, b[prop]);
  if (__getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(b)) {
      if (__propIsEnum.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    }
  return a;
};
function games() {
  const out = [];
  const push = (c, won, draw, f, t, src, extra) => {
    if (!c || !c.blade) return;
    out.push(__spreadValues({ combo: c, blade: nm("blade", c.blade), ratchet: c.ratchet ? nm("ratchet", c.ratchet) : "", bit: c.bit ? nm("bit", c.bit) : "", key: comboId(c), won, draw, f, t, src, wt: 1 }, extra));
  };
  const fromPhases = (phases, date, label) => {
    const t0 = (/* @__PURE__ */ new Date((date || "2000-01-01") + "T12:00:00")).getTime();
    (phases || []).forEach((ph, pi) => {
      const bt = (ph.matches || []).flatMap((m) => m.battles || []);
      if (bt.length) {
        (ph.matches || []).forEach((m, mi) => (m.battles || []).forEach((b, bi) => push((ph.combos || [])[b.bey], b.side === "me", b.side === "draw", b.f, t0 + pi * 1e5 + mi * 1e3 + bi, "torneo", { ev: label })));
        return;
      }
      const w = +ph.wins || 0, l = +ph.losses || 0;
      (ph.combos || []).forEach((c) => {
        if (w) push(c, true, false, "", t0 + pi * 1e5, "torneo", { ev: label, wt: w, agg: true });
        if (l) push(c, false, false, "", t0 + pi * 1e5, "torneo", { ev: label, wt: l, agg: true });
      });
    });
  };
  S.results.forEach((r) => fromPhases(phasesOf(r), r.date, r.event));
  if (S.live) fromPhases(S.live.phases, S.live.date, S.live.event);
  (S.trainLog || []).forEach((e) => {
    const mvm = !!(e.b && e.b.mine !== false);
    const f = mvm && e.solo && (e.first === "a" || e.first === "b") ? e.side === e.first ? SOLO_FIRST_WIN : SOLO_SECOND_WIN : 1;
    const wa = trainWeight(e.arena, e.a, mvm) * f, wb = mvm ? trainWeight(e.arena, e.b, true) * f : 0;
    push(e.a, e.side === "a", e.side === "draw", e.f, e.t, "allenamento", __spreadValues({ arena: e.arena, wt: wa }, mvm ? { opp: e.b, lead: true, pairWt: Math.min(wa, wb) } : {}));
    if (mvm) push(e.b, e.side === "b", e.side === "draw", e.f, e.t, "allenamento", { arena: e.arena, wt: wb, opp: e.a, lead: false, pairWt: Math.min(wa, wb) });
  });
  return out.sort((a, b) => a.t - b.t);
}
const battleRecords = () => games().filter((r) => !r.agg);
let _pstats = {};
function personalStats(withTraining) {
  const ck = withTraining ? "t" : "n";
  if (_pstats[ck]) return _pstats[ck];
  const st = /* @__PURE__ */ new Map();
  const add = (k, w, l) => {
    const o = st.get(k) || { w: 0, l: 0 };
    o.w += w;
    o.l += l;
    st.set(k, o);
  };
  const G = games().filter((g) => !g.draw && (withTraining || g.src === "torneo"));
  for (const g of G) {
    const w = g.won ? g.wt : 0, l = g.won ? 0 : g.wt, c = g.combo;
    for (const t of ["blade", "ratchet", "bit"]) if (c[t]) add(t + ":" + refId(t, c[t]), w, l);
    add("combo:" + g.key, w, l);
  }
  const levels = { combo: (c) => comboId(c) };
  for (const t of ["blade", "ratchet", "bit"]) levels[t] = (c) => c[t] ? refId(t, c[t]) : "";
  for (const [lv, keyOf] of Object.entries(levels)) {
    const fit = btFit(G, keyOf);
    for (const [k, v] of fit) {
      const o = st.get(lv + ":" + k);
      if (o) {
        o.pct = v.pct;
        o.g = v.g;
      }
    }
  }
  return _pstats[ck] = st;
}
function btFit(G, keyOf) {
  const M = [];
  for (const g of G) {
    const i = keyOf(g.combo);
    if (!i) continue;
    let j;
    if (g.opp) {
      if (!g.lead) continue;
      j = keyOf(g.opp);
      if (!j || j === i) continue;
    } else j = "F:" + (g.src === "torneo" ? "torneo" : "avv");
    const w = g.opp ? g.pairWt : g.wt;
    if (!(w > 0)) continue;
    M.push(g.won ? [i, j, w] : [j, i, w]);
  }
  const nodes = [...new Set(M.flatMap((m) => [m[0], m[1]]))];
  if (!nodes.length) return /* @__PURE__ */ new Map();
  const p = new Map(nodes.map((n) => [n, 1])), W = new Map(nodes.map((n) => [n, 0])), N = new Map(nodes.map((n) => [n, 0]));
  for (const [a, b, w] of M) {
    W.set(a, W.get(a) + w);
    N.set(a, N.get(a) + w);
    N.set(b, N.get(b) + w);
  }
  const PRIOR = 1;
  for (let it = 0; it < 300; it++) {
    const den = new Map(nodes.map((n) => [n, 2 * PRIOR / (p.get(n) + 1)]));
    for (const [a, b, w] of M) {
      const x = w / (p.get(a) + p.get(b));
      den.set(a, den.get(a) + x);
      den.set(b, den.get(b) + x);
    }
    let ch = 0;
    for (const n of nodes) {
      const v = (W.get(n) + PRIOR) / den.get(n);
      ch = Math.max(ch, Math.abs(Math.log(v / p.get(n))));
      p.set(n, v);
    }
    if (ch < 1e-6) break;
  }
  const mine = nodes.filter((n) => !n.startsWith("F:"));
  const gm = Math.exp(mine.reduce((a, n) => a + Math.log(p.get(n)), 0) / (mine.length || 1));
  return new Map(nodes.map((n) => {
    const v = p.get(n) / gm;
    return [n, { pct: v / (v + 1) * 100, g: N.get(n) }];
  }));
}

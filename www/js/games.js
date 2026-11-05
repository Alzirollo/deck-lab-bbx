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
    push(e.a, e.side === "a", e.side === "draw", e.f, e.t, "allenamento", { arena: e.arena, wt: trainWeight(e.arena, e.a, mvm) * f });
    if (mvm) push(e.b, e.side === "b", e.side === "draw", e.f, e.t, "allenamento", { arena: e.arena, wt: trainWeight(e.arena, e.b, true) * f });
  });
  return out.sort((a, b) => a.t - b.t);
}
const battleRecords = () => games().filter((r) => !r.agg);
function personalStats(withTraining) {
  const st = /* @__PURE__ */ new Map();
  const add = (k, w, l) => {
    const o = st.get(k) || { w: 0, l: 0 };
    o.w += w;
    o.l += l;
    st.set(k, o);
  };
  for (const g of games()) {
    if (g.draw || !withTraining && g.src !== "torneo") continue;
    const w = g.won ? g.wt : 0, l = g.won ? 0 : g.wt, c = g.combo;
    for (const t of ["blade", "ratchet", "bit"]) if (c[t]) add(t + ":" + refId(t, c[t]), w, l);
    add("combo:" + g.key, w, l);
  }
  return st;
}

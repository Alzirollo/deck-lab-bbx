var __defProp = Object.defineProperty;
var __defProps = Object.defineProperties;
var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
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
var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
function metaMap(cat) {
  const M = meta();
  const list = M[cat] || [];
  const max = Math.max(1, ...list.map((x) => x[1]));
  const m = /* @__PURE__ */ new Map();
  list.forEach(([n, s], i) => {
    const k = normKey(n);
    if (!m.has(k)) m.set(k, { score: Math.sqrt(s / max) * 100, raw: s, rank: i + 1 });
  });
  return m;
}
function matchName(p) {
  const list = meta()[p.type] || [];
  const keys = new Map(list.map(([n]) => [normKey(n), n]));
  const cat = p.cat ? p.cat.split(" ") : [];
  for (const c of [p.metaName, p.name, ALIAS[normKey(p.name)], ALIAS[normKey(p.metaName)], cat.join(" "), cat.slice().reverse().join(" ")]) {
    if (!c) continue;
    let k = normKey(c);
    k = TYPO[k] || k;
    if (keys.has(k)) return keys.get(k);
  }
  return "";
}
function rematchAll() {
  S.parts.forEach((p) => {
    p.metaName = matchName(p);
  });
  autoIntegrated();
}
function phasesOf(r) {
  if (Array.isArray(r.phases) && r.phases.length) return r.phases;
  let w = +r.wins || 0, l = +r.losses || 0;
  if (Array.isArray(r.matches) && r.matches.length) {
    w = r.matches.filter((m) => m.won).length;
    l = r.matches.length - w;
  }
  return [{ label: "Tutto il torneo", combos: r.combos || [], wins: w, losses: l }];
}
const totWL = (r) => phasesOf(r).reduce((a, p) => [a[0] + (+p.wins || 0), a[1] + (+p.losses || 0)], [0, 0]);
const canon = (s) => {
  const x = normKey(s);
  return TYPO[x] || x;
};
function comboIndex() {
  const idx = /* @__PURE__ */ new Map();
  for (const row of meta().combos || []) {
    const [b, r, t, n] = row;
    const kb = canon(b), kr = canon(r), kt = canon(t);
    if (!kb || !kt) continue;
    let o = idx.get(kb);
    if (!o) {
      o = { tot: 0, bit: /* @__PURE__ */ new Map(), rat: /* @__PURE__ */ new Map(), exact: /* @__PURE__ */ new Map(), bitName: /* @__PURE__ */ new Map(), ratName: /* @__PURE__ */ new Map() };
      idx.set(kb, o);
    }
    o.tot += n;
    o.bit.set(kt, (o.bit.get(kt) || 0) + n);
    o.bitName.set(kt, o.bitName.get(kt) || t);
    if (kr) {
      o.rat.set(kr, (o.rat.get(kr) || 0) + n);
      o.ratName.set(kr, o.ratName.get(kr) || r);
    }
    o.exact.set(kr + "|" + kt, (o.exact.get(kr + "|" + kt) || 0) + n);
  }
  return idx;
}
const topOf = (m) => [...m.entries()].sort((a, b) => b[1] - a[1])[0];
function ownsCanon(type, k) {
  return S.parts.some((p) => p.type === type && (+p.qty || 0) > 0 && (canon(p.metaName) === k || canon(p.name) === k));
}
function scorer() {
  const maps = { blade: metaMap("blade"), ratchet: metaMap("ratchet"), bit: metaMap("bit"), assist: metaMap("assist") };
  const st = personalStats(true);
  const pw = (+S.settings.personalWeight || 0) / 100;
  return (p) => {
    const hit = p.metaName && maps[p.type] ? maps[p.type].get(normKey(p.metaName)) : null;
    let m = hit ? hit.score : fallback();
    if (p.cx) {
      const a = p.assistPart;
      const ah = a && (a.metaName || a.name) ? maps.assist.get(normKey(a.metaName || a.name)) : null;
      m = 0.8 * m + 0.2 * (ah ? ah.score : fallback());
    }
    const s = st.get(p.type + ":" + p.id);
    let pers = null, w = 0;
    if (s && s.w + s.l > 0) {
      const g = s.w + s.l;
      pers = (s.w + 1) / (g + 2) * 100;
      w = pw * g / (g + 4);
    }
    return { meta: m, metaRank: hit ? hit.rank : null, pers, games: s ? Math.round(s.w + s.l) : 0, total: pers == null ? m : m * (1 - w) + pers * w };
  };
}
function comboScore(b, r, t, sc, ci) {
  const sb = sc(b).total, sr = r.id === "int" ? 55 : sc(r).total, st = sc(t).total;
  let syn = 0, pair = null;
  const why = [];
  const info = ci && b.metaName ? ci.get(canon(b.metaName)) : null;
  if (info && info.tot >= 8) {
    const kt = canon(t.metaName || t.name), kr = canon(r.metaName || r.name);
    const bs = (info.bit.get(kt) || 0) / info.tot;
    const rTot = [...info.rat.values()].reduce((a, x) => a + x, 0);
    const rs = rTot >= 8 ? (info.rat.get(kr) || 0) / rTot : null;
    const ex = info.exact.get(kr + "|" + kt) || 0;
    syn += 18 * Math.sqrt(bs) + (rs == null ? 4 : 8 * Math.sqrt(rs)) + (ex >= 3 ? 5 : 0) - (bs === 0 ? 10 : 0);
    const [tb, tn] = topOf(info.bit);
    pair = { share: bs, topBit: info.bitName.get(tb), topShare: tn / info.tot, topOwned: ownsCanon("bit", tb) };
    if (bs === 0) why.push(`nel meta ${b.metaName} non arriva mai in top cut con ${t.metaName || t.name}: nel ${Math.round(pair.topShare * 100)}% dei casi usa ${pair.topBit}`);
    else why.push(`${t.metaName || t.name} \xE8 la punta del ${Math.round(bs * 100)}% dei suoi deck in top cut`);
    if (rs === 0) why.push(`${r.name} non compare mai con questa lama`);
    if (ex >= 3) why.push(`combo identica a una del meta (${ex} volte)`);
  } else {
    syn += 6;
    if (b.kind && t.kind && b.kind === t.kind) {
      syn += 4;
      why.push("lama e punta dello stesso tipo");
    }
    if (b.kind === "attacco" && t.kind === "resistenza") {
      syn -= 5;
      why.push("punta lenta su lama d'attacco");
    }
    if (b.kind === "resistenza" && t.kind === "attacco") {
      syn -= 5;
      why.push("punta aggressiva su lama da resistenza");
    }
    why.push("pochi dati sugli abbinamenti di questa lama");
  }
  if (r.note && /balla|lento|rotto/i.test(r.note)) {
    syn -= 4;
    why.push("ratchet segnato come difettoso");
  }
  syn = Math.round(syn);
  return { score: 0.45 * sb + 0.25 * sr + 0.3 * st + syn, sb, sr, st, syn, why, pair };
}
function eligible(type) {
  const seen = /* @__PURE__ */ new Set();
  const own = S.parts.filter((p) => p.type === type && !p.avoid && (+p.qty || 0) > 0).filter((p) => {
    const k = p.name.toLowerCase();
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
  if (type === "blade") return own.map((p) => __spreadProps(__spreadValues({}, p), { comps: [p.id] })).concat(cxBlades(true));
  return own;
}
function cxBlades(onlyUsable) {
  const ok = (p) => (+p.qty || 0) > 0 && (!onlyUsable || !p.avoid);
  const C = S.parts.filter((p) => p.type === "lockchip" && ok(p)), M = S.parts.filter((p) => p.type === "mainblade" && ok(p)), A = S.parts.filter((p) => p.type === "assist" && ok(p));
  const metaKeys = new Map((meta().blade || []).map(([n]) => [canon(n), n]));
  const out = [];
  for (const c of C) for (const m of M) for (const a of A) {
    const full = `${c.metaName || c.name} ${m.metaName || m.name}`;
    out.push({
      id: `cx:${c.id}:${m.id}:${a.id}`,
      type: "blade",
      cx: true,
      comps: [c.id, m.id, a.id],
      chip: c,
      main: m,
      assistPart: a,
      name: `${c.name} ${m.name} ${a.name}`,
      metaName: metaKeys.get(canon(full)) || "",
      kind: m.kind || "",
      integrated: false,
      left: !!m.left,
      qty: 1,
      note: ""
    });
  }
  return out;
}
function bladeChoices(includeAvoided) {
  const own = S.parts.filter((p) => p.type === "blade" && (includeAvoided || !p.avoid));
  return own.concat(cxBlades(!includeAvoided));
}
const alpha = (a, b) => String(a).localeCompare(String(b), "it", { sensitivity: "base", numeric: true });
const byName = (list) => list.slice().sort((a, b) => alpha(a.name, b.name));
const choicesOf = (type, includeAvoided) => byName(type === "blade" ? bladeChoices(includeAvoided) : S.parts.filter((p) => p.type === type && (includeAvoided || !p.avoid)));
const decksAlpha = () => S.decks.slice().sort((a, b) => alpha(a.name, b.name));
const INTEGRATED = { id: "int", type: "ratchet", name: "ratchet integrato", metaName: "-", note: "" };
function autoIntegrated() {
  const idx = comboIndex();
  let changed = false;
  for (const p of S.parts) {
    if (p.type !== "blade" || p.integrated !== void 0 || !p.metaName) continue;
    const info = idx.get(canon(p.metaName));
    if (!info || info.tot < 5) continue;
    const withR = [...info.rat.values()].reduce((a, x) => a + x, 0);
    p.integrated = withR / info.tot < 0.2;
    changed = true;
  }
  return changed;
}
function slotsOf() {
  const s = S.settings.slots;
  return Array.isArray(s) && s.length === 3 ? s : [{}, {}, {}];
}
const anyPinned = () => slotsOf().some((x) => x && (x.blade || x.ratchet || x.bit));
function buildDecks() {
  const B = eligible("blade"), R = eligible("ratchet"), T = eligible("bit");
  if (B.length < 3 || T.length < 3) return { error: { B: B.length, R: R.length, T: T.length } };
  const sc = scorer(), ci = comboIndex();
  const C = [];
  B.forEach((b, bi) => {
    const rs = b.integrated ? [-1] : R.map((_, i) => i);
    rs.forEach((ri) => T.forEach((t, ti) => {
      C.push({ bi, ri, ti, s: comboScore(b, ri < 0 ? INTEGRATED : R[ri], t, sc, ci).score });
    }));
  });
  const slots = slotsOf().map((x) => ({ b: B.findIndex((p) => p.id === (x && x.blade)), r: R.findIndex((p) => p.id === (x && x.ratchet)), t: T.findIndex((p) => p.id === (x && x.bit)) }));
  const pinned = slots.map((x) => x.b >= 0 || x.r >= 0 || x.t >= 0);
  const cand = slots.map((x) => C.map((c, i) => i).filter((i) => {
    const c = C[i];
    return (x.b < 0 || c.bi === x.b) && (x.r < 0 || c.ri === x.r) && (x.t < 0 || c.ti === x.t);
  }).sort((a, b) => C[b].s - C[a].s));
  const best = cand.map((l) => l.length ? C[l[0]].s : -Infinity);
  const lim = !!S.settings.bitTypeLimit;
  const top = [];
  const KEEP = 400;
  let minTop = -Infinity;
  const push = (s, a) => {
    if (top.length >= KEEP && s <= minTop) return;
    top.push({ s, a });
    if (top.length > KEEP * 1.5) {
      top.sort((x, y) => y.s - x.s);
      top.length = KEEP;
      minTop = top[KEEP - 1].s;
    }
  };
  const pick = [0, 0, 0];
  function rec(k, sum, lastFree, uB, uR, uT) {
    if (k === 3) {
      if (lim) {
        const ks = pick.map((i) => T[C[i].ti].kind).filter(Boolean);
        if (new Set(ks).size < ks.length) return;
      }
      push(sum / 3, pick.slice());
      return;
    }
    let bound = 0;
    for (let j = k + 1; j < 3; j++) bound += best[j];
    for (const i of cand[k]) {
      const c = C[i];
      if (top.length >= KEEP && (sum + c.s + bound) / 3 <= minTop) break;
      if (!pinned[k] && i <= lastFree) continue;
      const comps = B[c.bi].comps;
      if (comps.some((x) => uB.has(x)) || uT.has(c.ti) || c.ri >= 0 && uR.has(c.ri)) continue;
      pick[k] = i;
      comps.forEach((x) => uB.add(x));
      uT.add(c.ti);
      if (c.ri >= 0) uR.add(c.ri);
      rec(k + 1, sum + c.s, pinned[k] ? lastFree : i, uB, uR, uT);
      comps.forEach((x) => uB.delete(x));
      uT.delete(c.ti);
      if (c.ri >= 0) uR.delete(c.ri);
    }
  }
  rec(0, 0, -1, /* @__PURE__ */ new Set(), /* @__PURE__ */ new Set(), /* @__PURE__ */ new Set());
  top.sort((x, y) => y.s - x.s);
  const toDeck = (t) => {
    const combos = t.a.map((i) => {
      const c = C[i];
      const b = B[c.bi], r = c.ri < 0 ? INTEGRATED : R[c.ri], tt = T[c.ti];
      return __spreadValues({ b, r, t: tt }, comboScore(b, r, tt, sc, ci));
    });
    const free = combos.map((c, i) => i).filter((i) => !pinned[i]);
    const fs = free.map((i) => combos[i]).sort((x, y) => y.score - x.score);
    free.forEach((i, j) => combos[i] = fs[j]);
    return { score: t.s, combos };
  };
  const picked = [];
  const keyset = (d) => new Set(d.combos.flatMap((c) => [c.b.id, c.r.id + "@" + c.b.id, c.t.id]));
  for (const t of top) {
    const d = toDeck(t);
    const ks = keyset(d);
    if (picked.every((p) => {
      let same = 0;
      ks.forEach((k) => {
        if (p.ks.has(k)) same++;
      });
      return same <= 7;
    })) {
      picked.push({ d, ks });
      if (picked.length === 12) break;
    }
  }
  if (!picked.length) return { error: lim ? { rule: true } : anyPinned() ? { lock: true } : { R: R.length, B: B.length, T: T.length } };
  return { decks: picked.map((p) => p.d), sc, B, R, T };
}

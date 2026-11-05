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
function cxFromId(id, parts) {
  const m = /^cx:([^:]+):([^:]+):([^:]+)$/.exec(id);
  if (!m) return null;
  const [c, mb, a] = m.slice(1).map((x) => parts.find((p) => p.id === x));
  if (!c || !mb || !a) return null;
  return { id, type: "blade", cx: true, comps: [c.id, mb.id, a.id], name: `${c.name} ${mb.name} ${a.name}`, kind: mb.kind || "", left: !!mb.left, integrated: false };
}
function ref(type, v, parts) {
  parts = parts || S.parts;
  if (!v) return null;
  v = String(v);
  let p = parts.find((x) => x.type === type && x.id === v);
  if (p) return p;
  if (type === "blade" && v.startsWith("cx:")) return cxFromId(v, parts);
  p = parts.find((x) => x.type === type && x.name === v) || (type === "bit" ? parts.find((x) => x.type === "bit" && x.code === v) : null);
  if (p) return p;
  const k = canon(ALIAS[normKey(v)] || v);
  return parts.find((x) => x.type === type && (x.metaName && canon(x.metaName) === k || canon(x.name) === k)) || null;
}
const refId = (type, v, parts) => {
  const p = ref(type, v, parts);
  return p ? p.id : v || "";
};
const nm = (type, v) => {
  const p = ref(type, v);
  return p ? p.name : v || "";
};
const bitShort = (v) => {
  const p = ref("bit", v);
  return p ? p.code || p.name : v || "";
};
const isIntegrated = (blade) => {
  const p = ref("blade", blade);
  return !!(p && p.integrated);
};
const comboText = (c) => c && c.blade ? `${nm("blade", c.blade)} ${c.ratchet ? nm("ratchet", c.ratchet) : "integrato"} ${c.bit ? bitShort(c.bit) : ""}`.trim() : "\u2014";
const comboNames = (c) => c && c.blade ? { lama: nm("blade", c.blade), ratchet: c.ratchet ? nm("ratchet", c.ratchet) : "integrato", punta: c.bit ? nm("bit", c.bit) : "" } : null;
const comboId = (c) => c && c.blade ? [refId("blade", c.blade), c.ratchet ? refId("ratchet", c.ratchet) : "", c.bit ? refId("bit", c.bit) : ""].join("|") : "";
const fromBuilt = (c) => ({ blade: c.b.id, ratchet: c.r.id === "int" ? "" : c.r.id, bit: c.t.id });
function partOptions(type, val, includeAvoided, longBit) {
  const cur = val ? refId(type, val) : "";
  const list = choicesOf(type, includeAvoided);
  const label = (p) => p.type === "bit" ? p.code ? longBit ? `${p.code} \xB7 ${p.name}` : p.code : p.name : p.name;
  const extra = cur && !list.some((p) => p.id === cur) ? `<option value="${esc(cur)}" selected>${esc(val)}</option>` : "";
  return `<option value="">\u2014</option>` + extra + list.map((p) => `<option value="${esc(p.id)}" ${p.id === cur ? "selected" : ""}>${esc(label(p))}</option>`).join("");
}
function migrateRefs(st) {
  const P = st.parts || [];
  const fix = (c) => {
    if (!c || typeof c !== "object" || c.mine === false || !(c.blade || c.ratchet || c.bit)) return c;
    const o = __spreadValues({}, c);
    if (o.blade) o.blade = refId("blade", o.blade, P);
    if (o.ratchet) o.ratchet = refId("ratchet", o.ratchet, P);
    if (o.bit || o.bitCode) o.bit = ref("bit", o.bit, P) ? refId("bit", o.bit, P) : o.bitCode ? refId("bit", o.bitCode, P) : o.bit;
    delete o.bitCode;
    return o;
  };
  const phs = (list) => (list || []).forEach((ph) => {
    if (Array.isArray(ph.combos)) ph.combos = ph.combos.map(fix);
  });
  (st.decks || []).forEach((d) => {
    d.combos = (d.combos || []).map(fix);
  });
  (st.results || []).forEach((r) => {
    phs(r.phases);
    if (Array.isArray(r.combos)) r.combos = r.combos.map(fix);
  });
  if (st.live) phs(st.live.phases);
  if (st.train && st.train.cur) {
    st.train.cur.a = fix(st.train.cur.a);
    st.train.cur.b = fix(st.train.cur.b);
  }
  (st.trainLog || []).forEach((e) => {
    e.a = fix(e.a);
    e.b = fix(e.b);
  });
  st.refs = 1;
  return st;
}
function partInUse(id) {
  const hit = (c) => c && c.mine !== false && [c.blade, c.ratchet, c.bit].some((v) => v === id || typeof v === "string" && v.startsWith("cx:") && v.split(":").includes(id));
  const phs = (list) => (list || []).some((ph) => (ph.combos || []).some(hit));
  return S.decks.some((d) => d.combos.some(hit)) || S.results.some((r) => phs(r.phases) || (r.combos || []).some(hit)) || S.live && phs(S.live.phases) || (S.trainLog || []).some((e) => hit(e.a) || hit(e.b));
}

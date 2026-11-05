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
function foldHead(key, title, count) {
  const shut = !!fold[key];
  return `<button type="button" data-act="fold" data-key="${key}" aria-expanded="${!shut}" style="all:unset;box-sizing:border-box;display:flex;justify-content:space-between;align-items:center;width:100%;cursor:pointer"><h3>${title} <span class="chip">${count}</span></h3><span class="mono">${shut ? "\u25BE" : "\u25B4"}</span></button>`;
}
const ARENAS = [["torneo", "Arena da torneo"], ["hasbro", "Arena Hasbro"]];
const TRAIN_WEIGHT = { torneo: 0.6, hasbro: 0.2 };
const SOLO_FIRST_WIN = 1.25, SOLO_SECOND_WIN = 0.75;
function trainWeight(arena, c, mineVsMine) {
  return trainWeightBase(arena, c) * (mineVsMine ? 0.5 : 1);
}
function trainWeightBase(arena, c) {
  if (arena !== "hasbro") return TRAIN_WEIGHT[arena] || 0.6;
  const t = ref("bit", c && c.bit);
  return t && t.kind === "difesa" ? 0.03 : TRAIN_WEIGHT.hasbro;
}
function trainCur() {
  if (!S.train || !S.train.cur) S.train = { cur: { a: {}, b: { mine: true }, arena: "torneo" } };
  return S.train.cur;
}
const comboKey = (x) => [x && x.mine === false ? "o" : "m", x && x.blade || "?", x && x.ratchet || "?", x && x.bit || "?"].join("|");
const comboLabel = (x, mine) => {
  if (mine === false) {
    const p = [x.blade, x.ratchet, x.bit].filter(Boolean);
    return p.length ? p.join(" ") : "avversario sconosciuto";
  }
  return [x.blade ? nm("blade", x.blade) : "?", x.ratchet ? nm("ratchet", x.ratchet) : x.blade && isIntegrated(x.blade) ? "integrato" : "?", x.bit ? bitShort(x.bit) : "?"].join(" ");
};
const sameMatchup = (e, c) => comboKey(__spreadProps(__spreadValues({}, e.a), { mine: true })) === comboKey(__spreadProps(__spreadValues({}, c.a), { mine: true })) && comboKey(e.b) === comboKey(c.b) && e.arena === c.arena;
function trainTally(list) {
  return list.reduce((t, e) => {
    if (e.side === "a") {
      t.a++;
      t.pa += e.pts;
    } else if (e.side === "b") {
      t.b++;
      t.pb += e.pts;
    } else t.d++;
    t.f[e.side + ":" + e.f] = (t.f[e.side + ":" + e.f] || 0) + 1;
    return t;
  }, { a: 0, b: 0, d: 0, pa: 0, pb: 0, f: {} });
}
let trainShowAll = false;
function vTrain() {
  const c = trainCur();
  const log = S.trainLog || [];
  const mineSel = (side, x) => ["blade", "ratchet", "bit"].map((type) => {
    const list = choicesOf(type, true).filter((p) => (+p.qty || 0) > 0);
    const v = x[type] ? refId(type, x[type]) : "";
    if (type === "ratchet" && x.blade && isIntegrated(x.blade)) return `<span class="chip">ratchet integrato</span>`;
    return `<select data-tr="${side}" data-cf="${type}" aria-label="${TYPE_LABEL[type]}"><option value="">${TYPE_LABEL[type]}</option>${list.map((p) => {
      const val = p.id;
      return `<option value="${esc(val)}" ${val === v ? "selected" : ""}>${esc(type === "bit" ? bitLabel(p) : p.name)}${p.avoid ? " (da evitare)" : ""}</option>`;
    }).join("")}</select>`;
  }).join("");
  const oppInp = (x) => ["blade", "ratchet", "bit"].map((type) => `<input data-tr="b" data-cf="${type}" data-ac="${type}" autocomplete="off" value="${esc(x[type] || "")}" placeholder="${TYPE_LABEL[type]} (se la sai)" aria-label="${TYPE_LABEL[type]} avversaria" style="flex:1;min-width:120px">`).join("");
  const names = (type) => [.../* @__PURE__ */ new Set([...(meta()[type] || []).map((r) => r[0]), ...S.parts.filter((p) => p.type === type).map((p) => p.name)])];
  const ready = c.a.blade && (c.b.mine === false || c.b.blade);
  const cur = log.filter((e) => sameMatchup(e, c));
  const T = trainTally(cur);
  const lab = (x, mine) => x.blade ? esc(comboLabel(x, mine)) : mine === false ? "Avversario" : "\u2014";
  const nameA = nm("blade", c.a.blade) || "Combo A", nameB = (c.b.mine === false ? c.b.blade : nm("blade", c.b.blade)) || (c.b.mine === false ? "Avversario" : "Combo B");
  const finBtns = (side) => FINISH.map(([f, l, p]) => `<button class="btn ${side === "a" ? "primary" : ""}" data-act="tr-pt" data-side="${side}" data-f="${f}" ${ready ? "" : "disabled"} style="flex:1;min-width:64px;justify-content:center;padding-block:12px">${l} +${p}</button>`).join("");
  const groups = /* @__PURE__ */ new Map();
  log.forEach((e) => {
    const k = comboKey(__spreadProps(__spreadValues({}, e.a), { mine: true })) + "#" + comboKey(e.b) + "#" + e.arena;
    const g = groups.get(k) || { e, list: [] };
    g.list.push(e);
    groups.set(k, g);
  });
  const gl = [...groups.values()].sort((x, y) => y.list[y.list.length - 1].t - x.list[x.list.length - 1].t);
  return `<section class="panel">
    <h2>Allenamento</h2>
    <p class="muted">Scegli le due combo e l'arena: restano fissate finch\xE9 non le cambi. Ogni scontro conta nell'indice del Builder meno di un torneo, e tra due combo tue conta la met\xE0 che contro un avversario. Sull'arena Hasbro conta poco, e quasi niente per le combo di difesa.</p>
    <div class="row" role="radiogroup" aria-label="Arena">${ARENAS.map(([k, l]) => `<button class="btn ${c.arena === k ? "primary" : ""}" data-act="tr-arena" data-k="${k}" role="radio" aria-checked="${c.arena === k}">${l}</button>`).join("")}</div>
    <div class="grid2">
      <div class="combo"><span class="slot">COMBO A \xB7 MIA</span><div class="row" style="gap:6px">${mineSel("a", c.a)}</div></div>
      <div class="combo"><div class="row" style="justify-content:space-between"><span class="slot">COMBO B</span>
          <span class="row" style="gap:4px"><button class="btn ${c.b.mine !== false ? "primary" : ""}" data-act="tr-bown" data-mine="1">Mia</button><button class="btn ${c.b.mine === false ? "primary" : ""}" data-act="tr-bown" data-mine="0">Avversaria</button></span></div>
        <div class="row" style="gap:6px">${c.b.mine === false ? oppInp(c.b) : mineSel("b", c.b)}</div>
        ${c.b.mine === false ? `<p class="small muted">Scrivi solo quello che sai, anche niente: resta \u201Cavversario sconosciuto\u201D.</p>` : ""}
      </div>
    </div>
    ${c.b.mine !== false ? `<div class="combo" style="gap:8px">
      <label class="chk"><input type="checkbox" id="tr-solo" ${c.solo ? "checked" : ""}> Lancio da solo (prima una trottola, poi l'altra)</label>
      ${c.solo ? `<div class="row" style="gap:6px"><span class="small muted">Lancio per prima</span>
        <button class="btn ${(c.first || "a") === "a" ? "primary" : ""}" data-act="tr-first" data-k="a">A \xB7 ${esc(nameA)}</button>
        <button class="btn ${c.first === "b" ? "primary" : ""}" data-act="tr-first" data-k="b">B \xB7 ${esc(nameB)}</button></div>
      <label class="chk"><input type="checkbox" id="tr-alt" ${c.alt ? "checked" : ""}> Alterna dopo ogni scontro</label>
      <p class="small muted">Chi parte per primo perde rotazione prima che parta l'altra: se vince conta di pi\xF9, se vince quella partita dopo conta di meno.</p>` : ""}
      <div class="row"><button class="btn ghost" data-act="tr-swap">Scambia A e B</button></div>
    </div>` : ""}
  </section>

  <section class="panel">
    <div class="deck-head"><h3>${esc(nameA)} contro ${esc(nameB)}</h3><span class="chip">${esc(ARENAS.find((x) => x[0] === c.arena)[1])}</span></div>
    ${ready ? "" : `<p class="note">Scegli almeno la lama della combo A${c.b.mine !== false ? " e della combo B" : ""} per iniziare.</p>`}
    <div class="row" style="justify-content:center;gap:18px">
      <div class="stat" style="text-align:center"><span class="small muted">A vince</span><b style="font-size:40px">${T.a}</b></div>
      <span class="muted" style="font-size:26px">\u2013</span>
      <div class="stat" style="text-align:center"><span class="small muted">B vince</span><b style="font-size:40px">${T.b}</b></div>
    </div>
    <p class="small muted" style="text-align:center">${cur.length ? `${cur.length} scontri${T.d ? `, ${T.d} pareggi` : ""} \xB7 punti ${T.pa}-${T.pb}${T.a + T.b ? ` \xB7 A vince il ${Math.round(T.a / (T.a + T.b) * 100)}%` : ""}` : "Nessuno scontro ancora per questa sfida"}</p>
    ${(() => {
    const sl = cur.filter((e) => e.solo && e.side !== "draw");
    if (!sl.length) return "";
    const fa = sl.filter((e) => e.first === "a"), sa = sl.filter((e) => e.first === "b");
    const pc = (l) => l.length ? `${l.filter((e) => e.side === "a").length}/${l.length}` : "\u2014";
    return `<p class="small muted" style="text-align:center">Lancio da solo \xB7 A vince ${pc(fa)} partendo per prima, ${pc(sa)} partendo per seconda</p>`;
  })()}
    <div class="stack" style="gap:6px"><span class="small muted">Vince A (${esc(nameA)})</span><div class="row" style="gap:6px">${finBtns("a")}</div></div>
    <div class="stack" style="gap:6px"><span class="small muted">Vince B (${esc(nameB)})</span><div class="row" style="gap:6px">${finBtns("b")}</div></div>
    <div class="row"><button class="btn" data-act="tr-draw" ${ready ? "" : "disabled"}>Pareggio</button><button class="btn ghost" data-act="tr-undo" ${cur.length ? "" : "disabled"}>Annulla l'ultimo</button></div>
    ${cur.length ? `<div class="row" style="gap:6px">${cur.slice(-15).map((e) => `<span class="chip ${e.side === "a" ? "good" : e.side === "b" ? "bad" : ""}" title="${e.solo ? `prima ${e.first.toUpperCase()}` : ""}">${e.solo ? `${e.first.toUpperCase()}\u2191 ` : ""}${e.side === "draw" ? "pari" : (e.side === "a" ? "A " : "B ") + FINISH.find((x) => x[0] === e.f)[1]}</span>`).join("")}</div>` : ""}
    ${Object.keys(T.f).length ? `<p class="small muted">${FINISH.map(([f, l]) => {
    const x = T.f["a:" + f] || 0, y = T.f["b:" + f] || 0;
    return x || y ? `${l}: ${x}-${y}` : "";
  }).filter(Boolean).join(" \xB7 ")}</p>` : ""}
  </section>

  ${gl.length ? `<section class="panel">${foldHead("train", "Tutte le sfide", gl.length)}${fold.train ? "" : `<div>${gl.slice(0, trainShowAll ? 999 : 12).map((g) => {
    const t = trainTally(g.list);
    const e = g.e;
    return `<div class="alt"><span class="small" style="min-width:0"><b>${lab(e.a, true)}</b> contro <b>${lab(e.b, e.b.mine)}</b><br><span class="muted">${esc(ARENAS.find((x) => x[0] === e.arena)[1])} \xB7 ${g.list.length} scontri</span></span>
        <span class="row" style="gap:6px"><span class="mono">${t.a}-${t.b}</span><button class="btn ghost" data-act="tr-load" data-t="${g.list[g.list.length - 1].id}">Riprendi</button></span></div>`;
  }).join("")}
      ${gl.length > 12 && !trainShowAll ? `<button class="btn ghost" data-act="tr-more">Mostra tutte</button>` : ""}</div>`}</section>` : ""}`;
}
function trainClick(a, b) {
  if (!a.startsWith("tr-")) return false;
  const c = trainCur();
  S.trainLog = S.trainLog || [];
  if (a === "tr-arena") {
    c.arena = b.dataset.k;
    save();
    render();
  }
  if (a === "tr-bown") {
    const m = b.dataset.mine === "1";
    if (c.b.mine !== false !== m) c.b = { mine: m };
    save();
    render();
  }
  if (a === "tr-swap") {
    const A = __spreadValues({}, c.a);
    c.a = __spreadValues({}, c.b);
    delete c.a.mine;
    c.b = __spreadProps(__spreadValues({}, A), { mine: true });
    if (c.first) c.first = c.first === "a" ? "b" : "a";
    save();
    render();
  }
  if (a === "tr-first") {
    c.first = b.dataset.k;
    save();
    render();
  }
  if (a === "tr-pt" || a === "tr-draw") {
    const side = a === "tr-draw" ? "draw" : b.dataset.side, f = a === "tr-draw" ? "draw" : b.dataset.f;
    const pts = side === "draw" ? 0 : FINISH.find((x) => x[0] === f)[2];
    const solo = c.b.mine !== false && !!c.solo;
    S.trainLog.push(__spreadValues({ id: uid(), t: Date.now(), a: __spreadValues({}, c.a), b: __spreadValues({}, c.b), arena: c.arena, side, f, pts }, solo ? { solo: true, first: c.first || "a" } : {}));
    if (solo && c.alt) c.first = (c.first || "a") === "a" ? "b" : "a";
    if (S.trainLog.length > 2e3) S.trainLog = S.trainLog.slice(-2e3);
    save();
    render();
  }
  if (a === "tr-undo") {
    for (let i = S.trainLog.length - 1; i >= 0; i--) {
      if (sameMatchup(S.trainLog[i], c)) {
        S.trainLog.splice(i, 1);
        break;
      }
    }
    save();
    render();
  }
  if (a === "tr-load") {
    const e = S.trainLog.find((x) => x.id === b.dataset.t);
    if (e) {
      c.a = __spreadValues({}, e.a);
      c.b = __spreadValues({}, e.b);
      c.arena = e.arena;
      save();
      render();
      window.scrollTo({ top: 0 });
    }
  }
  if (a === "tr-more") {
    trainShowAll = true;
    render();
  }
  return true;
}
function trainChange(t) {
  if (t.dataset.tr == null) return false;
  const c = trainCur();
  const side = t.dataset.tr, k = t.dataset.cf;
  c[side] = __spreadProps(__spreadValues({}, c[side]), { [k]: t.value.trim() });
  if (k === "blade" && side !== "b" || k === "blade" && c.b.mine !== false) {
    if (isIntegrated(t.value)) c[side].ratchet = "";
  }
  save();
  render();
  return true;
}

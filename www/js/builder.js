let viewIdx = 0;
function vDeck() {
  const res = buildDecks();
  const st = S.settings;
  let body = "";
  if (!S.parts.length) {
    body = `<div class="empty">La collezione \xE8 vuota. Aggiungi lame, ratchet e punte nella scheda <b>Pezzi</b> e qui comparir\xE0 il deck migliore.</div>`;
  } else if (res.error) {
    body = res.error.rule ? `<div class="empty">Con la regola \u201Cuna punta per tipo\u201D non esiste un deck valido${anyPinned() ? " con i pezzi che hai fissato" : ""}. Disattivala, sblocca qualche pezzo o assegna tipi diversi alle punte.</div>` : res.error.lock ? `<div class="empty">Con i pezzi che hai fissato non esiste un deck valido. <button class="btn" data-act="unpin-all">Sblocca tutto</button></div>` : `<div class="empty">Servono almeno 3 lame, 3 punte e un ratchet per ogni lama senza ratchet integrato. Ora hai ${res.error.B} lame, ${res.error.R} ratchet, ${res.error.T} punte utilizzabili.</div>`;
  } else {
    if (viewIdx >= res.decks.length) viewIdx = 0;
    const cur = res.decks[viewIdx];
    const missing = [];
    const seen = /* @__PURE__ */ new Set();
    cur.combos.forEach((c) => {
      const p = c.pair;
      if (p && !p.topOwned && p.share < 0.5 && !seen.has(p.topBit)) {
        seen.add(p.topBit);
        missing.push(`${p.topBit}: ${tourName(c.b) || c.b.name} la usa nel ${Math.round(p.topShare * 100)}% dei deck in top cut`);
      }
    });
    const others = res.decks.map((d, i) => ({ d, i })).filter((x) => x.i !== viewIdx);
    body = `
    <section class="panel">
      <div class="deck-head">
        <div class="stack" style="gap:4px"><h3>${viewIdx === 0 ? "Deck consigliato" : "Proposta " + (viewIdx + 1)}</h3><p class="muted small">Cambia un pezzo dai menu: resta fissato e il resto del deck si ricalcola.</p></div>
        <div class="row"><span class="score-big">${cur.score.toFixed(1)}</span><span class="muted small">punti<br>indice</span></div>
      </div>
      <div class="row">
        <button class="btn" data-act="prev-deck" ${viewIdx === 0 ? "disabled" : ""} aria-label="Proposta precedente">\u2039</button>
        <span class="mono small">proposta ${viewIdx + 1} di ${res.decks.length}</span>
        <button class="btn" data-act="next-deck" ${viewIdx >= res.decks.length - 1 ? "disabled" : ""} aria-label="Proposta successiva">\u203A</button>
        ${anyPinned() ? `<button class="btn ghost" data-act="unpin-all">Sblocca tutti i pezzi</button>` : ""}
      </div>
      <div class="grid3">${cur.combos.map((c, i) => comboCard(c, i, res)).join("")}</div>
      ${missing.length ? `<div class="note"><b>Ti mancano per usare queste lame come nel meta:</b><br>${missing.map(esc).join("<br>")}</div>` : ""}
      <div class="row">
        <button class="btn primary" data-act="use-deck" data-i="${viewIdx}">Usa nel torneo</button>
        <button class="btn" data-act="save-deck" data-i="${viewIdx}">Salva tra i miei deck</button>
        ${STANDALONE ? "" : `<button class="btn" data-act="ask-ai" ${aiBusy ? "disabled" : ""}>${aiBusy && !metaMsg && !chMsg ? "Claude sta ragionando\u2026" : "Chiedi un parere a Claude"}</button>`}
      </div>
      <p class="small muted">\u201CUsa nel torneo\u201D apre la scheda Tornei con questo deck gi\xE0 inserito. \u201CSalva\u201D lo mette nella sezione Deck, da richiamare quando registri un torneo.</p>
      ${STANDALONE ? "" : aiView() + chatView()}
    </section>
    ${others.length ? `<section class="panel">${foldHead("others", "Altre proposte", others.length)}${fold.others ? "" : `<div>${others.map(({ d, i }) => `
      <div class="alt"><div class="stack" style="gap:4px">${d.combos.map((c) => `<span><b>${esc(c.b.name)}</b> <span class="mono">${esc(c.r.id === "int" ? "integrato" : c.r.name)} ${esc(c.t.code || c.t.name)}</span></span>`).join("")}</div>
      <div class="row"><span class="mono">${d.score.toFixed(1)}</span><button class="btn" data-act="show-deck" data-i="${i}">Mostra</button></div></div>`).join("")}</div>`}</section>` : ""}`;
    window.__decks = res.decks;
  }
  return `
  <section class="panel">
    <h2>Costruisci il deck</h2>
    <p class="muted">L'indice combina tre cose: quanto spesso ogni pezzo arriva in top cut, se la lama viene usata davvero con quella punta e quel ratchet nei deck del meta, e i tuoi risultati registrati, tornei e allenamenti.</p>
    <div class="grid2">
      <label class="chk"><input type="checkbox" id="rule-bit" ${st.bitTypeLimit ? "checked" : ""}> Regola local: massimo una punta per tipo</label>
      <label class="f">Peso dei tuoi risultati: <span class="mono" id="pw-val">${st.personalWeight}%</span>
        <input type="range" id="pw" min="0" max="100" step="10" value="${st.personalWeight}"></label>
    </div>
    <p class="note">Formato: 3 trottole con pezzi unici, gironi a 4 punti, eliminazione diretta a 7. Ratchet \u201C4-60\u201D = 4 denti, altezza 6,0 mm.</p>
  </section>
  ${body}`;
}
function comboCard(c, i, res) {
  const pin = slotsOf()[i] || {};
  const sel = (type, list, curId) => `<select data-slot="${i}" data-stype="${type}" aria-label="${TYPE_LABEL[type]} trottola ${i + 1}">${byName(list).map((p) => `<option value="${p.id}" ${p.id === curId ? "selected" : ""}>${esc(type === "bit" ? bitLabel(p) : p.name)}</option>`).join("")}</select>`;
  const pinChip = (type) => pin[type] ? `<button class="chip acc" type="button" data-act="unpin" data-slot="${i}" data-stype="${type}" title="Sblocca">fissato \u2715</button>` : "";
  const tn = tourName(c.b);
  return `<div class="combo">
    <span class="slot">TROTTOLA ${i + 1}${c.b.left ? " \xB7 ROTAZIONE SX" : ""}</span>
    <div class="stack" style="gap:6px">
      <div class="row" style="gap:6px">${sel("blade", res.B, c.b.id)}${pinChip("blade")}</div>
      ${tn ? `<span class="small muted">nei tornei: ${esc(tn)}</span>` : ""}
      <div class="row" style="gap:6px">${c.r.id === "int" ? `<span class="chip">ratchet integrato</span>` : sel("ratchet", res.R, c.r.id) + pinChip("ratchet")}</div>
      <div class="row" style="gap:6px">${sel("bit", res.T, c.t.id)}${pinChip("bit")}</div>
    </div>
    <div class="bars">${barRow("lama", c.sb)}${c.r.id === "int" ? "" : barRow("ratchet", c.sr)}${barRow("punta", c.st)}</div>
    <div class="row">${c.t.kind ? `<span class="chip">${esc(c.t.kind)}</span>` : ""}${c.pair ? c.pair.share >= 0.15 ? `<span class="chip good">abbinamento da meta</span>` : c.pair.share === 0 ? `<span class="chip bad">abbinamento mai visto</span>` : `<span class="chip warn">abbinamento raro</span>` : ""}</div>
    ${c.why.length ? `<p class="small muted">${esc(c.why.join(". "))}.</p>` : ""}
  </div>`;
}
function aiView() {
  if (aiError) return `<p class="note">${esc(aiError)}</p>`;
  if (!aiResult) return "";
  const r = aiResult;
  const owned = new Set(S.parts.flatMap((p) => [p.code, p.name, p.metaName].filter(Boolean).map((x) => x.toLowerCase())));
  const chk = (n) => !n || /integrat/i.test(n) || owned.has(String(n).toLowerCase()) ? "" : ` <span class="chip warn">non in collezione</span>`;
  return `<div class="ai-out">
    <h3>Il parere di Claude</h3>
    ${(r.deck || []).map((c, i) => `<div><b>${i + 1}. ${esc(c.lama)}${chk(c.lama)} <span class="mono">${esc(c.ratchet || "")}${chk(c.ratchet)} ${esc(c.punta)}${chk(c.punta)}</span></b>${c.ruolo ? ` <span class="chip">${esc(c.ruolo)}</span>` : ""}<br><span class="muted">${esc(c.motivo || "")}</span></div>`).join("")}
    ${r.ordine ? `<p><b>Ordine:</b> ${esc(r.ordine)}</p>` : ""}
    ${(r.consigli || []).length ? `<div><b>Consigli</b><ul>${r.consigli.map((x) => `<li>${esc(x)}</li>`).join("")}</ul></div>` : ""}
    ${(r.acquisti || []).length ? `<div><b>Pezzi che migliorerebbero il deck</b><ul>${r.acquisti.map((x) => `<li>${esc(x)}</li>`).join("")}</ul></div>` : ""}
  </div>`;
}

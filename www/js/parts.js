function addCxBox(text) {
  const w = String(text).trim().split(/\s+/);
  let letters = "";
  if (w.length > 2 && /^[A-Za-z]{1,2}$/.test(w[w.length - 1])) letters = w.pop().toUpperCase();
  else if (w.length > 2 && /^[A-Za-z]{1,2}\d/.test(w[w.length - 1])) letters = w.pop().match(/^[A-Za-z]{1,2}/)[0].toUpperCase();
  if (w.length !== 2 || !letters) return { ok: false, msg: "Scrivi il nome come sulla scatola, per esempio Armor Knight GV" };
  const asChip = (n) => catalogMatch("lockchip", n), asMain = (n) => catalogMatch("mainblade", n);
  let [chipN, mainN] = asChip(w[1]) && !asChip(w[0]) ? [w[1], w[0]] : asChip(w[0]) ? [w[0], w[1]] : asMain(w[0]) ? [w[1], w[0]] : [w[1], w[0]];
  const want = [["lockchip", chipN], ["mainblade", mainN]];
  if (letters.length === 2) want.push(["overblade", letters[0]]);
  want.push(["assist", letters[letters.length - 1]]);
  const done = [];
  for (const [type, n] of want) {
    const c = catalogMatch(type, n);
    const name = c ? type === "mainblade" || type === "lockchip" ? n : c.jp : n;
    const ex = S.parts.find((p2) => p2.type === type && (catKey(p2.name) === catKey(name) || c && p2.cat === c.jp));
    if (ex) {
      ex.qty = (+ex.qty || 0) + 1;
      done.push(`${TYPE_LABEL[type]} ${ex.name} (ora ${ex.qty})`);
      continue;
    }
    const p = autoCatalog({ id: uid(), type, name, code: "", metaName: "", kind: "", qty: 1, avoid: false, note: "" });
    if (!p.metaName && type === "assist") p.metaName = matchName(p);
    S.parts.push(p);
    done.push(`${TYPE_LABEL[type]} ${p.name}${p.cat && catKey(p.cat) !== catKey(p.name) ? ` (in Giappone ${p.cat})` : ""}`);
  }
  return { ok: true, msg: "Aggiunti: " + done.join(", ") };
}
function catLine(p) {
  if (!["blade", "bit", ...CX_TYPES].includes(p.type)) return "";
  if (!p.cat) return ["blade", "bit", "mainblade"].includes(p.type) ? `<div class="small muted" style="margin-top:2px">non riconosciuto: scegli il tipo</div>` : "";
  const c = catalogMatch(p.type, p.name, p.code);
  if (!c) return "";
  const bits = [catKey(c.jp) !== catKey(p.name) ? `in Giappone ${esc(c.jp)}` : "", c.integrated ? "ratchet integrato" : "", c.left ? "gira a sinistra" : ""].filter(Boolean);
  return bits.length ? `<div class="small muted" style="margin-top:2px">${bits.join(" \xB7 ")}</div>` : "";
}
function kindSel(p) {
  const c = p.cat ? catalogMatch(p.type, p.name, p.code) : null;
  const manual = p.kindSrc === "manual";
  return `<select data-f="kind" data-id="${p.id}" aria-label="Tipo"><option value="" ${manual ? "" : "selected"}>${c ? `automatico (${c.kind})` : "da scegliere"}</option>${KINDS.map((k) => `<option value="${k}" ${manual && k === p.kind ? "selected" : ""}>${k}</option>`).join("")}</select>`;
}
function vParts() {
  const GROUP_TITLE = { blade: "Lame", ratchet: "Ratchet", bit: "Punte", lockchip: "Lock chip", overblade: "Over blade (facoltativa)", mainblade: "Main blade (sulla scatola Hasbro: metal blade)", assist: "Assist blade (sulla scatola Hasbro: auxiliary blade)" };
  const table = (type) => {
    const list = S.parts.filter((p) => p.type === type);
    const sc = scorer();
    const names = (meta()[type] || []).map((x) => x[0]);
    const hasMeta = !["lockchip", "mainblade", "overblade"].includes(type), hasKind = ["blade", "bit", "mainblade"].includes(type), cx = CX_TYPES.includes(type);
    return `<div class="stack" style="gap:8px">
      <div class="row" style="justify-content:space-between"><h3>${GROUP_TITLE[type]} <span class="chip">${list.length}</span></h3></div>
      ${list.length ? `<div class="tbl"><table><thead><tr><th>${type === "bit" ? "Sigla \xB7 nome" : "Nome"}</th>${hasMeta ? "<th>Nome nei tornei</th>" : ""}${hasKind ? "<th>Tipo</th>" : ""}${type === "blade" ? "<th>Ratchet integrato</th><th>Rotazione sx</th>" : ""}<th>Qt\xE0</th><th>Indice</th><th>Evita</th><th>Nota</th><th></th></tr></thead><tbody>
      ${list.map((p) => {
      const s = sc(p);
      return `<tr class="${p.avoid ? "off" : ""}">
        <td>${type === "bit" ? `<div class="row" style="gap:6px;flex-wrap:nowrap"><input data-f="code" data-id="${p.id}" value="${esc(p.code || "")}" style="width:52px" aria-label="Sigla"><input data-f="name" data-id="${p.id}" value="${esc(p.name)}" aria-label="Nome" style="width:120px"></div>` : `<input data-f="name" data-id="${p.id}" value="${esc(p.name)}" aria-label="Nome" style="width:150px">`}${catLine(p)}</td>
        ${hasMeta ? `<td><select data-f="metaName" data-id="${p.id}" aria-label="Nome nei tornei"><option value="">fuori classifica</option>${names.slice().sort(alpha).map((n) => `<option ${n === p.metaName ? "selected" : ""}>${esc(n)}</option>`).join("")}</select></td>` : ""}
        ${hasKind ? `<td>${kindSel(p)}</td>` : ""}
        ${type === "blade" ? `<td><input type="checkbox" id="cb-integrated-${p.id}-${p.integrated ? 1 : 0}" data-f="integrated" data-id="${p.id}" ${p.integrated ? "checked" : ""} aria-label="Ratchet integrato"></td><td><input type="checkbox" id="cb-left-${p.id}-${p.left ? 1 : 0}" data-f="left" data-id="${p.id}" ${p.left ? "checked" : ""} aria-label="Rotazione sinistra"></td>` : ""}
        <td><input class="qty" type="number" min="0" data-f="qty" data-id="${p.id}" value="${+p.qty || 0}" aria-label="Quantit\xE0"></td>
        <td class="mono">${hasMeta ? `${s.total.toFixed(0)}${s.metaRank ? ` <span class="muted small">#${s.metaRank}</span>` : ""}${s.games ? ` <span class="chip">${s.games} inc.</span>` : ""}` : "\u2014"}</td>
        <td><input type="checkbox" id="cb-avoid-${p.id}-${p.avoid ? 1 : 0}" data-f="avoid" data-id="${p.id}" ${p.avoid ? "checked" : ""} aria-label="Escludi dai deck"></td>
        <td><input data-f="note" data-id="${p.id}" value="${esc(p.note || "")}" placeholder="\u2014" aria-label="Nota" style="width:150px"></td>
        <td><button class="btn ghost" data-act="del-part" data-id="${p.id}" aria-label="Elimina ${esc(p.name)}">\u2715</button></td></tr>`;
    }).join("")}
      </tbody></table></div>` : `<div class="empty">${cx ? `Nessun pezzo. Aggiungilo dal modulo qui sopra scegliendo \u201CCX \xB7 ${TYPE_LABEL[type]}\u201D.` : "Nessun pezzo registrato."}</div>`}
    </div>`;
  };
  const cxN = cxBlades(true).length;
  const groups = ["blade", "ratchet", "bit"].map((t) => `<section class="panel">${table(t)}</section>`).join("") + `<section class="panel">
    <h2>Sistema CX</h2>
    <p class="muted">Una lama CX si monta con un lock chip, una main blade e una assist blade; alcune (CX Expand) hanno anche una over blade, che \xE8 facoltativa. Le lettere dopo il nome indicano over e assist blade: in Armor Knight GV il lock chip \xE8 Knight, la main blade \xE8 Armor (in Giappone Fortress), G \xE8 la over blade Guard e V l'assist blade Vertical. Il Builder prova tutte le combinazioni dei pezzi CX che hai, con e senza over blade, e le tratta come lame normali; nel deck ogni pezzo CX si usa una volta sola. Per il nome nei tornei conta lock chip + main blade col nome giapponese, per esempio Knight Fortress.</p>
    ${cxN ? `<p class="small">Con i tuoi pezzi puoi montare <b>${cxN}</b> lam${cxN === 1 ? "a" : "e"} CX.</p>` : ""}
    ${CX_TYPES.map(table).join("")}
  </section>`;
  return `<section class="panel">
    <h2>La tua collezione</h2>
    <p class="muted">Scrivi il nome che trovi sulla scatola: tipo, rotazione e ratchet integrato si compilano da soli dal catalogo, e sotto il nome compare come si chiama il pezzo in Giappone. Se il catalogo non lo conosce, il tipo lo scegli tu. Il nome \xE8 quello della confezione; \u201Cnome nei tornei\u201D \xE8 quello usato nelle classifiche, e si ricollega da solo quando aggiorni il meta. Un pezzo fuori classifica vale ${fallback()} punti di indice. Se nella nota scrivi \u201Cballa\u201D o \u201Clento\u201D, il ratchet viene penalizzato.</p>
    <form id="add-part" class="row">
      <select id="np-type" aria-label="Categoria"><option value="blade">Lama</option><option value="ratchet">Ratchet</option><option value="bit">Punta</option><option value="cxbox">CX \xB7 intera, col nome della scatola</option><option value="lockchip">CX \xB7 Lock chip</option><option value="overblade">CX \xB7 Over blade</option><option value="mainblade">CX \xB7 Main / metal blade</option><option value="assist">CX \xB7 Assist / auxiliary blade</option></select>
      <input id="np-name" data-ac="blade" autocomplete="off" placeholder="Nome sulla scatola, es. Tide Whale o 3-60" required aria-label="Nome del pezzo" style="flex:1;min-width:160px">
      <input id="np-code" placeholder="Sigla punta" aria-label="Sigla della punta" style="width:110px" hidden>
      <button class="btn primary" type="submit">Aggiungi</button>
    </form>
  </section>${groups}${vBackup()}`;
}

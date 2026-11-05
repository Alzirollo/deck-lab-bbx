function vParts() {
  const GROUP_TITLE = { blade: "Lame", ratchet: "Ratchet", bit: "Punte", lockchip: "Lock chip", mainblade: "Main blade", assist: "Assist blade" };
  const table = (type) => {
    const list = S.parts.filter((p) => p.type === type);
    const sc = scorer();
    const names = (meta()[type] || []).map((x) => x[0]);
    const hasMeta = type !== "lockchip" && type !== "mainblade", hasKind = ["blade", "bit", "mainblade"].includes(type), cx = CX_TYPES.includes(type);
    return `<div class="stack" style="gap:8px">
      <div class="row" style="justify-content:space-between"><h3>${GROUP_TITLE[type]} <span class="chip">${list.length}</span></h3></div>
      ${list.length ? `<div class="tbl"><table><thead><tr><th>${type === "bit" ? "Sigla \xB7 nome" : "Nome"}</th>${hasMeta ? "<th>Nome nei tornei</th>" : ""}${hasKind ? "<th>Tipo</th>" : ""}${type === "blade" ? "<th>Ratchet integrato</th><th>Rotazione sx</th>" : ""}<th>Qt\xE0</th><th>Indice</th><th>Evita</th><th>Nota</th><th></th></tr></thead><tbody>
      ${list.map((p) => {
      const s = sc(p);
      return `<tr class="${p.avoid ? "off" : ""}">
        <td>${type === "bit" ? `<div class="row" style="gap:6px;flex-wrap:nowrap"><input data-f="code" data-id="${p.id}" value="${esc(p.code || "")}" style="width:52px" aria-label="Sigla"><input data-f="name" data-id="${p.id}" value="${esc(p.name)}" aria-label="Nome" style="width:120px"></div>` : `<input data-f="name" data-id="${p.id}" value="${esc(p.name)}" aria-label="Nome" style="width:150px">`}</td>
        ${hasMeta ? `<td><select data-f="metaName" data-id="${p.id}" aria-label="Nome nei tornei"><option value="">fuori classifica</option>${names.slice().sort(alpha).map((n) => `<option ${n === p.metaName ? "selected" : ""}>${esc(n)}</option>`).join("")}</select></td>` : ""}
        ${hasKind ? `<td><select data-f="kind" data-id="${p.id}" aria-label="Tipo"><option value="">?</option>${KINDS.map((k) => `<option ${k === p.kind ? "selected" : ""}>${k}</option>`).join("")}</select></td>` : ""}
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
    <p class="muted">Una lama CX si monta con un lock chip, una main blade e una assist blade. Il Builder prova tutte le combinazioni dei pezzi CX che hai e le tratta come lame normali; nel deck ogni lock chip, main blade e assist blade si usa una volta sola. Per il nome nei tornei conta lock chip + main blade, per esempio Pegasus Blast.</p>
    ${cxN ? `<p class="small">Con i tuoi pezzi puoi montare <b>${cxN}</b> lam${cxN === 1 ? "a" : "e"} CX.</p>` : ""}
    ${CX_TYPES.map(table).join("")}
  </section>`;
  return `<section class="panel">
    <h2>La tua collezione</h2>
    <p class="muted">Il nome \xE8 quello della confezione; \u201Cnome nei tornei\u201D \xE8 quello usato nelle classifiche, e si ricollega da solo quando aggiorni il meta. Un pezzo fuori classifica vale ${fallback()} punti di indice. Se nella nota scrivi \u201Cballa\u201D o \u201Clento\u201D, il ratchet viene penalizzato.</p>
    <form id="add-part" class="row">
      <select id="np-type" aria-label="Categoria"><option value="blade">Lama</option><option value="ratchet">Ratchet</option><option value="bit">Punta</option><option value="lockchip">CX \xB7 Lock chip</option><option value="mainblade">CX \xB7 Main blade</option><option value="assist">CX \xB7 Assist blade</option></select>
      <input id="np-name" placeholder="Nome, es. Shark Scale o 3-60" required aria-label="Nome del pezzo" style="flex:1;min-width:160px">
      <input id="np-code" placeholder="Sigla punta" aria-label="Sigla della punta" style="width:110px">
      <button class="btn primary" type="submit">Aggiungi</button>
    </form>
  </section>${groups}${vBackup()}`;
}

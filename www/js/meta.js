function vMeta() {
  const M = meta();
  const ownBy = (t) => new Set(S.parts.filter((p) => p.type === t && p.metaName).map((p) => normKey(p.metaName)));
  const ref = M.fetchedAt || null;
  const ageDays = ref ? Math.round((Date.now() - new Date(ref).getTime()) / 864e5) : null;
  const list = (t, title) => {
    const own = ownBy(t);
    const arr = (M[t] || []).slice(0, 25);
    const max = Math.max(1, ...arr.map((x) => x[1]));
    return `<div class="panel"><h3>${title}</h3><div>${arr.map(([n, s], i) => `<div class="rank ${own.has(normKey(n)) ? "own" : ""}"><span class="r">#${i + 1}</span><span class="nm"><span>${esc(n)}</span><i><b style="width:${(s / max * 100).toFixed(0)}%"></b></i></span><span class="s">${s}</span></div>`).join("")}</div></div>`;
  };
  const cx = ["lockchip", "overblade", "assist"].some((k) => (M[k] || []).length);
  const tf = M.period || "year";
  return `
  <section class="panel">
    <h2>Meta attuale</h2>
    <div class="row">
      <span class="chip acc">${esc(M.source || "MetaBeys")}</span>
      <span class="chip">${esc(PERIOD_LABEL[M.period] || M.period || "")}</span><span class="mono small">letto il ${new Date(M.fetchedAt).toLocaleDateString("it-IT")}</span>${M.appearances ? `<span class="chip">${M.appearances} apparizioni in top cut</span>` : ""}
      ${ageDays != null && ageDays > 14 ? `<span class="chip warn">dati di ${ageDays} giorni fa</span>` : ""}
    </div>
    <p class="muted small">In arancione i pezzi che possiedi. Il numero indica quante volte il pezzo \xE8 comparso in un deck arrivato in top cut. I dati MetaBeys vengono soprattutto da tornei in Canada e Stati Uniti.</p>
    <div class="row">
      ${STANDALONE ? `<label class="f">Periodo<select id="mb-tf">${NATIVE_PERIODS.map(([v, l]) => `<option value="${v}" ${v === (NATIVE_PERIODS.some((x) => x[0] === tf) ? tf : "d180") ? "selected" : ""}>${l}</option>`).join("")}</select></label>
          <button class="btn primary" data-act="mb-native" ${aiBusy ? "disabled" : ""}>${aiBusy && metaMsg ? "Aggiornamento in corso\u2026" : "Aggiorna da MetaBeys"}</button>` : `<label class="f">Periodo<select id="mb-tf">${["year", "month", "all"].map((v) => `<option value="${v}" ${v === tf ? "selected" : ""}>${PERIOD_LABEL[v]}</option>`).join("")}</select></label>
          <button class="btn primary" data-act="mb-update" ${aiBusy ? "disabled" : ""}>${aiBusy && metaMsg ? "Lettura in corso\u2026" : "Aggiorna da MetaBeys"}</button>`}
      ${S.meta ? `<button class="btn" data-act="reset-meta">Torna ai dati di partenza</button>` : ""}
    </div>
    ${metaMsg ? `<p class="note">${esc(metaMsg)}</p>${browserDenied ? `<div class="row"><button class="btn" data-act="open-perms">Permessi</button><span class="small muted">Attiva \u201Cbrowser\u201D per Deck Lab BBX, poi riprova.</span></div>` : ""}` : ""}
    <p class="small muted">${STANDALONE ? "L'app scarica i tornei di MetaBeys e calcola le classifiche da sola; all'apertura si aggiorna se i dati hanno pi\xF9 di 3 giorni. Periodi brevi contengono pochi tornei." : "La lettura automatica usa il browser dell'app Claude per Mac: la prima volta ti chiede il permesso. \u201CUltimo mese\u201D include pochi tornei, quindi \xE8 meno affidabile."}</p>
  </section>
  ${(M.combos || []).length ? (() => {
    const own = (t) => (k) => ownsCanon(t, canon(k));
    const top = M.combos.slice(0, 20);
    const max = Math.max(1, ...top.map((c) => c[3]));
    return `<section class="panel"><h3>Combo pi\xF9 usate in top cut</h3><p class="small muted">In arancione le combo che puoi montare con i tuoi pezzi.</p><div>${top.map((c, i) => {
      const full = own("blade")(c[0]) && (c[1] === "-" || own("ratchet")(c[1])) && own("bit")(c[2]);
      return `<div class="rank ${full ? "own" : ""}"><span class="r">#${i + 1}</span><span class="nm"><span>${esc(c[0])} <span class="mono muted">${esc(c[1])} \xB7 ${esc(c[2])}</span></span><i><b style="width:${(c[3] / max * 100).toFixed(0)}%"></b></i></span><span class="s">${c[3]}</span></div>`;
    }).join("")}</div></section>`;
  })() : ""}
  <div class="grid2">${list("blade", "Lame")}${list("bit", "Punte")}${list("ratchet", "Ratchet")}
    ${(M.assist || []).length ? list("assist", "Assist blade (CX)") : ""}
  </div>`;
}

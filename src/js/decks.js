// Scheda DECK: deck salvati (le statistiche sono in stats.js)
function vSavedTab(){
  return vSavedTabDecks()+vStats();
}
function vSavedTabDecks(){
  if(!S.decks.length) return `<section class="panel"><h2>I miei deck</h2><div class="empty">Non hai ancora salvato nessun deck. Nel Builder scegli i pezzi e premi “Salva tra i miei deck”.<div class="row" style="justify-content:center;margin-top:12px"><button class="btn primary" data-act="go-builder">Vai al Builder</button></div></div></section>`;
  return vSaved();
}
// Deck salvato: la lama resta fissa, ratchet e punta si cambiano dal menu
const ownedOf = type => byName(S.parts.filter(p=>p.type===type && (+p.qty||0)>0));
function savedComboRow(d,c,i){
  const blade=nm("blade",c.blade);
  // valore = id del pezzo; se il pezzo salvato non è più tra i tuoi resta comunque in elenco
  const sel=(type,lab)=>{ const list=ownedOf(type), cur=refId(type,c[type]); const all=list.some(p=>p.id===cur)?list:list.concat([{id:cur, name:nm(type,c[type])}]);
    return `<select data-dk="${d.id}" data-i="${i}" data-dt="${type}" aria-label="${lab} di ${esc(blade)}">${all.map(p=>`<option value="${esc(p.id)}" ${p.id===cur?"selected":""}>${esc(type==="bit"&&p.code?bitLabel(p):p.name)}</option>`).join("")}</select>` };
  const rSel = !c.ratchet ? `<span class="chip">ratchet integrato</span>` : sel("ratchet","Ratchet");
  const tSel = sel("bit","Punta");
  return `<div class="row" style="gap:6px"><b class="small" style="min-width:110px">${esc(blade)}</b>${rSel}${tSel}</div>`;
}
// Avviso se il deck usa un ratchet o una punta più volte di quante ne hai
function savedClash(d){
  const over=[];
  for(const [type,key] of [["ratchet","ratchet"],["bit","bit"]]){
    const cnt=new Map(); d.combos.forEach(c=>{ const v=c[key]&&refId(type,c[key]); if(v) cnt.set(v,(cnt.get(v)||0)+1) });
    for(const [id,k] of cnt){ const p=ref(type,id); if(k>(p?(+p.qty||0):0)) over.push(nm(type,id)) }
  }
  return over.length?`<span class="chip warn">Ne hai meno di quanti ne usa il deck: ${esc(over.join(", "))}</span>`:"";
}
function rescoreDeck(d){
  try{
    const sc=scorer(), ci=comboIndex();
    const sum=d.combos.map(c=>{ const b=ref("blade",c.blade), r=c.ratchet?ref("ratchet",c.ratchet):INTEGRATED, t=ref("bit",c.bit);
      if(!b||!r||!t) throw 0; return comboScore(b,r,t,sc,ci).score });
    d.score=sum.reduce((a,x)=>a+x,0)/sum.length;
  }catch(_){}
}
function vSaved(){
  if(!S.decks.length) return "";
  return `<section class="panel"><h2>I miei deck</h2><div>${S.decks.map(d=>`
    <div class="alt"><div class="stack" style="gap:4px"><input data-deckname="${d.id}" value="${esc(d.name)}" aria-label="Nome del deck" style="font-weight:600;max-width:100%"><span class="small muted">${esc(d.date)} · indice ${(+d.score||0).toFixed(1)}</span>
      ${d.combos.map((c,i)=>savedComboRow(d,c,i)).join("")}${savedClash(d)}</div>
    <div class="row"><button class="btn" data-act="use-saved" data-id="${d.id}">Usa nel torneo</button><button class="btn ghost" data-act="del-deck" data-id="${d.id}" aria-label="Elimina deck">Elimina</button></div>
    ${vDeckStats(d)}</div>`).join("")}</div><div class="row"><button class="btn" data-act="go-builder">Crea un nuovo deck nel Builder</button></div></section>`;
}

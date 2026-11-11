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
  return `<div class="stack" style="gap:4px"><b class="small">${esc(blade)}</b><div class="dk-sel">${rSel}${tSel}</div></div>`;
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
// Elenco compatto: per ogni deck nome, trottole e stima. Tocchi il deck e si apre con modifica, pulsanti e statistiche.
let deckSort=(()=>{ try{ return localStorage.getItem("decklab-decksort")||"stima" }catch(e){ return "stima" } })();
const shortCombo = c => `${nm("blade",c.blade)} ${c.ratchet?nm("ratchet",c.ratchet)+" ":""}${bitShort(c.bit)}`;
function vSaved(){
  if(!S.decks.length) return "";
  const recs=battleRecords(); // una volta sola per tutti i deck
  const rows=S.decks.map(d=>({d, sum:deckSummary(d, recs)}));
  if(deckSort==="stima") rows.sort((x,y)=>(y.sum?y.sum.p:-1)-(x.sum?x.sum.p:-1));
  const sortBtn=(k,l)=>`<button class="btn ${deckSort===k?"primary":"ghost"}" data-act="dk-sort" data-k="${k}" aria-pressed="${deckSort===k}">${l}</button>`;
  return `<section class="panel"><div class="row" style="justify-content:space-between;align-items:center"><h2 style="margin:0">I miei deck <span class="chip">${S.decks.length}</span></h2>
    <div class="row" style="gap:4px"><span class="small muted">Ordina</span>${sortBtn("stima","per stima")}${sortBtn("data","recenti")}</div></div>
    <div>${rows.map(({d,sum})=>vSavedRow(d,sum)).join("")}</div>
    <div class="row"><button class="btn" data-act="go-builder">Crea un nuovo deck nel Builder</button></div></section>`;
}
function vSavedRow(d, sum){
  const open=deckOpen===d.id, clash=savedClash(d);
  const head=`<button type="button" class="dk-head" data-act="dk-open" data-k="${d.id}" aria-expanded="${open}">
      <span class="dk-name">${esc(d.name)}</span>
      <b class="mono dk-pct">${sum?sum.p+"%":"–"}</b><span class="mono muted">${open?"▴":"▾"}</span>
      <span class="small muted dk-combos">${d.combos.map(c=>esc(shortCombo(c))).join(" · ")}</span>
    </button>${sum?estBar(sum.p).replace('height:8px','height:5px'):""}${clash&&!open?clash:""}`;
  if(!open) return `<div class="dk-row">${head}</div>`;
  return `<div class="dk-row open">${head}
    <div class="stack" style="gap:8px;padding-top:10px">
      <input data-deckname="${d.id}" value="${esc(d.name)}" aria-label="Nome del deck" style="font-weight:600;max-width:100%">
      <span class="small muted">${esc(d.date)} · indice ${(+d.score||0).toFixed(1)}</span>
      ${d.combos.map((c,i)=>savedComboRow(d,c,i)).join("")}${clash}
      <div class="row"><button class="btn primary" data-act="use-saved" data-id="${d.id}">Usa nel torneo</button><button class="btn ghost" data-act="del-deck" data-id="${d.id}" aria-label="Elimina deck">Elimina</button></div>
      ${vDeckStats(d, sum)}
    </div></div>`;
}

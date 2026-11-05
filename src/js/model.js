// ---------- Riferimenti ai pezzi ----------
// Deck, tornei e allenamenti salvano ogni pezzo mio con il suo id: {blade, ratchet, bit}.
// Ratchet vuoto = ratchet integrato. Le lame CX hanno id "cx:<lock chip>:<main blade>:<assist>".
// I dati vecchi avevano il nome del pezzo (o la sigla della punta): ref() li riconosce ancora e migrateRefs() li sostituisce con l'id.
// Le combo avversarie (mine:false) restano testo libero.

function cxFromId(id, parts){
  const m=/^cx:([^:]+):([^:]+):([^:]+)$/.exec(id); if(!m) return null;
  const [c,mb,a]=m.slice(1).map(x=>parts.find(p=>p.id===x)); if(!c||!mb||!a) return null;
  return {id, type:"blade", cx:true, comps:[c.id,mb.id,a.id], name:`${c.name} ${mb.name} ${a.name}`, kind:mb.kind||"", left:!!mb.left, integrated:false};
}
// Il pezzo a cui punta un valore salvato (id, nome, sigla della punta o nome nei tornei); null se non c'è più
function ref(type, v, parts){
  parts=parts||S.parts; if(!v) return null; v=String(v);
  let p=parts.find(x=>x.type===type && x.id===v); if(p) return p;
  if(type==="blade" && v.startsWith("cx:")) return cxFromId(v, parts);
  p=parts.find(x=>x.type===type && x.name===v) || (type==="bit" ? parts.find(x=>x.type==="bit" && x.code===v) : null); if(p) return p;
  const k=canon(ALIAS[normKey(v)]||v);
  return parts.find(x=>x.type===type && ((x.metaName && canon(x.metaName)===k) || canon(x.name)===k)) || null;
}
const refId = (type, v, parts) => { const p=ref(type, v, parts); return p ? p.id : (v||"") };
// Nome da mostrare; se il pezzo non c'è più resta il testo salvato
const nm = (type, v) => { const p=ref(type, v); return p ? p.name : (v||"") };
const bitShort = v => { const p=ref("bit", v); return p ? (p.code||p.name) : (v||"") };
const isIntegrated = blade => { const p=ref("blade", blade); return !!(p && p.integrated) };
// Una combo mia scritta per esteso: "Wand Wizard 1-60 H"
const comboText = c => c && c.blade ? `${nm("blade",c.blade)} ${c.ratchet?nm("ratchet",c.ratchet):"integrato"} ${c.bit?bitShort(c.bit):""}`.trim() : "—";
const comboNames = c => c && c.blade ? {lama:nm("blade",c.blade), ratchet:c.ratchet?nm("ratchet",c.ratchet):"integrato", punta:c.bit?nm("bit",c.bit):""} : null;
// Chiave di una configurazione esatta (lama + ratchet + punta), per le statistiche
const comboId = c => c && c.blade ? [refId("blade",c.blade), c.ratchet?refId("ratchet",c.ratchet):"", c.bit?refId("bit",c.bit):""].join("|") : "";
// Combo del Builder ({b, r, t} con i pezzi) nel formato salvato
const fromBuilt = c => ({blade:c.b.id, ratchet:c.r.id==="int"?"":c.r.id, bit:c.t.id});

// Menu a tendina dei pezzi: valore = id, testo = nome (sigla per le punte)
function partOptions(type, val, includeAvoided, longBit){
  const cur=val?refId(type,val):""; const list=choicesOf(type, includeAvoided);
  const label=p=>p.type==="bit" ? (p.code ? (longBit?`${p.code} · ${p.name}`:p.code) : p.name) : p.name;
  const extra = cur && !list.some(p=>p.id===cur) ? `<option value="${esc(cur)}" selected>${esc(val)}</option>` : "";
  return `<option value="">—</option>`+extra+list.map(p=>`<option value="${esc(p.id)}" ${p.id===cur?"selected":""}>${esc(label(p))}</option>`).join("");
}

function migrateRefs(st){
  const P=st.parts||[];
  const fix=c=>{
    if(!c || typeof c!=="object" || c.mine===false || !(c.blade||c.ratchet||c.bit)) return c;
    const o={...c};
    if(o.blade) o.blade=refId("blade",o.blade,P);
    if(o.ratchet) o.ratchet=refId("ratchet",o.ratchet,P);
    if(o.bit || o.bitCode) o.bit = ref("bit",o.bit,P) ? refId("bit",o.bit,P) : (o.bitCode ? refId("bit",o.bitCode,P) : o.bit);
    delete o.bitCode; return o;
  };
  const phs=list=>(list||[]).forEach(ph=>{ if(Array.isArray(ph.combos)) ph.combos=ph.combos.map(fix) });
  (st.decks||[]).forEach(d=>{ d.combos=(d.combos||[]).map(fix) });
  (st.results||[]).forEach(r=>{ phs(r.phases); if(Array.isArray(r.combos)) r.combos=r.combos.map(fix) });
  if(st.live) phs(st.live.phases);
  if(st.train && st.train.cur){ st.train.cur.a=fix(st.train.cur.a); st.train.cur.b=fix(st.train.cur.b) }
  (st.trainLog||[]).forEach(e=>{ e.a=fix(e.a); e.b=fix(e.b) });
  st.refs=1;
  return st;
}
// Un pezzo che compare nello storico non si cancella: resta con quantità 0, così i nomi nei tornei passati non si perdono
function partInUse(id){
  const hit=c=>c && c.mine!==false && [c.blade,c.ratchet,c.bit].some(v=>v===id || (typeof v==="string" && v.startsWith("cx:") && v.split(":").includes(id)));
  const phs=list=>(list||[]).some(ph=>(ph.combos||[]).some(hit));
  return S.decks.some(d=>d.combos.some(hit)) || S.results.some(r=>phs(r.phases)||(r.combos||[]).some(hit)) || (S.live&&phs(S.live.phases)) || (S.trainLog||[]).some(e=>hit(e.a)||hit(e.b));
}

// Dati: meta di partenza, stato, salvataggio e sincronizzazione tra dispositivi, avvio
// ---------- Meta di riferimento (MetaBeys, ultimo anno) ----------
// Dati di partenza: MetaBeys, classifica dell'ultimo anno letta il 23/10/2026 (apparizioni in top cut).
const BUILTIN_META = {
  source:"MetaBeys", unit:"count", period:"year", fetchedAt:"2026-10-23T18:30:00Z", appearances:2161,
  blade:[["Wizard Rod",562],["Shark Scale",562],["Hover Wyvern",205],["Aero Pegasus",159],["Phoenix Wing",95],["Cobalt Dragoon",86],["Silver Wolf",81],["Pegasus Blast",70],["Meteor Dragoon",38],["Tyranno Beat",21],["Clock Mirage",20],["Emperor Blast",19],["Mummy Curse",19],["Dran Strike",17],["Glory Valkyrie",17],["Golem Rock",18],["Hells Nether",13],["Knight Mail",13],["Scorpio Spear",13],["Suppress Superion",12],["Valkyrie Blast",8],["Dran Buster",7],["Bullet Griffin",7],["Valor Bison",6],["Whale Wave",6],["Emperor Might",5],["Samurai Saber",5],["Sol Eclipse",5],["Impact Drake",4],["Orochi Cluster",4],["Red Hulk",4],["Bahamut Blitz",4],["Blast",3],["Ghost Circle",2],["Ragna Rage",2],["Ring Aether",2],["Unicorn Sting",2],["Weiss Tiger",2],["Wizard Arc",2]],
  ratchet:[["1-60",632],["9-60",494],["3-60",303],["1-70",226],["7-60",171],["5-60",68],["1-50",55],["7-70",30],["9-70",28],["1-80",17],["4-55",17],["4-50",16],["6-60",15],["3-70",14],["0-60",5],["7-55",4],["9-80",4],["5-50",3],["5-70",3],["6-70",2],["7-80",2],["8-70",2],["4-60",1],["6-80",1],["8-60",1],["9-90",1],["M-85",1]],
  bit:[["Hexa",464],["Low Rush",392],["Rush",329],["Kick",238],["Level",135],["Free Ball",127],["Elevate",89],["Low Orb",76],["Wedge",40],["Ball",48],["Jolt",48],["Rubber Accel",43],["Narrow",35],["Point",20],["Taper",19],["Under Needle",9],["Unite",9],["Jaggy",6],["Free Flat",5],["Low Flat",5],["Cyclone",3],["Gear Rush",2],["High Taper",2],["Low Point",2],["Wall Ball",2],["Zap",2],["Orb",1],["Needle",1]]
};
BUILTIN_META.assist = [["Heavy",83],["Wheel",20],["Jaggy",9],["Dual",4],["Flow Heavy",2],["Free",2],["Peak Heavy",2],["Break Heavy",1],["Bumper",1],["Guard Wheel",1],["Slash",1]];
// Combo in top cut nell'ultimo anno (MetaBeys, almeno 3 apparizioni): lama|ratchet|punta|volte
BUILTIN_META.combos = "Wizard Rod|1-60|Hexa|380;Shark Scale|1-70|Low Rush|100;Hover Wyvern|9-60|Kick|68;Shark Scale|3-60|Low Rush|60;Shark Scale|3-60|Rush|51;Cobalt Dragoon|9-60|Elevate|35;Silver Wolf|9-60|Free Ball|35;Cobalt Dragoon|5-60|Elevate|28;Aero Pegasus|7-60|Rush|26;Hover Wyvern|9-60|Rush|24;Wizard Rod|9-60|Ball|22;Wizard Rod|1-60|Low Orb|21;Phoenix Wing|9-60|Rush|20;Shark Scale|3-60|Level|18;Wizard Rod|1-60|Low Rush|18;Wizard Rod|1-60|Free Ball|18;Shark Scale|7-60|Rush|17;Shark Scale|1-60|Low Rush|15;Wizard Rod|9-60|Free Ball|15;Shark Scale|3-60|Kick|14;Hover Wyvern|1-60|Rush|14;Meteor Dragoon|7-60|Level|14;Hover Wyvern|9-60|Low Rush|13;Shark Scale|1-70|Rush|13;Shark Scale|3-60|Free Ball|13;Phoenix Wing|3-60|Rush|12;Silver Wolf|9-60|Low Orb|12;Aero Pegasus|3-60|Rush|12;Shark Scale|1-60|Rush|12;Aero Pegasus|1-60|Rush|12;Shark Scale|7-60|Low Rush|11;Aero Pegasus|1-70|Kick|11;Shark Scale|3-60|Narrow|11;Shark Scale|1-70|Level|10;Hover Wyvern|9-60|Jolt|10;Aero Pegasus|1-70|Low Rush|10;Shark Scale|1-50|Low Rush|10;Meteor Dragoon|9-60|Elevate|10;Shark Scale|9-60|Low Rush|9;Shark Scale|1-70|Kick|9;Aero Pegasus|7-60|Low Rush|9;Phoenix Wing|1-60|Low Rush|8;Shark Scale|1-60|Hexa|8;Shark Scale|3-60|Low Orb|8;Pegasus Blast|9-60|Low Rush|8;Shark Scale|9-60|Narrow|8;Wizard Rod|9-60|Narrow|8;Hover Wyvern|3-60|Rush|7;Wizard Rod|9-60|Hexa|7;Shark Scale|1-70|Free Ball|7;Shark Scale|9-60|Free Ball|7;Shark Scale|9-60|Wedge|7;Shark Scale|7-60|Rubber Accel|7;Shark Scale|3-60|Jolt|7;Meteor Dragoon|7-70|Level|7;Glory Valkyrie|-|Kick|7;Shark Scale|9-60|Rush|6;Pegasus Blast|3-60|Low Rush|6;Aero Pegasus|9-60|Rush|6;Pegasus Blast|9-60|Kick|6;Hover Wyvern|1-60|Low Rush|6;Phoenix Wing|3-60|Low Rush|6;Aero Pegasus|7-60|Level|6;Aero Pegasus|1-60|Kick|6;Silver Wolf|9-60|Ball|6;Shark Scale|9-60|Low Orb|6;Aero Pegasus|1-80|Rush|6;Bullet Griffin|-|Jolt|6;Pegasus Blast|4-50|Low Rush|5;Hover Wyvern|1-60|Kick|5;Tyranno Beat|1-70|Low Rush|5;Hover Wyvern|7-60|Kick|5;Clock Mirage|4-55|Low Orb|5;Hover Wyvern|9-60|Level|5;Aero Pegasus|9-60|Kick|5;Phoenix Wing|1-60|Rush|5;Wizard Rod|1-60|Rush|5;Shark Scale|9-70|Low Rush|5;Cobalt Dragoon|7-60|Level|5;Aero Pegasus|1-50|Rush|5;Shark Scale|1-50|Rush|5;Glory Valkyrie|-|Rush|5;Shark Scale|3-60|Ball|4;Wizard Rod|9-60|Wedge|4;Silver Wolf|9-70|Free Ball|4;Shark Scale|1-60|Kick|4;Aero Pegasus|1-70|Rush|4;Shark Scale|7-70|Low Rush|4;Hover Wyvern|3-60|Low Rush|4;Phoenix Wing|9-60|Wedge|4;Shark Scale|7-70|Kick|4;Hover Wyvern|9-60|Taper|4;Phoenix Wing|1-70|Kick|4;Aero Pegasus|7-60|Kick|4;Clock Mirage|4-55|Free Ball|4;Wizard Rod|7-60|Hexa|4;Wizard Rod|1-60|Ball|4;Wizard Rod|9-60|Low Orb|4;Golem Rock|9-60|Wedge|4;Mummy Curse|9-60|Wedge|4;Aero Pegasus|3-60|Kick|4;Hover Wyvern|1-60|Jolt|4;Shark Scale|1-70|Rubber Accel|4;Wizard Rod|1-60|Jolt|4;Bullet Griffin|-|Point|4;Dran Strike|3-60|Level|4;Shark Scale|4-50|Level|3;Wizard Rod|1-70|Hexa|3;Shark Scale|1-80|Kick|3;Wizard Rod|9-60|Kick|3;Hover Wyvern|3-60|Kick|3;Wizard Rod|1-60|Kick|3;Clock Mirage|4-55|Under Needle|3;Hover Wyvern|9-60|Rubber Accel|3;Wizard Rod|9-70|Free Ball|3;Tyranno Beat|1-70|Rush|3;Wizard Rod|1-60|Level|3;Pegasus Blast|9-60|Rush|3;Shark Scale|3-70|Hexa|3;Silver Wolf|1-70|Hexa|3;Aero Pegasus|3-60|Level|3;Wizard Rod|3-60|Hexa|3;Wizard Rod|6-60|Hexa|3;Shark Scale|1-70|Low Orb|3;Wizard Rod|0-60|Hexa|3;Mummy Curse|1-60|Hexa|3;Mummy Curse|1-60|Low Orb|3;Silver Wolf|1-60|Hexa|3;Shark Scale|3-70|Low Rush|3;Clock Mirage|7-55|Low Orb|3;Valkyrie Blast|9-60|Rush|3;Phoenix Wing|5-60|Rush|3;Emperor Blast|9-60|Level|3;Phoenix Wing|1-70|Low Rush|3;Scorpio Spear|9-60|Elevate|3;Phoenix Wing|1-50|Rush|3;Cobalt Dragoon|1-50|Elevate|3;Valor Bison|-|Low Rush|3;Glory Valkyrie|-|Free Flat|3;Wizard Rod|1-60|Narrow|3;Hells Nether|-|Kick|3;Hells Nether|-|Rush|3".split(";").map(x=>{const a=x.split("|"); return [a[0],a[1],a[2],+a[3]]});
const KINDS = ["attacco","difesa","resistenza","equilibrio"];
const TYPE_LABEL = {blade:"Lama", ratchet:"Ratchet", bit:"Punta", lockchip:"Lock chip", mainblade:"Main blade", assist:"Assist blade"};
const CX_TYPES = ["lockchip","mainblade","assist"];
const PERIOD_LABEL = {year:"ultimo anno", month:"ultimo mese", week:"ultima settimana", all:"tutto lo storico"};
const fallback = () => 5; // indice dei pezzi assenti dalla classifica
const normKey = s => String(s||"").toLowerCase().replace(/[^a-z0-9]/g,"");
// Errori di battitura frequenti nei dati della community
const TYPO = {supresssuperion:"suppresssuperion", aeropegaus:"aeropegasus", weedge:"wedge", points:"point", bulletgryphon:"bulletgriffin", bahamablitz:"bahamutblitz", rockgolem:"golemrock", freeball:"freeball"};
// Sigle delle punte usate al posto del nome nei dati della community (es. "B" = Ball)
Object.assign(TYPO, {b:"ball", fb:"freeball", lr:"lowrush", r:"rush", h:"hexa", k:"kick", e:"elevate", l:"level", lo:"loworb", o:"orb", j:"jolt", w:"wedge", p:"point", t:"taper", u:"unite", ra:"rubberaccel", un:"underneedle", gf:"gearflat", gr:"gearrush", ff:"freeflat", lf:"lowflat", ht:"hightaper", lt:"lowtaper", wb:"wallball", c:"cyclone"});
// Nomi Hasbro o italiani → nome usato nelle classifiche
const ALIAS = {gloryvalkirion:"Glory Valkyrie", gloryvalkerion:"Glory Valkyrie", soarphoenix:"Phoenix Wing", wyvernhover:"Hover Wyvern", hoverwyvern:"Hover Wyvern", circleghost:"Ghost Circle", wizardwand:"Wizard Rod", wandwizard:"Wizard Rod"};

// ---------- Stato ----------
let S = emptyState();
let loaded = false, readOnly = false;
let tab = "salvati";
let metaMsg = "", chMsg = "", chList = null;
let aiBusy = false, aiResult = null, aiError = "";
let form = null; // bozza del modulo torneo: {mode:"new"|"edit"|"import", ...}

function emptyState(){ return {v:1, parts:[], results:[], decks:[], meta:null, live:null, settings:{bitTypeLimit:false, personalWeight:50, challonge:"", slots:[{},{},{}]}} }
function normState(x){
  const s = Object.assign(emptyState(), x||{});
  s.settings = Object.assign(emptyState().settings, s.settings||{});
  s.parts = Array.isArray(s.parts)?s.parts:[]; s.results = Array.isArray(s.results)?s.results:[]; s.decks = Array.isArray(s.decks)?s.decks:[]; s.trainLog = Array.isArray(s.trainLog)?s.trainLog:[];
  if(!Array.isArray(s.settings.slots) || s.settings.slots.length!==3){ const lb=s.settings.lockBlades||[]; s.settings.slots=[0,1,2].map(i=>lb[i]?{blade:lb[i]}:{}) }
  delete s.settings.lockBlades; delete s.rev; // resti del vecchio sistema di sincronizzazione
  s.parts.forEach(autoCatalog); // tipo, rotazione e ratchet integrato dal catalogo
  if(s.meta && s.meta.unit!=="count") s.meta=null; // vecchie classifiche BBX Weekly: si torna ai dati MetaBeys
  return migrateRefs(s);
}
const uid = () => Math.random().toString(36).slice(2,10);
const esc = v => String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
// se il meta salvato è di una versione senza assist blade, uso quelle di partenza
// Unisce le voci che sono lo stesso pezzo scritto in modi diversi (sigla, errori di battitura): resta il nome più usato
function dedupeRows(rows){
  const m=new Map();
  for(const [n,c] of (rows||[])){ const k=canon(n); if(!k) continue; const o=m.get(k); if(o){ o.c+=c; if(c>o.best){ o.best=c; o.n=n } } else m.set(k,{n,c,best:c}) }
  return [...m.values()].sort((a,b)=>b.c-a.c).map(o=>[o.n,o.c]);
}
let metaCache={src:null,out:null};
const meta = () => {
  const m=S.meta||BUILTIN_META;
  if(metaCache.src===m) return metaCache.out;
  const out={...m}; for(const k of ["blade","ratchet","bit","assist"]) if(Array.isArray(out[k])) out[k]=dedupeRows(out[k]);
  if(!(out.assist&&out.assist.length)) out.assist=dedupeRows(BUILTIN_META.assist);
  metaCache={src:m,out}; return out;
};

// ---------- Salvataggio ----------
let db=null, docRef=null, timer=null, writing=false, again=false, dirtyAt=0;
const LS_KEY = "decklab-bbx-state";
function lsGet(){ try{ const t=localStorage.getItem(LS_KEY); return t?JSON.parse(t):null }catch(e){ return null } }
function lsSet(){ try{ localStorage.setItem(LS_KEY, JSON.stringify(S)) }catch(e){} }
function setSync(t){ document.getElementById("sync").textContent=t }

// ---------- Salvataggio con unione delle modifiche ----------
// Ogni pezzo, torneo e deck porta la data della sua ultima modifica (u): quando due copie si incontrano vince, voce per voce, la più recente.
let synced=null;
const LISTS=["parts","results","decks","trainLog"], SINGLES=["settings","meta","live","train"];
function snapshotMap(st){ const m=new Map(); for(const k of LISTS) (st[k]||[]).forEach(x=>m.set(k+":"+x.id, JSON.stringify({...x,u:undefined}))); for(const k of SINGLES) m.set(k, JSON.stringify(st[k]??null)); return m }
function stamp(){
  const now=Date.now(), cur=snapshotMap(S); S.uts=S.uts||{}; S.del=S.del||{};
  if(synced){
    // una modifica fatta qui vale sempre più della versione da cui parte, anche se l'orologio è indietro
    for(const k of LISTS) (S[k]||[]).forEach(x=>{ const key=k+":"+x.id; if(synced.get(key)!==cur.get(key)) x.u=Math.max(now,(+x.u||0)+1) });
    for(const k of SINGLES) if(synced.get(k)!==cur.get(k)) S.uts[k]=Math.max(now,(+S.uts[k]||0)+1);
    for(const key of synced.keys()) if(key.includes(":") && !cur.has(key)) S.del[key]=now;
  }
  synced=cur;
}
function mergeStates(a,b){ // a = copia online, b = copia di questa pagina
  a=a||{}; const del={...(a.del||{})}; for(const [k,v] of Object.entries(b.del||{})) del[k]=Math.max(del[k]||0,v);
  const out={...b};
  for(const k of LISTS){
    const m=new Map(), order=[];
    for(const x of (b[k]||[])){ m.set(x.id,x); order.push(x.id) }
    for(const x of (a[k]||[])){ const y=m.get(x.id); if(!y){ m.set(x.id,x); order.push(x.id) } else if((+x.u||0)>(+y.u||0)) m.set(x.id,x) }
    out[k]=order.map(id=>m.get(id)).filter(x=>!((del[k+":"+x.id]||0)>=(+x.u||0) && del[k+":"+x.id]));
  }
  const ua=a.uts||{}, ub=b.uts||{}; out.uts={};
  for(const k of SINGLES){ if((+ua[k]||0)>(+ub[k]||0)){ out[k]=a[k]; out.uts[k]=ua[k] } else { out[k]=b[k]; out.uts[k]=+ub[k]||0 } }
  const cut=Date.now()-60*864e5; out.del={}; for(const [k,v] of Object.entries(del)) if(v>cut) out.del[k]=v;
  return normState(JSON.parse(JSON.stringify(out)));
}
function save(){
  stamp(); lsSet(); dirtyAt = Date.now();
  if(!docRef || readOnly){ setSync(docRef?"sola lettura":"salvato su questo dispositivo"); return }
  setSync("modifiche in attesa…");
  clearTimeout(timer); timer=setTimeout(flush, 900);
}
async function flush(){
  if(writing){ again=true; return }
  writing=true;
  try{
    // prima di scrivere unisco quello che c'è online, così non cancello modifiche fatte altrove
    try{ const sn=await docRef.get(); if(sn.exists){ S=mergeStates(JSON.parse(JSON.stringify(sn.data().state)), S); synced=snapshotMap(S) } }catch(e){}
    await docRef.set({state:JSON.parse(JSON.stringify(S)), savedAt:new Date().toISOString()}); lsSet(); setSync("salvato");
  }catch(e){
    if(e && e.code==="invalid_argument"){ readOnly=true; setSync("sola lettura") }
    else if(e && e.code==="quota_exceeded"){ setSync("spazio esaurito") }
    else setSync("salvataggio non riuscito, riprovo alla prossima modifica");
  }
  writing=false;
  if(again){ again=false; flush() }
}
async function boot(){
  const hash = (location.hash||"").slice(1);
  if(["salvati","deck","allena","tornei","pezzi","meta"].includes(hash)) tab=hash;
  const local = lsGet(); if(local){ S=normState(local); loaded=true }
  synced=snapshotMap(S);
  render();
  if(!window.claude || !window.claude.use){ setSync(STANDALONE?"salvato sul telefono":(local?"salvato su questo dispositivo":"solo su questo dispositivo")); loaded=true; render(); autoMetaNative(); return }
  try{ db = await window.claude.use("db") }catch(e){ db=null }
  if(!db){ setSync("solo su questo dispositivo"); loaded=true; render(); return }
  docRef = db.doc("app/state");
  docRef.onSnapshot(snap=>{
    if(snap.metadata && snap.metadata.hasPendingWrites) return;
    if(snap.exists){
      // i dati arrivano congelati: ne faccio una copia modificabile e la unisco alla mia
      const inc = JSON.parse(JSON.stringify(snap.data().state));
      const merged = mergeStates(inc, S);
      const changed = JSON.stringify(merged)!==JSON.stringify(S), ahead = JSON.stringify(merged)!==JSON.stringify(normState(JSON.parse(JSON.stringify(inc)))) || inc.refs!==1; // refs: l'archivio ha ancora i nomi al posto degli id
      S = merged; synced=snapshotMap(S); lsSet(); setSync("sincronizzato");
      if(autoIntegrated()) save(); else if(ahead && !readOnly && !writing) flush();
      loaded=true;
      // non ridisegno mentre si sta scrivendo in un campo, per non perdere quello che si digita
      const a=document.activeElement; if(changed && !(a && /INPUT|TEXTAREA/.test(a.tagName) && a.type!=="checkbox")) render(); else if(!changed) {} 
      return;
    }
    setSync("archivio vuoto"); loaded=true; render();
  }, err=>{ setSync("sincronizzazione interrotta"); loaded=true; render() });
}



// ---------- Versione Android (APK) ----------
// Nell'APK non c'è Claude: niente chat né parere, ma il meta e Challonge si leggono direttamente (richieste native, senza i blocchi del browser).
const STANDALONE = !!window.DECKLAB_STANDALONE;
const MB_EVENTS = "https://beydecks-production.up.railway.app/api/events";
const NATIVE_PERIODS = [["d60","ultimi 60 giorni",60],["d90","ultimi 90 giorni",90],["d180","ultimi 6 mesi",180],["year","ultimo anno",365],["all","tutto lo storico",0]];
NATIVE_PERIODS.forEach(([k,l])=>{ PERIOD_LABEL[k]=l });
// Classifiche calcolate dai dati grezzi dei tornei MetaBeys: apparizioni in top cut per lama, ratchet, punta e combo
function metaFromEvents(events, days){
  const from = days ? new Date(Date.now()-days*864e5).toISOString().slice(0,16) : "";
  const ev = events.filter(e=>e && e.topCut && e.topCut.length && (!from || String(e.startTime||"")>=from));
  const disp=new Map(); const name=(k,s)=>{ if(!disp.has(k)) disp.set(k,String(s).trim()); return disp.get(k) };
  const cnt={blade:new Map(), ratchet:new Map(), bit:new Map(), assist:new Map()}, combos=new Map(); let total=0;
  const add=(m,k)=>m.set(k,(m.get(k)||0)+1);
  for(const e of ev) for(const pl of e.topCut) for(const c of (pl.combos||[])){
    if(!c || !c.blade) continue; total++;
    const kb=canon(c.blade), kr=canon(c.ratchet||"-"), kt=canon(c.bit||"");
    name("b:"+kb,c.blade); if(kr) name("r:"+kr,c.ratchet); if(kt) name("t:"+kt,c.bit);
    add(cnt.blade,kb); if(kr) add(cnt.ratchet,kr); if(kt) add(cnt.bit,kt);
    if(c.assistBlade){ const ka=canon(c.assistBlade); if(ka){ name("a:"+ka,c.assistBlade); add(cnt.assist,ka) } }
    if(kt) add(combos,[kb,kr,kt].join("|"));
  }
  const list=(m,p)=>[...m.entries()].sort((a,b)=>b[1]-a[1]).map(([k,n])=>[disp.get(p+":"+k)||k,n]);
  return {source:"MetaBeys", unit:"count", fetchedAt:new Date().toISOString(), appearances:total, events:ev.length,
    blade:list(cnt.blade,"b"), ratchet:list(cnt.ratchet,"r"), bit:list(cnt.bit,"t"), assist:list(cnt.assist,"a"),
    combos:[...combos.entries()].filter(([,n])=>n>=2).sort((a,b)=>b[1]-a[1]).map(([k,n])=>{ const [b,r,t]=k.split("|"); return [disp.get("b:"+b)||b, r?(disp.get("r:"+r)||r):"-", disp.get("t:"+t)||t, n] })};
}
async function updateMetaNative(){
  const sel=document.getElementById("mb-tf"); const k=(sel&&sel.value)||"d180"; const per=NATIVE_PERIODS.find(x=>x[0]===k)||NATIVE_PERIODS[2];
  aiBusy=true; metaMsg="Scarico i tornei da MetaBeys…"; render();
  try{
    const r=await fetch(MB_EVENTS); if(!r.ok) throw new Error("HTTP "+r.status);
    const events=await r.json(); if(!Array.isArray(events)) throw new Error("formato inatteso");
    const M=metaFromEvents(events, per[2]); M.period=per[0];
    if(M.blade.length<3) throw new Error(`pochi dati nel periodo scelto (${M.events} tornei)`);
    S.meta=M; rematchAll(); save();
    metaMsg=`Aggiornato: ${M.events} tornei, ${M.appearances} apparizioni in top cut (${per[1]}).`;
  }catch(e){ metaMsg="Aggiornamento non riuscito: "+(e&&e.message||"errore di rete")+". Controlla la connessione e riprova." }
  aiBusy=false; render();
}
let metaAuto=false;
// All'apertura dell'APK il meta si aggiorna da solo se ha più di 3 giorni
function autoMetaNative(){
  if(!STANDALONE || metaAuto) return; metaAuto=true;
  const M=S.meta; const age=M&&M.fetchedAt?(Date.now()-new Date(M.fetchedAt).getTime())/864e5:999;
  if(age>3) setTimeout(()=>{ if(!aiBusy) updateMetaNative() }, 1500);
}

// Challonge letto direttamente dall'APK
// Testo "visibile" di una pagina HTML: la monto nascosta per avere le righe come le vede il browser
function htmlLines(html){
  const box=document.createElement("div"); box.style.cssText="position:absolute;left:-99999px;top:0;width:1200px";
  box.innerHTML=String(html).replace(/<script[\s\S]*?<\/script>/gi,"").replace(/<style[\s\S]*?<\/style>/gi,"").replace(/<img[^>]*>/gi,"").replace(/<iframe[\s\S]*?<\/iframe>/gi,"");
  document.body.appendChild(box); const t=box.innerText; box.remove();
  const tm=String(html).match(/<title>([^<]*)<\/title>/i);
  return {lines:t.split(/\n/).map(s=>s.trim()).filter(Boolean), title:tm?tm[1].trim():""};
}
async function findMyTournamentsNative(){
  const u=S.settings.challonge; if(!u) return;
  aiBusy=true; chMsg="Cerco i tuoi tornei su Challonge…"; chList=null; render();
  try{
    const r=await fetch(`https://challonge.com/it/users/${encodeURIComponent(u.toLowerCase())}/tournaments`); if(!r.ok) throw new Error("HTTP "+r.status);
    const html=await r.text(); const out=[]; const seen=new Set();
    for(const m of html.matchAll(/<a[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi)){
      let href=m[1]; if(href.startsWith("/")) href="https://challonge.com"+href;
      const x=href.match(/^https?:\/\/(?:([a-z0-9-]+)\.)?challonge\.com\/(?:[a-z]{2}\/)?([A-Za-z0-9_]+)\/?$/); if(!x) continue;
      const sub=x[1]&&x[1]!=="www"?x[1]:""; if(sub==="kb") continue; if(CH_RESERVED.has(x[2].toLowerCase())) continue;
      const url=`https://${sub?sub+".":""}challonge.com/${x[2]}`; if(seen.has(url)) continue;
      const title=m[2].replace(/<[^>]+>/g,"").replace(/\s+/g," ").trim(); if(!title) continue;
      seen.add(url); out.push({url,title});
    }
    chList=out; chMsg=out.length?`Trovati ${out.length} tornei nel profilo.`:"Non ho trovato tornei nel profilo. Controlla il nome utente oppure incolla il link di un torneo.";
  }catch(e){ chMsg="Non riesco a raggiungere Challonge: "+(e&&e.message||"errore di rete")+"." }
  aiBusy=false; render();
}
async function importFromLinkNative(url){
  url=String(url||"").trim().replace(/[?#].*$/,"").replace(/\/$/,"").replace(/\/standings$/,"");
  if(!/^https?:\/\/([a-z0-9-]+\.)?challonge\.com\//i.test(url)){ chMsg="Il link deve essere di challonge.com."; render(); return }
  aiBusy=true; chMsg="Leggo la classifica del torneo…"; render();
  try{
    const r=await fetch(url+"/standings"); if(!r.ok) throw new Error("HTTP "+r.status);
    const {lines,title}=htmlLines(await r.text());
    const P=parseStandingsLines(lines, S.settings.challonge, title);
    if(!standingsToForm(P,url)) chMsg=`Ho letto il torneo, ma non trovo “${S.settings.challonge||"il tuo nome"}” tra i partecipanti. Controlla il nome utente Challonge.`;
  }catch(e){ chMsg="Non riesco a leggere il torneo: "+(e&&e.message||"errore di rete")+"." }
  aiBusy=false; render(); window.scrollTo({top:0});
}

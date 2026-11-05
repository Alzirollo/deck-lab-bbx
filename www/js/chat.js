// Claude: parere sul deck e conversazione
// ---------- Claude: funzioni comuni ----------
async function getSample(){ if(!window.claude||!window.claude.use) return null; try{ return await window.claude.use("sample") }catch(e){ return null } }
function aiErr(e){
  const c=e&&e.code;
  if(c==="not_granted"||c==="sampling_disabled"||c==="capability_disabled"||c==="not_declared") return "Claude non è disponibile in questa vista. Puoi comunque usare il deck calcolato qui sopra.";
  if(c==="rate_limited") return "Troppe richieste ravvicinate. Riprova tra qualche minuto.";
  if(c==="invalid_json") return "La risposta non era leggibile. Riprova.";
  if(c==="cancelled") return "";
  return "Richiesta non riuscita. Riprova.";
}

// Tutto quello che Claude deve sapere: formato, collezione, meta, risultati, deck mostrato
function buildContext(res){
  const sc=res.sc;
  const coll=S.parts.map(p=>({categoria:TYPE_LABEL[p.type],nome:p.name,sigla:p.code||undefined,nome_meta:p.metaName||"fuori classifica",tipo:p.kind||undefined,quantita:+p.qty||0,evitare:!!p.avoid,ratchet_integrato:p.type==="blade"?!!p.integrated:undefined,rotazione_sinistra:p.type==="blade"?!!p.left:undefined,note:p.note||undefined,indice:Math.round(sc(p).total)}));
  const results=S.results.slice(-15).map(r=>({data:r.date,evento:r.event,posizione:placeText(r),partecipanti:r.players,note:r.notes,deck_usati:phasesOf(r).map(ph=>({fase:ph.label,combo:(ph.combos||[]).map(comboNames).filter(Boolean),vinti:+ph.wins||0,persi:+ph.losses||0}))}));
  const ownedBlades=new Set(S.parts.filter(p=>p.type==="blade"&&p.metaName).map(p=>canon(p.metaName)));
  const metaCombos=(meta().combos||[]).filter(([b])=>ownedBlades.has(canon(b))).slice(0,40);
  const locked=slotsOf().map((x,i)=>["blade","ratchet","bit"].map(k=>x&&x[k]).filter(Boolean).map(id=>S.parts.find(p=>p.id===id)).filter(Boolean).map(p=>`trottola ${i+1}: ${p.name}`)).flat();
  const shown=res.decks[viewIdx]?res.decks[viewIdx].combos.map((c,i)=>`trottola ${i+1}: ${c.b.name} ${c.r.id==="int"?"(ratchet integrato)":c.r.name} ${c.t.code||c.t.name}`):[];
  const M=meta();
  return `Sei un giocatore competitivo esperto di Beyblade X e aiuti Andrea a preparare i tornei.

Formato: 3 trottole, ogni pezzo (lama, ratchet, punta) può comparire una sola volta nel deck. Gironi a 4 punti, eliminazione diretta a 7 punti. L'ordine delle 3 trottole va dichiarato all'arbitro prima del round, ogni tre lanci si rimescola, tra un match e l'altro si possono cambiare trottole.${S.settings.bitTypeLimit?" Regola extra del torneo: al massimo una punta per tipo (attacco, difesa, resistenza, equilibrio).":""}
Ha lanciatori a cordicella sia destrorso sia sinistrorso. Non ha un'arena per allenarsi.

LAME CX MONTABILI (lock chip + main blade + assist blade; nel deck ogni pezzo CX si usa una volta sola): ${(()=>{ const x=cxBlades(true); return x.length?x.map(b=>b.name+(b.metaName?` (nei tornei: ${b.metaName})`:"")).join("; "):"nessuna" })()}
COLLEZIONE (usa solo questi pezzi, mai quelli con evitare=true; le lame con ratchet_integrato=true non prendono un ratchet):
${JSON.stringify(coll)}

META (${M.source}, ${PERIOD_LABEL[M.period]||M.period}: numero di apparizioni in top cut, soprattutto tornei in Nord America):
lame ${JSON.stringify(M.blade)}
ratchet ${JSON.stringify(M.ratchet)}
punte ${JSON.stringify(M.bit)}
combo del meta con le lame che possiede [lama, ratchet, punta, apparizioni]: ${metaCombos.length?JSON.stringify(metaCombos):"nessun dato"}
Conta come le lame vengono abbinate nel meta, non solo quanto è forte ogni pezzo da solo: per esempio Cobalt Dragoon rende quasi solo con Elevate.
${locked.length?`Pezzi fissati a mano: ${locked.join("; ")}.`:"Nessun pezzo fissato a mano."}

RISULTATI RECENTI: ${results.length?JSON.stringify(results):"nessuno registrato"}
ALLENAMENTI (scontri diretti, A è sempre una combo di Andrea; arena "hasbro" = arena Hasbro, poco affidabile e quasi inutile per giudicare le combo di difesa): ${(()=>{ const g=new Map(); (S.trainLog||[]).forEach(e=>{ const k=comboKey({...e.a,mine:true})+"#"+comboKey(e.b)+"#"+e.arena; const o=g.get(k)||{A:comboLabel(e.a),B:(e.b.mine===false?"avversario: ":"")+comboLabel(e.b),arena:e.arena,vinte_A:0,vinte_B:0}; if(e.side==="a") o.vinte_A++; else if(e.side==="b") o.vinte_B++; g.set(k,o) }); const a=[...g.values()].slice(-25); return a.length?JSON.stringify(a):"nessuno" })()}

Deck mostrato ora nell'app: ${shown.join("; ")}.`;
}
async function askAI(){
  const res=buildDecks(); if(res.error) return;
  const sample=await getSample(); if(!sample){ aiError="Claude non è disponibile in questa vista."; render(); return }
  aiBusy=true; aiError=""; aiResult=null; chat=[]; render();
  const prompt=buildContext(res)+`

Valuta se il deck mostrato è la scelta migliore, considerando gli accoppiamenti tra lama, ratchet e punta e la copertura contro attacco, difesa e resistenza. Scrivi in italiano, in modo diretto, senza trattini lunghi. Rispondi solo con JSON:
{"deck":[{"lama":string,"ratchet":string,"punta":string,"ruolo":string,"motivo":string}],"ordine":string,"consigli":[string],"acquisti":[string]}
Per "punta" usa la sigla della collezione; per una lama con ratchet integrato scrivi "integrato" come ratchet. "acquisti": al massimo 3 pezzi da comprare che alzerebbero di più il livello del deck, con il perché.`;
  try{ aiResult=await sample.json(prompt,{modelTier:"default"}) }catch(e){ aiError=aiErr(e) }
  aiBusy=false; render();
}

// ---------- Conversazione con Claude ----------
let chat=[];            // [{role:"user"|"assistant", content}]
let chatBusy=false, chatLive="", chatCtl=null, chatErr="", chatDraft="";
const CHAT_RULES=`Rispondi in italiano, in modo breve e concreto, come in una chat: frasi semplici, al massimo un elenco corto se serve. Niente tabelle, niente trattini lunghi, niente formule del tipo "non X, ma Y". Se proponi pezzi, usa solo quelli della collezione e i loro nomi; se un pezzo manca, dillo chiaramente.
Se Andrea ti chiede di cambiare il deck nell'app, usa lo strumento fissa_pezzi (e sblocca_tutto per ripartire da zero): l'app ricalcola il resto del deck da sola. Poi usa leggi_deck per vedere il risultato e raccontaglielo.`;
function findPart(type, q){
  q=String(q||"").trim().toLowerCase(); if(!q) return null;
  const list=choicesOf(type,true);
  return list.find(p=>[p.name,p.code,p.metaName].some(v=>v&&v.toLowerCase()===q)) || list.find(p=>[p.name,p.metaName].some(v=>v&&v.toLowerCase().includes(q))) || null;
}
const CHAT_TOOLS=[
  {name:"leggi_deck", description:"Restituisce il deck mostrato ora nell'app, trottola per trottola, con i pezzi fissati e l'indice.",
   execute(){ const r=buildDecks(); if(r.error) return {errore:"nessun deck valido con i vincoli attuali"}; const d=r.decks[viewIdx]; const sl=slotsOf();
     return {indice:+d.score.toFixed(1), trottole:d.combos.map((c,i)=>({trottola:i+1, lama:c.b.name, ratchet:c.r.id==="int"?"integrato":c.r.name, punta:c.t.code||c.t.name, fissati:Object.keys(sl[i]||{}), note:c.why}))} }},
  {name:"fissa_pezzi", description:"Fissa uno o più pezzi in una trottola (1, 2 o 3) del deck nell'app; i pezzi non fissati vengono ricalcolati. Usa i nomi della collezione. Restituisce il nuovo deck.",
   inputSchema:{type:"object", properties:{trottola:{type:"integer", minimum:1, maximum:3}, lama:{type:"string"}, ratchet:{type:"string"}, punta:{type:"string"}}, required:["trottola"]},
   execute(input){
     const i=Math.round(+input.trottola)-1; if(!(i>=0&&i<3)) throw new Error("trottola deve essere 1, 2 o 3");
     const sl=slotsOf().map(x=>({...(x||{})}));
     for(const [k,type] of [["lama","blade"],["ratchet","ratchet"],["punta","bit"]]){
       if(input[k]==null || input[k]==="") continue;
       const p=findPart(type,input[k]); if(!p) throw new Error(`${input[k]} non è nella collezione`);
       if(p.avoid) throw new Error(`${p.name} è segnato come da non usare`);
       sl.forEach((x,j)=>{ if(j!==i && x[type]===p.id) delete x[type] }); sl[i][type]=p.id;
       if(type==="blade" && p.integrated) delete sl[i].ratchet;
     }
     S.settings.slots=sl; viewIdx=0; aiResult=null; save(); render();
     return CHAT_TOOLS[0].execute();
   }},
  {name:"sblocca_tutto", description:"Toglie tutti i pezzi fissati, così l'app torna alla proposta migliore. Restituisce il nuovo deck.",
   execute(){ S.settings.slots=[{},{},{}]; viewIdx=0; save(); render(); return CHAT_TOOLS[0].execute() }}
];
async function sendChat(){
  const box=document.getElementById("ai-q"); const q=(box&&box.value||"").trim(); if(!q||chatBusy) return;
  const res=buildDecks(); if(res.error){ chatErr="Prima serve un deck valido."; render(); return }
  const sample=await getSample(); if(!sample){ chatErr="Claude non è disponibile in questa vista."; render(); return }
  chatDraft=""; chat.push({role:"user", content:q}); chat=chat.slice(-14); if(chat[0].role!=="user") chat.shift();
  chatBusy=true; chatLive=""; chatErr=""; render();
  const first=buildContext(res)+"\n\n"+CHAT_RULES+(aiResult?`\n\nIl tuo parere precedente su questo deck era: ${JSON.stringify(aiResult)}`:"");
  chatCtl=new AbortController();
  const lim=await sample.limits().catch(()=>null);
  const opts={cache:false, signal:chatCtl.signal, onText:({text})=>{ chatLive=text; const el=document.getElementById("chat-live"); if(el) el.innerHTML=fmt(text) }};
  if(lim && lim.tools) opts.tools=CHAT_TOOLS.map(t=>({...t})).map(t=>{ if(!t.inputSchema) delete t.inputSchema; return t });
  if(opts.tools) delete opts.cache;
  try{
    const {text}=await sample([{role:"user",content:first}, ...chat], opts);
    chat.push({role:"assistant", content:text});
  }catch(e){
    if(e && e.text) chat.push({role:"assistant", content:e.text});
    if(!(e && e.code==="cancelled")) chatErr=aiErr(e)||"Risposta interrotta.";
  }
  chatBusy=false; chatLive=""; chatCtl=null; render();
  const nb=document.getElementById("ai-q"); if(nb) nb.focus();
}
const fmt = t => esc(t).replace(/\*\*(.+?)\*\*/g,"<b>$1</b>").replace(/\n/g,"<br>");
function chatView(){
  return `<div class="ai-out" id="chat">
    <h3>Parla con Claude</h3>
    ${chat.length?`<div class="stack">${chat.map(m=>`<div class="msg ${m.role}"><span class="small muted">${m.role==="user"?"Tu":"Claude"}</span><div>${fmt(m.content)}</div></div>`).join("")}</div>`:`<p class="small muted">Chiedi spiegazioni sul deck, alternative o cosa comprare. Se gli chiedi di cambiare un pezzo, Claude lo fissa nel deck qui sopra.</p>`}
    ${chatBusy?`<div class="msg assistant"><span class="small muted">Claude</span><div id="chat-live">${chatLive?fmt(chatLive):"Sto pensando…"}</div></div>`:""}
    ${chatErr?`<p class="note">${esc(chatErr)}</p>`:""}
    <form id="chat-form" class="stack">
      <textarea id="ai-q" placeholder="es. perché Wand Wizard con la Point? Metti Cobalt Dragoon nella trottola 2" style="min-height:70px;font-family:var(--f-body);font-size:14px">${esc(chatDraft)}</textarea>
      <div class="row"><button class="btn primary" type="submit" ${chatBusy?"disabled":""}>Invia</button>${chatBusy?`<button class="btn" type="button" data-act="chat-stop">Ferma</button>`:""}${chat.length&&!chatBusy?`<button class="btn ghost" type="button" data-act="chat-clear">Nuova conversazione</button>`:""}</div>
    </form>
  </div>`;
}

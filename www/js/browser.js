// ---------- Browser dell'app Claude (MetaBeys, Challonge) ----------
const BR="host:claude_browser";
const MB="https://www.metabeys.com/leaderboard";
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
let browserTab=null;
async function getMcp(){ if(!window.claude||!window.claude.use) return null; try{ return await window.claude.use("mcp") }catch(e){ return null } }
const resText = r => { const t=(r&&r.content||[]).filter(c=>c&&c.type==="text").map(c=>c.text).join("\n"); return t || (typeof (r&&r.payload)==="string" ? r.payload : "") };
async function openUrl(mcp,url){
  if(browserTab){ try{ await mcp.callTool(BR,"navigate",{url,tabId:browserTab},{cache:false}); return }catch(e){ if(e&&e.code!=="tool_error") throw e; browserTab=null } }
  const r=await mcp.callTool(BR,"preview_start",{url},{cache:false});
  const m=resText(r).match(/tabId\s+([^\s)]+)\)/); browserTab=m?m[1]:null;
}
async function pageText(mcp, ready){
  let t="";
  for(let i=0;i<6;i++){
    await sleep(i?1500:1000);
    const r=await mcp.callTool(BR,"get_page_text",browserTab?{tabId:browserTab,max_chars:60000}:{max_chars:60000},{cache:false});
    t=resText(r); if(!ready||ready(t)) return t;
  }
  return t;
}
let browserDenied=false;
// Chiede in modo esplicito il permesso di usare il browser dell'app Claude; "denied" se è stato rifiutato in modo permanente
async function ensureBrowser(){
  let perm=null; try{ perm=await window.claude.use("permissions") }catch(e){}
  if(!perm) return "ok";
  const N="mcp:"+BR; let st=await perm.state(N).catch(()=>"unavailable");
  if(st==="prompt"){ const r=await perm.request([N]).catch(()=>({})); st=r[N]||st }
  browserDenied = st==="denied";
  return st;
}
function browserErr(e, where){
  const c=e&&e.code; const code=c&&c!=="parse"?` (codice: ${c})`:"";
  if(c==="parse") return `La pagina di ${where} è cambiata e non riesco a leggerla. Usa l'opzione “incollando il testo”.`;
  if(c==="denied") return "L'accesso al browser per questa app è stato rifiutato in precedenza. Riattivalo con il pulsante “Permessi” qui sotto, poi riprova.";
  if(c==="server_not_connected"||c==="capability_disabled"||c==="not_granted") return "La lettura automatica funziona solo aprendo l'app dentro l'app Claude per Mac, con l'app aperta e collegata. Qui puoi incollare il testo della pagina."+code;
  if(c==="not_in_manifest"){ browserDenied=true; return "Il permesso di usare il browser non è attivo per questa app. Riattivalo con il pulsante “Permessi” qui sotto, poi riprova."+code }
  if(c==="approval_required") return "Serve la tua approvazione per usare il browser: riprova e premi “Consenti” nella finestra che compare."+code;
  if(c==="cancelled") return "La richiesta di aprire la pagina è stata annullata o è scaduta. Riprova e premi “Consenti” nella finestra che compare nell'app Claude."+code;
  if(c==="tool_error"){ const m=String(e.message||""); if(/allow|consent|permess|approv|not allowed/i.test(m)) return `Il browser chiede il permesso per questo sito (${where}). Riprova e approvalo quando compare la richiesta.`+code; return `Il browser non ha aperto la pagina: ${m.slice(0,200)}` }
  if(c==="server_unavailable"||c==="upstream_error") return "Il browser non ha risposto. Controlla che l'app Claude sul Mac sia aperta e riprova."+code;
  return "Lettura non riuscita. Riprova."+code;
}
function parseLeaderboard(t){
  const L=t.split(/\r?\n/).map(s=>s.trim()).filter(Boolean);
  let i=L.findIndex(l=>/^#\s*Item/i.test(l)); if(i<0) return {rows:[],total:null};
  const k=L.findIndex(l=>/^Top-cut appearances$/i.test(l)); const total=k>0?parseInt(L[k-1],10)||null:null;
  const rows=[];
  for(i=i+1;i<L.length-2;i++){
    if(/^Showing/i.test(L[i])) break;
    if(/^\d+$/.test(L[i]) && !/^\d+$/.test(L[i+1]) && /^\d+$/.test(L[i+2])){ rows.push([L[i+1], +L[i+2]]); i+=2 }
  }
  return {rows,total};
}
// Classifica combo: rango, lama, "ratchet • punta", apparizioni
function parseComboBoard(t){
  const L=t.split(/\r?\n/).map(s=>s.trim()).filter(Boolean);
  let i=L.findIndex(l=>/^#\s*Item/i.test(l)); if(i<0) return [];
  const rows=[];
  for(i=i+1;i<L.length-3;i++){
    if(/^Showing/i.test(L[i])) break;
    const m=L[i+2].match(/^(.*?)\s*•\s*(.+)$/);
    if(/^\d+$/.test(L[i]) && m && /^\d+$/.test(L[i+3])){ rows.push([L[i+1], m[1].trim()||"-", m[2].trim(), +L[i+3]]); i+=3 }
  }
  const acc=new Map();
  for(const [b,r,p,n] of rows){ const k=[canon(b),canon(r),canon(p)].join("|"); const o=acc.get(k); if(o) o[3]+=n; else acc.set(k,[b,r,p,n]) }
  return [...acc.values()].sort((a,b)=>b[3]-a[3]);
}
function mergeRows(rows){
  const m=new Map();
  for(const [n,c] of rows){ let k=normKey(n); k=TYPO[k]||k; if(!k) continue; const o=m.get(k); if(o){ o.c+=c; if(c>o.best){ o.best=c; o.n=n } } else m.set(k,{n,c,best:c}) }
  return [...m.values()].sort((a,b)=>b.c-a.c).map(o=>[o.n,o.c]);
}
async function updateFromMetaBeys(){
  const tf=(document.getElementById("mb-tf")||{}).value||"year";
  const mcp=await getMcp(); if(!mcp){ metaMsg=browserErr({code:"server_not_connected"}); render(); return }
  if(await ensureBrowser()==="denied"){ metaMsg=browserErr({code:"denied"}); render(); return }
  aiBusy=true; metaMsg="Apro MetaBeys…"; render();
  try{
    const out={}; let total=null;
    for(const [k,label] of [["blade","lame"],["ratchet","ratchet"],["bit","punte"],["assist","assist blade"]]){
      metaMsg=`Leggo la classifica ${label}…`; render();
      await openUrl(mcp,`${MB}?kind=${k}&tf=${tf}`);
      const t=await pageText(mcp, x=>x.includes("kind="+k) && parseLeaderboard(x).rows.length>2);
      const p=parseLeaderboard(t); if(p.rows.length<2) throw {code:"parse"};
      out[k]=mergeRows(p.rows); total=p.total||total;
    }
    metaMsg="Leggo le combo più usate…"; render();
    await openUrl(mcp,`${MB}?kind=combo&tf=${tf}`);
    const ct=await pageText(mcp, x=>x.includes("kind=combo") && parseComboBoard(x).length>2);
    let combos=parseComboBoard(ct);
    // La pagina mostra solo le prime 50 combo: per l'anno tengo l'elenco completo di partenza se è più ricco
    if(tf==="year" && combos.length < BUILTIN_META.combos.length/2) combos=BUILTIN_META.combos;
    S.meta={source:"MetaBeys", unit:"count", period:tf, fetchedAt:new Date().toISOString(), appearances:total, ...out, combos};
    rematchAll(); save();
    metaMsg=`Aggiornato: ${out.blade.length} lame, ${out.ratchet.length} ratchet, ${out.bit.length} punte, ${combos.length} combo (${PERIOD_LABEL[tf]}).`;
  }catch(e){ metaMsg=browserErr(e,"MetaBeys") }
  aiBusy=false; render();
}
const CH_RESERVED=new Set(["users","user_session","pricing","search","communities","news","tournaments","events","organizers","settings","dashboard","api","about","contact","privacy","terms","login","signup","bracket_generator","partners","knowledge_base","organized_play","organizedplay","translate","terms_of_service","privacy_policy","comment_threads","tournament","games","it","en","de","es","fr","nl","pl","pt","ro"]);
function challongeLinks(tree){
  const out=[]; const seen=new Set(); const re=/link(?: "([^"]*)")? \[ref_\d+\] href="([^"]+)"/g; let m;
  while((m=re.exec(tree))){
    let href=m[2]; if(href.startsWith("/")) href="https://challonge.com"+href;
    const u=href.match(/^https?:\/\/(?:([a-z0-9-]+)\.)?challonge\.com\/(?:[a-z]{2}\/)?([A-Za-z0-9_]+)\/?$/); if(!u) continue;
    const sub=u[1]&&u[1]!=="www"?u[1]:""; const slug=u[2];
    if(CH_RESERVED.has(slug.toLowerCase())) continue;
    const url=`https://${sub?sub+".":""}challonge.com/${slug}`; if(seen.has(url)) continue; seen.add(url);
    out.push({url,title:(m[1]||"").trim()});
  }
  return out;
}
async function findMyTournaments(){
  const u=S.settings.challonge; if(!u) return;
  const mcp=await getMcp(); if(!mcp){ chMsg=browserErr({code:"server_not_connected"}); render(); return }
  if(await ensureBrowser()==="denied"){ chMsg=browserErr({code:"denied"}); render(); return }
  aiBusy=true; chMsg="Apro il tuo profilo Challonge…"; chList=null; render();
  try{
    await openUrl(mcp,`https://challonge.com/it/users/${encodeURIComponent(u.toLowerCase())}/tournaments`);
    await pageText(mcp, x=>x.length>400);
    const r=await mcp.callTool(BR,"read_page",browserTab?{tabId:browserTab,max_chars:120000}:{max_chars:120000},{cache:false});
    chList=challongeLinks(resText(r));
    chMsg=chList.length?`Trovati ${chList.length} tornei nel profilo.`:"Non ho trovato tornei nel profilo. Controlla il nome utente oppure incolla il link di un torneo.";
  }catch(e){ chMsg=browserErr(e,"Challonge") }
  aiBusy=false; render();
}
async function importFromLink(url){
  url=String(url||"").trim().replace(/[?#].*$/,"").replace(/\/$/,"");
  if(!/^https?:\/\/([a-z0-9-]+\.)?challonge\.com\//i.test(url)){ chMsg="Il link deve essere di challonge.com."; render(); return }
  const mcp=await getMcp(); if(!mcp){ chMsg=browserErr({code:"server_not_connected"}); render(); return }
  if(await ensureBrowser()==="denied"){ chMsg=browserErr({code:"denied"}); render(); return }
  aiBusy=true; chMsg="Apro il torneo…"; render();
  let txt="";
  try{
    await openUrl(mcp,url); const a=await pageText(mcp, x=>x.length>600);
    chMsg="Leggo la classifica finale…"; render();
    await openUrl(mcp,url+"/standings"); const b=await pageText(mcp, x=>x.length>600);
    txt=`PAGINA DEL TABELLONE:\n${a.slice(0,30000)}\n\nCLASSIFICA FINALE:\n${b.slice(0,25000)}`;
    const tl=(b.match(/^Title:\s*(.*)$/m)||[])[1]||"";
    const P=parseStandingsLines(b.split(/\n/).map(x=>x.trim()).filter(Boolean), S.settings.challonge, tl);
    if(standingsToForm(P,url)){ aiBusy=false; render(); window.scrollTo({top:0}); return }
  }catch(e){ aiBusy=false; chMsg=browserErr(e,"Challonge"); render(); return }
  aiBusy=false;
  await importChallonge(txt, url);
}

async function importChallonge(pasted, link){
  const txt=(pasted!=null?pasted:(document.getElementById("ch-paste").value||"")).trim();
  if(!txt){ chMsg="Incolla prima il testo del torneo."; render(); return }
  const sample=await getSample(); if(!sample){ chMsg="Claude non è disponibile in questa vista. Inserisci il torneo a mano qui sotto."; render(); return }
  aiBusy=true; chMsg="Claude sta leggendo il torneo…"; render();
  const user=S.settings.challonge||"";
  try{
    const r=await sample.json(`Il testo seguente è copiato da una pagina di un torneo Beyblade X su Challonge. Il giocatore che mi interessa ha nome utente o nome visualizzato "${user||"(sconosciuto, deducilo se il testo lo indica, altrimenti lascia vuoti gli incontri)"}". Estrai i suoi dati. Il torneo può avere una fase a gironi seguita da eliminazione diretta: conta le vittorie e le sconfitte di entrambe le fasi. "place" è il piazzamento finale nella fase finale; se il giocatore non è passato ai gironi finali usa null. Rispondi solo con JSON: {"event":string,"date":"YYYY-MM-DD"|null,"place":number|null,"players":number|null,"wins":number,"losses":number,"group":string|null,"group_rank":number|null,"matches":[{"opp":string,"won":boolean,"score":"x-y"}]}. Metti in "matches" solo gli incontri di cui il testo indica l'avversario, con il punteggio dal punto di vista del giocatore; altrimenti lascia la lista vuota.\n\nTESTO:\n${txt.slice(0,60000)}`,{modelTier:"quick"});
    const ms=Array.isArray(r.matches)?r.matches.map(m=>({opp:String(m.opp||"?"),won:!!m.won,score:String(m.score||"")})):[];
    const W=Number.isFinite(+r.wins)?+r.wins:ms.filter(m=>m.won).length, L=Number.isFinite(+r.losses)?+r.losses:ms.filter(m=>!m.won).length;
    // Se gli incontri con avversario non coprono tutto il torneo, si tengono i totali
    const useMatches = ms.length && ms.length===W+L;
    // Tengo il deck già inserito nel modulo (per esempio da “Usa nel torneo”)
    syncFormTop();
    const keep=form && form.mode!=="edit" ? form.phases : null;
    const phases = keep && keep.some(p=>(p.combos||[]).some(c=>c&&c.blade)) ? keep.map(p=>({...p, combos:p.combos.map(c=>({...c}))})) : [blankPhase()];
    if(phases.length===1){ phases[0].wins=W; phases[0].losses=L }
    form={mode:"import", link:link||"", date:r.date||new Date().toISOString().slice(0,10), event:r.event||"", place:r.place||"", players:r.players||"",
      notes:r.group?`Girone ${r.group}${r.group_rank?`, ${r.group_rank}°`:""}`:"", matches:useMatches?ms:[], phases};
    chMsg=(W+L)?`Torneo letto: ${W} vittorie e ${L} sconfitte.${phases.length>1?" Dividile tra i deck che hai usato.":""} Controlla il modulo qui sopra e registra.`:"Torneo letto, ma non ho trovato i tuoi incontri: controlla il nome utente Challonge o inseriscili a mano.";
    aiBusy=false; render(); window.scrollTo({top:0});
  }catch(e){ aiBusy=false; chMsg=aiErr(e)||"Annullato."; render() }
}

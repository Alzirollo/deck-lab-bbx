// Scheda ALLENAMENTO
function foldHead(key,title,count){ const shut=!!fold[key]; return `<button type="button" data-act="fold" data-key="${key}" aria-expanded="${!shut}" style="all:unset;box-sizing:border-box;display:flex;justify-content:space-between;align-items:center;width:100%;cursor:pointer"><h3>${title} <span class="chip">${count}</span></h3><span class="mono">${shut?"▾":"▴"}</span></button>` }
// ---------- Allenamento ----------
// S.train.cur = {a:{blade,ratchet,bit}, b:{mine, blade, ratchet, bit}, arena, sid}; S.trainLog = [{id,t,a,b,arena,side,f,pts,sid}]
// sid = sessione: il punteggio in alto conta solo gli scontri della sessione corrente.
// Una sessione nuova (0-0) parte quando cambi un pezzo, l'arena o l'avversario, e quando rigiochi una sfida passata.
const ARENAS=[["torneo","Arena da torneo"],["hasbro","Arena Hasbro"]];
// Quanto conta uno scontro di allenamento nell'indice, rispetto a uno di torneo (che vale 1)
const TRAIN_WEIGHT={torneo:0.6, hasbro:0.2};
const SOLO_FIRST_WIN=1.25, SOLO_SECOND_WIN=0.75; // vittoria di chi è partito per primo / per secondo
// Sull'arena Hasbro le combo di difesa valgono quasi zero: lì non si comportano come in torneo
function trainWeight(arena, c, mineVsMine){
  return trainWeightBase(arena,c) * (mineVsMine ? 0.5 : 1); // tra due combo mie si impara meno che contro un avversario
}
function trainWeightBase(arena, c){
  if(arena!=="hasbro") return TRAIN_WEIGHT[arena]||0.6;
  const t=ref("bit",c&&c.bit);
  return t&&t.kind==="difesa" ? 0.03 : TRAIN_WEIGHT.hasbro; // il tipo della combo lo dà la punta
}
function trainCur(){ if(!S.train||!S.train.cur) S.train={cur:{a:{}, b:{mine:true}, arena:"torneo"}}; const c=S.train.cur; if(!c.sid) c.sid=uid(); return c }
const newSession = c => { c.sid=uid() };
const comboKey = x => [x&&x.mine===false?"o":"m", (x&&x.blade)||"?", (x&&x.ratchet)||"?", (x&&x.bit)||"?"].join("|");
const comboLabel = (x,mine) => { if(mine===false){ const p=[x.blade,x.ratchet,x.bit].filter(Boolean); return p.length?p.join(" "):"avversario sconosciuto" } return [x.blade?nm("blade",x.blade):"?", x.ratchet?nm("ratchet",x.ratchet):(x.blade&&isIntegrated(x.blade)?"integrato":"?"), x.bit?bitShort(x.bit):"?"].join(" ") };
function trainTally(list){ return list.reduce((t,e)=>{ if(e.side==="a"){ t.a++; t.pa+=e.pts } else if(e.side==="b"){ t.b++; t.pb+=e.pts } else t.d++; t.f[e.side+":"+e.f]=(t.f[e.side+":"+e.f]||0)+1; return t },{a:0,b:0,d:0,pa:0,pb:0,f:{}}) }
let trainShowAll=false;
function vTrain(){
  const c=trainCur(); const log=S.trainLog||[];
  const mineSel=(side,x)=>["blade","ratchet","bit"].map(type=>{
    const list=choicesOf(type,true).filter(p=>(+p.qty||0)>0);
    const v=x[type]?refId(type,x[type]):"";
    if(type==="ratchet" && x.blade && isIntegrated(x.blade)) return `<span class="chip">ratchet integrato</span>`;
    return `<select data-tr="${side}" data-cf="${type}" aria-label="${TYPE_LABEL[type]}"><option value="">${TYPE_LABEL[type]}</option>${list.map(p=>{const val=p.id; return `<option value="${esc(val)}" ${val===v?"selected":""}>${esc(type==="bit"?bitLabel(p):p.name)}${p.avoid?" (da evitare)":""}</option>`}).join("")}</select>`;
  }).join("");
  const oppInp=x=>["blade","ratchet","bit"].map(type=>`<input data-tr="b" data-cf="${type}" data-ac="${type}" autocomplete="off" value="${esc(x[type]||"")}" placeholder="${TYPE_LABEL[type]} (se la sai)" aria-label="${TYPE_LABEL[type]} avversaria" style="flex:1;min-width:120px">`).join("");
  const names=type=>[...new Set([...(meta()[type]||[]).map(r=>r[0]), ...S.parts.filter(p=>p.type===type).map(p=>p.name)])];

  const ready=c.a.blade && (c.b.mine===false || c.b.blade);
  // scontri della sessione; se hai scambiato A e B, i lati si leggono al contrario
  const flipS=x=>x==="a"?"b":x==="b"?"a":x;
  const cur=log.filter(e=>e.sid===c.sid).map(e=>comboKey({...e.a,mine:true})===comboKey({...c.a,mine:true})?e:{...e, side:flipS(e.side), ...(e.first?{first:flipS(e.first)}:{})});
  const T=trainTally(cur);
  const lab=(x,mine)=>x.blade?esc(comboLabel(x,mine)):(mine===false?"Avversario":"—");
  const nameA=nm("blade",c.a.blade)||"Combo A", nameB=(c.b.mine===false?c.b.blade:nm("blade",c.b.blade))||(c.b.mine===false?"Avversario":"Combo B");
  const finBtns=side=>FINISH.map(([f,l,p])=>`<button class="btn ${side==="a"?"primary":""}" data-act="tr-pt" data-side="${side}" data-f="${f}" ${ready?"":"disabled"} style="flex:1;min-width:64px;justify-content:center;padding-block:12px">${l} +${p}</button>`).join("");
  // tutte le sfide registrate, raggruppate
  const groups=new Map(); log.forEach(e=>{ const k=comboKey({...e.a,mine:true})+"#"+comboKey(e.b)+"#"+e.arena; const g=groups.get(k)||{e,list:[]}; g.list.push(e); groups.set(k,g) });
  const gl=[...groups.values()].sort((x,y)=>y.list[y.list.length-1].t-x.list[x.list.length-1].t);
  return `<section class="panel">
    <h2>Allenamento</h2>
    <p class="muted">Scegli le due combo e l'arena: restano fissate finché non le cambi. Ogni scontro conta nell'indice del Builder meno di un torneo, e tra due combo tue conta la metà che contro un avversario. Sull'arena Hasbro conta poco, e quasi niente per le combo di difesa.</p>
    <div class="row" role="radiogroup" aria-label="Arena">${ARENAS.map(([k,l])=>`<button class="btn ${c.arena===k?"primary":""}" data-act="tr-arena" data-k="${k}" role="radio" aria-checked="${c.arena===k}">${l}</button>`).join("")}</div>
    <div class="grid2">
      <div class="combo"><span class="slot">COMBO A · MIA</span><div class="row" style="gap:6px">${mineSel("a",c.a)}</div></div>
      <div class="combo"><div class="row" style="justify-content:space-between"><span class="slot">COMBO B</span>
          <span class="row" style="gap:4px"><button class="btn ${c.b.mine!==false?"primary":""}" data-act="tr-bown" data-mine="1">Mia</button><button class="btn ${c.b.mine===false?"primary":""}" data-act="tr-bown" data-mine="0">Avversaria</button></span></div>
        <div class="row" style="gap:6px">${c.b.mine===false?oppInp(c.b):mineSel("b",c.b)}</div>
        ${c.b.mine===false?`<p class="small muted">Scrivi solo quello che sai, anche niente: resta “avversario sconosciuto”.</p>`:""}
      </div>
    </div>
    ${c.b.mine!==false?`<div class="combo" style="gap:8px">
      <label class="chk"><input type="checkbox" id="tr-solo" ${c.solo?"checked":""}> Lancio da solo (prima una trottola, poi l'altra)</label>
      ${c.solo?`<div class="row" style="gap:6px"><span class="small muted">Lancio per prima</span>
        <button class="btn ${(c.first||"a")==="a"?"primary":""}" data-act="tr-first" data-k="a">A · ${esc(nameA)}</button>
        <button class="btn ${c.first==="b"?"primary":""}" data-act="tr-first" data-k="b">B · ${esc(nameB)}</button></div>
      <label class="chk"><input type="checkbox" id="tr-alt" ${c.alt?"checked":""}> Alterna dopo ogni scontro</label>
      <p class="small muted">Chi parte per primo perde rotazione prima che parta l'altra: se vince conta di più, se vince quella partita dopo conta di meno.</p>`:""}
      <div class="row"><button class="btn ghost" data-act="tr-swap">Scambia A e B</button></div>
    </div>`:""}
  </section>

  <section class="panel">
    <div class="deck-head"><h3>${esc(nameA)} contro ${esc(nameB)}</h3><span class="chip">${esc(ARENAS.find(x=>x[0]===c.arena)[1])}</span></div>
    ${ready?"":`<p class="note">Scegli almeno la lama della combo A${c.b.mine!==false?" e della combo B":""} per iniziare.</p>`}
    <div class="row" style="justify-content:center;gap:18px">
      <div class="stat" style="text-align:center"><span class="small muted">A vince</span><b style="font-size:40px">${T.a}</b></div>
      <span class="muted" style="font-size:26px">–</span>
      <div class="stat" style="text-align:center"><span class="small muted">B vince</span><b style="font-size:40px">${T.b}</b></div>
    </div>
    <p class="small muted" style="text-align:center">${cur.length?`${cur.length} scontri${T.d?`, ${T.d} pareggi`:""} · punti ${T.pa}-${T.pb}${T.a+T.b?` · A vince il ${Math.round(T.a/(T.a+T.b)*100)}%`:""}`:"Sessione nuova: si parte da 0-0"}</p>
    ${(()=>{ const sl=cur.filter(e=>e.solo&&e.side!=="draw"); if(!sl.length) return ""; const fa=sl.filter(e=>e.first==="a"), sa=sl.filter(e=>e.first==="b");
      const pc=l=>l.length?`${l.filter(e=>e.side==="a").length}/${l.length}`:"—";
      return `<p class="small muted" style="text-align:center">Lancio da solo · A vince ${pc(fa)} partendo per prima, ${pc(sa)} partendo per seconda</p>` })()}
    <div class="stack" style="gap:6px"><span class="small muted">Vince A (${esc(nameA)})</span><div class="row" style="gap:6px">${finBtns("a")}</div></div>
    <div class="stack" style="gap:6px"><span class="small muted">Vince B (${esc(nameB)})</span><div class="row" style="gap:6px">${finBtns("b")}</div></div>
    <div class="row"><button class="btn" data-act="tr-draw" ${ready?"":"disabled"}>Pareggio</button><button class="btn ghost" data-act="tr-undo" ${cur.length?"":"disabled"}>Annulla l'ultimo</button></div>
    ${cur.length?`<div class="row" style="gap:6px">${cur.slice(-15).map(e=>`<span class="chip ${e.side==="a"?"good":e.side==="b"?"bad":""}" title="${e.solo?`prima ${e.first.toUpperCase()}`:""}">${e.solo?`${e.first.toUpperCase()}↑ `:""}${e.side==="draw"?"pari":(e.side==="a"?"A ":"B ")+FINISH.find(x=>x[0]===e.f)[1]}</span>`).join("")}</div>`:""}
    ${Object.keys(T.f).length?`<p class="small muted">${FINISH.map(([f,l])=>{const x=T.f["a:"+f]||0,y=T.f["b:"+f]||0; return x||y?`${l}: ${x}-${y}`:""}).filter(Boolean).join(" · ")}</p>`:""}
  </section>

  ${gl.length?`<section class="panel">${foldHead("train","Tutte le sfide",gl.length)}${fold.train?"":`<div>${gl.slice(0,trainShowAll?999:12).map(g=>{ const t=trainTally(g.list); const e=g.e;
      return `<div class="alt"><span class="small" style="min-width:0"><b>${lab(e.a,true)}</b> contro <b>${lab(e.b,e.b.mine)}</b><br><span class="muted">${esc(ARENAS.find(x=>x[0]===e.arena)[1])} · ${g.list.length} scontri</span></span>
        <span class="row" style="gap:6px"><span class="mono">${t.a}-${t.b}</span><button class="btn ghost" data-act="tr-load" data-t="${g.list[g.list.length-1].id}" title="Rimette queste combo e riparte da 0-0">Rigioca</button></span></div>`}).join("")}
      ${gl.length>12&&!trainShowAll?`<button class="btn ghost" data-act="tr-more">Mostra tutte</button>`:""}</div>`}</section>`:""}`;
}
function trainClick(a,b){
  if(!a.startsWith("tr-")) return false;
  const c=trainCur(); S.trainLog=S.trainLog||[];
  if(a==="tr-arena"){ if(c.arena!==b.dataset.k){ c.arena=b.dataset.k; newSession(c) } save(); render() }
  if(a==="tr-bown"){ const m=b.dataset.mine==="1"; if((c.b.mine!==false)!==m){ c.b={mine:m}; newSession(c) } save(); render() }
  if(a==="tr-swap"){ const A={...c.a}; c.a={...c.b}; delete c.a.mine; c.b={...A, mine:true}; if(c.first) c.first=c.first==="a"?"b":"a"; save(); render() }
  if(a==="tr-first"){ c.first=b.dataset.k; save(); render() }
  if(a==="tr-pt"||a==="tr-draw"){
    const side=a==="tr-draw"?"draw":b.dataset.side, f=a==="tr-draw"?"draw":b.dataset.f;
    const pts=side==="draw"?0:FINISH.find(x=>x[0]===f)[2];
    const solo=c.b.mine!==false && !!c.solo;
    S.trainLog.push({id:uid(), t:Date.now(), a:{...c.a}, b:{...c.b}, arena:c.arena, side, f, pts, sid:c.sid, ...(solo?{solo:true, first:c.first||"a"}:{})});
    if(solo && c.alt) c.first=(c.first||"a")==="a"?"b":"a"; // alterno chi lancia per primo
    if(S.trainLog.length>2000) S.trainLog=S.trainLog.slice(-2000);
    save(); render();
  }
  if(a==="tr-undo"){ for(let i=S.trainLog.length-1;i>=0;i--){ if(S.trainLog[i].sid===c.sid){ S.trainLog.splice(i,1); break } } save(); render() }
  if(a==="tr-load"){ const e=S.trainLog.find(x=>x.id===b.dataset.t); if(e){ c.a={...e.a}; c.b={...e.b}; c.arena=e.arena; newSession(c); save(); render(); window.scrollTo({top:0}) } }
  if(a==="tr-more"){ trainShowAll=true; render() }
  return true;
}
function trainChange(t){
  if(t.dataset.tr==null) return false;
  const c=trainCur(); const side=t.dataset.tr, k=t.dataset.cf;
  if(((c[side]||{})[k]||"")!==t.value.trim()) newSession(c); // pezzo cambiato: si riparte da 0-0
  c[side]={...c[side], [k]:t.value.trim()};
  if(k==="blade" && side!=="b"||k==="blade"&&c.b.mine!==false){ if(isIntegrated(t.value)) c[side].ratchet="" }
  save(); render(); return true;
}

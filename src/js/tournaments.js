// Scheda TORNEI: modulo, torneo in corso, modifica dei risultati, storico
function blankPhase(label, combos){ return {label:label||"Tutto il torneo", combos:combos?combos.map(c=>({...c})):[{},{},{}], wins:"", losses:""} }
function newForm(){ return {mode:"new", date:new Date().toISOString().slice(0,10), event:"", place:"", players:"", notes:"", link:"", matches:[], phases:[blankPhase()]} }
const deckCombos = d => d.combos.map(c=> c.b ? fromBuilt(c) : {blade:c.blade, ratchet:c.ratchet||"", bit:c.bit});
// Copia nel modulo i campi in alto, così un nuovo render non li perde
function syncFormTop(){
  if(!form) return; const g=id=>{ const el=document.getElementById(id); return el?el.value:undefined };
  for(const [k,id] of [["date","r-date"],["event","r-event"],["place","r-place"],["exit","r-exit"],["players","r-players"],["notes","r-notes"]]){ const v=g(id); if(v!==undefined) form[k]=v }
}
// ---------- Piazzamento ----------
// Turno in cui si è usciti e posizioni che corrispondono, per quando non si sa il piazzamento esatto
const EXITS=[["","Non indicato",""],["winner","Vincitore","1"],["final","Finale","2"],["semi","Semifinale","3-4"],["quarti","Quarti","5-8"],["ottavi","Ottavi","9-16"],["sedicesimi","Sedicesimi","17-32"],["girone","Fuori ai gironi",""],["exact","Posizione esatta",""]];
const exitInfo = k => EXITS.find(x=>x[0]===k);
const placeText = r => { const e=r.exit&&r.exit!=="exact"?exitInfo(r.exit):null; if(e) return e[2]?`${e[1]} (${e[2].replace("-","°-")}°)`:e[1]; return r.place?`${r.place}°`:"–" };
// Turno di uscita calcolato dall'eliminazione diretta: N giocatori in fase finale, k incontri vinti prima della sconfitta
function guessExit(phases, topCut){
  const ko=(phases||[]).filter(p=>p.stage==="ko").flatMap(p=>p.matches||[]);
  if(!ko.length) return "girone";
  const k=ko.filter(m=>m.won).length, lostLast=!ko[ko.length-1].won;
  if(!lostLast) return "winner";
  const left=(+topCut||16)/Math.pow(2,k);
  return {2:"final",4:"semi",8:"quarti",16:"ottavi",32:"sedicesimi"}[left]||"exact";
}
const exitSelect = (attrs, val) => `<select ${attrs} aria-label="Turno in cui sei uscito">${EXITS.map(([k,l,r])=>`<option value="${k}" ${k===(val||"")?"selected":""}>${l}${r?` (${r.replace("-","°-")}°)`:""}</option>`).join("")}</select>`;
const topCutSelect = (attrs, val) => `<select ${attrs} aria-label="Giocatori in fase finale">${[4,8,16,32].map(n=>`<option value="${n}" ${+val===n?"selected":""}>Top ${n}</option>`).join("")}</select>`;
function applyExit(r){ const e=exitInfo(r.exit); if(e && r.exit!=="exact") r.place=e[2] }

// ---------- Torneo in corso ----------
// S.live = {event, date, phases:[{label, stage:"girone"|"ko", target, combos[3], matches:[...]}], cur:{opp, battles:[], bey}}
const FINISH = [["spin","Spin",1],["over","Over",2],["burst","Burst",2],["xtreme","Xtreme",3]];
const STAGE_LABEL = {girone:"Girone", ko:"Eliminazione diretta"};
const STAGE_TARGET = {girone:4, ko:7};
let liveUI = {confirm:"", place:"", players:"", exit:null, topCut:16};
const livePhase = () => S.live.phases[S.live.phases.length-1];
const matchScore = m => (m.battles||[]).reduce((a,b)=>{ if(b.side==="me") a[0]+=b.pts; else if(b.side==="opp") a[1]+=b.pts; return a },[0,0]);
const phaseWL = ph => (ph.matches||[]).reduce((a,m)=>[a[0]+(m.won?1:0), a[1]+(m.won?0:1)],[0,0]);
function newLivePhase(stage, combos, label){ return {label:label||STAGE_LABEL[stage], stage, target:STAGE_TARGET[stage], combos:(combos||[{},{},{}]).map(c=>({...c})), matches:[]} }
function startLive(){
  const g=id=>(document.getElementById(id)||{}).value||"";
  const src=g("lv-deck"); let combos=[{},{},{}];
  if(src==="best"){ const r=buildDecks(); if(r.decks) combos=deckCombos(r.decks[viewIdx]||r.decks[0]) }
  else if(src){ const d=S.decks.find(x=>x.id===src); if(d) combos=deckCombos(d) }
  S.live={event:g("lv-event").trim()||"Torneo", date:g("lv-date")||new Date().toISOString().slice(0,10), phases:[newLivePhase("girone",combos)], cur:{opp:"", battles:[], bey:0}};
  liveUI={confirm:"",place:"",players:"",exit:null,topCut:16}; save(); render(); window.scrollTo({top:0});
}
function addBattle(side, f){
  const L=S.live, ph=livePhase(), cur=L.cur; const fin=FINISH.find(x=>x[0]===f);
  cur.battles.push({bey:cur.bey, side, f, pts: side==="draw"?0:fin[2]});
  cur.bey=(cur.bey+1)%3; // il prossimo lancio di solito è la trottola successiva nell'ordine dichiarato
  const [me,them]=matchScore(cur);
  if(me>=ph.target || them>=ph.target){
    ph.matches.push({opp:cur.opp.trim()||`Avversario ${ph.matches.length+1}`, battles:cur.battles, me, them, won:me>them});
    L.cur={opp:"", battles:[], bey:0};
    toast(me>them?`Incontro vinto ${me}-${them}`:`Incontro perso ${me}-${them}`);
  }
  save(); render();
}
function liveToResult(){
  const L=S.live;
  const phases=L.phases.filter(ph=>ph.matches.length).map(ph=>{ const [w,l]=phaseWL(ph); return {label:ph.label, stage:ph.stage, combos:ph.combos, wins:w, losses:l, matches:ph.matches} });
  return {id:uid(), link:"", date:L.date, event:L.event, place:(liveUI.exit&&liveUI.exit!=="exact")?(exitInfo(liveUI.exit)||[])[2]||"":liveUI.place||"", exit:liveUI.exit||guessExit(L.phases,liveUI.topCut), topCut:liveUI.topCut, players:liveUI.players||"", notes:"", matches:[], phases: phases.length?phases:[{label:"Tutto il torneo", combos:livePhase().combos, wins:0, losses:0}]};
}
function vLive(){
  if(!S.live){
    const fill=`<option value="best">Deck mostrato nel Builder</option>${decksAlpha().map(x=>`<option value="${x.id}">${esc(x.name)}</option>`).join("")}<option value="">Lo scelgo dopo</option>`;
    return `<section class="panel">
      <h2>Torneo in corso</h2>
      <p class="muted">Segna ogni scontro mentre giochi: il punteggio dell'incontro si aggiorna da solo e girone ed eliminazione diretta restano separati.</p>
      <div class="grid3">
        <label class="f">Evento<input id="lv-event" placeholder="es. Local Tetris 5.0"></label>
        <label class="f">Data<input type="date" id="lv-date" value="${new Date().toISOString().slice(0,10)}"></label>
        <label class="f">Deck<select id="lv-deck">${fill}</select></label>
      </div>
      <div class="row"><button class="btn primary" data-act="lv-start">Inizia il torneo</button></div>
    </section>`;
  }
  const L=S.live, ph=livePhase(), cur=L.cur, [me,them]=matchScore(cur);
  const allMatches=L.phases.flatMap(p=>p.matches.map(m=>({...m, phase:p.label})));
  const opt=(type,val)=>partOptions(type,val,false);
  const fillOpts=`<option value="">Cambia deck</option><option value="best">Deck mostrato nel Builder</option>${decksAlpha().map(x=>`<option value="${x.id}">${esc(x.name)}</option>`).join("")}`;
  const beyBtn=i=>`<button class="btn ${cur.bey===i?"primary":""}" data-act="lv-bey" data-i="${i}" style="flex:1;min-width:0;justify-content:center">${i+1}. ${esc(nm("blade",(ph.combos[i]||{}).blade)||"Trottola "+(i+1))}</button>`;
  const finBtns=side=>FINISH.map(([f,lab,p])=>`<button class="btn ${side==="me"?"primary":""}" data-act="lv-pt" data-side="${side}" data-f="${f}" style="flex:1;min-width:64px;justify-content:center;padding-block:12px">${lab} +${p}</button>`).join("");
  const editing = ph.matches.length===0 && cur.battles.length===0;
  return `<section class="panel" id="live">
    <div class="deck-head">
      <div class="stack" style="gap:4px"><h2>${esc(L.event)}</h2><span class="small muted">${esc(L.date)}</span></div>
      <span class="chip acc">${esc(ph.label)} · incontri a ${ph.target} punti</span>
    </div>

    <div class="combo">
      <span class="slot">DECK ${ph.label.toUpperCase()}</span>
      ${editing?`${[0,1,2].map(j=>{const c=ph.combos[j]||{}; return `<div class="row"><select data-lvc="${j}" data-cf="blade" aria-label="Lama ${j+1}">${opt("blade",c.blade)}</select><select data-lvc="${j}" data-cf="ratchet" aria-label="Ratchet ${j+1}">${opt("ratchet",c.ratchet)}</select><select data-lvc="${j}" data-cf="bit" aria-label="Punta ${j+1}">${opt("bit",c.bit)}</select></div>`}).join("")}
        <p class="small muted">Per una lama con ratchet integrato lascia il ratchet vuoto.</p>`
      :ph.combos.map((c,j)=>`<span class="mono small">${j+1}. ${esc(comboText(c))}</span>`).join("")}
      <div class="row"><select data-lvfill="1" aria-label="Cambia deck">${fillOpts}</select></div>
    </div>

    <div class="combo" style="gap:12px">
      <div class="row" style="justify-content:space-between">
        <span class="slot">INCONTRO ${ph.matches.length+1}</span>
        <input id="lv-opp" data-lv="opp" value="${esc(cur.opp)}" placeholder="Avversario" aria-label="Nome dell'avversario" style="flex:1;min-width:140px;max-width:260px">
      </div>
      <div class="row" style="justify-content:center;gap:18px">
        <div class="stat" style="text-align:center"><span class="small muted">Tu</span><b style="font-size:44px">${me}</b></div>
        <span class="muted" style="font-size:28px">–</span>
        <div class="stat" style="text-align:center"><span class="small muted">${esc(cur.opp||"Avversario")}</span><b style="font-size:44px">${them}</b></div>
      </div>
      <div class="stack" style="gap:6px"><span class="small muted">Trottola in campo</span><div class="row" style="flex-wrap:nowrap;gap:6px">${[0,1,2].map(beyBtn).join("")}</div></div>
      <div class="stack" style="gap:6px"><span class="small muted">Punto mio</span><div class="row" style="gap:6px">${finBtns("me")}</div></div>
      <div class="stack" style="gap:6px"><span class="small muted">Punto dell'avversario</span><div class="row" style="gap:6px">${finBtns("opp")}</div></div>
      <div class="row">
        <button class="btn" data-act="lv-draw">Pareggio</button>
        <button class="btn ghost" data-act="lv-undo" ${cur.battles.length||ph.matches.length?"":"disabled"}>Annulla l'ultimo</button>
        <button class="btn ghost" data-act="lv-forfeit" data-won="1">Vinto a tavolino</button>
        <button class="btn ghost" data-act="lv-forfeit" data-won="0">Perso a tavolino</button>
      </div>
      ${cur.battles.length?`<div class="row" style="gap:6px">${cur.battles.map(b=>`<span class="chip ${b.side==="me"?"good":b.side==="opp"?"bad":""}">${b.bey+1} · ${b.side==="draw"?"pari":(b.side==="me"?"tu ":"lui ")+FINISH.find(x=>x[0]===b.f)[1]}</span>`).join("")}</div>`:""}
    </div>

    ${vPhaseList("live")}

    <div class="row">
      ${ph.stage==="girone"?`<button class="btn primary" data-act="lv-ko">Passo all'eliminazione diretta</button>`:""}
      ${liveUI.confirm==="end"?"":`<button class="btn" data-act="lv-end-ask">Concludi il torneo</button>`}
      ${liveUI.confirm==="cancel"?`<span class="small">Cancellare il torneo in corso?</span><button class="btn" data-act="lv-cancel">Sì, cancella</button><button class="btn ghost" data-act="lv-no">No</button>`:`<button class="btn ghost" data-act="lv-cancel-ask">Annulla il torneo</button>`}
    </div>
    ${liveUI.confirm==="end"?`<div class="combo"><span class="slot">CONCLUDI</span><div class="grid3">
        <label class="f">Partecipanti<input type="number" min="1" id="lv-players" data-lv="players" value="${esc(liveUI.players)}"></label>
        <label class="f">In fase finale<span class="row" style="gap:6px">${topCutSelect('id="lv-topcut" data-lv="topCut"', liveUI.topCut)}</span></label>
        <label class="f">Sei uscito a${exitSelect('id="lv-exit" data-lv="exit"', liveUI.exit||guessExit(L.phases, liveUI.topCut))}</label>
        ${(liveUI.exit||guessExit(L.phases, liveUI.topCut))==="exact"?`<label class="f">Posizione<input type="number" min="1" id="lv-place" data-lv="place" value="${esc(liveUI.place)}"></label>`:""}</div>
        <p class="small muted">Il turno è calcolato dagli incontri dell'eliminazione diretta e dal numero di giocatori in fase finale: correggilo se non torna.</p>
        <div class="row"><button class="btn primary" data-act="lv-end">Salva nello storico</button><button class="btn ghost" data-act="lv-no">Torna al torneo</button></div>
        ${cur.battles.length?`<p class="small muted">L'incontro aperto (${me}-${them}) non viene salvato.</p>`:""}</div>`:""}
  </section>`;
}
function liveClick(a,b){
  const L=S.live; if(!L && a!=="lv-start") return false;
  if(a==="lv-start"){ startLive(); return true }
  if(a==="lv-bey"){ L.cur.bey=+b.dataset.i; save(); render(); return true }
  if(a==="lv-pt"){ addBattle(b.dataset.side, b.dataset.f); return true }
  if(a==="lv-draw"){ addBattle("draw","spin"); return true }
  if(a==="lv-undo"){
    if(L.cur.battles.length){ const x=L.cur.battles.pop(); L.cur.bey=x.bey }
    else { // riapro l'ultimo incontro chiuso
      const ph=livePhase(); const m=ph.matches.pop(); if(m){ const bt=m.battles||[]; const x=bt.pop(); L.cur={opp:m.opp, battles:bt, bey:x?x.bey:0} } }
    save(); render(); return true }
  if(a==="lv-forfeit"){ const ph=livePhase(); const won=b.dataset.won==="1"; const [me,them]=matchScore(L.cur);
    ph.matches.push({opp:L.cur.opp.trim()||`Avversario ${ph.matches.length+1}`, battles:L.cur.battles, me, them, won, forfeit:true});
    L.cur={opp:"",battles:[],bey:0}; save(); render(); return true }
  if(a==="lv-ko"){ const ph=livePhase(); L.phases.push(newLivePhase("ko", ph.combos)); L.cur={opp:"",battles:[],bey:0}; save(); render(); toast("Eliminazione diretta: incontri a 7 punti"); return true }
  if(a==="lv-end-ask"){ liveUI.confirm="end"; render(); return true }
  if(a==="lv-cancel-ask"){ liveUI.confirm="cancel"; render(); return true }
  if(a==="lv-no"){ liveUI.confirm=""; render(); return true }
  if(a==="lv-cancel"){ S.live=null; liveUI={confirm:"",place:"",players:"",exit:null,topCut:16}; save(); render(); toast("Torneo cancellato"); return true }
  if(a==="lv-end"){ S.results.push(liveToResult()); S.live=null; liveUI={confirm:"",place:"",players:"",exit:null,topCut:16}; save(); render(); toast("Torneo salvato nello storico"); return true }
  return false;
}
function liveChange(t){
  const L=S.live; if(!L) return false;
  if(t.dataset.lv==="opp"){ L.cur.opp=t.value; save(); return true }
  if(t.dataset.lv==="place"||t.dataset.lv==="players"){ liveUI[t.dataset.lv]=t.value; return true }
  if(t.dataset.lv==="topCut"){ liveUI.topCut=+t.value; liveUI.exit=null; render(); return true }
  if(t.dataset.lv==="exit"){ liveUI.exit=t.value; render(); return true }
  if(t.dataset.lvc!=null){ const ph=livePhase(); const j=+t.dataset.lvc; ph.combos[j]={...(ph.combos[j]||{}), [t.dataset.cf]:t.value}; save(); return true }
  if(t.dataset.lvfill && t.value){ const d = t.value==="best" ? (buildDecks().decks||[])[viewIdx] : S.decks.find(x=>x.id===t.value); if(d) liveSetDeck(deckCombos(d)); return true }
  return false;
}
// Nuovo deck: se nella fase ci sono già incontri, apro una fase nuova così i risultati restano attribuiti al deck giusto
function liveSetDeck(combos){
  const L=S.live, ph=livePhase();
  if(ph.matches.length===0 && L.cur.battles.length===0){ ph.combos=combos.map(c=>({...c})) }
  else { const n=L.phases.filter(p=>p.stage===ph.stage).length+1; L.phases.push(newLivePhase(ph.stage, combos, `${STAGE_LABEL[ph.stage]} (deck ${n})`)); toast("Deck cambiato: i prossimi incontri contano per il nuovo deck") }
  save(); render();
}

// ---------- Modifica dei risultati già segnati ----------
let ed=null;        // incontro aperto in modifica: {ctx, pi, mi}
let edDeck=null;    // fase di cui si modifica il deck: {ctx, pi}
let edConfirm="";   // conferma di eliminazione in corso
let histEdit=null;  // id del torneo dello storico in modifica
function phasesFor(ctx){ if(ctx==="live") return S.live?S.live.phases:null; const r=S.results.find(x=>x.id===ctx); return r?r.phases:null }
// Ricalcola punteggi, esito degli incontri e bilanci delle fasi dopo una modifica
function recompute(ctx, autoWon){
  const phs=phasesFor(ctx); if(!phs) return;
  phs.forEach(ph=>{
    (ph.matches||[]).forEach(m=>{ if((m.battles||[]).length){ const [a,b]=matchScore(m); m.me=a; m.them=b; if(autoWon && autoWon===m && a!==b) m.won=a>b } });
    if(ctx!=="live" && (ph.matches||[]).length){ const [w,l]=phaseWL(ph); ph.wins=w; ph.losses=l }
  });
}
const same = (a,b) => a && b && a.ctx===b.ctx && a.pi===b.pi && (b.mi==null || a.mi===b.mi);
function vPhaseList(ctx){
  const phs=phasesFor(ctx); if(!phs) return "";
  const at=(pi,mi)=>`data-ctx="${esc(ctx)}" data-pi="${pi}"${mi!=null?` data-mi="${mi}"`:""}`;
  const opt=(type,val)=>partOptions(type,val,true);
  return phs.map((p,pi)=>{
    if(!p.matches) p.matches=[];
    if(ctx==="live" && !p.matches.length && pi!==phs.length-1) return "";
    const [w,l]=phaseWL(p); const deckOpen=same({ctx,pi},edDeck);
    const canDel = !p.matches.length && phs.length>1;
    return `<div class="stack" style="gap:6px;border-top:1px solid var(--line);padding-top:10px">
      <div class="row" style="justify-content:space-between">
        <h3>${esc(p.label)} <span class="mono">${w}-${l}</span></h3>
        <div class="row" style="gap:4px">
          <button class="btn ghost" type="button" data-act="ed-deck" ${at(pi)}>${deckOpen?"Chiudi":"Modifica fase"}</button>
          ${ctx!=="live"?`<button class="btn ghost" type="button" data-act="ed-madd" ${at(pi)}>+ Incontro</button>`:""}
          ${canDel?(edConfirm===`ph:${ctx}:${pi}`?`<button class="btn" type="button" data-act="ed-phdel" ${at(pi)}>Conferma eliminazione</button>`:`<button class="btn ghost" type="button" data-act="ed-phdel-ask" ${at(pi)}>Elimina fase</button>`):""}
        </div>
      </div>
      ${deckOpen?`<div class="combo" style="gap:8px">
          <div class="row"><input data-edp="label" ${at(pi)} value="${esc(p.label||"")}" aria-label="Nome della fase" style="flex:1;min-width:160px">
            <select data-edp="stage" ${at(pi)} aria-label="Fase"><option value="girone" ${p.stage!=="ko"?"selected":""}>Girone (a 4)</option><option value="ko" ${p.stage==="ko"?"selected":""}>Eliminazione diretta (a 7)</option></select></div>
          ${[0,1,2].map(j=>{const c=(p.combos||[])[j]||{}; return `<div class="row"><select data-edc="${j}" data-cf="blade" ${at(pi)} aria-label="Lama ${j+1}">${opt("blade",c.blade)}</select><select data-edc="${j}" data-cf="ratchet" ${at(pi)} aria-label="Ratchet ${j+1}">${opt("ratchet",c.ratchet)}</select><select data-edc="${j}" data-cf="bit" ${at(pi)} aria-label="Punta ${j+1}">${opt("bit",c.bit)}</select></div>`}).join("")}
          <p class="small muted">Cambiare il deck qui corregge a quali trottole vanno gli scontri già segnati in questa fase.</p>
        </div>`:`<span class="mono small muted">${(p.combos||[]).map((c,j)=>`${j+1}. ${esc(comboText(c))}`).join(" · ")}</span>`}
      ${p.matches.map((m,mi)=>{
        if(!same({ctx,pi,mi},ed)) return `<div class="row" style="justify-content:space-between"><span><span class="chip ${m.won?"good":"bad"}">${m.won?"V":"P"}</span> ${esc(m.opp||"—")}${m.forfeit?' <span class="small muted">a tavolino</span>':""}</span><span class="row" style="gap:6px"><span class="mono">${+m.me||0}-${+m.them||0}</span><button class="btn ghost" type="button" data-act="ed-open" ${at(pi,mi)}>Modifica</button></span></div>`;
        const beyName=j=>`${j+1}. ${nm("blade",((p.combos||[])[j]||{}).blade)||"Trottola "+(j+1)}`;
        return `<div class="combo" style="gap:8px">
          <div class="row">
            <input data-edm="opp" ${at(pi,mi)} value="${esc(m.opp||"")}" placeholder="Avversario" aria-label="Avversario" style="flex:1;min-width:140px">
            <select data-edm="won" ${at(pi,mi)} aria-label="Esito"><option value="1" ${m.won?"selected":""}>Vinto</option><option value="0" ${!m.won?"selected":""}>Perso</option></select>
            ${(m.battles||[]).length?`<span class="mono">${+m.me||0}-${+m.them||0}</span>`:`<input type="number" min="0" data-edm="me" ${at(pi,mi)} value="${+m.me||0}" aria-label="Tuoi punti" style="width:64px"><span>–</span><input type="number" min="0" data-edm="them" ${at(pi,mi)} value="${+m.them||0}" aria-label="Punti avversario" style="width:64px">`}
          </div>
          ${(m.battles||[]).map((b,bi)=>`<div class="row" style="gap:6px">
            <select data-edb="${bi}" data-k="bey" ${at(pi,mi)} aria-label="Trottola">${[0,1,2].map(j=>`<option value="${j}" ${b.bey===j?"selected":""}>${esc(beyName(j))}</option>`).join("")}</select>
            <select data-edb="${bi}" data-k="side" ${at(pi,mi)} aria-label="Chi fa punto"><option value="me" ${b.side==="me"?"selected":""}>Punto mio</option><option value="opp" ${b.side==="opp"?"selected":""}>Punto avversario</option><option value="draw" ${b.side==="draw"?"selected":""}>Pareggio</option></select>
            ${b.side==="draw"?"":`<select data-edb="${bi}" data-k="f" ${at(pi,mi)} aria-label="Finish">${FINISH.map(([f,lab,pt])=>`<option value="${f}" ${b.f===f?"selected":""}>${lab} +${pt}</option>`).join("")}</select>`}
            <button class="btn ghost" type="button" data-act="ed-bdel" data-bi="${bi}" ${at(pi,mi)} aria-label="Togli lo scontro">✕</button>
          </div>`).join("")}
          <div class="row">
            <button class="btn" type="button" data-act="ed-badd" ${at(pi,mi)}>+ Scontro</button>
            ${phs.length>1?`<select data-edm="move" ${at(pi,mi)} aria-label="Sposta in un'altra fase"><option value="">Sposta in un'altra fase</option>${phs.map((q,qi)=>qi===pi?"":`<option value="${qi}">${esc(q.label)}</option>`).join("")}</select>`:""}
            ${edConfirm===`m:${ctx}:${pi}:${mi}`?`<button class="btn" type="button" data-act="ed-mdel" ${at(pi,mi)}>Conferma eliminazione</button>`:`<button class="btn ghost" type="button" data-act="ed-mdel-ask" ${at(pi,mi)}>Elimina incontro</button>`}
            <button class="btn primary" type="button" data-act="ed-close">Fatto</button>
          </div>
        </div>`;
      }).join("")}
    </div>`;
  }).join("");
}
function vHistEdit(){
  const r=histEdit && S.results.find(x=>x.id===histEdit); if(!r){ histEdit=null; return "" }
  const [w,l]=totWL(r);
  return `<section class="panel" id="hist-edit">
    <div class="deck-head"><h2>Modifica torneo</h2><span class="mono">${w}-${l}</span></div>
    <div class="grid3">
      <label class="f">Evento<input data-hf="event" value="${esc(r.event||"")}"></label>
      <label class="f">Data<input type="date" data-hf="date" value="${esc(r.date||"")}"></label>
      <label class="f">Sei uscito a${exitSelect('data-hf="exit"', r.exit||(r.place?"exact":""))}</label>
      ${(r.exit||(r.place?"exact":""))==="exact"?`<label class="f">Posizione<input type="number" min="1" data-hf="place" value="${esc(r.place||"")}"></label>`:""}
      <label class="f">Partecipanti<input type="number" min="1" data-hf="players" value="${esc(r.players||"")}"></label>
      <label class="f">Note<input data-hf="notes" value="${esc(r.notes||"")}"></label>
    </div>
    ${vPhaseList(r.id)}
    <div class="row"><button class="btn primary" data-act="hist-done">Fatto</button></div>
  </section>`;
}
function edTarget(b){ const ctx=b.dataset.ctx, pi=+b.dataset.pi, mi=b.dataset.mi!=null?+b.dataset.mi:null; const phs=phasesFor(ctx); const ph=phs&&phs[pi]; const m=ph&&mi!=null?ph.matches[mi]:null; return {ctx,pi,mi,phs,ph,m} }
function edClick(a,b){
  if(a==="hist-done"){ histEdit=null; ed=null; edDeck=null; render(); return true }
  if(!a.startsWith("ed-")) return false;
  if(a==="ed-close"){ ed=null; edConfirm=""; render(); return true }
  const T=edTarget(b); if(!T.ph) return true;
  if(a==="ed-open"){ ed={ctx:T.ctx,pi:T.pi,mi:T.mi}; edConfirm=""; render(); return true }
  if(a==="ed-deck"){ edDeck=same({ctx:T.ctx,pi:T.pi},edDeck)?null:{ctx:T.ctx,pi:T.pi}; render(); return true }
  if(a==="ed-madd"){ T.ph.matches.push({opp:"", battles:[], me:0, them:0, won:false}); ed={ctx:T.ctx,pi:T.pi,mi:T.ph.matches.length-1}; recompute(T.ctx); save(); render(); return true }
  if(a==="ed-badd" && T.m){ T.m.battles=T.m.battles||[]; T.m.battles.push({bey:T.m.battles.length%3, side:"me", f:"spin", pts:1}); recompute(T.ctx,T.m); save(); render(); return true }
  if(a==="ed-bdel" && T.m){ T.m.battles.splice(+b.dataset.bi,1); recompute(T.ctx,T.m); save(); render(); return true }
  if(a==="ed-mdel-ask"){ edConfirm=`m:${T.ctx}:${T.pi}:${T.mi}`; render(); return true }
  if(a==="ed-mdel"){ T.ph.matches.splice(T.mi,1); ed=null; edConfirm=""; recompute(T.ctx); save(); render(); toast("Incontro eliminato"); return true }
  if(a==="ed-phdel-ask"){ edConfirm=`ph:${T.ctx}:${T.pi}`; render(); return true }
  if(a==="ed-phdel"){ T.phs.splice(T.pi,1); edDeck=null; ed=null; edConfirm=""; recompute(T.ctx); save(); render(); toast("Fase eliminata"); return true }
  return true;
}
function edChange(t){
  if(t.dataset.hf){ const r=S.results.find(x=>x.id===histEdit); if(r){ r[t.dataset.hf]=t.value; if(t.dataset.hf==="exit"){ applyExit(r); render() } save() } return true }
  if(t.dataset.ctx==null) return false;
  const T=edTarget(t); if(!T.ph) return true;
  if(t.dataset.edp){ if(t.dataset.edp==="stage"){ T.ph.stage=t.value; T.ph.target=STAGE_TARGET[t.value] } else T.ph.label=t.value; save(); render(); return true }
  if(t.dataset.edc!=null){ const j=+t.dataset.edc; T.ph.combos=T.ph.combos||[{},{},{}]; T.ph.combos[j]={...(T.ph.combos[j]||{}), [t.dataset.cf]:t.value}; save(); render(); return true }
  if(!T.m) return true;
  if(t.dataset.edm==="opp"){ T.m.opp=t.value; save(); return true }
  if(t.dataset.edm==="won"){ T.m.won=t.value==="1"; recompute(T.ctx); save(); render(); return true }
  if(t.dataset.edm==="me"||t.dataset.edm==="them"){ T.m[t.dataset.edm]=Math.max(0,+t.value||0); save(); render(); return true }
  if(t.dataset.edm==="move" && t.value!==""){ const qi=+t.value; const [m]=T.ph.matches.splice(T.mi,1); T.phs[qi].matches.push(m); ed={ctx:T.ctx,pi:qi,mi:T.phs[qi].matches.length-1}; recompute(T.ctx); save(); render(); toast("Incontro spostato"); return true }
  if(t.dataset.edb!=null){ const bt=T.m.battles[+t.dataset.edb]; const k=t.dataset.k;
    if(k==="bey") bt.bey=+t.value; else if(k==="side"){ bt.side=t.value; if(t.value==="draw") bt.pts=0; else bt.pts=(FINISH.find(x=>x[0]===bt.f)||FINISH[0])[2] } else if(k==="f"){ bt.f=t.value; bt.pts=FINISH.find(x=>x[0]===t.value)[2] }
    recompute(T.ctx,T.m); save(); render(); return true }
  return true;
}

// Storico compatto: una riga per torneo, i dettagli si aprono toccandola
let histOpen=null;
function vHistRow(r){
  const [W,L]=totWL(r), phs=phasesOf(r), open=histOpen===r.id;
  // bilancio per girone ed eliminazione diretta, sommando le fasi dello stesso tipo
  const by={}; phs.forEach(ph=>{ const k=ph.stage==="ko"?"Eliminazione":ph.stage==="girone"?"Girone":(ph.label||"Torneo"); by[k]=by[k]||[0,0]; by[k][0]+=+ph.wins||0; by[k][1]+=+ph.losses||0 });
  const parts=Object.entries(by).map(([k,[w,l]])=>`${k} ${w}-${l}`).join(" · ");
  const pl=placeText(r);
  return `<div style="border-top:1px solid var(--line)">
    <button type="button" data-act="hist-toggle" data-id="${r.id}" aria-expanded="${open}" style="all:unset;box-sizing:border-box;display:grid;grid-template-columns:1fr auto auto;gap:10px;align-items:center;width:100%;padding:10px 0;cursor:pointer">
      <span style="min-width:0"><b style="display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(r.event||"Torneo")}</b><span class="small muted">${esc(r.date||"")}${parts?" · "+esc(parts):""}</span></span>
      ${pl!=="–"?`<span class="chip acc">${esc(pl)}</span>`:"<span></span>"}
      <span class="mono">${W}-${L} ${open?"▴":"▾"}</span>
    </button>
    ${open?`<div class="stack" style="gap:8px;padding-bottom:12px">
      ${r.players?`<span class="small muted">${esc(r.players)} partecipanti</span>`:""}
      ${r.notes?`<span class="small">${esc(r.notes)}</span>`:""}
      ${phs.map(ph=>`<div class="stack" style="gap:2px"><span class="small"><b>${esc(ph.label||"")}</b> <span class="mono">${+ph.wins||0}-${+ph.losses||0}</span></span><span class="mono small muted">${(ph.combos||[]).filter(c=>c&&c.blade).map(c=>`${esc(nm("blade",c.blade))} ${esc(c.ratchet?nm("ratchet",c.ratchet):"int.")} ${esc(bitShort(c.bit))}`).join(" · ")}</span></div>`).join("")}
      <div class="row"><button class="btn" data-act="edit-res" data-id="${r.id}">Modifica</button>
        ${edConfirm==="r:"+r.id?`<button class="btn" data-act="del-res" data-id="${r.id}">Conferma eliminazione</button><button class="btn ghost" data-act="hist-nodel">No</button>`:`<button class="btn ghost" data-act="hist-del-ask" data-id="${r.id}">Elimina</button>`}</div>
    </div>`:""}
  </div>`;
}
function vResults(){
  const st=personalStats(); let w=0,l=0;
  S.results.forEach(r=>{ const [a,b]=totWL(r); w+=a; l+=b });
  const combos=[...st.entries()].filter(([k])=>k.startsWith("combo:")).map(([k,v])=>({c:k.slice(6).split("|"),...v,g:v.w+v.l})).filter(x=>x.g).sort((a,b)=>(b.w/b.g)-(a.w/a.g)||b.g-a.g).slice(0,5);
  const user=S.settings.challonge||"";
  if(!form) form=newForm();
  const d=form;
  const opt=(type,val)=>partOptions(type,val,true,true);
  const fillOpts=`<option value="">Riempi con un deck</option><option value="best">Deck mostrato nel Builder</option>${decksAlpha().map(x=>`<option value="${x.id}">${esc(x.name)}</option>`).join("")}`;
  const [fw,fl]=d.phases.reduce((a,p)=>[a[0]+(+p.wins||0),a[1]+(+p.losses||0)],[0,0]);
  return vLive() + vHistEdit() + `
  <section class="panel">
    <h2>Risultati ai tornei</h2>
    <div class="grid3">
      <div class="stat"><span class="muted small">Tornei</span><b>${S.results.length}</b></div>
      <div class="stat"><span class="muted small">Incontri vinti / persi</span><b>${w} / ${l}</b></div>
      <div class="stat"><span class="muted small">Percentuale vittorie</span><b>${w+l?Math.round(w/(w+l)*100)+"%":"–"}</b></div>
    </div>
    ${combos.length?`<div class="stack"><h3>Le tue combo migliori</h3>${combos.map(x=>`<div class="row" style="justify-content:space-between"><span><b>${esc(nm("blade",x.c[0]))}</b> <span class="mono">${esc(x.c[1]?nm("ratchet",x.c[1]):"integrato")} ${esc(bitShort(x.c[2]))}</span></span><span class="mono">${x.w}-${x.l} · ${Math.round(x.w/x.g*100)}%</span></div>`).join("")}</div>`:""}
  </section>

  <section class="panel">
    <h3>${d.mode==="edit"?"Modifica torneo":d.mode==="import"?"Controlla il torneo importato":"Aggiungi un torneo"}</h3>
    <form id="res-form" class="stack">
      <div class="grid3">
        <label class="f">Data<input type="date" id="r-date" value="${esc(d.date||"")}"></label>
        <label class="f">Evento<input id="r-event" value="${esc(d.event||"")}" placeholder="es. Local del martedì" required></label>
        <label class="f">Sei uscito a${exitSelect('id="r-exit"', d.exit||(d.place?"exact":""))}</label>
        <label class="f">Posizione esatta (se la sai)<input type="number" min="1" id="r-place" value="${esc(d.exit&&d.exit!=="exact"?"":(d.place||""))}"></label>
        <label class="f">Partecipanti<input type="number" min="1" id="r-players" value="${esc(d.players||"")}"></label>
      </div>
      ${d.phases.map((ph,i)=>`
      <div class="combo" style="gap:8px">
        <div class="row" style="justify-content:space-between">
          <span class="slot">DECK ${d.phases.length>1?`${i+1} DI ${d.phases.length}`:"USATO"}</span>
          ${d.phases.length>1?`<button class="btn ghost" type="button" data-act="ph-del" data-i="${i}">Rimuovi</button>`:""}
        </div>
        <div class="row">
          ${d.phases.length>1?`<input data-ph="${i}" data-pf="label" value="${esc(ph.label||"")}" placeholder="es. Gironi, Fase finale, dal 3° round" aria-label="Nome della fase" style="flex:1;min-width:160px">`:""}
          <select data-fill="${i}" aria-label="Riempi con un deck">${fillOpts}</select>
        </div>
        ${[0,1,2].map(j=>{const c=(ph.combos||[])[j]||{}; return `<div class="row"><select data-ph="${i}" data-cj="${j}" data-cf="blade" aria-label="Lama ${j+1}">${opt("blade",c.blade)}</select><select data-ph="${i}" data-cj="${j}" data-cf="ratchet" aria-label="Ratchet ${j+1}">${opt("ratchet",c.ratchet)}</select><select data-ph="${i}" data-cj="${j}" data-cf="bit" aria-label="Punta ${j+1}">${opt("bit",c.bit)}</select></div>`}).join("")}
        <div class="row">
          <label class="f">Vinti${d.phases.length>1?" con questo deck":""}<input type="number" min="0" data-ph="${i}" data-pf="wins" value="${esc(ph.wins??"")}" style="width:90px"></label>
          <label class="f">Persi${d.phases.length>1?" con questo deck":""}<input type="number" min="0" data-ph="${i}" data-pf="losses" value="${esc(ph.losses??"")}" style="width:90px"></label>
        </div>
      </div>`).join("")}
      <div class="row"><button class="btn" type="button" data-act="ph-add">Ho cambiato pezzi durante il torneo</button>${d.phases.length>1?`<span class="small muted">Totale: <span class="mono">${fw}-${fl}</span></span>`:""}</div>
      ${d.phases.length>1?`<p class="small muted">Dividi vittorie e sconfitte tra i deck: così l'indice premia la combo che ha giocato davvero quegli incontri.</p>`:""}
      ${d.matches&&d.matches.length?`<div class="stack small">${d.matches.map(m=>`<span><span class="chip ${m.won?"good":"bad"}">${m.won?"V":"P"}</span> ${esc(m.opp)} <span class="mono">${esc(m.score||"")}</span></span>`).join("")}</div>`:""}
      <label class="f">Note<input id="r-notes" value="${esc(d.notes||"")}" placeholder="regole extra, avversari, osservazioni"></label>
      <div class="row"><button class="btn primary" type="submit">${d.mode==="edit"?"Salva modifiche":"Registra torneo"}</button>${d.mode!=="new"||d.event?`<button class="btn" type="button" data-act="cancel-res">Annulla</button>`:""}</div>
    </form>
  </section>

  <section class="panel">
    <h3>Challonge</h3>
    <div class="row">
      <label class="f" style="flex:1;min-width:200px">Il tuo nome utente Challonge<input id="ch-user" value="${esc(user)}" placeholder="es. andrea_bbx"></label>
      ${user?`<a class="btn" href="https://challonge.com/it/users/${encodeURIComponent(user.toLowerCase())}/tournaments" target="_blank" rel="noopener">Apri il profilo ↗</a>`:""}
    </div>
    <div class="row">
      <button class="btn primary" data-act="ch-find" ${aiBusy||!user?"disabled":""}>Cerca i miei tornei</button>
    </div>
    <div class="row">
      <input id="ch-link" placeholder="oppure incolla il link di un torneo, es. https://challonge.com/xyz" aria-label="Link del torneo Challonge" style="flex:1;min-width:220px">
      <button class="btn" data-act="ch-link" ${aiBusy?"disabled":""}>Importa dal link</button>
    </div>
    ${chMsg?`<p class="note">${esc(chMsg)}</p>${browserDenied?`<div class="row"><button class="btn" data-act="open-perms">Permessi</button><span class="small muted">Attiva “browser” per Deck Lab BBX, poi riprova.</span></div>`:""}`:""}
    ${chList&&chList.length?`<div>${chList.map((t,i)=>`<div class="alt"><span class="small" style="min-width:0;overflow-wrap:anywhere"><b>${esc(t.title||t.url)}</b><br><span class="mono muted">${esc(t.url)}</span></span>${S.results.some(r=>r.link===t.url)?`<span class="chip good">già registrato</span>`:`<button class="btn" data-act="ch-import" data-i="${i}" ${aiBusy?"disabled":""}>Importa</button>`}</div>`).join("")}</div>`:""}
    <p class="small muted">L'importazione compila il modulo qui sopra e tiene il deck che hai già inserito.${STANDALONE?"":" La lettura automatica usa il browser dell'app Claude per Mac."}</p>
${STANDALONE?"":`    <details>
      <summary style="cursor:pointer;font-weight:600">Importa incollando il testo</summary>
      <div class="stack" style="margin-top:10px">
        <textarea id="ch-paste" placeholder="Incolla qui il testo della pagina del torneo su Challonge"></textarea>
        <div class="row"><button class="btn" data-act="import-ch" ${aiBusy?"disabled":""}>Estrai i risultati</button></div>
      </div>
    </details>`}
  </section>

  ${S.results.length?`<section class="panel"><h3>Storico</h3><div>${[...S.results].sort((a,b)=>String(b.date).localeCompare(String(a.date))).map(vHistRow).join("")}</div></section>`:`<div class="empty">Nessun torneo registrato. Dopo il primo, l'indice dei pezzi tiene conto di come sono andati.</div>`}`;
}

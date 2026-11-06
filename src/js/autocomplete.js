
// ---------- Elenco a scomparsa per i campi di testo ----------
// Mostra i nomi possibili in ordine alfabetico, filtrati da quello che si scrive, in un riquadro con barra di scorrimento
// Per i pezzi nuovi propone i nomi delle scatole (Hasbro) e quelli giapponesi; per le punte anche "sigla · nome"
function acValues(type){ return [...new Set([...(meta()[type]||[]).map(r=>r[0]), ...(CX_TYPES.includes(type)||type==="ratchet"?[]:choicesOf(type,true).map(p=>p.name)), ...CATALOG.filter(c=>c.type===type).flatMap(c=>c.names)])].sort(alpha) }
let acBox=null, acInput=null, acIdx=-1;
function acOpen(inp){
  acInput=inp; if(!acBox){ acBox=document.createElement("div"); acBox.className="ac"; acBox.setAttribute("role","listbox"); document.body.appendChild(acBox);
    acBox.addEventListener("mousedown",e=>{ const b=e.target.closest("[data-v]"); e.preventDefault(); if(b) acPick(b.dataset.v) }) }
  acFill();
}
function acFill(){
  if(!acInput||!acBox) return;
  const q=acInput.value.trim().toLowerCase(); const all=acValues(acInput.dataset.ac);
  const list=q?all.filter(v=>v.toLowerCase().includes(q)):all;
  acIdx=-1;
  acBox.innerHTML=list.length?list.map((v,i)=>`<button type="button" role="option" data-v="${esc(v)}" id="ac-${i}">${esc(v)}</button>`).join(""):`<div class="small muted" style="padding:8px 10px">Nessun nome trovato: va bene anche scriverlo a mano</div>`;
  const r=acInput.getBoundingClientRect(); const below=window.innerHeight-r.bottom;
  acBox.style.left=r.left+"px"; acBox.style.width=Math.max(r.width,200)+"px";
  if(below<200 && r.top>below){ acBox.style.top=""; acBox.style.bottom=(window.innerHeight-r.top+4)+"px"; acBox.style.maxHeight=Math.min(300,r.top-12)+"px" }
  else { acBox.style.bottom=""; acBox.style.top=(r.bottom+4)+"px"; acBox.style.maxHeight=Math.min(300,below-12)+"px" }
  acBox.hidden=false;
}
function acClose(){ if(acBox) acBox.hidden=true; acInput=null; acIdx=-1 }
function acPick(v){ const inp=acInput; if(!inp) return; inp.value=v; acClose(); inp.dispatchEvent(new Event("change",{bubbles:true})) }
document.addEventListener("focusin",e=>{ if(e.target.matches&&e.target.matches("input[data-ac]")) acOpen(e.target) });
document.addEventListener("focusout",e=>{ if(e.target===acInput) setTimeout(()=>{ if(document.activeElement!==acInput) acClose() },120) });
document.addEventListener("input",e=>{ if(e.target===acInput) acFill() });
document.addEventListener("keydown",e=>{
  if(!acInput||e.target!==acInput||!acBox||acBox.hidden) return;
  const items=[...acBox.querySelectorAll("[data-v]")];
  if(e.key==="ArrowDown"||e.key==="ArrowUp"){ e.preventDefault(); if(!items.length) return; acIdx=(acIdx+(e.key==="ArrowDown"?1:-1)+items.length)%items.length;
    items.forEach((b,i)=>b.setAttribute("aria-selected",String(i===acIdx))); items[acIdx].scrollIntoView({block:"nearest"}) }
  else if(e.key==="Enter" && acIdx>=0){ e.preventDefault(); acPick(items[acIdx].dataset.v) }
  else if(e.key==="Escape"){ acClose() }
});
window.addEventListener("scroll",()=>{ if(acInput) acFill() },{passive:true});
window.addEventListener("resize",()=>{ if(acInput) acFill() });

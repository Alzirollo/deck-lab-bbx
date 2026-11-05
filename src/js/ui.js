// Interfaccia comune: disegno delle schede, sezioni richiudibili, avvisi, menu
// ---------- Rendering ----------
function render(){
  document.querySelectorAll("nav button").forEach(b=>b.setAttribute("aria-selected", String(b.dataset.tab===tab)));
  const ct=document.getElementById("cur-tab"); const cb=document.querySelector(`nav button[data-tab="${tab}"]`); if(ct&&cb) ct.textContent=cb.textContent;
  const m=document.getElementById("main");
  if(!loaded){ m.innerHTML='<div class="empty">Carico i tuoi dati…</div>'; return }
  if(document.getElementById("res-form")) syncFormTop();
  m.innerHTML = tab==="salvati"?vSavedTab():tab==="allena"?vTrain():tab==="deck"?vDeck():tab==="pezzi"?vParts():tab==="tornei"?vResults():vMeta();
  syncChecks(); setTimeout(syncChecks,0); setTimeout(syncChecks,120);
  if(document.querySelector("svg[data-lc]")) requestAnimationFrame(fitCharts);
}
// Le caselle prendono sempre lo stato dai dati, anche se il browser prova a ripristinarne uno vecchio
function syncChecks(){
  document.querySelectorAll('input[type="checkbox"][data-f][data-id]').forEach(el=>{ const p=S.parts.find(x=>x.id===el.dataset.id); if(p) el.checked=!!p[el.dataset.f] });
  const rb=document.getElementById("rule-bit"); if(rb) rb.checked=!!S.settings.bitTypeLimit;
}
function barRow(lbl,v){ return `<div class="bar"><span>${lbl}</span><i><b style="width:${Math.max(0,Math.min(100,v)).toFixed(0)}%"></b></i><span>${v.toFixed(0)}</span></div>` }
const tourName = p => p.metaName && p.metaName!=="-" && normKey(p.metaName)!==normKey(p.name) ? p.metaName : "";
const bitLabel = t => t.code ? `${t.code} · ${t.name}` : t.name;
// Sezioni richiudibili: lo stato resta ricordato su questo dispositivo
let fold={saved:false, others:true};
try{ Object.assign(fold, JSON.parse(localStorage.getItem("decklab-fold")||"{}")) }catch(e){}

// Avvisi e menu
function toast(t){ const el=document.getElementById("toast"); el.textContent=t; el.hidden=false; clearTimeout(toast.t); toast.t=setTimeout(()=>el.hidden=true,2600) }
const partById=id=>S.parts.find(p=>p.id===id);

function setMenu(open){ const m=document.getElementById("menu"), bt=document.getElementById("burger"); m.hidden=!open; bt.setAttribute("aria-expanded",String(open)); if(open){ const cur=m.querySelector('[aria-selected="true"]')||m.querySelector("button"); cur&&cur.focus() } }
document.getElementById("burger").addEventListener("click",()=>setMenu(document.getElementById("menu").hidden));
document.querySelector("nav").addEventListener("click",e=>{const b=e.target.closest("button[data-tab]"); if(!b) return; tab=b.dataset.tab; aiError=""; setMenu(false); render(); window.scrollTo({top:0})});
document.addEventListener("click",e=>{ if(!document.getElementById("menu").hidden && !e.target.closest("header")) setMenu(false) });
document.addEventListener("keydown",e=>{ if(e.key==="Escape" && !document.getElementById("menu").hidden){ setMenu(false); document.getElementById("burger").focus() } });

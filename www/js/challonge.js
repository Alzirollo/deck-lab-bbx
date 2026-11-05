
// ---------- Lettura delle classifiche di Challonge (senza Claude) ----------
// L = righe di testo della pagina "Classifiche" di un torneo; user = nome utente Challonge
const EN_MONTHS={january:1,february:2,march:3,april:4,may:5,june:6,july:7,august:8,september:9,october:10,november:11,december:12};
function parseStandingsLines(L, user, title){
  // le celle possono arrivare su righe separate o sulla stessa riga separate da tabulazioni
  L=L.flatMap(x=>String(x).split(/\t+/)).map(x=>x.replace(/\u00a0/g," ").trim()).filter(Boolean);
  const u=String(user||"").toLowerCase(); const isU=s=>{ const x=String(s||"").toLowerCase().replace(/^\(|\)$/g,"").trim(); return u && x===u };
  const out={event:String(title||"").replace(/\s+/g," ").replace(/\s*[-–]\s*(Classifiche|Standings|Challonge)[\s\S]*$/i,"").trim(), date:null, players:null, final:null, group:null};
  const all=L.join("\n"); const pm=all.match(/Giocatori\s+(\d+)/); if(pm) out.players=+pm[1];
  for(let i=0;i<L.length;i++){ const m=L[i].match(/^([A-Z][a-z]+) (\d{1,2}), (\d{4})/); if(m && EN_MONTHS[m[1].toLowerCase()]){ out.date=`${m[3]}-${String(EN_MONTHS[m[1].toLowerCase()]).padStart(2,"0")}-${m[2].padStart(2,"0")}`; break } }
  // fase finale: Rango / Nome partecipante / Utente Challonge / Storia Partita, poi righe rango, nome, utente, W/L
  let k=-1; for(let i=0;i<L.length-1;i++) if(L[i]==="Rango" && /^Nome partecipante/.test(L[i+1])){ k=i; break }
  const gStart=L.findIndex((x,i)=>i>k && /^Gruppo /.test(x));
  if(k>=0){
    const end=gStart>k?gStart:L.length; let i=k+1; while(i<end && !/^\d+$/.test(L[i])) i++;
    const rows=[];
    while(i<end){ if(/^\d+$/.test(L[i])){ const r={rank:+L[i], name:L[i+1], user:L[i+2], w:0, l:0}; let j=i+3; while(j<end && /^[WL]$/.test(L[j])){ L[j]==="W"?r.w++:r.l++; j++ } rows.push(r); i=j } else i++ }
    const me=rows.find(r=>isU(r.name)||isU(r.user)); if(me) out.final={...me, size:rows.length}; else if(rows.length) out.finalSize=rows.length;
  }
  // gironi: cerco il mio nome nella sezione di ogni gruppo
  for(let i=0;i<L.length;i++){
    if(!/^Gruppo /.test(L[i])) continue;
    const g=L[i].replace(/^Gruppo\s*/,""); let end=L.findIndex((x,j)=>j>i && /^Gruppo /.test(x)); if(end<0) end=L.length;
    const sec=L.slice(i,end);
    const ni=sec.findIndex(x=>isU(x) || isU(x.replace(/^Avanzate\s+/,"").replace(/\s*\(.*\)$/,"")) || (x.match(/\(([^)]+)\)$/)&&isU(x.match(/\(([^)]+)\)$/)[1])));
    if(ni<0) continue;
    let rank=null; for(let j=ni-1;j>=0;j--){ if(/^\d+$/.test(sec[j])){ rank=+sec[j]; break } }
    let wl=null; for(let j=ni;j<sec.length;j++){ const m=sec[j].match(/^(\d+) - (\d+) - (\d+)$/); if(m){ wl=[+m[1],+m[2],+m[3]]; break } }
    const size=sec.filter(x=>/^\d+ - \d+ - \d+$/.test(x)).length;
    out.group={name:g, rank, size, w:wl?wl[0]:0, l:wl?wl[1]:0};
    break;
  }
  return out;
}
const RANK_EXIT = r => r===1?"winner": r===2?"final": r<=4?"semi": r<=8?"quarti": r<=16?"ottavi": r<=32?"sedicesimi": "exact";
// Dal risultato letto al modulo del torneo, tenendo il deck già inserito
function standingsToForm(P, link){
  if(!P.group && !P.final) return false;
  syncFormTop();
  const keep=form && form.mode!=="edit" ? form.phases : null;
  const keepCombos = keep && keep.some(p=>(p.combos||[]).some(c=>c&&c.blade)) ? keep[0].combos : null;
  const phases=[];
  if(P.group) phases.push({...blankPhase("Girone", keepCombos), stage:"girone", wins:P.group.w, losses:P.group.l});
  if(P.final) phases.push({...blankPhase("Eliminazione diretta", keepCombos), stage:"ko", wins:P.final.w, losses:P.final.l});
  const exit = P.final ? RANK_EXIT(P.final.rank) : "girone";
  form={mode:"import", link:link||"", date:P.date||new Date().toISOString().slice(0,10), event:P.event||"", players:P.players||"",
    exit, place: P.final ? (exit==="exact"?String(P.final.rank):(exitInfo(exit)||[])[2]) : "", topCut:(P.final&&P.final.size)||P.finalSize||16,
    notes: P.group ? `Girone ${P.group.name}${P.group.rank?`, ${P.group.rank}°${P.group.size?` su ${P.group.size}`:""}`:""}` : "", matches:[], phases};
  const wl=phases.reduce((a,p)=>[a[0]+p.wins,a[1]+p.losses],[0,0]);
  chMsg=`Torneo letto: ${wl[0]} vittorie e ${wl[1]} sconfitte${P.final?`, fase finale ${P.final.rank}°`:", fuori ai gironi"}. Aggiungi il deck usato e registra.`;
  return true;
}

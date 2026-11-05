
// ---------- Backup dei dati ----------
function vBackup(){
  return `<section class="panel"><h3>Backup dei dati</h3>
    <p class="small muted">Esporta tutto in un file, per conservarlo o portarlo su un altro dispositivo (anche tra l'app Android e quella dentro Claude). L'importazione unisce il file con i dati che hai già, tenendo per ogni voce la modifica più recente.</p>
    <div class="row"><button class="btn" data-act="bk-export">Esporta i dati</button><label class="btn" for="bk-file">Importa da file</label><input type="file" id="bk-file" accept="application/json,.json" style="position:absolute;width:1px;height:1px;opacity:0;pointer-events:none"></div>
  </section>`;
}
async function exportData(){
  const name=`deck-lab-bbx-${new Date().toISOString().slice(0,10)}.json`;
  const data=JSON.stringify({app:"deck-lab-bbx", v:1, exportedAt:new Date().toISOString(), state:S});
  try{
    if(STANDALONE && window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.Filesystem){
      const {Filesystem, Share}=window.Capacitor.Plugins;
      const w=await Filesystem.writeFile({path:name, data, directory:"CACHE", encoding:"utf8"});
      await Share.share({title:"Backup Deck Lab BBX", url:w.uri, dialogTitle:"Salva o invia il backup"});
      return;
    }
    const dl=window.claude && await window.claude.use("downloads").catch(()=>null);
    if(dl){ await dl.save({filename:name, data}); toast("Backup salvato"); return }
    await navigator.clipboard.writeText(data); toast("Backup copiato negli appunti");
  }catch(e){ if(!(e && (e.code==="declined" || /cancel/i.test(String(e.message||""))))) toast("Esportazione non riuscita") }
}
function importData(file){
  const fr=new FileReader();
  fr.onload=()=>{ try{
      const o=JSON.parse(String(fr.result)); const st=o && (o.state||o);
      if(!st || !Array.isArray(st.parts)) throw new Error("file non valido");
      S=mergeStates(normState(JSON.parse(JSON.stringify(st))), S); rematchAll(); save(); render();
      toast(`Importati ${st.parts.length} pezzi e ${(st.results||[]).length} tornei`);
    }catch(e){ toast("Questo file non è un backup di Deck Lab BBX") } };
  fr.readAsText(file);
}

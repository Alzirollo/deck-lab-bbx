// Costruisce www/ (la pagina dell'app Android) da src/, la stessa app pubblicata dentro Claude:
// src/index.html + src/js/*.js + src/css/app.css. Aggiunge lo scheletro della pagina e il segnale DECKLAB_STANDALONE.
import { readFileSync, writeFileSync, mkdirSync, rmSync, readdirSync, copyFileSync } from "node:fs";
import { transformSync } from "esbuild";
// I telefoni vecchi (es. Android 9 con WebView mai aggiornata) hanno un motore Chrome 60-70:
// il codice viene riscritto in una forma che capiscono, e le funzioni mancanti arrivano da core-js.
const TARGET = "chrome58";
const src = new URL("../src/", import.meta.url), www = new URL("../www/", import.meta.url);
const app = readFileSync(new URL("index.html", src), "utf8");
const page = `<!doctype html>
<html lang="it">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="theme-color" content="#d9501a">
<style>:root{color-scheme:light;padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}body{margin:0;font:14px system-ui,-apple-system,"Segoe UI",sans-serif}img{max-width:100%}[hidden]{display:none!important}</style>
<script>window.DECKLAB_STANDALONE = true;
// Se qualcosa si rompe all'avvio, l'errore compare sullo schermo invece della scritta "caricamento" infinita
(function(){ function show(m){ var d=document.getElementById("boot-err"); if(!d){ d=document.createElement("pre"); d.id="boot-err"; d.style.cssText="white-space:pre-wrap;margin:12px;padding:12px;border:2px solid #c0392b;border-radius:8px;background:#fff;color:#222;font:12px monospace"; (document.body||document.documentElement).appendChild(d) } d.textContent+=m+"\\n" }
  window.addEventListener("error", function(e){ show("Errore: "+e.message+(e.filename?" ("+e.filename.split("/").pop()+":"+e.lineno+")":"")+"\\nNavigatore: "+navigator.userAgent) });
  window.addEventListener("unhandledrejection", function(e){ show("Errore: "+(e.reason&&e.reason.message||e.reason)) });
})();
</script>
<script>
// Il motore supporta gap nei flex? Se no, classe nogap sulla pagina
(function(){ var d=document.createElement("div"); d.style.cssText="display:flex;flex-direction:column;row-gap:1px;position:absolute"; d.appendChild(document.createElement("div")); d.appendChild(document.createElement("div"));
  document.documentElement.appendChild(d); if(d.scrollHeight!==1) document.documentElement.className+=" nogap"; document.documentElement.removeChild(d) })();
</script>
<script src="js/polyfill.js"></script>
</head>
<body>
${app}
</body>
</html>
`;
rmSync(www, { recursive: true, force: true });
mkdirSync(www, { recursive: true });
mkdirSync(new URL("js/", www)); mkdirSync(new URL("css/", www));
for (const f of readdirSync(new URL("js/", src)).filter(f => f.endsWith(".js"))) {
  const out = transformSync(readFileSync(new URL("js/" + f, src), "utf8"), { loader: "js", target: TARGET, sourcefile: f });
  writeFileSync(new URL("js/" + f, www), out.code);
}
let css = readFileSync(new URL("css/app.css", src), "utf8");
// griglie: Chrome prima del 66 conosce solo grid-gap
css = css.replace(/\{([^{}]*display:\s*grid[^{}]*)\}/g, (m, b) => "{" + b.replace(/(^|;)\s*gap:([^;]*)/, "$1gap:$2;grid-gap:$2") + "}");
// spazi tra gli elementi in fila: Chrome prima dell'84 ignora gap nei flex, si usano i margini (classe nogap messa all'avvio)
css += `
.nogap .top>*+*,.nogap .row>*,.nogap .alt>*+*,.nogap .deck-head>*+*{margin-left:0}
.nogap .top>*+*{margin-left:10px}.nogap .brand>*+*{margin-left:8px}.nogap label.chk>*+*{margin-left:8px}
.nogap .row>*{margin:0 10px 8px 0}.nogap .deck-head>*+*,.nogap .alt>*+*{margin-left:12px}
.nogap button.btn>*+*,.nogap a.btn>*+*{margin-left:6px}.nogap .rank .nm>*+*{margin-top:3px}.nogap .wlbar>*+*{margin-left:2px}`;
writeFileSync(new URL("css/app.css", www), transformSync(css, { loader: "css", target: TARGET }).code);
copyFileSync(new URL("../node_modules/core-js-bundle/minified.js", import.meta.url), new URL("js/polyfill.js", www));
writeFileSync(new URL("index.html", www), page);
console.log("www/ pronto");

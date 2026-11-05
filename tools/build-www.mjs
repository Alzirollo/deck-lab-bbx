// Costruisce www/ (la pagina dell'app Android) da src/, la stessa app pubblicata dentro Claude:
// src/index.html + src/js/*.js + src/css/app.css. Aggiunge lo scheletro della pagina e il segnale DECKLAB_STANDALONE.
import { readFileSync, writeFileSync, mkdirSync, rmSync, cpSync } from "node:fs";
const src = new URL("../src/", import.meta.url), www = new URL("../www/", import.meta.url);
const app = readFileSync(new URL("index.html", src), "utf8");
const page = `<!doctype html>
<html lang="it">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="theme-color" content="#d9501a">
<style>:root{color-scheme:light;padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}body{margin:0;font:14px system-ui,-apple-system,"Segoe UI",sans-serif}img{max-width:100%}[hidden]{display:none!important}</style>
<script>window.DECKLAB_STANDALONE = true;</script>
</head>
<body>
${app}
</body>
</html>
`;
rmSync(www, { recursive: true, force: true });
mkdirSync(www, { recursive: true });
cpSync(new URL("js/", src), new URL("js/", www), { recursive: true });
cpSync(new URL("css/", src), new URL("css/", www), { recursive: true });
writeFileSync(new URL("index.html", www), page);
console.log("www/ pronto");

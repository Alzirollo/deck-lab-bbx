// Costruisce www/index.html (la pagina dell'app Android) da src/app.html, la stessa pagina usata dentro Claude.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
const app = readFileSync(new URL("../src/app.html", import.meta.url), "utf8");
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
mkdirSync(new URL("../www/", import.meta.url), { recursive: true });
writeFileSync(new URL("../www/index.html", import.meta.url), page);
console.log("www/index.html pronto");

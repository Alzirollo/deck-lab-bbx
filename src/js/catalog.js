// ---------- Catalogo dei pezzi ----------
// Serve a riconoscere un pezzo dal nome scritto sulla scatola (Hasbro) o da quello giapponese (Takara Tomy)
// e a compilarne da solo tipo, rotazione e ratchet integrato. Fonte: beygear.app/parts e beybladehub.app (novembre 2026).
// Tipi: A attacco, D difesa, S resistenza, B equilibrio.
// Lame: Takara | Hasbro | tipo | L se gira a sinistra | int se ha il ratchet integrato
const CAT_BLADES = "Luster Dragoon||A|L;Sieg Superion|Suppress Superion|B|;Hells Nether|Nether Incendio|B||int;Heavens Ring|Ring Aether|D|;Glory Valkyrie|Glory Valkerion|A||int;Dran Strike|Strike Dran|A|;Bison Burrow|Valor Bison|S||int;Bullet Griffon|Rocket Griffon|B||int;Orochi Cluster|Coil Orochi|A|;Mummy Curse|Curse Mummy|D|;Meteor Dragoon|Meteroid Dragoon|A|L;Clock Mirage|Mirage Clock|S|;Samurai Calibur|Calibur Samurai|B|;Shark Scale|Scale Shark|A|;Tricera Press|Brace Triceratops|D|;Scorpio Spear|Spear Scorpio|B|;Shelter Drake|Shelter Drake|B|;Golem Rock|Rock Golem|D|;Ghost Circle|Circle Ghost|S|;Impact Drake||A|;Knight Mail|Mail Knight|D|;Samurai Saber|Saber Samurai|A|;Crimson Garuda|Scarlet Garuda|B|;Silver Wolf|Sterling Wolf|S|;Whale Wave|Tide Whale|B|;Aero Pegasus||A|;Leon Crest|Crest Leon|D|;Phoenix Rudder|Rudder Phoenix|S|;Black Shell|Obsidian Shell|D|;Cobalt Dragoon|Cobalt Dragoon|A|L;Weiss Tiger|Pearl Tiger|B|;Shinobi Shadow|Shadow Shinobi|D|;Tyranno Beat|Beat Tyranno|A|;Wizard Rod|Wand Wizard|S|;Hells Hammer|Hammer Incendio|B|;Dran Buster|Buster Dran|A|;Sphinx Cowl|Cowl Sphinx|D|;Unicorn Sting|Sting Unicorn|B|;Wyvern Gale|Gale Wyvern|S|;Phoenix Wing|Soar Phoenix|A|;Phoenix Feather|Feather Phoenix|A|;Dran Dagger|Dagger Dran|A|;Dran Sword|Sword Dran|A|;Hells Chain|Chain Incendio|B|;Hells Scythe|Scythe Incendio|B|;Wizard Arrow|Arrow Wizard|S|;Knight Shield|Helm Knight|D|;Knight Lance|Lance Knight|D|;Rhino Horn|Horn Rhino|D|;Shark Edge|Keel Shark|A|;Leon Claw|Claw Leon|B|;Viper Tail|Tail Viper|S|;Cobalt Drake|Cobalt Drake|A|;Shinobi Knife|Knife Shinobi|D|;Samurai Steel|Steel Samurai|B|;Ptera Swing|Talon Ptera|S|;Mammoth Tusk|Tusk Mammoth|B|;Bear Scratch|Savage Bear|D|;Croco Crunch|Bite Croc|A|;Tyranno Roar|Roar Tyranno|A|;Tricera Spiky|Ridge Triceratops|D|;Goat Tackle|Tackle Goat|D|;Shark Gill|Gill Shark|S|;Wyvern Hover|Hover Wyvern|D|;Jaguar Clutch|Seize Jaguar|D|;Cyclops Eye|Glare Cyclops|S|;Crab Clamp|Clamp Crab|S|;Horus Shatter|Shatter Horus|S|;Bat Gust|Gust Bat|B|;Aegis Rampart|Rampart Aegis|D|;Shinobi Shuriken|Cutter Shinobi|B|;Viking Hack|Hack Viking|B|;Medusa Stun|Stun Medusa|D|;Kong Yell|Yell Kong|D|;Driger Slash|Driger Slash|B|;Dranzer Spiral|Dranzer Spiral|B|;Dragoon Storm||A|L;Draciel Shield|Draciel Shield|D|;Storm Pegasis||A|;Rock Leone||D|;Lightning L-Drago||A|L;Storm Spriggan||B|;Victory Valkyrie||A|;Xeno Xcalibur||A|";
// Punte: sigla | nome (/ altri nomi) | tipo
const CAT_BITS = "A|Accel|A;RA|Rubber Accel|A;B|Ball|S;DB|Disk Ball|S;FB|Free Ball|S;GB|Gear Ball/Glide Ball|S;WB|Wall Ball|S;C|Cyclone|A;LC|Low Cyclone|A;D|Dot|D;E|Elevate|B;F|Flat|A;FF|Free Flat|A;GF|Gear Flat/Glide Flat|A;UF|Under Flat|A;LF|Low Flat|A;G|Glide|S;H|Hexa|B;I|Ignition|A;J|Jolt|A;K|Kick|B;TK|Trans Kick/Taper Kick|B;L|Level|A;M|Merge|B;N|Needle|D;HN|High Needle|D;GN|Gear Needle|D;MN|Metal Needle|D;UN|Under Needle|D;Nr|Narrow|S;O|Orb|S;LO|Low Orb|S;P|Point|B;LP|Low Point|B;GP|Gear Point/Glide Point|B;TP|Trans Point/Taper Point|B;Q|Quake|A;R|Rush|A;GR|Gear Rush/Glide Rush|A;LR|Low Rush|A;S|Spike|D;BS|Bound Spike|D;DS|Disk Spike|D;T|Taper|B;MT|Metal Taper|B;HT|High Taper|B;U|Unite|B;GU|Gear Unite/Glide Unite|B;V|Vortex|A;W|Wedge|D;WW|Wall Wedge|D;Y|Yielding|S;Z|Zap|B;Op|Operate|B;Tr|Turbo|A";
// Main blade CX: Takara | Hasbro | tipo
const CAT_MAIN = "Brave|Courage|A;Arc|Arc|S;Dark|Dark|D;Eclipse|Eclipse|B;Hunt|Hunt|S;Flare|Flare|D;Blitz|Blitz|A;Fortress|Armor|D;Rage|Rage|S;Fang|Fang|A;Volt|Volt|A;Blast|Blast|A";
const CAT_KIND = {A:"attacco", D:"difesa", S:"resistenza", B:"equilibrio"};
const CATALOG = (() => {
  const out = [];
  CAT_BLADES.split(";").forEach(r => { const [jp, us, k, sp, int] = r.split("|"); out.push({type:"blade", jp, us:us||"", names:[jp, us].filter(Boolean), kind:CAT_KIND[k], left:sp==="L", integrated:int==="int"}) });
  CAT_BITS.split(";").forEach(r => { const [code, ns, k] = r.split("|"); const names = ns.split("/"); out.push({type:"bit", jp:names[0], us:names[0], code, names, kind:CAT_KIND[k]}) });
  CAT_MAIN.split(";").forEach(r => { const [jp, us, k] = r.split("|"); out.push({type:"mainblade", jp, us, names:[jp, us], kind:CAT_KIND[k]}) });
  return out;
})();
const catKey = s => String(s||"").toLowerCase().replace(/[^a-z0-9]/g, "");
// Le confezioni Hasbro spesso invertono le due parole del nome (Dran Sword / Sword Dran): provo entrambi gli ordini
const catKeys = n => { const w = String(n).trim().split(/\s+/); return [...new Set([catKey(n), catKey(w.slice().reverse().join(" "))])] };
function lev(a, b){ if(a===b) return 0; const m=a.length, n=b.length; if(!m||!n) return m||n; let prev=Array.from({length:n+1},(_,j)=>j);
  for(let i=1;i<=m;i++){ const cur=[i]; for(let j=1;j<=n;j++) cur[j]=Math.min(prev[j]+1, cur[j-1]+1, prev[j-1]+(a[i-1]===b[j-1]?0:1)); prev=cur } return prev[n] }
// Il pezzo del catalogo che corrisponde a un nome (o alla sigla di una punta); tollera un paio di errori di battitura
function catalogMatch(type, name, code){
  const list = CATALOG.filter(c => c.type===type); if(!list.length) return null;
  if(type==="bit" && code){ const c = list.find(x => x.code===code) || list.find(x => x.code.toLowerCase()===String(code).toLowerCase()); if(c) return c }
  if(!name) return null;
  if(type==="bit"){ const c = list.find(x => x.code===String(name).trim()); if(c) return c }
  const keys = catKeys(name);
  let hit = list.find(c => c.names.some(n => catKeys(n).some(k => keys.includes(k)))); if(hit) return hit;
  let best = null, bd = 99;
  for(const c of list) for(const n of c.names) for(const k of catKeys(n)) for(const q of keys){ const d = lev(q, k); if(d < bd){ bd = d; best = c } }
  const len = keys[0].length; return best && len >= 5 && bd <= (len >= 10 ? 2 : 1) ? best : null;
}
// Compila tipo, rotazione, ratchet integrato e sigla della punta dal catalogo. Il tipo scelto a mano (kindSrc "manual") resta.
function autoCatalog(p){
  if(!p || !["blade","bit","mainblade"].includes(p.type)) return p;
  const c = catalogMatch(p.type, p.name, p.code);
  p.cat = c ? c.jp : "";
  if(!c){ if(p.kind && !p.kindSrc) p.kindSrc="manual"; return p } // pezzo sconosciuto: il tipo già scelto resta
  if(p.kindSrc!=="manual") p.kind = c.kind;
  if(c.left) p.left = true;
  if(c.integrated) p.integrated = true;
  if(p.type==="bit" && !p.code) p.code = c.code;
  return p;
}

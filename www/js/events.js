var __defProp = Object.defineProperty;
var __defProps = Object.defineProperties;
var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
var __getOwnPropSymbols = Object.getOwnPropertySymbols;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __propIsEnum = Object.prototype.propertyIsEnumerable;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp.call(b, prop))
      __defNormalProp(a, prop, b[prop]);
  if (__getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(b)) {
      if (__propIsEnum.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    }
  return a;
};
var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
document.getElementById("main").addEventListener("change", (e) => {
  const t = e.target;
  if (t.dataset.dk) {
    const d = S.decks.find((x) => x.id === t.dataset.dk), c = d && d.combos[+t.dataset.i];
    if (c) {
      c[t.dataset.dt === "ratchet" ? "ratchet" : "bit"] = t.value;
      rescoreDeck(d);
      save();
      render();
      toast("Deck aggiornato");
    }
    return;
  }
  if (t.dataset.deckname) {
    const d = S.decks.find((x) => x.id === t.dataset.deckname);
    if (d) {
      d.name = t.value.trim() || d.name;
      save();
      toast("Nome del deck salvato");
    }
    return;
  }
  if (t.id === "tr-solo" || t.id === "tr-alt") {
    const c = trainCur();
    c[t.id === "tr-solo" ? "solo" : "alt"] = t.checked;
    if (t.id === "tr-solo" && !c.first) c.first = "a";
    save();
    render();
    return;
  }
  if (t.id === "bk-file") {
    if (t.files && t.files[0]) importData(t.files[0]);
    t.value = "";
    return;
  }
  if (trainChange(t)) return;
  if (edChange(t)) return;
  if (liveChange(t)) return;
  if (t.dataset.f && t.dataset.id) {
    const p = partById(t.dataset.id);
    if (!p) return;
    const f = t.dataset.f;
    if (["avoid", "integrated", "left"].includes(f)) p[f] = t.checked;
    else if (f === "qty") p.qty = Math.max(0, +t.value || 0);
    else if (f === "kind") {
      if (t.value) {
        p.kind = t.value;
        p.kindSrc = "manual";
      } else delete p.kindSrc;
    } else p[f] = t.value.trim();
    if (["name", "code", "kind"].includes(f)) {
      autoCatalog(p);
      if (f !== "kind" && !p.metaName) p.metaName = matchName(p);
    }
    save();
    render();
    return;
  }
  if (t.id === "np-type") {
    const n = document.getElementById("np-name");
    if (n) n.dataset.ac = t.value;
    const c = document.getElementById("np-code");
    if (c) c.hidden = t.value !== "bit";
    return;
  }
  if (t.id === "rule-bit") {
    S.settings.bitTypeLimit = t.checked;
    aiResult = null;
    save();
    render();
  }
  if (t.id === "pw") {
    S.settings.personalWeight = +t.value;
    save();
    render();
  }
  if (t.id === "ch-user") {
    S.settings.challonge = t.value.trim();
    save();
    render();
  }
  if (t.dataset.slot != null && t.dataset.stype) {
    const sl = slotsOf().map((x) => __spreadValues({}, x || {}));
    const i = +t.dataset.slot, k = t.dataset.stype;
    sl.forEach((x, j) => {
      if (j !== i && x[k] === t.value) delete x[k];
    });
    sl[i][k] = t.value;
    const part = S.parts.find((p) => p.id === t.value);
    if (k === "blade" && part && part.integrated) delete sl[i].ratchet;
    S.settings.slots = sl;
    viewIdx = 0;
    aiResult = null;
    save();
    render();
  }
  if (form && t.dataset.ph != null) {
    const ph = form.phases[+t.dataset.ph];
    if (!ph) return;
    if (t.dataset.cf) {
      ph.combos[+t.dataset.cj] = Object.assign({}, ph.combos[+t.dataset.cj], { [t.dataset.cf]: t.value });
    } else if (t.dataset.pf) {
      ph[t.dataset.pf] = t.dataset.pf === "label" ? t.value : t.value === "" ? "" : Math.max(0, +t.value || 0);
    }
    return;
  }
  if (form && t.dataset.fill != null && t.value) {
    syncFormTop();
    const ph = form.phases[+t.dataset.fill];
    const d = t.value === "best" ? (buildDecks().decks || [])[0] : S.decks.find((x) => x.id === t.value);
    if (ph && d) {
      ph.combos = deckCombos(d);
    }
    render();
  }
});
document.getElementById("main").addEventListener("input", (e) => {
  if (e.target.id === "ai-q") chatDraft = e.target.value;
  if (e.target.id === "pw") {
    const v = document.getElementById("pw-val");
    if (v) v.textContent = e.target.value + "%";
  }
});
document.getElementById("main").addEventListener("keydown", (e) => {
  if (e.target.id === "ai-q" && e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
    e.preventDefault();
    sendChat();
  }
});
document.getElementById("main").addEventListener("submit", (e) => {
  e.preventDefault();
  if (e.target.id === "chat-form") {
    sendChat();
    return;
  }
  if (e.target.id === "add-part") {
    const type = document.getElementById("np-type").value, name = document.getElementById("np-name").value.trim(), code = document.getElementById("np-code").value.trim();
    if (!name) return;
    const existing = S.parts.find((p) => p.type === type && p.name.toLowerCase() === name.toLowerCase());
    if (existing) {
      existing.qty = (+existing.qty || 0) + 1;
      toast(`${name}: ora ne hai ${existing.qty}`);
    } else {
      const names = (meta()[type] || []).map((x) => x[0]);
      const m = names.find((n) => n.toLowerCase() === name.toLowerCase()) || "";
      const p = autoCatalog({ id: uid(), type, name, code: type === "bit" ? code : "", metaName: m, kind: "", qty: 1, avoid: false, note: "" });
      if (!p.metaName) p.metaName = matchName(p);
      S.parts.push(p);
      toast(p.cat ? `Aggiunto: ${name}, riconosciuto come ${p.cat} (${p.kind}${p.integrated ? ", ratchet integrato" : ""}${p.left ? ", gira a sinistra" : ""})` : `Aggiunto: ${name}. Non l'ho trovato nel catalogo: scegli tu il tipo`);
    }
    save();
    render();
    return;
  }
  if (e.target.id === "res-form") {
    syncFormTop();
    const f = form || newForm();
    const phases = f.phases.map((p, i) => __spreadValues({ label: (p.label || "").trim() || (f.phases.length > 1 ? `Deck ${i + 1}` : "Tutto il torneo"), combos: [0, 1, 2].map((j) => {
      const c = (p.combos || [])[j] || {};
      return { blade: c.blade || "", ratchet: c.ratchet || "", bit: c.bit || "" };
    }), wins: +p.wins || 0, losses: +p.losses || 0 }, p.stage ? { stage: p.stage } : {}));
    const r = __spreadProps(__spreadValues({ id: f.id || uid(), link: f.link || "", date: f.date, event: (f.event || "").trim(), place: f.place, exit: f.exit || (f.place ? "exact" : "") }, f.topCut ? { topCut: f.topCut } : {}), { players: f.players, notes: (f.notes || "").trim(), matches: f.matches || [], phases });
    if (!r.event) {
      toast("Scrivi il nome dell'evento");
      return;
    }
    if (r.exit && r.exit !== "exact" && !(f.place && /^\d+$/.test(f.place) && r.exit === "exact")) applyExit(r);
    if (f.mode === "edit") {
      const i = S.results.findIndex((x) => x.id === r.id);
      if (i >= 0) S.results[i] = r;
      else S.results.push(r);
    } else S.results.push(r);
    form = null;
    save();
    render();
    toast(f.mode === "edit" ? "Modifiche salvate" : "Torneo registrato");
  }
});
const top0 = () => window.scrollTo({ top: 0 });
const ACT = {
  "open-perms": () => {
    (async () => {
      try {
        const perm = await window.claude.use("permissions");
        await perm.manage();
        const st = await perm.state("mcp:" + BR);
        browserDenied = st === "denied";
        if (!browserDenied) {
          chMsg = chMsg && "Permesso aggiornato: riprova.";
          metaMsg = metaMsg && "Permesso aggiornato: riprova.";
        }
      } catch (e) {
        toast("Apri il menu dell'app (in alto), poi Permessi");
      }
      render();
    })();
  },
  // viste
  "st-src": (b) => {
    statSrc = b.dataset.k;
    try {
      localStorage.setItem("decklab-statsrc", statSrc);
    } catch (e) {
    }
    render();
  },
  "dk-open": (b) => {
    deckOpen = deckOpen === b.dataset.k ? null : b.dataset.k;
    render();
  },
  "st-open": (b) => {
    statOpen = statOpen === b.dataset.k ? null : b.dataset.k;
    render();
  },
  "go-builder": () => {
    tab = "deck";
    render();
    top0();
  },
  "fold": (b) => {
    fold[b.dataset.key] = !fold[b.dataset.key];
    try {
      localStorage.setItem("decklab-fold", JSON.stringify(fold));
    } catch (e) {
    }
    render();
  },
  // pezzi
  "del-part": (b) => {
    const p = partById(b.dataset.id);
    if (!p) return;
    if (partInUse(p.id)) {
      p.qty = 0;
      p.avoid = true;
      toast(`${p.name} \xE8 nello storico: lo tengo con quantit\xE0 0 ed escluso dai deck`);
    } else S.parts = S.parts.filter((x) => x.id !== p.id);
    save();
    render();
  },
  // builder
  "prev-deck": () => {
    viewIdx = Math.max(0, viewIdx - 1);
    aiResult = null;
    render();
  },
  "next-deck": () => {
    viewIdx++;
    aiResult = null;
    render();
  },
  "show-deck": (b) => {
    viewIdx = +b.dataset.i;
    aiResult = null;
    render();
    top0();
  },
  "unpin": (b) => {
    const sl = slotsOf().map((x) => __spreadValues({}, x || {}));
    delete sl[+b.dataset.slot][b.dataset.stype];
    S.settings.slots = sl;
    viewIdx = 0;
    save();
    render();
  },
  "unpin-all": () => {
    S.settings.slots = [{}, {}, {}];
    viewIdx = 0;
    save();
    render();
  },
  "save-deck": (b) => {
    const d = (window.__decks || [])[+b.dataset.i];
    if (!d) return;
    S.decks.unshift({ id: uid(), name: `${d.combos.map((c) => c.b.name.split(" ")[0]).join(" / ")} \xB7 ${(/* @__PURE__ */ new Date()).toLocaleDateString("it-IT")}`, date: (/* @__PURE__ */ new Date()).toISOString().slice(0, 10), score: d.score, combos: d.combos.map(fromBuilt) });
    save();
    render();
    toast("Deck salvato nella sezione Deck");
  },
  "ask-ai": () => askAI(),
  "chat-stop": () => {
    if (chatCtl) chatCtl.abort();
  },
  "chat-clear": () => {
    chat = [];
    chatErr = "";
    render();
  },
  // deck salvati
  "del-deck": (b) => {
    S.decks = S.decks.filter((d) => d.id !== b.dataset.id);
    save();
    render();
  },
  "use-deck": (b) => useDeck((window.__decks || [])[+b.dataset.i]),
  "use-saved": (b) => useDeck(S.decks.find((x) => x.id === b.dataset.id)),
  // tornei: modulo e storico
  "ph-add": () => {
    syncFormTop();
    if (!form) form = newForm();
    const last = form.phases[form.phases.length - 1];
    if (form.phases.length === 1 && last.label === "Tutto il torneo") last.label = "Prima del cambio";
    form.phases.push(blankPhase(`Dopo il cambio${form.phases.length > 1 ? " " + form.phases.length : ""}`, last.combos));
    render();
  },
  "ph-del": (b) => {
    syncFormTop();
    form.phases.splice(+b.dataset.i, 1);
    if (form.phases.length === 1) form.phases[0].label = "Tutto il torneo";
    render();
  },
  "cancel-res": () => {
    form = null;
    chMsg = "";
    render();
  },
  "edit-res": (b) => {
    const r = S.results.find((x) => x.id === b.dataset.id);
    if (!r) return;
    if ((r.phases || []).some((p) => (p.matches || []).length)) {
      histEdit = r.id;
      ed = null;
      edDeck = null;
      render();
      top0();
      return;
    }
    form = __spreadProps(__spreadValues({ mode: "edit" }, JSON.parse(JSON.stringify(r))), { phases: JSON.parse(JSON.stringify(phasesOf(r))) });
    render();
    top0();
  },
  "del-res": (b) => {
    S.results = S.results.filter((r) => r.id !== b.dataset.id);
    edConfirm = "";
    histOpen = null;
    save();
    render();
    toast("Torneo eliminato");
  },
  "hist-toggle": (b) => {
    histOpen = histOpen === b.dataset.id ? null : b.dataset.id;
    edConfirm = "";
    render();
  },
  "hist-del-ask": (b) => {
    edConfirm = "r:" + b.dataset.id;
    render();
  },
  "hist-nodel": () => {
    edConfirm = "";
    render();
  },
  "import-ch": () => importChallonge(),
  "ch-find": () => STANDALONE ? findMyTournamentsNative() : findMyTournaments(),
  "ch-link": () => {
    const v = (document.getElementById("ch-link") || {}).value;
    STANDALONE ? importFromLinkNative(v) : importFromLink(v);
  },
  "ch-import": (b) => {
    const t = (chList || [])[+b.dataset.i];
    if (t) (STANDALONE ? importFromLinkNative : importFromLink)(t.url);
  },
  "bk-export": () => exportData(),
  // meta
  "reset-meta": () => {
    S.meta = null;
    rematchAll();
    metaMsg = "";
    save();
    render();
    toast("Ripristinati i dati di partenza");
  },
  "mb-update": () => updateFromMetaBeys(),
  "mb-native": () => updateMetaNative()
};
const ACT_GROUPS = [["tr-", trainClick], ["lv-", liveClick], ["ed-", edClick], ["hist-done", edClick]];
function useDeck(d) {
  if (!d) return;
  if (S.live) {
    tab = "tornei";
    liveSetDeck(deckCombos(d));
    top0();
    return;
  }
  if (!form || form.mode === "edit") form = newForm();
  form.phases[form.phases.length - 1].combos = deckCombos(d);
  tab = "tornei";
  render();
  top0();
  toast("Deck inserito nel modulo del torneo");
}
document.getElementById("main").addEventListener("click", (e) => {
  const b = e.target.closest("[data-act]");
  if (!b) return;
  const a = b.dataset.act;
  if (ACT[a]) {
    ACT[a](b);
    return;
  }
  const g = ACT_GROUPS.find(([p]) => a.startsWith(p));
  if (g) g[1](a, b);
});
boot();

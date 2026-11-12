/* TOTENSTILLE – Oberfläche: Anzeige, Speichern, Menü, Ton */
"use strict";

(function () {
  const $ = (s) => document.querySelector(s);
  const wurzel = document.documentElement;
  const KEY = "totenstille.spiel", KEY_E = "totenstille.enden", KEY_O = "totenstille.opt";

  const lager = {
    lies(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
    schreib(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* ohne Speicher spielbar */ } },
    weg(k) { try { localStorage.removeItem(k); } catch (e) { /* egal */ } }
  };

  let G = { id: null, folge: null, cp: null };
  const opt = Object.assign({ ton: false, gr: 0, name: "", job: "" }, lager.lies(KEY_O, {}));
  let gefunden = lager.lies(KEY_E, []);
  if (!Array.isArray(gefunden)) gefunden = [];
  let letztesHp = null;
  const ruhig = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const kopie = (o) => JSON.parse(JSON.stringify(o));
  const sauber = (s, n) => String(s || "").replace(/[\u0000-\u001f<>*|~^@+„“"]/g, "").replace(/\s+/g, " ").trim().slice(0, n);
  const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  const inline = (s) => esc(s).replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>").replace(/\*([^*]+)\*/g, "<em>$1</em>");

  /* ---------- Ton: alles im Browser erzeugt, keine Dateien ---------- */
  const Ton = (function () {
    let ctx = null, haupt, murmel, brummen, pfeifen, pulsTimer = null, modus = "innen", hp = 4;
    const ziel = { murmeln: [1, 0.55, 0], innen: [0.3, 0.5, 0], tunnel: [0.5, 0.8, 0], stille: [0, 0.3, 1] };

    function bauen() {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return false;
      ctx = new AC();
      haupt = ctx.createGain(); haupt.gain.value = 0; haupt.connect(ctx.destination);

      // tiefes Brummen der toten Stadt
      brummen = ctx.createGain(); brummen.gain.value = 0.5;
      const tp = ctx.createBiquadFilter(); tp.type = "lowpass"; tp.frequency.value = 170;
      [[55, "sine", 0.5], [55.7, "sine", 0.45], [82.4, "triangle", 0.1], [110.6, "sine", 0.06]].forEach(([f, typ, g]) => {
        const o = ctx.createOscillator(); o.type = typ; o.frequency.value = f;
        const og = ctx.createGain(); og.gain.value = g;
        o.connect(og); og.connect(tp); o.start();
      });
      tp.connect(brummen); brummen.connect(haupt);

      // das Gemurmel: gefiltertes Rauschen, das im Silbentakt atmet
      const len = ctx.sampleRate * 5, buf = ctx.createBuffer(1, len, ctx.sampleRate), d = buf.getChannelData(0);
      let last = 0;
      for (let i = 0; i < len; i++) { const w = Math.random() * 2 - 1; last = (last + 0.035 * w) / 1.035; d[i] = last * 7; }
      const quelle = ctx.createBufferSource(); quelle.buffer = buf; quelle.loop = true; quelle.start();
      murmel = ctx.createGain(); murmel.gain.value = 0;
      [[340, 2.1, 0.9], [560, 3.3, 0.75], [880, 2.7, 0.5], [1350, 4.3, 0.22], [2100, 3.1, 0.08]].forEach(([f, takt, g]) => {
        const bp = ctx.createBiquadFilter(); bp.type = "bandpass"; bp.frequency.value = f; bp.Q.value = 5;
        const vg = ctx.createGain(); vg.gain.value = g * 0.5;
        const l1 = ctx.createOscillator(); l1.frequency.value = takt;
        const l1g = ctx.createGain(); l1g.gain.value = g * 0.45; l1.connect(l1g); l1g.connect(vg.gain); l1.start();
        const l2 = ctx.createOscillator(); l2.frequency.value = takt * 0.31;
        const l2g = ctx.createGain(); l2g.gain.value = f * 0.2; l2.connect(l2g); l2g.connect(bp.frequency); l2.start();
        quelle.connect(bp); bp.connect(vg); vg.connect(murmel);
      });
      murmel.connect(haupt);

      // das Pfeifen im Ohr, wenn es still wird
      pfeifen = ctx.createGain(); pfeifen.gain.value = 0;
      const p = ctx.createOscillator(); p.type = "sine"; p.frequency.value = 6400; p.connect(pfeifen); p.start();
      pfeifen.connect(haupt);
      return true;
    }

    function setze() {
      if (!ctx) return;
      const [m, b, pf] = ziel[modus] || ziel.innen, t = ctx.currentTime;
      murmel.gain.cancelScheduledValues(t);
      murmel.gain.setTargetAtTime(m * 0.5, t, modus === "stille" ? 0.03 : 1.2);
      brummen.gain.setTargetAtTime(b, t, 0.8);
      pfeifen.gain.setTargetAtTime(pf * 0.0035, t, modus === "stille" ? 0.4 : 0.1);
    }

    function schlag() {
      if (!ctx || ctx.state !== "running") return;
      [0, 0.17].forEach((versatz, i) => {
        const t = ctx.currentTime + versatz;
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.type = "sine"; o.frequency.setValueAtTime(62, t); o.frequency.exponentialRampToValueAtTime(38, t + 0.16);
        g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(i ? 0.5 : 0.75, t + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.24);
        o.connect(g); g.connect(haupt); o.start(t); o.stop(t + 0.3);
      });
    }

    function puls() {
      if (pulsTimer) { clearInterval(pulsTimer); pulsTimer = null; }
      if (!ctx || !opt.ton || hp > 2) return;
      pulsTimer = setInterval(schlag, hp <= 1 ? 720 : 980);
    }

    return {
      an(ein) {
        try {
          if (ein) {
            if (!ctx && !bauen()) return false;
            if (ctx.state === "suspended") ctx.resume();
            haupt.gain.setTargetAtTime(0.55, ctx.currentTime, 0.6);
            setze();
          } else if (ctx) {
            haupt.gain.setTargetAtTime(0, ctx.currentTime, 0.15);
          }
          puls();
          return true;
        } catch (e) { return false; }
      },
      modus(m) { modus = m || "innen"; try { setze(); } catch (e) { /* stumm weiter */ } },
      zustand(n) { hp = n; puls(); },
      aus() { hp = 9; puls(); }
    };
  })();

  /* ---------- Himmel und Kopfleiste ---------- */
  function himmel(p) {
    p = Math.max(0, Math.min(1, p));
    const e = p * p * p;
    const mix = (a, b) => a.map((x, i) => Math.round(x + (b[i] - x) * e)).join(",");
    wurzel.style.setProperty("--h-oben", "rgb(" + mix([11, 15, 24], [27, 35, 52]) + ")");
    wurzel.style.setProperty("--h-unten", "rgb(" + mix([13, 19, 31], [58, 50, 58]) + ")");
    wurzel.style.setProperty("--glut", (0.3 * e).toFixed(3));
  }

  function hud() {
    $("#hud-uhr").textContent = uhr();
    const p = Math.max(0, Math.min(1, S.t / FRIST));
    $("#hud-nacht").style.width = (p * 100).toFixed(1) + "%";
    $("#hud-linie").classList.toggle("knapp", FRIST - S.t <= 60);
    himmel(p);
    $("#hud-ort").innerHTML = (S.kap ? "Kapitel " + S.kap + " · " : "") + "<b>" + esc(S.ort || "") + "</b>";

    const z = $("#hud-zustand");
    let h = '<span class="etikett">Zustand</span>';
    for (let i = 1; i <= S.hpMax; i++) h += '<span class="pip' + (i > S.hp ? " leer" : "") + '"></span>';
    z.innerHTML = h;
    z.setAttribute("aria-label", "Zustand " + S.hp + " von " + S.hpMax);
    z.classList.toggle("schwach", S.hp <= 2);
    if (letztesHp !== null && S.hp < letztesHp && !ruhig) {
      z.classList.remove("treffer"); void z.offsetWidth; z.classList.add("treffer");
    }
    letztesHp = S.hp;
    Ton.zustand(S.hp);

    let g = "";
    ["mara", "walter", "jonas", "lotte"].forEach((w) => {
      if (S.da[w]) g += '<span class="chip">' + NAMEN[w] + "</span>";
      else if (S.tot[w]) g += '<span class="chip weg" title="nicht mehr bei euch">' + NAMEN[w] + "</span>";
    });
    $("#hud-gruppe").innerHTML = g;
  }

  /* ---------- Text ---------- */
  function bogenStatisch() {
    return '<div class="bogen" style="transform:rotate(0.6deg)">' +
      '<div class="bogen-kopf"><span>Erfassungsbogen</span><span>Übergang Ost</span></div>' +
      '<div class="feld"><span class="lab">Name</span><span class="wert">' + esc(S.name) + "</span></div>" +
      '<div class="feld"><span class="lab">Beruf, vorher</span><span class="wert">' + esc(S.job) + "</span></div>" +
      '<div class="feld"><span class="lab">Bissverletzung</span><div class="kreuze"><span class="kreuz rot">ja</span><span class="kreuz gestrichen">nein</span></div></div>' +
      '<span class="stempel">Positiv</span></div>';
  }

  function absatz(t) {
    if (t === "@bogen") return bogenStatisch();
    const c = t.charAt(0);
    if (c === "~") return '<p class="echo">' + inline(t.slice(1)) + "</p>";
    if (c === ">") return '<p class="funk">' + inline(t.slice(1)) + "</p>";
    if (c === "^") return '<p class="schlag">' + inline(t.slice(1)) + "</p>";
    if (c === "+") {
      const teile = t.slice(1).split("|");
      return '<div class="gabe"><small>Was du aus deinem alten Leben mitbringst</small><b>' + esc(teile[0]) + "</b><span>" + esc(teile[1] || "") + "</span></div>";
    }
    return "<p>" + inline(t) + "</p>";
  }

  function fuelle(el, absaetze, start) {
    el.innerHTML = absaetze.map(absatz).join("");
    if (ruhig) return 0;
    let i = 0;
    Array.from(el.children).forEach((k) => {
      k.classList.add("ein");
      k.style.animationDelay = Math.min((start || 0) + i * 70, 1400) + "ms";
      i++;
    });
    return Math.min((start || 0) + i * 70, 1400);
  }

  function knopf(text, klasse, fn) {
    const b = document.createElement("button");
    b.type = "button"; b.className = klasse; b.textContent = text;
    b.addEventListener("click", fn);
    return b;
  }

  function einblenden(el, ms) {
    if (ruhig) return;
    el.classList.add("ein"); el.style.animationDelay = ms + "ms";
  }

  /* ---------- Ablauf ---------- */
  function zeige(welche) {
    $("#titel").hidden = welche !== "titel";
    $("#spiel").hidden = welche !== "spiel";
    $("#schluss").hidden = welche !== "schluss";
    $("#kopf").hidden = welche === "titel";
  }

  function speichern() { lager.schreib(KEY, { v: 1, S, id: G.id, folge: G.folge, cp: G.cp }); }

  function neuesSpiel(name, job) {
    S = neuerStand(name, job);
    G = { id: null, folge: null, cp: null };
    letztesHp = null;
    opt.name = name; opt.job = job; lager.schreib(KEY_O, opt);
    geheZu("prolog");
  }

  function geheZu(id) {
    G.id = betrete(id);
    G.folge = null;
    if (SZ[G.id].cp) G.cp = { S: kopie(S), id: G.id };
    speichern();
    szene(true);
  }

  function szene(nachOben) {
    const d = szeneDaten(G.id);
    if (d.ende) return schluss(d);
    zeige("spiel");
    hud();
    Ton.modus(G.folge && G.folge.klang ? G.folge.klang : d.klang);
    const ms = fuelle($("#text"), d.text, 0);
    const wahlEl = $("#wahl"), folgeEl = $("#folge");
    wahlEl.innerHTML = ""; folgeEl.hidden = true; folgeEl.innerHTML = "";

    if (G.folge) {
      folgeZeigen(false);
    } else if (d.wahlen) {
      d.wahlen.forEach((w, i) => {
        const b = document.createElement("button");
        b.type = "button"; b.className = "opt"; b.dataset.i = i;
        b.innerHTML = '<span class="buchst">' + "ABCD"[i] + '</span><span class="inhalt">' +
          (w.beruf ? '<span class="marke">' + esc(S.job) + "</span>" : "") + inline(w.l) + "</span>";
        b.addEventListener("click", () => waehle(i));
        einblenden(b, ms + 150 + i * 60);
        wahlEl.appendChild(b);
      });
    } else if (d.eingabe) {
      const std = d.eingabe.std(S);
      const kiste = document.createElement("div");
      kiste.className = "band";
      kiste.innerHTML = '<label for="f-band">' + esc(d.eingabe.label) + '</label>' +
        '<input id="f-band" type="text" maxlength="' + d.eingabe.max + '" autocomplete="off" value="' + esc(std) + '">' +
        '<span class="rec">Aufnahme läuft</span>';
      wahlEl.appendChild(kiste);
      const b = knopf(d.wl, "knopf", () => {
        S[d.eingabe.schluessel] = sauber($("#f-band").value, d.eingabe.max) || std;
        geheZu(d.weiter);
      });
      wahlEl.appendChild(b);
      einblenden(kiste, ms + 150); einblenden(b, ms + 250);
    } else if (d.weiter) {
      const b = knopf(d.wl, "knopf", () => geheZu(d.weiter));
      einblenden(b, ms + 150);
      wahlEl.appendChild(b);
    }
    if (nachOben) window.scrollTo(0, 0);
  }

  function folgeZeigen(rollen) {
    const r = G.folge, folgeEl = $("#folge"), wahlEl = $("#wahl");
    wahlEl.innerHTML = "";
    folgeEl.hidden = false;
    fuelle(folgeEl, r.t, 120);
    const kopf = document.createElement("p");
    kopf.className = "gewaehlt"; kopf.innerHTML = "› " + inline(r.label);
    folgeEl.insertBefore(kopf, folgeEl.firstChild);
    if (r.notizen && r.notizen.length) {
      const ul = document.createElement("ul");
      ul.className = "notizen";
      ul.innerHTML = r.notizen.map((n) => "<li>" + esc(n) + "</li>").join("");
      einblenden(ul, 500);
      folgeEl.appendChild(ul);
    }
    const b = knopf("Weiter", "knopf", () => geheZu(r.nx));
    einblenden(b, 600);
    wahlEl.appendChild(b);
    hud();
    if (r.klang) Ton.modus(r.klang);
    if (rollen) kopf.scrollIntoView({ block: "start", behavior: ruhig ? "auto" : "smooth" });
  }

  function waehle(i) {
    if (G.folge) return;
    G.folge = entscheide(G.id, i);
    speichern();
    folgeZeigen(true);
  }

  function endenListe(el) {
    el.innerHTML = ENDEN.map(([id, titel]) => gefunden.includes(id)
      ? '<li class="da">' + esc(titel) + "</li>"
      : "<li>noch nicht erlebt</li>").join("");
  }

  function schluss(d) {
    zeige("schluss");
    hud();
    Ton.modus(d.klang);
    Ton.aus();
    const e = d.ende;
    const neu = !gefunden.includes(e.id);
    if (neu) { gefunden.push(e.id); lager.schreib(KEY_E, gefunden); }
    const titel = (ENDEN.find((x) => x[0] === e.id) || [0, "Ende"])[1];
    const el = $("#schluss");
    const los = schicksale(e.art, e.id);
    const zahlen = bilanz(e.art);
    el.innerHTML =
      '<div><p class="ende-ober">' + (e.art === "tod" ? "Du bist gestorben" : "Ende") + " · " + gefunden.length + " von " + ENDEN.length + " Enden erlebt" + (neu ? " · neu" : "") + "</p>" +
      '<h2 class="ende-titel">' + esc(titel) + "</h2></div>" +
      '<div id="ende-text" class="text"></div>' +
      (los.length ? '<div class="ende-teil"><h3>Was aus ihnen wurde</h3><div class="text">' + los.map(absatz).join("") + "</div></div>" : "") +
      '<div class="ende-teil"><h3>Deine Nacht</h3><dl class="zahlen">' +
      zahlen.map((z) => "<dt>" + esc(z[0]) + "</dt><dd>" + esc(z[1]) + "</dd>").join("") + "</dl></div>" +
      '<div class="ende-teil"><h3>Alle Enden</h3><ul id="ende-liste" class="endenliste"></ul>' +
      '<p class="blatt-hinweis">' + (e.art === "tod" || e.art === "spaet"
        ? "Diese Nacht hat dir noch nicht alles gezeigt. Achte darauf, wie die Echos dich ansehen."
        : "Jetzt, wo du weißt, was du in dir trägst: Spiel die Nacht noch einmal. Jede kleine Geste bedeutet etwas anderes.") + "</p></div>" +
      '<div id="ende-knoepfe" class="knopfreihe"></div>';
    fuelle($("#ende-text"), d.text, 0);
    endenListe($("#ende-liste"));
    const kn = $("#ende-knoepfe");
    kn.appendChild(knopf("Noch eine Nacht", "knopf", () => neuesSpiel(S.name, S.job)));
    if (G.cp) kn.appendChild(knopf("Kapitel " + SZ[G.cp.id].kap + " noch einmal", "knopf zweit", kapitelNeu));
    kn.appendChild(knopf("Zur Titelseite", "knopf zweit", zumTitel));
    window.scrollTo(0, 0);
  }

  function kapitelNeu() {
    if (!G.cp) return;
    S = kopie(G.cp.S); G.id = G.cp.id; G.folge = null; letztesHp = null;
    speichern();
    menuZu();
    szene(true);
  }

  function zumTitel() {
    menuZu();
    Ton.aus();
    Ton.modus("innen");
    titel();
  }

  function titel() {
    zeige("titel");
    himmel(0);
    $("#f-name").value = opt.name || "";
    $("#f-job").value = opt.job || "";
    $("#f-fehler").textContent = "";
    const st = lager.lies(KEY, null);
    const b = $("#btn-weiter-spiel");
    const laeuft = st && st.v === 1 && st.S && st.id && SZ[st.id] && !SZ[st.id].ende;
    b.hidden = !laeuft;
    if (laeuft) {
      const m = (START_MIN + st.S.t) % 1440;
      const zt = String(Math.floor(m / 60)).padStart(2, "0") + ":" + String(m % 60).padStart(2, "0");
      b.textContent = "Weiterspielen · " + (st.S.ort || "Nacht 19") + ", " + zt + " Uhr";
    }
    $("#enden-kopf").textContent = gefunden.length
      ? "Enden · " + gefunden.length + " von " + ENDEN.length + " erlebt"
      : "Acht Enden · noch keines erlebt";
    $("#enden-liste").hidden = !gefunden.length;
    endenListe($("#enden-liste"));
    tonKnoepfe();
    window.scrollTo(0, 0);
  }

  function laden() {
    const st = lager.lies(KEY, null);
    if (!st || st.v !== 1 || !st.S || !SZ[st.id]) return false;
    S = st.S; G = { id: st.id, folge: st.folge || null, cp: st.cp || null };
    letztesHp = null;
    szene(true);
    return true;
  }

  /* ---------- Menü und Ton ---------- */
  function tonKnoepfe() {
    const t = opt.ton ? "Ton ausschalten" : "Ton einschalten";
    $("#btn-ton-titel").textContent = t; $("#m-ton").textContent = t;
  }
  function tonUmschalten() {
    opt.ton = !opt.ton;
    if (!Ton.an(opt.ton)) opt.ton = false;
    lager.schreib(KEY_O, opt);
    tonKnoepfe();
  }
  function schrift(d) {
    opt.gr = Math.max(-1, Math.min(3, (opt.gr || 0) + d));
    wurzel.style.setProperty("--gr", String(1 + opt.gr * 0.09));
    lager.schreib(KEY_O, opt);
  }
  function menuAuf() {
    $("#m-kapitel").hidden = !G.cp;
    if (G.cp) $("#m-kapitel").textContent = "Kapitel " + SZ[G.cp.id].kap + " neu beginnen";
    $("#menu").hidden = false;
    $("#m-zu").focus();
  }
  function menuZu() { $("#menu").hidden = true; }

  /* ---------- Ereignisse ---------- */
  $("#bogen").addEventListener("submit", (ev) => {
    ev.preventDefault();
    const name = sauber($("#f-name").value, 30), job = sauber($("#f-job").value, 40);
    if (!name || !job) {
      $("#f-fehler").textContent = !name
        ? "Ohne Namen lässt dich an der Brücke niemand durch."
        : "Sie fragen dort jeden, was er vorher war. Trag etwas ein.";
      (name ? $("#f-job") : $("#f-name")).focus();
      return;
    }
    if (opt.ton) Ton.an(true);
    neuesSpiel(name, job);
  });
  $("#btn-weiter-spiel").addEventListener("click", () => { if (opt.ton) Ton.an(true); laden(); });
  $("#btn-ton-titel").addEventListener("click", tonUmschalten);
  $("#m-ton").addEventListener("click", tonUmschalten);
  $("#btn-menu").addEventListener("click", menuAuf);
  $("#m-zu").addEventListener("click", menuZu);
  $("#m-kleiner").addEventListener("click", () => schrift(-1));
  $("#m-groesser").addEventListener("click", () => schrift(1));
  $("#m-kapitel").addEventListener("click", kapitelNeu);
  $("#m-titel").addEventListener("click", zumTitel);
  $("#menu").addEventListener("click", (ev) => { if (ev.target.id === "menu") menuZu(); });

  document.addEventListener("keydown", (ev) => {
    if (ev.key === "Escape" && !$("#menu").hidden) return menuZu();
    if (!$("#menu").hidden || $("#spiel").hidden) return;
    const ziel = ev.target && ev.target.tagName;
    if (ziel === "INPUT" || ziel === "TEXTAREA" || ev.metaKey || ev.ctrlKey || ev.altKey) return;
    const opts = document.querySelectorAll("#wahl .opt");
    if (opts.length) {
      const i = "1234".indexOf(ev.key) >= 0 ? "1234".indexOf(ev.key) : "abcd".indexOf(ev.key.toLowerCase());
      if (i >= 0 && i < opts.length) { ev.preventDefault(); waehle(i); }
    } else if ((ev.key === "Enter" || ev.key === " ") && ziel !== "BUTTON") {
      const b = document.querySelector("#wahl .knopf");
      if (b) { ev.preventDefault(); b.click(); }
    }
  });

  /* ---------- Start ---------- */
  wurzel.style.setProperty("--gr", String(1 + (opt.gr || 0) * 0.09));
  opt.ton = false; // Ton braucht nach jedem Laden einen Klick
  function start(daten) {
    if (daten && daten.spiel && daten.spiel.S && SZ[daten.spiel.id]) {
      S = daten.spiel.S; G = { id: daten.spiel.id, folge: daten.spiel.folge || null, cp: daten.spiel.cp || null };
      return szene(false);
    }
    titel();
  }
  const heiss = window.claude && window.claude.hot;
  try { if (heiss && heiss.snapshot) heiss.snapshot(() => ($("#titel").hidden ? { spiel: { S, id: G.id, folge: G.folge, cp: G.cp } } : {})); } catch (e) { /* nur im Viewer vorhanden */ }
  if (heiss && heiss.ready) heiss.ready(start); else start((heiss && heiss.data) || {});

  window.__totenstille = { waehle, geheZu, stand: () => ({ S, G }) }; // für automatische Tests
})();

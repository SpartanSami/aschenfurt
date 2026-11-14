// Statistik eines Durchgangs und Rang am Spielende (angelehnt an klassische Survival-Horror-Auswertungen).
// Gezählt wird echt im Spiel: Spielzeit (nur laufendes Spiel, ohne Menüs), Tode, Schüsse, Treffer,
// Kopftreffer, erledigte Zombies und benutzte Heilmittel. Die Werte werden mit dem Spielstand gesichert
// und bei einem Tod nicht zurückgesetzt.

export function freshStats(from = 'ch1') {
  return { time: 0, deaths: 0, shots: 0, hits: 0, heads: 0, kills: 0, heals: 0, from };
}

export function fmtTime(sec) {
  const s = Math.floor(sec), h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), r = s % 60;
  return (h ? h + ':' + String(m).padStart(2, '0') : String(m)) + ':' + String(r).padStart(2, '0');
}

// Punktzahl aus Zeit, Toden, Trefferquote und Fundstücken; daraus ein Rang S/A/B/C/D
export function rankOf(st, extra = {}) {
  const min = st.time / 60;
  const acc = st.shots ? st.hits / st.shots : 0;
  let score = 100;
  score -= Math.max(0, min - 75) * 0.45;          // bis 75 Minuten kein Abzug
  score -= st.deaths * 8;
  if (st.shots >= 10) score += acc >= 0.7 ? 6 : acc >= 0.5 ? 3 : 0;
  score += Math.min(7.5, (extra.fragments || 0) * 1.5);
  score -= Math.max(0, st.heals - 12) * 1;
  const letter = score >= 96 && st.deaths === 0 ? 'S' : score >= 82 ? 'A' : score >= 65 ? 'B' : score >= 48 ? 'C' : 'D';
  const text = { S: 'Überlebender ohne Fehl', A: 'Kühler Kopf, ruhige Hand', B: 'Durchgekommen', C: 'Mit knapper Not', D: 'Mehr Glück als Verstand' }[letter];
  return { letter, text, score: Math.round(score), acc };
}

// Einstiegspunkt
import { Game } from './game.js';

function boot() {
  const root = document.getElementById('app');
  try {
    const game = new Game(root);
    const p = new URLSearchParams(location.search);
    if (p.get('chapter')) { game.audio.init(); game.startChapter(p.get('chapter')); }
  } catch (e) {
    console.error(e);
    const msg = String((e && e.message) || e).replace(/[<>&]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c]));
    document.getElementById('ui').innerHTML = `<div class="fatal"><h2>Das Spiel konnte nicht gestartet werden</h2><p>${msg}</p><p>WebGL 2 wird benötigt. Bitte einen aktuellen Browser (Chrome, Edge, Firefox) verwenden und Hardwarebeschleunigung aktivieren.</p></div>`;
  }
}
boot();

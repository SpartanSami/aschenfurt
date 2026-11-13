// Dokumentenansicht (Patientenakten, E-Mails, Laborberichte, Notizen). Pausiert das Spiel beim Lesen.
import { DOCS } from '../data/story/documents.js';

export class DocViewer {
  constructor(game, root) {
    this.game = game;
    this.el = document.createElement('div');
    this.el.className = 'doc-view';
    root.appendChild(this.el);
    this.openId = null;
    this.resolve = null;
    // Schließen: Knopf oben rechts, Zeile unten oder Tipp neben das Blatt
    this.el.addEventListener('click', (e) => { if (e.target.closest('.doc-close, .doc-x') || e.target === this.el) this.close(); });
  }
  open(id, o = {}) {
    const d = DOCS[id];
    if (!d) { console.warn('Dokument fehlt', id); return Promise.resolve(); }
    this.openId = id;
    this.game.phone.addDoc(id);
    if (!this.game.state.flags['read:' + id]) { this.game.state.flags['read:' + id] = true; if (!o.fromPhone) this.game.hud.toast('Dokument im Telefon gespeichert'); }
    const body = d.body.split('\n\n').map((p) => p.startsWith('# ') ? `<h4>${p.slice(2)}</h4>` : p.startsWith('> ') ? `<blockquote>${p.slice(2).replace(/\n/g, '<br>')}</blockquote>` : `<p>${p.replace(/\n/g, '<br>').replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/~~(.+?)~~/g, '<s>$1</s>').replace(/\[\[(.+?)\]\]/g, '<span class="redact">$1</span>')}</p>`).join('');
    this.el.innerHTML = `<div class="paper ${d.kind || 'file'}"><button class="doc-x" aria-label="Schließen">✕</button><div class="doc-head"><small>${d.where || ''}</small><h2>${d.title}</h2></div><div class="doc-body">${body}</div><div class="doc-close">${this.game.input.touchMode ? 'Schließen' : '[E] / [Esc] Schließen'}</div></div>`;
    this.el.classList.add('show');
    this.game.audio.play('paper', { vol: 0.6 });
    this.game.setModal('doc');
    if (this.game.state.flags['read:' + id] === true) this.game.story.onEvent('read:' + id);
    return new Promise((res) => { this.resolve = res; });
  }
  isOpen() { return !!this.openId; }
  close() {
    if (!this.openId) return;
    const id = this.openId;
    this.openId = null;
    this.el.classList.remove('show');
    this.game.audio.play('paper', { vol: 0.4, rate: 1.2 });
    this.game.setModal(null);
    this.game.story.onEvent('closed:' + id);
    if (this.resolve) { const r = this.resolve; this.resolve = null; r(); }
  }
  update(input) {
    if (!this.openId) return;
    if (input.pressed('interact') || input.rawPressed('Escape') || input.pressed('phone') || input.rawPressed('Mouse0')) { input.consume('interact'); input.consume('phone'); this.close(); }
    const b = this.el.querySelector('.doc-body');
    if (b) { if (input.down('forward')) b.scrollTop -= 8; if (input.down('back')) b.scrollTop += 8; if (input.wheel) b.scrollTop += input.wheel * 40; }
  }
}

// Prozedural gezeichnete Fotos für die Galerie des Smartphones (keine externen Bilder nötig).

function grain(c, x, y, w, h, a = 0.08) {
  c.save();
  for (let i = 0; i < (w * h) / 40; i++) {
    c.fillStyle = Math.random() < 0.5 ? `rgba(255,255,255,${a})` : `rgba(0,0,0,${a})`;
    c.fillRect(x + Math.random() * w, y + Math.random() * h, 1.2, 1.2);
  }
  c.restore();
}
function person(c, x, y, s, color = '#0a0a0c', hair = false) {
  c.fillStyle = color;
  c.beginPath(); c.ellipse(x, y - s * 0.78, s * 0.12, s * 0.14, 0, 0, Math.PI * 2); c.fill();
  if (hair) { c.beginPath(); c.ellipse(x, y - s * 0.72, s * 0.15, s * 0.2, 0, Math.PI, Math.PI * 2); c.fill(); c.fillRect(x - s * 0.15, y - s * 0.74, s * 0.06, s * 0.25); c.fillRect(x + s * 0.09, y - s * 0.74, s * 0.06, s * 0.25); }
  c.beginPath(); c.moveTo(x - s * 0.22, y); c.quadraticCurveTo(x - s * 0.24, y - s * 0.6, x, y - s * 0.62); c.quadraticCurveTo(x + s * 0.24, y - s * 0.6, x + s * 0.22, y); c.fill();
}

const PHOTOS = {
  lighthouse(c, x, y, w, h) {
    const g = c.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, '#f0a35a'); g.addColorStop(0.55, '#c0605a'); g.addColorStop(0.56, '#3a4a6a'); g.addColorStop(1, '#1a2238');
    c.fillStyle = g; c.fillRect(x, y, w, h);
    c.fillStyle = '#1a1a22'; c.fillRect(x + w * 0.72, y + h * 0.18, w * 0.07, h * 0.45);
    c.fillStyle = '#ffe9a0'; c.fillRect(x + w * 0.72, y + h * 0.16, w * 0.07, h * 0.05);
    c.fillStyle = '#20202a'; c.fillRect(x, y + h * 0.62, w, h * 0.38);
    person(c, x + w * 0.32, y + h * 0.95, h * 0.62, '#0d0d12');
    person(c, x + w * 0.45, y + h * 0.95, h * 0.52, '#0d0d12', true);
    grain(c, x, y, w, h);
  },
  mine_sami(c, x, y, w, h) {
    c.fillStyle = '#121620'; c.fillRect(x, y, w, h);
    for (let i = 0; i < 14; i++) { c.fillStyle = ['#ffcf8a', '#9fb8ff', '#ff8a8a'][i % 3]; c.globalAlpha = 0.5; c.beginPath(); c.arc(x + Math.random() * w, y + Math.random() * h * 0.6, 4 + Math.random() * 10, 0, 7); c.fill(); }
    c.globalAlpha = 1;
    person(c, x + w * 0.38, y + h * 1.05, h * 0.9, '#2a2420');
    person(c, x + w * 0.62, y + h * 1.05, h * 0.82, '#3a2a28', true);
    c.fillStyle = 'rgba(255,255,255,0.85)'; c.font = `${Math.floor(h * 0.09)}px sans-serif`; c.textAlign = 'left'; c.fillText('♥ M.', x + 8, y + h - 10);
    grain(c, x, y, w, h, 0.1);
  },
  badge(c, x, y, w, h) {
    c.fillStyle = '#2a2420'; c.fillRect(x, y, w, h);
    c.save(); c.translate(x + w / 2, y + h / 2); c.rotate(-0.08);
    c.fillStyle = '#eef0f2'; c.fillRect(-w * 0.38, -h * 0.34, w * 0.76, h * 0.68);
    c.fillStyle = '#1e5aa0'; c.fillRect(-w * 0.38, -h * 0.34, w * 0.76, h * 0.14);
    c.fillStyle = '#fff'; c.font = `bold ${Math.floor(h * 0.08)}px sans-serif`; c.textAlign = 'left'; c.fillText('NEXARA PHARMA AG', -w * 0.34, -h * 0.24);
    c.fillStyle = '#888'; c.fillRect(-w * 0.34, -h * 0.14, w * 0.2, h * 0.32);
    c.fillStyle = '#222'; c.font = `${Math.floor(h * 0.075)}px sans-serif`;
    c.fillText('S. YILDIZ', -w * 0.1, -h * 0.06); c.fillText('Systemarchitektur', -w * 0.1, h * 0.04); c.fillText('ARGUS · Halden', -w * 0.1, h * 0.13);
    c.restore(); grain(c, x, y, w, h);
  },
  route1(c, x, y, w, h) {
    c.fillStyle = '#0e1418'; c.fillRect(x, y, w, h);
    c.strokeStyle = '#3a4a5a'; c.lineWidth = 2;
    c.strokeRect(x + w * 0.08, y + h * 0.1, w * 0.84, h * 0.8);
    for (let i = 1; i < 5; i++) { c.beginPath(); c.moveTo(x + w * (0.08 + i * 0.168), y + h * 0.1); c.lineTo(x + w * (0.08 + i * 0.168), y + h * 0.35); c.stroke(); }
    c.strokeStyle = '#ff4a3a'; c.lineWidth = 3; c.setLineDash([6, 4]);
    c.beginPath(); c.moveTo(x + w * 0.15, y + h * 0.25); c.lineTo(x + w * 0.15, y + h * 0.5); c.lineTo(x + w * 0.7, y + h * 0.5); c.lineTo(x + w * 0.7, y + h * 0.8); c.lineTo(x + w * 0.88, y + h * 0.8); c.stroke(); c.setLineDash([]);
    c.fillStyle = '#ff4a3a'; c.font = `bold ${Math.floor(h * 0.08)}px sans-serif`; c.textAlign = 'left'; c.fillText('ITS → TECHNIK → AUFZUG', x + w * 0.1, y + h * 0.97);
  },
  wall017(c, x, y, w, h) {
    c.fillStyle = '#c8ccd0'; c.fillRect(x, y, w, h);
    grain(c, x, y, w, h, 0.15);
    c.strokeStyle = '#3a3a3a'; c.lineWidth = 2; c.font = `bold ${Math.floor(h * 0.22)}px serif`; c.textAlign = 'center';
    c.strokeText('NACH VORNE', x + w / 2, y + h * 0.45);
    c.font = `${Math.floor(h * 0.1)}px serif`; c.strokeText('immer nur nach vorne', x + w / 2, y + h * 0.7);
    for (let i = 0; i < 17; i++) { c.beginPath(); c.moveTo(x + w * 0.1 + i * 8, y + h * 0.82); c.lineTo(x + w * 0.1 + i * 8, y + h * 0.95); c.stroke(); }
  },
  elif(c, x, y, w, h) {
    c.fillStyle = '#d8e0e4'; c.fillRect(x, y, w, h);
    c.fillStyle = '#9ab0c0'; c.fillRect(x, y + h * 0.6, w, h * 0.4);
    person(c, x + w * 0.5, y + h * 1.0, h * 0.85, '#4a3a34', true);
    c.fillStyle = '#e8eef2'; c.fillRect(x + w * 0.56, y + h * 0.78, w * 0.12, h * 0.05);
    c.fillStyle = '#333'; c.font = `${Math.floor(h * 0.05)}px sans-serif`; c.textAlign = 'center'; c.fillText('009', x + w * 0.62, y + h * 0.82);
    grain(c, x, y, w, h, 0.06);
  },
  drawing(c, x, y, w, h) {
    c.fillStyle = '#f4f0e6'; c.fillRect(x, y, w, h);
    c.lineWidth = 3; c.strokeStyle = '#e04a3a'; c.beginPath(); c.arc(x + w * 0.8, y + h * 0.2, h * 0.1, 0, 7); c.stroke();
    c.strokeStyle = '#3a6ad0'; c.beginPath(); c.moveTo(x + w * 0.2, y + h * 0.85); c.lineTo(x + w * 0.2, y + h * 0.5); c.moveTo(x + w * 0.2, y + h * 0.6); c.lineTo(x + w * 0.1, y + h * 0.7); c.moveTo(x + w * 0.2, y + h * 0.6); c.lineTo(x + w * 0.3, y + h * 0.7); c.stroke();
    c.beginPath(); c.arc(x + w * 0.2, y + h * 0.44, h * 0.06, 0, 7); c.stroke();
    c.strokeStyle = '#d03aa0'; c.beginPath(); c.moveTo(x + w * 0.4, y + h * 0.85); c.lineTo(x + w * 0.4, y + h * 0.6); c.stroke(); c.beginPath(); c.arc(x + w * 0.4, y + h * 0.55, h * 0.05, 0, 7); c.stroke();
    c.fillStyle = '#333'; c.font = `${Math.floor(h * 0.1)}px cursive`; c.textAlign = 'left'; c.fillText('Papa + Defne', x + w * 0.45, y + h * 0.92);
  },
  checkpoint(c, x, y, w, h) {
    c.fillStyle = '#10161c'; c.fillRect(x, y, w, h);
    c.strokeStyle = '#4a5a6a'; c.lineWidth = 2;
    c.beginPath(); c.moveTo(x + w * 0.1, y + h * 0.9); c.lineTo(x + w * 0.1, y + h * 0.3); c.lineTo(x + w * 0.6, y + h * 0.3); c.lineTo(x + w * 0.6, y + h * 0.1); c.stroke();
    c.fillStyle = '#e8b04a'; c.fillRect(x + w * 0.55, y + h * 0.06, w * 0.12, h * 0.06);
    c.fillStyle = '#e8b04a'; c.font = `bold ${Math.floor(h * 0.08)}px sans-serif`; c.textAlign = 'left';
    c.fillText('KONTROLLPUNKT NORD', x + w * 0.2, y + h * 0.2);
    c.fillStyle = '#7a8a9a'; c.fillText('Generator · Tor · Brücke', x + w * 0.2, y + h * 0.6);
  },
  cam(c, x, y, w, h) {
    c.fillStyle = '#0a120a'; c.fillRect(x, y, w, h);
    c.fillStyle = '#3a5a3a'; c.fillRect(x + w * 0.2, y + h * 0.3, w * 0.6, h * 0.5);
    person(c, x + w * 0.5, y + h * 0.85, h * 0.5, '#122012');
    c.fillStyle = '#7fbf7f'; c.font = `${Math.floor(h * 0.07)}px monospace`; c.textAlign = 'left'; c.fillText('CAM 04  U1-ITS  04:09', x + 6, y + 14);
    grain(c, x, y, w, h, 0.12);
  },
};

export function drawPhoto(c, id, x, y, w, h) {
  c.save();
  c.beginPath(); c.rect(x, y, w, h); c.clip();
  (PHOTOS[id] || PHOTOS.cam)(c, x, y, w, h);
  c.restore();
}

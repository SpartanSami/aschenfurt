// Schlichte, handgezeichnete SVG-Symbole im Stil eines alten Kupferstichs.

export const ICONS: Record<string, string> = {
  key: '<circle cx="7" cy="12" r="4"/><path d="M11 12h10M17 12v3M20 12v2"/>',
  scroll: '<path d="M6 4h11a2 2 0 0 1 0 4H8v12a2 2 0 1 1-4 0V6a2 2 0 0 1 2-2z"/><path d="M8 8h9v10a2 2 0 0 1-2 2H6"/><path d="M10 12h5M10 15h5"/>',
  book: '<path d="M4 5c3-1 6-1 8 1 2-2 5-2 8-1v14c-3-1-6-1-8 1-2-2-5-2-8-1z"/><path d="M12 6v14"/>',
  letter: '<rect x="3" y="6" width="18" height="12"/><path d="M3 6l9 7 9-7"/><circle cx="12" cy="15" r="1.5"/>',
  ring: '<circle cx="12" cy="14" r="6"/><path d="M9 7l3-4 3 4z"/>',
  vial: '<path d="M10 3h4M11 3v5l-4 9a3 3 0 0 0 3 4h4a3 3 0 0 0 3-4l-4-9V3"/><path d="M8.5 15h7"/>',
  dagger: '<path d="M12 2l2 11h-4z"/><path d="M8 13h8M12 13v5"/><circle cx="12" cy="20" r="1.6"/>',
  toy: '<path d="M6 18l2-6h6l3-4 2 1-1 4-2 1 1 4M8 12l-2-3 2-1"/><path d="M5 20h14"/>',
  talisman: '<path d="M12 3v3"/><path d="M8 8l4-2 4 2-1 9-3 4-3-4z"/><circle cx="12" cy="11" r="1.5"/>',
  musicbox: '<rect x="4" y="9" width="16" height="10"/><path d="M4 9l3-4h10l3 4"/><circle cx="12" cy="14" r="2"/><path d="M20 13h2"/>',
  map: '<path d="M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2z"/><path d="M9 4v14M15 6v14"/>',
  crest: '<path d="M5 4h14v7c0 5-4 8-7 9-3-1-7-4-7-9z"/><circle cx="12" cy="10" r="3"/>',
  candle: '<path d="M10 9h4v11h-4z"/><path d="M12 4c1.5 2 1.5 3 0 4-1.5-1-1.5-2 0-4z"/>',
  bone: '<path d="M6 8a2 2 0 1 1 2-2l8 8a2 2 0 1 1 2 2 2 2 0 1 1-2 2l-8-8a2 2 0 1 1-2-2z"/>',
  herb: '<path d="M12 21V9"/><path d="M12 13c-4 0-6-3-6-6 4 0 6 3 6 6zM12 11c3 0 5-2 5-5-3 0-5 2-5 5z"/>',
  seal: '<circle cx="12" cy="12" r="8"/><path d="M12 4l2.4 7.4H20l-5 3.6 2 6.4-5-4-5 4 2-6.4-5-3.6h5.6z"/>',
  eye: '<path d="M2 12c4-6 16-6 20 0-4 6-16 6-20 0z"/><circle cx="12" cy="12" r="3"/>',
  gem: '<path d="M6 4h12l4 6-10 11L2 10z"/><path d="M2 10h20M9 4l3 17 3-17"/>',
  quest: '<circle cx="12" cy="12" r="8"/><path d="M12 8v5M12 16v.5"/>',
  feather: '<path d="M20 4C10 4 6 10 5 19l2-2c4 0 9-4 13-13z"/><path d="M5 19L14 10"/>',
};

export function icon(name: string): string {
  return `<svg viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round">${ICONS[name] ?? ICONS.quest}</svg>`;
}

export function pathIcon(d: string): string {
  return `<svg viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round"><path d="${d}"/></svg>`;
}

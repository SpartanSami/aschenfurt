import type { SpeakerDef, SpeakerId } from "../types";

export const SPEAKERS: Record<SpeakerId, SpeakerDef> = {
  sami: { name: "Sami", color: "#d8c8b8", voiceHint: "männlich, ruhig, tief, kontrolliert, leicht rau" },
  mine: { name: "Mine", color: "#d07080", voiceHint: "weiblich, dunkel, kontrolliert, samtig" },
  bassem: { name: "Bassem", color: "#d0a050", voiceHint: "männlich, sehr tief, direkt, kehlig" },
  ilyas: { name: "İlyas", color: "#a0b8c8", voiceHint: "männlich, mittel, vorsichtig, analytisch" },
  ysolde: { name: "Ysolde", color: "#e0a8a0", voiceHint: "weiblich, warm, müde, edel" },
  erste: { name: "Der Erste", color: "#ff3a3a", voiceHint: "geschlechtslos, sehr tief, langsam" },
  corvin: { name: "Graf Corvin", color: "#b8a0a0", voiceHint: "männlich, älter, herrisch, voll" },
  anselm: { name: "Anselm", color: "#a8a090", voiceHint: "männlich, ängstlich, dünn" },
  berta: { name: "Berta", color: "#b8b0a0", voiceHint: "weiblich, alt, brüchig" },
  konrad: { name: "Konrad", color: "#c0a080", voiceHint: "männlich, kräftig, misstrauisch" },
  lene: { name: "Lene", color: "#d0c8a0", voiceHint: "Kind, leise" },
  gerold: { name: "Vater Gerold", color: "#a0a0b8", voiceHint: "männlich, alt, entrückt, predigend" },
  malachias: { name: "Prior Malachias", color: "#c09090", voiceHint: "männlich, uralt, flüsternd" },
  nadira: { name: "Nadira", color: "#d0a060", voiceHint: "weiblich, rau, gequält" },
  stimme: { name: "Eine Stimme", color: "#c8a0b0", voiceHint: "weiblich, fern, hallend" },
  erzaehler: { name: "", color: "#c0b8a8", voiceHint: "Erzähler, neutral" },
  dorf: { name: "Dorfbewohner", color: "#a8a090", voiceHint: "männlich, verängstigt" },
  wolf: { name: "Wolfsbund", color: "#c0a060", voiceHint: "männlich, rau" },
  kultist: { name: "Akolyth", color: "#b06060", voiceHint: "männlich, monoton" },
  verlorener: { name: "Verlorener", color: "#909090", voiceHint: "heiser, flüsternd" },
};

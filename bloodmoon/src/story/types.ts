// Datentypen für Story-Inhalte (Dialoge, Quests, Gegenstände, Dokumente ...).

export type SpeakerId =
  | "sami" | "mine" | "bassem" | "ilyas" | "ysolde" | "erste" | "corvin" | "anselm"
  | "berta" | "konrad" | "lene" | "gerold" | "malachias" | "nadira" | "stimme" | "erzaehler"
  | "dorf" | "wolf" | "kultist" | "verlorener";

export interface SpeakerDef {
  name: string;
  color: string;
  /** Empfehlung für die ElevenLabs-Stimme (siehe tools/voice/voices.json) */
  voiceHint: string;
}

export type ItemCategory = "schluessel" | "dokument" | "artefakt" | "phiole" | "quest" | "heilung";

export interface ItemDef {
  id: string;
  name: string;
  desc: string;
  category: ItemCategory;
  icon: string;
  quest?: string;
  usable?: boolean;
}

export type QuestType = "haupt" | "neben" | "erkundung" | "charakter" | "raetsel" | "verborgen";

export interface QuestTask {
  id: string;
  text: string;
  optional?: boolean;
  hidden?: boolean;
}

export interface QuestDef {
  id: string;
  title: string;
  type: QuestType;
  chapter: number;
  desc: string;
  characters: string[];
  requires?: string[];
  tasks: QuestTask[];
  consequences?: string;
  doneText?: string;
}

export interface DocumentDef {
  id: string;
  title: string;
  kind: "brief" | "buch" | "notiz" | "chronik" | "inschrift" | "tagebuch";
  author?: string;
  body: string;
}

export interface MemoryDef {
  id: string;
  title: string;
  chapter: number;
  summary: string;
  interpretation: string;
}

export interface PersonDef {
  id: string;
  name: string;
  role: string;
  entries: { level: number; text: string }[];
}

export interface DChoice {
  text: string;
  next?: string;
  if?: () => boolean;
  do?: () => void;
  tag?: "luege" | "drohung" | "vampir" | "hunger" | "wahrheit" | "mitgefuehl" | "ende" | "frage" | "schweigen";
  once?: boolean;
  hungerMin?: number;
  /** Hinweis, warum die Option fehlt (wird grau angezeigt) */
  lockedHint?: string;
}

export interface DNode {
  speaker: SpeakerId;
  text: string;
  choices?: DChoice[];
  next?: string | (() => string);
  do?: () => void;
  /** Mimik / Gestik der sprechenden Figur */
  mood?: "neutral" | "kalt" | "wuetend" | "traurig" | "aengstlich" | "laechelnd" | "nachdenklich";
}

export interface DialogueDef {
  id: string;
  start: string | (() => string);
  nodes: Record<string, DNode>;
  onEnd?: () => void;
}

export interface LineDef {
  s: SpeakerId;
  t: string;
}

// Gemeinsamer Zugriffspunkt auf alle Spielsysteme (Service Locator).
// Wird von Game beim Start befüllt; Module greifen erst zur Laufzeit darauf zu,
// wodurch zyklische Importe vermieden werden.

import type * as THREE from "three";
import type { GameState } from "./GameState";
import type { Renderer } from "../graphics/Renderer";
import type { AudioManager } from "../audio/AudioManager";
import type { UIManager } from "../ui/UIManager";
import type { PlayerController } from "../player/PlayerController";
import type { PlayerAbilities } from "../player/PlayerAbilities";
import type { PlayerInteraction } from "../player/PlayerInteraction";
import type { QuestSystem } from "../gameplay/QuestSystem";
import type { InventorySystem } from "../gameplay/InventorySystem";
import type { CombatSystem } from "../gameplay/CombatSystem";
import type { DialogueSystem } from "../story/DialogueSystem";
import type { StoryManager } from "../story/StoryManager";
import type { RelationshipSystem } from "../story/RelationshipSystem";
import type { EndingManager } from "../story/EndingManager";
import type { HorrorDirector } from "../horror/HorrorDirector";
import type { LevelManager } from "../world/LevelManager";
import type { SaveManager } from "../save/SaveManager";
import type { Level } from "../world/Level";
import type { Game } from "./Game";

export interface GameContext {
  game: Game;
  state: GameState;
  renderer: Renderer;
  camera: THREE.PerspectiveCamera;
  audio: AudioManager;
  ui: UIManager;
  player: PlayerController;
  abilities: PlayerAbilities;
  interaction: PlayerInteraction;
  quests: QuestSystem;
  inventory: InventorySystem;
  combat: CombatSystem;
  dialogue: DialogueSystem;
  story: StoryManager;
  relations: RelationshipSystem;
  endings: EndingManager;
  horror: HorrorDirector;
  levels: LevelManager;
  save: SaveManager;
  level: Level | null;
  time: number;
  /** true, solange das Spiel aktiv läuft (nicht im Menü/Laden) */
  running: boolean;
}

export const G = {} as GameContext;

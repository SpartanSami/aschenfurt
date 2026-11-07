import type { LevelManager } from "../LevelManager";
import { Ch1Drakenfels } from "./Ch1Drakenfels";

export function registerLevels(lm: LevelManager): void {
  lm.register("ch1_drakenfels", () => new Ch1Drakenfels());
}

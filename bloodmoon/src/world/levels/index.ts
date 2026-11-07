import type { LevelManager } from "../LevelManager";
import { Ch1Drakenfels } from "./Ch1Drakenfels";
import { Ch2Rabenfurt } from "./Ch2Rabenfurt";
import { Ch3Forst } from "./Ch3Forst";

export function registerLevels(lm: LevelManager): void {
  lm.register("ch1_drakenfels", () => new Ch1Drakenfels());
  lm.register("ch2_rabenfurt", () => new Ch2Rabenfurt());
  lm.register("ch3_forst", () => new Ch3Forst());
}

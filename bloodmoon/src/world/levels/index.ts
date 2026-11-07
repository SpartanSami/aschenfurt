import type { LevelManager } from "../LevelManager";
import { Ch1Drakenfels } from "./Ch1Drakenfels";
import { Ch2Rabenfurt } from "./Ch2Rabenfurt";
import { Ch3Forst } from "./Ch3Forst";
import { Ch4Ebon } from "./Ch4Ebon";
import { Ch5Drakenfels } from "./Ch5Drakenfels";
import { Ch6Erste } from "./Ch6Erste";

export function registerLevels(lm: LevelManager): void {
  lm.register("ch1_drakenfels", () => new Ch1Drakenfels());
  lm.register("ch2_rabenfurt", () => new Ch2Rabenfurt());
  lm.register("ch3_forst", () => new Ch3Forst());
  lm.register("ch4_ebon", () => new Ch4Ebon());
  lm.register("ch5_drakenfels", () => new Ch5Drakenfels());
  lm.register("ch6_erste", () => new Ch6Erste());
}

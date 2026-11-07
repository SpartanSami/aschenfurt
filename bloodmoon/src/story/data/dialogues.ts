import type { DialogueDef } from "../types";
import { DIALOGUES_CH1 } from "./dialogues_ch1";
import { DIALOGUES_CH2 } from "./dialogues_ch2";
import { DIALOGUES_CH3 } from "./dialogues_ch3";
import { DIALOGUES_CH4 } from "./dialogues_ch4";
import { DIALOGUES_CH5 } from "./dialogues_ch5";
import { DIALOGUES_CH6 } from "./dialogues_ch6";

export const DIALOGUES: Record<string, DialogueDef> = {
  ...DIALOGUES_CH1,
  ...DIALOGUES_CH2,
  ...DIALOGUES_CH3,
  ...DIALOGUES_CH4,
  ...DIALOGUES_CH5,
  ...DIALOGUES_CH6,
};

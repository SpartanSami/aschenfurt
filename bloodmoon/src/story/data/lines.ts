import type { LineDef } from "../types";
import { LINES_CH1 } from "./lines_ch1";
import { LINES_CH2 } from "./lines_ch2";
import { LINES_CH3 } from "./lines_ch3";
import { LINES_CH4 } from "./lines_ch4";
import { LINES_CH5 } from "./lines_ch5";
import { LINES_CH6 } from "./lines_ch6";

export const LINES: Record<string, LineDef> = {
  "hunger.1": { s: "sami", t: "Trink. Nur ein wenig. Niemand würde es merken." },
  "hunger.2": { s: "sami", t: "Ich höre Herzen schlagen, die ich nicht sehe." },
  "hunger.3": { s: "sami", t: "Wie lange noch, bis ich nicht mehr frage?" },
  "hunger.4": { s: "sami", t: "Der Durst spricht mit meiner Stimme. Das ist das Schlimmste daran." },
  ...LINES_CH1,
  ...LINES_CH2,
  ...LINES_CH3,
  ...LINES_CH4,
  ...LINES_CH5,
  ...LINES_CH6,
};

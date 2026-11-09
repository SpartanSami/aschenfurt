// Kapitelregister
import test from './test.js';
import ch1 from './ch1_hospital.js';
import ch1b from './ch1b_er.js';
import ch2 from './ch2_institute.js';
import ch2b from './ch2b_pump.js';
import ch3 from './ch3_garage.js';
import ch4 from './ch4_subway.js';
import ch4b from './ch4b_passage.js';
import ch5 from './ch5_city.js';
export const CHAPTERS = { test, ch1, ch1b, ch2, ch2b, ch3, ch4, ch4b, ch5 };
export const CHAPTER_ORDER = ['ch1', 'ch2', 'ch3', 'ch4', 'ch5'];
// Vollständige Abfolge inkl. Teilabschnitten (Kapitelauswahl, Debug-Sprung)
export const CHAPTER_SEQ = ['ch1', 'ch1b', 'ch2', 'ch2b', 'ch3', 'ch4', 'ch4b', 'ch5'];

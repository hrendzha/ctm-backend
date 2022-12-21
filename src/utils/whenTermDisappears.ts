import { daysToMilliseconds } from "./daysToMilliseconds";
import { TERM_LEVELS_ARRAY } from "../models";

const DISAPPEARANCE_TERM_DATE_BY_LEVELS = {
  [TERM_LEVELS_ARRAY[0]]: 0,
  [TERM_LEVELS_ARRAY[1]]: daysToMilliseconds(3),
  [TERM_LEVELS_ARRAY[2]]: daysToMilliseconds(6),
  [TERM_LEVELS_ARRAY[3]]: daysToMilliseconds(12),
  [TERM_LEVELS_ARRAY[4]]: daysToMilliseconds(24),
  [TERM_LEVELS_ARRAY[5]]: daysToMilliseconds(48),
  [TERM_LEVELS_ARRAY[6]]: 0,
};

export { DISAPPEARANCE_TERM_DATE_BY_LEVELS };

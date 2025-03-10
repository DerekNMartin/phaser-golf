export type TileTerrain = "trees" | "rough" | "fairway" | "sand" | "water";

export const TERRAIN_ROUGH = 0;
export const TERRAIN_TREES = 1;

export const TERRAIN_FAIRWAY = {
  SINGLE: 4,
  TOP_LEFT: 15,
  TOP_CENTER: 16,
  TOP_RIGHT: 17,
  MIDDLE_LEFT: 30,
  MIDDLE_CENTER: 31,
  MIDDLE_RIGHT: 32,
  BOTTOM_LEFT: 45,
  BOTTOM_CENTER: 46,
  BOTTOM_RIGHT: 47,
} as const;

export const TERRAIN_SAND = {
  SINGLE: 5,
  TOP_LEFT: 18,
  TOP_CENTER: 19,
  TOP_RIGHT: 20,
  MIDDLE_LEFT: 33,
  MIDDLE_CENTER: 34,
  MIDDLE_RIGHT: 35,
  BOTTOM_LEFT: 48,
  BOTTOM_CENTER: 49,
  BOTTOM_RIGHT: 50,
} as const;

export const TERRAIN_WATER = {
  SINGLE: 6,
  TOP_LEFT: 21,
  TOP_CENTER: 22,
  TOP_RIGHT: 23,
  MIDDLE_LEFT: 36,
  MIDDLE_CENTER: 37,
  MIDDLE_RIGHT: 38,
  BOTTOM_LEFT: 51,
  BOTTOM_CENTER: 52,
  BOTTOM_RIGHT: 53,
} as const;

export const TERRAIN_HOLE = {
  SINGLE: 2,
  TOP_LEFT: 24,
  TOP_CENTER: 25,
  TOP_RIGHT: 26,
  MIDDLE_LEFT: 39,
  MIDDLE_CENTER: 40,
  MIDDLE_RIGHT: 41,
  BOTTOM_LEFT: 54,
  BOTTOM_CENTER: 55,
  BOTTOM_RIGHT: 56,
} as const;

export const TERRAIN_BALL = {
  SINGLE: 3,
  TOP_LEFT: 27,
  TOP_CENTER: 28,
  TOP_RIGHT: 29,
  MIDDLE_LEFT: 42,
  MIDDLE_CENTER: 43,
  MIDDLE_RIGHT: 44,
  BOTTOM_LEFT: 57,
  BOTTOM_CENTER: 58,
  BOTTOM_RIGHT: 59,
} as const;

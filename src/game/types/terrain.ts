export type TileTerrain = "trees" | "rough" | "fairway" | "sand" | "water";

export const TERRAIN_HOLE = 0;
export const TERRAIN_BALL = 1;
export const TERRAIN_TREES = 2;
export const TERRAIN_ROUGH = 3;

export const TERRAIN_FAIRWAY = {
  SINGLE: 4,
  TOP_LEFT: 9,
  TOP_CENTER: 10,
  TOP_RIGHT: 11,
  MIDDLE_LEFT: 18,
  MIDDLE_CENTER: 19,
  MIDDLE_RIGHT: 20,
  BOTTOM_LEFT: 27,
  BOTTOM_CENTER: 28,
  BOTTOM_RIGHT: 29,
} as const;

export const TERRAIN_SAND = {
  SINGLE: 5,
  TOP_LEFT: 12,
  TOP_CENTER: 13,
  TOP_RIGHT: 14,
  MIDDLE_LEFT: 21,
  MIDDLE_CENTER: 22,
  MIDDLE_RIGHT: 23,
  BOTTOM_LEFT: 30,
  BOTTOM_CENTER: 31,
  BOTTOM_RIGHT: 32,
} as const;

export const TERRAIN_WATER = {
  SINGLE: 6,
  TOP_LEFT: 15,
  TOP_CENTER: 16,
  TOP_RIGHT: 17,
  MIDDLE_LEFT: 24,
  MIDDLE_CENTER: 25,
  MIDDLE_RIGHT: 26,
  BOTTOM_LEFT: 33,
  BOTTOM_CENTER: 34,
  BOTTOM_RIGHT: 35,
} as const;

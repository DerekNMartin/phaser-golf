import { createNoise2D } from "simplex-noise";
import {
  TileTerrain,
  TERRAIN_BALL,
  TERRAIN_HOLE,
  TERRAIN_FAIRWAY,
  TERRAIN_ROUGH,
  TERRAIN_SAND,
  TERRAIN_TREES,
  TERRAIN_WATER,
} from "../types/terrain";

interface MapScene extends Phaser.Scene {
  map: Phaser.Tilemaps.Tilemap;
}

interface MapTile extends Phaser.Tilemaps.Tile {
  properties: {
    terrain?: TileTerrain;
  };
}

export class Terrain {
  scene: MapScene;
  gameHeight: number;
  gameWidth: number;
  isLoaded: boolean;
  hasHole: boolean;
  hasBall: boolean;
  tiles: MapTile[];
  noiseFn: (x: number, y: number) => number;

  constructor(scene: MapScene) {
    this.scene = scene;
    this.gameHeight = this.scene.map.layer.height;
    this.gameWidth = this.scene.map.layer.width;
    this.isLoaded = false;
    this.tiles = this.scene.map.layer.data.flat();
    this.noiseFn = createNoise2D();
  }

  load() {
    if (this.isLoaded) return;

    // set terrain type
    this.tiles.forEach((tile) => {
      const { x, y } = tile;
      const terrainType = this.getTileType(x, y);
      tile.properties.terrain = terrainType;
    });

    // place orientated tiles
    this.tiles.forEach((tile) => {
      const terrainType = tile.properties.terrain;
      const { x, y } = tile;
      if (terrainType) {
        this.placeTile(x, y, terrainType);
        this.placeHole(x, y, terrainType);
        this.placeBall(x, y, terrainType);
      }
    });

    this.isLoaded = true;
  }

  getNoise(
    x: number,
    y: number,
    noiseFn: (x: number, y: number) => number,
    scale: number = 250
  ): number {
    const octaves = 4;
    let value = 0;
    let amplitude = 1;
    let frequency = 1;
    let maxValue = 0;

    for (let i = 0; i < octaves; i++) {
      value +=
        amplitude * noiseFn((x * frequency) / scale, (y * frequency) / scale);
      maxValue += amplitude;
      amplitude *= 0.5;
      frequency *= 2;
    }

    return value / maxValue;
  }

  getTileType(x: number, y: number): TileTerrain {
    const terrainHeight = this.getNoise(x, y, this.noiseFn, 15);
    if (terrainHeight < 0) return "rough";
    if (terrainHeight < 0.2) return "fairway";
    if (terrainHeight < 0.3) return "sand";
    if (terrainHeight < 0.4) return "water";
    if (terrainHeight < 0.5) return "trees";
    return "trees";
  }

  placeHole(x: number, y: number, terrainType: TileTerrain) {
    // Place hole on upper 85% of game
    if (
      !this.hasHole &&
      y < this.gameHeight * 0.5 &&
      x > this.gameWidth / 2 &&
      terrainType === "fairway"
    ) {
      this.scene.map.putTileAt(TERRAIN_HOLE, x, y);
      this.hasHole = true;
    }
  }

  placeBall(x: number, y: number, terrainType: TileTerrain) {
    // Place ball on lower 85% of game
    if (
      !this.hasBall &&
      y > this.gameHeight * 0.85 &&
      x > 0 &&
      terrainType === "fairway"
    ) {
      this.scene.map.putTileAt(TERRAIN_BALL, x, y);
      this.hasBall = true;
    }
  }

  placeTile(x: number, y: number, terrainType: TileTerrain) {
    const tileIndex = this.getTileIndex(x, y, terrainType);
    this.scene.map.putTileAt(tileIndex, x, y);
  }

  getTileAt(x: number, y: number) {
    return this.tiles.find((tile) => tile.x === x && tile.y === y);
  }

  getBitmask(x: number, y: number, terrainType: TileTerrain) {
    let bitmask = 0;

    const check = (dx: number, dy: number, value: number) => {
      const neighbor = this.getTileAt(x + dx, y + dy);
      if (neighbor && neighbor.properties.terrain === terrainType) {
        bitmask += value;
      }
    };

    check(0, -1, 2); // Top
    check(-1, 0, 8); // Left
    check(1, 0, 16); // Right
    check(0, 1, 64); // Bottom

    return bitmask;
  }

  // Get the correct orientation tile index
  getTileIndex(x: number, y: number, terrainType: TileTerrain) {
    if (terrainType === "trees") return TERRAIN_TREES;
    if (terrainType === "rough") return TERRAIN_ROUGH;
    const terrainMapping = {
      fairway: TERRAIN_FAIRWAY,
      sand: TERRAIN_SAND,
      water: TERRAIN_WATER,
    };
    const terrainTileIndex =
      terrainMapping[terrainType as keyof typeof terrainMapping];
    const TILE_TYPES = {
      0: terrainTileIndex.SINGLE, // No neighbors
      2: terrainTileIndex.BOTTOM_CENTER, // Only top
      8: terrainTileIndex.MIDDLE_RIGHT, // Only left
      10: terrainTileIndex.BOTTOM_RIGHT, // Top & Left
      16: terrainTileIndex.MIDDLE_LEFT, // Only right
      18: terrainTileIndex.BOTTOM_LEFT, // Top & Right
      24: terrainTileIndex.MIDDLE_CENTER, // Left & Right
      26: terrainTileIndex.MIDDLE_CENTER, // Top, Left, Right
      64: terrainTileIndex.TOP_CENTER, // Only bottom
      66: terrainTileIndex.MIDDLE_CENTER, // Top & Bottom
      72: terrainTileIndex.TOP_RIGHT, // Left & Bottom
      80: terrainTileIndex.TOP_LEFT, // Right & Bottom
      74: terrainTileIndex.MIDDLE_CENTER, // Top, Bottom, Left
      82: terrainTileIndex.MIDDLE_CENTER, // Top, Bottom, Right
      88: terrainTileIndex.MIDDLE_CENTER, // Left, Right, Bottom
      90: terrainTileIndex.MIDDLE_CENTER, // Top, Left, Right, Bottom
      255: terrainTileIndex.MIDDLE_CENTER, // Surrounded completely
    };
    const bitmask = this.getBitmask(x, y, terrainType);
    return (
      TILE_TYPES[bitmask as keyof typeof TILE_TYPES] || terrainTileIndex.SINGLE
    );
  }
}

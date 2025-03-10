import {
  Game,
  FAIRWAY_HIT_AUDIO_KEY,
  ROUGH_HIT_AUDIO_KEY,
  SAND_HIT_AUDIO_KEY,
  PUTT_HIT_AUDIO_KEY,
  CHEER_AUDIO_KEY,
} from "../scenes/Game";
import { TileTerrain } from "../types/terrain";
import { DICE_DATA_KEY } from "./DiceManager";

export class GameManager {
  private static instance: GameManager;
  scene: Game;
  selectedTile: Phaser.Tilemaps.Tile | null;

  constructor(scene: Game) {
    this.scene = scene;
  }

  public static getInstance(scene: Game): GameManager {
    if (!GameManager.instance) {
      GameManager.instance = new GameManager(scene);
    }
    // update scene data, accounts for missing layer data
    if (scene) GameManager.instance.scene = scene;
    return GameManager.instance;
  }

  isValidMove(x?: number | null, y?: number | null) {
    if (x == null || y == null || !this.selectedTile) return false;
    const pointerTile = this.scene.map.getTileAt(x, y);
    const pointerTileTerrain = pointerTile?.properties.terrain;
    const selectedTileTerrain = this.selectedTile.properties.terrain;
    const distance = this.scene.data.get(DICE_DATA_KEY);

    const lineTiles = this.scene.map.getTilesWithinShape(
      this.scene.markerDistanceLine.line.geom
    );
    const hasTrees = lineTiles?.some(
      (tile) => tile.properties.terrain === "trees"
    );

    // Dice roll is the allowable distance to move
    const isValidDistance =
      !(x === this.selectedTile.x && y === this.selectedTile.y) && // not itself
      ((Math.abs(x - this.selectedTile.x) === distance &&
        y === this.selectedTile.y) || // Horizontal
        (Math.abs(y - this.selectedTile.y) === distance &&
          x === this.selectedTile.x) || // Vertical
        (Math.abs(x - this.selectedTile.x) === distance &&
          Math.abs(y - this.selectedTile.y) === distance)); // Diagonal

    // Cannot land on water tiles
    const isValidTerrain = pointerTileTerrain !== "water";

    // Cannot land on trees, and hit cannot travel over trees unless on fairway
    const isTrees =
      pointerTileTerrain === "trees" ||
      (selectedTileTerrain !== "fairway" &&
        selectedTileTerrain !== undefined &&
        hasTrees);

    return isValidTerrain && isValidDistance && !isTrees;
  }

  hitBall(
    tileX?: number | null,
    tileY?: number | null,
    onHit?: (result: { isWin: boolean }) => void
  ) {
    if (this.isValidMove(tileX, tileY)) {
      this.playSound(this.selectedTile?.properties.terrain);
      this.selectedTile = this.scene.map.getTileAt(tileX, tileY);
      const isWin = this.isWinningHole(tileX, tileY);
      if (isWin) this.scene.sound.play(CHEER_AUDIO_KEY);
      if (onHit) onHit({ isWin });
    }
  }

  isWinningHole(tileX: number, tileY: number) {
    if (!this.scene.hole) return false;
    return this.scene.hole.x === tileX && this.scene.hole.y === tileY;
  }

  playSound(terrainType: TileTerrain) {
    const isPutt = this.scene.data.get(DICE_DATA_KEY) === 1;
    const soundMap = {
      fairway: FAIRWAY_HIT_AUDIO_KEY,
      rough: ROUGH_HIT_AUDIO_KEY,
      sand: SAND_HIT_AUDIO_KEY,
    };
    const soundKey = isPutt
      ? PUTT_HIT_AUDIO_KEY
      : soundMap[terrainType as keyof typeof soundMap];
    this.scene.sound.play(soundKey);
  }
}

import { Game } from "../scenes/Game";
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

  isValidMove(x: number | null, y: number | null) {
    if (x == null || y == null) return;
    if (!this.selectedTile) return;
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
}

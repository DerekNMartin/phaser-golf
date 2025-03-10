import { EventBus } from "../EventBus";
import { Scene } from "phaser";
import { Terrain } from "../utils/TerrainGenerator";
import { ShotMarker } from "../objects/ShotMarker";
import { GameManager } from "../utils/GameManager";
import { ShotDistanceLine } from "../objects/ShotDistanceLine";

type TileTerrain = "trees" | "rough" | "fairway" | "sand" | "water";

const MARKER_VALID_COLOUR = 0x91db69;
const MARKER_INVALID_COLOUR = 0xb33831;

export class Game extends Scene {
  camera: Phaser.Cameras.Scene2D.Camera;
  strokeText: Phaser.GameObjects.Text;
  diceText: Phaser.GameObjects.Text;
  map: Phaser.Tilemaps.Tilemap;
  marker: ShotMarker;
  markerDistanceLine: ShotDistanceLine;
  hole: Phaser.Tilemaps.Tile | null;
  ball: Phaser.Tilemaps.Tile | null;
  generatedTerrain: Terrain;
  gameManager: GameManager;

  constructor() {
    super("Game");
  }

  preload() {
    this.load.image("tiles", "assets/tilesets/terrain.png");
  }

  create() {
    this.map = this.make.tilemap({
      height: 26,
      width: 16,
      tileHeight: 32,
      tileWidth: 32,
    });

    const tiles = this.map.addTilesetImage("course", "tiles");
    const layer = this.map.createBlankLayer("blank", tiles);

    this.generateCourseTerrain();
    this.gameManager = GameManager.getInstance(this);

    this.cameras.main.setBounds(
      0,
      0,
      this.map.widthInPixels,
      this.map.heightInPixels
    );

    this.ball = this.map.findTile((tile) => tile.index === 1);
    this.hole = this.map.findTile((tile) => tile.index === 0);

    this.data.set("strokes", [{ x: this.ball?.x, y: this.ball.y }]);

    this.gameManager.selectedTile = this.map.getTileAt(
      this.ball?.x,
      this.ball?.y
    );

    this.marker = new ShotMarker(
      this,
      this.ball?.pixelX,
      this.ball?.pixelY,
      this.map.tileWidth,
      this.map.tileHeight
    );
    this.marker.create();

    this.markerDistanceLine = new ShotDistanceLine(this);
    this.markerDistanceLine.create();

    this.strokeText = this.add.text(
      0,
      this.map.heightInPixels,
      "Strokes: 0/6",
      {
        fontSize: "18px",
        padding: { x: 8, y: 8 },
        color: "#000000",
        backgroundColor: "#FFFFFF",
      }
    );
    this.strokeText.setScrollFactor(0);

    this.diceText = this.add.text(
      this.strokeText.width,
      this.map.heightInPixels,
      "Roll: 0",
      {
        fontSize: "18px",
        padding: { x: 8, y: 8 },
        color: "#000000",
        backgroundColor: "#FFFFFF",
      }
    );
    this.diceText.setScrollFactor(0);
    this.diceRoll();

    const putterButtonText = this.add
      .text(this.map.widthInPixels - 80, this.map.heightInPixels, "Putt", {
        fontSize: "18px",
        color: "#ffffff",
      })
      .setOrigin(-0.5)
      .setDepth(1);

    const putterButton = this.add
      .rectangle(putterButtonText.x, putterButtonText.y, 80, 50, 0x000000)
      .setInteractive()
      .setOrigin(0, 0)
      .on("pointerdown", () => {
        this.data.set("dice", 1);
        this.setDiceText(1);
      })
      .on("pointerover", () => putterButton.setFillStyle(0x333333))
      .on("pointerout", () => putterButton.setFillStyle(0x000000));

    this.input.on("pointerdown", (event) => {
      const selectedTileX = this.map.worldToTileX(event.x);
      const selectedTileY = this.map.worldToTileY(event.y);
      if (this.isValidMove(selectedTileX, selectedTileY)) {
        this.gameManager.selectedTile = this.map.getTileAt(
          selectedTileX,
          selectedTileY
        );
        this.updateStrokes(selectedTileX, selectedTileY);
        this.drawStrokeMarker(selectedTileX, selectedTileY);
        if (this.isWinningHole(selectedTileX, selectedTileY)) {
          this.winGame();
        }
        this.diceRoll();
      }
    });

    EventBus.emit("current-scene-ready", this);
  }

  update(time, delta) {
    const worldPoint = this.input.activePointer.positionToCamera(
      this.cameras.main
    );
    // Rounds down to nearest tile
    const pointerTileX = this.map.worldToTileX(worldPoint.x) || 0;
    const pointerTileY = this.map.worldToTileY(worldPoint.y) || 0;
    this.marker.update(pointerTileX, pointerTileY);
    const selectedTile = this.gameManager.selectedTile;
    this.markerDistanceLine.update(pointerTileX, pointerTileY, selectedTile);
  }

  isWinningHole(tileX: number, tileY: number) {
    return this.hole.x === tileX && this.hole.y === tileY;
  }

  isValidMove(x?: number | null, y?: number | null) {
    return this.gameManager.isValidMove(x, y);
  }

  updateStrokes(tileX: number | null, tileY: number | null) {
    const newStrokes = this.data.get("strokes");
    newStrokes.push({ x: tileX, y: tileY });
    this.data.set("strokes", newStrokes);
    this.strokeText.setText(
      `Strokes: ${this.data.get("strokes").length - 1}/6`
    );
  }

  drawStrokeMarker(tileX: number | null, tileY: number | null) {
    const strokesPath = this.add.graphics();
    strokesPath.setDefaultStyles({
      lineStyle: {
        width: 4,
        color: 0xffffff,
        alpha: 1,
      },
    });
    const tileCenter = this.map.tileWidth / 2;
    const strokeWorldPath = this.data.get("strokes").map(({ x, y }) => ({
      x: this.map.tileToWorldX(x) + tileCenter,
      y: this.map.tileToWorldX(y) + tileCenter,
    }));
    strokesPath.strokePoints(strokeWorldPath);

    this.add.circle(
      this.map.tileToWorldX(tileX) + tileCenter,
      this.map.tileToWorldX(tileY) + tileCenter,
      8,
      0xffffff
    );
  }

  diceRoll() {
    const selectedTileTerrain: TileTerrain =
      this.gameManager.selectedTile?.properties.terrain;
    const additional =
      selectedTileTerrain === "fairway"
        ? 1
        : selectedTileTerrain === "sand"
        ? -1
        : 0;
    const roll = 1 + Math.floor(Math.random() * 6);
    this.data.set("dice", roll + additional);
    this.setDiceText(roll, additional);
  }

  setDiceText(roll: number, additional: number = 0) {
    this.diceText.setText(
      `Roll: ${roll} ${additional < 0 ? "-1" : additional > 0 ? "+1" : ""}`
    );
  }

  generateCourseTerrain() {
    this.generatedTerrain = new Terrain(this);
    this.generatedTerrain.load();
  }

  winGame() {
    this.changeScene();
  }

  changeScene() {
    this.scene.start("GameOver");
  }
}

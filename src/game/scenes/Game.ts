import { EventBus } from "../EventBus";
import { Scene } from "phaser";
import { Terrain } from "../utils/TerrainGenerator";
import { ShotMarker } from "../objects/ShotMarker";
import { GameManager } from "../utils/GameManager";
import { ShotDistanceLine } from "../objects/ShotDistanceLine";
import { StrokeManager } from "../utils/StrokeManager";
import { DiceManager } from "../utils/DiceManager";

export class Game extends Scene {
  camera: Phaser.Cameras.Scene2D.Camera;
  strokeManager: StrokeManager;
  map: Phaser.Tilemaps.Tilemap;
  marker: ShotMarker;
  markerDistanceLine: ShotDistanceLine;
  hole: Phaser.Tilemaps.Tile | null;
  ball: Phaser.Tilemaps.Tile | null;
  generatedTerrain: Terrain;
  gameManager: GameManager;
  diceManager: DiceManager;

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
    this.gameManager = GameManager.getInstance(this);

    this.cameras.main.setBounds(
      0,
      0,
      this.map.widthInPixels,
      this.map.heightInPixels
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

    this.strokeManager = new StrokeManager(this);
    this.strokeManager.create(0, this.map.heightInPixels);

    this.diceManager = new DiceManager(this);
    this.diceManager.create(
      this.strokeManager.strokeText.width,
      this.map.heightInPixels
    );

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
        this.diceManager.updateDice(1);
      })
      .on("pointerover", () => putterButton.setFillStyle(0x333333))
      .on("pointerout", () => putterButton.setFillStyle(0x000000));

    this.newCourse();

    this.input.on("pointerdown", (event) => {
      const selectedTileX = this.map.worldToTileX(event.x);
      const selectedTileY = this.map.worldToTileY(event.y);
      if (this.isValidMove(selectedTileX, selectedTileY)) {
        this.gameManager.selectedTile = this.map.getTileAt(
          selectedTileX,
          selectedTileY
        );
        this.strokeManager.updateStrokes(selectedTileX, selectedTileY);
        this.strokeManager.drawStrokeMarker(selectedTileX, selectedTileY);
        if (this.isWinningHole(selectedTileX, selectedTileY)) {
          this.winGame();
        }
        this.diceManager.diceRoll();
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

  generateCourseTerrain() {
    this.generatedTerrain = new Terrain(this);
    this.generatedTerrain.load();
  }

  winGame() {
    this.newCourse();
  }

  changeScene() {
    this.scene.start("GameOver");
  }

  newCourse() {
    this.generateCourseTerrain();
    this.ball = this.map.findTile((tile) => tile.index === 1);
    this.hole = this.map.findTile((tile) => tile.index === 0);

    this.strokeManager.resetStrokes();

    this.gameManager.selectedTile = this.map.getTileAt(
      this.ball?.x,
      this.ball?.y
    );

    this.diceManager.diceRoll();
  }
}

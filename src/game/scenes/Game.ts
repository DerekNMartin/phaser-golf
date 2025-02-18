import { EventBus } from "../EventBus";
import { Scene } from "phaser";

type TileTerrain = "trees" | "rough" | "fairway" | "sand" | "water";

const MARKER_VALID_COLOUR = 0x91db69;
const MARKER_INVALID_COLOUR = 0xb33831;

export class Game extends Scene {
  camera: Phaser.Cameras.Scene2D.Camera;
  strokeText: Phaser.GameObjects.Text;
  diceText: Phaser.GameObjects.Text;
  selectedTile: Phaser.Tilemaps.Tile | null;
  map: Phaser.Tilemaps.Tilemap;
  marker: Phaser.GameObjects.Rectangle;
  markerDistanceLine: Phaser.GameObjects.Line;
  hole: Phaser.Tilemaps.Tile | null;
  ball: Phaser.Tilemaps.Tile | null;

  constructor() {
    super("Game");
  }

  preload() {
    this.load.image("tiles", "assets/tilesets/terrain.png");
    this.load.tilemapTiledJSON("map", "public/assets/maps/course.json");
  }

  create() {
    this.map = this.make.tilemap({ key: "map" });

    const tiles = this.map.addTilesetImage("course", "tiles");
    const layer = this.map.createLayer("Ground", tiles, 0, 0);

    this.cameras.main.setBounds(
      0,
      0,
      this.map.widthInPixels,
      this.map.heightInPixels
    );

    this.ball = this.map.findTile((tile) => tile.index === 2);
    this.hole = this.map.findTile((tile) => tile.index === 1);

    this.selectedTile = this.map.getTileAt(this.ball?.x, this.ball?.y);

    this.data.set("strokes", [{ x: this.ball?.x, y: this.ball.y }]);

    this.marker = this.add
      .rectangle(
        this.ball?.pixelX,
        this.ball?.pixelY,
        this.map.tileWidth,
        this.map.tileHeight
      )
      .setOrigin(0, 0)
      .setStrokeStyle(3, MARKER_INVALID_COLOUR, 1);

    this.markerDistanceLine = this.add
      .line()
      .setStrokeStyle(1, 0xffffff, 0.5)
      .setLineWidth(3)
      .setOrigin(0, 0);

    this.tweens.add({
      targets: this.marker,
      scale: 1.1,
      x: this.marker.x - this.marker.width * 0.05, // Shift left
      y: this.marker.y - this.marker.height * 0.05, // Shift up
      yoyo: true,
      repeat: -1,
      duration: 300,
      ease: "Sine.easeInOut",
    });

    this.strokeText = this.add.text(0, this.map.heightInPixels, "Strokes: 0", {
      fontSize: "18px",
      padding: { x: 8, y: 8 },
      color: "#000000",
      backgroundColor: "#FFFFFF",
    });
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
        this.selectedTile = this.map.getTileAt(selectedTileX, selectedTileY);
        this.updateStrokes(selectedTileX, selectedTileY);
        this.drawStrokeMarker(selectedTileX, selectedTileY);
        if (this.isWinningHole(selectedTileX, selectedTileY)) {
          this.changeScene();
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

    const offsetX = (this.marker.width * (this.marker.scaleX - 1)) / 2;
    const offsetY = (this.marker.height * (this.marker.scaleY - 1)) / 2;

    if (this.isValidMove(pointerTileX, pointerTileY)) {
      this.marker.setStrokeStyle(3, MARKER_VALID_COLOUR, 1);
    } else {
      this.marker.setStrokeStyle(3, MARKER_INVALID_COLOUR, 1);
    }

    if (pointerTileX >= 0 && pointerTileY >= 0) {
      this.marker.setPosition(
        this.map.tileToWorldX(pointerTileX) - offsetX,
        this.map.tileToWorldY(pointerTileY) - offsetY
      );
    }
    // Snap to tile coordinates, but in world space

    const dx = pointerTileX - this.selectedTile?.x; // X direction
    const dy = pointerTileY - this.selectedTile?.y; // Y direction
    const stepX = dx === 0 ? 0 : dx / Math.abs(dx); // Normalize to -1, 0, or 1
    const stepY = dy === 0 ? 0 : dy / Math.abs(dy);
    const targetX = this.selectedTile?.x + stepX * this.data.get("dice");
    const targetY = this.selectedTile?.y + stepY * this.data.get("dice");

    this.markerDistanceLine.setTo(
      this.selectedTile?.getCenterX(),
      this.selectedTile?.getCenterY(),
      this.map.tileToWorldX(targetX) + 16,
      this.map.tileToWorldY(targetY) + 16
    );
  }

  isWinningHole(tileX: number, tileY: number) {
    return this.hole.x === tileX && this.hole.y === tileY;
  }

  isValidMove(x?: number | null, y?: number | null) {
    if (x == null || y == null) return;
    if (!this.selectedTile) return;
    const pointerTile = this.map.getTileAt(x, y);
    const pointerTileTerrain = pointerTile?.properties.terrain;
    const selectedTileTerrain = this.selectedTile.properties.terrain;
    const distance = this.data.get("dice");

    const lineTiles = this.map.getTilesWithinShape(
      this.markerDistanceLine.geom
    );
    const hasTrees = lineTiles?.some(
      (tile) => tile.properties.terrain === "trees"
    );

    // Dice roll is the allowable distance to move
    const isValidDistance =
      !(x === this.selectedTile.x && y === this.selectedTile.y) &&
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

  updateStrokes(tileX: number | null, tileY: number | null) {
    const newStrokes = this.data.get("strokes");
    newStrokes.push({ x: tileX, y: tileY });
    this.data.set("strokes", newStrokes);
    this.strokeText.setText(`Strokes: ${this.data.get("strokes").length - 1}`);
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
    const selectedTileTerrain = this.selectedTile?.properties.terrain;
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

  winGame() {
    this.changeScene();
  }

  changeScene() {
    this.scene.start("GameOver");
  }
}

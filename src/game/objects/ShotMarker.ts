import { GameManager } from "../utils/GameManager";
import { Game } from "../scenes/Game";

const MARKER_VALID_COLOUR = 0x91db69;
const MARKER_INVALID_COLOUR = 0xb33831;

export class ShotMarker {
  scene: Game;
  x: number;
  y: number;
  width: number;
  height: number;
  marker: Phaser.GameObjects.Rectangle;
  gameManager: GameManager;

  constructor(
    scene: Game,
    x?: number,
    y?: number,
    width?: number,
    height?: number
  ) {
    this.scene = scene;
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.gameManager = this.scene.gameManager;
  }

  create() {
    this.marker = this.scene.add.rectangle(
      this.x,
      this.y,
      this.width,
      this.height
    );
    this.marker.setOrigin(0, 0);
    this.marker.setStrokeStyle(3, MARKER_INVALID_COLOUR, 1);

    this.scene.tweens.add({
      targets: this.marker,
      scale: 1.1,
      x: this.marker.x - this.marker.width * 0.05, // Shift left
      y: this.marker.y - this.marker.height * 0.05, // Shift up
      yoyo: true,
      repeat: -1,
      duration: 300,
      ease: "Sine.easeInOut",
    });
  }

  update(pointerTileX: number, pointerTileY: number) {
    const offsetX = (this.marker.width * (this.marker.scaleX - 1)) / 2;
    const offsetY = (this.marker.height * (this.marker.scaleY - 1)) / 2;

    if (this.gameManager.isValidMove(pointerTileX, pointerTileY)) {
      this.marker.setStrokeStyle(3, MARKER_VALID_COLOUR, 1);
    } else {
      this.marker.setStrokeStyle(3, MARKER_INVALID_COLOUR, 1);
    }

    if (pointerTileX >= 0 && pointerTileY >= 0) {
      this.marker.setPosition(
        this.scene.map.tileToWorldX(pointerTileX) - offsetX,
        this.scene.map.tileToWorldY(pointerTileY) - offsetY
      );
    }
  }
}

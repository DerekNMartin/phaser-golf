import { Game } from "../scenes/Game";

export const STROKES_DATA_KEY = "strokes";

export class StrokeManager {
  scene: Game;
  strokeText: Phaser.GameObjects.Text;
  strokeGraphicLayer: Phaser.GameObjects.Layer;

  constructor(scene: Game) {
    this.scene = scene;
  }

  create(positionX: number, positionY: number) {
    this.strokeText = this.scene.add.text(
      positionX,
      positionY,
      "Strokes: 0/6",
      {
        fontSize: "18px",
        padding: { x: 8, y: 8 },
        color: "#000000",
        backgroundColor: "#FFFFFF",
      }
    );
    this.strokeText.setScrollFactor(0);
  }

  updateStrokes(tileX: number | null, tileY: number | null) {
    const newStrokes = this.scene.data.get(STROKES_DATA_KEY);
    newStrokes.push({ x: tileX, y: tileY });
    this.scene.data.set(STROKES_DATA_KEY, newStrokes);
    if (this.strokeText) {
      this.strokeText.setText(
        `Strokes: ${this.scene.data.get(STROKES_DATA_KEY).length - 1}/6`
      );
    }
  }

  resetStrokes() {
    this.scene.data.set(STROKES_DATA_KEY, []);
    if (this.scene.ball)
      this.updateStrokes(this.scene.ball?.x, this.scene.ball?.y);
    if (this.strokeGraphicLayer) this.strokeGraphicLayer.removeAll();
  }

  drawStrokeMarker(tileX: number | null, tileY: number | null) {
    if (!this.strokeGraphicLayer)
      this.strokeGraphicLayer = this.scene.add.layer();
    const strokesPath = this.scene.add.graphics();
    strokesPath.setDefaultStyles({
      lineStyle: {
        width: 4,
        color: 0xffffff,
        alpha: 1,
      },
    });
    const tileCenter = this.scene.map.tileWidth / 2;
    const strokeWorldPath = this.scene.data.get("strokes").map(({ x, y }) => ({
      x: this.scene.map.tileToWorldX(x) + tileCenter,
      y: this.scene.map.tileToWorldX(y) + tileCenter,
    }));
    strokesPath.strokePoints(strokeWorldPath);

    const strokeMarker = this.scene.add.circle(
      this.scene.map.tileToWorldX(tileX) + tileCenter,
      this.scene.map.tileToWorldX(tileY) + tileCenter,
      8,
      0xffffff
    );

    this.strokeGraphicLayer.addAt(strokesPath, 0);
    this.strokeGraphicLayer.add(strokeMarker);
  }
}

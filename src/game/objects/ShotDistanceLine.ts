export class ShotDistanceLine {
  private scene: Phaser.Scene;
  line: Phaser.GameObjects.Line;
  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  create() {
    this.line = this.scene.add.line();
    this.line.setStrokeStyle(1, 0xffffff, 0.5);
    this.line.setLineWidth(3);
    this.line.setOrigin(0, 0);
  }

  update(
    pointerTileX: number,
    pointerTileY: number,
    selectedTile: Phaser.Tilemaps.Tile
  ) {
    const dx = pointerTileX - selectedTile?.x; // X direction
    const dy = pointerTileY - selectedTile?.y; // Y direction
    const stepX = dx === 0 ? 0 : dx / Math.abs(dx); // Normalize to -1, 0, or 1
    const stepY = dy === 0 ? 0 : dy / Math.abs(dy);
    const targetX = selectedTile?.x + stepX * this.scene.data.get("dice");
    const targetY = selectedTile?.y + stepY * this.scene.data.get("dice");

    this.line.setTo(
      selectedTile?.getCenterX(),
      selectedTile?.getCenterY(),
      this.scene.map.tileToWorldX(targetX) + 16,
      this.scene.map.tileToWorldY(targetY) + 16
    );
  }
}

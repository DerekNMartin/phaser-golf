import { Game } from "../scenes/Game";
import type { TileTerrain } from "../types/terrain";

export const DICE_DATA_KEY = "dice";

export class DiceManager {
  scene: Game;
  diceText: Phaser.GameObjects.Text;

  constructor(scene: Game) {
    this.scene = scene;
  }

  create(positionX: number, positionY: number) {
    this.diceText = this.scene.add.text(positionX, positionY, "Roll: 0", {
      fontSize: "18px",
      padding: { x: 8, y: 8 },
      color: "#000000",
      backgroundColor: "#FFFFFF",
    });
    this.diceText.setScrollFactor(0);
  }

  updateDice(roll: number, additional: number = 0) {
    this.scene.data.set(DICE_DATA_KEY, roll + additional);
    this.setDiceText(roll, additional);
  }

  setDiceText(roll: number, additional: number = 0) {
    this.diceText.setText(
      `Roll: ${roll} ${additional < 0 ? "-1" : additional > 0 ? "+1" : ""}`
    );
  }

  diceRoll() {
    const selectedTileTerrain: TileTerrain =
      this.scene.gameManager.selectedTile?.properties.terrain;
    const additional =
      selectedTileTerrain === "fairway"
        ? 1
        : selectedTileTerrain === "sand"
        ? -1
        : 0;
    const roll = 1 + Math.floor(Math.random() * 6);
    this.updateDice(roll, additional);
  }
}

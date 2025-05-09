// Shared constants
export const SURGE_DIE_LABELS = ['++', '+', '', '-', '--', '++', '+', '', '-', '--'];
export const SURGE_DIE_INTERPRETATION = [
  "+2 Control", "+1 Control", "Neutral", "+1 Chaos", "+2 Chaos",
  "+2 Control", "+1 Control", "Neutral", "+1 Chaos", "+2 Chaos"
];
export const SURGE_DIE_CATEGORY = [
  { chaos: 0, control: 2 }, // ++
  { chaos: 0, control: 1 }, // +
  { chaos: 0, control: 0 }, // blank
  { chaos: 1, control: 0 }, // -
  { chaos: 2, control: 0 }, // --
  { chaos: 0, control: 2 },
  { chaos: 0, control: 1 },
  { chaos: 0, control: 0 },
  { chaos: 1, control: 0 },
  { chaos: 2, control: 0 }
];

export class SurgeDie extends foundry.dice.terms.Die {
  constructor(termData) {
    super(termData);
    this.faces = 10;
  }

  static get denomination() {
    return "s"; // Use /roll 1ds
  }

  static get name() {
    return "SurgeDie";
  }

  getResultLabel(result) {
    return SURGE_DIE_LABELS[result.result] ?? "";
  }

  getResultCSS(result) {
    const label = SURGE_DIE_LABELS[result.result] ?? "";
    switch (label) {
      case '++': return ['surge-control-plus-plus'];
      case '+': return ['surge-control-plus'];
      case '--': return ['surge-chaos-minus-minus'];
      case '-': return ['surge-chaos-minus'];
      default: return ['surge-blank'];
    }
  }

  _roll() {
    const faceIndex = Math.floor(CONFIG.Dice.randomUniform() * this.faces);
    return { result: faceIndex, active: true };
  }
} 
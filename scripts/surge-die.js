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

  static DENOMINATION = "s";
  
  get total() {
    if (!this.results.length) return 0;
    const numericResult = this.results[0].result; // This will be 1-10 from Foundry's roll
    const index = numericResult - 1;
    const surge = SURGE_DIE_CATEGORY[index];
    return surge ? (surge.control - surge.chaos) : 0;
  }

  /** @override */
  getResultLabel(result) { 
    const index = result.result - 1;
    return SURGE_DIE_LABELS[index] ?? "";
  }

  /** @override */
  getResultCSS(result) { 
    const index = result.result - 1;
    const label = SURGE_DIE_LABELS[index] ?? "";
    switch (label) {
      case '++': return ['surge-dice-control-plus-plus'];
      case '+': return ['surge-dice-control-plus'];
      case '--': return ['surge-dice-chaos-minus-minus'];
      case '-': return ['surge-dice-chaos-minus'];
      default: return ['surge-dice-blank'];
    }
  }
} 
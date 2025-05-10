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
    // Each die instance will have a unique ID for logging if needed, but DSN might roll them in batches.
    // For now, _roll is called per die that DSN decides to throw for the term.
  }

  static DENOMINATION = "s";
  
  get total() {
    if (!this.results.length) return 0;
    const rawResult = this.results[0].result;
    const numericResult = (typeof rawResult === 'object' && rawResult !== null && 'result' in rawResult) ? rawResult.result : rawResult;
    const index = numericResult - 1;
    const surge = SURGE_DIE_CATEGORY[index];
    return surge ? (surge.control - surge.chaos) : 0;
  }

  /** @override */
  getResultLabel(result) { 
    const rawResult = result.result;
    const numericResult = (typeof rawResult === 'object' && rawResult !== null && 'result' in rawResult) ? rawResult.result : rawResult;
    const index = numericResult - 1;
    return SURGE_DIE_LABELS[index] ?? "";
  }

  /** @override */
  getResultCSS(result) { 
    const rawResult = result.result;
    const numericResult = (typeof rawResult === 'object' && rawResult !== null && 'result' in rawResult) ? rawResult.result : rawResult;
    const index = numericResult - 1;
    const label = SURGE_DIE_LABELS[index] ?? "";
    switch (label) {
      case '++': return ['surge-dice-control-plus-plus'];
      case '+': return ['surge-dice-control-plus'];
      case '--': return ['surge-dice-chaos-minus-minus'];
      case '-': return ['surge-dice-chaos-minus'];
      default: return ['surge-dice-blank'];
    }
  }

  /** @override */
  _roll() {
    const faceIndex = Math.floor(CONFIG.Dice.randomUniform() * this.faces); // 0-9
    const reportedResult = faceIndex + 1; // 1-10
    // Note: 'this.results' might not be populated yet when _roll is first called for a term.
    // DSN will call _roll for each die it needs to render for this term.
    console.log(`SurgeDie._roll(): Generated 0-idx: ${faceIndex}, Reporting 1-idx result for DSN/Chat: ${reportedResult}`);
    return { result: reportedResult, active: true }; 
  }
} 
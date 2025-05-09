import { SURGE_DIE_CATEGORY } from './surge-die.js';

export function setupChatMessageHandler() {
  Hooks.on("renderChatMessage", (message, html, data) => {
    const roll = message.rolls?.[0];
    if (!roll) return;

    for (const term of roll.terms) {
      if (!(term instanceof CONFIG.Dice.terms.s)) continue;

      let chaos = 0;
      let control = 0;

      term.results.forEach(r => {
        const surge = SURGE_DIE_CATEGORY[r.result] ?? { chaos: 0, control: 0 };
        chaos += surge.chaos;
        control += surge.control;
      });

      // Remove standard total and label
      html.find(".dice-total").remove();
      html.find(".dice-formula").text("Surge Dice");

      // Build surge result text
      const parts = [];
      if (control > 0) parts.push(`<span class="surge-control">+${control} Control</span>`);
      if (chaos > 0) parts.push(`<span class="surge-chaos">+${chaos} Chaos</span>`);
      if (chaos === 0 && control === 0) parts.push("Neutral");

      const customHTML = `
        <div class="surge-interpretation">
          <strong>Surge Result:</strong> ${parts.join(", ")}
        </div>
      `;

      html.find(".dice-roll").append(customHTML);
    }
  });
} 
import { SURGE_DIE_CATEGORY, SurgeDie, SURGE_DIE_LABELS } from './surge-die.js';

export function setupChatMessageHandler() {
  Hooks.on("renderChatMessage", (message, html, data) => {
    const roll = message.rolls?.[0];
    if (!roll) return;

    for (const term of roll.terms) {
      if (!(term instanceof SurgeDie)) {
        continue;
      }

      let termTotalChaos = 0;
      let termTotalControl = 0;
      let dieInTermCounter = 0;

      // Log details for each die result within the term
      const dieResultsHtml = term.results.map(r => {
        dieInTermCounter++;
        const rawResult = r.result; // This is the 1-based value from _roll()
        const numericResult = (typeof rawResult === 'object' && rawResult !== null && 'result' in rawResult) 
                                ? rawResult.result 
                                : rawResult;
        
        const index = numericResult - 1; // Convert 1-based to 0-based index for arrays

        const labelForChat = SURGE_DIE_LABELS[index] ?? "Err"; // Symbol for chat
        const categoryEffect = SURGE_DIE_CATEGORY[index] ?? { chaos: 0, control: 0, error: true };

        if (!categoryEffect.error) {
          termTotalChaos += categoryEffect.chaos;
          termTotalControl += categoryEffect.control;
        }
        // Use the getResultCSS and getResultLabel from the term itself for display consistency
        return `<li class="roll ${term.getResultCSS(r).join(' ')}">${term.getResultLabel(r)}</li>`;
      }).join('');

      let resultText = '';
      if (termTotalControl > 0) resultText = `+${termTotalControl} Control`;
      else if (termTotalChaos > 0) resultText = `+${termTotalChaos} Chaos`;
      else resultText = "Neutral";

      const customHTML = `
        <div class="dice-roll">
          <div class="dice-result">
            <div class="dice-formula">Surge Dice Rolled!</div>
            <div class="dice-tooltip">
              <section class="tooltip-part">
                <div class="dice">
                  <ol class="dice-rolls">
                    ${dieResultsHtml}
                  </ol>
                </div>
              </section>
            </div>
            <div class="surge-dice-interpretation">
              <strong>Result:</strong> <span class="surge-dice-${termTotalControl > 0 ? 'control' : termTotalChaos > 0 ? 'chaos' : 'neutral'}">${resultText}</span>
            </div>
          </div>
        </div>
      `;

      const content = html.find(".message-content");
      content.empty();
      content.append(customHTML);
    }
  });
} 
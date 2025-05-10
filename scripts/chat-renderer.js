import { SURGE_DIE_CATEGORY, SurgeDie, SURGE_DIE_LABELS } from './surge-die.js';

export function setupChatMessageHandler() {
  Hooks.on("renderChatMessage", (message, html, data) => {
    const roll = message.rolls?.[0];
    if (!roll) return;
    // console.log("Surge Dice | Processing roll:", roll);

    for (const term of roll.terms) {
      // console.log("Surge Dice | Checking term:", term);
      if (!(term instanceof SurgeDie)) {
        // console.log("Surge Dice | Not a surge die, skipping");
        continue;
      }
      // console.log("Surge Dice | Found surge die term:", term);

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

        console.log(
          `ChatRender (Term: ${term.expression}, DieInTerm #${dieInTermCounter}):\\n` +
          `  Raw Roll Result: ${JSON.stringify(rawResult)}\\n` +
          `  Numeric 1-idx: ${numericResult}\\n` +
          `  Calculated 0-idx: ${index}\\n` +
          `  Chat Label: '${labelForChat}'\\n` +
          `  Chat Effect: Ctl ${categoryEffect.control}, Chs ${categoryEffect.chaos}${categoryEffect.error ? ' (ERR CATEGORY)' : ''}`
        );

        if (!categoryEffect.error) {
          termTotalChaos += categoryEffect.chaos;
          termTotalControl += categoryEffect.control;
        }
        // Use the getResultCSS and getResultLabel from the term itself for display consistency
        return `<li class="roll ${term.getResultCSS(r).join(' ')}">${term.getResultLabel(r)}</li>`;
      }).join('');

      const parts = [];
      if (termTotalControl > 0) parts.push(`<span class="surge-dice-control">+${termTotalControl} Control</span>`);
      if (termTotalChaos > 0) parts.push(`<span class="surge-dice-chaos">+${termTotalChaos} Chaos</span>`);
      if (termTotalChaos === 0 && termTotalControl === 0) parts.push("Neutral");
      
      const overallResultText = parts.join(", ") || "Neutral";
      // console.log(`ChatRender (Term: ${term.expression}): Overall Result for chat: ${overallResultText}`);

      const customHTML = `
        <div class="dice-roll">
          <div class="dice-result">
            <div class="dice-formula">${term.expression} (${overallResultText})</div>
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
              <strong>Result:</strong> ${overallResultText}
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
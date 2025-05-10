import { SurgeDie, SURGE_DIE_LABELS } from './surge-die.js';
import { setupChatMessageHandler } from './chat-renderer.js';
import { registerSettings, registerKeybindings } from './settings.js';
import { initializeSurgePool, registerSocketlibHandlers } from './surge-pool.js';

console.log("Surge Dice: scripts/init.js | File parsed at top level");

// ---- REGISTER CORE COMPONENTS ----
Hooks.once('init', () => {
  console.log("Surge Dice: init hook | Fired");
  
  // Register settings FIRST, as keybindings might depend on them
  registerSettings();
  
  // THEN register keybindings
  registerKeybindings(); 
  console.log("Surge Dice: Settings and Keybindings registered.");

  // Register the die term with FoundryVTT
  CONFIG.Dice.terms.s = SurgeDie;
  console.log("Surge Dice: SurgeDie registered as 's' | Use /roll 1ds");

  // Setup chat message handler
  setupChatMessageHandler();
});

// ---- INITIALIZE SURGE POOL & OTHER READY TASKS ----
Hooks.once('ready', async () => {
  console.log("Surge Dice: ready hook | Fired");
  initializeSurgePool();
});

// ---- REGISTER SOCKETLIB ----
Hooks.once('socketlib.ready', () => {
  console.log("Surge Dice: socketlib.ready fired, registering handlers");
  registerSocketlibHandlers();
});

// ---- INTEGRATE WITH DICE SO NICE ----
Hooks.once('diceSoNiceReady', (dice3d) => {
  console.log("Surge Dice: diceSoNiceReady hook | Fired");

  // 1. Register our DSN "system"
  dice3d.addSystem({ id: "surge-dice", name: "Surge Dice" });
  console.log("Surge Dice: DSN system 'surge-dice' registered");

  // Commented out older logging for brevity as we focus on the addDice call
  // console.log("Surge Dice: Inspecting DSN hook parameter (dice3d):", dice3d);
  // console.dir(dice3d.DiceFactory); 
  // console.log("Surge Dice: Listing keys of dice3d.DiceFactory:", Object.keys(dice3d.DiceFactory));

  // 2. Define our custom die type "s" for DSN - UNCOMMENTING and ENSURING CORRECT STRUCTURE
  try {
    // console.log("Surge Dice: Attempting to define die type 's' using dice3d.addDice({...})"); // Log kept for context, actual call removed
    // dice3d.addDice({ // This call defines the die type for DSN - REMOVED
    //   type: "s",
    //   options: {
    //     system: "surge-dice", 
    //     shape: "d10"         // Specifies it's a d10 shape
    //   }
    // }); // REMOVED
    // console.log("Surge Dice: Successfully defined die type 's' using dice3d.addDice()."); // REMOVED

  } catch (e) {
    // console.error("Surge Dice: Error during dice3d.addDice() to define die type 's':", e); // REMOVED - error no longer relevant
  }
  
  // 3. Prepare labels for DSN: map empty strings from SURGE_DIE_LABELS to a displayable blank
  const dsnLabels = SURGE_DIE_LABELS.map(label => label === '' ? '⠀' : label); // '⠀' is Braille Blank
  console.log("Surge Dice: Labels being sent to DSN preset:", JSON.stringify(dsnLabels));

  // 4. Add a dice preset for our now-defined "s" type die
  dice3d.addDicePreset({
    type: "s", 
    labels: dsnLabels, 
    values: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], // Explicitly define face values
    system: "surge-dice",
    id: "surge-s-standard",
    // faces: 10 // No longer needed here, as baseDie implies faces
  }, "d10"); // ADDED "d10" as the baseDie argument
  console.log("Surge Dice: DSN preset 'surge-s-standard' for type 's' registered using d10 as base.");

  // 5. Add a standard colorset and associate it with our preset and type "s"
  dice3d.addColorset({
    name: 'surge-dice-colorset',
    description: 'Surge Dice Colors',
    category: 'Surge Dice',
    foreground: '#FFFFFF',
    background: '#6E3E96', // Deep purple
    outline: '#FFFFFF',
    edge: '#4A2A63',
    texture: "none",
    material: "plastic",
    font: "Arial Unicode MS"
  }, "default"); 
  console.log("Surge Dice: DSN colorset 'surge-dice-colorset' registered.");

});

// ---- HOOK INTO DSN ROLL START TO COMPARE RESULTS ----
Hooks.on('diceSoNiceRollStart', (messageId, context) => {
  // console.log("Surge Dice: diceSoNiceRollStart hook fired. Context:", context);
  if (context && context.roll && context.roll.terms) {
    let surgeDieTermFound = false;
    let termIndex = -1;

    for (const term of context.roll.terms) {
      termIndex++;
      if (term instanceof SurgeDie) {
        surgeDieTermFound = true;
        const foundryResults = term.results.map(r => {
          const rawVal = r.result; // This is the {result: X, active: true} object from SurgeDie._roll
          // Robustly get the actual numeric result
          if (typeof rawVal === 'object' && rawVal !== null && 'result' in rawVal) {
            return rawVal.result;
          }
          return rawVal; // Fallback if it's already a number (shouldn't be for SurgeDie)
        });

        // Ensure context.results exists before trying to use it for logging
        let dsnResultsForTermLog = "[context.results was undefined]";
        let fullDsnResultsLog = "[context.results was undefined]";

        if (context.results) {
          dsnResultsForTermLog = JSON.stringify(context.results.slice(0, foundryResults.length));
          fullDsnResultsLog = JSON.stringify(context.results);
        } else {
          // If DSN hasn't populated context.results, create it so we can assign to it.
          context.results = [];
        }

        console.log(`Surge Dice (diceSoNiceRollStart - Term ${termIndex} '${term.expression}'):
          FoundryDie Results (intended for DSN): ${JSON.stringify(foundryResults)}
          DSN's Visual Results (before override): ${dsnResultsForTermLog}
          Full DSN Visual Results (before override): ${fullDsnResultsLog}`);

        // ** Force DSN to use the results from our SurgeDie **
        // We are assuming a simple roll structure where the first N results map to our term.
        // For complex rolls, a more sophisticated merge might be needed, but DSN often expects
        // context.results to be fully populated by the module if it's handling custom dice types deeply.
        // Replace the beginning of context.results or the whole array if it only contains our dice.
        // If the roll is just e.g. /r Xds, context.results should be replaced entirely.
        // If it's /r Xds + 1d6, we only want to affect the results for Xds.
        // For now, let's assume simple rolls with only SurgeDice or SurgeDice first.
        // This might need adjustment for mixed rolls, but let's start simple.
        context.results = [...foundryResults]; // New method: direct assignment of a new array

        console.log(`Surge Dice (diceSoNiceRollStart - Term ${termIndex} '${term.expression}'):
          DSN's Visual Results (after override with SurgeDie results): ${JSON.stringify(context.results.slice(0, foundryResults.length))}`);

        // For more complex rolls with multiple terms, mapping context.results to specific terms is harder.
        break; // Assuming for now we only care about the first SurgeDie term if multiple terms exist.
      }
    }

    if (!surgeDieTermFound) {
      // console.log("Surge Dice: diceSoNiceRollStart - No SurgeDie term in this roll.");
    }
  }
}); 
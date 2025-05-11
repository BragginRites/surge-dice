import { SurgeDie, SURGE_DIE_LABELS } from './surge-die.js';
import { setupChatMessageHandler } from './chat-renderer.js';
import { registerSettings, registerKeybindings } from './settings.js';
import { initializeSurgePool, registerSocketlibHandlers } from './surge-pool.js';


// ---- REGISTER CORE COMPONENTS ----
Hooks.once('init', () => {
  
  // Register settings FIRST, as keybindings might depend on them
  registerSettings();
  
  // THEN register keybindings
  registerKeybindings(); 

  // Register the die term with FoundryVTT
  CONFIG.Dice.terms.s = SurgeDie;

  // Setup chat message handler
  setupChatMessageHandler();
});

// ---- INITIALIZE SURGE POOL & OTHER READY TASKS ----
Hooks.once('ready', async () => {
  initializeSurgePool();
});

// ---- REGISTER SOCKETLIB ----
Hooks.once('socketlib.ready', () => {
  registerSocketlibHandlers();
});

// ---- INTEGRATE WITH DICE SO NICE ----
Hooks.once('diceSoNiceReady', (dice3d) => {

  // 1. Register our DSN "system"
  dice3d.addSystem({ id: "surge-dice", name: "Surge Dice" });

  // 2. Define our custom die type "s" for DSN - UNCOMMENTING and ENSURING CORRECT STRUCTURE
  try {


  } catch (e) {

  }
  
  // 3. Prepare labels for DSN: map empty strings from SURGE_DIE_LABELS to a displayable blank
  const dsnLabels = SURGE_DIE_LABELS.map(label => label === '' ? '⠀' : label); // '⠀' is Braille Blank

  // 4. Add a dice preset for our now-defined "s" type die
  dice3d.addDicePreset({
    type: "s", 
    labels: dsnLabels, 
    values: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], // Explicitly define face values
    system: "surge-dice",
    id: "surge-s-standard",
    // faces: 10 // No longer needed here, as baseDie implies faces
  }, "d10"); // ADDED "d10" as the baseDie argument

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
});

// ---- HOOK INTO DSN ROLL START TO COMPARE RESULTS ----
Hooks.on('diceSoNiceRollStart', (messageId, context) => {
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

        context.results = [...foundryResults]; // New method: direct assignment of a new array

        break;
      }
    }

    if (!surgeDieTermFound) {
    }
  }
}); 
import { SurgeDie, SURGE_DIE_LABELS } from './surge-die.js';
import { setupChatMessageHandler } from './chat-renderer.js';
import { registerSettings, registerKeybindings, SETTINGS } from './settings.js';
import { initializeSurgePool, registerSocketlibHandlers } from './surge-pool.js';

console.log("Surge Dice: scripts/init.js | File parsed at top level");

// ---- REGISTER CORE COMPONENTS ----
Hooks.once('init', () => {
  console.log("Surge Dice: init hook | Fired");
  
  // Register settings FIRST, as keybindings might depend on them
  registerSettings();
  
  // THEN register keybindings
  // We ensure that this specific keybinding uses its default from settings if needed,
  // or the hardcoded testKey as currently in settings.js
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
  // Initialize surge pool first
  initializeSurgePool();
  
  // Keybindings are now registered in 'init', no longer here.
  // registerKeybindings(); 
});

// ---- REGISTER SOCKETLIB ----
Hooks.once('socketlib.ready', () => {
  console.log("Surge Dice: socketlib.ready fired, registering handlers");
  registerSocketlibHandlers();
});

// ---- INTEGRATE WITH DICE SO NICE ----
Hooks.once('diceSoNiceReady', () => {
  console.log("Surge Dice: diceSoNiceReady hook | Fired");

  if (!game.dice3d) {
    console.error("Surge Dice: Dice So Nice not available!");
    return;
  }

  game.dice3d.addSystem({ id: "nexulite", name: "Nexulite Surge Dice" }, "default");
  console.log("Surge Dice: DSN system 'nexulite' registered");

  game.dice3d.addDicePreset({
    type: "d10",
    labels: SURGE_DIE_LABELS,
    system: "nexulite",
    id: "surge-d10",
    fontScale: 0.8
  });

  console.log("Surge Dice: Dice So Nice preset 'surge-d10' registered");
}); 
export const SETTINGS = {
  TOGGLE_KEY: 'toggleKey',
  SURGE_POOL_LEFT: 'surgePoolLeft',
  SURGE_POOL_TOP: 'surgePoolTop',
  GM_POOL_CONTROL: 'gmSurgePoolControl', // For GM's authoritative Control points
  GM_POOL_CHAOS: 'gmSurgePoolChaos'     // For GM's authoritative Chaos points
};

export function registerSettings() {
  // Toggle Key Setting
  game.settings.register('surge-dice', SETTINGS.TOGGLE_KEY, {
    name: 'Toggle Surge Pool Key (Surge dice)',
    hint: 'The key to toggle the Surge Pool dialog. Default is B. Changes may require a reload.',
    scope: 'client',
    config: true,
    type: String,
    default: 'KeyB',
    onChange: value => {
      // console.log(`Surge Dice: Toggle key setting changed to: ${value}. Re-registering keybindings.`);
      registerKeybindings();
    }
  });

  // Surge Pool Position Settings (for persistence)
  game.settings.register('surge-dice', SETTINGS.SURGE_POOL_LEFT, {
    name: 'Surge Pool Left Position', // Not user-facing, but good for debugging
    hint: 'Stores the last left position of the Surge Pool window.',
    scope: 'client',
    config: false, // Not shown in module settings UI
    type: Number,
    default: null // Default to null, so we can center it on first ever load
  });

  game.settings.register('surge-dice', SETTINGS.SURGE_POOL_TOP, {
    name: 'Surge Pool Top Position', // Not user-facing
    hint: 'Stores the last top position of the Surge Pool window.',
    scope: 'client',
    config: false, // Not shown in module settings UI
    type: Number,
    default: null // Default to null
  });

  // GM's Authoritative Surge Pool Totals (world-scoped)
  game.settings.register('surge-dice', SETTINGS.GM_POOL_CONTROL, {
    name: "GM's Surge Pool Control Total",
    hint: "Stores the GM's authoritative total for Control points. Do not change manually unless necessary.",
    scope: "world", // Persists for the whole game world, GM authoritative
    config: false,  // Not typically changed by user in settings UI
    type: Number,
    default: 0
  });
  game.settings.register('surge-dice', SETTINGS.GM_POOL_CHAOS, {
    name: "GM's Surge Pool Chaos Total",
    hint: "Stores the GM's authoritative total for Chaos points. Do not change manually unless necessary.",
    scope: "world",
    config: false,
    type: Number,
    default: 0
  });

  console.log("Surge Dice: All settings registered.");
}

export function registerKeybindings() {
  const actionName = 'toggleSurgePool';
  const moduleId = 'surge-dice';

  if (game.keybindings.actions.get(`${moduleId}.${actionName}`)) {
    // console.log(`Surge Dice: Unregistering existing keybinding: ${moduleId}.${actionName}`);
    game.keybindings.unregister(moduleId, actionName);
  }

  // const currentKey = game.settings.get(moduleId, SETTINGS.TOGGLE_KEY);
  const keyToRegister = game.settings.get(moduleId, SETTINGS.TOGGLE_KEY) || 'KeyB'; // Fallback if setting is somehow null
  // console.log(`Surge Dice: Attempting to register keybinding '${actionName}' for module '${moduleId}' with key '${keyToRegister}'`);

  game.keybindings.register(moduleId, actionName, {
    name: 'Toggle Surge Pool (Surge dice)',
    hint: 'Shows/Hides the Surge Pool dialog for the Surge dice module.',
    editable: [
      {
        key: keyToRegister, // Use the actual key from settings or default
        modifiers: []
      }
    ],
    onDown: () => {
      if (game.surgeDice?.togglePool) {
        // console.log("Surge Dice: Toggle key pressed, attempting to toggle pool.");
        game.surgeDice.togglePool();
        return true; 
      } else {
        // console.warn("Surge Dice: Toggle key pressed, but game.surgeDice.togglePool is not available.");
        return false; 
      }
    },
    restricted: false,
    precedence: CONST.KEYBINDING_PRECEDENCE.NORMAL,
  });
  // console.log(`Surge Dice: Keybinding '${actionName}' registered successfully for key '${keyToRegister}'.`);
} 
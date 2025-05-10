import { SurgePool } from './surge-pool.js';

let surgePoolInstance = null;
let socket;

Hooks.once('init', () => {
    console.log('Surge Dice | Initializing module');

    // Register settings, keybindings, etc. here if needed later
});

Hooks.once('socketlib.ready', () => {
    socket = socketlib.registerModule('surge-dice');
    if (!socket) {
        console.error('Surge Dice | Failed to register module with socketlib');
        return;
    }

    surgePoolInstance = new SurgePool();
    surgePoolInstance.socket = socket; // Provide the socket to the pool instance

    // Register socketlib functions that can be called by other clients
    socket.register('updatePoints', (data) => {
        if (surgePoolInstance) {
            surgePoolInstance._handleSocketUpdate(data);
        }
    });

    // Potentially expose the surgePoolInstance globally or via a more controlled API
    // game.modules.get('surge-dice').api = { surgePoolInstance }; 
    // For now, we'll manage it internally and use hooks for UI updates.

    console.log('Surge Dice | Socketlib ready and SurgePool initialized');
});

Hooks.once('ready', () => {
    // This hook is fired when Foundry VTT is fully ready and all modules are initialized.
    // Good place for things that need the game world to be active.

    if (!surgePoolInstance) {
        console.warn('Surge Dice | SurgePool not initialized by ready hook. Socketlib might not be active or there was an error.');
    }

    // Example: Expose the pool to macros or other modules (use with caution or provide dedicated API functions)
    // game.surgeDice = surgePoolInstance; 
});

// Make the SurgePool class available for other parts of the module if needed
export { surgePoolInstance };

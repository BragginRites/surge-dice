import { surgePoolInstance } from './init.js';
import { SurgeDie } from './surge-roll.js';

export class SurgePoolApp extends Application {
    constructor(options = {}) {
        super(options);
    }

    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            id: 'surge-dice-app',
            title: 'Surge Pool',
            template: 'modules/surge-dice/templates/surge-pool-app.hbs',
            width: 280,
            height: 'auto',
            resizable: false,
            // popOut: false, // Consider if you want it as a non-popout UI element
            // classes: ['surge-dice-window'], // Add custom classes for styling if needed
        });
    }

    getData(options) {
        const data = super.getData(options);
        data.controlPoints = surgePoolInstance ? surgePoolInstance.controlPoints : 0;
        data.chaosPoints = surgePoolInstance ? surgePoolInstance.chaosPoints : 0;
        data.isGM = game.user.isGM;
        return data;
    }

    activateListeners(html) {
        super.activateListeners(html);
        const app = html.closest('.surge-dice-app');

        // Header buttons
        app.find('.roll-surge-die').on('click', this._onRollSurgeDie.bind(this));
        app.find('.reset-surge-pool').on('click', this._onResetPool.bind(this));
        // Close button is handled by default Application class, but we ensure it's within our scope if needed
        // html.find('.close').on('click', () => this.close()); 

        // Main pool buttons
        app.find('.spend-control').on('click', this._onSpendControl.bind(this));
        app.find('.spend-chaos').on('click', this._onSpendChaos.bind(this));

        // Disable buttons if not GM for certain actions, or if points are 0
        this._updateButtonStates(app);
    }

    _updateButtonStates(html) {
        const controlPoints = surgePoolInstance ? surgePoolInstance.controlPoints : 0;
        const chaosPoints = surgePoolInstance ? surgePoolInstance.chaosPoints : 0;

        html.find('.spend-control').prop('disabled', controlPoints <= 0);
        html.find('.spend-chaos').prop('disabled', chaosPoints <= 0);

        // GM Only buttons - for now, roll and reset are GM only
        if (!game.user.isGM) {
            html.find('.roll-surge-die').hide();
            html.find('.reset-surge-pool').hide();
        }
    }

    async _onRollSurgeDie(event) {
        event.preventDefault();
        if (!game.user.isGM) {
            ui.notifications.warn('Only the GM can initiate the Surge Die roll.');
            return;
        }
        SurgeDie.rollAndSetPool();
        // The pool update will trigger a re-render via hooks
    }

    async _onResetPool(event) {
        event.preventDefault();
        if (!game.user.isGM) {
            ui.notifications.warn('Only the GM can reset the Surge Pool.');
            return;
        }
        if (surgePoolInstance) {
            surgePoolInstance.updatePoints(0, 0); // This will also trigger socket and re-render
        }
    }

    async _onSpendControl(event) {
        event.preventDefault();
        if (surgePoolInstance) {
            const success = surgePoolInstance.spendControlPoint();
            if (!success) {
                // Optionally notify if click was somehow possible with 0 points (e.g. race condition)
                // ui.notifications.warn("No Control points to spend!");
            }
            // Re-render will be triggered by the hook in SurgePool
        }
    }

    async _onSpendChaos(event) {
        event.preventDefault();
        if (surgePoolInstance) {
            const success = surgePoolInstance.spendChaosPoint();
            if (!success) {
                // ui.notifications.warn("No Chaos points to spend!");
            }
            // Re-render will be triggered by the hook in SurgePool
        }
    }

    // Override render to ensure button states are updated
    async _render(force = false, options = {}) {
        await super._render(force, options);
        if (this.element) {
            this._updateButtonStates(this.element);
        }
    }
}

// Global instance of the app
export let surgePoolAppInstance = null;

Hooks.once('init', () => {
    // Register keybinding to toggle the app
    game.keybindings.register('surge-dice', 'togglePoolApp', {
        name: 'Toggle Surge Pool UI',
        hint: 'Shows or hides the Surge Dice pool window.',
        editable: [{ key: 'KeyB' }],
        onDown: () => {
            if (surgePoolAppInstance && surgePoolAppInstance.rendered) {
                surgePoolAppInstance.close();
            } else {
                if (!surgePoolAppInstance) {
                    surgePoolAppInstance = new SurgePoolApp();
                }
                surgePoolAppInstance.render(true);
            }
        },
        onUp: () => {},
        restricted: false, // Allow players to use the keybind
        precedence: CONST.KEYBINDING_PRECEDENCE.NORMAL,
    });
});

Hooks.on('ready', () => {
    // Initialize the app instance but don't render it yet
    // Rendering will be triggered by keybind or other actions
    if (!surgePoolAppInstance) {
        surgePoolAppInstance = new SurgePoolApp();
    }
});

// Hook to re-render the app when pool changes
Hooks.on('surgePoolChanged', (pool) => {
    if (surgePoolAppInstance && surgePoolAppInstance.rendered) {
        surgePoolAppInstance.render(false); // Re-render without forcing, to pick up new data
    }
}); 
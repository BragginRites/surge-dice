import { surgePoolInstance } from './init.js';

export class SurgeDie {
    constructor() {
        this.faces = Object.freeze([
            '++', '+', '', '-', '--',
            '++', '+', '', '-', '--'
        ]); // d10
    }

    /**
     * Rolls the Surge Die and returns the face result.
     * @returns {string} The face result (e.g., '++', '+', '', '-', '--').
     */
    roll() {
        const randomIndex = Math.floor(Math.random() * this.faces.length);
        return this.faces[randomIndex];
    }

    /**
     * Interprets the die roll result and returns the change in points.
     * @param {string} faceResult - The result from the roll() method.
     * @returns {{control: number, chaos: number}} The change in control and chaos points.
     */
    interpretResult(faceResult) {
        switch (faceResult) {
            case '++':
                return { control: 2, chaos: 0 };
            case '+':
                return { control: 1, chaos: 0 };
            case '':
                return { control: 0, chaos: 0 };
            case '-':
                return { control: 0, chaos: 1 };
            case '--':
                return { control: 0, chaos: 2 };
            default:
                console.warn(`Surge Dice | Unknown face result: ${faceResult}`);
                return { control: 0, chaos: 0 };
        }
    }

    /**
     * Rolls the die, interprets the result, and updates the SurgePool.
     * This function should typically only be called once at the start of a session,
     * and ideally by the GM or a designated roller.
     */
    static rollAndSetPool() {
        if (!surgePoolInstance) {
            console.error('Surge Dice | SurgePool not initialized when trying to roll.');
            ui.notifications.error('Surge Dice: Pool not ready for rolling.');
            return;
        }

        const die = new SurgeDie();
        const face = die.roll();
        const { control, chaos } = die.interpretResult(face);

        // For now, we assume this is the initial roll that SETS the points.
        // If the pool already has points, we might want to ADD to them or handle differently.
        // The README suggests the initial roll determines the *initial state*.
        surgePoolInstance.setInitialPoints(control, chaos);

        // Notify players of the result.
        // This could be a chat message and/or Dice So Nice animation in the future.
        let chatMessageContent = `<h2>Surge Die Roll!</h2><p>Result: <strong>${face || 'Blank'}</strong></p>`;
        if (control > 0) {
            chatMessageContent += `<p><strong>+${control} Control</strong> added to the pool.</p>`;
        }
        if (chaos > 0) {
            chatMessageContent += `<p><strong>+${chaos} Chaos</strong> added to the pool.</p>`;
        }

        ChatMessage.create({
            user: game.user.id, // Or null for a system message
            speaker: ChatMessage.getSpeaker({ alias: 'Surge Dice' }),
            content: chatMessageContent,
            // type: CONST.CHAT_MESSAGE_TYPES.OTHER // or .ROLL if we create a Roll object
        });

        console.log(`Surge Dice | Rolled: ${face}. Added: ${control} Control, ${chaos} Chaos.`);
        // Potentially add Dice So Nice integration here if dsN is active
        // For example: game.dice3d?.showForRoll(...);
    }
}

// Example of how to expose this globally if needed for macros / easy console access:
// Hooks.once('ready', () => { 
//     game.surgeDiceRoller = SurgeDie;
// });

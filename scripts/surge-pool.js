import { SETTINGS } from './settings.js'; // Import SETTINGS
import { SURGE_DIE_LABELS, SURGE_DIE_CATEGORY, SurgeDie } from './surge-die.js'; // Import constants

let surgeSocket; // Module-level variable for the socket
let surgePool = null; // Make surgePool accessible to top-level functions if needed for callbacks

// Called on ALL clients (including sender and GM) to synchronize the pool state
function syncPoolState(newState) {
  if (surgePool) {
    surgePool.control = newState.control;
    surgePool.chaos = newState.chaos;
    surgePool.render(true); // Re-render UI

    // If this client is the GM, they also save this authoritative state
    if (game.user.isGM) {
      game.settings.set('surge-dice', SETTINGS.GM_POOL_CONTROL, newState.control);
      game.settings.set('surge-dice', SETTINGS.GM_POOL_CHAOS, newState.chaos);
    }
  } else {
    console.error("Surge Dice: surgePool not available for syncPoolState.");
  }
}

// Called on player clients to update their UI from GM broadcast
function updatePlayerPoolUI(poolData) {
  if (!surgePool) {
    console.warn("Surge Dice: updatePlayerPoolUI called, but local surgePool object is not yet initialized. Pool will sync on next render/update.", poolData);
    return;
  }

  if (!game.user.isGM) {
    const oldControl = surgePool.control;
    const oldChaos = surgePool.chaos;

    surgePool.control = poolData.control;
    surgePool.chaos = poolData.chaos;
    surgePool.render(true);

    // Show notifications if enabled (local to player)
    if (game.settings.get('surge-dice', SETTINGS.SHOW_NOTIFICATIONS)) {
      if (oldControl > surgePool.control) {
        ui.notifications.info(game.settings.get('surge-dice', SETTINGS.CONTROL_NOTIFICATION));
      }
      if (oldChaos > surgePool.chaos) {
        ui.notifications.info(game.settings.get('surge-dice', SETTINGS.CHAOS_NOTIFICATION));
      }
    }

    // Sound playback is handled by GM action (useControl/useChaos) globally.
    // No sound playback needed here for players to avoid duplication.

  } else if (game.user.isGM) {
    // GM should not process this specific message meant for players, their UI is already updated.
  } else {
    console.error("Surge Dice: surgePool not available for updatePlayerPoolUI on client.");
  }
}

// This function will be called on other clients via socketlib
function showRollDialog(requesterName) {
  if (surgePool) { // Ensure surgePool is available
    new Dialog({
      title: "Surge Roll Request",
      content: `<p>${requesterName} has requested a Surge Roll!</p>`,
      buttons: {
        roll: {
          label: "Roll Surge Die",
          callback: () => surgePool.handlePlayerRoll() // Call method on the global surgePool instance
        }
      },
      default: "roll"
    }).render(true);
  } else {
    console.error("Surge Dice: surgePool not initialized when trying to show roll dialog.");
    ui.notifications.error("Surge Pool is not available.");
  }
}

export class SurgePool {
  constructor() {
    // All clients now load directly from game settings.
    const savedControl = game.settings.get('surge-dice', SETTINGS.GM_POOL_CONTROL);
    const savedChaos = game.settings.get('surge-dice', SETTINGS.GM_POOL_CHAOS);
    
    this.control = (typeof savedControl === 'number') ? savedControl : 0;
    this.chaos = (typeof savedChaos === 'number') ? savedChaos : 0;
    
    this.element = null;
    this.position = { left: 100, top: 100 }; 
    this.isDragging = false;
    this.dragOffset = { x: 0, y: 0 };
    this.currentGroupRollData = { // Added for collecting group roll results
        rolls: [],
        totalChaosForGroupRoll: 0,
        totalControlForGroupRoll: 0
    };
    // Socket registration is now handled by registerSocketlibHandlers
  }

  get template() {
    return `modules/surge-dice/templates/surge-pool.hbs`;
  }

  async getData() {
    return {
      control: this.control,
      chaos: this.chaos,
      isGM: game.user.isGM,
      controlLabel: game.settings.get('surge-dice', SETTINGS.CONTROL_LABEL),
      chaosLabel: game.settings.get('surge-dice', SETTINGS.CHAOS_LABEL),
      poolTitle: game.settings.get('surge-dice', SETTINGS.SURGE_POOL_TITLE_TEXT)
    };
  }

  async render(force = false) {
    // Check if already rendered and visible (not display: none)
    if (!force && this.element && document.body.contains(this.element) && this.element.style.display !== 'none') return;

    const content = await renderTemplate(this.template, await this.getData());
    
    if (!this.element || !document.body.contains(this.element)) {
      if (this.element) this.element.remove(); // Clean up if old element exists but not in DOM

      const div = document.createElement('div');
      div.id = 'surge-dice-pool';
      div.innerHTML = content;
      document.body.appendChild(div);
      this.element = div;

      // Load saved position or center
      const savedLeft = game.settings.get('surge-dice', SETTINGS.SURGE_POOL_LEFT);
      const savedTop = game.settings.get('surge-dice', SETTINGS.SURGE_POOL_TOP);

      if (savedLeft !== null && savedTop !== null) {
        this.position.left = savedLeft;
        this.position.top = savedTop;
      } else {
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        const rect = div.getBoundingClientRect();
        this.position.left = (vw - rect.width) / 2;
        this.position.top = (vh - rect.height) / 2;
      }
      this.activateListeners();
    } else {
      this.element.innerHTML = content;
      // Ensure event listeners are active if we only re-render innerHTML
      this.activateListeners(); 
    }
    
    this.element.style.left = `${this.position.left}px`;
    this.element.style.top = `${this.position.top}px`;
    this.element.style.display = 'block'; // Use display: block to show
  }

  activateListeners() {
    if (!this.element) return;
    // Remove old listeners to prevent duplicates if called multiple times
    const oldHeader = this.element.querySelector('.pool-header');
    if (oldHeader && oldHeader._dragStartHandler) {
      oldHeader.removeEventListener('mousedown', oldHeader._dragStartHandler);
      document.removeEventListener('mousemove', document._dragMoveHandler);
      document.removeEventListener('mouseup', document._dragEndHandler);
    }

    const header = this.element.querySelector('.pool-header');
    header._dragStartHandler = this.#handleDragStart.bind(this);
    document._dragMoveHandler = this.#handleDragMove.bind(this); // Store on document to ensure removal
    document._dragEndHandler = this.#handleDragEnd.bind(this);   // Store on document to ensure removal

    header.addEventListener('mousedown', header._dragStartHandler);
    document.addEventListener('mousemove', document._dragMoveHandler);
    document.addEventListener('mouseup', document._dragEndHandler);

    // Standard click handlers
    this.element.querySelector('.use-control').onclick = () => this.useControl();
    this.element.querySelector('.use-chaos').onclick = () => this.useChaos();
    const groupRollBtn = this.element.querySelector('.group-roll');
    if (groupRollBtn) {
      groupRollBtn.onclick = () => this.requestGroupRoll();
    }
    const syncPoolBtn = this.element.querySelector('.sync-pool');
    if (syncPoolBtn) {
      syncPoolBtn.onclick = () => this.broadcastPoolState();
    }
    this.element.querySelector('.close-button').onclick = () => this.close();

    // Add right-click handlers for manual value input
    if (game.user.isGM) {
      const controlValue = this.element.querySelector('.pool-section.control .pool-value');
      const chaosValue = this.element.querySelector('.pool-section.chaos .pool-value');

      controlValue.addEventListener('contextmenu', (ev) => {
        ev.preventDefault();
        this.#showValueInputDialog('control');
      });

      chaosValue.addEventListener('contextmenu', (ev) => {
        ev.preventDefault();
        this.#showValueInputDialog('chaos');
      });

      // Add visual hint that these are clickable for GM
      controlValue.style.cursor = 'pointer';
      chaosValue.style.cursor = 'pointer';
      controlValue.title = 'Right-click to set Control value';
      chaosValue.title = 'Right-click to set Chaos value';
    }
  }

  #handleDragStart(event) {
    this.isDragging = true;
    const rect = this.element.getBoundingClientRect();
    this.dragOffset = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    };
    this.element.style.cursor = 'grabbing';
  }

  #handleDragMove(event) {
    if (!this.isDragging) return;
    
    this.position = {
      left: event.clientX - this.dragOffset.x,
      top: event.clientY - this.dragOffset.y
    };
    
    this.element.style.left = `${this.position.left}px`;
    this.element.style.top = `${this.position.top}px`;
  }

  #handleDragEnd() {
    if (!this.isDragging) return; // Prevent saving if not actually dragged
    this.isDragging = false;
    if (this.element) {
      this.element.style.cursor = 'grab';
      game.settings.set('surge-dice', SETTINGS.SURGE_POOL_LEFT, this.position.left);
      game.settings.set('surge-dice', SETTINGS.SURGE_POOL_TOP, this.position.top);
    }
  }

  useControl() {
    if (game.user.isGM) {
      if (this.control > 0) {
        const newControl = this.control - 1;
        const newChaos = this.chaos + 1;
        
        game.settings.set('surge-dice', SETTINGS.GM_POOL_CONTROL, newControl);
        game.settings.set('surge-dice', SETTINGS.GM_POOL_CHAOS, newChaos);
        
        this.control = newControl;
        this.chaos = newChaos;
        
        this.render(true);
        this.broadcastPoolState(game.user.name, "spentControl");

        // Emit event for all clients to potentially play sound
        const controlSoundPath = game.settings.get('surge-dice', SETTINGS.CONTROL_SOUND_PATH);
        if (controlSoundPath && surgeSocket) {
          surgeSocket.executeForEveryone("playSurgeSoundGlobally", { soundPath: controlSoundPath });
        }
      } else if (game.settings.get('surge-dice', SETTINGS.SHOW_NOTIFICATIONS)) {
        ui.notifications.warn("Cannot use Control: No points available.");
      }
    } else {
      if (this.control > 0) {
        if (surgeSocket) {
          surgeSocket.executeAsGM("requestPoolChange", { action: "useControl", userId: game.user.id });
        } else {
          console.error("Surge Dice: Player cannot request pool change, socket not initialized!");
          if (game.settings.get('surge-dice', SETTINGS.SHOW_NOTIFICATIONS)) {
            ui.notifications.error("Cannot request change: connection issue.");
          }
        }
      } else if (game.settings.get('surge-dice', SETTINGS.SHOW_NOTIFICATIONS)) {
        ui.notifications.warn("Cannot use Control: No points available (according to your local view).");
      }
    }
  }

  useChaos() {
    if (game.user.isGM) {
      if (this.chaos > 0) {
        const newChaos = this.chaos - 1;
        const newControl = this.control + 1;

        game.settings.set('surge-dice', SETTINGS.GM_POOL_CHAOS, newChaos);
        game.settings.set('surge-dice', SETTINGS.GM_POOL_CONTROL, newControl);

        this.chaos = newChaos;
        this.control = newControl;

        this.render(true);
        this.broadcastPoolState(game.user.name, "spentChaos");

        // Emit event for all clients to potentially play sound
        const chaosSoundPath = game.settings.get('surge-dice', SETTINGS.CHAOS_SOUND_PATH);
        if (chaosSoundPath && surgeSocket) {
          surgeSocket.executeForEveryone("playSurgeSoundGlobally", { soundPath: chaosSoundPath });
        }
      } else if (game.settings.get('surge-dice', SETTINGS.SHOW_NOTIFICATIONS)) {
        ui.notifications.warn("Cannot use Chaos: No points available.");
      }
    } else {
      if (this.chaos > 0) {
        if (surgeSocket) {
          surgeSocket.executeAsGM("requestPoolChange", { action: "useChaos", userId: game.user.id });
        } else {
          console.error("Surge Dice: Player cannot request pool change, socket not initialized!");
          if (game.settings.get('surge-dice', SETTINGS.SHOW_NOTIFICATIONS)) {
            ui.notifications.error("Cannot request change: connection issue.");
          }
        }
      } else if (game.settings.get('surge-dice', SETTINGS.SHOW_NOTIFICATIONS)) {
        ui.notifications.warn("Cannot use Chaos: No points available (according to your local view).");
      }
    }
  }

  async requestGroupRoll() {
    // This button is GM-only, so we can assume game.user.isGM here.

    // Reset main pool values
    this.control = 0;
    this.chaos = 0;

    // Update game settings to reflect the reset
    game.settings.set('surge-dice', SETTINGS.GM_POOL_CONTROL, 0);
    game.settings.set('surge-dice', SETTINGS.GM_POOL_CHAOS, 0);

    // Update GM's UI immediately
    this.render(true);

    // Broadcast the reset state to all players
    this.broadcastPoolState(game.user.name, "poolReset"); // Use a specific actionType for reset

    // Reset data for this new group roll instance (collecting individual rolls)
    this.currentGroupRollData = { rolls: [], totalChaosForGroupRoll: 0, totalControlForGroupRoll: 0 };

    new Dialog({
      title: "Surge Roll Request",
      content: `<p>Make your Surge Roll!</p>`,
      buttons: {
        roll: { label: "Roll Surge Die", callback: () => this.handlePlayerRoll() }
      },
      default: "roll"
    }).render(true);

    if (surgeSocket) {
      surgeSocket.executeForOthers('showRollDialog', game.user.name);
    } else {
      console.error("Surge Dice: surgeSocket not initialized when trying to send roll request!");
      ui.notifications.error("Socket not ready! Please wait a moment and try again.");
    }
    await ChatMessage.create({
      content: `<p>${game.user.name} has requested a Surge Roll from all players!</p>`,
      style: CONST.CHAT_MESSAGE_STYLES.OTHER
    });
  }

  // Method for GM to receive and process a player's roll result
  gmCollectPlayerRollResult(data) {
    if (!game.user.isGM) {
      console.warn("Surge Dice: gmCollectPlayerRollResult called on non-GM client. Ignoring.");
      return;
    }
    this.currentGroupRollData.rolls.push({
      userName: data.userName,
      resultText: data.resultText,
      control: data.control,
      chaos: data.chaos,
      rollDetails: data.rollDetails
    });
    this.currentGroupRollData.totalControlForGroupRoll += data.control;
    this.currentGroupRollData.totalChaosForGroupRoll += data.chaos;
    
    // GM adds points to their authoritative pool from this player's roll
    this.addPoints(data.control, data.chaos); 
  }

  async handlePlayerRoll() {
    const roll = new Roll('1ds'); 
    await roll.evaluate({async: true}); // Ensure async evaluation for consistency

    // Send to chat first
    await roll.toMessage({
      flavor: 'Surge Roll',
      speaker: ChatMessage.getSpeaker({ actor: game.user.character })
    });

    let control = 0;
    let chaos = 0;
    let resultText = ""; // This will be the visual symbol like '--' or '+'

    if (roll.terms[0] instanceof SurgeDie) { 
        const surgeDieInstance = roll.terms[0]; 
        
        // Process each result on the die (typically only one for '1ds')
        surgeDieInstance.results.forEach(r => {
            const rawResult = r.result; // This is the 1-based value from _roll() or an object
            // Ensure we get the actual number, whether it's direct or nested
            const numericResult = (typeof rawResult === 'object' && rawResult !== null && 'result' in rawResult) 
                                    ? rawResult.result 
                                    : rawResult;
            
            const index = numericResult - 1; // Convert 1-based to 0-based index for arrays

            if (index >= 0 && index < SURGE_DIE_LABELS.length) {
                resultText += (resultText ? ", " : "") + SURGE_DIE_LABELS[index];
                const category = SURGE_DIE_CATEGORY[index];
                if (category) {
                    chaos += category.chaos;
                    control += category.control;
                }
            } else {
                console.error(`Surge Dice | Invalid index ${index} from numericResult ${numericResult}`);
                resultText += (resultText ? ", " : "") + "Error"; 
            }
        });
    }

    const rollResultPayload = {
      userName: game.user.name,
      resultText: resultText, 
      control: control,
      chaos: chaos,
      rollDetails: roll.toJSON() 
    };

    if (game.user.isGM) {
      this.gmCollectPlayerRollResult(rollResultPayload); 
    } else {
      if (surgeSocket) {
        surgeSocket.executeAsGM("gmCollectPlayerRollResult", rollResultPayload);
      } else {
        console.error("Surge Dice: Player cannot send roll to GM, socket not initialized!");
        ui.notifications.error("Cannot send roll to GM: connection issue.");
      }
    }
  }

  addPoints(control, chaos) {
    if (!game.user.isGM) {
      console.warn(`Surge Dice: Player ${game.user.name} attempted to call addPoints directly. This should be GM-driven. Ignoring.`);
      // ui.notifications.warn("Pool point changes are GM-driven."); // Optional: notify player
      return;
    }

    // This method should now primarily be called by the GM (e.g., after collecting roll results)
    const newControl = this.control + control;
    const newChaos = this.chaos + chaos;

    game.settings.set('surge-dice', SETTINGS.GM_POOL_CONTROL, newControl);
    game.settings.set('surge-dice', SETTINGS.GM_POOL_CHAOS, newChaos);

    this.control = newControl;
    this.chaos = newChaos;
    
    this.render(true); // Re-render GM's UI
    this.broadcastPoolState(game.user.name, "pointsAdded"); // Broadcast with a generic action type
  }

  close() {
    if (this.element) {
      this.element.style.display = 'none'; // Use display: none to hide
    }
  }

  // Method for GM to manually broadcast the current pool state
  broadcastPoolState(initiatorName = game.user.name, actionType = "otherUpdate") {
    if (game.user.isGM && surgeSocket) {
      const currentState = { 
          control: this.control, 
          chaos: this.chaos,
          initiatorName: initiatorName,
          actionType: actionType
      };
      surgeSocket.executeForOthers("updatePlayerPoolUI", currentState);

      // Only show notification to GM if their notifications are enabled
      if (game.settings.get('surge-dice', SETTINGS.SHOW_NOTIFICATIONS)) {
        if (actionType === "spentControl") {
          ui.notifications.info(game.settings.get('surge-dice', SETTINGS.CONTROL_NOTIFICATION));
        } else if (actionType === "spentChaos") {
          ui.notifications.info(game.settings.get('surge-dice', SETTINGS.CHAOS_NOTIFICATION));
        }
      }
    } else if (game.user.isGM && !surgeSocket) {
      console.error("Surge Dice: GM cannot broadcast pool state, socket not initialized!");
      if (game.settings.get('surge-dice', SETTINGS.SHOW_NOTIFICATIONS)) {
        ui.notifications.error("Cannot sync pool: connection issue.");
      }
    } else if (!game.user.isGM) {
      console.warn("Surge Dice: Non-GM attempted to use broadcastPoolState. This action is GM-only.");
      if (game.settings.get('surge-dice', SETTINGS.SHOW_NOTIFICATIONS)) {
        ui.notifications.warn("Only GMs can sync the pool.");
      }
    }
  }

  async _onControlClick(event) {
    event.preventDefault();
    if (this.control > 0) {
      const roll = await new SurgeDie().roll();
      this.control--;
      
      if (game.user.isGM) {
        game.settings.set('surge-dice', SETTINGS.GM_POOL_CONTROL, this.control);
        this._broadcastPoolUpdate({
          control: this.control,
          chaos: this.chaos
        });
      } else {
        surgeSocket.executeAsGM('requestPoolChange', {
          type: 'control',
          initiatorId: game.user.id
        });
      }

      // Show notification if enabled
      if (game.settings.get('surge-dice', SETTINGS.SHOW_NOTIFICATIONS)) {
        ui.notifications.info(game.settings.get('surge-dice', SETTINGS.CONTROL_NOTIFICATION));
      }

      this.render(true);
    }
  }

  async _onChaosClick(event) {
    event.preventDefault();
    if (this.chaos > 0) {
      const roll = await new SurgeDie().roll();
      this.chaos--;
      
      if (game.user.isGM) {
        game.settings.set('surge-dice', SETTINGS.GM_POOL_CHAOS, this.chaos);
        this._broadcastPoolUpdate({
          control: this.control,
          chaos: this.chaos
        });
      } else {
        surgeSocket.executeAsGM('requestPoolChange', {
          type: 'chaos',
          initiatorId: game.user.id
        });
      }

      // Show notification if enabled
      if (game.settings.get('surge-dice', SETTINGS.SHOW_NOTIFICATIONS)) {
        ui.notifications.info(game.settings.get('surge-dice', SETTINGS.CHAOS_NOTIFICATION));
      }

      this.render(true);
    }
  }

  #showValueInputDialog(type) {
    if (!game.user.isGM) return;

    const currentValue = type === 'control' ? this.control : this.chaos;
    const label = type === 'control' ? 
      game.settings.get('surge-dice', SETTINGS.CONTROL_LABEL) : 
      game.settings.get('surge-dice', SETTINGS.CHAOS_LABEL);

    new Dialog({
      title: `Set ${label} Value`,
      content: `
        <form>
          <div class="form-group">
            <label>New ${label} Value:</label>
            <input type="number" name="newValue" value="${currentValue}" min="0">
          </div>
        </form>
      `,
      buttons: {
        set: {
          icon: '<i class="fas fa-check"></i>',
          label: "Set Value",
          callback: (html) => {
            const newValue = Math.max(0, parseInt(html.find('[name="newValue"]').val()) || 0);
            if (type === 'control') {
              game.settings.set('surge-dice', SETTINGS.GM_POOL_CONTROL, newValue);
              this.control = newValue;
            } else {
              game.settings.set('surge-dice', SETTINGS.GM_POOL_CHAOS, newValue);
              this.chaos = newValue;
            }
            this.render(true);
            this.broadcastPoolState(game.user.name, "valueSet");
          }
        },
        cancel: {
          icon: '<i class="fas fa-times"></i>',
          label: "Cancel"
        }
      },
      default: "set"
    }).render(true);
  }
}

// Global access point
export function initializeSurgePool() {
  surgePool = new SurgePool();
  
  if (game.user.isGM) {
    
    // Check if settings exist and are numbers, if not, GM sets them.
    const currentSettingsControl = game.settings.get('surge-dice', SETTINGS.GM_POOL_CONTROL);
    const currentSettingsChaos = game.settings.get('surge-dice', SETTINGS.GM_POOL_CHAOS);

    let needsSettingUpdate = false;
    if (typeof currentSettingsControl !== 'number') {
      game.settings.set('surge-dice', SETTINGS.GM_POOL_CONTROL, surgePool.control);
      needsSettingUpdate = true;
    }
    if (typeof currentSettingsChaos !== 'number') {
      game.settings.set('surge-dice', SETTINGS.GM_POOL_CHAOS, surgePool.chaos);
      needsSettingUpdate = true;
    }

    if (needsSettingUpdate) {
    } else {
    }

    // GM always broadcasts their authoritative state after initialization or verification.
    if (surgeSocket) {
      const initialState = { 
          control: surgePool.control, 
          chaos: surgePool.chaos,
          initiatorName: game.user.name,
          actionType: "initialSync"
      };
      surgeSocket.executeForOthers("updatePlayerPoolUI", initialState);
    } else {
      console.warn("Surge Dice: GM initialized, but surgeSocket not ready for initial broadcast.");
    }
  }
  
  game.surgeDice = {
    surgePool, // Expose the surgePool instance
    togglePool: () => {
      if (!surgePool.element || surgePool.element.style.display === 'none') {
        surgePool.render(true);
      } else {
        surgePool.close();
      }
    },
    addPoints: (control, chaos) => surgePool.addPoints(control, chaos)
  };
}

// Export this function to be called from init.js
export function registerSocketlibHandlers() {
  surgeSocket = socketlib.registerModule("surge-dice");
  surgeSocket.register("showRollDialog", showRollDialog);
  // Register the new handler for GM to receive player roll results
  surgeSocket.register("gmCollectPlayerRollResult", (data) => {
    if (game.user.isGM && surgePool) {
      surgePool.gmCollectPlayerRollResult(data);
    } else if (!game.user.isGM) {
      // This case should not happen if executeAsGM is used correctly
      console.warn("Surge Dice: Non-GM client received a gmCollectPlayerRollResult call. This is unexpected.");
    } else if (!surgePool) {
      console.error("Surge Dice: surgePool not available for gmCollectPlayerRollResult on GM client.");
    }
  });
  // Register the new handler for players to update their UI
  surgeSocket.register("updatePlayerPoolUI", updatePlayerPoolUI);

  // Handler for GM to process player requests to change the pool state
  surgeSocket.register("requestPoolChange", (data) => {
    if (game.user.isGM && surgePool) {
      const { action, userId } = data;
      const requestingUser = game.users.get(userId);
      const userName = requestingUser ? requestingUser.name : "Unknown Player";


      // Get current values from settings as the source of truth
      let currentControl = game.settings.get('surge-dice', SETTINGS.GM_POOL_CONTROL);
      let currentChaos = game.settings.get('surge-dice', SETTINGS.GM_POOL_CHAOS);
      let newControl = currentControl;
      let newChaos = currentChaos;
      let changeMade = false;
      let soundPathToPlay = null;

      if (action === "useControl") {
        if (currentControl > 0) {
          newControl = currentControl - 1;
          newChaos = currentChaos + 1;
          changeMade = true;
          soundPathToPlay = game.settings.get('surge-dice', SETTINGS.CONTROL_SOUND_PATH);
        } else if (game.settings.get('surge-dice', SETTINGS.SHOW_NOTIFICATIONS)) {
          ui.notifications.warn(`Request to use Control denied: No Control points available.`);
        }
      } else if (action === "useChaos") {
        if (currentChaos > 0) {
          newChaos = currentChaos - 1;
          newControl = currentControl + 1;
          changeMade = true;
          soundPathToPlay = game.settings.get('surge-dice', SETTINGS.CHAOS_SOUND_PATH);
        } else if (game.settings.get('surge-dice', SETTINGS.SHOW_NOTIFICATIONS)) {
          ui.notifications.warn(`Request to use Chaos denied: No Chaos points available.`);
        }
      } else {
        console.warn(`Surge Dice: GM received unknown action '${action}'.`);
        return;
      }

      if (changeMade) {
        game.settings.set('surge-dice', SETTINGS.GM_POOL_CONTROL, newControl);
        game.settings.set('surge-dice', SETTINGS.GM_POOL_CHAOS, newChaos);

        surgePool.control = newControl;
        surgePool.chaos = newChaos;
        
        surgePool.render(true);
        const actionType = action === "useControl" ? "spentControl" : "spentChaos";
        surgePool.broadcastPoolState(userName, actionType);

        // Emit event for all clients to potentially play sound
        if (soundPathToPlay && surgeSocket) {
          surgeSocket.executeForEveryone("playSurgeSoundGlobally", { soundPath: soundPathToPlay });
        }
      }
    } else if (!game.user.isGM) {
      console.warn("Surge Dice: Non-GM client received a requestPoolChange call. This is unexpected.");
    } else if (!surgePool) {
      console.error("Surge Dice: surgePool not available for requestPoolChange on GM client.");
    }
  });

  // Handler for clients to play sounds based on their local setting
  surgeSocket.register("playSurgeSoundGlobally", (data) => {
    const { soundPath } = data;
    if (soundPath && game.settings.get('surge-dice', SETTINGS.CLIENT_PLAY_SOUNDS)) {
      AudioHelper.play({src: soundPath, volume: 0.8, autoplay: true, loop: false}, false);
    }
  });
}
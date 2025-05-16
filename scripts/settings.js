export const SETTINGS = {
  SURGE_POOL_LEFT: 'surgePoolLeft',
  SURGE_POOL_TOP: 'surgePoolTop',
  GM_POOL_CONTROL: 'gmSurgePoolControl',
  GM_POOL_CHAOS: 'gmSurgePoolChaos',
  SHOW_NOTIFICATIONS: 'showNotifications',
  CONTROL_LABEL: 'controlLabel',
  CHAOS_LABEL: 'chaosLabel',
  CONTROL_NOTIFICATION: 'controlNotification',
  CHAOS_NOTIFICATION: 'chaosNotification',
  SURGE_POOL_TITLE_TEXT: 'surgePoolTitleText',
  CONTROL_SOUND_PATH: 'controlSoundPath',
  CHAOS_SOUND_PATH: 'chaosSoundPath',
  CLIENT_PLAY_SOUNDS: 'clientPlaySounds'
};

export function registerSettings() {
  // Show Notifications Setting
  game.settings.register('surge-dice', SETTINGS.SHOW_NOTIFICATIONS, {
    name: 'Show Notifications',
    hint: 'Display notifications when Control or Chaos points are spent.',
    scope: 'client',
    config: true,
    type: Boolean,
    default: true
  });

  // Custom Labels
  game.settings.register('surge-dice', SETTINGS.CONTROL_LABEL, {
    name: 'Control Label',
    hint: 'Custom name for Control points (e.g., "Light", "Order", etc.)',
    scope: 'world',
    config: true,
    type: String,
    default: 'Control',
    onChange: () => {
      if (game.surgeDice?.surgePool?.element) {
        game.surgeDice.surgePool.render(true);
      }
    }
  });

  game.settings.register('surge-dice', SETTINGS.CHAOS_LABEL, {
    name: 'Chaos Label',
    hint: 'Custom name for Chaos points (e.g., "Dark", "Discord", etc.)',
    scope: 'world',
    config: true,
    type: String,
    default: 'Chaos',
    onChange: () => {
      if (game.surgeDice?.surgePool?.element) {
        game.surgeDice.surgePool.render(true);
      }
    }
  });

  // Notification Messages
  game.settings.register('surge-dice', SETTINGS.CONTROL_NOTIFICATION, {
    name: 'Control Point Notification',
    hint: 'Message shown when a Control point is spent.',
    scope: 'world',
    config: true,
    type: String,
    default: 'The resonance stills—control is reclaimed.'
  });

  game.settings.register('surge-dice', SETTINGS.CHAOS_NOTIFICATION, {
    name: 'Chaos Point Notification',
    hint: 'Message shown when a Chaos point is spent.',
    scope: 'world',
    config: true,
    type: String,
    default: 'Searing echoes rumble—chaos answers!'
  });

  // Surge Pool Position Settings (for persistence)
  game.settings.register('surge-dice', SETTINGS.SURGE_POOL_LEFT, {
    name: 'Surge Pool Left Position',
    hint: 'Stores the last left position of the Surge Pool window.',
    scope: 'client',
    config: false,
    type: Number,
    default: null
  });

  game.settings.register('surge-dice', SETTINGS.SURGE_POOL_TOP, {
    name: 'Surge Pool Top Position',
    hint: 'Stores the last top position of the Surge Pool window.',
    scope: 'client',
    config: false,
    type: Number,
    default: null
  });

  // GM's Authoritative Surge Pool Totals (world-scoped)
  game.settings.register('surge-dice', SETTINGS.GM_POOL_CONTROL, {
    name: "GM's Surge Pool Control Total",
    hint: "Stores the GM's authoritative total for Control points. Do not change manually unless necessary.",
    scope: "world",
    config: false,
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

  // New Setting for Surge Pool Title
  game.settings.register('surge-dice', SETTINGS.SURGE_POOL_TITLE_TEXT, {
    name: 'Surge Pool Title',
    hint: 'Set a custom title for the Surge Pool window. Make blank to remove title.',
    scope: 'world',
    config: true,
    type: String,
    default: 'Surge Pool',
    onChange: () => {
      if (game.surgeDice?.surgePool?.element) {
        game.surgeDice.surgePool.render(true);
      }
    }
  });

  // Control Sound Path Setting
  game.settings.register('surge-dice', SETTINGS.CONTROL_SOUND_PATH, {
    name: 'Control Point Sound',
    hint: 'Audio file to play when a Control point is used. Clear to disable sound.',
    scope: 'world',
    config: true,
    type: String,
    filePicker: 'audio',
    default: ''
  });

  // Chaos Sound Path Setting
  game.settings.register('surge-dice', SETTINGS.CHAOS_SOUND_PATH, {
    name: 'Chaos Point Sound',
    hint: 'Audio file to play when a Chaos point is used. Clear to disable sound.',
    scope: 'world',
    config: true,
    type: String,
    filePicker: 'audio',
    default: ''
  });

  // Client-Side Setting to Toggle Sound Playback
  game.settings.register('surge-dice', SETTINGS.CLIENT_PLAY_SOUNDS, {
    name: 'Play Surge Sounds',
    hint: 'Enable or disable sound effects from the Surge Pool for yourself.',
    scope: 'client',
    config: true,
    type: Boolean,
    default: true
  });
}

export function registerKeybindings() {
  const actionName = 'toggleSurgePool';
  const moduleId = 'surge-dice';

  if (game.keybindings.actions.get(`${moduleId}.${actionName}`)) {
    game.keybindings.unregister(moduleId, actionName);
  }

  game.keybindings.register(moduleId, actionName, {
    name: 'Toggle Surge Pool',
    hint: 'Shows/Hides the Surge Pool dialog',
    editable: [
      {
        key: 'KeyB',
        modifiers: []
      }
    ],
    onDown: () => {
      if (game.surgeDice?.togglePool) {
        game.surgeDice.togglePool();
        return true;
      }
      return false;
    },
    restricted: false,
    precedence: CONST.KEYBINDING_PRECEDENCE.NORMAL
  });
}
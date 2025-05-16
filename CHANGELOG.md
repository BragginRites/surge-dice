## [0.3.0] - 2025-05-16
### Added
- **Customizable Surge Pool Title**
  - Added a world-scoped game setting to allow GMs to set a custom title for the Surge Pool window.
  
- **Global Sound Effects for Point Usage**
  - Introduced world-scoped game settings for GMs to define sound effects for spending Control and Chaos points.
  - Settings utilize a FilePicker for easy audio file selection and allow direct path input.
  - Configured sounds play globally for all connected clients.
  - Client-side toggle to disable sound effects.

## [0.2.1] - 2025-05-11
### Changed
- Simplified and improved chat message display for Surge Dice rolls
  - Cleaner header showing "Surge dice rolled!"
  - Streamlined result display with appropriate styling
  - Removed redundant information from chat output

### Added
- GM can now manually set Control and Chaos values via right-click
  - Right-click on pool values opens an input dialog
  - Changes sync to all connected players
  - Visual indicators (cursor and tooltip) show right-click functionality

## [0.2.0] - 2025-05-11
### Added
- Customizable notification messages for Control and Chaos point usage.
- Client-side notification toggle setting.

### Changed
- Standardized notifications between GM and players.
- Removed character-specific notifications in favor of generic messages.
- Fixed Dice So Nice 3D dice showing incorrect faces during random rolls.

### Fixed
- The entire system was broken.

## [0.1.0] - 2025-05-10
### Added
- Initial release of the Surge Dice module.
  - Core mechanics for rolling Surge Dice.
  - Surge Pool UI for tracking Control and Chaos points.
  - Ability for players and GM to spend points, flipping the balance.
  - Basic chat message integration for Surge Die rolls.
  - Configurable hotkey (default 'B') to show/hide the Surge Pool UI.

# Surge Dice

Surge Dice is a Foundry VTT module that introduces an element of unpredictable magical energy into your game, represented by a shared pool of "Control" and "Chaos" points. This system reflects a dynamic push and pull of magical forces, inspired by the Destiny Dice mechanic from the Star Wars™ Roleplaying Game by Fantasy Flight Games. It is designed to be system-agnostic for various TTRPGs like D&D 5e or Pathfinder 2e.

![image](https://github.com/user-attachments/assets/0fb8c329-a6c9-4ecb-9aab-458d4f65f3fa)


Coffee helps me stay up to 2am to write these modules. Thank you for the lack of sleep in advance!

[![ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/bragginrites)

## Other Modules

Check out my other module(s):

- [BG3 Inspired HUD](https://github.com/BragginRites/bg3-inspired-hotbar)
- [Inspect Statblock](https://github.com/BragginRites/inspect-statblock)

## Quick Usage

- **Installation**:
  1. Open Foundry VTT and navigate to **Add-on Modules**.
  2. Click **Install Module** and paste this manifest URL:
     ```
     https://github.com/BragginRites/surge-dice/releases/download/0.1.0/module.json
     ```
  3. Click **Install** and enable the module in your world settings.
- **Core Functionality**:
    - At the beginning of each game session, all participants collectively roll a single Surge Die (a special 10-sided die).
    - The result of this roll determines the initial state of the Surge Pool (Control and Chaos points) for the session.
    - Participants can spend Control or Chaos points to influence the game, with spending one type of point generating the other.

## Rolling the Surge Die

At the beginning of each game session, all participants collectively roll a single Surge Die (a special 10-sided die). The result of this roll determines the initial state of the Surge Pool for the session.

## Interpreting the Results

The Surge Die has five distinct types of faces, each appearing twice:

*   **`++` (Double Plus):** Grants **+2 Control points** to the Surge Pool.
*   **`+` (Single Plus):** Grants **+1 Control point** to the Surge Pool.
*   **` ` (Blank):** Indicates a momentary balance; **no points** are added to Control or Chaos.
*   **`-` (Single Minus):** Grants **+1 Chaos point** to the Surge Pool.
*   **`--` (Double Minus):** Grants **+2 Chaos points** to the Surge Pool.

These points are added to a shared resource, visible to all players, representing the current levels of Control and Chaos.

## The Surge Pool

The Surge Pool is a communal resource that tracks:

*   The current number of **Control points**.
*   The current number of **Chaos points**.

## Using Surge Points: Flipping the Balance

Any participant (players or the Game Master/GM) can interact with the Surge Pool to influence the magical tides. The fundamental mechanic is that using one type of point generates the other:

*   **Spending 1 Control Point:** When any participant chooses to spend a Control point, that point is expended from the Control pool, and simultaneously, **1 Chaos point is added** to the Chaos pool.
*   **Spending 1 Chaos Point:** Conversely, when any participant chooses to spend a Chaos point, that point is expended from the Chaos pool, and **1 Control point is added** to the Control pool.

While a common convention is for players to primarily spend Control Points and the GM to primarily spend Chaos Points (as illustrated in the example uses below), this is not a strict rule. Tables should feel free to allow any participant to spend any type of point if it suits their game's style and narrative.

The specific narrative effects of using these points are determined by the group and the GM.

## Core Surge Mechanics

This system can be used to influence the flow of events in the game. The uses below are examples of how points are typically spent.

### Example Basic Control Point Uses (Often Player-Initiated)

*   **Surge of Power:** Spend 1 Control point to gain a mechanical benefit on a dice roll (e.g., advantage, a bonus, a re-roll). The exact benefit should be defined by the GM for the specific game system.

### Example Basic Chaos Point Uses (Often GM-Initiated)

*   **GM-Initiated Effect:** Spend 1 Chaos point to introduce a complication, an unexpected turn of events, or a narrative twist, reflecting the unpredictable nature of ambient energies or fate.

#### Example GM Mechanical Interventions:

*   **Empower Foe:** Spend 1 Chaos when an adversary takes an action; they might gain a temporary bonus to their roll, deal extra damage, or have an enhanced effect.
*   **Environmental Complication:** Spend 1 Chaos to introduce a sudden environmental challenge or change that affects some or all characters.
*   **Increase Difficulty:** Spend 1 Chaos to temporarily increase the difficulty of a task a player is attempting.

This `README.md` provides a foundational understanding of the Surge Dice mechanics. GMs are encouraged to adapt and detail the specific mechanical implementations of Control and Chaos point uses to best suit their chosen game system and campaign style.

## Acknowledgments

The core concept for Surge Dice is inspired by the Destiny Dice mechanic found in the Star Wars™ Roleplaying Game by Fantasy Flight Games.

## Support

For issues, bugs, or feature requests, please submit them via [GitHub Issues](https://github.com/BragginRites/surge-dice/issues). 

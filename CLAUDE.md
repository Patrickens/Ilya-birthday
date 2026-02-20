
# CLAUDE.md — The Cartographer of Winds (40th Birthday Mini-Game)

## 0) One-Day Deliverable
Build a static browser game (no backend) that runs by opening `index.html` locally.
It is a 5-scene interactive story:
- 4 mini-games
- 1 final emotional ending

Hard constraints:
- Simple
- Stable
- No complex physics
- No APIs
- No frameworks
- No build tools
- Fully offline

---

## 1) Tech Stack (Explicit)

Chosen approach: Plain HTML, CSS, and JavaScript.

Use only:
- index.html
- styles.css
- game.js

Do NOT use:
- React / Vue / Svelte
- npm
- build tools
- external CDNs
- map APIs
- physics engines
- audio libraries
- remote assets

Allowed browser APIs:
- localStorage
- requestAnimationFrame (optional)
- AudioContext (optional simple sounds)

Must work by double-clicking index.html.

---

## 2) Architecture

### Root Structure
index.html contains:
- div with id="app"
- div with id="ui"

All scenes render inside #app.

### Scene System
In game.js:

Create an array called scenes.
Each scene object contains:
- id
- render()
- bind()
- cleanup() (optional)

Implement showScene(index):
- Clear current listeners
- Replace app.innerHTML
- Call scene.render()
- Call scene.bind()
- Update scene indicator

---

## 3) Global State

gameState object:

- started (boolean)
- sceneIndex (0–4)
- completed (array of 5 booleans)
- sceneData:

sceneData.s1:
- leg (0–3)
- windDeg (0–359)

sceneData.s2:
- index (0–4)
- solved (array of letters)

sceneData.s3:
- grid (array of 25 booleans)

sceneData.s4:
- sequence (array)
- input (array)
- phase ("idle", "showing", "input")

Persist to localStorage after each completion.
Restore on load if present.

---

# SCENES

---

## Scene 0 — Start Screen
UI:
- Title: The Cartographer of Winds
- Subtitle: A 40th Birthday Micro-Quest
- Button: Begin

Begin sets sceneIndex to 0 and loads Scene 1.

---

## Scene 1 — Sailboat Navigation

Narrative:
You depart Zurich guided by an early Google Maps prototype.
Destination: Brazil.

Mini-game:
Complete 3 successful sail trims.

UI:
- Wind direction displayed (degrees)
- Slider 0–359 degrees
- Button: Trim Sail
- Progress display: Leg X / 3

Logic:
- windDeg = random 0–359
- optimal = (windDeg + 90) % 360
- If circular difference between slider and optimal <= 20:
    leg++
- If leg == 3:
    mark scene complete

---

## Scene 2 — Guitar Recognition (Spell AGED)

Narrative:
On the beach you find a guitar.
Inscription: "Play the chords that spell your age."

Sequence:
A → G → E → D

UI:
- SVG fretboard (6 strings, 5 frets)
- Render chord shapes
- Buttons: A B C D E F G
- Progress display: _ _ _ _

Chord shapes:
A: [-1,0,2,2,2,0]
G: [3,2,0,0,0,3]
E: [0,2,2,1,0,0]
D: [-1,-1,0,2,3,2]

If correct letter:
- advance index
If wrong:
- show light feedback

Complete when all four solved.

---

You are implementing Scene 3 of a static browser game built with plain HTML, CSS, and JavaScript (no frameworks, no build tools, no npm, no external assets). The game already has a scene system and global gameState object.

Replace Scene 3 with the following mini-game.

========================================
SCENE 3 — “Route Optimization: Find the 40 Path”
========================================

THEME
A stylized Google Maps routing interface powered by math.
The player must build a route from RIO to ZRH whose total cost equals exactly 40.

This is NOT a real shortest-path algorithm.
This is a small graph puzzle where the player manually selects nodes.

----------------------------------------
NARRATIVE TEXT (render at top)
----------------------------------------

Title: Route Optimization

Text:
“A familiar interface appears.”
“From Rio to Zurich.”
“Find the route whose total cost is exactly 40.”

----------------------------------------
GAME GOAL
----------------------------------------

Start node: RIO
End node: ZRH

Player builds a route by clicking connected nodes.
When they reach ZRH:
- If total cost === 40 → success
- Otherwise → show “Recalculating…” and allow undo/reset

----------------------------------------
GRAPH DEFINITION (USE EXACTLY THIS)
----------------------------------------

Nodes:
- RIO
- DKR
- LIS
- BCN
- MOS
- ZRH

Edges with weights (undirected):

RIO — DKR : 10
DKR — LIS : 8
LIS — MOS : 13
MOS — ZRH : 9
RIO — LIS : 18
LIS — BCN : 6
BCN — ZRH : 17
RIO — BCN : 15
MOS — BCN : 11

IMPORTANT:
There must be exactly one clean solution summing to 40:

Correct path:
RIO (10) → DKR (8) → LIS (13) → MOS (9) → ZRH
Total = 40

Do not modify these weights.

----------------------------------------
DATA STRUCTURE REQUIREMENTS
----------------------------------------

Represent graph as an adjacency list object in JS.

Example shape:
graph = {
  RIO: [{to:"DKR", weight:10}, ...],
  ...
}

Maintain route state:
currentRoute = ["RIO"]
currentTotal = 0

----------------------------------------
UI REQUIREMENTS
----------------------------------------

Layout:

1. Map Panel (center)
- Render nodes as circles using inline SVG.
- Render edges as lines.
- Display weight labels on each edge.
- Highlight selected route edges.
- Highlight current node.

2. Sidebar Panel (fake Google Maps style)
- Start: RIO
- Destination: ZRH
- Route display:
  RIO → DKR → ...
- Total: XX

3. Buttons:
- Undo last
- Reset route

----------------------------------------
INTERACTION RULES
----------------------------------------

- Player can only click nodes adjacent to the current node.
- Clicking a valid node:
    - Add node to route
    - Add weight to total
    - Highlight edge

- If player clicks non-adjacent node:
    - Briefly shake node or show small message “No direct route.”

- Undo:
    - Remove last node
    - Subtract its edge weight
    - Remove edge highlight

- Reset:
    - currentRoute = ["RIO"]
    - total = 0
    - clear highlights

----------------------------------------
SUCCESS CONDITION
----------------------------------------

When current node === ZRH:

IF currentTotal === 40:
    - Show:
      “Route found: 40.”
      “Optimal enough to sail by.”
    - Mark Scene 3 as completed in gameState
    - Enable Next button

ELSE:
    - Show:
      “Recalculating…”
    - Allow user to undo or reset
    - Do NOT auto-reset

----------------------------------------
VISUAL STYLE
----------------------------------------

- Minimalist, clean.
- Light map background (subtle grid or pale blue).
- Nodes circular with label centered.
- Active route edges colored differently (e.g., darker or thicker).
- Subtle hover effect on clickable nodes.

No external CSS libraries.

----------------------------------------
IMPLEMENTATION CONSTRAINTS
----------------------------------------

- No Dijkstra algorithm.
- No complex layout engines.
- Hardcode node positions in SVG (fixed coordinates).
- Keep logic simple and readable.
- No more than ~150–200 lines for this scene logic.

----------------------------------------
INTEGRATION
----------------------------------------

- Scene must integrate with existing showScene() system.
- On success, set:
    gameState.completed[2] = true
- Persist to localStorage.
- Unlock Next button.

----------------------------------------
END
----------------------------------------

Return only the Scene 3 implementation code (HTML template string + JS logic + minimal CSS additions if needed).
Do not rewrite other scenes.

----------------------------------------


## Scene 4 — Forró Memory Game

Moves:
Left, Right, Turn, Close

Game shows a sequence of 4 moves visually.
Player repeats using arrow keys or buttons.

If correct:
- scene complete
If wrong:
- restart sequence

Keep timing generous.

---

## Scene 5 — Final Scene (No Game)

Soft sunrise scene.

Narrative must reference:
- sailing
- maps
- music
- mathematics
- dancing
- Russia roots
- Zurich home
- Meli by name

End with:
Happy 40th Birthday.

Button:
Restart

---

## 5) Assets — pics/ folder

The `pics/` directory contains photos of Ilya used as decorative elements.
These are local files — no external URLs.

| File             | Used in   | Placement                                        |
|------------------|-----------|--------------------------------------------------|
| ILYA2_NOBG.png   | Scene 1   | Drawn on canvas shore (leg 0, Canadian scene) — Ilya standing on the dock waving goodbye |
| ILYA_NOBG.png    | Scene 3   | HTML `<img>` positioned bottom-right of the SVG map |
| ILYA.jpeg        | (unused)  | Full photo with background                       |
| ILYA2.jpeg       | (unused)  | Full photo with background                       |
| ILYA_FACE.jpeg   | (unused)  | Face crop                                        |
| ILYA_FRIEND.jpeg | (unused)  | Photo with friend                                |
| ILYA_MELI.jpeg   | (unused)  | Photo labelled Meli                              |

Both `*_NOBG.png` files have transparent backgrounds, suitable for compositing.

---

## 4) Time Priorities

1. Scene flow works
2. Scene 1 functional
3. Scene 2 fretboard rendering
4. Scene 3 grid logic
5. Scene 4 memory logic
6. Final narrative polish

Ship something delightful.

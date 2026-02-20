
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

## Scene 3 — Geometry of 40 (Option A Only)

Display a 5x5 clickable grid.

Each tile toggles on/off.

Target pattern forms pixel-style "40".

No hints.

When grid matches target pattern exactly:
- mark scene complete

---

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

## 4) Time Priorities

1. Scene flow works
2. Scene 1 functional
3. Scene 2 fretboard rendering
4. Scene 3 grid logic
5. Scene 4 memory logic
6. Final narrative polish

Ship something delightful.

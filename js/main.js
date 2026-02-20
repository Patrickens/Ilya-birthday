// ── Orchestrator — scene registry + boot ────────
// All scene objects (s0–s5) are defined in their respective scene*.js files
// and loaded before this file via index.html script tags.

const scenes = [s0, s1, s2, s3, s4, s5];

// Always start fresh from the title screen — no localStorage resume
showScene(0);

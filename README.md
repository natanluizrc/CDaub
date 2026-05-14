# Handoff: CDaub — Real-time Bingo

## Overview
CDaub is a real-time bingo web app for hosting bingo games with friends and family. One person creates a room as **Host** (caller) and shares a 6-character room code; others join as **Players**, each receiving a randomly-generated 5×5 card. The host draws numbers (1–50), players mark their cards, and the first to complete any row, column, or diagonal wins.

The current prototype uses `localStorage` + `storage` events to sync sessions across browser tabs — a real implementation should use a real-time backend (WebSocket, Firebase, Supabase Realtime, etc.).

## About the Design Files
The files in this bundle are **design references created in HTML** — prototypes showing intended look and behavior, not production code to copy directly. The task is to **recreate these HTML designs in the target codebase's existing environment** (React, Vue, SwiftUI, native, etc.) using its established patterns and libraries. If no environment exists yet, pick the most appropriate framework for the project (we'd suggest Next.js + a real-time backend like Supabase) and implement the designs there.

## Fidelity
**High-fidelity (hi-fi).** Pixel-perfect mockups with final colors, typography, spacing, and interactions. The developer should recreate the UI pixel-perfectly. The full design system is documented in **Design Tokens** below.

---

## Screens / Views

### 1. Welcome / Onboarding (`WelcomeScreen`)
- **Purpose**: User enters their name and picks their role (Host or Player).
- **Layout**: Full-bleed dark gradient background. Centered modal card (max-width 720px) with eyebrow + giant display heading "CDaub.", italic gold slogan "Cards that build Moments.", a sub-paragraph, a text input for the name, and a 2-column grid of role cards (Host / Player).
- **Components**:
  - **Heading "CDaub."** — Bricolage Grotesque, 88px, weight 700, letter-spacing -0.04em, white.
  - **Slogan** — Bricolage Grotesque italic, 22px, weight 500, color `--gold` (#fbbf24).
  - **Name input** — padding 16/18px, dark glass background `rgba(14,4,32,0.55)`, 1px border `--line-strong`, radius 14px, font 18px. Focus state: border becomes `--purple-glow` + 4px halo.
  - **Mode cards** (2 buttons in a CSS grid):
    - Host card: 56×56 icon tile with purple→magenta gradient.
    - Player card: 56×56 icon tile with gold→orange gradient.
    - Both: dark glass bg, hover lifts 3px and adds magenta halo shadow.
- **Behavior**: Name input required (≥2 chars) to enable role buttons. Selecting Host → goes to Host screen; Player → goes to Join Room screen.

### 2. Join Room (`ConnectScreen`)
- **Purpose**: Player enters the 6-character room code shared by the host.
- **Layout**: Same dark backdrop. Centered card, max-width 520px. Heading "Join the room", subtitle, large monospace code input, primary "Enter" button + ghost "Back" button.
- **Code input** — JetBrains Mono 36px, letter-spacing 0.22em, uppercase, centered, padding 22px. Auto-uppercases input.
- **Error state**: pink-tinted error band below input + shake animation on the input.
- **Behavior**: On Enter, look up the room by code. If not found, show error. If found, generate a 5×5 card (24 random numbers 1–50 + center FREE) and join.

### 3. Host — Calling Numbers (`HostScreen`)
- **Purpose**: Host drives the game — calls the next number, sees who has joined, watches progress.
- **Layout**: Top bar + 2-column grid (1.05fr / 1fr, divided by 1px line).
  - **Left column**:
    - **Session bar**: Room code card (purple-magenta gradient, large monospace code 30px, Copy button) + Players pill (count + green pulse dot).
    - **Stage**: Centered "ball" (160×160 px) showing the last-called number with deep purple radial gradient and an inset highlight. Below: caption with a gradient phrase ("Hot, hot, hot!") + "12 of 50 called".
    - **Call button**: Full-width pink→purple gradient "🎲 Call the next number".
    - **Number board**: 10×5 grid of all 50 numbers. States: idle (dim glass), drawn (purple gradient with inner ring), last-drawn (pink→gold gradient with pulsing glow).
  - **Right column**:
    - **History**: Newest first; circular "balls" (38px), latest one in gold→magenta gradient.
    - **At the table**: Players list — avatar circle (gradient, first letter of name) + name + marks count. Bingo state: gold border + "BINGO!" label.

### 4. Player — Marking the Card (`PlayerScreen`)
- **Purpose**: Player marks their card as numbers are called, then taps BINGO when they have a winning line.
- **Layout**: Top bar + 2-column grid (1.2fr / 1fr).
  - **Left column**:
    - **Session mini bar**: Room code + "with <host name>" + green "live" indicator.
    - **Cartela** (the card): max-width 420px, 5×5 grid, gap 6px. Cell states:
      - **idle** — dark glass, dim.
      - **drawable** (called but not yet marked) — pink/purple tinted bg, magenta border, gentle nudge animation, cursor pointer.
      - **marked** — purple→magenta gradient with gold border, white text, pop animation.
      - **missed** — opacity 0.32 (number called too long ago to be useful — soft visual signal).
      - **FREE** (center) — gold→magenta gradient, dark text, always counted as marked.
    - **BINGO button**: gold→magenta gradient, 26px Bricolage, letter-spacing 0.12em, shine sweep animation. Disabled until the user has a complete row/col/diagonal.
  - **Right column**:
    - **Last number called**: 110px mini-ball + "🎯 it's on your card!" / "not on your card." line.
    - **Called so far**: small (32px) circles for each drawn number; gold ring on numbers that are on the player's card.
    - **At the table**: same player list as host view; "(you)" suffix on the current player.

### 5. Celebration (`CelebrateScreen`)
- **Purpose**: BINGO win — overlay shown to all players when someone wins.
- **Layout**: Full-screen overlay, radial purple→black background, ~90 confetti pieces (varying colors, sizes, rotations) falling from the top. Centered giant "BINGO!" word at 200px with a gold→magenta→purple gradient text-fill and 60px glow shadow. Below: "<winner name> filled the card!" + a Close pill button.
- **Animation**: Word bursts in with a scale-bounce (0.3 → 1.15 → 1). Confetti pieces fall for 2–4s with random delays.

---

## Top bar (shared across in-game screens)
- Brand: "CDaub." (Bricolage 28px, white) + italic slogan "Cards that build Moments." (13px, gold).
- Right side: role chip (purple-tinted pill, uppercase, letter-spacing 0.12em) + player name + Leave button (hover turns magenta).
- Background: `rgba(14,4,32,0.65)` + 20px blur backdrop.

---

## Interactions & Behavior

### Game logic
- **Card generation**: 24 unique numbers from 1–50 placed in a 5×5 grid with `FREE` at the center. Shuffle pool, take first 24.
- **Drawing a number**: pick a random number from the set of un-drawn numbers (1–50). Push to `drawn[]`, set `lastDrawn`, set `lastDrawnAt = Date.now()`.
- **Marking**: a cell can be tapped to toggle its marked state, but only after the number has been drawn. FREE is always marked.
- **Bingo check**: any row, column, or either diagonal fully marked. The BINGO button enables when the check passes; tapping it sets the player's `bingo = true` and the session's `winner = <name>`.

### Animations & transitions
- **Ball reveal**: `cubic-bezier(.2,1.4,.3,1)` scale + slight rotation, 0.7s, on every new number called.
- **Last-drawn number** (on the board): pulses with `glow-pulse` (1.6s ease-in-out infinite, gold halo).
- **Drawable cells**: gentle vertical `nudge` (1.4s ease-in-out infinite, ±3px translateY).
- **Marked cells**: `mark-pop` (0.6 → 1.15 → 1, 0.5s) on toggle.
- **BINGO button**: shimmering shine sweep across the surface (3.5s loop) when enabled.
- **Modal entry**: `welcome-in` — translateY(20px) + scale(0.96) → 0/1, 0.55s.
- **Confetti**: linear fall + 720° rotation, 2–4s, randomized.

### Form validation
- Name: required, ≥2 chars after trim, max 28 chars.
- Room code: required, ≥4 chars (typical is 6), uppercase. Shake + error message on invalid.

### Real-time sync (prototype)
Currently uses `localStorage` + `storage` events + 1s polling fallback. Replace with:
- WebSocket / Server-Sent Events, OR
- Firebase Realtime DB / Firestore, OR
- Supabase Realtime channels (recommended for this scope).

---

## State Management

### Session shape (one per room)
```ts
type Session = {
  code: string;                  // 6 chars: 3 letters + 3 digits (no ambiguous chars I/O/0/1)
  callerName: string;
  createdAt: number;
  drawn: number[];               // ordered call history
  lastDrawn: number | null;
  lastDrawnAt: number | null;
  players: Record<string, Player>;
  winner: string | null;         // winner's display name
};

type Player = {
  id: string;
  name: string;
  joinedAt: number;
  card: (number | "FREE")[][];   // 5x5
  marked: number[];              // numbers the player has tapped
  bingo: boolean;
};
```

### Local user identity
```ts
type Me = {
  name: string;
  session?: string;     // room code if currently in one
  playerId?: string;    // own player id if joined as player
};
```

---

## Design Tokens

### Colors (CSS custom properties)
```css
--bg-0:        #0e0420;   /* deepest background */
--bg-1:        #1a0838;
--bg-2:        #2a0e54;
--purple-1:    #5b21b6;
--purple-2:    #7c3aed;
--purple-3:    #a855f7;
--purple-glow: #c084fc;
--magenta:     #ec4899;
--gold:        #fbbf24;
--cream:       #fdf6e3;
--ink:         #f5edff;   /* primary text */
--ink-dim:     #c4b5d8;
--ink-dimmer:  #8b7aa8;
--line:        rgba(192,132,252,0.18);
--line-strong: rgba(192,132,252,0.35);
```

### Background gradient (page)
```css
background: radial-gradient(ellipse at top, var(--bg-2) 0%, var(--bg-1) 35%, var(--bg-0) 70%);
```
Plus an absolutely-positioned `body::before` overlay with two large radial blooms (purple top-left, magenta bottom-right) for depth.

### Typography
- **Display** — `"Bricolage Grotesque", "Fraunces", serif` — weights 500/600/700/800.
- **UI** — `"Space Grotesk", system-ui, sans-serif` — weights 400/500/600.
- **Mono** — `"JetBrains Mono", "Menlo", monospace` — weights 500/700.

All three are loaded from Google Fonts.

### Spacing / radii
- Panel paddings: 18–24px inside cards.
- Border radii: 10px (number tiles), 14px (inputs/buttons), 18–24px (cards/modals).
- Gaps: 6–8px in grids, 14–18px in horizontal bars.

### Shadows
```css
--shadow-glow:  0 0 60px rgba(168, 85, 247, 0.45);
--shadow-deep:  0 30px 80px -20px rgba(0, 0, 0, 0.6);
```
Plus inset highlights on the ball: `inset -20px -30px 60px rgba(0,0,0,0.45), inset 18px 22px 50px rgba(255,255,255,0.18)`.

### Animations (key keyframes — full source in `styles.css`)
- `ball-pop`, `reveal`, `ball-float`
- `glow-pulse`, `pulse`
- `nudge`, `mark-pop`
- `shine` (BINGO button), `word-burst` (celebration), `confetti-fall`
- `shake` (invalid code input), `shroud-in` (modal backdrop)

---

## Assets
No external image assets — everything is rendered with CSS gradients, shadows, and the three Google Fonts above. Two emoji are used in copy ("🎙️", "🎟️", "🎲", "🎯"). Replace with vector icons matching the target codebase's icon set if appropriate.

---

## Files in this handoff

- **`index.html`** — entry HTML for the runnable prototype (loads React 18 + Babel standalone + the JSX files below).
- **`app.jsx`** — full React app: `Welcome`, `ConnectModal`, `CallerScreen` (host), `PlayerGame`, `Celebrate`, and the `App` router. ~700 lines, includes the localStorage sync logic.
- **`styles.css`** — the complete design system (~1100 lines): tokens, every screen's layout, every animation.
- **`All Screens.html`** — design canvas presenting all 5 screens side by side (static mocks; load this to see the system at a glance).
- **`screens-welcome.jsx`** — static mock of Welcome + Connect.
- **`screens-host.jsx`** — static mock of the Host screen.
- **`screens-player.jsx`** — static mock of the Player screen + Celebration overlay.
- **`design-canvas.jsx`** — pan/zoom canvas component used by `All Screens.html`.

The runnable prototype lives at `index.html`; the static all-screens mock lives at `All Screens.html`. Both are good references for the final implementation.

---

## Suggested implementation approach

1. Scaffold the framework (Next.js App Router + Tailwind, or Vite + React, or your target stack).
2. Port `styles.css` design tokens to your styling system (Tailwind theme, CSS Modules, etc.).
3. Build the screens as separate components, lifting layout from the static mocks in `screens-*.jsx`.
4. Replace the `localStorage` sync layer in `app.jsx` with a real backend:
   - Rooms collection keyed by code.
   - Players sub-collection per room.
   - Real-time subscriptions for `drawn`, `players`, `winner`.
5. Validate room code uniqueness on creation (retry on collision).
6. Add proper auth or anon session tokens so players can't impersonate each other.
7. (Stretch) Add server-side BINGO verification — currently the player's client unilaterally declares a win.

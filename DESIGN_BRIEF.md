# Domino Score — Design brief for AI (e.g. ChatGPT)

Use this document to give an AI assistant full context on the app so you can discuss **design improvements** (UI, UX, visual hierarchy, accessibility, etc.). Copy or share it when starting a design-focused conversation.

---

## 1. What the app is

**Domino Score** is a **mobile-first web app** for tracking scores in **Dominican-style dominoes**. It is aimed at **bilingual Hispanics** (English/Spanish). The app:

- Runs in the browser and as a **PWA** (add to home screen; standalone mode).
- Detects device language and shows **English** or **Spanish** (Spanish uses “500 con premios” and “premios” for bonuses).
- Is **offline-capable** after first load (service worker caches the app).
- Has **no backend**; state is stored in `localStorage`.

**Core job**: During a match, the user records who won each hand, how many points (from leftover pips and bonuses), and which team gets those points. The app keeps running match scores and history.

---

## 2. Target users

- People who play **Dominican dominoes** (or similar rules).
- **Bilingual** (English/Spanish); may use the app in either language.
- Using the app **during play** on a phone — often in a social setting, possibly with **fast tapping** on the pip buttons.
- Some use it **saved as an app** (home screen); others in the **browser**. Layout must work in both (e.g. safe-area padding only in standalone so the browser view isn’t pushed down).

---

## 3. User flow (how someone uses the app)

1. **Open the app**  
   Sees the main screen: a blue score card, current hand total (0), match score (Team A: 0 / target • Team B: 0 / target), and who is selected to receive points (Team A or Team B).

2. **After a hand is decided**  
   - **Choose who won:** Tap **Team A** or **Team B** (tabs under the card). The selected tab is bold with a blue underline; that team will receive the points when they apply.
   - **Enter leftover pips:** Tap the **pip buttons** (1–6 dots, like domino/dice faces) to add the losing team’s leftover pip values. The blue card shows a calculator-style area: pips on the right, big total on the right. Example: tap 5, 3, 2 → total 10.
   - **Add bonuses (optional):** Check any that apply:
     - **Pase primera mano** (opening pass) — 10 or 25 pts depending on game type.
     - **Pase corrido** (skipping everyone) — default 25 pts.
     - **Capicúa** (matching ends) — default 50 pts.
     - **Chuchazo** (double-blank) — default 50 pts.  
   Each has a small “?” tooltip.
   - **Apply:** Tap **Apply score**. A confirm dialog shows the breakdown; on confirm, points are added to the selected team, the match score updates (with a **count-up animation** and **highlight** on the team that received points), and the current-hand inputs clear.  
   - **Mid-hand vs end-of-hand:** If *only* opening pass and/or pase corrido are applied (no pips, no capicúa, no chuchazo), the hand is treated as **mid-hand** — no round bonus (in 500 con premios), round number doesn’t advance. Otherwise it’s **end of hand** (round bonus applies when relevant).

3. **Match score visibility**  
   The **match score** (Team A: X / target • Team B: Y / target) lives at the **bottom of the blue score card**, right-aligned, below a thin divider. It’s the main “where are we in the game?” reference. When a score changes, that team’s number counts up and briefly highlights so it’s obvious.

4. **History**  
   Tap the **clock** icon (top left of the blue card) to open **Recent hands**: a list of past applications (time, type WIN/MID, team, detail, +points). Each entry has a **“Move to [other team]”** button to correct mis-applied scores (points move to the other team; the entry stays). **New game** is also there.

5. **Settings (Options)**  
   Tap the **gear** icon to open **Options**: game type (200, 250, 500, 500 con premios), toggles (opening pass, “in 500 count all hands on win”), and configurable bonus point values. **Done/Apply** saves and closes.

6. **Rules (How to)**  
   Tap the **?** icon to open **Rules**: scrollable explanation of how scoring works (leftover pips, opening pass, pase corrido, capicúa, chuchazo, tranque, game types). For onboarding or quick reference.

7. **Game over**  
   When a team reaches the target score, a **game over overlay** appears (“Team A wins!”, “First to 250”, **Start new game**). Tapping **Start new game** prompts for team names and resets scores and history.

---

## 4. Layout and design (current)

- **Overall:** Single column, mobile-first. Max width ~600px, centered. Light background (`#fafafa`), dark text (`#2d2d2d`).
- **Top:** Safe-area padding only in **standalone** (saved app) so content isn’t under the notch/status bar; in the browser there’s no extra top padding so the bottom CTAs stay in view.
- **Score card (blue block):**
  - **Header row:** Clock (history) left, **target chip** center (e.g. “500 con premios” or “Target: 250”), Rules (?) and Settings (gear) right.
  - **Math row:** Pips (or placeholder “Tap dots to add points”) **right-aligned**; total is a **large number** on the right (calculator-style). No “points” label.
  - **Divider line**, then **match score** one line: “Team A: 0 / 250 · Team B: 0 / 250”, **right-aligned**.
  - Compact vertical spacing; reduced height (smaller padding, gaps, total font size) so the card doesn’t dominate the screen.
- **Under the card:**  
  - **Team tabs** (Team A | Team B) to choose who receives the current hand’s points.  
  - Short line: “X pts • Award to Team A” (or B).  
  - **Pip buttons:** Grid of 6 large tappable buttons (1–6 dots), with `touch-action: manipulation` to avoid double-tap zoom when tapping fast. Light border, subtle shadow.  
  - **Bonus checkboxes** (four items, each with “?”).  
  - **Clear hand** (secondary) and **Apply score** (primary blue). The action row is **sticky** at the bottom with bottom padding (and safe-area) so it doesn’t sit on the screen edge.
- **Overlays:**  
  - **History:** Full-screen list from the left (same max width).  
  - **Options & Rules:** Centered overlay with a panel (same max width as history), header with title and close (×).  
  - **Game over:** Centered modal with title, subtitle, and one primary button.  
  - Safe-area padding for these is applied **only in standalone** so browser layout isn’t affected.
- **Typography:** DM Sans (400, 600, 700). Clear hierarchy: big total, then match score, then labels and body.
- **Colors:**  
  - Primary blue: `#5f7dff` (card, primary buttons, active states).  
  - Orange for deltas in history: `#ff6b35`.  
  - Pip dots use a small palette (blue, green, red, brown, etc.) for quick recognition.
- **Accessibility:** Focus-visible outline on pip buttons; aria-labels where needed; semantic structure.

---

## 5. Technical context (for design suggestions)

- **Stack:** Vanilla HTML, CSS, JS. No framework. PWA with manifest and service worker.
- **i18n:** All UI strings in a JS object (en/es); `data-i18n` and `data-i18n-aria` for static text; dynamic text via `t(key, replacements)`.
- **State:** One game object in memory; persisted to `localStorage`. No server.
- **Animations:** CSS (e.g. score highlight); JS count-up for score changes (e.g. 10 → 25 over ~380ms).

When suggesting design improvements, assume we can change CSS freely, add/change HTML structure, and adjust JS for any new UI (e.g. new buttons or layout). We want to keep the app simple and fast on mobile; no heavy dependencies.

---

## 6. What to improve (design focus)

Use this brief so the AI can suggest **design improvements** that fit the existing flow and audience, for example:

- Visual hierarchy and readability (especially on small screens).
- Consistency (spacing, buttons, overlays).
- Accessibility (contrast, focus, touch targets, reduced motion).
- Clarity of “who gets the points” and “what is the match score.”
- Reducing cognitive load during fast play.
- PWA/standalone vs browser layout and safe areas.
- Any layout or component that feels cramped, confusing, or easy to tap wrong.

The AI should understand that the **user flow** (select team → add pips → add bonuses → apply; history, options, rules) is fixed; suggestions should improve **how** it looks and feels, not change the core steps.

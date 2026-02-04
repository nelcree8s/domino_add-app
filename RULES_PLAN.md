# Dominican Dominoes — Rules Plan (for discussion)

A draft so players can understand the rules and how bonuses work. Based on your initial explanation; we can adjust wording and order.

---

## 1. Objective & setup

- **Goal**: Be the first team to reach the **target score** (200, 250, or 500).
- **Teams**: Two teams (e.g. Team A vs Team B). Partners sit across from each other.
- **Deck**: Double-six set (0–0 through 6–6). Shuffle; each player draws **7 pieces**.
- **Play**: Counter-clockwise. Pieces are played in a **chain**; you match one end of your piece to an open end on the table. Doubles are placed **crosswise** (“se acuestan”); you may only play from the **open ends** of the chain, not off the sides of doubles.

---

## 2. How you score points (six ways)

### 2.1 Winning the hand (leftover pieces)

- When a player **gets rid of all their pieces**, their team wins the hand.
- Add up the **dots on all pieces not played**.
- That total is added to the **winning team’s score**.
- _(In 500-point games, some play that you count **all** players’ remaining pieces for the winner; the app has an option for this.)_

**In the app**: Tap the dot buttons to add the **losing team’s** leftover pips, choose which team **won**, then tap **Apply score**.

---

### 2.2 Pase primera mano (opening pass)

- **When**: Only on the **very first play** of the hand (the first domino on the table).
- **What**: The first player plays one piece. If the **next** player has nothing that matches either open end, they **pass**.
- **Points**: The team of the first player gets **10** (games to 200 or 250) or **25** (games to 500).
- **Nullified**: If the **next** player after that also cannot play, the points are **not** awarded; the following player plays if they can.

**In the app**: Check **Pase primera mano (opening pass)** when this happens, then apply the score to the team that got the pass.

---

### 2.3 Pase corrido (skipping everyone)

- **When**: A player plays a piece and **all three opponents** cannot play in turn.
- **Points**: **25** to the team of the player who made that play.
- **Extra**: That player then **plays again** (no limit on how many pase corridos in one hand).

**In the app**: Check **Pase corrido (skipping everyone)** and apply the score to the team that executed it. Default **25** pts; configurable in Options.

---

### 2.4 Capicúa (matching ends)

- **When**: The **last** piece of the hand is played and its **free end matches the number at the opposite end** of the chain (the line “reads” the same from both ends).
- **Points**: **50** to the winning team (default; configurable in Options).
- **Nullified**: If that closing play is made with a **blank** or a **double**, the Capicúa bonus is **not** awarded.

**In the app**: Check **Capicúa (matching ends)** when it happens and apply the score.

---

### 2.5 Chuchazo (double-blank)

- **When**: The **winning piece** (the one that empties the player's hand) is the **double-blank** (0–0), "la Chucha!"
- **Points**: **50** to the winning team (default; configurable in Options).

**In the app**: Check **Chuchazo (double-blank)** when the hand is won with the double-blank and apply the score.

---

### 2.6 Tranque (lock)

- **When**: The board is **locked** — no one can play (all playable numbers are blocked).
- **How to resolve**: The player who locked it shows their hand to the player to their **right** (“tranquar con el de abajo”). Whoever has **fewer pips** in hand wins; that team gets the **sum of the opponents’ leftover pips**.
- **Tie**: If the two compared hands are tied, the **player who started the hand** (placed the first domino) wins for their team.
- _(Some play “tranquar con todo el mundo” and compare with everyone; the lowest hand wins.)_

**In the app**: For now the app treats this like a normal hand win: add the losers’ pips and award to the winning team. A dedicated “Tranque” type could be added later if you want it called out separately.

---

## 3. Game types in the app

- **200** — First to 200.
- **250** — First to 250.
- **500** — First to 500.
- **500 with bonuses** — First to 500, plus **round bonuses** for the winner of each hand:
  - Round 1: **+100**
  - Round 2: **+75**
  - Round 3: **+50**
  - Round 4: **+25**
  - Round 5+: no extra round bonus  
    The round bonus is **added on top of** leftover pips and any Pase primera mano / Pase corrido / Capicúa / Chuchazo for that hand.

---

## 4. Bonus points (configurable in Options)

- **Pase corrido** — default **25** pts.
- **Capicúa** — default **50** pts.
- **Chuchazo** — default **50** pts.

Opening pass stays **10** (200/250) or **25** (500) by game type.

---

## 5. Suggested “Rules” content for the app

Options for where and how to show this:

1. **Short in-app “How to score”**  
   One screen: six ways to score (titles + one line each), plus “In this game: target X” and, if 500 with bonuses, “Round bonuses: 100, 75, 50, 25.”

2. **Expandable sections**  
   Same six ways, each expandable for the nullification and “in the app” details.

3. **Link to full rules**  
   Button that opens this (or a simplified) RULES_PLAN in the app (e.g. as a scrollable overlay or a separate page).

4. **Tooltips on checkboxes**  
   Next to **Pase primera mano (opening pass)**, **Pase corrido (skipping everyone)**, **Capicúa (matching ends)**, **Chuchazo (double-blank)**: a (?) that shows the one-paragraph explanation and nullification.

---

## 6. Open points

- **Tranque**: Keep as “award to winner like a normal hand” or add a distinct “Tranque” hand type and UI?
- **“Count all hands in 500”**: Keep as an option and explain it in rules (“In 500, some count every hand; others only the winner’s opponents.”)?
- **Wording**: Prefer “leftover pips” vs “pieces in hand” vs “fichas” in the app text?
- **Length**: One short screen vs full rules; and whether to offer both (short + “Full rules” link).

---

If you tell me your preferences (e.g. “short only”, “short + full in overlay”, “add Tranque as its own type”), we can turn this into the exact copy and structure for the app and then you can paste it into the UI or README.

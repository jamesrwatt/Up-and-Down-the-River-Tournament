# 🃏 Up & Down the River — Tournament Tracker

<div align="center">

![Up & Down the River](icon-192.png)

**A Progressive Web App for tracking card game tournaments**

[![Live App](https://img.shields.io/badge/▶_Live_App-Play_Now-1a6b3c?style=for-the-badge)](https://jamesrwatt.github.io/Up-and-Down-the-River-Tournament/)
[![PWA Ready](https://img.shields.io/badge/PWA-Ready-c9a84c?style=for-the-badge&logo=pwa)](https://jamesrwatt.github.io/Up-and-Down-the-River-Tournament/)
[![No Install](https://img.shields.io/badge/No_Install-Required-3a7bd5?style=for-the-badge)](https://jamesrwatt.github.io/Up-and-Down-the-River-Tournament/)

*Works on any phone or tablet · Offline capable · Cloud sync optional*

</div>

---

## 📖 Table of Contents

1. [What Is This App?](#-what-is-this-app)
2. [How to Access](#-how-to-access)
3. [How to Play the Game](#-how-to-play-the-game)
4. [App Features](#-app-features)
5. [Roles & Permissions](#-roles--permissions)
6. [Tournament & Scoring Rules](#-tournament--scoring-rules)
7. [Financial Tracking (The Pot)](#-financial-tracking-the-pot)
8. [Statistics Tracked](#-statistics-tracked)
9. [Cloud Sync Setup on Google Sheets](#-cloud-sync-setup-on-google-sheets)
10. [GitHub Pages Deployment](#-github-pages-deployment)
11. [File Structure](#-file-structure)
12. [Technical Details](#-technical-details)
13. [Frequently Asked Questions](#-frequently-asked-questions)
14. [Changelog](#-changelog)

---

## 🎯 What Is This App?

**Up & Down the River** is a trick-taking card game where players bid on how many tricks they'll take each hand. This app is a full-featured **tournament tracker** designed for regular home game groups — built as a Progressive Web App so anyone at the table can open it on their phone, no installation required.

### What it does:
- Guides the Scorekeeper through every round of bidding and tricks
- Enforces all game rules automatically (dealer rule, trump rotation, river sequence)
- Calculates scores, tournament standings, and financial contributions in real time
- Tracks detailed statistics across every game ever played
- Syncs data to a Google Sheet so everyone can see live results
- Works completely offline once loaded

---

## 📱 How to Access

### Option 1 — Open in Browser (Instant, No Install)
Visit: **https://jamesrwatt.github.io/Up-and-Down-the-River-Tournament/**

Works in Chrome, Safari, Firefox, and Edge on any device.

### Option 2 — Add to Home Screen (Recommended)

**On Android (Chrome):**
1. Open the app URL in Chrome
2. Tap the **⋮ menu** (top right)
3. Tap **"Add to Home Screen"**
4. Tap **"Add"** — the app icon will appear on your home screen

**On iPhone/iPad (Safari):**
1. Open the app URL in **Safari** (must be Safari, not Chrome)
2. Tap the **Share button** (box with arrow, bottom center)
3. Scroll down and tap **"Add to Home Screen"**
4. Tap **"Add"** — the app icon will appear on your home screen

**On Desktop (Chrome/Edge):**
1. Open the app URL
2. Click the **install icon** (⊕) in the address bar
3. Click **"Install"**

> **Why add to home screen?** It launches full-screen like a native app, works offline, and loads faster.

### Option 3 — Share via QR Code
Inside the app, tap **Settings (⚙)** → scroll down to see the QR code. Other players can scan it to open the app instantly.

---

## 🃏 How to Play the Game

### The Basic Concept
Up and Down the River is a bidding card game. Players must predict exactly how many tricks they'll win each round. Make your bid exactly → bonus points. Miss your bid → only the tricks you took.

### The River
The game follows a "river" sequence of rounds:
- **Going Up:** 1 card, 2 cards, 3 cards … up to the maximum
- **Peak:** Maximum cards (based on player count)
- **Going Down:** … back down to 1 card

The maximum cards per round is: `min(10, floor(52 ÷ number_of_players))`

| Players | Max Cards | Total Rounds |
|---------|-----------|--------------|
| 2       | 10        | 19           |
| 3       | 10        | 19           |
| 4       | 10        | 19           |
| 5       | 10        | 19           |
| 6       | 8         | 15           |
| 7       | 7         | 13           |
| 8       | 6         | 11           |

### Trump Suit Rotation
Trump suits cycle through: **Hearts → Clubs → Diamonds → Spades → Hearts …**

**Special middle 5 rounds** of the river alternate with No Trump:
`No Trump → [Next Suit] → No Trump → [Next Suit] → No Trump`

### Dealer Rule
The **dealer cannot bid** a number that would allow the total bids to equal the number of cards in play. This ensures at least one player will be "set" (miss their bid) every round.

### Scoring
| Result | Points |
|--------|--------|
| Made your bid exactly | **10 + number of tricks taken** |
| Missed your bid | **Only tricks taken** (no 10-point bonus) |

---

## ✨ App Features

### Game Flow
- **Bidding Phase** — Enter each player's bid; the last bidder is automatically restricted by the dealer rule
- **Tricks Phase** — Enter tricks taken; app validates they sum to cards in play
- **Auto-Advance** — Moves to next round automatically when tricks are valid
- **Instant Scoring** — Running totals update after every committed round

### During a Game
| Feature | Description |
|---------|-------------|
| **Edit Round** | Tap ✎ Edit to correct any previously entered round; scores recalculate automatically |
| **Save & Exit** | Leave mid-game to view tournament standings; resume exactly where you left off |
| **Resume** | Green button on home screen appears whenever a game is in progress |
| **Dealer Tracking** | Dealer rotates automatically each round and is displayed prominently |
| **Trump Badge** | Color-coded trump indicator (red for Hearts/Diamonds, white for Clubs/Spades, grey for No Trump) |

### Home Screen
- **Tournament progress bar** — 20 pip indicators showing games played, current, and remaining
- **Live standings table** — All stats update the moment each game is finalized
- **Finalize Tournament** — Close out a tournament early and start fresh

### Leaderboard
- Tap **🏆 Leaderboard** to open all-time stats modal
- Filter by individual tournament or view all-time combined
- Same comprehensive stat table as tournament standings

### Settings
- Role selector (Viewer / Scorekeeper / Admin)
- Google Apps Script URL configuration
- QR code for sharing the app
- Admin and Scorekeeper management controls

---

## 🔐 Roles & Permissions

The app has three roles selected in **Settings (⚙)**:

### 👁 Viewer (Default)
- Reads live data from the cloud automatically on load
- Can view all tournament standings and leaderboard stats
- **Cannot** start games, enter scores, or modify any data
- Perfect for players watching the tournament who just want to see standings

### ✏️ Scorekeeper
- All Viewer abilities, plus:
- Can start new games and enter scores
- Can save/exit and resume games
- Can finalize tournaments early
- Can clear local tournament and leaderboard data
- **Operates on local device only** — does not sync to cloud
- No password required — trust-based role

### 🔑 Admin
- All Scorekeeper abilities, plus:
- **Syncs to and from the cloud** (Google Sheets)
- Can push data to cloud after each game
- Can clear tournament or leaderboard data from the cloud
- Requires the admin password: `RiverAdmin2026`

> **To change the admin password:** Edit the `ADMIN_PASSWORD` constant at the top of the `<script>` section in `index.html`.

---

## 🏆 Tournament & Scoring Rules

### Tournament Structure
- A standard tournament is **20 games**
- Before starting a 21st game, the app prompts to finalize the current tournament
- Admins and Scorekeepers can finalize a tournament early at any time
- Each tournament gets a unique ID based on the start date (e.g., `T20240615`)

### Tournament Points System
Tournament Points (T-Points) are awarded after each game based on final game score ranking:

| Finish Position | T-Points (5-player game) |
|----------------|--------------------------|
| 1st Place      | 5 |
| 2nd Place      | 4 |
| 3rd Place      | 3 |
| 4th Place      | 2 |
| 5th Place      | 1 |

In an N-player game, 1st place always gets N points, last place always gets 1 point.

**Ties:** Tied players share the highest available rank's points. Example: two players tied for 2nd in a 5-player game both receive 4 points (not averaged).

---

## 💰 Financial Tracking (The Pot)

The app automatically calculates how much each player owes the pot after each game. All amounts are calculated when a game is finalized — no manual tracking needed.

### Money From Losses — $1.00
The player who finishes **last place** (lowest total game score) pays **$1.00** into the pot.
- Applied per game, not per round
- If multiple players tie for last, each pays $1.00

### Money From Penalties — $1.00 per increment
A performance penalty based on the **Tournament Threshold**:

**Threshold Formula:**
```
Threshold = (10 × (2 × maxCards − 1) − 20) − (10 × numberOfPlayers)
```

| Players | Max Cards | Threshold |
|---------|-----------|-----------|
| 4       | 10        | 130       |
| 5       | 10        | 120       |
| 6       | 8         | 90        |
| 7       | 7         | 70        |

**How penalties work:**
- Score below threshold by 1–10 points → **$1.00**
- Score below threshold by 11–20 points → **$2.00**
- Score below threshold by 21–30 points → **$3.00**
- …and so on in $1 increments for every 10 points below

**Example (5-player game, threshold = 120):**
| Player | Score | Penalty |
|--------|-------|---------|
| Mom    | 145   | $0      |
| Georgia| 122   | $0      |
| Lucy   | 118   | $1 (2 pts below) |
| Jack   | 109   | $2 (11 pts below) |
| Dad    | 95    | $3 (25 pts below) |

Players can owe both a loss penalty AND a performance penalty in the same game.

---

## 📊 Statistics Tracked

The app tracks the following statistics for every player, for both the current tournament and all-time:

### Points Distribution
| Stat | Description |
|------|-------------|
| Total Tournament Points | Sum of all T-Points earned |
| Games Earning 5 T-Points | Count of 1st place finishes |
| Games Earning 4 T-Points | Count of 2nd place finishes |
| Games Earning 3 T-Points | Count of 3rd place finishes |
| Games Earning 2 T-Points | Count of 4th place finishes |
| Games Earning 1 T-Point | Count of last place finishes |

### Financials
| Stat | Description |
|------|-------------|
| Money From Losses | Total paid for last-place finishes |
| Money From Penalties | Total paid for below-threshold scores |
| Total Money in Pot | Combined total owed |
| Most Money Paid in One Game | Single-game maximum contribution |

### General Scoring
| Stat | Description |
|------|-------------|
| Average Game Points | Mean score across all games played |
| Total Game Points | Cumulative score across all games |
| Total Number of Sets | Times a bid was missed |
| Total Number of Tricks | Total tricks won across all rounds |

### Game Records
| Stat | Description |
|------|-------------|
| Most Sets in One Game | Worst bidding game |
| Least Sets in One Game | Best bidding game |
| Most Tricks in One Game | Most tricks ever won in a single game |
| Least Tricks in One Game | Fewest tricks ever won in a single game |
| Lowest Score Ever | Personal worst game score |
| Highest Score Ever | Personal best game score |

### Streaks
| Stat | Description |
|------|-------------|
| Longest Winning Streak (Games) | Most consecutive 1st place game finishes |
| Longest Losing Streak (Games) | Most consecutive last place game finishes |
| Longest Winning Streak (Hands) | Most consecutive made bids in a row |
| Longest Losing Streak (Hands) | Most consecutive missed bids in a row |
| Longest Streak Without Paying | Most consecutive games paying $0 to the pot |
| Longest Streak With Paying | Most consecutive games paying into the pot |

---

## ☁️ Cloud Sync Setup on Google Sheets

Cloud sync is optional. Scorekeepers can run the entire app locally. Admins get live sync to a shared Google Sheet.

### Step 1 — Create the Google Sheet
1. Go to [sheets.google.com](https://sheets.google.com) and create a new blank spreadsheet
2. Name it something like "River Tournament"
3. Note the spreadsheet ID from the URL: `https://docs.google.com/spreadsheets/d/`**`YOUR_ID_HERE`**`/edit`

### Step 2 — Create the Apps Script
1. In your Google Sheet, click **Extensions → Apps Script**
2. Delete all existing code in the editor
3. Open `gas_script.js` from this repository and **paste the entire contents**
4. Click **Save** (💾 icon or Ctrl+S)

### Step 3 — Deploy as Web App
1. Click **Deploy → New Deployment**
2. Click the gear icon ⚙ next to "Type" and select **Web app**
3. Fill in the settings:
   - **Description:** River Tournament API
   - **Execute as:** Me
   - **Who has access:** Anyone
4. Click **Deploy**
5. Click **Authorize access** and follow the Google sign-in prompts
6. Copy the **Web App URL** — it will look like:
   `https://script.google.com/macros/s/AKfycb.../exec`

### Step 4 — Configure the App
1. Open the River app
2. Tap **Settings (⚙)**
3. Select **Admin** role and enter the password
4. Paste your Web App URL into the **Google Apps Script URL** field
5. Tap **Save Settings**

The app will now automatically sync data to your Google Sheet. The sheet will have four tabs:
- **Game Archive** — Every round of every game with all bids and scores
- **Tournament Stats** — Current tournament statistics table
- **Leaderboard Stats** — All-time statistics table
- **Meta** — Raw JSON data store (do not edit manually)

### Re-deploying After Changes
If you edit the Apps Script code, you must create a **new deployment** (not update existing) for changes to take effect:
1. **Deploy → New Deployment**
2. Copy the new URL and update it in the app's Settings

### Manual Stats Refresh
If you ever need to rebuild all stats from the Game Archive tab (e.g., after manually correcting data in the sheet):
1. Open Apps Script editor
2. Select the `manualStatsRefresh` function from the dropdown
3. Click **Run ▶**

This will re-parse the entire Game Archive, recalculate all stats, update all sheet tabs, and sync the data store.

---

## 🚀 GitHub Pages Deployment

To host your own copy of the app:

### Step 1 — Fork or Clone the Repository
```bash
# Clone
git clone https://jamesrwatt.github.io/Up-and-Down-the-River-Tournament.git
cd Up-and-Down-the-River-Tournament

# Or fork via GitHub UI, then clone your fork
```

### Step 2 — Customize (Optional)
Edit `index.html` to change:
```javascript
// Line ~3 of the <script> section:
const ADMIN_PASSWORD = 'RiverAdmin2026';      // ← change your admin password
const DEFAULT_PLAYERS = 'Mom, Georgia, Lucy, Jack, Dad';  // ← change default players
```

### Step 3 — Enable GitHub Pages
1. Go to your repository on GitHub
2. Click **Settings** tab
3. Click **Pages** in the left sidebar
4. Under **Source**, select **Deploy from a branch**
5. Set branch to **main** (or **master**) and folder to **/ (root)**
6. Click **Save**

Your app will be live at: `https://YOUR_USERNAME.github.io/REPO_NAME/`

### Step 4 — Update the App URL
In `index.html`, update the app URL constant and the QR code target:
```javascript
const APP_URL = 'https://YOUR_USERNAME.github.io/YOUR_REPO_NAME/';
```

### Keeping it Updated
```bash
git add .
git commit -m "Update app"
git push
```
GitHub Pages will automatically redeploy within ~1 minute.

---

## 📁 File Structure

```
Up-and-Down-the-River-Tournament/
│
├── index.html          # Complete PWA app (HTML + CSS + JavaScript)
│                       # Everything is self-contained in this one file
│
├── manifest.json       # PWA manifest — enables "Add to Home Screen"
│                       # Defines app name, colors, icons, display mode
│
├── sw.js               # Service Worker — enables offline use
│                       # Caches assets on first load, serves from cache
│
├── gas_script.js       # Google Apps Script backend code
│                       # Paste into Apps Script editor (NOT hosted here)
│
├── icon-192.png        # App icon 192×192 (Android home screen)
├── icon-512.png        # App icon 512×512 (splash screens, PWA stores)
│
└── README.md           # This file
```

### Inside `index.html`

The single HTML file is organized into clear sections:

```
index.html
├── <head>
│   ├── PWA meta tags
│   ├── Font imports (Playfair Display, Crimson Pro, Courier Prime)
│   └── <style> — Complete CSS (~600 lines)
│       ├── CSS custom properties (design tokens)
│       ├── Screen & layout styles
│       ├── Component styles (buttons, modals, tables, toasts)
│       └── Responsive breakpoints
│
├── <body>
│   ├── #screen-home — Tournament standings & navigation
│   ├── #screen-game — Live game bidding/tricks entry
│   ├── #modal-new-game — Player setup
│   ├── #modal-leaderboard — All-time stats
│   ├── #modal-settings — Role, URL, QR code, admin controls
│   ├── #modal-edit-round — Round correction
│   └── #modal-confirm — Destructive action confirmation
│
└── <script> — Complete JavaScript (~700 lines)
    ├── Constants & global variables
    ├── cacheUI() — DOM element caching
    ├── checkPermissions() — Role-based access control
    ├── buildRiver() / buildRoundList() — Game structure
    ├── getTrump() — Trump suit sequencing
    ├── scoreRound() / calcGameScore() — Scoring engine
    ├── calcThreshold() / calcFinancials() — Pot calculations
    ├── calcTournamentPoints() — T-point ranking with tie handling
    ├── calcStats() — Full statistics engine (both datasets)
    ├── STAT_ROWS / renderStatsTable() — Table rendering
    ├── renderHome() / renderLeaderboard() — Screen rendering
    ├── renderGameScreen() / renderEntryGrid() — Game UI
    ├── submitEntry() / commitRound() / finalizeGame() — Game flow
    ├── openEditRound() / saveEditedRound() — Round editing
    ├── pullFromCloud() / pushToCloud() — Cloud sync
    ├── saveLocal() / loadLocal() — localStorage persistence
    ├── openModal() / closeModal() / showConfirm() / showToast() — UI utilities
    ├── bindEvents() — All event listeners
    └── init() — App initialization
```

---

## 🔧 Technical Details

### Progressive Web App
- **Offline First:** Service worker caches all assets on first load; the app works with no internet connection after that
- **Installable:** Meets all PWA install criteria (manifest, service worker, HTTPS)
- **No dependencies:** Zero npm packages, no build step, no bundler — just open the HTML file
- **Single file:** The entire app except icons is self-contained in `index.html`

### Data Storage
| Layer | Technology | Used For |
|-------|-----------|---------|
| Local | `localStorage` | Game in progress, tournament data, settings |
| Cloud | Google Apps Script | Shared data across all devices (Admin only) |

**Data structure:**
```javascript
// allTime — all games ever played
allTime = {
  games: [
    {
      id, tournamentId, gameNum, date,
      players: ['Mom', 'Georgia', ...],
      maxCards, threshold,
      rounds: [{ roundNum, cards, trump, scores: [{ name, bid, tricks, score, made }] }],
      totals:     { 'Mom': 145, 'Georgia': 122, ... },
      financials: { 'Mom': { losses: 0, penalties: 0, total: 0 }, ... },
      tPoints:    { 'Mom': 5, 'Georgia': 4, ... }
    },
    ...
  ]
}

// currentTournament — filtered view of allTime for current tournament
currentTournament = {
  id: 'T20240615',
  games: [ ...same structure as allTime.games... ]
}
```

### Browser Compatibility
| Browser | Android | iOS | Desktop |
|---------|---------|-----|---------|
| Chrome  | ✅ Full PWA | ✅ | ✅ Full PWA |
| Safari  | ✅ | ✅ Full PWA | ✅ |
| Firefox | ✅ | ✅ | ✅ |
| Edge    | ✅ | ✅ | ✅ Full PWA |

### Performance
- First load: ~200KB (including fonts)
- Subsequent loads: instant (served from service worker cache)
- No server required — runs entirely in the browser

### Security
- Admin password is stored as a constant in `index.html` — change it before deploying
- The Google Apps Script URL is stored in `localStorage` — it is not hardcoded
- No user data is sent anywhere except your own Google Apps Script endpoint
- All cloud communication goes directly between the browser and your personal Google account's Apps Script

---

## ❓ Frequently Asked Questions

**Q: Do all players need the app?**
A: No. Only the Scorekeeper needs to interact with the app. Other players can open it as Viewers to watch the standings update in real time, but it's not required.

**Q: What happens if the Scorekeeper's phone dies mid-game?**
A: The game is saved to the device's localStorage after every round committed. As long as you open the app again on the same device, you can resume exactly where you left off.

**Q: Can two people enter scores at the same time?**
A: No — only one Scorekeeper should enter data at a time. Viewers see read-only cloud data; they cannot edit. If two devices try to push simultaneously, the last write wins.

**Q: What if I made a mistake in a previous round?**
A: Tap the **✎ Edit** button during a game. Select the round you want to fix, update the bids and/or tricks, and save. All scores will recalculate automatically.

**Q: Can I change players between games in a tournament?**
A: Yes. Each game can have different players. The statistics engine handles players joining or leaving and tracks each player's stats independently. The standings table shows all players who have appeared in at least one game.

**Q: How do I start a brand new tournament?**
A: Go to **Settings → Finalize Tournament** (Scorekeeper/Admin) or tap the **Finalize** button on the home screen. This archives the current tournament and starts fresh.

**Q: The Google Sheets sync isn't working. What do I check?**
A: 
1. Make sure you deployed as a **Web App**, not just saved the script
2. Make sure **"Who has access"** is set to **"Anyone"** (not "Anyone with Google account")
3. Make sure you copied the **/exec** URL, not the **/dev** URL
4. Try creating a **new deployment** (changes require a new deployment to take effect)
5. Check that you're using the **Admin** role in the app settings

**Q: Can I use this for a different card game?**
A: The app is purpose-built for Up and Down the River's specific rules (river sequence, trump rotation, dealer rule, threshold scoring). Adapting it for other games would require modifying the core game logic functions.

**Q: How do I share the app with other players quickly?**
A: Open **Settings (⚙)** and show them the QR code at the bottom. They scan it and the app opens instantly in their browser. They can then add it to their home screen.

---

## 📝 Changelog

### v1.0.0 — Initial Release
- Full game flow: bidding → tricks → scoring → finalization
- Dealer rule enforcement (bids cannot equal cards in play)
- Trump rotation with middle No Trump sequence
- Tournament Points with tie-sharing
- Financial tracking: last-place losses + threshold penalties
- Complete statistics engine (30+ stats per player)
- Tournament Standings table on home screen
- All-Time Leaderboard modal with tournament filter
- Three-role permission system (Viewer / Scorekeeper / Admin)
- Google Apps Script backend with Game Archive, Tournament Stats, Leaderboard Stats tabs
- `manualStatsRefresh()` function for rebuilding stats from archive
- Edit Round with cascading recalculation
- Save & Exit / Resume mid-game
- New Game defaults to previous game's players
- Progress bar showing games played in current tournament
- Finalize Tournament (early or at 20 games)
- PWA: manifest, service worker, offline support
- Add to Home Screen on Android and iOS
- QR code sharing via Settings
- Cloud sync (pull on load for Viewer/Admin, push on finalize for Admin)
- Dark green card-table theme with gold accents
- Responsive layout for phones and tablets

---

<div align="center">

**Made with ♥ and ♣ and ♦ and ♠**

[Open App](https://jamesrwatt.github.io/Up-and-Down-the-River-Tournament/) · [Report a Bug](https://github.com/jamesrwatt/Up-and-Down-the-River-Tournament/issues) · [Request a Feature](https://github.com/jamesrwatt/Up-and-Down-the-River-Tournament/issues)

</div>

# Up & Down the River

A professional-grade, mobile-responsive scorekeeping application for the card game "Up & Down the River." This app features local persistence, cloud synchronization via Google Sheets, and Progressive Web App (PWA) capabilities.

## 🚀 Key Features

* **PWA Ready:** "Add to Home Screen" on Android, iOS, and Windows for a native app experience.
* **Three-Tier Access Control:**
    * **Viewer:** Read-only access to global Hall of Fame stats.
    * **ScoreKeeper:** Local write access to manage games and update local statistics without needing a password.
    * **Admin:** Full read/write access to synchronize local games with a central Google Sheet.
* **Intelligent Statistics:** Tracks total tournament points, money paid (losses/penalties), average scores, and hand-level win/loss streaks.
* **Fetch Firewall:** Smart logic prevents cloud data from overwriting local tournament results during active sessions.
* **Integrated Sharing:** Built-in QR code in the settings menu for instant sharing with other players.

## 🛠️ Installation & Setup

### 1. GitHub Pages Hosting (Recommended)
1.  Upload `index.html`, `manifest.json`, and `sw.js` to a GitHub repository.
2.  Go to **Settings > Pages** and enable deployment from the `main` branch.
3.  Your app will be live at `https://[your-username].github.io/[repo-name]/`.

### 2. Cloud Sync Setup (Google Sheets)
To enable Cloud Sync and the Hall of Fame features:
1.  **Copy the Template:** [Click here to open the Google Sheet Template]((https://docs.google.com/spreadsheets/d/1gqupfWu4M_GQGjx7830BLJbUemHJOnC5uIFCpWuWeG8/edit?usp=sharing)).
2.  Go to **File > Make a copy** to save it to your own Google Drive.
3.  In your new sheet, go to **Extensions > Apps Script**.
4.  Click **Deploy > New Deployment**.
5.  Select **Web App**, set "Execute as" to **Me**, and "Who has access" to **Anyone**.
6.  Copy the **Web App URL** provided and paste it into the UDRiver App Settings.
7.  Set your `ADMIN_SECRET` in the code to match your preferred password.

## 📱 Mobile Use (PWA)
* **Android:** Open the link in Chrome, tap the three dots (⋮), and select **"Install App"** or **"Add to Home screen."**
* **Windows:** Click the "Install" icon in the Edge/Chrome address bar to run as a standalone desktop app.

## 🎮 Game Rules Implemented
* **Dealer Rule:** Total bids cannot equal the number of cards in the round (forcing someone to "go set").
* **Scoring:** 10 points for making a bid + 1 point per trick. Only trick points are awarded if the bid is missed.
* **Tournament Logic:** Automatic calculation of rankings, T-Points, and financial penalties based on score thresholds.

## STATISTICS
* POINTS DISTRIBUTION
  * TOTAL TOURNAMENT POINTS
  * GAMES EARNING 5 T-POINTS
  * GAMES EARNING 4 T-POINTS
  * GAMES EARNING 3 T-POINTS
  * GAMES EARNING 2 T-POINTS
  * GAMES EARNING 1 T-POINTS
* FINANCIALS
  * MONEY FROM LOSSES
  * MONEY FROM PENALTIES
  * TOTAL MONEY IN POT
  * MOST MONEY PAID IN ONE GAME
* GENERAL SCORING
  * AVERAGE GAME POINTS
  * TOTAL GAME POINTS
  * TOTAL NUMBER OF SETS
  * TOTAL NUMBER OF TRICKS
* GAME RECORDS
  * MOST SETS IN ONE GAME
  * LEAST SETS IN ONE GAME
  * MOST TRICKS IN ONE GAME
  * LEAST TRICKS IN ONE GAME
  * *LOWEST SCORE EVER
  * HIGHEST SCORE EVER
* STREAKS
  * LONGEST WINNING STREAK (GAMES)
  * LONGEST LOSING STREAK (GAMES)
  * LONGEST WINNING STREAK (HANDS)
  * LONGEST LOSING STREAK (HANDS)
  * LONGEST WINNING STREAK (ACROSS GAMES)
  * LONGEST LOSING STREAK (ACROSS GAMES)
  * LONGEST STREAK WITHOUT PAYING
  * LONGEST STREAK WITH PAYING

## 📄 License
GNU GENERAL PUBLIC LICENSE Version 3

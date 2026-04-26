const ADMIN_KEY = "RiverAdmin2026"; 

/**
 * TURBO GET: Loads instantly by reading from a pre-calculated snapshot.
 */
function doGet(e) {
  const scriptProp = PropertiesService.getScriptProperties();
  const snapshot = scriptProp.getProperty('HOF_SNAPSHOT');
  
  // If we have a saved snapshot, send it immediately!
  if (snapshot) {
    return ContentService.createTextOutput(snapshot)
      .setMimeType(ContentService.MimeType.JSON);
  }

  // Fallback: If no snapshot exists (e.g. after a reset), calculate it once
  const hofData = getRecomputedHOF();
  const hofString = JSON.stringify(hofData);
  scriptProp.setProperty('HOF_SNAPSHOT', hofString);
  
  return ContentService.createTextOutput(hofString)
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * TURBO POST: Does all the heavy "writing" and "calculating" only when data changes.
 */
function doPost(e) {
  const lock = LockService.getPublicLock();
  try {
    lock.waitLock(10000); 
    
    let payload;
    try { 
      payload = JSON.parse(e.postData.contents); 
    } catch (err) { 
      payload = e.parameter; 
    }

    if (payload.key !== ADMIN_KEY) {
      return ContentService.createTextOutput("Unauthorized").setMimeType(ContentService.MimeType.TEXT);
    }

    const scriptProp = PropertiesService.getScriptProperties();
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    // 1. HANDLE RESET
    if (payload.type === "RESET_ALL") {
      scriptProp.deleteAllProperties();
      const archiveSheet = ss.getSheetByName("Game Archive");
      if (archiveSheet) archiveSheet.clear();
      const hofSheet = ss.getSheetByName("Hall of Fame");
      if (hofSheet) hofSheet.clear();
      return ContentService.createTextOutput("Total Reset Successful");
    }

    // 2. HANDLE ARCHIVE (The Workhorse)
    if (payload.type === "ARCHIVE_GAME") {
      if(payload.gameData) {
        // Step A: Save raw data to the Archive sheet
        archiveGameToTab(payload.gameData);
        
        // Step B: Recompute stats from the full Archive
        const freshStats = getRecomputedHOF();
        const freshStatsString = JSON.stringify(freshStats);
        
        // Step C: Update the "Snapshot" for the Turbo doGet
        scriptProp.setProperty('HOF_SNAPSHOT', freshStatsString);
        
        // Step D: Update the visual Hall of Fame sheet
        updateHOFSheet(freshStats);
        
        return ContentService.createTextOutput("Game Archived, Cache Updated, and Sheet Refreshed.");
      }
    }

    return ContentService.createTextOutput("Unknown Type");

  } catch (f) {
    return ContentService.createTextOutput("Error: " + f.toString());
  } finally {
    lock.releaseLock();
  }
}

function archiveGameToTab(gameData) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const scriptProp = PropertiesService.getScriptProperties();
  const archiveName = "Game Archive";
  let sheet = ss.getSheetByName(archiveName);
  if (!sheet) { sheet = ss.insertSheet(archiveName); }

  // Look at the sheet to find the actual last game number
  let lastRow = sheet.getLastRow();
  let lastGameNumInSheet = (lastRow > 1) ? Number(sheet.getRange(lastRow, 1).getValue()) : 0;
  
  // Use whichever is higher: the internal counter or the sheet's actual data
  let currentCounter = Number(scriptProp.getProperty('game_counter') || "0");
  let gameNum = Math.max(lastGameNumInSheet, currentCounter) + 1;
  
  scriptProp.setProperty('game_counter', gameNum.toString());

  const players = gameData.players;
  const gameDate = new Date().toLocaleDateString();
  const rounds = [1,2,3,4,5,6,7,8,9,10,9,8,7,6,5,4,3,2,1];
  
  if (sheet.getLastRow() === 0) {
    let headers = ["Game #", "Date", "Round", "Trump"];
    players.forEach(p => {
      headers.push(p.name + " (B)", p.name + " (T)", p.name + " (Σ)");
    });
    sheet.appendRow(headers);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold").setBackground("#cfe2f3");
  }

  let allRows = [];
  for (let r = 0; r < 19; r++) {
    let row = [gameNum, gameDate, rounds[r], getTrumpLabel(r)];
    players.forEach(p => {
      let h = p.history[r] || {bid: "-", tricks: "-", totalAtRound: "-"};
      row.push(h.bid, h.tricks, h.totalAtRound);
    });
    allRows.push(row);
  }

  const startRow = sheet.getLastRow() + 1;
  sheet.getRange(startRow, 1, allRows.length, allRows[0].length).setValues(allRows);
  sheet.autoResizeColumns(1, allRows[0].length);
}

function getTrumpLabel(idx) {
  if (idx === 7 || idx === 9 || idx === 11) return "NT";
  const suits = ["H", "S", "D", "C"];
  if (idx === 8) return suits[idx % 4];
  if (idx === 10) return suits[(idx - 3) % 4];
  let adj = (idx > 11) ? idx - 5 : idx;
  return suits[adj % 4];
}

function getRecomputedHOF() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("Game Archive");
  if (!sheet) return {};

  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return {};

  const headers = data[0];
  const rows = data.slice(1);
  let hof = {};
  let games = {};

  rows.forEach(row => {
    const gameNum = row[0];
    if (!gameNum) return;
    if (!games[gameNum]) games[gameNum] = { players: {} };
    for (let i = 4; i < headers.length; i += 3) {
      if (!headers[i]) continue;
      const pName = headers[i].split(" (")[0];
      if (!games[gameNum].players[pName]) {
        games[gameNum].players[pName] = { total: 0, tricks: 0, sets: 0, history: [] };
      }
      const bid = row[i];
      const tricks = row[i+1];
      const totalAtRound = row[i+2];
      if (bid !== "" && tricks !== "" && totalAtRound !== "") {
        const isSet = bid !== tricks;
        games[gameNum].players[pName].history.push(!isSet);
        games[gameNum].players[pName].tricks += Number(tricks);
        games[gameNum].players[pName].sets += (isSet ? 1 : 0);
        games[gameNum].players[pName].total = Number(totalAtRound);
      }
    }
  });

  const getMaxStreak = (arr, val) => {
    let max = 0, current = 0;
    arr.forEach(item => {
      if (item === val) { current++; max = Math.max(max, current); }
      else { current = 0; }
    });
    return max;
  };

  Object.keys(games).forEach(gNum => {
    const g = games[gNum];
    const pNames = Object.keys(g.players);
    const sorted = pNames.map(n => ({name: n, total: g.players[n].total}))
                         .sort((a,b) => b.total - a.total);
    const threshold = 170 - (10 * pNames.length);
    const winnerName = sorted[0].name;
    const loserName = sorted[sorted.length - 1].name;

    pNames.forEach(pName => {
      if (!hof[pName]) {
        hof[pName] = { 
          tPoints: 0, lossesMoney: 0, penaltyMoney: 0, totalTricks: 0, totalSets: 0, 
          gamesPlayed: 0, gamePoints: 0, bestScore: 0, worstScore: 999, 
          maxTricksGame: 0, minTricksGame: 999, maxSetsGame: 0, minSetsGame: 99, 
          maxMoneyGame: 0, tPointsDist: {}, handHistory: [], payHistory: [], 
          firstPlaceHistory: [], lastPlaceHistory: [], maxWinHandStreak: 0, maxLossHandStreak: 0 
        };
      }
      const pData = g.players[pName];
      const s = hof[pName];
      const rankIdx = sorted.findIndex(x => x.name === pName);
      const tPts = pNames.length - rankIdx;
      let penalty = (pData.total < threshold) ? Math.ceil((threshold - pData.total) / 10) : 0;
      const isFirst = pName === winnerName;
      const isLast = pName === loserName;
      const totalPaid = (isLast ? 1 : 0) + penalty;
      const currentScore = Number(pData.total) || 0;

      s.tPoints += tPts;
      s.lossesMoney += (isLast ? 1 : 0);
      s.penaltyMoney += penalty;
      s.totalTricks += Number(pData.tricks) || 0;
      s.totalSets += Number(pData.sets) || 0;
      s.gamesPlayed++;
      s.gamePoints += currentScore;
      s.bestScore = Math.max(s.bestScore, currentScore);
      s.worstScore = (s.worstScore === 999) ? currentScore : Math.min(s.worstScore, currentScore);
      s.maxTricksGame = Math.max(s.maxTricksGame, pData.tricks);
      s.minTricksGame = Math.min(s.minTricksGame, pData.tricks);
      s.maxSetsGame = Math.max(s.maxSetsGame, pData.sets);
      s.minSetsGame = Math.min(s.minSetsGame, pData.sets);
      s.maxMoneyGame = Math.max(s.maxMoneyGame, totalPaid);
      s.maxWinHandStreak = Math.max(s.maxWinHandStreak, getMaxStreak(pData.history, true));
      s.maxLossHandStreak = Math.max(s.maxLossHandStreak, getMaxStreak(pData.history, false));
      s.tPointsDist[tPts] = (s.tPointsDist[tPts] || 0) + 1;
      s.firstPlaceHistory.push(isFirst);
      s.lastPlaceHistory.push(isLast);
      s.payHistory.push(totalPaid > 0);
      s.handHistory = s.handHistory.concat(pData.history);
    });
  });
  return hof;
}

function updateHOFSheet(hofData) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName("Hall of Fame") || ss.insertSheet("Hall of Fame");
  sheet.clear();

  const playerNames = Object.keys(hofData).sort((a,b) => hofData[b].tPoints - hofData[a].tPoints);
  if (playerNames.length === 0) return;

  const pointValuesFound = new Set();
  playerNames.forEach(n => {
    if (hofData[n].tPointsDist) Object.keys(hofData[n].tPointsDist).forEach(v => pointValuesFound.add(Number(v)));
  });
  const sortedPointValues = Array.from(pointValuesFound).sort((a,b) => b-a);

  const rows = [["STATISTICS", ...playerNames]];
  const headerRows = []; // Track which rows are section headers

  const addSection = (label, stats) => {
    headerRows.push(rows.length); // Mark this row index as a header
    rows.push([label.toUpperCase(), ...playerNames.map(() => "")]);
    stats.forEach(stat => {
      let row = [stat.l];
      playerNames.forEach(name => row.push(stat.fn(hofData[name])));
      rows.push(row);
    });
  };

  const pointDistStats = [{ l: "TOTAL TOURNAMENT POINTS", fn: p => p.tPoints }];
  sortedPointValues.forEach(val => {
    pointDistStats.push({ l: `GAMES EARNING ${val} T-POINTS`, fn: p => (p.tPointsDist && p.tPointsDist[val]) ? p.tPointsDist[val] : 0 });
  });
  addSection("Points Distribution", pointDistStats);

  addSection("Financials", [
    { l: "MONEY FROM LOSSES", fn: p => `$${p.lossesMoney}` },
    { l: "MONEY FROM PENALTIES", fn: p => `$${p.penaltyMoney}` },
    { l: "TOTAL MONEY IN POT", fn: p => `$${p.lossesMoney + p.penaltyMoney}` },
    { l: "MOST MONEY PAID IN ONE GAME", fn: p => `$${p.maxMoneyGame}` }
  ]);

  addSection("General Scoring", [
    { l: "AVERAGE GAME POINTS", fn: p => Math.round(p.gamePoints / p.gamesPlayed) },
    { l: "TOTAL GAME POINTS", fn: p => p.gamePoints },
    { l: "TOTAL NUMBER OF SETS", fn: p => p.totalSets },
    { l: "TOTAL NUMBER OF TRICKS", fn: p => p.totalTricks }
  ]);

  addSection("Game Records", [
    { l: "MOST SETS IN ONE GAME", fn: p => p.maxSetsGame },
    { l: "LEAST SETS IN ONE GAME", fn: p => p.minSetsGame },
    { l: "MOST TRICKS IN ONE GAME", fn: p => p.maxTricksGame },
    { l: "LEAST TRICKS IN ONE GAME", fn: p => p.minTricksGame },
    { l: "LOWEST SCORE EVER", fn: p => p.worstScore },
    { l: "HIGHEST SCORE EVER", fn: p => p.bestScore }
  ]);

  addSection("Streaks", [
    { l: "LONGEST WINNING STREAK (GAMES)", fn: p => getStreakFromScript(p.firstPlaceHistory, true) },
    { l: "LONGEST LOSING STREAK (GAMES)", fn: p => getStreakFromScript(p.lastPlaceHistory, true) },
    { l: "LONGEST WINNING STREAK (HANDS)", fn: p => p.maxWinHandStreak },
    { l: "LONGEST LOSING STREAK (HANDS)", fn: p => p.maxLossHandStreak },
    { l: "LONGEST WINNING STREAK (ACROSS GAMES)", fn: p => getStreakFromScript(p.handHistory, true) },
    { l: "LONGEST LOSING STREAK (ACROSS GAMES)", fn: p => getStreakFromScript(p.handHistory, false) },
    { l: "LONGEST STREAK WITHOUT PAYING", fn: p => getStreakFromScript(p.payHistory, false) },
    { l: "LONGEST STREAK WITH PAYING", fn: p => getStreakFromScript(p.payHistory, true) }
  ]);

  // 1. Write ALL data in one go
  const range = sheet.getRange(1, 1, rows.length, playerNames.length + 1);
  range.setValues(rows);

  // 2. Batch Format Backgrounds
  const backgrounds = rows.map((row, idx) => {
    if (idx === 0) return new Array(row.length).fill("#2c3e50"); // Main Header
    if (headerRows.includes(idx)) return new Array(row.length).fill("#dfe6e9"); // Section Headers
    return new Array(row.length).fill(null); // Default
  });
  
  const fontColors = rows.map((row, idx) => {
    if (idx === 0) return new Array(row.length).fill("white");
    return new Array(row.length).fill("black");
  });

  const fontWeights = rows.map((row, idx) => {
    if (idx === 0 || headerRows.includes(idx)) return new Array(row.length).fill("bold");
    return new Array(row.length).fill("normal");
  });

  // Apply all formatting in 3 single API calls instead of 50+
  range.setBackgrounds(backgrounds);
  range.setFontColors(fontColors);
  range.setFontWeights(fontWeights);

  sheet.setFrozenColumns(1);
  sheet.setFrozenRows(1);
  sheet.autoResizeColumns(1, playerNames.length + 1);
}

function getStreakFromScript(arr, target) {
  let max = 0, cur = 0;
  arr.forEach(v => { if(v === target) { cur++; max = Math.max(max, cur); } else { cur = 0; } });
  return max;
}

/**
 * UPDATED MANUAL REFRESH: Ensures the Turbo cache is updated if you manually edit the sheet.
 */
function manualHOFRefresh() {
  const data = getRecomputedHOF();
  const dataString = JSON.stringify(data);
  
  // Update both the visual sheet and the Turbo cache
  PropertiesService.getScriptProperties().setProperty('HOF_SNAPSHOT', dataString);
  updateHOFSheet(data);
  
  Logger.log("Manual Refresh Complete: Cache and Sheet are synced.");
}

function syncGameCounter() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("Game Archive");
  const scriptProp = PropertiesService.getScriptProperties();
  
  if (!sheet || sheet.getLastRow() < 2) {
    scriptProp.setProperty('game_counter', "0");
    Logger.log("No games found. Counter set to 0.");
    return;
  }

  // Get the very last value in Column A (Game #)
  const lastRow = sheet.getLastRow();
  const lastGameNum = sheet.getRange(lastRow, 1).getValue();

  if (!isNaN(lastGameNum)) {
    scriptProp.setProperty('game_counter', lastGameNum.toString());
    Logger.log("Sync Complete. Next game will be #" + (Number(lastGameNum) + 1));
  } else {
    Logger.log("Error: Last row in Column A is not a number.");
  }
}
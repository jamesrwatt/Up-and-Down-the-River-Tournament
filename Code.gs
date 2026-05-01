const ADMIN_KEY = "RiverAdmin2026"; 

/**
 * TURBO GET: Loads instantly by reading from a pre-calculated snapshot.
 */
function doGet(e) {
  const scriptProp = PropertiesService.getScriptProperties();
  const snapshot = scriptProp.getProperty('tStats_SNAPSHOT');
  
  // If we have a saved snapshot, send it immediately!
  if (snapshot) {
    return ContentService.createTextOutput(snapshot)
      .setMimeType(ContentService.MimeType.JSON);
  }

  // Fallback: If no snapshot exists (e.g. after a reset), calculate it once
  const tStatsData = getRecomputedTStats();
  const tStatsString = JSON.stringify(tStatsData);
  scriptProp.setProperty('tStats_SNAPSHOT', tStatsString);
  
  return ContentService.createTextOutput(tStatsString)
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * TURBO POST: Handles archiving games and resetting the cloud data.
 */
function doPost(e) {
  const lock = LockService.getPublicLock();
  try {
    // Wait up to 10 seconds for other processes to finish
    lock.waitLock(10000); 
    
    let payload;
    try { 
      payload = JSON.parse(e.postData.contents); 
    } catch (err) { 
      payload = e.parameter; 
    }

    // --- HANDLE RESET COMMAND ---
    if (payload.type === "CLEAR_STATS") {
      if (payload.key !== ADMIN_KEY) throw new Error("Unauthorized Reset Attempt");
      
      const ss = SpreadsheetApp.getActiveSpreadsheet();
      
      // 1. Clear the Game Archive
      const archiveSheet = ss.getSheetByName("Game Archive");
      if (archiveSheet) {
        archiveSheet.clear(); 
      }
      
      // 2. Reset the internal game counter to zero
      PropertiesService.getScriptProperties().setProperty('game_counter', "0");
      
      // 3. Clear the Tournament Stats visual sheet
      const tStatsSheet = ss.getSheetByName("Tournament Stats");
      if (tStatsSheet) {
        tStatsSheet.clear();
      }

      // 4. Wipe the Turbo Cache so the next 'GET' calculates from scratch
      PropertiesService.getScriptProperties().deleteProperty('tStats_SNAPSHOT');
      
      return ContentService.createTextOutput("Cloud Wiped Successfully").setMimeType(ContentService.MimeType.TEXT);
    }

    // --- HANDLE GAME ARCHIVE ---
    if (payload.type === "ARCHIVE_GAME") {
      if (payload.key !== ADMIN_KEY) throw new Error("Invalid Admin Key");

      // Save the raw game data to the Archive sheet
      archiveGameToTab(payload.gameData);

      // Re-calculate the entire Tournament Stats statistics
      const updatedTStats = getRecomputedTStats();
      const tStatsString = JSON.stringify(updatedTStats);

      // Update the visual Google Sheet for people to look at
      updateTStatsSheet(updatedTStats);

      // Update the Turbo Cache so the mobile apps get the new stats instantly
      PropertiesService.getScriptProperties().setProperty('tStats_SNAPSHOT', tStatsString);

      return ContentService.createTextOutput("Success").setMimeType(ContentService.MimeType.TEXT);
    }

  } catch (f) {
    return ContentService.createTextOutput("Error: " + f.toString()).setMimeType(ContentService.MimeType.TEXT);
  } finally {
    lock.releaseLock();
  }
}

/**
 * Updated Archive logic to handle dynamic round counts (5-8 players).
 */
function archiveGameToTab(gameData) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName("Game Archive");
  if (!sheet) sheet = ss.insertSheet("Game Archive");

  const players = gameData.players; // Current game's players in their current order
  const gameDate = new Date().toLocaleDateString();
  const scriptProp = PropertiesService.getScriptProperties();
  let gameNum = parseInt(scriptProp.getProperty('game_counter') || "0") + 1;
  scriptProp.setProperty('game_counter', gameNum.toString());

  // 1. Ensure all current players have a designated column in the header
  let headers = sheet.getRange(1, 1, 1, Math.max(sheet.getLastColumn(), 1)).getValues()[0];
  if (headers.length < 4) headers = ["Game #", "Date", "Cards", "Trump"];

  players.forEach(player => {
    // Check if player already exists in headers
    let playerIdx = headers.indexOf(`${player.name} Score`);
    if (playerIdx === -1) {
      // New player! Add their 3 columns to the end of the header array
      headers.push(`${player.name} Bid`, `${player.name} Tricks`, `${player.name} Score`);
    }
  });

  // 2. Update the header row on the sheet
  sheet.getRange(1, 1, 1, headers.length).setValues([headers])
       .setFontWeight("bold").setBackground("#d9ead3");

  // 3. Create a Map of where each player's data belongs
  // Key: Player Name -> Value: Starting Column Index for that player
  let colMap = {};
  players.forEach(p => {
    colMap[p.name] = headers.indexOf(`${p.name} Bid`) + 1; // +1 for 1-based indexing
  });

  // 4. Prepare the rows
  const maxCards = Math.min(10, Math.floor(52 / players.length));
  const up = Array.from({length: maxCards}, (_, i) => i + 1);
  const down = [...up].reverse().slice(1);
  const rounds = up.concat(down);

  let allRows = [];
  for (let r = 0; r < rounds.length; r++) {
    // Initialize a row full of empty values or zeros based on header length
    let row = new Array(headers.length).fill(""); 
    
    // Set base info
    row[0] = gameNum;
    row[1] = gameDate;
    row[2] = rounds[r];
    row[3] = getTrumpLabel(r, players.length);

    // Place player data in their SPECIFIC assigned columns
    players.forEach(p => {
      let h = p.history[r] || {bid: 0, tricks: 0, totalAtRound: 0};
      let startCol = colMap[p.name] - 1; // 0-based index for the array
      row[startCol] = h.bid;
      row[startCol + 1] = h.tricks;
      row[startCol + 2] = h.totalAtRound;
    });
    allRows.push(row);
  }

  // 5. Append the data
  sheet.getRange(sheet.getLastRow() + 1, 1, allRows.length, headers.length).setValues(allRows);
}

function getTrumpLabel(idx, numPlayers) {
  const maxCards = Math.min(10, Math.floor(52 / numPlayers));
  const peakIdx = maxCards - 1;

  // No Trump (NT) occurs at the peak round and the rounds immediately flanking it
  if (idx === peakIdx - 1 || idx === peakIdx || idx === peakIdx + 1) {
    return "NT";
  }

  const suits = ["H", "S", "D", "C"];
  let suitIdx;
  if (idx < peakIdx - 1) {
    suitIdx = idx;
  } else {
    // Adjust rotation to skip the 3 NT rounds
    suitIdx = idx - 3;
  }
  
  return suits[suitIdx % 4];
}

function getRecomputedTStats() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("Game Archive");
  if (!sheet) return {};

  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return {};

  const rawHeaders = data[0];
  const headers = rawHeaders.map(h => h.toString().replace(/ Bid/gi, "").trim());

  const rows = data.slice(1);
  let tStats = {};
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
      if (!tStats[pName]) {
        tStats[pName] = { 
          tPoints: 0, lossesMoney: 0, penaltyMoney: 0, totalTricks: 0, totalSets: 0, 
          gamesPlayed: 0, gamePoints: 0, bestScore: 0, worstScore: 999, 
          maxTricksGame: 0, minTricksGame: 999, maxSetsGame: 0, minSetsGame: 99, 
          maxMoneyGame: 0, tPointsDist: {}, handHistory: [], payHistory: [], 
          firstPlaceHistory: [], lastPlaceHistory: [], maxWinHandStreak: 0, maxLossHandStreak: 0 
        };
      }
      const pData = g.players[pName];
      const s = tStats[pName];
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
  return tStats;
}

function updateTStatsSheet(tStatsData) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName("Tournament Stats") || ss.insertSheet("Tournament Stats");
  sheet.clear();

  const playerNames = Object.keys(tStatsData).sort((a,b) => tStatsData[b].tPoints - tStatsData[a].tPoints);
  if (playerNames.length === 0) return;

  const pointValuesFound = new Set();
  playerNames.forEach(n => {
    if (tStatsData[n].tPointsDist) Object.keys(tStatsData[n].tPointsDist).forEach(v => pointValuesFound.add(Number(v)));
  });
  const sortedPointValues = Array.from(pointValuesFound).sort((a,b) => b-a);

  const rows = [["STATISTICS", ...playerNames]];
  const headerRows = []; // Track which rows are section headers

  const addSection = (label, stats) => {
    headerRows.push(rows.length); // Mark this row index as a header
    rows.push([label.toUpperCase(), ...playerNames.map(() => "")]);
    stats.forEach(stat => {
      let row = [stat.l];
      playerNames.forEach(name => row.push(stat.fn(tStatsData[name])));
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
function manualTStatsRefresh() {
  const data = getRecomputedTStats();
  const dataString = JSON.stringify(data);
  
  // Update both the visual sheet and the Turbo cache
  PropertiesService.getScriptProperties().setProperty('tStats_SNAPSHOT', dataString);
  updateTStatsSheet(data);
  
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

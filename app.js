const express = require("express");

const path = require("path");

const dbPath = path.join(__dirname, "cricketMatchDetails.db");

const app = express();

app.use(express.json());

const { open } = require("sqlite");

const sqlite3 = require("sqlite3");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({ filename: dbPath, driver: sqlite3.Database });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

const convertPlayersDbObjectToResponseObject = (dbObject) => {
  return {
    playerId: dbObject.player_id,
    playerName: dbObject.player_name,
  };
};

const convertMatchDetailsDbToResponseObject = (dbObject) => {
  return {
    matchId: dbObject.match_id,
    match: dbObject.match,
    year: dbObject.year,
  };
};

app.get("/players/", async (request, response) => {
  const playersQuery = `
    SELECT * FROM players_details;`;

  const playersArray = await db.all(playersQuery);
  response.send(
    playersArray.map((eachPlayerDetails) =>
      convertPlayersDbObjectToResponseObject(eachPlayerDetails)
    )
  );
});

app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerDetails = `SELECT * FROM player_details WHERE player_id = ${playerId};`;

  const playerDetails = await db.get(getPlayerDetails);

  response.send(convertPlayersDbObjectToResponseObject(playerDetails));
});

app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const { playerName } = request.body;

  const updatePlayerQuery = `UPDATE player_details SET player_name = '${playerName}' WHERE player_id = ${playerId};`;
  await db.run(updatePlayerQuery);
  response.send("Player Details Updated");
});

app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;

  const matchDetailsQuery = `SELECT * FROM match_details WHERE match_id = ${matchId};`;

  const matchDetails = await db.get(matchDetailsQuery);

  response.send(convertMatchDetailsDbToResponseObject(matchDetails));
});

app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;

  const getPlayerMatchesQuery = `SELECT * FROM player_match_scores NATURAL JOIN match_details WHERE player_id = ${playerId};`;

  const playerMatches = await db.all(getPlayerMatchesQuery);

  response.send(
    playerMatches.map((eachMatch) =>
      convertMatchDetailsDbToResponseObject(eachMatch)
    )
  );
});

app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;

  const getMatchPlayersQuery = `SELECT * FROM player_match_score
    NATURAL JOIN player_details
    WHERE match_id = ${matchId};`;

  const playersArray = await db.all(getMatchPlayersQuery);

  response.send(
    playersArray.map((eachMatch) =>
      convertPlayersDbObjectToResponseObject(eachMatch)
    )
  );
});

app.get("/players/:playerId/playerScores", async (request, response) => {
  const { payerId } = request.params;

  const getMatchPlayerQuery = `SELECT player_id AS playerId,
    player_name AS playerName,
    SUM(score) AS totalScore,
    SUM(fours) AS totalFours,
    SUM(sixes) AS totalSixes FROM player_match_score NATURAL JOIN player_details WHERE player_id = ${playerId};`;

  const playerMatchDetails = await db.get(getMatchPlayerQuery);

  response.send(playerMatchDetails);
});

module.exports = app;

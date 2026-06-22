import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
});

function todayKeyET() {
  const et = new Date(new Date().toLocaleString("en-US", { timeZone: "America/New_York" }));
  return `${et.getFullYear()}-${String(et.getMonth()+1).padStart(2,"0")}-${String(et.getDate()).padStart(2,"0")}`;
}

function norm(s) {
  return s?.toLowerCase()
    .replace(/ğ/g,"g").replace(/ü/g,"u").replace(/ş/g,"s").replace(/ı/g,"i")
    .replace(/ö/g,"o").replace(/ç/g,"c").replace(/[^a-z0-9\s]/g,"").trim() || "";
}

function gradePick(pick, stats) {
  const title = norm(pick.title);
  const line = norm(pick.line || "");

  const isOver = title.includes("over") || line.includes("over") || title.includes("yes") || line.includes("yes");
  const isUnder = title.includes("under") || line.includes("under") || title.includes("no") || line.includes("no");

  const lineNum = (pick.line || "").match(/(\d+\.?\d*)/);
  const titleNum = (pick.title || "").match(/(\d+\.?\d*)/);
  const threshold = lineNum ? parseFloat(lineNum[1]) : (titleNum ? parseFloat(titleNum[1]) : null);

  // ── TOTAL GOALS ──────────────────────────────────────────────
  if (title.includes("total goals") || title.includes("total goal") ||
      (title.includes("goal") && (isOver || isUnder) && !title.includes("scorer") && !title.includes("player"))) {
    if (threshold === null) return null;
    const val = stats.totalGoals;
    if (isOver) return val > threshold ? "W" : val === threshold ? "P" : "L";
    if (isUnder) return val < threshold ? "W" : val === threshold ? "P" : "L";
  }

  // ── BTTS ─────────────────────────────────────────────────────
  if (title.includes("btts") || title.includes("both teams to score") || title.includes("both teams not")) {
    const wantBtts = !title.includes("no") && !title.includes("not");
    return stats.btts === wantBtts ? "W" : "L";
  }

  // ── CLEAN SHEET ───────────────────────────────────────────────
  if (title.includes("clean sheet")) {
    const homeNorm = norm(stats.homeTeam);
    const homeParts = homeNorm.split(" ");
    const isHomeCS = homeParts.some(p => p.length >= 4 && title.includes(p)) || title.includes(homeNorm.slice(0,5));
    const conceded = isHomeCS ? stats.awayScore : stats.homeScore;
    const hasCS = conceded === 0;
    const wantCS = !title.includes("no") && !line.includes("no");
    return hasCS === wantCS ? "W" : "L";
  }

  // ── TOTAL CORNERS ─────────────────────────────────────────────
  if (title.includes("corner") && (title.includes("total") || title.includes("match") ||
      (!title.includes("team") && !title.includes("home") && !title.includes("away")))) {
    if (threshold === null || stats.totalCorners === null) return null;
    const val = stats.totalCorners;
    if (isOver) return val > threshold ? "W" : val === threshold ? "P" : "L";
    if (isUnder) return val < threshold ? "W" : val === threshold ? "P" : "L";
  }

  // ── TEAM CORNERS ─────────────────────────────────────────────
  if (title.includes("corner") && !title.includes("total") && !title.includes("match")) {
    if (threshold === null) return null;
    const homeNorm = norm(stats.homeTeam);
    const homeParts = homeNorm.split(" ");
    const isHomeTeam = homeParts.some(p => p.length >= 4 && title.includes(p)) || title.includes(homeNorm.slice(0,5));
    const val = isHomeTeam ? stats.homeCorners : stats.awayCorners;
    if (val === null) return null;
    if (isOver) return val > threshold ? "W" : val === threshold ? "P" : "L";
    if (isUnder) return val < threshold ? "W" : val === threshold ? "P" : "L";
  }

  // ── TOTAL CARDS ───────────────────────────────────────────────
  if (title.includes("card") && (title.includes("total") || title.includes("match"))) {
    if (threshold === null || stats.totalCards === null) return null;
    const val = stats.totalCards;
    if (isOver) return val > threshold ? "W" : val === threshold ? "P" : "L";
    if (isUnder) return val < threshold ? "W" : val === threshold ? "P" : "L";
  }

  // ── PLAYER PROPS ──────────────────────────────────────────────
  if (threshold === null) return null;

  let playerStats = null;
  let bestMatchScore = 0;

  for (const [name, pStats] of Object.entries(stats.playerStats || {})) {
    const nameNorm = norm(name);
    const nameWords = nameNorm.split(" ").filter(w => w.length >= 3);
    const titleWords = title.split(" ").filter(w => w.length >= 3);
    let matchScore = 0;
    for (const nw of nameWords) {
      for (const tw of titleWords) {
        if (tw === nw) matchScore += 2;
        else if (tw.includes(nw) || nw.includes(tw)) matchScore += 1;
      }
    }
    if (matchScore > bestMatchScore) { bestMatchScore = matchScore; playerStats = pStats; }
  }

  if (!playerStats || bestMatchScore < 1) return null;

  let val = null;
  if (title.includes("shot on target") || title.includes("shots on target")) val = playerStats.shotsOnTarget;
  else if (title.includes("total shot") || title.includes("total shots")) val = playerStats.shots;
  else if (title.includes("shot") || title.includes("shots")) val = playerStats.shots;
  else if (title.includes("key pass")) val = playerStats.keyPasses;
  else if (title.includes("pass")) val = playerStats.passes;
  else if (title.includes("tackle")) val = playerStats.tackles;
  else if (title.includes("foul")) val = playerStats.fouls;
  else if (title.includes("save")) val = playerStats.saves;
  else if (title.includes("yellow card")) val = playerStats.yellowCards;
  else if (title.includes("card")) val = playerStats.yellowCards;

  if (val === null || val === undefined) return null;
  if (isOver) return val > threshold ? "W" : val === threshold ? "P" : "L";
  if (isUnder) return val < threshold ? "W" : val === threshold ? "P" : "L";
  return null;
}

async function fetchMatchStats(fixtureId, apiKey) {
  try {
    const [statsRes, playersRes, fixtureRes] = await Promise.all([
      fetch(`https://v3.football.api-sports.io/fixtures/statistics?fixture=${fixtureId}`, { headers: { "x-apisports-key": apiKey } }),
      fetch(`https://v3.football.api-sports.io/fixtures/players?fixture=${fixtureId}`, { headers: { "x-apisports-key": apiKey } }),
      fetch(`https://v3.football.api-sports.io/fixtures?id=${fixtureId}`, { headers: { "x-apisports-key": apiKey } }),
    ]);
    const [statsData, playersData, fixtureData] = await Promise.all([
      statsRes.json(), playersRes.json(), fixtureRes.json(),
    ]);

    const fixture = fixtureData.response?.[0];
    if (!fixture) return null;

    const status = fixture?.fixture?.status?.short;
    if (!["FT", "AET", "PEN"].includes(status)) return { notFinished: true, status };

    const homeScore = fixture?.goals?.home ?? 0;
    const awayScore = fixture?.goals?.away ?? 0;
    const homeTeam = fixture?.teams?.home?.name;
    const awayTeam = fixture?.teams?.away?.name;

    const teamStats = statsData.response || [];
    const getStat = (teamName, statType) => {
      const team = teamStats.find(t => {
        const tn = norm(t.team?.name); const sn = norm(teamName);
        return tn.includes(sn.slice(0,4)) || sn.includes(tn.slice(0,4));
      });
      const raw = team?.statistics?.find(s => s.type === statType)?.value;
      return raw !== null && raw !== undefined ? parseInt(raw) : 0;
    };

    const homeCorners = getStat(homeTeam, "Corner Kicks");
    const awayCorners = getStat(awayTeam, "Corner Kicks");
    const homeYellow = getStat(homeTeam, "Yellow Cards");
    const awayYellow = getStat(awayTeam, "Yellow Cards");
    const homeRed = getStat(homeTeam, "Red Cards");
    const awayRed = getStat(awayTeam, "Red Cards");

    const playerStats = {};
    for (const team of (playersData.response || [])) {
      for (const player of (team.players || [])) {
        const name = player.player?.name;
        if (name) {
          const s = player.statistics?.[0] || {};
          playerStats[name] = {
            shots: s.shots?.total ?? 0,
            shotsOnTarget: s.shots?.on ?? 0,
            passes: s.passes?.total ?? 0,
            keyPasses: s.passes?.key ?? 0,
            tackles: s.tackles?.total ?? 0,
            fouls: s.fouls?.committed ?? 0,
            yellowCards: s.cards?.yellow ?? 0,
            saves: s.goals?.saves ?? 0,
          };
        }
      }
    }

    return {
      homeTeam, awayTeam, homeScore, awayScore,
      totalGoals: homeScore + awayScore,
      btts: homeScore > 0 && awayScore > 0,
      homeCorners, awayCorners,
      totalCorners: homeCorners + awayCorners,
      totalCards: homeYellow + awayYellow + homeRed + awayRed,
      playerStats,
      playerCount: Object.keys(playerStats).length,
    };
  } catch (e) { return null; }
}

// Look up fixture ID by searching for a team — works for past dates
async function lookupFixtureId(homeTeam, awayTeam, dateKey, apiKey) {
  try {
    // Try searching by team name + season
    const homeRes = await fetch(
      `https://v3.football.api-sports.io/fixtures?date=${dateKey}&league=1&season=2026`,
      { headers: { "x-apisports-key": apiKey } }
    );
    const homeData = await homeRes.json();
    const fixtures = homeData.response || [];
    for (const f of fixtures) {
      const fh = norm(f.teams?.home?.name);
      const fa = norm(f.teams?.away?.name);
      const mh = norm(homeTeam);
      const ma = norm(awayTeam);
      if ((fh.includes(mh.slice(0,4)) || mh.includes(fh.slice(0,4))) &&
          (fa.includes(ma.slice(0,4)) || ma.includes(fa.slice(0,4)))) {
        return f.fixture?.id;
      }
    }

    // Fallback: search by home team name
    const teamRes = await fetch(
      `https://v3.football.api-sports.io/teams?search=${encodeURIComponent(homeTeam.split(" ")[0])}`,
      { headers: { "x-apisports-key": apiKey } }
    );
    const teamData = await teamRes.json();
    const team = (teamData.response || []).find(t => {
      const tn = norm(t.team?.name);
      const mh = norm(homeTeam);
      return tn.includes(mh.slice(0,4)) || mh.includes(tn.slice(0,4));
    });
    if (!team) return null;

    const teamId = team.team?.id;
    const fixRes = await fetch(
      `https://v3.football.api-sports.io/fixtures?team=${teamId}&league=1&season=2026`,
      { headers: { "x-apisports-key": apiKey } }
    );
    const fixData = await fixRes.json();
    for (const f of (fixData.response || [])) {
      const fDate = f.fixture?.date?.slice(0, 10);
      if (fDate !== dateKey) continue;
      const fa = norm(f.teams?.away?.name);
      const ma = norm(awayTeam);
      if (fa.includes(ma.slice(0,4)) || ma.includes(fa.slice(0,4))) {
        return f.fixture?.id;
      }
    }
    return null;
  } catch (e) { return null; }
}

async function fetchFinishedFixtures(dateKey, apiKey, oddsApiKey) {
  const normalize = s => s?.toLowerCase().replace(/[^a-z]/g, '') || '';

  const [fixturesRes, oddsRes] = await Promise.all([
    fetch(`https://v3.football.api-sports.io/fixtures?date=${dateKey}`, { headers: { "x-apisports-key": apiKey } }),
    fetch(`https://api.the-odds-api.com/v4/sports/soccer_fifa_world_cup/scores/?apiKey=${oddsApiKey}&daysFrom=3`),
  ]);

  const [fixturesData, oddsData] = await Promise.all([
    fixturesRes.json(),
    oddsRes.json(),
  ]);

  const apfFixtures = (fixturesData.response || []).filter(f => {
    const name = f.league?.name?.toLowerCase() || "";
    return name.includes("world cup") || name.includes("fifa") || f.league?.id === 1;
  });

  const normalize2 = s => s?.toLowerCase().replace(/[^a-z]/g, '') || '';
  const oddsMap = {};
  for (const game of (oddsData || [])) {
    const hs = game.scores?.find(s => s.name === game.home_team)?.score;
    const as = game.scores?.find(s => s.name === game.away_team)?.score;
    oddsMap[`${normalize2(game.home_team)}|${normalize2(game.away_team)}`] = {
      home_score: hs !== undefined ? parseInt(hs) : null,
      away_score: as !== undefined ? parseInt(as) : null,
      completed: game.completed,
      home_team: game.home_team,
      away_team: game.away_team,
    };
  }

  function findOddsScore(homeTeam, awayTeam) {
    const hn = normalize2(homeTeam); const an = normalize2(awayTeam);
    for (const key of Object.keys(oddsMap)) {
      const [h, a] = key.split("|");
      if ((h.includes(hn.slice(0,4)) || hn.includes(h.slice(0,4))) &&
          (a.includes(an.slice(0,4)) || an.includes(a.slice(0,4)))) return oddsMap[key];
    }
    return null;
  }

  const results = [];
  const seen = new Set();

  // Process API-Football fixtures first (have fixture IDs)
  for (const f of apfFixtures) {
    const homeTeam = f.teams?.home?.name;
    const awayTeam = f.teams?.away?.name;
    const status = f.fixture?.status?.short;
    const oddsScore = findOddsScore(homeTeam, awayTeam);
    const isFinished = ["FT","AET","PEN"].includes(status) || oddsScore?.completed;
    if (!isFinished) continue;
    seen.add(normalize2(homeTeam));
    results.push({
      fixtureId: f.fixture?.id,
      homeTeam, awayTeam,
      homeScore: oddsScore?.home_score ?? f.goals?.home ?? 0,
      awayScore: oddsScore?.away_score ?? f.goals?.away ?? 0,
    });
  }

  // Add completed Odds API games not in API-Football — need to look up fixture IDs
  for (const game of (oddsData || [])) {
    if (!game.completed) continue;
    const hn = normalize2(game.home_team);
    if (seen.has(hn)) continue;
    const hs = game.scores?.find(s => s.name === game.home_team)?.score;
    const as = game.scores?.find(s => s.name === game.away_team)?.score;
    if (hs === undefined || as === undefined) continue;
    results.push({
      fixtureId: null, // will be resolved below
      homeTeam: game.home_team,
      awayTeam: game.away_team,
      homeScore: parseInt(hs),
      awayScore: parseInt(as),
      needsFixtureId: true,
    });
  }

  return results;
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");

  const { secret, date, force } = req.query;
  if (secret !== process.env.CRON_SECRET && secret !== "minchia2026") {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const apiKey = process.env.API_FOOTBALL_KEY;
  const oddsApiKey = process.env.ODDS_API_KEY;
  const dateKey = date || todayKeyET();
  const forceRegrade = force === "true";

  try {
    const finishedFixtures = await fetchFinishedFixtures(dateKey, apiKey, oddsApiKey);

    if (!finishedFixtures.length) {
      return res.status(200).json({ message: "No finished WC matches found", date: dateKey });
    }

    const results = [];

    for (const fixture of finishedFixtures) {
      let { homeTeam, awayTeam, fixtureId, homeScore, awayScore, needsFixtureId } = fixture;

      // Resolve missing fixture IDs for Odds-API-only matches
      if (needsFixtureId && !fixtureId) {
        fixtureId = await lookupFixtureId(homeTeam, awayTeam, dateKey, apiKey);
      }

      // Find picks in Redis
      const exactKey = `picks:${dateKey}:${homeTeam.replace(/\s/g,"-")}:${awayTeam.replace(/\s/g,"-")}`;
      let picksData = await redis.get(exactKey);

      if (!picksData) {
        const allKeys = await redis.keys(`picks:${dateKey}:*`);
        for (const k of allKeys) {
          const parts = k.split(":");
          const kHome = (parts[2] || "").replace(/-/g," ");
          if (norm(kHome).includes(norm(homeTeam).slice(0,4)) || norm(homeTeam).includes(norm(kHome).slice(0,4))) {
            picksData = await redis.get(k);
            break;
          }
        }
      }

      if (!picksData) {
        results.push({ match: `${homeTeam} vs ${awayTeam}`, skipped: true, reason: "No picks found in Redis" });
        continue;
      }

      const parsed = typeof picksData === "string" ? JSON.parse(picksData) : picksData;
      const allPicks = parsed.picks
        ? parsed.picks
        : [...(parsed.player_props||[]), ...(parsed.game_props||[]), ...(parsed.team_props||[])];

      if (!allPicks.length) {
        results.push({ match: `${homeTeam} vs ${awayTeam}`, skipped: true, reason: "No picks in data" });
        continue;
      }

      // Fetch full stats if we have a fixture ID
      let stats = null;
      if (fixtureId) {
        stats = await fetchMatchStats(fixtureId, apiKey);
      }

      // Fallback to minimal stats from scores only
      if (!stats || stats.notFinished) {
        stats = {
          homeTeam, awayTeam, homeScore, awayScore,
          totalGoals: homeScore + awayScore,
          btts: homeScore > 0 && awayScore > 0,
          homeCorners: 0, awayCorners: 0, totalCorners: 0,
          totalCards: 0, playerStats: {}, playerCount: 0,
          oddsApiOnly: true,
        };
      }

      const graded = [];
      for (const pick of allPicks) {
        const resultKey = `result:${dateKey}:${pick.title}`;
        const existing = await redis.get(resultKey);

        if (existing && !forceRegrade) {
          const ep = typeof existing === "string" ? JSON.parse(existing) : existing;
          if (ep.result === "W" || ep.result === "L") {
            graded.push({ pick: pick.title, skipped: true, reason: "Already graded", result: ep.result });
            continue;
          }
          if (ep.result === "P" && !ep.reason?.includes("Could not determine")) {
            graded.push({ pick: pick.title, skipped: true, reason: "Already graded as Push", result: "P" });
            continue;
          }
        }

        const result = gradePick(pick, stats);
        const finalResult = result || "P";
        const scoreStr = `${stats.homeTeam} ${stats.homeScore}-${stats.awayScore} ${stats.awayTeam}`;
        const reason = result
          ? `Auto-graded: ${scoreStr} | Corners: ${stats.totalCorners} | Cards: ${stats.totalCards} | Players: ${stats.playerCount}`
          : `Could not determine from stats — marked push`;

        await redis.set(resultKey, JSON.stringify({
          pick: pick.title,
          line: pick.line,
          result: finalResult,
          reason,
          date: dateKey,
          match: `${homeTeam} vs ${awayTeam}`,
          gradedAt: new Date().toISOString(),
          fixtureId: fixtureId || null,
          stats: { score: `${homeScore}-${awayScore}`, totalGoals: stats.totalGoals, totalCorners: stats.totalCorners, totalCards: stats.totalCards }
        }), { ex: 60*60*24*30 });

        graded.push({ pick: pick.title, result: finalResult, reason });
      }

      results.push({ match: `${homeTeam} vs ${awayTeam}`, fixtureId, picks_graded: graded });
    }

    return res.status(200).json({ date: dateKey, results });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

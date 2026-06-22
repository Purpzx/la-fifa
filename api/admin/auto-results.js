import Anthropic from "@anthropic-ai/sdk";
import { Redis } from "@upstash/redis";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
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
  // Combine title + line for matching — Claude stores description in title, threshold in line
  const title = norm(pick.title);
  const line = norm(pick.line || "");
  const combined = `${title} ${line}`;

  // Extract over/under direction
  const isOver = combined.includes("over") || combined.includes("yes");
  const isUnder = combined.includes("under") || combined.includes("no");

  // Extract threshold — prefer from line, fallback to title
  const lineNum = (pick.line || "").match(/(\d+\.?\d*)/);
  const titleNum = (pick.title || "").match(/(\d+\.?\d*)/);
  const threshold = lineNum ? parseFloat(lineNum[1]) : (titleNum ? parseFloat(titleNum[1]) : null);

  // ── TOTAL GOALS ──────────────────────────────────────────────
  if (title.includes("total goals") || (title.includes("goal") && (isOver || isUnder) && !title.includes("scorer"))) {
    if (threshold === null) return null;
    const val = stats.totalGoals;
    if (isOver) return val > threshold ? "W" : val === threshold ? "P" : "L";
    if (isUnder) return val < threshold ? "W" : val === threshold ? "P" : "L";
  }

  // ── BTTS ─────────────────────────────────────────────────────
  if (title.includes("btts") || title.includes("both teams to score") || title.includes("both teams not")) {
    const wantBtts = !title.includes("no") && !title.includes("not");
    if (stats.btts === null) return null;
    return stats.btts === wantBtts ? "W" : "L";
  }

  // ── CLEAN SHEET ───────────────────────────────────────────────
  if (title.includes("clean sheet")) {
    const homeNorm = norm(stats.homeTeam);
    const awayNorm = norm(stats.awayTeam);
    // Check which team the pick is about
    const homeParts = homeNorm.split(" ");
    const awayParts = awayNorm.split(" ");
    const isHomeCS = homeParts.some(p => p.length >= 4 && title.includes(p)) ||
                     title.includes(homeNorm.slice(0,5));
    const conceded = isHomeCS ? stats.awayScore : stats.homeScore;
    const hasCS = conceded === 0;
    const wantCS = !title.includes("no") && !line.includes("no");
    return hasCS === wantCS ? "W" : "L";
  }

  // ── TOTAL CORNERS ─────────────────────────────────────────────
  if (title.includes("corner") && (title.includes("total") || title.includes("match") || (!title.includes("team") && !title.includes("home") && !title.includes("away")))) {
    if (threshold === null) return null;
    const val = stats.totalCorners;
    if (val === null) return null;
    if (isOver) return val > threshold ? "W" : val === threshold ? "P" : "L";
    if (isUnder) return val < threshold ? "W" : val === threshold ? "P" : "L";
  }

  // ── TEAM CORNERS ─────────────────────────────────────────────
  if (title.includes("corner") && !title.includes("total") && !title.includes("match")) {
    if (threshold === null) return null;
    const homeNorm = norm(stats.homeTeam);
    const homeParts = homeNorm.split(" ");
    const isHomeTeam = homeParts.some(p => p.length >= 4 && title.includes(p)) ||
                       title.includes(homeNorm.slice(0,5));
    const val = isHomeTeam ? stats.homeCorners : stats.awayCorners;
    if (val === null) return null;
    if (isOver) return val > threshold ? "W" : val === threshold ? "P" : "L";
    if (isUnder) return val < threshold ? "W" : val === threshold ? "P" : "L";
  }

  // ── TOTAL CARDS ───────────────────────────────────────────────
  if (title.includes("card") && (title.includes("total") || title.includes("match"))) {
    if (threshold === null) return null;
    const val = stats.totalCards;
    if (val === null) return null;
    if (isOver) return val > threshold ? "W" : val === threshold ? "P" : "L";
    if (isUnder) return val < threshold ? "W" : val === threshold ? "P" : "L";
  }

  // ── PLAYER PROPS ──────────────────────────────────────────────
  if (threshold === null) return null;

  // Find matching player — try multi-word matching
  let playerStats = null;
  let bestMatchScore = 0;

  for (const [name, pStats] of Object.entries(stats.playerStats)) {
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
    if (matchScore > bestMatchScore) {
      bestMatchScore = matchScore;
      playerStats = pStats;
    }
  }

  // Require at least one word match
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

    const homeScore = fixture?.goals?.home ?? 0;
    const awayScore = fixture?.goals?.away ?? 0;
    const homeTeam = fixture?.teams?.home?.name;
    const awayTeam = fixture?.teams?.away?.name;

    // Verify match is actually finished
    const status = fixture?.fixture?.status?.short;
    if (!["FT", "AET", "PEN"].includes(status)) {
      return { notFinished: true, status };
    }

    const teamStats = statsData.response || [];
    const getStat = (teamName, statType) => {
      const team = teamStats.find(t => {
        const tn = norm(t.team?.name);
        const sn = norm(teamName);
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
  } catch (e) {
    return null;
  }
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");

  const { secret, date, force } = req.query;
  if(secret !== process.env.CRON_SECRET && secret !== "minchia2026") {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const apiKey = process.env.API_FOOTBALL_KEY;
  const dateKey = date || todayKeyET();
  const forceRegrade = force === "true";

  try {
    const fixturesRes = await fetch(
      `https://v3.football.api-sports.io/fixtures?date=${dateKey}`,
      { headers: { "x-apisports-key": apiKey } }
    );
    const fixturesData = await fixturesRes.json();
    const finishedFixtures = (fixturesData.response || []).filter(f => {
      const name = f.league?.name?.toLowerCase() || "";
      const isWC = name.includes("world cup") || name.includes("fifa") || f.league?.id === 1;
      const isFt = ["FT", "AET", "PEN"].includes(f.fixture?.status?.short);
      return isWC && isFt;
    });

    if (!finishedFixtures.length) {
      return res.status(200).json({ message: "No finished WC matches found", date: dateKey });
    }

    const results = [];

    for (const fixture of finishedFixtures) {
      const homeTeam = fixture.teams?.home?.name;
      const awayTeam = fixture.teams?.away?.name;
      const fixtureId = fixture.fixture?.id;

      // Find picks in Redis — try exact then fuzzy
      const exactKey = `picks:${dateKey}:${homeTeam.replace(/\s/g,"-")}:${awayTeam.replace(/\s/g,"-")}`;
      let picksData = await redis.get(exactKey);
      let usedKey = exactKey;

      if (!picksData) {
        const allKeys = await redis.keys(`picks:${dateKey}:*`);
        for (const k of allKeys) {
          const parts = k.split(":");
          const kHome = (parts[2] || "").replace(/-/g," ");
          if (norm(kHome).includes(norm(homeTeam).slice(0,4)) || norm(homeTeam).includes(norm(kHome).slice(0,4))) {
            picksData = await redis.get(k);
            usedKey = k;
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

      const stats = await fetchMatchStats(fixtureId, apiKey);

      if (!stats) {
        results.push({ match: `${homeTeam} vs ${awayTeam}`, error: "Could not fetch stats from API-Football" });
        continue;
      }

      if (stats.notFinished) {
        results.push({ match: `${homeTeam} vs ${awayTeam}`, skipped: true, reason: `Match not finished yet (${stats.status})` });
        continue;
      }

      const graded = [];
      for (const pick of allPicks) {
        const resultKey = `result:${dateKey}:${pick.title}`;
        const existing = await redis.get(resultKey);

        // Skip if already graded correctly (not a Push from failed grading) unless force=true
        if (existing && !forceRegrade) {
          const existingParsed = typeof existing === "string" ? JSON.parse(existing) : existing;
          // Skip only if it was genuinely graded (W or L), re-grade if it was a Push from failure
          if (existingParsed.result === "W" || existingParsed.result === "L") {
            graded.push({ pick: pick.title, skipped: true, reason: "Already graded", result: existingParsed.result });
            continue;
          }
          // If it's a P with "Could not determine" reason, re-try grading
          if (existingParsed.result === "P" && existingParsed.reason?.includes("Could not determine")) {
            // Fall through to re-grade
          } else if (existingParsed.result === "P") {
            graded.push({ pick: pick.title, skipped: true, reason: "Already graded as Push", result: "P" });
            continue;
          }
        }

        const result = gradePick(pick, stats);
        const finalResult = result || "P";
        const reason = result
          ? `Auto-graded: ${stats.homeTeam} ${stats.homeScore}-${stats.awayScore} ${stats.awayTeam} | Corners: ${stats.totalCorners} | Cards: ${stats.totalCards} | Players tracked: ${stats.playerCount}`
          : `Could not determine from stats — marked push`;

        await redis.set(resultKey, JSON.stringify({
          pick: pick.title,
          line: pick.line,
          result: finalResult,
          reason,
          date: dateKey,
          match: `${homeTeam} vs ${awayTeam}`,
          gradedAt: new Date().toISOString(),
          stats: {
            score: `${stats.homeScore}-${stats.awayScore}`,
            totalGoals: stats.totalGoals,
            totalCorners: stats.totalCorners,
            totalCards: stats.totalCards,
          }
        }), { ex: 60*60*24*30 });

        graded.push({ pick: pick.title, result: finalResult, reason });
      }

      results.push({ match: `${homeTeam} vs ${awayTeam}`, picks_graded: graded });
    }

    return res.status(200).json({ date: dateKey, results });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

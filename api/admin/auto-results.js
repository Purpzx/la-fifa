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

async function fetchMatchStats(fixtureId, apiKey) {
  try {
    const [statsRes, playersRes, fixtureRes] = await Promise.all([
      fetch(`https://v3.football.api-sports.io/fixtures/statistics?fixture=${fixtureId}`, {headers:{"x-apisports-key":apiKey}}),
      fetch(`https://v3.football.api-sports.io/fixtures/players?fixture=${fixtureId}`, {headers:{"x-apisports-key":apiKey}}),
      fetch(`https://v3.football.api-sports.io/fixtures?id=${fixtureId}`, {headers:{"x-apisports-key":apiKey}}),
    ]);
    const [statsData, playersData, fixtureData] = await Promise.all([
      statsRes.json(), playersRes.json(), fixtureRes.json(),
    ]);

    const fixture = fixtureData.response?.[0];
    const homeScore = fixture?.goals?.home ?? 0;
    const awayScore = fixture?.goals?.away ?? 0;
    const homeTeam = fixture?.teams?.home?.name;
    const awayTeam = fixture?.teams?.away?.name;

    // Team stats
    const teamStats = statsData.response || [];
    const getStat = (teamName, statType) => {
      const norm = s => s?.toLowerCase().replace(/[^a-z]/g,"") || "";
      const team = teamStats.find(t => {
        const tn = norm(t.team?.name);
        const sn = norm(teamName);
        return tn.includes(sn.slice(0,4)) || sn.includes(tn.slice(0,4));
      });
      return team?.statistics?.find(s => s.type === statType)?.value ?? 0;
    };

    const totalCorners = parseInt(getStat(homeTeam,"Corner Kicks")||0) + parseInt(getStat(awayTeam,"Corner Kicks")||0);
    const totalCards = parseInt(getStat(homeTeam,"Yellow Cards")||0) + parseInt(getStat(awayTeam,"Yellow Cards")||0) + parseInt(getStat(homeTeam,"Red Cards")||0) + parseInt(getStat(awayTeam,"Red Cards")||0);
    const totalGoals = homeScore + awayScore;
    const btts = homeScore > 0 && awayScore > 0;

    // Player stats
    const playerStats = {};
    for(const team of (playersData.response || [])) {
      for(const player of (team.players || [])) {
        const name = player.player?.name?.toLowerCase();
        if(name) {
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
            goals: s.goals?.total ?? 0,
          };
        }
      }
    }

    return {
      homeTeam, awayTeam, homeScore, awayScore,
      totalCorners, totalCards, totalGoals, btts,
      homeCorners: parseInt(getStat(homeTeam,"Corner Kicks")||0),
      awayCorners: parseInt(getStat(awayTeam,"Corner Kicks")||0),
      playerStats,
    };
  } catch(e) { return null; }
}

async function gradePickWithHaiku(pick, stats) {
  const prompt = `Grade this soccer prop bet as W (win), L (loss), or P (push) based on final match stats.

Pick: ${pick.title}
Line: ${pick.line}

Final Stats:
- Score: ${stats.homeTeam} ${stats.homeScore} - ${stats.awayScore} ${stats.awayTeam}
- Total Goals: ${stats.totalGoals}
- BTTS: ${stats.btts}
- Total Corners: ${stats.totalCorners} (${stats.homeTeam}: ${stats.homeCorners}, ${stats.awayTeam}: ${stats.awayCorners})
- Total Cards: ${stats.totalCards}
- Player Stats: ${JSON.stringify(stats.playerStats, null, 0)}

Reply with ONLY a JSON object: {"result":"W"|"L"|"P","reason":"one sentence explanation"}`;

  try {
    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 100,
      messages: [{role:"user", content:prompt}],
    });
    const text = response.content?.[0]?.text || "";
    const clean = text.replace(/```json|```/g,"").trim();
    const parsed = JSON.parse(clean);
    return parsed;
  } catch(e) {
    return {result:"P", reason:"Could not grade automatically"};
  }
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");

  const { secret, date } = req.query;
  if(secret !== process.env.CRON_SECRET) {
    return res.status(401).json({error:"Unauthorized"});
  }

  const apiKey = process.env.API_FOOTBALL_KEY;
  const dateKey = date || todayKeyET();

  try {
    // Fetch all finished WC fixtures for the date
    const fixturesRes = await fetch(
      `https://v3.football.api-sports.io/fixtures?date=${dateKey}`,
      {headers:{"x-apisports-key":apiKey}}
    );
    const fixturesData = await fixturesRes.json();
    const finishedFixtures = (fixturesData.response || []).filter(f => {
      const name = f.league?.name?.toLowerCase() || "";
      const isWC = name.includes("world cup") || name.includes("fifa") || f.league?.id === 1;
      const isFt = ["FT","AET","PEN"].includes(f.fixture?.status?.short);
      return isWC && isFt;
    });

    if(!finishedFixtures.length) {
      return res.status(200).json({message:"No finished WC matches found", date:dateKey});
    }

    const norm = s => s?.toLowerCase().replace(/[^a-z]/g,"") || "";
    const results = [];

    for(const fixture of finishedFixtures) {
      const homeTeam = fixture.teams?.home?.name;
      const awayTeam = fixture.teams?.away?.name;
      const fixtureId = fixture.fixture?.id;

      // Find picks in Redis for this match
      const pickKey = `picks:${dateKey}:${homeTeam.replace(/\s/g,"-")}:${awayTeam.replace(/\s/g,"-")}`;
      let picksData = await redis.get(pickKey);

      // Try fuzzy match if exact key not found
      if(!picksData) {
        const allKeys = await redis.keys(`picks:${dateKey}:*`);
        for(const k of allKeys) {
          const parts = k.split(":");
          const kHome = parts[2]?.replace(/-/g," ") || "";
          const kAway = parts[3]?.replace(/-/g," ") || "";
          if(norm(kHome).includes(norm(homeTeam).slice(0,4)) || norm(homeTeam).includes(norm(kHome).slice(0,4))) {
            picksData = await redis.get(k);
            break;
          }
        }
      }

      if(!picksData) {
        results.push({match:`${homeTeam} vs ${awayTeam}`, skipped:true, reason:"No picks found in Redis"});
        continue;
      }

      const parsed = typeof picksData === "string" ? JSON.parse(picksData) : picksData;
      const allPicks = parsed.picks
        ? parsed.picks
        : [...(parsed.player_props||[]), ...(parsed.game_props||[]), ...(parsed.team_props||[])];

      if(!allPicks.length) {
        results.push({match:`${homeTeam} vs ${awayTeam}`, skipped:true, reason:"No picks in data"});
        continue;
      }

      // Fetch match stats
      const stats = await fetchMatchStats(fixtureId, apiKey);
      if(!stats) {
        results.push({match:`${homeTeam} vs ${awayTeam}`, error:"Could not fetch stats"});
        continue;
      }

      // Grade each pick
      const graded = [];
      for(const pick of allPicks) {
        // Skip if already graded
        const resultKey = `result:${dateKey}:${pick.title}`;
        const existing = await redis.get(resultKey);
        if(existing) {
          graded.push({pick:pick.title, skipped:true, reason:"Already graded"});
          continue;
        }

        const grade = await gradePickWithHaiku(pick, stats);
        await redis.set(resultKey, JSON.stringify({
          pick: pick.title,
          line: pick.line,
          result: grade.result,
          reason: grade.reason,
          date: dateKey,
          match: `${homeTeam} vs ${awayTeam}`,
        }), {ex:60*60*24*30}); // 30 day TTL

        graded.push({pick:pick.title, result:grade.result, reason:grade.reason});
      }

      results.push({match:`${homeTeam} vs ${awayTeam}`, picks_graded:graded});
    }

    return res.status(200).json({date:dateKey, results});
  } catch(err) {
    return res.status(500).json({error:err.message});
  }
}

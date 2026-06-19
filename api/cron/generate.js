import Anthropic from "@anthropic-ai/sdk";
import { Redis } from "@upstash/redis";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const redis = new Redis({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
});

function todayKeyET() {
  const etDate = new Date(new Date().toLocaleString("en-US", { timeZone: "America/New_York" }));
  const y = etDate.getFullYear();
  const m = String(etDate.getMonth() + 1).padStart(2, "0");
  const d = String(etDate.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

const SCHEDULE = {
  "2026-06-11": [
    { home: "Mexico", away: "South Africa", kickoff_et: "15:00", venue: "Estadio Azteca, Mexico City", stage: "Group A" },
    { home: "South Korea", away: "Czechia", kickoff_et: "22:00", venue: "Estadio Akron, Zapopan", stage: "Group A" },
  ],
  "2026-06-12": [
    { home: "Canada", away: "Bosnia & Herzegovina", kickoff_et: "15:00", venue: "BMO Field, Toronto", stage: "Group B" },
    { home: "USA", away: "Paraguay", kickoff_et: "21:00", venue: "SoFi Stadium, Inglewood", stage: "Group D" },
  ],
  "2026-06-13": [
    { home: "Qatar", away: "Switzerland", kickoff_et: "15:00", venue: "Levi's Stadium, Santa Clara", stage: "Group B" },
    { home: "Brazil", away: "Morocco", kickoff_et: "18:00", venue: "MetLife Stadium, East Rutherford", stage: "Group C" },
    { home: "Haiti", away: "Scotland", kickoff_et: "21:00", venue: "Gillette Stadium, Foxborough", stage: "Group C" },
  ],
  "2026-06-14": [
    { home: "Australia", away: "Türkiye", kickoff_et: "00:00", venue: "BC Place, Vancouver", stage: "Group D" },
    { home: "Germany", away: "Curaçao", kickoff_et: "13:00", venue: "NRG Stadium, Houston", stage: "Group E" },
    { home: "Netherlands", away: "Japan", kickoff_et: "16:00", venue: "AT&T Stadium, Arlington", stage: "Group F" },
    { home: "Ivory Coast", away: "Ecuador", kickoff_et: "19:00", venue: "Lincoln Financial Field, Philadelphia", stage: "Group E" },
    { home: "Sweden", away: "Tunisia", kickoff_et: "22:00", venue: "Estadio BBVA, Monterrey", stage: "Group F" },
  ],
  "2026-06-15": [
    { home: "Spain", away: "Cape Verde", kickoff_et: "12:00", venue: "Mercedes-Benz Stadium, Atlanta", stage: "Group H" },
    { home: "Belgium", away: "Egypt", kickoff_et: "15:00", venue: "Lumen Field, Seattle", stage: "Group G" },
    { home: "Saudi Arabia", away: "Uruguay", kickoff_et: "18:00", venue: "Hard Rock Stadium, Miami Gardens", stage: "Group H" },
    { home: "Iran", away: "New Zealand", kickoff_et: "21:00", venue: "SoFi Stadium, Inglewood", stage: "Group G" },
  ],
  "2026-06-16": [
    { home: "France", away: "Senegal", kickoff_et: "15:00", venue: "MetLife Stadium, East Rutherford", stage: "Group I" },
    { home: "Iraq", away: "Norway", kickoff_et: "18:00", venue: "Gillette Stadium, Foxborough", stage: "Group I" },
    { home: "Argentina", away: "Algeria", kickoff_et: "21:00", venue: "Arrowhead Stadium, Kansas City", stage: "Group J" },
  ],
  "2026-06-17": [
    { home: "Austria", away: "Jordan", kickoff_et: "00:00", venue: "Levi's Stadium, Santa Clara", stage: "Group J" },
    { home: "Portugal", away: "DR Congo", kickoff_et: "13:00", venue: "NRG Stadium, Houston", stage: "Group K" },
    { home: "England", away: "Croatia", kickoff_et: "16:00", venue: "AT&T Stadium, Arlington", stage: "Group L" },
    { home: "Ghana", away: "Panama", kickoff_et: "19:00", venue: "BMO Field, Toronto", stage: "Group L" },
    { home: "Uzbekistan", away: "Colombia", kickoff_et: "22:00", venue: "Estadio Azteca, Mexico City", stage: "Group K" },
  ],
  "2026-06-18": [
    { home: "Czechia", away: "South Africa", kickoff_et: "12:00", venue: "Mercedes-Benz Stadium, Atlanta", stage: "Group A" },
    { home: "Switzerland", away: "Bosnia & Herzegovina", kickoff_et: "15:00", venue: "SoFi Stadium, Inglewood", stage: "Group B" },
    { home: "Canada", away: "Qatar", kickoff_et: "18:00", venue: "BC Place, Vancouver", stage: "Group B" },
    { home: "Mexico", away: "South Korea", kickoff_et: "21:00", venue: "Estadio Akron, Zapopan", stage: "Group A" },
  ],
  "2026-06-19": [
    { home: "USA", away: "Australia", kickoff_et: "15:00", venue: "Lumen Field, Seattle", stage: "Group D" },
    { home: "Scotland", away: "Morocco", kickoff_et: "18:00", venue: "Gillette Stadium, Foxborough", stage: "Group C" },
    { home: "Brazil", away: "Haiti", kickoff_et: "20:30", venue: "Lincoln Financial Field, Philadelphia", stage: "Group C" },
    { home: "Türkiye", away: "Paraguay", kickoff_et: "23:00", venue: "Levi's Stadium, Santa Clara", stage: "Group D" },
  ],
  "2026-06-20": [
    { home: "Netherlands", away: "Sweden", kickoff_et: "13:00", venue: "NRG Stadium, Houston", stage: "Group F" },
    { home: "Germany", away: "Ivory Coast", kickoff_et: "16:00", venue: "BMO Field, Toronto", stage: "Group E" },
    { home: "Ecuador", away: "Curaçao", kickoff_et: "20:00", venue: "Arrowhead Stadium, Kansas City", stage: "Group E" },
  ],
  "2026-06-21": [
    { home: "Tunisia", away: "Japan", kickoff_et: "00:00", venue: "Estadio BBVA, Monterrey", stage: "Group F" },
    { home: "Spain", away: "Saudi Arabia", kickoff_et: "12:00", venue: "Mercedes-Benz Stadium, Atlanta", stage: "Group H" },
    { home: "Belgium", away: "Iran", kickoff_et: "15:00", venue: "SoFi Stadium, Inglewood", stage: "Group G" },
    { home: "Uruguay", away: "Cape Verde", kickoff_et: "18:00", venue: "Hard Rock Stadium, Miami Gardens", stage: "Group H" },
    { home: "New Zealand", away: "Egypt", kickoff_et: "21:00", venue: "BC Place, Vancouver", stage: "Group G" },
  ],
  "2026-06-22": [
    { home: "Argentina", away: "Austria", kickoff_et: "13:00", venue: "AT&T Stadium, Arlington", stage: "Group J" },
    { home: "France", away: "Iraq", kickoff_et: "17:00", venue: "Lincoln Financial Field, Philadelphia", stage: "Group I" },
    { home: "Norway", away: "Senegal", kickoff_et: "20:00", venue: "MetLife Stadium, East Rutherford", stage: "Group I" },
    { home: "Jordan", away: "Algeria", kickoff_et: "23:00", venue: "Levi's Stadium, Santa Clara", stage: "Group J" },
  ],
  "2026-06-23": [
    { home: "Portugal", away: "Uzbekistan", kickoff_et: "13:00", venue: "NRG Stadium, Houston", stage: "Group K" },
    { home: "England", away: "Ghana", kickoff_et: "16:00", venue: "Gillette Stadium, Foxborough", stage: "Group L" },
    { home: "Panama", away: "Croatia", kickoff_et: "19:00", venue: "BMO Field, Toronto", stage: "Group L" },
    { home: "Colombia", away: "DR Congo", kickoff_et: "22:00", venue: "Estadio Akron, Zapopan", stage: "Group K" },
  ],
  "2026-06-24": [
    { home: "Switzerland", away: "Canada", kickoff_et: "15:00", venue: "BC Place, Vancouver", stage: "Group B" },
    { home: "Bosnia & Herzegovina", away: "Qatar", kickoff_et: "15:00", venue: "Lumen Field, Seattle", stage: "Group B" },
    { home: "Scotland", away: "Brazil", kickoff_et: "18:00", venue: "Hard Rock Stadium, Miami Gardens", stage: "Group C" },
    { home: "Morocco", away: "Haiti", kickoff_et: "18:00", venue: "Mercedes-Benz Stadium, Atlanta", stage: "Group C" },
    { home: "Czechia", away: "Mexico", kickoff_et: "21:00", venue: "Estadio Azteca, Mexico City", stage: "Group A" },
    { home: "South Africa", away: "South Korea", kickoff_et: "21:00", venue: "Estadio BBVA, Monterrey", stage: "Group A" },
  ],
  "2026-06-25": [
    { home: "Curaçao", away: "Ivory Coast", kickoff_et: "16:00", venue: "Lincoln Financial Field, Philadelphia", stage: "Group E" },
    { home: "Ecuador", away: "Germany", kickoff_et: "16:00", venue: "MetLife Stadium, East Rutherford", stage: "Group E" },
    { home: "Japan", away: "Sweden", kickoff_et: "19:00", venue: "AT&T Stadium, Arlington", stage: "Group F" },
    { home: "Tunisia", away: "Netherlands", kickoff_et: "19:00", venue: "Arrowhead Stadium, Kansas City", stage: "Group F" },
    { home: "Türkiye", away: "USA", kickoff_et: "22:00", venue: "SoFi Stadium, Inglewood", stage: "Group D" },
    { home: "Paraguay", away: "Australia", kickoff_et: "22:00", venue: "Levi's Stadium, Santa Clara", stage: "Group D" },
  ],
  "2026-06-26": [
    { home: "Norway", away: "France", kickoff_et: "15:00", venue: "Gillette Stadium, Foxborough", stage: "Group I" },
    { home: "Senegal", away: "Iraq", kickoff_et: "15:00", venue: "BMO Field, Toronto", stage: "Group I" },
    { home: "Cape Verde", away: "Saudi Arabia", kickoff_et: "20:00", venue: "NRG Stadium, Houston", stage: "Group H" },
    { home: "Uruguay", away: "Spain", kickoff_et: "20:00", venue: "Estadio Akron, Zapopan", stage: "Group H" },
    { home: "Egypt", away: "Iran", kickoff_et: "23:00", venue: "Lumen Field, Seattle", stage: "Group G" },
    { home: "New Zealand", away: "Belgium", kickoff_et: "23:00", venue: "BC Place, Vancouver", stage: "Group G" },
  ],
  "2026-06-27": [
    { home: "Panama", away: "England", kickoff_et: "17:00", venue: "MetLife Stadium, East Rutherford", stage: "Group L" },
    { home: "Croatia", away: "Ghana", kickoff_et: "17:00", venue: "Lincoln Financial Field, Philadelphia", stage: "Group L" },
    { home: "Colombia", away: "Portugal", kickoff_et: "19:30", venue: "Hard Rock Stadium, Miami Gardens", stage: "Group K" },
    { home: "DR Congo", away: "Uzbekistan", kickoff_et: "19:30", venue: "Mercedes-Benz Stadium, Atlanta", stage: "Group K" },
    { home: "Algeria", away: "Austria", kickoff_et: "22:00", venue: "Arrowhead Stadium, Kansas City", stage: "Group J" },
    { home: "Jordan", away: "Argentina", kickoff_et: "22:00", venue: "AT&T Stadium, Arlington", stage: "Group J" },
  ],
};

function minutesUntilFirstKickoff(matches) {
  const nowET = new Date(new Date().toLocaleString("en-US", { timeZone: "America/New_York" }));
  const nowMinutes = nowET.getHours() * 60 + nowET.getMinutes();
  const kickoffMinutes = matches.map((m) => {
    const [h, min] = m.kickoff_et.split(":").map(Number);
    return h * 60 + min;
  });
  return Math.min(...kickoffMinutes) - nowMinutes;
}

// Fetch official lineups from API-Football
async function fetchLineups(matches) {
  const apiKey = process.env.API_FOOTBALL_KEY;
  const today = new Date().toLocaleDateString("en-CA", { timeZone: "America/New_York" });
  
  try {
    const res = await fetch(
      `https://v3.football.api-sports.io/fixtures?date=${today}`,
      { headers: { "x-apisports-key": apiKey } }
    );
    const data = await res.json();
    const fixtures = (data.response || []).filter(f => {
      const name = f.league?.name?.toLowerCase() || '';
      return name.includes('world cup') || name.includes('fifa') || f.league?.id === 1;
    });

    const lineupData = {};
    for (const fixture of fixtures) {
      const fixtureId = fixture.fixture?.id;
      if (!fixtureId) continue;

      // Fetch lineups for this fixture
      const lineupRes = await fetch(
        `https://v3.football.api-sports.io/fixtures/lineups?fixture=${fixtureId}`,
        { headers: { "x-apisports-key": apiKey } }
      );
      const lineupJson = await lineupRes.json();
      const lineups = lineupJson.response || [];

      if (lineups.length >= 2) {
        const homeTeam = fixture.teams?.home?.name;
        const awayTeam = fixture.teams?.away?.name;
        
        const formatLineup = (lineup) => {
          const starters = (lineup.startXI || []).map(p => p.player?.name).filter(Boolean);
          const formation = lineup.formation || 'Unknown';
          const coach = lineup.coach?.name || 'Unknown';
          return { starters, formation, coach };
        };

        lineupData[`${homeTeam}|${awayTeam}`] = {
          home: formatLineup(lineups[0]),
          away: formatLineup(lineups[1]),
        };
      }
    }
    return lineupData;
  } catch (e) {
    console.error('Lineup fetch error:', e);
    return {};
  }
}

async function generatePicks(matches, lineupData) {
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric", year: "numeric",
    timeZone: "America/New_York",
  });

  const matchList = matches.map((m) => {
    const key = `${m.home}|${m.away}`;
    const lineups = lineupData[key];
    let lineupText = '';
    if (lineups) {
      lineupText = `
      HOME LINEUP (${lineups.home.formation}): ${lineups.home.starters.join(', ')}
      AWAY LINEUP (${lineups.away.formation}): ${lineups.away.starters.join(', ')}`;
    } else {
      lineupText = '\n      LINEUPS: Not yet confirmed — use web search';
    }
    return `${m.home} vs ${m.away} at ${m.kickoff_et} ET · ${m.venue} · ${m.stage}${lineupText}`;
  }).join('\n\n');

  const systemPrompt = `You are an elite World Cup 2026 betting analyst with deep expertise in soccer props. You have access to official confirmed lineups and must use them to generate razor-sharp picks.

Return ONLY a valid JSON array — no markdown, no backticks, no explanation.

For each match return:
{
  "home": "Country",
  "away": "Country",
  "kickoff": "6:00 PM ET",
  "venue": "Stadium, City",
  "stage": "Group Stage",
  "player_props": [
    {
      "title": "Player Name — Prop Description",
      "line": "Over 1.5 Shots on Target -115",
      "reasoning": "3-4 sentences citing: confirmed lineup position, recent match stats, matchup vs opponent's defensive shape, relevant Statcast-style data.",
      "book": "fanduel|draftkings|betmgm|bet365|fanatics",
      "edge": "+8% Edge",
      "confidence": 4
    }
  ],
  "game_props": [ same structure, 2 picks ],
  "team_props": [ same structure, 2 picks ]
}

CRITICAL RULES:
- Use the confirmed lineup data provided — only pick props for players who are confirmed starters
- EXCLUDE all goalscorer props (first/last/anytime scorer)
- Player props: shots on target, key passes, fouls, tackles, assists, saves (GK), crosses, cards
- Game props: total corners, total cards, BTTS, total shots, result, BTTS+goals, Asian handicap
- Team props: team corners, clean sheet, team shots, first corner, handicap
- Pick the book from [fanduel, draftkings, betmgm, bet365, fanatics] with the best line
- confidence: integer 1-5 (only use 5 for absolute locks)
- reasoning: must cite actual player name from confirmed lineup, their stats, opponent weakness
- Consider: formation matchups, referee tendencies, stadium/weather, tournament stage pressure
- Return exactly 2 player props, 2 game props, 2 team props per match`;

  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 6000,
    tools: [{ type: "web_search_20250305", name: "web_search" }],
    system: systemPrompt,
    messages: [{
      role: "user",
      content: `Today is ${today}. Here are today's matches with confirmed lineups:\n\n${matchList}\n\nUse web search to find any missing lineups, injury news, referee assignments, odds, and recent form. Generate the sharpest possible picks. Return only the JSON array.`
    }],
  });

  const fullText = (response.content || []).map((i) => (i.type === "text" ? i.text : "")).filter(Boolean).join("\n");
  const clean = fullText.replace(/```json|```/g, "").trim();
  const jsonMatch = clean.match(/\[[\s\S]*\]/);
  if (!jsonMatch) throw new Error("No valid JSON in Claude response");
  return JSON.parse(jsonMatch[0]);
}

export default async function handler(req, res) {
  const authHeader = req.headers["authorization"];
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: "Unauthorized", header: authHeader });
  }

  const key = todayKeyET();
  const todayMatches = SCHEDULE[key];

  if (!todayMatches || todayMatches.length === 0) {
    return res.status(200).json({ skipped: true, reason: `No matches today (${key})` });
  }

  const existing = await redis.get(`picks:${key}`);
  if (existing) {
    return res.status(200).json({ skipped: true, reason: "Already generated" });
  }

  const minsUntil = minutesUntilFirstKickoff(todayMatches);
  if (minsUntil > 90 || minsUntil < -120) {
    return res.status(200).json({ skipped: true, reason: `Not in window. Mins until kickoff: ${minsUntil}` });
  }

  try {
    // Fetch official lineups first
    const lineupData = await fetchLineups(todayMatches);
    const lineupCount = Object.keys(lineupData).length;
    
    // Generate picks with lineup data
    const picks = await generatePicks(todayMatches, lineupData);
    await redis.set(`picks:${key}`, JSON.stringify(picks), { ex: 60 * 60 * 36 });
    
    return res.status(200).json({ 
      success: true, 
      key, 
      matches: picks.length,
      lineups_fetched: lineupCount 
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

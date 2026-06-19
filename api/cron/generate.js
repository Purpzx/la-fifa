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
  "2026-06-28": [{ home: "TBD", away: "TBD", kickoff_et: "15:00", venue: "TBD", stage: "Round of 32" }],
  "2026-06-29": [
    { home: "TBD", away: "TBD", kickoff_et: "13:00", venue: "NRG Stadium, Houston", stage: "Round of 32" },
    { home: "TBD", away: "TBD", kickoff_et: "16:30", venue: "Gillette Stadium, Foxborough", stage: "Round of 32" },
    { home: "TBD", away: "TBD", kickoff_et: "21:00", venue: "Estadio BBVA, Monterrey", stage: "Round of 32" },
  ],
  "2026-06-30": [
    { home: "TBD", away: "TBD", kickoff_et: "13:00", venue: "AT&T Stadium, Arlington", stage: "Round of 32" },
    { home: "TBD", away: "TBD", kickoff_et: "17:00", venue: "MetLife Stadium, East Rutherford", stage: "Round of 32" },
    { home: "TBD", away: "TBD", kickoff_et: "21:00", venue: "Estadio Azteca, Mexico City", stage: "Round of 32" },
  ],
  "2026-07-01": [
    { home: "TBD", away: "TBD", kickoff_et: "12:00", venue: "Mercedes-Benz Stadium, Atlanta", stage: "Round of 32" },
    { home: "TBD", away: "TBD", kickoff_et: "16:00", venue: "Lumen Field, Seattle", stage: "Round of 32" },
    { home: "TBD", away: "TBD", kickoff_et: "20:00", venue: "Levi's Stadium, Santa Clara", stage: "Round of 32" },
  ],
  "2026-07-02": [
    { home: "TBD", away: "TBD", kickoff_et: "15:00", venue: "SoFi Stadium, Inglewood", stage: "Round of 32" },
    { home: "TBD", away: "TBD", kickoff_et: "19:00", venue: "BMO Field, Toronto", stage: "Round of 32" },
    { home: "TBD", away: "TBD", kickoff_et: "23:00", venue: "BC Place, Vancouver", stage: "Round of 32" },
  ],
  "2026-07-03": [
    { home: "TBD", away: "TBD", kickoff_et: "14:00", venue: "AT&T Stadium, Arlington", stage: "Round of 32" },
    { home: "TBD", away: "TBD", kickoff_et: "18:00", venue: "Hard Rock Stadium, Miami Gardens", stage: "Round of 32" },
    { home: "TBD", away: "TBD", kickoff_et: "21:30", venue: "Arrowhead Stadium, Kansas City", stage: "Round of 32" },
  ],
  "2026-07-04": [
    { home: "TBD", away: "TBD", kickoff_et: "13:00", venue: "NRG Stadium, Houston", stage: "Round of 16" },
    { home: "TBD", away: "TBD", kickoff_et: "17:00", venue: "Lincoln Financial Field, Philadelphia", stage: "Round of 16" },
  ],
  "2026-07-05": [
    { home: "TBD", away: "TBD", kickoff_et: "16:00", venue: "MetLife Stadium, East Rutherford", stage: "Round of 16" },
    { home: "TBD", away: "TBD", kickoff_et: "20:00", venue: "Estadio Azteca, Mexico City", stage: "Round of 16" },
  ],
  "2026-07-06": [
    { home: "TBD", away: "TBD", kickoff_et: "15:00", venue: "AT&T Stadium, Arlington", stage: "Round of 16" },
    { home: "TBD", away: "TBD", kickoff_et: "20:00", venue: "Lumen Field, Seattle", stage: "Round of 16" },
  ],
  "2026-07-07": [
    { home: "TBD", away: "TBD", kickoff_et: "12:00", venue: "Mercedes-Benz Stadium, Atlanta", stage: "Round of 16" },
    { home: "TBD", away: "TBD", kickoff_et: "16:00", venue: "BC Place, Vancouver", stage: "Round of 16" },
  ],
  "2026-07-09": [{ home: "TBD", away: "TBD", kickoff_et: "16:00", venue: "Gillette Stadium, Foxborough", stage: "Quarterfinal" }],
  "2026-07-10": [{ home: "TBD", away: "TBD", kickoff_et: "15:00", venue: "SoFi Stadium, Inglewood", stage: "Quarterfinal" }],
  "2026-07-11": [
    { home: "TBD", away: "TBD", kickoff_et: "17:00", venue: "Hard Rock Stadium, Miami Gardens", stage: "Quarterfinal" },
    { home: "TBD", away: "TBD", kickoff_et: "21:00", venue: "Arrowhead Stadium, Kansas City", stage: "Quarterfinal" },
  ],
  "2026-07-14": [{ home: "TBD", away: "TBD", kickoff_et: "15:00", venue: "AT&T Stadium, Arlington", stage: "Semifinal" }],
  "2026-07-15": [{ home: "TBD", away: "TBD", kickoff_et: "15:00", venue: "Mercedes-Benz Stadium, Atlanta", stage: "Semifinal" }],
  "2026-07-18": [{ home: "TBD", away: "TBD", kickoff_et: "17:00", venue: "Hard Rock Stadium, Miami Gardens", stage: "Third Place" }],
  "2026-07-19": [{ home: "TBD", away: "TBD", kickoff_et: "15:00", venue: "MetLife Stadium, East Rutherford, NJ", stage: "Final" }],
};

const STADIUM_INFO = {
  "Lumen Field, Seattle": { outdoor: true, notes: "Wind/rain suppresses scoring" },
  "MetLife Stadium, East Rutherford": { outdoor: true, notes: "Open-air NJ, wind affects wide play" },
  "Gillette Stadium, Foxborough": { outdoor: true, notes: "New England weather, can be windy" },
  "BMO Field, Toronto": { outdoor: true, notes: "Open air, variable weather" },
  "BC Place, Vancouver": { outdoor: false, notes: "Retractable roof, controlled" },
  "NRG Stadium, Houston": { outdoor: false, notes: "Domed, neutral conditions" },
  "AT&T Stadium, Arlington": { outdoor: false, notes: "Domed, neutral conditions" },
  "Mercedes-Benz Stadium, Atlanta": { outdoor: false, notes: "Retractable roof, controlled" },
  "SoFi Stadium, Inglewood": { outdoor: false, notes: "Covered, mild LA weather" },
  "Hard Rock Stadium, Miami Gardens": { outdoor: true, notes: "Open air, hot and humid" },
  "Arrowhead Stadium, Kansas City": { outdoor: true, notes: "Open air, variable midwest weather" },
  "Lincoln Financial Field, Philadelphia": { outdoor: true, notes: "Open air Philadelphia" },
  "Estadio Azteca, Mexico City": { outdoor: true, notes: "HIGH ALTITUDE 2240m — suppresses tempo and stamina" },
  "Estadio Akron, Zapopan": { outdoor: true, notes: "High altitude, warm" },
  "Estadio BBVA, Monterrey": { outdoor: true, notes: "Extreme summer heat" },
  "Levi's Stadium, Santa Clara": { outdoor: true, notes: "Open air, mild Bay Area" },
};

function getTournamentContext(stage) {
  if (stage.includes("Group")) return "GROUP STAGE: Check standings — teams already through may rotate. Teams needing result play open and desperate = more cards/corners/shots.";
  if (stage.includes("Round of 32") || stage.includes("Round of 16")) return "KNOCKOUT: No rotation, best XI plays. High intensity, tactical fouling = more cards. Extra time possible.";
  if (stage.includes("Quarterfinal")) return "QUARTERFINAL: Elite teams, cautious starts. Cards valuable as teams foul to disrupt. Stars near suspension may be managed.";
  if (stage.includes("Semifinal")) return "SEMIFINAL: Maximum pressure, ultra-disciplined. Low scoring expected. Fatigue factor. Under props gain value.";
  if (stage.includes("Final")) return "FINAL: Ultra cautious, often decided late. Under total goals has value. Both teams rested.";
  if (stage.includes("Third")) return "THIRD PLACE: Deflated teams play without pressure = high scoring, open game. Over/BTTS props gain value.";
  return "";
}

function minutesUntilFirstKickoff(matches) {
  const nowET = new Date(new Date().toLocaleString("en-US", { timeZone: "America/New_York" }));
  const nowMinutes = nowET.getHours() * 60 + nowET.getMinutes();
  const kickoffMinutes = matches.map((m) => {
    const [h, min] = m.kickoff_et.split(":").map(Number);
    return h * 60 + min;
  });
  return Math.min(...kickoffMinutes) - nowMinutes;
}

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
      const [lineupRes, detailRes] = await Promise.all([
        fetch(`https://v3.football.api-sports.io/fixtures/lineups?fixture=${fixtureId}`,
          { headers: { "x-apisports-key": apiKey } }),
        fetch(`https://v3.football.api-sports.io/fixtures?id=${fixtureId}`,
          { headers: { "x-apisports-key": apiKey } }),
      ]);
      const [lineupJson, detailJson] = await Promise.all([lineupRes.json(), detailRes.json()]);
      const lineups = lineupJson.response || [];
      const referee = detailJson.response?.[0]?.fixture?.referee || 'Unknown';
      const homeTeam = fixture.teams?.home?.name;
      const awayTeam = fixture.teams?.away?.name;
      if (lineups.length >= 2) {
        const fmt = (l) => ({
          starters: (l.startXI || []).map(p => `${p.player?.name} (${p.player?.pos})`).filter(Boolean),
          formation: l.formation || 'Unknown',
          coach: l.coach?.name || 'Unknown',
        });
        lineupData[`${homeTeam}|${awayTeam}`] = {
          home: fmt(lineups[0]),
          away: fmt(lineups[1]),
          referee,
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
    const stadium = STADIUM_INFO[m.venue] || { outdoor: true, notes: "Open air" };
    const context = getTournamentContext(m.stage);

    let lineupText = lineups
      ? `✅ LINEUPS CONFIRMED:
HOME ${m.home} (${lineups.home.formation}): ${lineups.home.starters.join(', ')}
AWAY ${m.away} (${lineups.away.formation}): ${lineups.away.starters.join(', ')}
REFEREE: ${lineups.referee} — search avg cards/game`
      : `⚠️ LINEUPS NOT CONFIRMED — search for expected XI and injuries`;

    return `${m.home} vs ${m.away} | ${m.kickoff_et} ET | ${m.venue} (${stadium.outdoor ? 'OUTDOOR' : 'INDOOR'}: ${stadium.notes}) | ${m.stage}
${context}
${lineupText}`;
  }).join('\n\n---\n\n');

  const systemPrompt = `You are an elite World Cup 2026 betting analyst. Think like a sharp bettor — hunt edges, not favorites.

APPLY TO EVERY PICK:
- Referee: search avg cards/game → card prop value
- Formation matchup: wide play = corners, direct = fewer corners
- Tournament stage: apply context given (rotation, desperation, caution)
- Stadium: outdoor/altitude affects tempo; dome = neutral
- Motivation: who needs result? Desperate = open play = cards/corners
- Line value: where is the public wrong?

Return ONLY valid JSON array, no markdown:
[{"home":"","away":"","kickoff":"","venue":"","stage":"",
"player_props":[{"title":"Player — Prop","line":"Over X -115","reasoning":"3 sentences: starter confirmed + specific stat + matchup/referee/stadium edge","book":"fanduel|draftkings|betmgm|bet365|fanatics","edge":"+8% Edge","confidence":4}],
"game_props":[same,2 picks],"team_props":[same,2 picks]}]

RULES: Only confirmed starters for player props. No goalscorer props. Player: shots,passes,fouls,tackles,saves,crosses,cards. Game: corners,cards,BTTS,shots,handicap. Team: team corners,clean sheet,team shots,first corner. Best book across all 5. Confidence 5=lock(rare),4=strong,3=moderate. Exactly 2+2+2 per match.`;

  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 6000,
    tools: [{ type: "web_search_20250305", name: "web_search" }],
    system: systemPrompt,
    messages: [{
      role: "user",
      content: `Date: ${today}\n\n${matchList}\n\nSearch for each match: referee avg cards/game, group standings, injury news, best odds across all 5 books, each team's last WC match stats. Return JSON only.`
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
    return res.status(401).json({ error: "Unauthorized" });
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
    return res.status(200).json({ skipped: true, reason: `Not in window. Mins: ${minsUntil}` });
  }

  try {
    const lineupData = await fetchLineups(todayMatches);
    const picks = await generatePicks(todayMatches, lineupData);
    await redis.set(`picks:${key}`, JSON.stringify(picks), { ex: 60 * 60 * 36 });
    return res.status(200).json({ success: true, key, matches: picks.length, lineups_fetched: Object.keys(lineupData).length });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

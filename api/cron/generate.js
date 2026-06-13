import Anthropic from "@anthropic-ai/sdk";
import { Redis } from "@upstash/redis";

const client = new Anthropic();
const redis = new Redis({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
});

function todayKey() {
  return new Date().toISOString().split("T")[0];
}

const SCHEDULE = {
  // ── GROUP STAGE ──────────────────────────────────────────────
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
  // ── ROUND OF 32 (TBD matchups determined by group results) ───
  "2026-06-28": [
    { home: "Runner-up A", away: "Runner-up B", kickoff_et: "15:00", venue: "SoFi Stadium, Inglewood", stage: "Round of 32" },
  ],
  "2026-06-29": [
    { home: "Winner C", away: "Runner-up F", kickoff_et: "13:00", venue: "NRG Stadium, Houston", stage: "Round of 32" },
    { home: "Winner E", away: "Best 3rd Place", kickoff_et: "16:30", venue: "Gillette Stadium, Foxborough", stage: "Round of 32" },
    { home: "Winner F", away: "Runner-up C", kickoff_et: "21:00", venue: "Estadio BBVA, Monterrey", stage: "Round of 32" },
  ],
  "2026-06-30": [
    { home: "Runner-up E", away: "Runner-up I", kickoff_et: "13:00", venue: "AT&T Stadium, Arlington", stage: "Round of 32" },
    { home: "Winner I", away: "Best 3rd Place", kickoff_et: "17:00", venue: "MetLife Stadium, East Rutherford", stage: "Round of 32" },
    { home: "Winner A", away: "Best 3rd Place", kickoff_et: "21:00", venue: "Estadio Azteca, Mexico City", stage: "Round of 32" },
  ],
  "2026-07-01": [
    { home: "Winner L", away: "Best 3rd Place", kickoff_et: "12:00", venue: "Mercedes-Benz Stadium, Atlanta", stage: "Round of 32" },
    { home: "Winner G", away: "Best 3rd Place", kickoff_et: "16:00", venue: "Lumen Field, Seattle", stage: "Round of 32" },
    { home: "Winner D", away: "Best 3rd Place", kickoff_et: "20:00", venue: "Levi's Stadium, Santa Clara", stage: "Round of 32" },
  ],
  "2026-07-02": [
    { home: "Winner H", away: "Runner-up J", kickoff_et: "15:00", venue: "SoFi Stadium, Inglewood", stage: "Round of 32" },
    { home: "Runner-up K", away: "Runner-up L", kickoff_et: "19:00", venue: "BMO Field, Toronto", stage: "Round of 32" },
    { home: "Winner B", away: "Best 3rd Place", kickoff_et: "23:00", venue: "BC Place, Vancouver", stage: "Round of 32" },
  ],
  "2026-07-03": [
    { home: "Runner-up D", away: "Runner-up G", kickoff_et: "14:00", venue: "AT&T Stadium, Arlington", stage: "Round of 32" },
    { home: "Winner J", away: "Runner-up H", kickoff_et: "18:00", venue: "Hard Rock Stadium, Miami Gardens", stage: "Round of 32" },
    { home: "Winner K", away: "Best 3rd Place", kickoff_et: "21:30", venue: "Arrowhead Stadium, Kansas City", stage: "Round of 32" },
  ],
  // ── ROUND OF 16 ──────────────────────────────────────────────
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
  // ── QUARTERFINALS ────────────────────────────────────────────
  "2026-07-09": [
    { home: "TBD", away: "TBD", kickoff_et: "16:00", venue: "Gillette Stadium, Foxborough", stage: "Quarterfinal" },
  ],
  "2026-07-10": [
    { home: "TBD", away: "TBD", kickoff_et: "15:00", venue: "SoFi Stadium, Inglewood", stage: "Quarterfinal" },
  ],
  "2026-07-11": [
    { home: "TBD", away: "TBD", kickoff_et: "17:00", venue: "Hard Rock Stadium, Miami Gardens", stage: "Quarterfinal" },
    { home: "TBD", away: "TBD", kickoff_et: "21:00", venue: "Arrowhead Stadium, Kansas City", stage: "Quarterfinal" },
  ],
  // ── SEMIFINALS ───────────────────────────────────────────────
  "2026-07-14": [
    { home: "TBD", away: "TBD", kickoff_et: "15:00", venue: "AT&T Stadium, Arlington", stage: "Semifinal" },
  ],
  "2026-07-15": [
    { home: "TBD", away: "TBD", kickoff_et: "15:00", venue: "Mercedes-Benz Stadium, Atlanta", stage: "Semifinal" },
  ],
  // ── THIRD PLACE & FINAL ──────────────────────────────────────
  "2026-07-18": [
    { home: "TBD", away: "TBD", kickoff_et: "17:00", venue: "Hard Rock Stadium, Miami Gardens", stage: "Third Place" },
  ],
  "2026-07-19": [
    { home: "TBD", away: "TBD", kickoff_et: "15:00", venue: "MetLife Stadium, East Rutherford, NJ", stage: "Final" },
  ],
};

function minutesUntilFirstKickoff(matches) {
  const now = new Date();
  const nowET = new Date(
    now.toLocaleString("en-US", { timeZone: "America/New_York" })
  );
  const nowMinutes = nowET.getHours() * 60 + nowET.getMinutes();
  const kickoffMinutes = matches.map((m) => {
    const [h, min] = m.kickoff_et.split(":").map(Number);
    return h * 60 + min;
  });
  return Math.min(...kickoffMinutes) - nowMinutes;
}

async function generatePicks(matches) {
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric", year: "numeric",
    timeZone: "America/New_York",
  });

  const matchList = matches
    .map((m) => `${m.home} vs ${m.away} at ${m.kickoff_et} ET`)
    .join("\n");

  const systemPrompt = `You are a sharp World Cup 2026 betting analyst. Use web search to find confirmed lineups, injury reports, and current odds for today's matches.

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
      "reasoning": "2-3 sentences with real data: form, matchup, lineup confirmation, injury news.",
      "book": "fanduel|draftkings|betmgm|bet365|fanatics",
      "edge": "+8% Edge",
      "confidence": 4
    }
  ],
  "game_props": [ same, 2 picks ],
  "team_props": [ same, 2 picks ]
}

Rules:
- EXCLUDE all goalscorer props
- Player props: shots on target, key passes, fouls, tackles, assists, saves, crosses, cards
- Game props: total corners, total cards, BTTS, total shots, result, BTTS+goals
- Team props: team corners, clean sheet, team shots, first corner, handicap
- book: pick from [fanduel, draftkings, betmgm, bet365, fanatics] with best line
- confidence: integer 1-5
- reasoning: cite confirmed lineup data, injuries, h2h, recent form
- Return exactly 2 player props, 2 game props, 2 team props per match`;

  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 4000,
    tools: [{ type: "web_search_20250305", name: "web_search" }],
    system: systemPrompt,
    messages: [{ role: "user", content: `Today is ${today}. Matches:\n${matchList}\n\nReturn only the JSON array.` }],
  });

  const fullText = (response.content || [])
    .map((item) => (item.type === "text" ? item.text : ""))
    .filter(Boolean)
    .join("\n");

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

  const key = todayKey();
  const todayMatches = SCHEDULE[key];

  if (!todayMatches || todayMatches.length === 0) {
    return res.status(200).json({ skipped: true, reason: "No matches today" });
  }

  const existing = await redis.get(`picks:${key}`);
  if (existing) {
    return res.status(200).json({ skipped: true, reason: "Already generated" });
  }

  const minsUntil = minutesUntilFirstKickoff(todayMatches);
  if (minsUntil > 90 || minsUntil < -30) {
    return res.status(200).json({ skipped: true, reason: `Not in window. Mins until kickoff: ${minsUntil}` });
  }

  try {
    const picks = await generatePicks(todayMatches);
    await redis.set(`picks:${key}`, JSON.stringify(picks), { ex: 60 * 60 * 36 });
    return res.status(200).json({ success: true, matches: picks.length });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

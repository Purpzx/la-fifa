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
  // ROUND OF 32
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
  // ROUND OF 16
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
  // QUARTERFINALS
  "2026-07-09": [{ home: "TBD", away: "TBD", kickoff_et: "16:00", venue: "Gillette Stadium, Foxborough", stage: "Quarterfinal" }],
  "2026-07-10": [{ home: "TBD", away: "TBD", kickoff_et: "15:00", venue: "SoFi Stadium, Inglewood", stage: "Quarterfinal" }],
  "2026-07-11": [
    { home: "TBD", away: "TBD", kickoff_et: "17:00", venue: "Hard Rock Stadium, Miami Gardens", stage: "Quarterfinal" },
    { home: "TBD", away: "TBD", kickoff_et: "21:00", venue: "Arrowhead Stadium, Kansas City", stage: "Quarterfinal" },
  ],
  // SEMIFINALS
  "2026-07-14": [{ home: "TBD", away: "TBD", kickoff_et: "15:00", venue: "AT&T Stadium, Arlington", stage: "Semifinal" }],
  "2026-07-15": [{ home: "TBD", away: "TBD", kickoff_et: "15:00", venue: "Mercedes-Benz Stadium, Atlanta", stage: "Semifinal" }],
  // FINAL
  "2026-07-18": [{ home: "TBD", away: "TBD", kickoff_et: "17:00", venue: "Hard Rock Stadium, Miami Gardens", stage: "Third Place" }],
  "2026-07-19": [{ home: "TBD", away: "TBD", kickoff_et: "15:00", venue: "MetLife Stadium, East Rutherford, NJ", stage: "Final" }],
};

// Stadium outdoor/indoor and weather sensitivity
const STADIUM_INFO = {
  "Lumen Field, Seattle": { outdoor: true, weather_sensitive: true, notes: "Known for wind and rain, suppresses scoring" },
  "MetLife Stadium, East Rutherford": { outdoor: true, weather_sensitive: true, notes: "Open-air NJ stadium, wind affects wide play" },
  "Gillette Stadium, Foxborough": { outdoor: true, weather_sensitive: true, notes: "New England weather, can be windy" },
  "BMO Field, Toronto": { outdoor: true, weather_sensitive: true, notes: "Open air, variable Canadian weather" },
  "BC Place, Vancouver": { outdoor: false, weather_sensitive: false, notes: "Retractable roof, controlled conditions" },
  "NRG Stadium, Houston": { outdoor: false, weather_sensitive: false, notes: "Domed stadium, neutral conditions" },
  "AT&T Stadium, Arlington": { outdoor: false, weather_sensitive: false, notes: "Domed stadium, neutral conditions" },
  "Mercedes-Benz Stadium, Atlanta": { outdoor: false, weather_sensitive: false, notes: "Retractable roof, controlled conditions" },
  "SoFi Stadium, Inglewood": { outdoor: false, weather_sensitive: false, notes: "Covered open-air, mild LA weather" },
  "Hard Rock Stadium, Miami Gardens": { outdoor: true, weather_sensitive: true, notes: "Open air Miami, hot and humid" },
  "Arrowhead Stadium, Kansas City": { outdoor: true, weather_sensitive: true, notes: "Open air, variable midwest weather" },
  "Lincoln Financial Field, Philadelphia": { outdoor: true, weather_sensitive: true, notes: "Open air Philadelphia" },
  "Estadio Azteca, Mexico City": { outdoor: true, weather_sensitive: false, notes: "High altitude 2,240m — affects stamina and scoring" },
  "Estadio Akron, Zapopan": { outdoor: true, weather_sensitive: false, notes: "High altitude, warm climate" },
  "Estadio BBVA, Monterrey": { outdoor: true, weather_sensitive: true, notes: "Extreme heat in summer" },
  "Levi's Stadium, Santa Clara": { outdoor: true, weather_sensitive: false, notes: "Open air, mild Bay Area climate" },
};

// Tournament stage context
function getTournamentContext(stage, matches) {
  if (stage.includes("Group")) {
    return `GROUP STAGE CONTEXT: Teams may be managing fitness across 3 games in ~10 days. Check current group standings — teams that have already qualified may rotate key players. Teams eliminated or needing a result play completely differently. This massively affects prop values.`;
  }
  if (stage.includes("Round of 32") || stage.includes("Round of 16")) {
    return `KNOCKOUT STAGE CONTEXT: Single elimination — every team plays to win. No rotation, best XI on the pitch. Expect higher intensity, more tactical fouling, more cards. Teams that drew or were 3rd in groups are desperate. Overtime is possible — consider props that cover extra time.`;
  }
  if (stage.includes("Quarterfinal")) {
    return `QUARTERFINAL CONTEXT: Elite teams only. Tactically conservative starts expected — coaches prioritize not conceding. First half often cagey. Card props valuable as both teams foul to break up play. Best 8 teams in the tournament.`;
  }
  if (stage.includes("Semifinal")) {
    return `SEMIFINAL CONTEXT: Highest pressure matches of the tournament. Extremely tactically disciplined. Expect low scoring, tight lines. Players carry fatigue from previous rounds. Stars who are 1 yellow away from suspension may be managed.`;
  }
  if (stage.includes("Final") || stage.includes("Third")) {
    return `FINAL/THIRD PLACE CONTEXT: Third place games are often high scoring — losing semifinalists are disappointed but free from pressure. Finals are the opposite — ultra cautious, often decided late. Consider under props for the final, over for third place.`;
  }
  return '';
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

      // Fetch lineups + fixture details in parallel
      const [lineupRes, detailRes] = await Promise.all([
        fetch(`https://v3.football.api-sports.io/fixtures/lineups?fixture=${fixtureId}`,
          { headers: { "x-apisports-key": apiKey } }),
        fetch(`https://v3.football.api-sports.io/fixtures?id=${fixtureId}`,
          { headers: { "x-apisports-key": apiKey } }),
      ]);

      const [lineupJson, detailJson] = await Promise.all([
        lineupRes.json(),
        detailRes.json(),
      ]);

      const lineups = lineupJson.response || [];
      const detail = detailJson.response?.[0];
      const referee = detail?.fixture?.referee || 'Unknown';

      const homeTeam = fixture.teams?.home?.name;
      const awayTeam = fixture.teams?.away?.name;

      if (lineups.length >= 2) {
        const formatLineup = (lineup) => ({
          starters: (lineup.startXI || []).map(p => `${p.player?.name} (#${p.player?.number}, ${p.player?.pos})`).filter(Boolean),
          formation: lineup.formation || 'Unknown',
          coach: lineup.coach?.name || 'Unknown',
          substitutes: (lineup.substitutes || []).map(p => p.player?.name).filter(Boolean).slice(0, 5),
        });

        lineupData[`${homeTeam}|${awayTeam}`] = {
          home: formatLineup(lineups[0]),
          away: formatLineup(lineups[1]),
          referee,
          fixture_id: fixtureId,
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
    const stadiumInfo = STADIUM_INFO[m.venue] || { outdoor: true, weather_sensitive: false, notes: "Open air stadium" };
    const tournamentContext = getTournamentContext(m.stage, matches);

    let lineupText = '';
    if (lineups) {
      lineupText = `
    ✅ CONFIRMED LINEUPS (use these players ONLY for player props):
    HOME ${m.home} (${lineups.home.formation}) coached by ${lineups.home.coach}:
    ${lineups.home.starters.join(', ')}
    Subs available: ${lineups.home.substitutes.join(', ')}

    AWAY ${m.away} (${lineups.away.formation}) coached by ${lineups.away.coach}:
    ${lineups.away.starters.join(', ')}
    Subs available: ${lineups.away.substitutes.join(', ')}

    🎯 REFEREE: ${lineups.referee} — search for this referee's avg cards/game, fouls/game, and style`;
    } else {
      lineupText = `\n    ⚠️ LINEUPS NOT YET CONFIRMED — use web search to find expected XI and any injury news`;
    }

    return `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
MATCH: ${m.home} vs ${m.away}
KICKOFF: ${m.kickoff_et} ET
VENUE: ${m.venue}
STAGE: ${m.stage}
STADIUM: ${stadiumInfo.outdoor ? 'OUTDOOR' : 'INDOOR/COVERED'} — ${stadiumInfo.notes}
${tournamentContext}
${lineupText}`;
  }).join('\n\n');

  const systemPrompt = `You are an elite World Cup 2026 betting analyst. You think like a professional sharp bettor — you look for edges, not just favorites.

ANALYTICAL FRAMEWORK — apply this to every pick:
1. LINEUP VERIFICATION: Only pick props for confirmed starters. A star player starting changes everything.
2. REFEREE ANALYSIS: Search for the assigned referee. High-card refs = card props. Low-card refs = avoid card props.
3. FORMATION MATCHUP: A 4-3-3 vs 5-4-1 creates wide play → more corners. Two 4-4-2 teams = direct play → fewer corners.
4. TOURNAMENT STAGE: Apply the context provided. Group stage rotation, knockout desperation, final caution — these are different games.
5. STADIUM/WEATHER: Outdoor windy stadiums suppress corners and long balls. Altitude increases fatigue. Domes = neutral.
6. MOTIVATION ANALYSIS: Which team NEEDS this result? A team that needs a win plays more open = more cards, corners, shots.
7. RECENT FORM IN THIS TOURNAMENT: How did each team perform in their last match? High shots? Low corners? Aggressive ref?
8. VALUE IDENTIFICATION: Is the line set correctly by the book? Where is the public money vs where is the value?

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
      "reasoning": "4-5 sentences. MUST include: (1) confirmed starter status, (2) specific recent stat cited, (3) matchup advantage, (4) referee/stadium factor if relevant, (5) why the line has value.",
      "book": "fanduel|draftkings|betmgm|bet365|fanatics",
      "edge": "+8% Edge",
      "confidence": 4
    }
  ],
  "game_props": [ same structure, 2 picks ],
  "team_props": [ same structure, 2 picks ]
}

STRICT RULES:
- ONLY pick player props for confirmed starters from the lineup provided
- EXCLUDE all goalscorer props (first/last/anytime scorer)
- Player props: shots on target, key passes, fouls, tackles, assists, saves (GK), crosses, cards
- Game props: total corners, total cards, BTTS, total shots, Asian handicap, clean sheet
- Team props: team corners, team clean sheet, team total shots, first corner, handicap
- Pick the book with the genuinely best line — shop all 5 books
- confidence 5 = near lock (use sparingly), 4 = strong, 3 = moderate, 1-2 = skip
- If you cannot find enough data to be confident on a prop, pick a different prop
- reasoning MUST cite the player's name, a specific stat or number, and the matchup context
- Return exactly 2 player props, 2 game props, 2 team props per match`;

  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 8000,
    tools: [{ type: "web_search_20250305", name: "web_search" }],
    system: systemPrompt,
    messages: [{
      role: "user",
      content: `Today is ${today}. Here are today's World Cup matches with all available data:\n\n${matchList}\n\nFor each match:
1. Search for the referee's card/foul tendencies if not already provided
2. Search for current group standings and qualification scenarios
3. Search for injury news and any late lineup changes
4. Search for best available odds on all 5 books
5. Search for each team's stats from their previous WC matches (shots, corners, cards)

Then apply the analytical framework and generate the sharpest possible picks. Return only the JSON array.`
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
    return res.status(200).json({ skipped: true, reason: `Not in window. Mins until kickoff: ${minsUntil}` });
  }

  try {
    const lineupData = await fetchLineups(todayMatches);
    const picks = await generatePicks(todayMatches, lineupData);
    await redis.set(`picks:${key}`, JSON.stringify(picks), { ex: 60 * 60 * 36 });
    return res.status(200).json({
      success: true, key,
      matches: picks.length,
      lineups_fetched: Object.keys(lineupData).length,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

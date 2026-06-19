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

const STADIUM_INFO = {
  "Lumen Field, Seattle": { outdoor: true, notes: "Known for wind and rain, suppresses scoring and wide play" },
  "MetLife Stadium, East Rutherford": { outdoor: true, notes: "Open-air NJ stadium, wind affects wide play and corners" },
  "Gillette Stadium, Foxborough": { outdoor: true, notes: "New England weather, can be windy and cold" },
  "BMO Field, Toronto": { outdoor: true, notes: "Open air, variable Canadian weather" },
  "BC Place, Vancouver": { outdoor: false, notes: "Retractable roof, fully controlled conditions" },
  "NRG Stadium, Houston": { outdoor: false, notes: "Domed stadium, neutral controlled conditions" },
  "AT&T Stadium, Arlington": { outdoor: false, notes: "Domed stadium, neutral controlled conditions" },
  "Mercedes-Benz Stadium, Atlanta": { outdoor: false, notes: "Retractable roof, controlled conditions" },
  "SoFi Stadium, Inglewood": { outdoor: false, notes: "Covered open-air, mild LA weather" },
  "Hard Rock Stadium, Miami Gardens": { outdoor: true, notes: "Open air Miami, hot and humid, affects stamina" },
  "Arrowhead Stadium, Kansas City": { outdoor: true, notes: "Open air, variable midwest weather" },
  "Lincoln Financial Field, Philadelphia": { outdoor: true, notes: "Open air Philadelphia, variable conditions" },
  "Estadio Azteca, Mexico City": { outdoor: true, notes: "High altitude 2,240m — significantly affects stamina, suppresses high-tempo play" },
  "Estadio Akron, Zapopan": { outdoor: true, notes: "High altitude, warm climate" },
  "Estadio BBVA, Monterrey": { outdoor: true, notes: "Extreme summer heat, affects intensity in second half" },
  "Levi's Stadium, Santa Clara": { outdoor: true, notes: "Open air, mild Bay Area climate" },
};

function getTournamentContext(stage) {
  if (stage.includes("Group")) {
    return `GROUP STAGE CONTEXT: Teams managing fitness across 3 games in ~10 days. Check current standings — teams already through may rotate stars. Teams eliminated play recklessly. Teams needing a result play more open and aggressive = more cards, corners, shots. Group stage desperation is a massive prop edge.`;
  }
  if (stage.includes("Round of 32") || stage.includes("Round of 16")) {
    return `KNOCKOUT STAGE CONTEXT: Single elimination — no rotation, best XI always plays. Higher intensity and tactical fouling = more cards. Teams that were 3rd in groups are desperate. Extra time is possible — consider props that cover ET. Corners tend to increase as teams push for goals.`;
  }
  if (stage.includes("Quarterfinal")) {
    return `QUARTERFINAL CONTEXT: Only elite teams remain. Tactically conservative starts — coaches protect leads. First halves are cagey. Card props are valuable as both teams foul to disrupt rhythm. Stars who are 1 yellow from suspension may be managed carefully.`;
  }
  if (stage.includes("Semifinal")) {
    return `SEMIFINAL CONTEXT: Highest pressure matches. Extremely disciplined and tactical. Expect low scoring, tight lines. Player fatigue from tournament accumulation. Under props and clean sheet props gain value. Stars who are suspension-risk may be cautious.`;
  }
  if (stage.includes("Final")) {
    return `FINAL CONTEXT: Ultra cautious — no team wants to lose the World Cup final. Expect low scoring, first half often goalless. Under total goals and clean sheet first half props have value. Both teams have had extra rest.`;
  }
  if (stage.includes("Third")) {
    return `THIRD PLACE CONTEXT: Losing semifinalists are often emotionally deflated but free from pressure. These games tend to be high scoring and open — teams play without fear. Over props and BTTS gain value significantly.`;
  }
  return '';
}

async function fetchLineupsForDate(dateKey) {
  const apiKey = process.env.API_FOOTBALL_KEY;
  try {
    const res = await fetch(
      `https://v3.football.api-sports.io/fixtures?date=${dateKey}`,
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

      const [lineupJson, detailJson] = await Promise.all([
        lineupRes.json(),
        detailRes.json(),
      ]);

      const lineups = lineupJson.response || [];
      const referee = detailJson.response?.[0]?.fixture?.referee || 'Unknown';
      const homeTeam = fixture.teams?.home?.name;
      const awayTeam = fixture.teams?.away?.name;

      if (lineups.length >= 2) {
        const fmt = (l) => ({
          starters: (l.startXI || []).map(p => `${p.player?.name} (${p.player?.pos})`).filter(Boolean),
          formation: l.formation || 'Unknown',
          coach: l.coach?.name || 'Unknown',
          subs: (l.substitutes || []).map(p => p.player?.name).filter(Boolean).slice(0, 5),
        });
        lineupData[`${homeTeam}|${awayTeam}`] = {
          home: fmt(lineups[0]),
          away: fmt(lineups[1]),
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

async function generatePicksWithContext(matches, lineupData, dateKey) {
  const dateStr = new Date(dateKey + 'T12:00:00').toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric", year: "numeric"
  });

  const matchList = matches.map((m) => {
    const key = `${m.home}|${m.away}`;
    const lineups = lineupData[key];
    const stadium = STADIUM_INFO[m.venue] || { outdoor: true, notes: "Open air stadium" };
    const context = getTournamentContext(m.stage);

    let lineupText = '';
    if (lineups) {
      lineupText = `
    ✅ CONFIRMED LINEUPS:
    HOME ${m.home} (${lineups.home.formation}) — Coach: ${lineups.home.coach}
    Starters: ${lineups.home.starters.join(', ')}
    Subs: ${lineups.home.subs.join(', ')}

    AWAY ${m.away} (${lineups.away.formation}) — Coach: ${lineups.away.coach}
    Starters: ${lineups.away.starters.join(', ')}
    Subs: ${lineups.away.subs.join(', ')}

    🎯 REFEREE: ${lineups.referee} — search for cards/game average and foul rate`;
    } else {
      lineupText = `\n    ⚠️ LINEUPS NOT CONFIRMED — search web for expected XI and injury news`;
    }

    return `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
MATCH: ${m.home} vs ${m.away}
KICKOFF: ${m.kickoff_et} ET
VENUE: ${m.venue} (${stadium.outdoor ? 'OUTDOOR' : 'INDOOR'}) — ${stadium.notes}
STAGE: ${m.stage}
${context}
${lineupText}`;
  }).join('\n\n');

  const systemPrompt = `You are an elite World Cup 2026 betting analyst — think like a professional sharp bettor hunting edges, not just picking favorites.

ANALYTICAL FRAMEWORK (apply every pick):
1. LINEUP VERIFICATION — Only prop confirmed starters. Rotation changes everything.
2. REFEREE PROFILE — High card ref = card props. Low card ref = avoid cards. Search and cite avg cards/game.
3. FORMATION MATCHUP — Wide formations = more corners. Direct teams = fewer corners. Pressing teams = more fouls.
4. TOURNAMENT STAGE — Apply the context given. Group stage rotation, knockout desperation, final caution = different games.
5. STADIUM/CONDITIONS — Outdoor windy = suppress corners. Altitude = suppress tempo. Dome = neutral.
6. MOTIVATION — Who NEEDS this result? Desperate teams play open = more cards, shots, corners.
7. RECENT WC FORM — How did each team perform in their last match? Carry those trends.
8. LINE VALUE — Is the book line correct? Where is the public wrong? Find mispriced props.

Return ONLY a valid JSON array — no markdown, no backticks:
[{
  "home": "Country",
  "away": "Country",
  "kickoff": "6:00 PM ET",
  "venue": "Stadium, City",
  "stage": "Stage",
  "player_props": [{
    "title": "Player Name — Prop",
    "line": "Over 1.5 Shots on Target -115",
    "reasoning": "4-5 sentences: confirmed starter + specific stat + matchup advantage + referee/stadium factor + why the line has value",
    "book": "fanduel|draftkings|betmgm|bet365|fanatics",
    "edge": "+8% Edge",
    "confidence": 4
  }],
  "game_props": [same, 2 picks],
  "team_props": [same, 2 picks]
}]

RULES:
- Only pick player props for confirmed starters
- EXCLUDE all goalscorer props
- Player: shots on target, key passes, fouls, tackles, assists, saves, crosses, cards
- Game: total corners, total cards, BTTS, total shots, Asian handicap
- Team: team corners, clean sheet, team shots, first corner, handicap
- Best book = genuinely best line across all 5 books
- Confidence 5 = near lock (rare), 4 = strong, 3 = moderate
- Reasoning MUST cite player name, specific stat/number, and matchup context
- Exactly 2 player props, 2 game props, 2 team props per match`;

  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 8000,
    tools: [{ type: "web_search_20250305", name: "web_search" }],
    system: systemPrompt,
    messages: [{
      role: "user",
      content: `Date: ${dateStr}

${matchList}

For each match search for:
1. Referee's avg cards/game and foul rate in this tournament
2. Current group standings and qualification scenarios  
3. Any late injury news or lineup changes
4. Best available odds across FanDuel, DraftKings, BetMGM, Bet365, Fanatics
5. Each team's stats from their previous WC match (shots, corners, cards, possession)
6. Any fatigue concerns — days since last match, travel distance

Apply the full analytical framework. Return only the JSON array.`
    }],
  });

  const text = (response.content || []).map(i => i.type === "text" ? i.text : "").join("");
  const clean = text.replace(/```json|```/g, "").trim();
  const match = clean.match(/\[[\s\S]*\]/);
  if (!match) throw new Error("No JSON in response");
  return JSON.parse(match[0]);
}

export default async function handler(req, res) {
  const { secret, date, force } = req.query;
  if (secret !== process.env.CRON_SECRET) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const dateKey = date || todayKeyET();

  // Check if picks exist unless force=true
  if (force !== 'true') {
    const existing = await redis.get(`picks:${dateKey}`);
    if (existing) {
      return res.status(200).json({ skipped: true, reason: "Picks already exist. Add ?force=true to overwrite." });
    }
  }

  // Build match list from schedule in cron file
  // For the admin endpoint we use web search to find today's matches
  try {
    const lineupData = await fetchLineupsForDate(dateKey);

    // Build matches from lineup data or use web search
    const fixtureKeys = Object.keys(lineupData);
    let matches = [];

    if (fixtureKeys.length) {
      matches = fixtureKeys.map(key => {
        const [home, away] = key.split('|');
        const l = lineupData[key];
        return { home, away, kickoff_et: "TBD", venue: "See lineup data", stage: "World Cup 2026" };
      });
    }

    // Always use Claude with web search to get full match list
    const picks = await generatePicksWithContext(
      matches.length ? matches : [{ home: "TBD", away: "TBD", kickoff_et: "TBD", venue: "TBD", stage: "World Cup 2026" }],
      lineupData,
      dateKey
    );

    await redis.set(`picks:${dateKey}`, JSON.stringify(picks), { ex: 60 * 60 * 36 });

    return res.status(200).json({
      success: true,
      date: dateKey,
      matches: picks.length,
      lineups_fetched: fixtureKeys.length,
      picks,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

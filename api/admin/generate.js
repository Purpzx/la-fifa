import Anthropic from "@anthropic-ai/sdk";
import { Redis } from "@upstash/redis";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const redis = new Redis({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
});

function todayKeyET() {
  const now = new Date();
  const et = new Date(now.toLocaleString("en-US", { timeZone: "America/New_York" }));
  const y = et.getFullYear();
  const m = String(et.getMonth() + 1).padStart(2, "0");
  const d = String(et.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function matchKey(dateKey, home, away) {
  return `picks:${dateKey}:${home.replace(/\s/g,'-')}:${away.replace(/\s/g,'-')}`;
}

const SCHEDULE = {
  "2026-06-11":[{home:"Mexico",away:"South Africa",kickoff_et:"15:00",venue:"Estadio Azteca, Mexico City",stage:"Group A"},{home:"South Korea",away:"Czechia",kickoff_et:"22:00",venue:"Estadio Akron, Zapopan",stage:"Group A"}],
  "2026-06-12":[{home:"Canada",away:"Bosnia & Herzegovina",kickoff_et:"15:00",venue:"BMO Field, Toronto",stage:"Group B"},{home:"USA",away:"Paraguay",kickoff_et:"21:00",venue:"SoFi Stadium, Inglewood",stage:"Group D"}],
  "2026-06-13":[{home:"Qatar",away:"Switzerland",kickoff_et:"15:00",venue:"Levi's Stadium, Santa Clara",stage:"Group B"},{home:"Brazil",away:"Morocco",kickoff_et:"18:00",venue:"MetLife Stadium, East Rutherford",stage:"Group C"},{home:"Haiti",away:"Scotland",kickoff_et:"21:00",venue:"Gillette Stadium, Foxborough",stage:"Group C"}],
  "2026-06-14":[{home:"Australia",away:"Türkiye",kickoff_et:"00:00",venue:"BC Place, Vancouver",stage:"Group D"},{home:"Germany",away:"Curaçao",kickoff_et:"13:00",venue:"NRG Stadium, Houston",stage:"Group E"},{home:"Netherlands",away:"Japan",kickoff_et:"16:00",venue:"AT&T Stadium, Arlington",stage:"Group F"},{home:"Ivory Coast",away:"Ecuador",kickoff_et:"19:00",venue:"Lincoln Financial Field, Philadelphia",stage:"Group E"},{home:"Sweden",away:"Tunisia",kickoff_et:"22:00",venue:"Estadio BBVA, Monterrey",stage:"Group F"}],
  "2026-06-15":[{home:"Spain",away:"Cape Verde",kickoff_et:"12:00",venue:"Mercedes-Benz Stadium, Atlanta",stage:"Group H"},{home:"Belgium",away:"Egypt",kickoff_et:"15:00",venue:"Lumen Field, Seattle",stage:"Group G"},{home:"Saudi Arabia",away:"Uruguay",kickoff_et:"18:00",venue:"Hard Rock Stadium, Miami Gardens",stage:"Group H"},{home:"Iran",away:"New Zealand",kickoff_et:"21:00",venue:"SoFi Stadium, Inglewood",stage:"Group G"}],
  "2026-06-16":[{home:"France",away:"Senegal",kickoff_et:"15:00",venue:"MetLife Stadium, East Rutherford",stage:"Group I"},{home:"Iraq",away:"Norway",kickoff_et:"18:00",venue:"Gillette Stadium, Foxborough",stage:"Group I"},{home:"Argentina",away:"Algeria",kickoff_et:"21:00",venue:"Arrowhead Stadium, Kansas City",stage:"Group J"}],
  "2026-06-17":[{home:"Austria",away:"Jordan",kickoff_et:"00:00",venue:"Levi's Stadium, Santa Clara",stage:"Group J"},{home:"Portugal",away:"DR Congo",kickoff_et:"13:00",venue:"NRG Stadium, Houston",stage:"Group K"},{home:"England",away:"Croatia",kickoff_et:"16:00",venue:"AT&T Stadium, Arlington",stage:"Group L"},{home:"Ghana",away:"Panama",kickoff_et:"19:00",venue:"BMO Field, Toronto",stage:"Group L"},{home:"Uzbekistan",away:"Colombia",kickoff_et:"22:00",venue:"Estadio Azteca, Mexico City",stage:"Group K"}],
  "2026-06-18":[{home:"Czechia",away:"South Africa",kickoff_et:"12:00",venue:"Mercedes-Benz Stadium, Atlanta",stage:"Group A"},{home:"Switzerland",away:"Bosnia & Herzegovina",kickoff_et:"15:00",venue:"SoFi Stadium, Inglewood",stage:"Group B"},{home:"Canada",away:"Qatar",kickoff_et:"18:00",venue:"BC Place, Vancouver",stage:"Group B"},{home:"Mexico",away:"South Korea",kickoff_et:"21:00",venue:"Estadio Akron, Zapopan",stage:"Group A"}],
  "2026-06-19":[{home:"USA",away:"Australia",kickoff_et:"15:00",venue:"Lumen Field, Seattle",stage:"Group D"},{home:"Scotland",away:"Morocco",kickoff_et:"18:00",venue:"Gillette Stadium, Foxborough",stage:"Group C"},{home:"Brazil",away:"Haiti",kickoff_et:"20:30",venue:"Lincoln Financial Field, Philadelphia",stage:"Group C"},{home:"Türkiye",away:"Paraguay",kickoff_et:"23:00",venue:"Levi's Stadium, Santa Clara",stage:"Group D"}],
  "2026-06-20":[{home:"Netherlands",away:"Sweden",kickoff_et:"13:00",venue:"NRG Stadium, Houston",stage:"Group F"},{home:"Germany",away:"Ivory Coast",kickoff_et:"16:00",venue:"BMO Field, Toronto",stage:"Group E"},{home:"Ecuador",away:"Curaçao",kickoff_et:"20:00",venue:"Arrowhead Stadium, Kansas City",stage:"Group E"}],
  "2026-06-21":[{home:"Tunisia",away:"Japan",kickoff_et:"00:00",venue:"Estadio BBVA, Monterrey",stage:"Group F"},{home:"Spain",away:"Saudi Arabia",kickoff_et:"12:00",venue:"Mercedes-Benz Stadium, Atlanta",stage:"Group H"},{home:"Belgium",away:"Iran",kickoff_et:"15:00",venue:"SoFi Stadium, Inglewood",stage:"Group G"},{home:"Uruguay",away:"Cape Verde",kickoff_et:"18:00",venue:"Hard Rock Stadium, Miami Gardens",stage:"Group H"},{home:"New Zealand",away:"Egypt",kickoff_et:"21:00",venue:"BC Place, Vancouver",stage:"Group G"}],
  "2026-06-22":[{home:"Argentina",away:"Austria",kickoff_et:"13:00",venue:"AT&T Stadium, Arlington",stage:"Group J"},{home:"France",away:"Iraq",kickoff_et:"17:00",venue:"Lincoln Financial Field, Philadelphia",stage:"Group I"},{home:"Norway",away:"Senegal",kickoff_et:"20:00",venue:"MetLife Stadium, East Rutherford",stage:"Group I"},{home:"Jordan",away:"Algeria",kickoff_et:"23:00",venue:"Levi's Stadium, Santa Clara",stage:"Group J"}],
  "2026-06-23":[{home:"Portugal",away:"Uzbekistan",kickoff_et:"13:00",venue:"NRG Stadium, Houston",stage:"Group K"},{home:"England",away:"Ghana",kickoff_et:"16:00",venue:"Gillette Stadium, Foxborough",stage:"Group L"},{home:"Panama",away:"Croatia",kickoff_et:"19:00",venue:"BMO Field, Toronto",stage:"Group L"},{home:"Colombia",away:"DR Congo",kickoff_et:"22:00",venue:"Estadio Akron, Zapopan",stage:"Group K"}],
  "2026-06-24":[{home:"Switzerland",away:"Canada",kickoff_et:"15:00",venue:"BC Place, Vancouver",stage:"Group B"},{home:"Bosnia & Herzegovina",away:"Qatar",kickoff_et:"15:00",venue:"Lumen Field, Seattle",stage:"Group B"},{home:"Scotland",away:"Brazil",kickoff_et:"18:00",venue:"Hard Rock Stadium, Miami Gardens",stage:"Group C"},{home:"Morocco",away:"Haiti",kickoff_et:"18:00",venue:"Mercedes-Benz Stadium, Atlanta",stage:"Group C"},{home:"Czechia",away:"Mexico",kickoff_et:"21:00",venue:"Estadio Azteca, Mexico City",stage:"Group A"},{home:"South Africa",away:"South Korea",kickoff_et:"21:00",venue:"Estadio BBVA, Monterrey",stage:"Group A"}],
  "2026-06-25":[{home:"Curaçao",away:"Ivory Coast",kickoff_et:"16:00",venue:"Lincoln Financial Field, Philadelphia",stage:"Group E"},{home:"Ecuador",away:"Germany",kickoff_et:"16:00",venue:"MetLife Stadium, East Rutherford",stage:"Group E"},{home:"Japan",away:"Sweden",kickoff_et:"19:00",venue:"AT&T Stadium, Arlington",stage:"Group F"},{home:"Tunisia",away:"Netherlands",kickoff_et:"19:00",venue:"Arrowhead Stadium, Kansas City",stage:"Group F"},{home:"Türkiye",away:"USA",kickoff_et:"22:00",venue:"SoFi Stadium, Inglewood",stage:"Group D"},{home:"Paraguay",away:"Australia",kickoff_et:"22:00",venue:"Levi's Stadium, Santa Clara",stage:"Group D"}],
  "2026-06-26":[{home:"Norway",away:"France",kickoff_et:"15:00",venue:"Gillette Stadium, Foxborough",stage:"Group I"},{home:"Senegal",away:"Iraq",kickoff_et:"15:00",venue:"BMO Field, Toronto",stage:"Group I"},{home:"Cape Verde",away:"Saudi Arabia",kickoff_et:"20:00",venue:"NRG Stadium, Houston",stage:"Group H"},{home:"Uruguay",away:"Spain",kickoff_et:"20:00",venue:"Estadio Akron, Zapopan",stage:"Group H"},{home:"Egypt",away:"Iran",kickoff_et:"23:00",venue:"Lumen Field, Seattle",stage:"Group G"},{home:"New Zealand",away:"Belgium",kickoff_et:"23:00",venue:"BC Place, Vancouver",stage:"Group G"}],
  "2026-06-27":[{home:"Panama",away:"England",kickoff_et:"17:00",venue:"MetLife Stadium, East Rutherford",stage:"Group L"},{home:"Croatia",away:"Ghana",kickoff_et:"17:00",venue:"Lincoln Financial Field, Philadelphia",stage:"Group L"},{home:"Colombia",away:"Portugal",kickoff_et:"19:30",venue:"Hard Rock Stadium, Miami Gardens",stage:"Group K"},{home:"DR Congo",away:"Uzbekistan",kickoff_et:"19:30",venue:"Mercedes-Benz Stadium, Atlanta",stage:"Group K"},{home:"Algeria",away:"Austria",kickoff_et:"22:00",venue:"Arrowhead Stadium, Kansas City",stage:"Group J"},{home:"Jordan",away:"Argentina",kickoff_et:"22:00",venue:"AT&T Stadium, Arlington",stage:"Group J"}],
  "2026-06-28":[{home:"TBD",away:"TBD",kickoff_et:"15:00",venue:"TBD",stage:"Round of 32"}],
  "2026-06-29":[{home:"TBD",away:"TBD",kickoff_et:"13:00",venue:"NRG Stadium, Houston",stage:"Round of 32"},{home:"TBD",away:"TBD",kickoff_et:"16:30",venue:"Gillette Stadium, Foxborough",stage:"Round of 32"},{home:"TBD",away:"TBD",kickoff_et:"21:00",venue:"Estadio BBVA, Monterrey",stage:"Round of 32"}],
  "2026-06-30":[{home:"TBD",away:"TBD",kickoff_et:"13:00",venue:"AT&T Stadium, Arlington",stage:"Round of 32"},{home:"TBD",away:"TBD",kickoff_et:"17:00",venue:"MetLife Stadium, East Rutherford",stage:"Round of 32"},{home:"TBD",away:"TBD",kickoff_et:"21:00",venue:"Estadio Azteca, Mexico City",stage:"Round of 32"}],
  "2026-07-01":[{home:"TBD",away:"TBD",kickoff_et:"12:00",venue:"Mercedes-Benz Stadium, Atlanta",stage:"Round of 32"},{home:"TBD",away:"TBD",kickoff_et:"16:00",venue:"Lumen Field, Seattle",stage:"Round of 32"},{home:"TBD",away:"TBD",kickoff_et:"20:00",venue:"Levi's Stadium, Santa Clara",stage:"Round of 32"}],
  "2026-07-02":[{home:"TBD",away:"TBD",kickoff_et:"15:00",venue:"SoFi Stadium, Inglewood",stage:"Round of 32"},{home:"TBD",away:"TBD",kickoff_et:"19:00",venue:"BMO Field, Toronto",stage:"Round of 32"},{home:"TBD",away:"TBD",kickoff_et:"23:00",venue:"BC Place, Vancouver",stage:"Round of 32"}],
  "2026-07-03":[{home:"TBD",away:"TBD",kickoff_et:"14:00",venue:"AT&T Stadium, Arlington",stage:"Round of 32"},{home:"TBD",away:"TBD",kickoff_et:"18:00",venue:"Hard Rock Stadium, Miami Gardens",stage:"Round of 32"},{home:"TBD",away:"TBD",kickoff_et:"21:30",venue:"Arrowhead Stadium, Kansas City",stage:"Round of 32"}],
  "2026-07-04":[{home:"TBD",away:"TBD",kickoff_et:"13:00",venue:"NRG Stadium, Houston",stage:"Round of 16"},{home:"TBD",away:"TBD",kickoff_et:"17:00",venue:"Lincoln Financial Field, Philadelphia",stage:"Round of 16"}],
  "2026-07-05":[{home:"TBD",away:"TBD",kickoff_et:"16:00",venue:"MetLife Stadium, East Rutherford",stage:"Round of 16"},{home:"TBD",away:"TBD",kickoff_et:"20:00",venue:"Estadio Azteca, Mexico City",stage:"Round of 16"}],
  "2026-07-06":[{home:"TBD",away:"TBD",kickoff_et:"15:00",venue:"AT&T Stadium, Arlington",stage:"Round of 16"},{home:"TBD",away:"TBD",kickoff_et:"20:00",venue:"Lumen Field, Seattle",stage:"Round of 16"}],
  "2026-07-07":[{home:"TBD",away:"TBD",kickoff_et:"12:00",venue:"Mercedes-Benz Stadium, Atlanta",stage:"Round of 16"},{home:"TBD",away:"TBD",kickoff_et:"16:00",venue:"BC Place, Vancouver",stage:"Round of 16"}],
  "2026-07-09":[{home:"TBD",away:"TBD",kickoff_et:"16:00",venue:"Gillette Stadium, Foxborough",stage:"Quarterfinal"}],
  "2026-07-10":[{home:"TBD",away:"TBD",kickoff_et:"15:00",venue:"SoFi Stadium, Inglewood",stage:"Quarterfinal"}],
  "2026-07-11":[{home:"TBD",away:"TBD",kickoff_et:"17:00",venue:"Hard Rock Stadium, Miami Gardens",stage:"Quarterfinal"},{home:"TBD",away:"TBD",kickoff_et:"21:00",venue:"Arrowhead Stadium, Kansas City",stage:"Quarterfinal"}],
  "2026-07-14":[{home:"TBD",away:"TBD",kickoff_et:"15:00",venue:"AT&T Stadium, Arlington",stage:"Semifinal"}],
  "2026-07-15":[{home:"TBD",away:"TBD",kickoff_et:"15:00",venue:"Mercedes-Benz Stadium, Atlanta",stage:"Semifinal"}],
  "2026-07-18":[{home:"TBD",away:"TBD",kickoff_et:"17:00",venue:"Hard Rock Stadium, Miami Gardens",stage:"Third Place"}],
  "2026-07-19":[{home:"TBD",away:"TBD",kickoff_et:"15:00",venue:"MetLife Stadium, East Rutherford, NJ",stage:"Final"}],
};

const STADIUM_INFO = {
  "Lumen Field, Seattle":{outdoor:true,notes:"Wind/rain suppresses scoring"},
  "MetLife Stadium, East Rutherford":{outdoor:true,notes:"Open-air NJ, wind affects wide play"},
  "Gillette Stadium, Foxborough":{outdoor:true,notes:"New England weather, can be windy"},
  "BMO Field, Toronto":{outdoor:true,notes:"Open air, variable weather"},
  "BC Place, Vancouver":{outdoor:false,notes:"Retractable roof, controlled"},
  "NRG Stadium, Houston":{outdoor:false,notes:"Domed, neutral conditions"},
  "AT&T Stadium, Arlington":{outdoor:false,notes:"Domed, neutral conditions"},
  "Mercedes-Benz Stadium, Atlanta":{outdoor:false,notes:"Retractable roof, controlled"},
  "SoFi Stadium, Inglewood":{outdoor:false,notes:"Covered, mild LA weather"},
  "Hard Rock Stadium, Miami Gardens":{outdoor:true,notes:"Open air, hot and humid"},
  "Arrowhead Stadium, Kansas City":{outdoor:true,notes:"Open air, variable midwest weather"},
  "Lincoln Financial Field, Philadelphia":{outdoor:true,notes:"Open air Philadelphia"},
  "Estadio Azteca, Mexico City":{outdoor:true,notes:"HIGH ALTITUDE 2240m — suppresses tempo"},
  "Estadio Akron, Zapopan":{outdoor:true,notes:"High altitude, warm"},
  "Estadio BBVA, Monterrey":{outdoor:true,notes:"Extreme summer heat"},
  "Levi's Stadium, Santa Clara":{outdoor:true,notes:"Open air, mild Bay Area"},
};

function getTournamentContext(stage) {
  if(stage.includes("Group")) return "GROUP STAGE: Check standings — teams already through may rotate. Teams needing result play open = more cards/corners/shots.";
  if(stage.includes("Round of 32")||stage.includes("Round of 16")) return "KNOCKOUT: No rotation, best XI plays. High intensity, tactical fouling = more cards. Extra time possible.";
  if(stage.includes("Quarterfinal")) return "QUARTERFINAL: Elite teams, cautious starts. Cards valuable as teams foul to disrupt.";
  if(stage.includes("Semifinal")) return "SEMIFINAL: Maximum pressure, ultra-disciplined. Low scoring expected. Under props gain value.";
  if(stage.includes("Final")) return "FINAL: Ultra cautious. Under total goals has value.";
  if(stage.includes("Third")) return "THIRD PLACE: Deflated teams play without pressure = high scoring. Over/BTTS gain value.";
  return "";
}

async function fetchLineupForMatch(match, dateKey) {
  const apiKey = process.env.API_FOOTBALL_KEY;
  try {
    const res = await fetch(
      `https://v3.football.api-sports.io/fixtures?date=${dateKey}`,
      {headers:{"x-apisports-key":apiKey}}
    );
    const data = await res.json();
    const normalize = s => s?.toLowerCase().replace(/[^a-z]/g,'') || '';
    const fixture = (data.response || []).find(f => {
      const name = f.league?.name?.toLowerCase() || '';
      if(!name.includes('world cup') && !name.includes('fifa') && f.league?.id !== 1) return false;
      const fh = normalize(f.teams?.home?.name);
      const mh = normalize(match.home);
      return fh.includes(mh.slice(0,4)) || mh.includes(fh.slice(0,4));
    });
    if(!fixture) return null;
    const fixtureId = fixture.fixture?.id;
    const [lineupRes, detailRes] = await Promise.all([
      fetch(`https://v3.football.api-sports.io/fixtures/lineups?fixture=${fixtureId}`,
        {headers:{"x-apisports-key":apiKey}}),
      fetch(`https://v3.football.api-sports.io/fixtures?id=${fixtureId}`,
        {headers:{"x-apisports-key":apiKey}}),
    ]);
    const [lineupJson, detailJson] = await Promise.all([lineupRes.json(), detailRes.json()]);
    const lineups = lineupJson.response || [];
    const referee = detailJson.response?.[0]?.fixture?.referee || 'Unknown';
    if(lineups.length < 2) return null;
    const fmt = l => ({
      starters: (l.startXI||[]).map(p=>`${p.player?.name} (${p.player?.pos})`).filter(Boolean),
      formation: l.formation || 'Unknown',
      coach: l.coach?.name || 'Unknown',
    });
    return {home:fmt(lineups[0]), away:fmt(lineups[1]), referee, confirmed:true};
  } catch(e) { return null; }
}

async function generatePickForMatch(match, lineup) {
  const stadium = STADIUM_INFO[match.venue] || {outdoor:true,notes:"Open air"};
  const context = getTournamentContext(match.stage);
  const lineupText = lineup
    ? `✅ CONFIRMED LINEUPS:
HOME ${match.home} (${lineup.home.formation}): ${lineup.home.starters.join(', ')}
AWAY ${match.away} (${lineup.away.formation}): ${lineup.away.starters.join(', ')}
REFEREE: ${lineup.referee} — search avg cards/game this tournament`
    : `⚠️ LINEUPS NOT CONFIRMED — search for expected XI and injuries`;

  const systemPrompt = `You are an elite World Cup 2026 betting analyst targeting an 80% hit rate. You think like a professional sharp bettor — precision over volume, value over action.

MISSION: Find the 4 absolute best props for this match. Not 2 of each type — just the 4 sharpest bets available, from any category. Quality over format.

ODDS REQUIREMENT: Only pick props with odds between -175 and +175. This is the value zone — avoid heavy favorites and longshots.

ANALYTICAL FRAMEWORK:
- Referee: search avg cards/game → if low card ref, skip card props entirely
- Formation matchup: does this setup structurally produce corners? shots? fouls?
- Tournament stage context: apply it — rotation, desperation, caution all change prop values
- Stadium/altitude: outdoor windy = suppress corners; altitude = suppress tempo
- Motivation: who NEEDS this result? Changes the game style completely
- Line value: is this prop mispriced? Compare your true probability to the implied odds
- Recent WC form: how did each team play their last match — shots, corners, cards, intensity?

PROP TYPES AVAILABLE (pick the best 4 from anywhere):
Player: shots on target, shots total, passes, key passes, tackles, fouls committed, yellow cards, saves, crosses, assists
Game: total corners, total cards, BTTS, total goals, Asian handicap, result
Team: team corners, clean sheet, team total shots, first corner, team cards, to win either half

HIGH HIT RATE PROPS (prioritize when matchup supports):
- Team corners over low line (5.5-7.5) for wide-formation teams vs deep block
- Clean sheet for dominant team vs weak attack
- Total cards over low line when desperate team meets card-happy referee
- Shots on target over 1.5 for elite attackers vs weak defense
- BTTS No when one team is defensively elite and other struggles to score

Return ONLY valid JSON for ONE match — no markdown:
{
  "home": "",
  "away": "",
  "kickoff": "",
  "venue": "",
  "stage": "",
  "picks": [
    {
      "category": "player|game|team",
      "title": "Description of pick",
      "line": "Over X -115",
      "reasoning": "3 sentences: specific data point + matchup edge + why odds are value between -175/+175",
      "book": "fanduel|draftkings|betmgm|bet365|fanatics",
      "edge": "+X% Edge",
      "confidence": 4
    }
  ]
}

STRICT RULES:
- Exactly 4 picks total
- ALL odds between -175 and +175
- Minimum confidence 4
- No goalscorer props ever
- Only player props for confirmed starters
- reasoning must cite a specific number or stat
- Best book across all 5`;

  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 2000,
    tools: [{type:"web_search_20250305",name:"web_search"}],
    system: systemPrompt,
    messages: [{
      role: "user",
      content: `${match.home} vs ${match.away} | ${match.kickoff_et} ET | ${match.venue} (${stadium.outdoor?'OUTDOOR':'INDOOR'}: ${stadium.notes}) | ${match.stage}
${context}
${lineupText}

Search for: referee avg cards/game this tournament, group standings + qualification scenarios, injury/lineup news, best odds across FanDuel DraftKings BetMGM Bet365 Fanatics, both teams last WC match stats. Find the 4 sharpest props. Return JSON only.`
    }],
  });

  const text = (response.content||[]).map(i=>i.type==="text"?i.text:"").join("");
  const clean = text.replace(/```json|```/g,"").trim();
  const jsonMatch = clean.match(/\{[\s\S]*\}/);
  if(!jsonMatch) throw new Error("No valid JSON");
  const parsed = JSON.parse(jsonMatch[0]);

  // Normalize to frontend-compatible format
  if(parsed.picks && !parsed.player_props) {
    parsed.player_props = parsed.picks.filter(p=>p.category==='player');
    parsed.game_props = parsed.picks.filter(p=>p.category==='game');
    parsed.team_props = parsed.picks.filter(p=>p.category==='team');
  }
  return parsed;
}

export default async function handler(req, res) {
  const { secret, date, force } = req.query;
  if(secret !== process.env.CRON_SECRET) {
    return res.status(401).json({error:"Unauthorized"});
  }

  const dateKey = date || todayKeyET();
  const matches = SCHEDULE[dateKey] || [];

  const debug = {
    computed_today: todayKeyET(),
    using_date: dateKey,
    matches_found: matches.length,
  };

  if(!matches.length) {
    return res.status(200).json({skipped:true, reason:`No matches for ${dateKey}`, debug});
  }

  const results = [];

  for(const match of matches) {
    if(match.home === 'TBD') {
      results.push({match:"TBD vs TBD", skipped:true, reason:"TBD match"});
      continue;
    }

    const key = matchKey(dateKey, match.home, match.away);

    if(force !== 'true') {
      const existing = await redis.get(key);
      if(existing) {
        results.push({match:`${match.home} vs ${match.away}`, skipped:true, reason:"Already exists. Add &force=true to overwrite."});
        continue;
      }
    }

    try {
      const lineup = await fetchLineupForMatch(match, dateKey);
      const pick = await generatePickForMatch(match, lineup);
      await redis.set(key, JSON.stringify(pick), {ex:60*60*36});
      results.push({match:`${match.home} vs ${match.away}`, success:true, lineup_confirmed:!!lineup});
    } catch(err) {
      results.push({match:`${match.home} vs ${match.away}`, error:err.message});
    }
  }

  return res.status(200).json({date:dateKey, debug, results});
}

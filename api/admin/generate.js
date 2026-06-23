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

function matchKey(dateKey, home, away) {
  return `picks:${dateKey}:${home.replace(/\s/g,"-")}:${away.replace(/\s/g,"-")}`;
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
  if(stage.includes("Group")) return "GROUP STAGE: Check standings — rotation likely for qualified teams. Desperate teams play open = more cards/corners/shots.";
  if(stage.includes("Round of 32")||stage.includes("Round of 16")) return "KNOCKOUT: Best XI always plays. High intensity, tactical fouling = more cards. Extra time possible.";
  if(stage.includes("Quarterfinal")) return "QUARTERFINAL: Cautious starts, foul-heavy midfields. Card props valuable.";
  if(stage.includes("Semifinal")) return "SEMIFINAL: Ultra-disciplined, low scoring. Under props gain value.";
  if(stage.includes("Final")) return "FINAL: Ultra cautious. Under goals has value.";
  if(stage.includes("Third")) return "THIRD PLACE: Open, high scoring. Over/BTTS gain value.";
  return "";
}

async function fetchLineupForMatch(match, dateKey) {
  const apiKey = process.env.API_FOOTBALL_KEY;

  const cacheKey = `lineup:${dateKey}:${match.home}`;
  try {
    const cached = await redis.get(cacheKey);
    if(cached) return typeof cached === "string" ? JSON.parse(cached) : cached;
  } catch(e) {}

  try {
    const res = await fetch(
      `https://v3.football.api-sports.io/fixtures?date=${dateKey}`,
      {headers:{"x-apisports-key":apiKey}}
    );
    const data = await res.json();
    const norm = s => s?.toLowerCase().replace(/[^a-z]/g,"") || "";
    const fixture = (data.response||[]).find(f => {
      const name = f.league?.name?.toLowerCase() || "";
      if(!name.includes("world cup") && !name.includes("fifa") && f.league?.id !== 1) return false;
      const fh = norm(f.teams?.home?.name);
      const mh = norm(match.home);
      return fh.includes(mh.slice(0,4)) || mh.includes(fh.slice(0,4));
    });
    if(!fixture) return null;

    const fid = fixture.fixture?.id;
    const [lr, dr] = await Promise.all([
      fetch(`https://v3.football.api-sports.io/fixtures/lineups?fixture=${fid}`, {headers:{"x-apisports-key":apiKey}}),
      fetch(`https://v3.football.api-sports.io/fixtures?id=${fid}`, {headers:{"x-apisports-key":apiKey}}),
    ]);
    const [lj, dj] = await Promise.all([lr.json(), dr.json()]);
    const lineups = lj.response || [];
    const referee = dj.response?.[0]?.fixture?.referee || "Unknown";
    if(lineups.length < 2) return null;

    const fmt = l => ({
      starters: (l.startXI||[]).map(p=>`${p.player?.name} (${p.player?.pos})`).filter(Boolean),
      formation: l.formation || "Unknown",
      coach: l.coach?.name || "Unknown",
    });
    const result = {home:fmt(lineups[0]), away:fmt(lineups[1]), referee, confirmed:true};

    await redis.set(cacheKey, JSON.stringify(result), {ex:60*60*2});
    return result;
  } catch(e) { return null; }
}

// Static system prompt — cached by Anthropic so you only pay for it once
const SYSTEM_PROMPT = `You are an expert World Cup 2026 sports betting analyst. You generate exactly 4 sharp, data-driven prop picks per match in valid JSON only. No preamble, no explanation outside the JSON.

Rules:
- Exactly 4 picks total across player/game/team categories
- Odds range: -175 to +175 only
- Confidence 4+ only
- No goalscorer props
- Only confirmed starters for player props
- Cite specific stats in reasoning (2 sentences max)
- Return ONLY valid JSON, no markdown fences`;

async function generatePickForMatch(match, lineup) {
  const stadium = STADIUM_INFO[match.venue] || {outdoor:true, notes:"Open air"};
  const context = getTournamentContext(match.stage);
  const lineupText = lineup
    ? `LINEUPS CONFIRMED:
HOME ${match.home} (${lineup.home.formation}): ${lineup.home.starters.join(", ")}
AWAY ${match.away} (${lineup.away.formation}): ${lineup.away.starters.join(", ")}
REFEREE: ${lineup.referee}`
    : `LINEUPS NOT CONFIRMED — search expected XI and injuries`;

  const userPrompt = `WC 2026: ${match.home} vs ${match.away} | ${match.kickoff_et} ET | ${match.venue} (${stadium.outdoor?"OUTDOOR":"INDOOR"}: ${stadium.notes}) | ${match.stage}
${context}
${lineupText}

Search for: 1) referee avg cards/game this tournament 2) group standings + who needs result 3) injury/lineup news 4) best odds FanDuel/DraftKings/BetMGM/Bet365/Fanatics 5) both teams last WC match stats

Return ONLY this JSON:
{"home":"${match.home}","away":"${match.away}","kickoff":"${match.kickoff_et} ET","venue":"${match.venue}","stage":"${match.stage}","picks":[{"category":"player|game|team","title":"pick description","line":"Over X -115","reasoning":"2 sentences: stat + edge","book":"fanduel|draftkings|betmgm|bet365|fanatics","edge":"+X% Edge","confidence":4}]}`;

  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 800,
    system: [
      {
        type: "text",
        text: SYSTEM_PROMPT,
        cache_control: { type: "ephemeral" }, // Cache the system prompt — only charged once per 5 mins
      }
    ],
    tools: [
      {
        type: "web_search_20250305",
        name: "web_search",
        max_uses: 3, // Cap searches at 3 instead of unlimited
      }
    ],
    messages: [{role:"user", content: userPrompt}],
  });

  const text = (response.content||[]).map(i=>i.type==="text"?i.text:"").join("");
  const clean = text.replace(/```json|```/g,"").trim();
  const jsonMatch = clean.match(/\{[\s\S]*\}/);
  if(!jsonMatch) throw new Error("No valid JSON");
  const parsed = JSON.parse(jsonMatch[0]);

  if(parsed.picks && !parsed.player_props) {
    parsed.player_props = parsed.picks.filter(p=>p.category==="player");
    parsed.game_props = parsed.picks.filter(p=>p.category==="game");
    parsed.team_props = parsed.picks.filter(p=>p.category==="team");
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
  const debug = { computed_today: todayKeyET(), using_date: dateKey, matches_found: matches.length };

  if(!matches.length) {
    return res.status(200).json({skipped:true, reason:`No matches for ${dateKey}`, debug});
  }

  const results = [];
  for(const match of matches) {
    if(match.home === "TBD") {
      results.push({match:"TBD vs TBD", skipped:true, reason:"TBD match"});
      continue;
    }

    const key = matchKey(dateKey, match.home, match.away);
    if(force !== "true") {
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

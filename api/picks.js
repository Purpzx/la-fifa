import { Redis } from "@upstash/redis";

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

function matchKey(dateKey, home, away) {
  return `picks:${dateKey}:${home.replace(/\s/g,'-')}:${away.replace(/\s/g,'-')}`;
}

const SCHEDULE = {
  "2026-06-11":[
    {home:"Mexico",away:"South Africa",kickoff_et:"15:00",venue:"Estadio Azteca, Mexico City",stage:"Group A"},
    {home:"South Korea",away:"Czechia",kickoff_et:"22:00",venue:"Estadio Akron, Zapopan",stage:"Group A"},
  ],
  "2026-06-12":[
    {home:"Canada",away:"Bosnia & Herzegovina",kickoff_et:"15:00",venue:"BMO Field, Toronto",stage:"Group B"},
    {home:"USA",away:"Paraguay",kickoff_et:"21:00",venue:"SoFi Stadium, Inglewood",stage:"Group D"},
  ],
  "2026-06-13":[
    {home:"Qatar",away:"Switzerland",kickoff_et:"15:00",venue:"Levi's Stadium, Santa Clara",stage:"Group B"},
    {home:"Brazil",away:"Morocco",kickoff_et:"18:00",venue:"MetLife Stadium, East Rutherford",stage:"Group C"},
    {home:"Haiti",away:"Scotland",kickoff_et:"21:00",venue:"Gillette Stadium, Foxborough",stage:"Group C"},
  ],
  "2026-06-14":[
    {home:"Australia",away:"Türkiye",kickoff_et:"00:00",venue:"BC Place, Vancouver",stage:"Group D"},
    {home:"Germany",away:"Curaçao",kickoff_et:"13:00",venue:"NRG Stadium, Houston",stage:"Group E"},
    {home:"Netherlands",away:"Japan",kickoff_et:"16:00",venue:"AT&T Stadium, Arlington",stage:"Group F"},
    {home:"Ivory Coast",away:"Ecuador",kickoff_et:"19:00",venue:"Lincoln Financial Field, Philadelphia",stage:"Group E"},
    {home:"Sweden",away:"Tunisia",kickoff_et:"22:00",venue:"Estadio BBVA, Monterrey",stage:"Group F"},
  ],
  "2026-06-15":[
    {home:"Spain",away:"Cape Verde",kickoff_et:"12:00",venue:"Mercedes-Benz Stadium, Atlanta",stage:"Group H"},
    {home:"Belgium",away:"Egypt",kickoff_et:"15:00",venue:"Lumen Field, Seattle",stage:"Group G"},
    {home:"Saudi Arabia",away:"Uruguay",kickoff_et:"18:00",venue:"Hard Rock Stadium, Miami Gardens",stage:"Group H"},
    {home:"Iran",away:"New Zealand",kickoff_et:"21:00",venue:"SoFi Stadium, Inglewood",stage:"Group G"},
  ],
  "2026-06-16":[
    {home:"France",away:"Senegal",kickoff_et:"15:00",venue:"MetLife Stadium, East Rutherford",stage:"Group I"},
    {home:"Iraq",away:"Norway",kickoff_et:"18:00",venue:"Gillette Stadium, Foxborough",stage:"Group I"},
    {home:"Argentina",away:"Algeria",kickoff_et:"21:00",venue:"Arrowhead Stadium, Kansas City",stage:"Group J"},
  ],
  "2026-06-17":[
    {home:"Austria",away:"Jordan",kickoff_et:"00:00",venue:"Levi's Stadium, Santa Clara",stage:"Group J"},
    {home:"Portugal",away:"DR Congo",kickoff_et:"13:00",venue:"NRG Stadium, Houston",stage:"Group K"},
    {home:"England",away:"Croatia",kickoff_et:"16:00",venue:"AT&T Stadium, Arlington",stage:"Group L"},
    {home:"Ghana",away:"Panama",kickoff_et:"19:00",venue:"BMO Field, Toronto",stage:"Group L"},
    {home:"Uzbekistan",away:"Colombia",kickoff_et:"22:00",venue:"Estadio Azteca, Mexico City",stage:"Group K"},
  ],
  "2026-06-18":[
    {home:"Czechia",away:"South Africa",kickoff_et:"12:00",venue:"Mercedes-Benz Stadium, Atlanta",stage:"Group A"},
    {home:"Switzerland",away:"Bosnia & Herzegovina",kickoff_et:"15:00",venue:"SoFi Stadium, Inglewood",stage:"Group B"},
    {home:"Canada",away:"Qatar",kickoff_et:"18:00",venue:"BC Place, Vancouver",stage:"Group B"},
    {home:"Mexico",away:"South Korea",kickoff_et:"21:00",venue:"Estadio Akron, Zapopan",stage:"Group A"},
  ],
  "2026-06-19":[
    {home:"USA",away:"Australia",kickoff_et:"15:00",venue:"Lumen Field, Seattle",stage:"Group D"},
    {home:"Scotland",away:"Morocco",kickoff_et:"18:00",venue:"Gillette Stadium, Foxborough",stage:"Group C"},
    {home:"Brazil",away:"Haiti",kickoff_et:"20:30",venue:"Lincoln Financial Field, Philadelphia",stage:"Group C"},
    {home:"Türkiye",away:"Paraguay",kickoff_et:"23:00",venue:"Levi's Stadium, Santa Clara",stage:"Group D"},
  ],
  "2026-06-20":[
    {home:"Netherlands",away:"Sweden",kickoff_et:"13:00",venue:"NRG Stadium, Houston",stage:"Group F"},
    {home:"Germany",away:"Ivory Coast",kickoff_et:"16:00",venue:"BMO Field, Toronto",stage:"Group E"},
    {home:"Ecuador",away:"Curaçao",kickoff_et:"20:00",venue:"Arrowhead Stadium, Kansas City",stage:"Group E"},
  ],
  "2026-06-21":[
    {home:"Tunisia",away:"Japan",kickoff_et:"00:00",venue:"Estadio BBVA, Monterrey",stage:"Group F"},
    {home:"Spain",away:"Saudi Arabia",kickoff_et:"12:00",venue:"Mercedes-Benz Stadium, Atlanta",stage:"Group H"},
    {home:"Belgium",away:"Iran",kickoff_et:"15:00",venue:"SoFi Stadium, Inglewood",stage:"Group G"},
    {home:"Uruguay",away:"Cape Verde",kickoff_et:"18:00",venue:"Hard Rock Stadium, Miami Gardens",stage:"Group H"},
    {home:"New Zealand",away:"Egypt",kickoff_et:"21:00",venue:"BC Place, Vancouver",stage:"Group G"},
  ],
  "2026-06-22":[
    {home:"Argentina",away:"Austria",kickoff_et:"13:00",venue:"AT&T Stadium, Arlington",stage:"Group J"},
    {home:"France",away:"Iraq",kickoff_et:"17:00",venue:"Lincoln Financial Field, Philadelphia",stage:"Group I"},
    {home:"Norway",away:"Senegal",kickoff_et:"20:00",venue:"MetLife Stadium, East Rutherford",stage:"Group I"},
    {home:"Jordan",away:"Algeria",kickoff_et:"23:00",venue:"Levi's Stadium, Santa Clara",stage:"Group J"},
  ],
  "2026-06-23":[
    {home:"Portugal",away:"Uzbekistan",kickoff_et:"13:00",venue:"NRG Stadium, Houston",stage:"Group K"},
    {home:"England",away:"Ghana",kickoff_et:"16:00",venue:"Gillette Stadium, Foxborough",stage:"Group L"},
    {home:"Panama",away:"Croatia",kickoff_et:"19:00",venue:"BMO Field, Toronto",stage:"Group L"},
    {home:"Colombia",away:"DR Congo",kickoff_et:"22:00",venue:"Estadio Akron, Zapopan",stage:"Group K"},
  ],
  "2026-06-24":[
    {home:"Switzerland",away:"Canada",kickoff_et:"15:00",venue:"BC Place, Vancouver",stage:"Group B"},
    {home:"Bosnia & Herzegovina",away:"Qatar",kickoff_et:"15:00",venue:"Lumen Field, Seattle",stage:"Group B"},
    {home:"Scotland",away:"Brazil",kickoff_et:"18:00",venue:"Hard Rock Stadium, Miami Gardens",stage:"Group C"},
    {home:"Morocco",away:"Haiti",kickoff_et:"18:00",venue:"Mercedes-Benz Stadium, Atlanta",stage:"Group C"},
    {home:"Czechia",away:"Mexico",kickoff_et:"21:00",venue:"Estadio Azteca, Mexico City",stage:"Group A"},
    {home:"South Africa",away:"South Korea",kickoff_et:"21:00",venue:"Estadio BBVA, Monterrey",stage:"Group A"},
  ],
  "2026-06-25":[
    {home:"Curaçao",away:"Ivory Coast",kickoff_et:"16:00",venue:"Lincoln Financial Field, Philadelphia",stage:"Group E"},
    {home:"Ecuador",away:"Germany",kickoff_et:"16:00",venue:"MetLife Stadium, East Rutherford",stage:"Group E"},
    {home:"Japan",away:"Sweden",kickoff_et:"19:00",venue:"AT&T Stadium, Arlington",stage:"Group F"},
    {home:"Tunisia",away:"Netherlands",kickoff_et:"19:00",venue:"Arrowhead Stadium, Kansas City",stage:"Group F"},
    {home:"Türkiye",away:"USA",kickoff_et:"22:00",venue:"SoFi Stadium, Inglewood",stage:"Group D"},
    {home:"Paraguay",away:"Australia",kickoff_et:"22:00",venue:"Levi's Stadium, Santa Clara",stage:"Group D"},
  ],
  "2026-06-26":[
    {home:"Norway",away:"France",kickoff_et:"15:00",venue:"Gillette Stadium, Foxborough",stage:"Group I"},
    {home:"Senegal",away:"Iraq",kickoff_et:"15:00",venue:"BMO Field, Toronto",stage:"Group I"},
    {home:"Cape Verde",away:"Saudi Arabia",kickoff_et:"20:00",venue:"NRG Stadium, Houston",stage:"Group H"},
    {home:"Uruguay",away:"Spain",kickoff_et:"20:00",venue:"Estadio Akron, Zapopan",stage:"Group H"},
    {home:"Egypt",away:"Iran",kickoff_et:"23:00",venue:"Lumen Field, Seattle",stage:"Group G"},
    {home:"New Zealand",away:"Belgium",kickoff_et:"23:00",venue:"BC Place, Vancouver",stage:"Group G"},
  ],
  "2026-06-27":[
    {home:"Panama",away:"England",kickoff_et:"17:00",venue:"MetLife Stadium, East Rutherford",stage:"Group L"},
    {home:"Croatia",away:"Ghana",kickoff_et:"17:00",venue:"Lincoln Financial Field, Philadelphia",stage:"Group L"},
    {home:"Colombia",away:"Portugal",kickoff_et:"19:30",venue:"Hard Rock Stadium, Miami Gardens",stage:"Group K"},
    {home:"DR Congo",away:"Uzbekistan",kickoff_et:"19:30",venue:"Mercedes-Benz Stadium, Atlanta",stage:"Group K"},
    {home:"Algeria",away:"Austria",kickoff_et:"22:00",venue:"Arrowhead Stadium, Kansas City",stage:"Group J"},
    {home:"Jordan",away:"Argentina",kickoff_et:"22:00",venue:"AT&T Stadium, Arlington",stage:"Group J"},
  ],
  "2026-06-28":[{home:"TBD",away:"TBD",kickoff_et:"15:00",venue:"TBD",stage:"Round of 32"}],
  "2026-06-29":[
    {home:"TBD",away:"TBD",kickoff_et:"13:00",venue:"NRG Stadium, Houston",stage:"Round of 32"},
    {home:"TBD",away:"TBD",kickoff_et:"16:30",venue:"Gillette Stadium, Foxborough",stage:"Round of 32"},
    {home:"TBD",away:"TBD",kickoff_et:"21:00",venue:"Estadio BBVA, Monterrey",stage:"Round of 32"},
  ],
  "2026-06-30":[
    {home:"TBD",away:"TBD",kickoff_et:"13:00",venue:"AT&T Stadium, Arlington",stage:"Round of 32"},
    {home:"TBD",away:"TBD",kickoff_et:"17:00",venue:"MetLife Stadium, East Rutherford",stage:"Round of 32"},
    {home:"TBD",away:"TBD",kickoff_et:"21:00",venue:"Estadio Azteca, Mexico City",stage:"Round of 32"},
  ],
  "2026-07-01":[
    {home:"TBD",away:"TBD",kickoff_et:"12:00",venue:"Mercedes-Benz Stadium, Atlanta",stage:"Round of 32"},
    {home:"TBD",away:"TBD",kickoff_et:"16:00",venue:"Lumen Field, Seattle",stage:"Round of 32"},
    {home:"TBD",away:"TBD",kickoff_et:"20:00",venue:"Levi's Stadium, Santa Clara",stage:"Round of 32"},
  ],
  "2026-07-02":[
    {home:"TBD",away:"TBD",kickoff_et:"15:00",venue:"SoFi Stadium, Inglewood",stage:"Round of 32"},
    {home:"TBD",away:"TBD",kickoff_et:"19:00",venue:"BMO Field, Toronto",stage:"Round of 32"},
    {home:"TBD",away:"TBD",kickoff_et:"23:00",venue:"BC Place, Vancouver",stage:"Round of 32"},
  ],
  "2026-07-03":[
    {home:"TBD",away:"TBD",kickoff_et:"14:00",venue:"AT&T Stadium, Arlington",stage:"Round of 32"},
    {home:"TBD",away:"TBD",kickoff_et:"18:00",venue:"Hard Rock Stadium, Miami Gardens",stage:"Round of 32"},
    {home:"TBD",away:"TBD",kickoff_et:"21:30",venue:"Arrowhead Stadium, Kansas City",stage:"Round of 32"},
  ],
  "2026-07-04":[
    {home:"TBD",away:"TBD",kickoff_et:"13:00",venue:"NRG Stadium, Houston",stage:"Round of 16"},
    {home:"TBD",away:"TBD",kickoff_et:"17:00",venue:"Lincoln Financial Field, Philadelphia",stage:"Round of 16"},
  ],
  "2026-07-05":[
    {home:"TBD",away:"TBD",kickoff_et:"16:00",venue:"MetLife Stadium, East Rutherford",stage:"Round of 16"},
    {home:"TBD",away:"TBD",kickoff_et:"20:00",venue:"Estadio Azteca, Mexico City",stage:"Round of 16"},
  ],
  "2026-07-06":[
    {home:"TBD",away:"TBD",kickoff_et:"15:00",venue:"AT&T Stadium, Arlington",stage:"Round of 16"},
    {home:"TBD",away:"TBD",kickoff_et:"20:00",venue:"Lumen Field, Seattle",stage:"Round of 16"},
  ],
  "2026-07-07":[
    {home:"TBD",away:"TBD",kickoff_et:"12:00",venue:"Mercedes-Benz Stadium, Atlanta",stage:"Round of 16"},
    {home:"TBD",away:"TBD",kickoff_et:"16:00",venue:"BC Place, Vancouver",stage:"Round of 16"},
  ],
  "2026-07-09":[{home:"TBD",away:"TBD",kickoff_et:"16:00",venue:"Gillette Stadium, Foxborough",stage:"Quarterfinal"}],
  "2026-07-10":[{home:"TBD",away:"TBD",kickoff_et:"15:00",venue:"SoFi Stadium, Inglewood",stage:"Quarterfinal"}],
  "2026-07-11":[
    {home:"TBD",away:"TBD",kickoff_et:"17:00",venue:"Hard Rock Stadium, Miami Gardens",stage:"Quarterfinal"},
    {home:"TBD",away:"TBD",kickoff_et:"21:00",venue:"Arrowhead Stadium, Kansas City",stage:"Quarterfinal"},
  ],
  "2026-07-14":[{home:"TBD",away:"TBD",kickoff_et:"15:00",venue:"AT&T Stadium, Arlington",stage:"Semifinal"}],
  "2026-07-15":[{home:"TBD",away:"TBD",kickoff_et:"15:00",venue:"Mercedes-Benz Stadium, Atlanta",stage:"Semifinal"}],
  "2026-07-18":[{home:"TBD",away:"TBD",kickoff_et:"17:00",venue:"Hard Rock Stadium, Miami Gardens",stage:"Third Place"}],
  "2026-07-19":[{home:"TBD",away:"TBD",kickoff_et:"15:00",venue:"MetLife Stadium, East Rutherford, NJ",stage:"Final"}],
};

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate");

  try {
    const dateKey = req.query.date || todayKeyET();
    const matches = SCHEDULE[dateKey] || [];

    if(!matches.length) {
      return res.status(200).json({status:"no_matches", date:dateKey, picks:[]});
    }

    // Fetch picks for each match individually
    const picks = [];
    let anyReady = false;
    let anyPending = false;

    for(const match of matches) {
      const key = matchKey(dateKey, match.home, match.away);
      const raw = await redis.get(key);

      if(raw) {
        const pick = typeof raw === "string" ? JSON.parse(raw) : raw;
        picks.push(pick);
        anyReady = true;
      } else {
        // Return a pending placeholder for this match
        picks.push({
          home: match.home,
          away: match.away,
          kickoff: match.kickoff_et,
          venue: match.venue,
          stage: match.stage,
          pending: true,
          player_props: [],
          game_props: [],
          team_props: [],
        });
        anyPending = true;
      }
    }

    return res.status(200).json({
      status: anyReady ? "ready" : "pending",
      partial: anyReady && anyPending,
      date: dateKey,
      picks,
    });
  } catch(err) {
    return res.status(500).json({status:"error", message:err.message});
  }
}

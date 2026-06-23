import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
});

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "s-maxage=30");

  const apiKey = process.env.API_FOOTBALL_KEY;
  const oddsApiKey = process.env.ODDS_API_KEY;

  const normalize = s => s?.toLowerCase().replace(/[^a-z]/g, '') || '';
  function fuzzy(a, b) {
    const na = normalize(a), nb = normalize(b);
    return na === nb || na.includes(nb.slice(0,4)) || nb.includes(na.slice(0,4));
  }

  try {
    const today = new Date().toLocaleDateString("en-CA", { timeZone: "America/New_York" });

    // Fetch all sources in parallel including direct WC league lookup
    const [liveRes, todayRes, wcRes, oddsRes] = await Promise.all([
      fetch("https://v3.football.api-sports.io/fixtures?live=all", {
        headers: { "x-apisports-key": apiKey }
      }),
      fetch(`https://v3.football.api-sports.io/fixtures?date=${today}`, {
        headers: { "x-apisports-key": apiKey }
      }),
      // Direct WC 2026 lookup by league ID — this is what was missing
      fetch(`https://v3.football.api-sports.io/fixtures?league=1&season=2026&date=${today}`, {
        headers: { "x-apisports-key": apiKey }
      }),
      fetch(`https://api.the-odds-api.com/v4/sports/soccer_fifa_world_cup/scores/?apiKey=${oddsApiKey}&daysFrom=3`)
    ]);

    const [liveData, todayData, wcData, oddsData] = await Promise.all([
      liveRes.json(),
      todayRes.json(),
      wcRes.json(),
      oddsRes.json()
    ]);

    // Build fixture ID map from API-Football WC results — keyed by home team name
    const fixtureIdMap = {};
    for (const f of [...(wcData.response || []), ...(liveData.response || []), ...(todayData.response || [])]) {
      const name = f.league?.name?.toLowerCase() || '';
      if (name.includes('world cup') || name.includes('fifa') || f.league?.id === 1) {
        const home = f.teams?.home?.name;
        const away = f.teams?.away?.name;
        const id = f.fixture?.id;
        if (home && away && id) {
          fixtureIdMap[`${normalize(home)}|${normalize(away)}`] = id;
        }
        // Also cache to Redis for live-tracker to use
        if (id) {
          const cacheKey = `fixtureid:${today}:${normalize(home)}`;
          redis.set(cacheKey, id, { ex: 60 * 60 * 24 }).catch(() => {});
        }
      }
    }

    function findFixtureId(home, away) {
      for (const key of Object.keys(fixtureIdMap)) {
        const [h, a] = key.split('|');
        if (fuzzy(h, home) && fuzzy(a, away)) return fixtureIdMap[key];
      }
      return null;
    }

    // Combine and deduplicate fixtures
    const seen = new Set();
    const allFixtures = [];
    for (const f of [...(liveData.response || []), ...(todayData.response || []), ...(wcData.response || [])]) {
      const id = f.fixture?.id;
      if (!seen.has(id)) {
        seen.add(id);
        const name = f.league?.name?.toLowerCase() || '';
        if (name.includes('world cup') || name.includes('fifa') || f.league?.id === 1) {
          allFixtures.push(f);
        }
      }
    }

    // Build odds score map
    const oddsMap = {};
    for (const game of (oddsData || [])) {
      const hs = game.scores?.find(s => s.name === game.home_team)?.score;
      const as = game.scores?.find(s => s.name === game.away_team)?.score;
      oddsMap[`${normalize(game.home_team)}|${normalize(game.away_team)}`] = {
        home_score: hs !== undefined ? parseInt(hs) : null,
        away_score: as !== undefined ? parseInt(as) : null,
        completed: game.completed,
        home_team: game.home_team,
        away_team: game.away_team,
      };
    }

    function findOddsScore(homeTeam, awayTeam) {
      const hn = normalize(homeTeam);
      const an = normalize(awayTeam);
      for (const key of Object.keys(oddsMap)) {
        const [h, a] = key.split('|');
        if ((h.includes(hn.slice(0,4)) || hn.includes(h.slice(0,4))) &&
            (a.includes(an.slice(0,4)) || an.includes(a.slice(0,4)))) {
          return oddsMap[key];
        }
      }
      return null;
    }

    const scores = allFixtures.map((fixture) => {
      const f = fixture.fixture;
      const teams = fixture.teams;
      const events = fixture.events || [];

      const statusShort = f.status?.short;
      let matchStatus = "pre";
      if (["1H", "HT", "2H", "ET", "P"].includes(statusShort)) matchStatus = "live";
      else if (["FT", "AET", "PEN"].includes(statusShort)) matchStatus = "ft";

      const oddsScore = findOddsScore(teams.home?.name, teams.away?.name);
      const homeScore = oddsScore?.home_score ?? fixture.goals?.home ?? null;
      const awayScore = oddsScore?.away_score ?? fixture.goals?.away ?? null;

      if (oddsScore?.completed && matchStatus === "pre") matchStatus = "ft";

      const goalEvents = events.filter(e => e.type === "Goal");
      const goalscorers = goalEvents.map(e => ({
        team: e.team?.name,
        player: e.player?.name,
        minute: e.time?.elapsed,
        extra: e.time?.extra,
        type: e.detail,
      }));

      return {
        fixture_id: f.id,
        home: teams.home?.name,
        away: teams.away?.name,
        home_score: homeScore,
        away_score: awayScore,
        minute: f.status?.elapsed?.toString() || null,
        status: matchStatus,
        goalscorers,
      };
    });

    // Add Odds API games not in API-Football, but now try to look up fixture ID
    const fixtureNames = allFixtures.map(f => normalize(f.teams?.home?.name));
    for (const game of (oddsData || [])) {
      const hn = normalize(game.home_team);
      const alreadyIncluded = fixtureNames.some(n => n.includes(hn.slice(0,4)) || hn.includes(n.slice(0,4)));
      if (!alreadyIncluded && game.scores) {
        const hs = game.scores?.find(s => s.name === game.home_team)?.score;
        const as = game.scores?.find(s => s.name === game.away_team)?.score;
        if (hs !== undefined && as !== undefined) {
          // Try to find fixture ID even for odds-only games
          const fid = findFixtureId(game.home_team, game.away_team);
          scores.push({
            fixture_id: fid || null,
            home: game.home_team,
            away: game.away_team,
            home_score: parseInt(hs),
            away_score: parseInt(as),
            minute: "90",
            status: game.completed ? "ft" : "live",
            goalscorers: [],
          });
        }
      }
    }

    return res.status(200).json(scores);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

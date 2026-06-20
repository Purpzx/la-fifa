export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "s-maxage=30");

  const apiKey = process.env.API_FOOTBALL_KEY;
  const oddsApiKey = process.env.ODDS_API_KEY;

  try {
    const today = new Date().toLocaleDateString("en-CA", { timeZone: "America/New_York" });

    const [liveRes, todayRes, oddsRes] = await Promise.all([
      fetch("https://v3.football.api-sports.io/fixtures?live=all", {
        headers: { "x-apisports-key": apiKey }
      }),
      fetch(`https://v3.football.api-sports.io/fixtures?date=${today}`, {
        headers: { "x-apisports-key": apiKey }
      }),
      fetch(`https://api.the-odds-api.com/v4/sports/soccer_fifa_world_cup/scores/?apiKey=${oddsApiKey}&daysFrom=3`)
    ]);

    const [liveData, todayData, oddsData] = await Promise.all([
      liveRes.json(),
      todayRes.json(),
      oddsRes.json()
    ]);

    // Combine and deduplicate fixtures
    const seen = new Set();
    const allFixtures = [];
    for (const f of [...(liveData.response || []), ...(todayData.response || [])]) {
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
    const normalize = s => s?.toLowerCase().replace(/[^a-z]/g, '') || '';
    const oddsMap = {};
    for (const game of (oddsData || [])) {
      const hs = game.scores?.find(s => s.name === game.home_team)?.score;
      const as = game.scores?.find(s => s.name === game.away_team)?.score;
      oddsMap[`${normalize(game.home_team)}|${normalize(game.away_team)}`] = {
        home_score: hs !== undefined ? parseInt(hs) : null,
        away_score: as !== undefined ? parseInt(as) : null,
        completed: game.completed,
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

    // Add any Odds API games not in API-Football
    const fixtureNames = allFixtures.map(f => normalize(f.teams?.home?.name));
    for (const game of (oddsData || [])) {
      const hn = normalize(game.home_team);
      const alreadyIncluded = fixtureNames.some(n => n.includes(hn.slice(0,4)) || hn.includes(n.slice(0,4)));
      if (!alreadyIncluded && game.scores) {
        const hs = game.scores?.find(s => s.name === game.home_team)?.score;
        const as = game.scores?.find(s => s.name === game.away_team)?.score;
        if (hs !== undefined && as !== undefined) {
          scores.push({
            fixture_id: null,
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

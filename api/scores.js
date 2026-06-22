export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "s-maxage=60");

  const apiKey = process.env.API_FOOTBALL_KEY;
  const oddsApiKey = process.env.ODDS_API_KEY;
  const { date } = req.query;

  if (!date) return res.status(400).json({ error: "Missing date" });

  try {
    const [fixturesRes, oddsRes] = await Promise.all([
      fetch(`https://v3.football.api-sports.io/fixtures?date=${date}`, {
        headers: { "x-apisports-key": apiKey }
      }),
      fetch(`https://api.the-odds-api.com/v4/sports/soccer_fifa_world_cup/scores/?apiKey=${oddsApiKey}&daysFrom=3`)
    ]);

    const [fixturesData, oddsData] = await Promise.all([
      fixturesRes.json(),
      oddsRes.json()
    ]);

    const fixtures = (fixturesData.response || []).filter(f => {
      const name = f.league?.name?.toLowerCase() || '';
      return name.includes('world cup') || name.includes('fifa');
    });

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

    const scores = fixtures.map(fixture => {
      const homeTeam = fixture.teams?.home?.name;
      const awayTeam = fixture.teams?.away?.name;
      const status = fixture.fixture?.status?.short;

      let matchStatus = "pre";
      if (["1H", "HT", "2H", "ET", "P"].includes(status)) matchStatus = "live";
      else if (["FT", "AET", "PEN"].includes(status)) matchStatus = "ft";

      const oddsScore = findOddsScore(homeTeam, awayTeam);
      const homeScore = oddsScore?.home_score ?? fixture.goals?.home ?? null;
      const awayScore = oddsScore?.away_score ?? fixture.goals?.away ?? null;

      if (oddsScore?.completed && matchStatus === "pre") matchStatus = "ft";

      return {
        fixture_id: fixture.fixture?.id || null,
        home: homeTeam,
        away: awayTeam,
        home_score: homeScore,
        away_score: awayScore,
        minute: fixture.fixture?.status?.elapsed?.toString() || null,
        status: matchStatus,
      };
    });

    // Add any Odds API games not in API-Football
    const fixtureNames = fixtures.map(f => normalize(f.teams?.home?.name));
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
          });
        }
      }
    }

    return res.status(200).json(scores);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

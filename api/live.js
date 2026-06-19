export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "s-maxage=30");

  const apiKey = process.env.API_FOOTBALL_KEY;
  const oddsApiKey = process.env.ODDS_API_KEY;

  try {
    const today = new Date().toLocaleDateString("en-CA", { timeZone: "America/New_York" });

    // Fetch live fixtures + today's fixtures in parallel
    const [liveRes, todayRes, oddsRes] = await Promise.all([
      fetch("https://v3.football.api-sports.io/fixtures?live=all", {
        headers: { "x-apisports-key": apiKey }
      }),
      fetch(`https://v3.football.api-sports.io/fixtures?date=${today}`, {
        headers: { "x-apisports-key": apiKey }
      }),
      fetch(`https://api.the-odds-api.com/v4/sports/soccer_fifa_world_cup/scores/?apiKey=${oddsApiKey}&daysFrom=1`)
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

    // Build odds score map for accurate scores
    const oddsScoreMap = {};
    for (const game of (oddsData || [])) {
      const homeScore = game.scores?.find(s => s.name === game.home_team)?.score;
      const awayScore = game.scores?.find(s => s.name === game.away_team)?.score;
      oddsScoreMap[`${game.home_team}|${game.away_team}`] = {
        home_score: homeScore !== undefined ? parseInt(homeScore) : null,
        away_score: awayScore !== undefined ? parseInt(awayScore) : null,
        completed: game.completed,
      };
    }

    const normalize = s => s?.toLowerCase().replace(/[^a-z]/g, '') || '';

    function findOddsScore(homeTeam, awayTeam) {
      for (const key of Object.keys(oddsScoreMap)) {
        const [h, a] = key.split('|');
        if (
          (normalize(h).includes(normalize(homeTeam).slice(0,4)) || normalize(homeTeam).includes(normalize(h).slice(0,4))) &&
          (normalize(a).includes(normalize(awayTeam).slice(0,4)) || normalize(awayTeam).includes(normalize(a).slice(0,4)))
        ) return oddsScoreMap[key];
      }
      return null;
    }

    const scores = allFixtures.map((fixture) => {
      const f = fixture.fixture;
      const teams = fixture.teams;
      const events = fixture.events || [];

      const status = f.status?.short;
      let matchStatus = "pre";
      if (["1H", "HT", "2H", "ET", "P"].includes(status)) matchStatus = "live";
      else if (["FT", "AET", "PEN"].includes(status)) matchStatus = "ft";

      // Use Odds API for accurate scores, fall back to API-Football
      const oddsScore = findOddsScore(teams.home?.name, teams.away?.name);
      const homeScore = oddsScore?.home_score ?? fixture.goals?.home ?? null;
      const awayScore = oddsScore?.away_score ?? fixture.goals?.away ?? null;

      // Goalscorers from API-Football (Pro tier)
      const goalEvents = events.filter(e => e.type === "Goal");
      const goalscorers = goalEvents.map(e => ({
        team: e.team?.name,
        player: e.player?.name,
        minute: e.time?.elapsed,
        extra: e.time?.extra,
        type: e.detail,
      }));

      return {
        home: teams.home?.name,
        away: teams.away?.name,
        home_score: homeScore,
        away_score: awayScore,
        minute: f.status?.elapsed?.toString() || null,
        status: matchStatus,
        goalscorers,
      };
    });

    return res.status(200).json(scores);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

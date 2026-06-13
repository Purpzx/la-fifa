export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "s-maxage=30");

  const apiKey = process.env.API_FOOTBALL_KEY;

  try {
    const today = new Date().toLocaleDateString("en-CA", { timeZone: "America/New_York" });

    // Fetch live games and today's games in parallel
    const [liveRes, todayRes] = await Promise.all([
      fetch("https://v3.football.api-sports.io/fixtures?live=all", {
        headers: { "x-apisports-key": apiKey }
      }),
      fetch(`https://v3.football.api-sports.io/fixtures?date=${today}`, {
        headers: { "x-apisports-key": apiKey }
      })
    ]);

    const [liveData, todayData] = await Promise.all([
      liveRes.json(),
      todayRes.json()
    ]);

    // Combine and deduplicate by fixture id
    const seen = new Set();
    const allFixtures = [];

    for (const f of [...(liveData.response || []), ...(todayData.response || [])]) {
      const id = f.fixture?.id;
      if (!seen.has(id)) {
        seen.add(id);
        // Only World Cup fixtures
        const leagueName = f.league?.name?.toLowerCase() || '';
        if (leagueName.includes('world cup') || leagueName.includes('fifa') || f.league?.id === 1) {
          allFixtures.push(f);
        }
      }
    }

    if (!allFixtures.length) {
      return res.status(200).json([]);
    }

    const scores = allFixtures.map((fixture) => {
      const f = fixture.fixture;
      const teams = fixture.teams;
      const goals = fixture.goals;
      const events = fixture.events || [];

      const status = f.status?.short;
      let matchStatus = "pre";
      if (["1H", "HT", "2H", "ET", "P"].includes(status)) matchStatus = "live";
      else if (["FT", "AET", "PEN"].includes(status)) matchStatus = "ft";

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
        home_score: goals?.home ?? null,
        away_score: goals?.away ?? null,
        minute: f.status?.elapsed?.toString() || null,
        status: matchStatus,
        home_shots: null,
        away_shots: null,
        home_shots_ot: null,
        away_shots_ot: null,
        home_possession: null,
        away_possession: null,
        home_corners: null,
        away_corners: null,
        home_cards: null,
        away_cards: null,
        goalscorers,
      };
    });

    return res.status(200).json(scores);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

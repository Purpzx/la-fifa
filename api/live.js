export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "s-maxage=30");

  const apiKey = process.env.API_FOOTBALL_KEY;

  try {
    // Get today's World Cup fixtures
    const fixturesRes = await fetch(
      "https://v3.football.api-sports.io/fixtures?league=1&season=2026&live=all",
      { headers: { "x-apisports-key": apiKey } }
    );

    const fixturesData = await fixturesRes.json();
    const fixtures = fixturesData.response || [];

    // If no live games, get today's fixtures
    let allFixtures = fixtures;
    if (!fixtures.length) {
      const todayRes = await fetch(
        `https://v3.football.api-sports.io/fixtures?league=1&season=2026&date=${new Date().toLocaleDateString("en-CA", { timeZone: "America/New_York" })}`,
        { headers: { "x-apisports-key": apiKey } }
      );
      const todayData = await todayRes.json();
      allFixtures = todayData.response || [];
    }

    const scores = allFixtures.map((fixture) => {
      const f = fixture.fixture;
      const teams = fixture.teams;
      const goals = fixture.goals;
      const stats = fixture.statistics || [];
      const events = fixture.events || [];

      const status = f.status?.short;
      let matchStatus = "pre";
      if (["1H", "HT", "2H", "ET", "P"].includes(status)) matchStatus = "live";
      else if (["FT", "AET", "PEN"].includes(status)) matchStatus = "ft";

      // Extract stats
      const homeStats = stats.find(s => s.team?.id === teams.home?.id)?.statistics || [];
      const awayStats = stats.find(s => s.team?.id === teams.away?.id)?.statistics || [];

      const getStat = (statsArr, type) => {
        const s = statsArr.find(s => s.type === type);
        return s?.value ?? 0;
      };

      // Extract goalscorers
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
        home_score: goals?.home ?? null,
        away_score: goals?.away ?? null,
        minute: f.status?.elapsed?.toString() || null,
        status: matchStatus,
        home_shots: getStat(homeStats, "Total Shots"),
        away_shots: getStat(awayStats, "Total Shots"),
        home_shots_ot: getStat(homeStats, "Shots on Goal"),
        away_shots_ot: getStat(awayStats, "Shots on Goal"),
        home_possession: parseInt(getStat(homeStats, "Ball Possession")) || 50,
        away_possession: parseInt(getStat(awayStats, "Ball Possession")) || 50,
        home_corners: getStat(homeStats, "Corner Kicks"),
        away_corners: getStat(awayStats, "Corner Kicks"),
        home_cards: `${getStat(homeStats, "Yellow Cards")}Y ${getStat(homeStats, "Red Cards")}R`,
        away_cards: `${getStat(awayStats, "Yellow Cards")}Y ${getStat(awayStats, "Red Cards")}R`,
        goalscorers,
      };
    });

    return res.status(200).json(scores);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

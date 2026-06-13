export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "s-maxage=30");

  const apiKey = process.env.API_FOOTBALL_KEY;

  try {
    // Search for today's FIFA World Cup fixtures
    const today = new Date().toLocaleDateString("en-CA", { timeZone: "America/New_York" });

    // Try multiple known World Cup league IDs
    const leagueIds = [1, 16, 777];
    let allFixtures = [];

    for (const leagueId of leagueIds) {
      const r = await fetch(
        `https://v3.football.api-sports.io/fixtures?date=${today}&league=${leagueId}&season=2026`,
        { headers: { "x-apisports-key": apiKey } }
      );
      const d = await r.json();
      if (d.response?.length) {
        allFixtures = [...allFixtures, ...d.response];
      }
    }

    // If still nothing, search by date only and filter for World Cup
    if (!allFixtures.length) {
      const r = await fetch(
        `https://v3.football.api-sports.io/fixtures?date=${today}`,
        { headers: { "x-apisports-key": apiKey } }
      );
      const d = await r.json();
      allFixtures = (d.response || []).filter(f =>
        f.league?.name?.toLowerCase().includes('world cup') ||
        f.league?.name?.toLowerCase().includes('fifa')
      );
    }

    if (!allFixtures.length) {
      return res.status(200).json([]);
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

      const homeStats = stats.find(s => s.team?.id === teams.home?.id)?.statistics || [];
      const awayStats = stats.find(s => s.team?.id === teams.away?.id)?.statistics || [];

      const getStat = (arr, type) => arr.find(s => s.type === type)?.value ?? 0;

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

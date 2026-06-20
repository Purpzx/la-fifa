export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "s-maxage=30");

  const apiKey = process.env.API_FOOTBALL_KEY;
  const { fixture_id } = req.query;

  if (!fixture_id) {
    return res.status(400).json({ error: "Missing fixture_id" });
  }

  try {
    // Fetch live events, stats, and player stats in parallel
    const [eventsRes, statsRes, playersRes] = await Promise.all([
      fetch(`https://v3.football.api-sports.io/fixtures/events?fixture=${fixture_id}`,
        { headers: { "x-apisports-key": apiKey } }),
      fetch(`https://v3.football.api-sports.io/fixtures/statistics?fixture=${fixture_id}`,
        { headers: { "x-apisports-key": apiKey } }),
      fetch(`https://v3.football.api-sports.io/fixtures/players?fixture=${fixture_id}`,
        { headers: { "x-apisports-key": apiKey } }),
    ]);

    const [eventsData, statsData, playersData] = await Promise.all([
      eventsRes.json(),
      statsRes.json(),
      playersRes.json(),
    ]);

    // Parse events
    const events = eventsData.response || [];
    const goals = events.filter(e => e.type === "Goal").map(e => ({
      team: e.team?.name,
      player: e.player?.name,
      minute: e.time?.elapsed,
      extra: e.time?.extra,
      type: e.detail,
    }));
    const cards = events.filter(e => e.type === "Card").map(e => ({
      team: e.team?.name,
      player: e.player?.name,
      minute: e.time?.elapsed,
      type: e.detail,
    }));
    const corners = events.filter(e =>
      e.type === "Goal" && e.detail === "Corner" ||
      e.comments?.toLowerCase().includes("corner")
    );

    // Parse team stats
    const teamStats = statsData.response || [];
    const getTeamStat = (teamName, statType) => {
      const team = teamStats.find(t =>
        t.team?.name?.toLowerCase().includes(teamName?.toLowerCase().slice(0,4))
      );
      return team?.statistics?.find(s => s.type === statType)?.value ?? 0;
    };

    // Parse player stats
    const playerStats = {};
    for (const team of (playersData.response || [])) {
      for (const player of (team.players || [])) {
        const name = player.player?.name;
        if (name) {
          const s = player.statistics?.[0] || {};
          playerStats[name.toLowerCase()] = {
            name: player.player?.name,
            shots: s.shots?.total ?? 0,
            shotsOnTarget: s.shots?.on ?? 0,
            passes: s.passes?.total ?? 0,
            keyPasses: s.passes?.key ?? 0,
            tackles: s.tackles?.total ?? 0,
            fouls: s.fouls?.committed ?? 0,
            yellowCards: s.cards?.yellow ?? 0,
            redCards: s.cards?.red ?? 0,
            saves: s.goals?.saves ?? 0,
            goals: s.goals?.total ?? 0,
            assists: s.goals?.assists ?? 0,
          };
        }
      }
    }

    // Get fixture status and minute
    const fixtureRes = await fetch(
      `https://v3.football.api-sports.io/fixtures?id=${fixture_id}`,
      { headers: { "x-apisports-key": apiKey } }
    );
    const fixtureData = await fixtureRes.json();
    const fixture = fixtureData.response?.[0];
    const status = fixture?.fixture?.status?.short || 'NS';
    const minute = fixture?.fixture?.status?.elapsed || 0;
    const homeScore = fixture?.goals?.home ?? 0;
    const awayScore = fixture?.goals?.away ?? 0;
    const homeTeam = fixture?.teams?.home?.name;
    const awayTeam = fixture?.teams?.away?.name;

    // Build team stats summary
    const homeCorners = parseInt(getTeamStat(homeTeam, "Corner Kicks")) || 0;
    const awayCorners = parseInt(getTeamStat(awayTeam, "Corner Kicks")) || 0;
    const homeYellow = parseInt(getTeamStat(homeTeam, "Yellow Cards")) || 0;
    const awayYellow = parseInt(getTeamStat(awayTeam, "Yellow Cards")) || 0;
    const homeShots = parseInt(getTeamStat(homeTeam, "Total Shots")) || 0;
    const awayShots = parseInt(getTeamStat(awayTeam, "Total Shots")) || 0;

    return res.status(200).json({
      fixture_id,
      status,
      minute,
      home: { name: homeTeam, score: homeScore },
      away: { name: awayTeam, score: awayScore },
      team_stats: {
        corners: { home: homeCorners, away: awayCorners, total: homeCorners + awayCorners },
        yellow_cards: { home: homeYellow, away: awayYellow, total: homeYellow + awayYellow },
        shots: { home: homeShots, away: awayShots, total: homeShots + awayShots },
      },
      goals,
      cards,
      player_stats: playerStats,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

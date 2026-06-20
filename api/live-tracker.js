export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "s-maxage=30");

  const apiKey = process.env.API_FOOTBALL_KEY;
  const { fixture_id } = req.query;

  if (!fixture_id) {
    return res.status(400).json({ error: "Missing fixture_id" });
  }

  try {
    const [eventsRes, statsRes, playersRes, fixtureRes] = await Promise.all([
      fetch(`https://v3.football.api-sports.io/fixtures/events?fixture=${fixture_id}`,
        { headers: { "x-apisports-key": apiKey } }),
      fetch(`https://v3.football.api-sports.io/fixtures/statistics?fixture=${fixture_id}`,
        { headers: { "x-apisports-key": apiKey } }),
      fetch(`https://v3.football.api-sports.io/fixtures/players?fixture=${fixture_id}`,
        { headers: { "x-apisports-key": apiKey } }),
      fetch(`https://v3.football.api-sports.io/fixtures?id=${fixture_id}`,
        { headers: { "x-apisports-key": apiKey } }),
    ]);

    const [eventsData, statsData, playersData, fixtureData] = await Promise.all([
      eventsRes.json(),
      statsRes.json(),
      playersRes.json(),
      fixtureRes.json(),
    ]);

    const fixture = fixtureData.response?.[0];
    const status = fixture?.fixture?.status?.short || 'NS';
    const minute = fixture?.fixture?.status?.elapsed || 0;
    const homeScore = fixture?.goals?.home ?? 0;
    const awayScore = fixture?.goals?.away ?? 0;
    const homeTeam = fixture?.teams?.home?.name;
    const awayTeam = fixture?.teams?.away?.name;

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

    // Parse team stats
    const teamStats = statsData.response || [];
    const getStat = (teamName, statType) => {
      const team = teamStats.find(t => {
        const tn = t.team?.name?.toLowerCase().replace(/[^a-z]/g,'') || '';
        const search = teamName?.toLowerCase().replace(/[^a-z]/g,'') || '';
        return tn.includes(search.slice(0,4)) || search.includes(tn.slice(0,4));
      });
      return team?.statistics?.find(s => s.type === statType)?.value ?? 0;
    };

    const homeCorners = parseInt(getStat(homeTeam, "Corner Kicks")) || 0;
    const awayCorners = parseInt(getStat(awayTeam, "Corner Kicks")) || 0;
    const homeYellow = parseInt(getStat(homeTeam, "Yellow Cards")) || 0;
    const awayYellow = parseInt(getStat(awayTeam, "Yellow Cards")) || 0;
    const homeRed = parseInt(getStat(homeTeam, "Red Cards")) || 0;
    const awayRed = parseInt(getStat(awayTeam, "Red Cards")) || 0;
    const homeShots = parseInt(getStat(homeTeam, "Total Shots")) || 0;
    const awayShots = parseInt(getStat(awayTeam, "Total Shots")) || 0;

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

    return res.status(200).json({
      fixture_id,
      status,
      minute,
      home: { name: homeTeam, score: homeScore },
      away: { name: awayTeam, score: awayScore },
      team_stats: {
        corners: { home: homeCorners, away: awayCorners, total: homeCorners + awayCorners },
        yellow_cards: { home: homeYellow, away: awayYellow, total: homeYellow + awayYellow },
        red_cards: { home: homeRed, away: awayRed, total: homeRed + awayRed },
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

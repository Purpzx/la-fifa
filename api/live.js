export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "s-maxage=30");

  const oddsApiKey = process.env.ODDS_API_KEY;
  const footballApiKey = process.env.API_FOOTBALL_KEY;

  try {
    const today = new Date().toLocaleDateString("en-CA", { timeZone: "America/New_York" });

    // Fetch scores from Odds API (reliable) + goalscorers from API-Football in parallel
    const [oddsRes, footballRes] = await Promise.all([
      fetch(
        `https://api.the-odds-api.com/v4/sports/soccer_fifa_world_cup/scores/?apiKey=${oddsApiKey}&daysFrom=1`
      ),
      fetch(
        `https://v3.football.api-sports.io/fixtures?live=all`,
        { headers: { "x-apisports-key": footballApiKey } }
      )
    ]);

    const [oddsData, footballData] = await Promise.all([
      oddsRes.json(),
      footballRes.json()
    ]);

    // If no live games, get today's completed games from API-Football
    let footballFixtures = footballData.response || [];
    if (!footballFixtures.length) {
      const todayRes = await fetch(
        `https://v3.football.api-sports.io/fixtures?date=${today}`,
        { headers: { "x-apisports-key": footballApiKey } }
      );
      const todayData = await todayRes.json();
      footballFixtures = (todayData.response || []).filter(f => {
        const name = f.league?.name?.toLowerCase() || '';
        return name.includes('world cup') || name.includes('fifa');
      });
    }

    // Build goalscorer map by team names
    const goalscoreMap = {};
    for (const fixture of footballFixtures) {
      const home = fixture.teams?.home?.name;
      const away = fixture.teams?.away?.name;
      const events = fixture.events || [];
      const goalscorers = events
        .filter(e => e.type === "Goal")
        .map(e => ({
          team: e.team?.name,
          player: e.player?.name,
          minute: e.time?.elapsed,
          extra: e.time?.extra,
          type: e.detail,
        }));
      if (home && away) goalscoreMap[`${home}|${away}`] = goalscorers;
    }

    // Filter Odds API to today's games only
    const oddsGames = (oddsData || []).filter(game => {
      const d = new Date(game.commence_time)
        .toLocaleDateString("en-US", { timeZone: "America/New_York" })
        .split("/");
      const dateStr = `${d[2]}-${String(d[0]).padStart(2,"0")}-${String(d[1]).padStart(2,"0")}`;
      return dateStr === today;
    });

    const scores = oddsGames.map(game => {
      const home = game.home_team;
      const away = game.away_team;
      const completed = game.completed;
      const commenced = new Date(game.commence_time).getTime();
      const now = Date.now();
      const diff = now - commenced;

      let status = "pre";
      if (completed) status = "ft";
      else if (diff > 0 && diff < 115 * 60 * 1000) status = "live";

      const homeScore = game.scores?.find(s => s.name === home)?.score ?? null;
      const awayScore = game.scores?.find(s => s.name === away)?.score ?? null;
      const minute = status === "live"
        ? Math.min(Math.floor(diff / 60000), 90).toString()
        : null;

      // Find goalscorers by fuzzy matching team names
      let goalscorers = [];
      for (const key of Object.keys(goalscoreMap)) {
        const [h, a] = key.split("|");
        const normalize = s => s.toLowerCase().replace(/[^a-z]/g, '');
        const hN = normalize(h), aN = normalize(a);
        const homeN = normalize(home), awayN = normalize(away);
        if (
          (hN === homeN || hN.includes(homeN.slice(0,4)) || homeN.includes(hN.slice(0,4))) &&
          (aN === awayN || aN.includes(awayN.slice(0,4)) || awayN.includes(aN.slice(0,4)))
        ) {
          goalscorers = goalscoreMap[key];
          break;
        }
      }

      return {
        home,
        away,
        home_score: homeScore !== null ? parseInt(homeScore) : null,
        away_score: awayScore !== null ? parseInt(awayScore) : null,
        minute,
        status,
        goalscorers,
      };
    });

    return res.status(200).json(scores);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

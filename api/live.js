export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "s-maxage=60");

  const apiKey = process.env.ODDS_API_KEY;

  try {
    // First try FIFA World Cup specific endpoint
    const response = await fetch(
      `https://api.the-odds-api.com/v4/sports/soccer_fifa_world_cup/scores/?apiKey=${apiKey}&daysFrom=1`
    );

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Odds API error ${response.status}: ${errText}`);
    }

    const games = await response.json();

    if (!games.length) {
      return res.status(200).json([]);
    }

    // Filter to only today's games (ET timezone)
    const nowET = new Date(new Date().toLocaleString("en-US", { timeZone: "America/New_York" }));
    const todayET = nowET.toISOString().split("T")[0];

    const todayGames = games.filter((game) => {
      const gameDate = new Date(game.commence_time)
        .toLocaleDateString("en-US", { timeZone: "America/New_York" })
        .split("/");
      const year = gameDate[2];
      const month = String(gameDate[0]).padStart(2, "0");
      const day = String(gameDate[1]).padStart(2, "0");
      const gameDateStr = `${year}-${month}-${day}`;
      return gameDateStr === todayET;
    });

    const scores = todayGames.map((game) => {
      const home = game.home_team;
      const away = game.away_team;
      const completed = game.completed;
      const commenced = new Date(game.commence_time).getTime();
      const now = Date.now();
      const diff = now - commenced;

      let status = "pre";
      if (completed) status = "ft";
      else if (diff > 0 && diff < 115 * 60 * 1000) status = "live";

      const homeScore = game.scores?.find((s) => s.name === home)?.score ?? null;
      const awayScore = game.scores?.find((s) => s.name === away)?.score ?? null;

      const minute = status === "live"
        ? Math.min(Math.floor(diff / 60000), 90).toString()
        : null;

      return {
        home,
        away,
        home_score: homeScore !== null ? parseInt(homeScore) : null,
        away_score: awayScore !== null ? parseInt(awayScore) : null,
        minute,
        status,
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
      };
    });

    return res.status(200).json(scores);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

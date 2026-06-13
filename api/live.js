export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "s-maxage=60");

  const apiKey = process.env.ODDS_API_KEY;

  try {
    // Get soccer matches from the Odds API
    const response = await fetch(
      `https://api.the-odds-api.com/v4/sports/soccer_fifa_world_cup/scores/?apiKey=${apiKey}&daysFrom=1`
    );

    if (!response.ok) {
      throw new Error(`Odds API error: ${response.status}`);
    }

    const games = await response.json();

    // Map to our format
    const scores = games.map((game) => {
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
        // Odds API doesn't provide these stats so we leave them null
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

import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "s-maxage=86400"); // cache 24hrs, same h2h all day

  const { home, away } = req.query;
  if (!home || !away) return res.status(400).json({ error: "Missing teams" });

  try {
    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 800,
      tools: [{ type: "web_search_20250305", name: "web_search" }],
      system: `You are a football history analyst. Search for World Cup and major tournament history. Return ONLY valid JSON, no markdown, no backticks, no explanation:
{
  "home": {
    "name": "Country",
    "wc_appearances": 12,
    "best_result": "Winner 1998",
    "recent_wc": "Round of 16 (2022)",
    "wc_record": "W24 D8 L12",
    "fifa_rank": 3
  },
  "away": { "same structure" },
  "h2h": {
    "total_meetings": 8,
    "home_wins": 4,
    "draws": 2,
    "away_wins": 2,
    "last_meetings": [
      { "year": 2022, "competition": "World Cup Group Stage", "score": "2-1", "winner": "home" },
      { "year": 2018, "competition": "Friendly", "score": "1-1", "winner": "draw" }
    ]
  }
}`,
      messages: [
        {
          role: "user",
          content: `Get World Cup history and head to head record for ${home} vs ${away}. Return only JSON.`,
        },
      ],
    });

    const text = (response.content || [])
      .map((i) => (i.type === "text" ? i.text : ""))
      .join("");
    const clean = text.replace(/```json|```/g, "").trim();
    const jsonMatch = clean.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON in response");
    const data = JSON.parse(jsonMatch[0]);
    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

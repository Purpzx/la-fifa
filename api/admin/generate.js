import Anthropic from "@anthropic-ai/sdk";
import { Redis } from "@upstash/redis";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const redis = new Redis({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
});

function todayKeyET() {
  const etDate = new Date(new Date().toLocaleString("en-US", { timeZone: "America/New_York" }));
  const y = etDate.getFullYear();
  const m = String(etDate.getMonth() + 1).padStart(2, "0");
  const d = String(etDate.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export default async function handler(req, res) {
  const { secret } = req.query;
  if (secret !== process.env.CRON_SECRET) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const key = todayKeyET();

  const systemPrompt = `You are a sharp World Cup 2026 betting analyst. Use web search to find confirmed lineups, injury reports, and current odds for today's matches.

Return ONLY a valid JSON array — no markdown, no backticks, no explanation.

For each match return:
{
  "home": "Country",
  "away": "Country",
  "kickoff": "9:00 PM ET",
  "venue": "Stadium, City",
  "stage": "Group Stage",
  "player_props": [
    {
      "title": "Player Name — Prop Description",
      "line": "Over 1.5 Shots on Target -115",
      "reasoning": "2-3 sentences with real data.",
      "book": "fanduel|draftkings|betmgm|bet365|fanatics",
      "edge": "+8% Edge",
      "confidence": 4
    }
  ],
  "game_props": [ same structure, 2 picks ],
  "team_props": [ same structure, 2 picks ]
}

Rules:
- EXCLUDE all goalscorer props
- Player props: shots on target, key passes, fouls, tackles, assists, saves, crosses, cards
- Game props: total corners, total cards, BTTS, total shots, result, BTTS+goals
- Team props: team corners, clean sheet, team shots, first corner, handicap
- book: pick from [fanduel, draftkings, betmgm, bet365, fanatics] with best line
- confidence: integer 1-5
- Return exactly 2 player props, 2 game props, 2 team props per match`;

  try {
    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 4000,
      tools: [{ type: "web_search_20250305", name: "web_search" }],
      system: systemPrompt,
      messages: [{
        role: "user",
        content: `Today is Friday June 12 2026. Generate picks for: USA vs Paraguay at 9:00 PM ET (Group D, SoFi Stadium). Search for confirmed lineups, injuries and odds. Return only the JSON array.`
      }],
    });

    const text = (response.content || []).map(i => i.type === "text" ? i.text : "").join("");
    const clean = text.replace(/```json|```/g, "").trim();
    const jsonMatch = clean.match(/\[[\s\S]*\]/);
    if (!jsonMatch) throw new Error("No JSON in response");
    const picks = JSON.parse(jsonMatch[0]);
    await redis.set(`picks:${key}`, JSON.stringify(picks), { ex: 60 * 60 * 36 });
    return res.status(200).json({ success: true, key, picks });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

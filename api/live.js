import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "s-maxage=60");

  const { matches } = req.query;
  if (!matches) return res.status(400).json({ error: "Missing matches" });

  try {
    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1000,
      tools: [{ type: "web_search_20250305", name: "web_search" }],
      system: `You are a live football score reporter. Search for current FIFA World Cup 2026 scores and stats. Return ONLY a valid JSON array, no markdown, no backticks:
[{"home":"Country","away":"Country","home_score":0,"away_score":0,"minute":"45","status":"live|pre|ft","home_shots":0,"away_shots":0,"home_shots_ot":0,"away_shots_ot":0,"home_possession":50,"away_possession":50,"home_corners":0,"away_corners":0,"home_cards":"0","away_cards":"0"}]`,
      messages: [{ role: "user", content: `Get current live scores and stats for these WC2026 matches: ${matches}. Return JSON array only.` }],
    });

    const text = (response.content || []).map(i => i.type === "text" ? i.text : "").join("");
    const clean = text.replace(/```json|```/g, "").trim();
    const jsonMatch = clean.match(/\[[\s\S]*\]/);
    if (!jsonMatch) throw new Error("No JSON");
    return res.status(200).json(JSON.parse(jsonMatch[0]));
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

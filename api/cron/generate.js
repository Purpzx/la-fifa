import Anthropic from "@anthropic-ai/sdk";
import { kv } from "@vercel/kv";

const client = new Anthropic();

// Today's date as a string key e.g. "2026-06-12"
function todayKey() {
  return new Date().toISOString().split("T")[0];
}

// World Cup 2026 match schedule
// Kickoff times in ET (24hr). Add all match days here.
const SCHEDULE = {
  "2026-06-11": [{ home: "Mexico", away: "Ecuador", kickoff_et: "21:00" }],
  "2026-06-12": [
    { home: "USA", away: "Honduras", kickoff_et: "18:00" },
    { home: "Canada", away: "Uruguay", kickoff_et: "21:00" },
  ],
  // --- ADD ALL WC26 MATCHES HERE AS SCHEDULE IS RELEASED ---
};

// Returns minutes until kickoff for the earliest match today
function minutesUntilFirstKickoff(matches) {
  const now = new Date();
  const nowET = new Date(
    now.toLocaleString("en-US", { timeZone: "America/New_York" })
  );
  const nowMinutes = nowET.getHours() * 60 + nowET.getMinutes();

  const kickoffMinutes = matches.map((m) => {
    const [h, min] = m.kickoff_et.split(":").map(Number);
    return h * 60 + min;
  });

  const earliest = Math.min(...kickoffMinutes);
  return earliest - nowMinutes;
}

async function generatePicks(matches) {
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "America/New_York",
  });

  const matchList = matches
    .map((m) => `${m.home} vs ${m.away} at ${m.kickoff_et} ET`)
    .join("\n");

  const systemPrompt = `You are a sharp World Cup 2026 betting analyst. Use web search to find confirmed lineups, injury reports, and current odds for today's matches.

Return ONLY a valid JSON array — no markdown, no backticks, no explanation.

For each match return:
{
  "home": "Country",
  "away": "Country",
  "kickoff": "6:00 PM ET",
  "venue": "Stadium, City",
  "stage": "Group Stage",
  "player_props": [
    {
      "title": "Player Name — Prop Description",
      "line": "Over 1.5 Shots on Target -115",
      "reasoning": "2-3 sentences with real data: form, matchup, lineup confirmation, injury news.",
      "book": "fanduel|draftkings|betmgm|bet365|fanatics",
      "edge": "+8% Edge",
      "confidence": 4
    }
  ],
  "game_props": [ same, 2 picks ],
  "team_props": [ same, 2 picks ]
}

Rules:
- EXCLUDE all goalscorer props (first/last/anytime scorer)
- Player props: shots on target, key passes, fouls, tackles, assists, saves, crosses, cards
- Game props: total corners, total cards, BTTS, total shots, result, BTTS+goals
- Team props: team corners, clean sheet, team shots, first corner, handicap
- Pick the book from [fanduel, draftkings, betmgm, bet365, fanatics] with the best line
- confidence: integer 1-5
- reasoning: cite confirmed lineup data, injuries, h2h, recent form
- Return exactly 2 player props, 2 game props, 2 team props per match`;

  const userPrompt = `Today is ${today}. Today's matches:\n${matchList}\n\nSearch for confirmed lineups, injuries, and odds. Generate picks for each match. Return only the JSON array.`;

  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 4000,
    tools: [{ type: "web_search_20250305", name: "web_search" }],
    system: systemPrompt,
    messages: [{ role: "user", content: userPrompt }],
  });

  const fullText = (response.content || [])
    .map((item) => (item.type === "text" ? item.text : ""))
    .filter(Boolean)
    .join("\n");

  const clean = fullText.replace(/```json|```/g, "").trim();
  const jsonMatch = clean.match(/\[[\s\S]*\]/);
  if (!jsonMatch) throw new Error("No valid JSON in Claude response");
  return JSON.parse(jsonMatch[0]);
}

export default async function handler(req, res) {
  // Security: only allow Vercel cron calls
  const authHeader = req.headers["authorization"];
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const key = todayKey();
  const todayMatches = SCHEDULE[key];

  // No matches today
  if (!todayMatches || todayMatches.length === 0) {
    return res.status(200).json({ skipped: true, reason: "No matches today" });
  }

  // Already generated today
  const existing = await kv.get(`picks:${key}`);
  if (existing) {
    return res
      .status(200)
      .json({ skipped: true, reason: "Picks already generated today" });
  }

  // Check timing — only generate 60-90 min before first kickoff
  const minsUntil = minutesUntilFirstKickoff(todayMatches);
  if (minsUntil > 90 || minsUntil < 0) {
    return res.status(200).json({
      skipped: true,
      reason: `Not in window. Minutes until kickoff: ${minsUntil}`,
    });
  }

  // Generate and store
  try {
    const picks = await generatePicks(todayMatches);
    await kv.set(`picks:${key}`, JSON.stringify(picks), {
      ex: 60 * 60 * 36, // expire after 36 hours
    });
    return res.status(200).json({ success: true, matches: picks.length });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

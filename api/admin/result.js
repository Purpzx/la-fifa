import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
});

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");

  const { secret, date, pick, result } = req.query;

  if (secret !== process.env.CRON_SECRET) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (!date || !pick || !result) {
    return res.status(400).json({ error: "Missing date, pick or result" });
  }

  if (!["W", "L", "P"].includes(result.toUpperCase())) {
    return res.status(400).json({ error: "Result must be W, L or P" });
  }

  const key = `result:${date}:${pick}`;
  const data = {
    date,
    pick: decodeURIComponent(pick),
    result: result.toUpperCase(),
    timestamp: new Date().toISOString(),
  };

  await redis.set(key, JSON.stringify(data), { ex: 60 * 60 * 24 * 90 });

  return res.status(200).json({ success: true, key, data });
}

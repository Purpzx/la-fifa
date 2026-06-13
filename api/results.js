import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
});

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "s-maxage=60");

  try {
    // Get all result keys
    const keys = await redis.keys("result:*");
    const results = {};

    if (keys.length) {
      for (const key of keys) {
        const val = await redis.get(key);
        results[key.replace("result:", "")] = typeof val === "string" ? JSON.parse(val) : val;
      }
    }

    // Get overall record
    let wins = 0, losses = 0, pushes = 0, units = 0;
    for (const key of Object.keys(results)) {
      const r = results[key];
      if (r.result === "W") { wins++; units += 0.91; }
      else if (r.result === "L") { losses++; units -= 1; }
      else if (r.result === "P") pushes++;
    }

    return res.status(200).json({
      results,
      record: { wins, losses, pushes },
      units: Math.round(units * 100) / 100,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

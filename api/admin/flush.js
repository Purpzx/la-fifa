import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
});

export default async function handler(req, res) {
  const { secret, type } = req.query;
  if (secret !== process.env.CRON_SECRET) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    if (type === "results") {
      // Clear all result keys
      const keys = await redis.keys("result:*");
      if (keys.length) {
        for (const key of keys) await redis.del(key);
      }
      return res.status(200).json({ deleted: `${keys.length} results` });
    } else {
      // Clear today's picks
      const today = new Date().toLocaleString("en-US", { timeZone: "America/New_York" });
      const etDate = new Date(today);
      const key = `${etDate.getFullYear()}-${String(etDate.getMonth()+1).padStart(2,"0")}-${String(etDate.getDate()).padStart(2,"0")}`;
      await redis.del(`picks:${key}`);
      return res.status(200).json({ deleted: `picks:${key}` });
    }
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

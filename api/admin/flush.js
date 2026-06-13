import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
});

export default async function handler(req, res) {
  const { secret } = req.query;
  if (secret !== process.env.CRON_SECRET) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const today = new Date().toISOString().split("T")[0];
  await redis.del(`picks:${today}`);
  return res.status(200).json({ deleted: `picks:${today}` });
}

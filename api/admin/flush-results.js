import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
});

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");

  const { secret, date, mode } = req.query;
  if (secret !== process.env.CRON_SECRET) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    // Get all result keys, optionally filtered by date
    const pattern = date ? `result:${date}:*` : "result:*";
    const keys = await redis.keys(pattern);

    if (!keys.length) {
      return res.status(200).json({ message: "No result keys found", pattern });
    }

    const deleted = [];
    const kept = [];

    for (const key of keys) {
      const val = await redis.get(key);
      const parsed = typeof val === "string" ? JSON.parse(val) : val;

      // mode=all deletes everything, default only deletes bad pushes
      const isBadPush = parsed?.result === "P" &&
        (parsed?.reason?.includes("Could not determine") || parsed?.reason?.includes("Could not grade"));

      if (mode === "all" || isBadPush) {
        await redis.del(key);
        deleted.push({ key, result: parsed?.result, reason: parsed?.reason });
      } else {
        kept.push({ key, result: parsed?.result });
      }
    }

    return res.status(200).json({
      deleted: deleted.length,
      kept: kept.length,
      deletedKeys: deleted,
      message: `Deleted ${deleted.length} bad results. Now run auto-results to re-grade.`,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

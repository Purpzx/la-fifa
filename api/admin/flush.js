import { Redis } from "@upstash/redis";

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
  const { secret, type, date } = req.query;
  if(secret !== process.env.CRON_SECRET) {
    return res.status(401).json({error:"Unauthorized"});
  }

  const dateKey = date || todayKeyET();

  try {
    if(type === "results") {
      const keys = await redis.keys("result:*");
      if(keys.length) {
        for(const key of keys) await redis.del(key);
      }
      return res.status(200).json({success:true, deleted:`${keys.length} results`});
    } else {
      // Flush all per-match pick keys for the date
      const keys = await redis.keys(`picks:${dateKey}:*`);
      // Also try old format
      const oldKey = `picks:${dateKey}`;
      const oldExists = await redis.get(oldKey);
      if(oldExists) await redis.del(oldKey);

      if(keys.length) {
        for(const key of keys) await redis.del(key);
      }
      return res.status(200).json({
        success: true,
        deleted: `${keys.length} match picks${oldExists?' + legacy day key':''}`,
        date: dateKey
      });
    }
  } catch(err) {
    return res.status(500).json({error:err.message});
  }
}

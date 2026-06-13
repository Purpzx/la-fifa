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
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate");

  try {
    const key = todayKeyET();
    const raw = await redis.get(`picks:${key}`);

    if (!raw) {
      return res.status(200).json({
        status: "pending",
        message: "Picks not yet generated. Check back closer to kickoff.",
      });
    }

    const picks = typeof raw === "string" ? JSON.parse(raw) : raw;

    return res.status(200).json({
      status: "ready",
      date: key,
      picks,
    });
  } catch (err) {
    return res.status(500).json({
      status: "error",
      message: "Failed to load picks. Try again shortly.",
    });
  }
}

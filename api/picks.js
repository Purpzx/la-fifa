import { kv } from "@vercel/kv";

function todayKey() {
  return new Date().toISOString().split("T")[0];
}

export default async function handler(req, res) {
  // Allow frontend to fetch this
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate");

  try {
    const key = todayKey();
    const raw = await kv.get(`picks:${key}`);

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

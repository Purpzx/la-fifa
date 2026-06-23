export default async function handler(req, res) {
  const secret = process.env.CRON_SECRET;
  const baseUrl = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "https://minchia.vercel.app";

  try {
    const r = await fetch(`${baseUrl}/api/admin/auto-results?secret=${secret}`);
    const data = await r.json();
    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

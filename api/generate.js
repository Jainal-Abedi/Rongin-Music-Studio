const MODEL = "fal-ai/ace-step";
const MAX_LYRICS = 12000;
const MAX_PROMPT = 5000;

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const key = process.env.FAL_KEY;
  if (!key) return res.status(503).json({ error: "Live API is not configured. Add FAL_KEY in Vercel Environment Variables." });

  try {
    const { title, lyrics, prompt, duration } = req.body || {};
    const seconds = Number(duration);
    if (typeof lyrics !== "string" || !lyrics.trim() || lyrics.length > MAX_LYRICS) {
      return res.status(400).json({ error: "Lyrics are required and must be under 12,000 characters." });
    }
    if (typeof prompt !== "string" || !prompt.trim() || prompt.length > MAX_PROMPT) {
      return res.status(400).json({ error: "A music style prompt is required and must be under 5,000 characters." });
    }
    if (![60, 90, 120].includes(seconds)) return res.status(400).json({ error: "Duration must be 60, 90, or 120 seconds." });

    const upstream = await fetch(`https://queue.fal.run/${MODEL}`, {
      method: "POST",
      headers: {
        "Authorization": `Key ${key}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        tags: prompt,
        lyrics,
        duration: seconds,
        enable_safety_checker: true
      })
    });
    const data = await upstream.json().catch(() => ({}));
    if (!upstream.ok) {
      return res.status(upstream.status).json({ error: data.detail || data.error || "fal.ai rejected the request." });
    }
    return res.status(200).json({ requestId: data.request_id, title: String(title || "Untitled track").slice(0, 80) });
  } catch (error) {
    return res.status(500).json({ error: "Server error while starting generation." });
  }
}
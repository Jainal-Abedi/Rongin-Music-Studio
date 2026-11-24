const MODEL = "fal-ai/ace-step";
export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });
  const key = process.env.FAL_KEY;
  if (!key) return res.status(503).json({ error: "Live API is not configured." });
  const id = String(req.query.id || "");
  if (!/^[0-9a-f-]{30,40}$/i.test(id)) return res.status(400).json({ error: "Invalid request ID." });

  const headers = { "Authorization": `Key ${key}` };
  try {
    const statusResponse = await fetch(`https://queue.fal.run/${MODEL}/requests/${id}/status`, { headers });
    const statusData = await statusResponse.json().catch(() => ({}));
    if (!statusResponse.ok) return res.status(statusResponse.status).json({ error: statusData.detail || "Could not read request status." });

    if (statusData.status !== "COMPLETED") {
      return res.status(200).json({ status: statusData.status || "IN_PROGRESS" });
    }
    if (statusData.error || statusData.error_type) {
      return res.status(200).json({ status: "FAILED", error: statusData.error || statusData.error_type });
    }

    const resultResponse = await fetch(`https://queue.fal.run/${MODEL}/requests/${id}`, { headers });
    const resultData = await resultResponse.json().catch(() => ({}));
    if (!resultResponse.ok) return res.status(resultResponse.status).json({ error: resultData.detail || "Could not retrieve generated audio." });
    const audioUrl = resultData.audio && resultData.audio.url;
    if (!audioUrl) return res.status(502).json({ error: "The model completed but returned no audio URL." });
    const parsed = new URL(audioUrl);
    if (parsed.hostname !== "storage.googleapis.com" || !parsed.pathname.startsWith("/falserverless/")) {
      return res.status(502).json({ error: "Unexpected audio storage host." });
    }
    return res.status(200).json({
      status: "COMPLETED",
      audioUrl,
      downloadUrl: `/api/download?url=${encodeURIComponent(audioUrl)}`,
      extension: (resultData.audio.content_type || "").includes("mpeg") ? "mp3" : "wav"
    });
  } catch {
    return res.status(500).json({ error: "Server error while checking generation." });
  }
}
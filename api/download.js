export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).send("Method not allowed");
  let url;
  try { url = new URL(String(req.query.url || "")); }
  catch { return res.status(400).send("Invalid audio URL"); }
  if (url.hostname !== "storage.googleapis.com" || !url.pathname.startsWith("/falserverless/")) {
    return res.status(400).send("Audio URL not allowed");
  }
  try {
    const upstream = await fetch(url.toString());
    if (!upstream.ok) return res.status(upstream.status).send("Could not fetch audio");
    const type = upstream.headers.get("content-type") || "audio/wav";
    const filename = url.pathname.split("/").pop().replace(/[^a-zA-Z0-9._-]/g, "") || "generated-audio.wav";
    res.setHeader("Content-Type", type);
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.setHeader("Cache-Control", "private, max-age=300");
    const arrayBuffer = await upstream.arrayBuffer();
    return res.status(200).send(Buffer.from(arrayBuffer));
  } catch {
    return res.status(500).send("Download failed");
  }
}
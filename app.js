const $ = (id) => document.getElementById(id);
const ENDPOINT = "/api";
let selectedDuration = 60;
let currentTrack = null;
let toastTimer;

const savedMode = localStorage.getItem("rms-demo-mode");
$("demoToggle").checked = savedMode === null ? true : savedMode === "true";

function showToast(message) {
  const el = $("toast");
  el.textContent = message;
  el.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("show"), 2600);
}
function setStatus(message, error = false) {
  $("statusMessage").textContent = message;
  $("statusMessage").style.color = error ? "#ff9bad" : "var(--mint)";
}
function updateMode() {
  const demo = $("demoToggle").checked;
  $("modeLabel").textContent = demo ? "Demo mode active" : "Live generation";
  $("modeDot").classList.toggle("live", !demo);
}
function updateCount() {
  $("charCount").textContent = `${$("lyrics").value.length} / 12000`;
}
$("lyrics").addEventListener("input", updateCount);
updateCount();
$("demoToggle").addEventListener("change", () => {
  localStorage.setItem("rms-demo-mode", String($("demoToggle").checked));
  updateMode();
});
updateMode();

$("settingsBtn").addEventListener("click", () => {
  $("settingsModal").classList.remove("hidden");
  checkServer();
});
$("closeSettingsBtn").addEventListener("click", closeSettings);
$("closeSettingsDone").addEventListener("click", closeSettings);
$("settingsModal").addEventListener("click", (e) => {
  if (e.target === $("settingsModal")) closeSettings();
});
function closeSettings() { $("settingsModal").classList.add("hidden"); }

async function checkServer() {
  try {
    const res = await fetch(`${ENDPOINT}/health`);
    const data = await res.json();
    $("serverState").textContent = data.configured
      ? "✓ Live API configured on server"
      : "Demo is ready. Add FAL_KEY in Vercel Environment Variables for live generation.";
  } catch {
    $("serverState").textContent = "Server API not found. Deploy the project to Vercel to enable live generation.";
  }
}
checkServer();

$("pasteLyricsBtn").addEventListener("click", async () => {
  try {
    const text = await navigator.clipboard.readText();
    if (!text) return showToast("Clipboard is empty.");
    $("lyrics").value = text.slice(0, 12000);
    updateCount();
    showToast("Lyrics pasted.");
  } catch {
    $("lyrics").focus();
    showToast("Paste permission unavailable. Long-press the lyrics box and choose Paste.");
  }
});
$("clearLyricsBtn").addEventListener("click", () => {
  $("lyrics").value = "";
  updateCount();
  $("lyrics").focus();
});
document.querySelectorAll("[data-preset]").forEach((button) => {
  button.addEventListener("click", () => {
    $("stylePrompt").value = button.dataset.preset;
    showToast("Music preset applied.");
  });
});
document.querySelectorAll(".duration").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".duration").forEach((b) => b.classList.remove("active"));
    button.classList.add("active");
    selectedDuration = Number(button.dataset.duration);
  });
});

function makeWaveform() {
  const wave = $("waveform");
  wave.innerHTML = "";
  for (let i = 0; i < 54; i++) {
    const bar = document.createElement("i");
    const h = 8 + Math.abs(Math.sin(i * 1.71) * Math.cos(i * .39)) * 25;
    bar.style.height = `${h}px`;
    wave.appendChild(bar);
  }
}
function setPlayer(track) {
  currentTrack = track;
  $("emptyPlayer").classList.add("hidden");
  $("trackPlayer").classList.remove("hidden");
  $("trackName").textContent = track.title;
  $("trackInfo").textContent = `${track.duration}s · ${track.demo ? "Demo audio" : "fal.ai ACE-Step"}`;
  $("audioPlayer").src = track.audioUrl;
  $("downloadBtn").href = track.downloadUrl || track.audioUrl;
  $("downloadBtn").download = `${safeFileName(track.title)}.${track.extension || "wav"}`;
  makeWaveform();
}
function safeFileName(value) {
  return (value || "music").replace(/[^\p{L}\p{N}\-_ ]/gu, "").trim().replace(/\s+/g, "-") || "music";
}
function createDemoWavUrl() {
  const sampleRate = 22050, seconds = 6, count = sampleRate * seconds;
  const buffer = new ArrayBuffer(44 + count * 2);
  const view = new DataView(buffer);
  const write = (offset, str) => { for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i)); };
  write(0, "RIFF"); view.setUint32(4, 36 + count * 2, true); write(8, "WAVE");
  write(12, "fmt "); view.setUint32(16, 16, true); view.setUint16(20, 1, true);
  view.setUint16(22, 1, true); view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true); view.setUint16(32, 2, true); view.setUint16(34, 16, true);
  write(36, "data"); view.setUint32(40, count * 2, true);
  const notes = [261.63, 329.63, 392, 523.25, 392, 329.63, 293.66, 349.23];
  for (let i = 0; i < count; i++) {
    const t = i / sampleRate, beat = Math.floor(t * 2);
    const f = notes[beat % notes.length];
    const envelope = Math.min(1, (t % .5) * 15) * Math.max(0, 1 - (t % .5) * 1.7);
    const sample = (Math.sin(2 * Math.PI * f * t) * .16 + Math.sin(2 * Math.PI * f * 2 * t) * .035) * envelope;
    view.setInt16(44 + i * 2, Math.max(-1, Math.min(1, sample)) * 32767, true);
  }
  return URL.createObjectURL(new Blob([buffer], {type:"audio/wav"}));
}
function addHistory(track) {
  const history = JSON.parse(localStorage.getItem("rms-history") || "[]");
  const item = {...track, audioUrl: track.demo ? track.audioUrl : track.audioUrl, createdAt: new Date().toISOString()};
  history.unshift(item);
  localStorage.setItem("rms-history", JSON.stringify(history.slice(0, 15)));
  renderHistory();
}
function renderHistory() {
  const history = JSON.parse(localStorage.getItem("rms-history") || "[]");
  const list = $("historyList");
  list.innerHTML = "";
  if (!history.length) {
    list.innerHTML = '<div class="history-empty">এখনও কোনো গান সেভ করা হয়নি।</div>';
    return;
  }
  history.forEach((item, index) => {
    const row = document.createElement("div");
    row.className = "history-item";
    const date = new Date(item.createdAt).toLocaleDateString();
    row.innerHTML = `<div class="mini-cover">♫</div><div class="history-meta"><strong></strong><span></span></div><button type="button">Play</button>`;
    row.querySelector("strong").textContent = item.title;
    row.querySelector("span").textContent = `${item.duration}s · ${date}`;
    row.querySelector("button").addEventListener("click", () => {
      setPlayer(item);
      $("playerPanel").scrollIntoView({behavior:"smooth", block:"center"});
    });
    list.appendChild(row);
  });
}
$("saveHistoryBtn").addEventListener("click", () => {
  if (!currentTrack) return;
  addHistory(currentTrack);
  showToast("Track saved to local history.");
});
$("clearHistoryBtn").addEventListener("click", () => {
  localStorage.removeItem("rms-history");
  renderHistory();
  showToast("History cleared.");
});
renderHistory();

async function waitForFal(requestId) {
  const started = Date.now();
  while (Date.now() - started < 5 * 60 * 1000) {
    const response = await fetch(`${ENDPOINT}/status?id=${encodeURIComponent(requestId)}`);
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Could not check generation status.");
    if (data.status === "COMPLETED" && data.audioUrl) return data;
    if (data.status === "FAILED") throw new Error(data.error || "Music generation failed.");
    setStatus(data.status === "IN_QUEUE" ? "Queue-তে অপেক্ষা করছে…" : "মিউজিক তৈরি হচ্ছে…");
    await new Promise(resolve => setTimeout(resolve, 3500));
  }
  throw new Error("Generation is taking longer than expected. Try again later.");
}
$("generateBtn").addEventListener("click", async () => {
  const title = $("songTitle").value.trim() || "Untitled track";
  const lyrics = $("lyrics").value.trim();
  const prompt = $("stylePrompt").value.trim();
  if (!lyrics) return setStatus("প্রথমে Lyrics লিখুন বা Paste করুন।", true);
  if (!prompt) return setStatus("Music style prompt লিখুন।", true);
  if (lyrics.length > 12000 || prompt.length > 5000) return setStatus("Input is too long.", true);

  const button = $("generateBtn");
  button.disabled = true;
  button.innerHTML = "◌ Generating…";
  try {
    let track;
    if ($("demoToggle").checked) {
      setStatus("Demo audio তৈরি হচ্ছে…");
      await new Promise(resolve => setTimeout(resolve, 800));
      const url = createDemoWavUrl();
      track = {title, duration:selectedDuration, audioUrl:url, downloadUrl:url, extension:"wav", demo:true};
    } else {
      setStatus("fal.ai-তে request পাঠানো হচ্ছে…");
      const response = await fetch(`${ENDPOINT}/generate`, {
        method:"POST", headers:{"Content-Type":"application/json"},
        body:JSON.stringify({title, lyrics, prompt, duration:selectedDuration})
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not start generation.");
      setStatus("Request queue-তে পাঠানো হয়েছে…");
      const result = await waitForFal(data.requestId);
      track = {title, duration:selectedDuration, audioUrl:result.audioUrl, downloadUrl:result.downloadUrl, extension:result.extension || "wav", demo:false};
    }
    setPlayer(track);
    addHistory(track);
    setStatus("গান তৈরি হয়েছে! নিচের Player থেকে শুনুন।");
    $("playerPanel").scrollIntoView({behavior:"smooth", block:"start"});
  } catch (error) {
    setStatus(error.message || "Something went wrong.", true);
  } finally {
    button.disabled = false;
    button.innerHTML = "<span>✦</span> Generate music";
  }
});

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => navigator.serviceWorker.register("/sw.js").catch(() => {}));
}
let deferredInstallPrompt = null;
window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  deferredInstallPrompt = event;
  showToast("এই অ্যাপটি Home Screen-এ Install করা যাবে।");
});
# Rongin Bengali Music Studio — বাংলা সেটআপ গাইড

## কী আছে
- মোবাইল-ফার্স্ট ডার্ক স্টুডিও UI
- বাংলা Unicode lyrics, style prompt, quick presets, 60/90/120s duration
- Demo mode: API key ছাড়াই WAV test audio, player, download
- Live mode: fal.ai ACE-Step lyrics-to-audio API
- Queue status polling, audio download endpoint, local recent-history
- PWA manifest, service worker, Android install icon
- API key server-side `FAL_KEY` environment variable-এ থাকে; browser/localStorage-এ নয়

## ফোল্ডার
```text
bengali-music-studio/
├── api/
│   ├── download.js
│   ├── generate.js
│   ├── health.js
│   └── status.js
├── icons/
│   ├── icon.svg
│   ├── icon-192.png
│   └── icon-512.png
├── app.js
├── index.html
├── manifest.json
├── package.json
├── styles.css
├── sw.js
└── vercel.json
```

## Vercel-এ ফ্রি deploy
1. ZIP ফাইলটি extract করুন।
2. GitHub-এ নতুন repository তৈরি করে এই ফোল্ডারের সব ফাইল upload করুন।
3. Vercel-এ GitHub দিয়ে sign in করে **Add New → Project** চাপুন।
4. আপনার repository Import করুন। Framework Preset: **Other**; Root Directory: project folder.
5. Deploy চাপুন। Static UI এবং Demo Mode কাজ করবে।
6. Live music generation চাইলে fal.ai account/API access সেটআপ করে API key নিন। API billing/usage আপনার provider account অনুযায়ী হতে পারে; খরচ আগে দেখে নিন।
7. Vercel Project → **Settings → Environment Variables** খুলুন:
   - Name: `FAL_KEY`
   - Value: আপনার fal API key
   - Environment: Production (Preview-ও চাইলে)
   Save করুন।
8. Deployments tab থেকে **Redeploy** করুন। অ্যাপ খুলে Settings-এ গিয়ে “Live API configured on server” দেখুন।
9. অ্যাপে Demo mode OFF করে Live generation চালান।

**গুরুত্বপূর্ণ:** API key কখনো `app.js`, `index.html`, GitHub repository, বা localStorage-এ বসাবেন না। Environment variable secret রাখে। API ব্যবহারে টাকা লাগতে পারে; usage limit/budget সেট করুন।

## Android Chrome-এ Install
1. Vercel deployment URL Chrome-এ খুলুন।
2. Chrome menu (⋮) → **Add to Home screen** অথবা **Install app** চাপুন।
3. Add/Install নিশ্চিত করুন। Home Screen-এ Rongin Studio icon আসবে।
4. প্রথমবার app shell cache হওয়ার পর UI offline-এ খুলতে পারে। Live generation এবং audio download-এর জন্য internet দরকার।

## iPhone
Safari-তে deployment URL খুলুন → Share → Add to Home Screen.

## কীভাবে ব্যবহার করবেন
1. Song title লিখুন।
2. Bengali Lyrics box-এ শুধু গাওয়ার lyrics এবং `[Intro]`, `[Verse]`, `[Chorus]`, `[Bridge]`, `[Outro]`-এর মতো section tags দিন।
3. Instrumental break চাইলে Lyrics-এ শুধু `[Instrumental Break]` লিখুন; নির্দেশনামূলক বাক্য Lyrics-এ লিখবেন না। Music style prompt-এ “instrumental-only, no vocals” নির্দেশ দিন।
4. Style prompt লিখুন বা preset chip চাপুন।
5. 60s / 90s / 120s বেছে নিন।
6. প্রথমে Demo mode দিয়ে player পরীক্ষা করুন। Live mode-এ fal API ব্যবহার হবে।
7. তৈরি গান Player থেকে শুনুন এবং Download audio চাপুন।

## সীমাবদ্ধতা
- fal.ai ACE-Step endpoint-এর model schema-তে lyrics, tags, duration আছে। UI-র 60/90/120 হলো requested target; model-এর বাস্তব output duration আলাদা হতে পারে।
- এই model endpoint সাধারণত WAV audio ফেরত দেয়। অ্যাপ WAV/returned format ডাউনলোড করে; আলাদা MP3 transcoding অন্তর্ভুক্ত নয়।
- History metadata browser-এর localStorage-এ থাকে। Audio file নিজে browser history-তে কপি হয় না; তৈরি audio URL provider storage-এ থাকে এবং provider retention policy অনুযায়ী মেয়াদ শেষ হতে পারে। গুরুত্বপূর্ণ ফাইল সঙ্গে সঙ্গে ফোনে download করুন।
- Demo audio কেবল UI test; এটি আসল AI-generated গান নয়।
- PWA service worker UI assets cache করে; API response cache করে না।

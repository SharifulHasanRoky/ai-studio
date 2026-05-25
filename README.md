# AI Studio — Image & Video Generation

A ChatGPT-style web UI for generating **images** and **videos** using free-tier APIs from
**Google Gemini** and **xAI Grok**.

- **Image generation:** Gemini (`gemini-2.5-flash-image-preview`) or Grok (`grok-2-image-1212`)
- **Video generation:** Gemini Veo (`veo-3.0-generate-preview`, falls back to `veo-2.0-generate-001`)

> Note: xAI does not currently expose a public video-generation API, so video mode is Gemini-only.

---

## One-Click Deploy (Recommended)

Click below and it will ask for your API keys — that's it, you'll get a live URL:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FSharifulHasanRoky%2FApps%2Ftree%2Fmain%2Fai-studio&env=GEMINI_API_KEY,GROK_API_KEY&envDescription=Get%20free%20API%20keys%20from%20Google%20AI%20Studio%20and%20xAI&envLink=https%3A%2F%2Faistudio.google.com%2Fapikey&project-name=ai-studio&repository-name=ai-studio&root-directory=ai-studio)

### What you need before clicking:

| Key | Where to get (FREE) | Link |
|-----|---------------------|------|
| **GEMINI_API_KEY** | Google AI Studio | https://aistudio.google.com/apikey |
| **GROK_API_KEY** | xAI Console | https://console.x.ai |

1. Get your free keys from the links above
2. Click the "Deploy with Vercel" button
3. Sign in with GitHub
4. Paste your API keys when prompted
5. Done! You'll get a live URL like `https://ai-studio-xyz.vercel.app`

---

## Local Development (Optional)

```bash
cd ai-studio
npm install
cp .env.local.example .env.local
# Fill in GEMINI_API_KEY and (optionally) GROK_API_KEY
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## How to Use

1. Open your deployed URL
2. Select **Image** or **Video** mode at the bottom
3. Choose **Gemini** or **Grok** as the AI provider (Video only works with Gemini)
4. Type a prompt like:
   - "A cute cat wearing sunglasses on a beach"
   - "Cyberpunk Tokyo street at night, neon reflections"
   - "Cinematic 5s clip: waves crashing on black sand beach"
5. Press Enter and wait for the result
6. Click **Download** to save the generated image/video

---

## Stack

- Next.js 14 (App Router) · React 18 · TypeScript
- Tailwind CSS for the dark ChatGPT-like theme
- Server-side API routes proxy requests to Gemini and Grok so keys never reach the browser
- Conversations persisted to `localStorage`

## Project layout

```
app/
  page.tsx              Main chat UI + state
  layout.tsx            Root layout
  globals.css
  api/image/route.ts    POST { prompt, provider } -> { media, text }
  api/video/route.ts    POST { prompt }           -> { media, text }
components/
  Sidebar.tsx           Conversation list
  ChatArea.tsx          Message list + empty state
  Message.tsx           User / assistant bubble (image, video, errors)
  Composer.tsx          Input + mode/provider selector
lib/
  gemini.ts             Gemini image (sync) + Veo video (long-running poll)
  grok.ts               Grok image (OpenAI-compatible)
```

## How it works

- **Image** requests go to `/api/image` which calls either Gemini's `generateContent`
  endpoint with `responseModalities: ["TEXT","IMAGE"]` or Grok's OpenAI-compatible
  `/v1/images/generations`. Returned base64 is sent back as a `data:` URL so the client
  can display and download it without any storage layer.
- **Video** requests go to `/api/video` which calls Gemini's `predictLongRunning`,
  polls the operation, fetches the resulting MP4 with the API key, and returns it
  inline as a base64 `data:` URL. (Generation typically takes 30–90s.)

## Limitations

- Video generation depends on Veo quota of your Gemini API key.
- Conversation history is local to your browser (no auth/database).
- Streaming is not implemented; responses are returned once complete.

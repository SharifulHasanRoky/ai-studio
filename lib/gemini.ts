// Google Gemini API client (image + video).
// Docs:
//   Image: https://ai.google.dev/gemini-api/docs/image-generation
//   Video: https://ai.google.dev/gemini-api/docs/video

const BASE = "https://generativelanguage.googleapis.com/v1beta";

// Models — listed newest first; we fall back if a preview model is unavailable.
const IMAGE_MODELS = [
  "gemini-2.5-flash-image-preview",
  "gemini-2.0-flash-preview-image-generation"
];

const VIDEO_MODELS = [
  "veo-3.0-generate-preview",
  "veo-2.0-generate-001"
];

function requireKey(): string {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    throw new Error("GEMINI_API_KEY is not set. Add it to .env.local");
  }
  return key;
}

type Media = { kind: "image" | "video"; url: string; mime?: string };

export async function generateImageGemini(prompt: string): Promise<{ media: Media[]; text?: string }> {
  const key = requireKey();
  let lastErr: string | null = null;

  for (const model of IMAGE_MODELS) {
    const url = `${BASE}/models/${model}:generateContent?key=${encodeURIComponent(key)}`;
    const body = {
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { responseModalities: ["TEXT", "IMAGE"] }
    };

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });

    if (!res.ok) {
      lastErr = `${model}: ${res.status} ${await safeText(res)}`;
      // Try next model if this one is unavailable / not enabled.
      if (res.status === 404 || res.status === 400) continue;
      throw new Error(lastErr);
    }

    const data = await res.json();
    const parts = data?.candidates?.[0]?.content?.parts || [];
    const media: Media[] = [];
    let text: string | undefined;

    for (const p of parts) {
      if (p.inlineData?.data) {
        const mime = p.inlineData.mimeType || "image/png";
        media.push({ kind: "image", url: `data:${mime};base64,${p.inlineData.data}`, mime });
      } else if (p.inline_data?.data) {
        const mime = p.inline_data.mime_type || "image/png";
        media.push({ kind: "image", url: `data:${mime};base64,${p.inline_data.data}`, mime });
      } else if (typeof p.text === "string") {
        text = (text ? text + "\n" : "") + p.text;
      }
    }

    if (media.length === 0) {
      // Some safety blocks return only text; surface it.
      if (text) return { media: [], text };
      lastErr = `${model}: no image returned`;
      continue;
    }
    return { media, text };
  }

  throw new Error(lastErr || "Gemini image generation failed");
}

export async function generateVideoGemini(prompt: string): Promise<{ media: Media[]; text?: string }> {
  const key = requireKey();
  let lastErr: string | null = null;

  for (const model of VIDEO_MODELS) {
    try {
      const startUrl = `${BASE}/models/${model}:predictLongRunning?key=${encodeURIComponent(key)}`;
      const body = {
        instances: [{ prompt }],
        parameters: { aspectRatio: "16:9", personGeneration: "allow_adult" }
      };
      const startRes = await fetch(startUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });

      if (!startRes.ok) {
        lastErr = `${model}: ${startRes.status} ${await safeText(startRes)}`;
        if (startRes.status === 404 || startRes.status === 400) continue;
        throw new Error(lastErr);
      }

      const op = await startRes.json();
      const opName: string | undefined = op?.name;
      if (!opName) {
        lastErr = `${model}: missing operation name`;
        continue;
      }

      // Poll until done. Veo typically takes 30–90s.
      const finished = await pollOperation(opName, key);
      const videoUri: string | undefined =
        finished?.response?.generatedVideos?.[0]?.video?.uri ||
        finished?.response?.generateVideoResponse?.generatedSamples?.[0]?.video?.uri;

      if (!videoUri) {
        lastErr = `${model}: no video URI in response`;
        continue;
      }

      // The URI requires the API key; download it server-side and return as data URL.
      const videoRes = await fetch(`${videoUri}${videoUri.includes("?") ? "&" : "?"}key=${encodeURIComponent(key)}`);
      if (!videoRes.ok) {
        lastErr = `${model}: failed to fetch video (${videoRes.status})`;
        continue;
      }
      const buf = Buffer.from(await videoRes.arrayBuffer());
      const mime = videoRes.headers.get("content-type") || "video/mp4";
      const url = `data:${mime};base64,${buf.toString("base64")}`;
      return { media: [{ kind: "video", url, mime }] };
    } catch (e: any) {
      lastErr = e?.message || String(e);
      continue;
    }
  }

  throw new Error(lastErr || "Gemini video generation failed");
}

async function pollOperation(name: string, key: string, timeoutMs = 5 * 60 * 1000) {
  const url = `${BASE}/${name}?key=${encodeURIComponent(key)}`;
  const start = Date.now();
  let delay = 5000;
  while (Date.now() - start < timeoutMs) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Operation poll failed: ${res.status} ${await safeText(res)}`);
    const data = await res.json();
    if (data?.done) {
      if (data.error) throw new Error(data.error.message || "Operation failed");
      return data;
    }
    await sleep(delay);
    delay = Math.min(delay + 2000, 15000);
  }
  throw new Error("Video generation timed out (>5 min)");
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function safeText(res: Response): Promise<string> {
  try {
    const t = await res.text();
    return t.slice(0, 500);
  } catch {
    return "";
  }
}

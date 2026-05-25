// xAI Grok image generation (OpenAI-compatible).
// Docs: https://docs.x.ai/docs/guides/image-generations

const BASE = "https://api.x.ai/v1";
const MODEL = "grok-2-image-1212";

type Media = { kind: "image" | "video"; url: string; mime?: string };

export async function generateImageGrok(prompt: string): Promise<{ media: Media[]; text?: string }> {
  const key = process.env.GROK_API_KEY;
  if (!key) throw new Error("GROK_API_KEY is not set. Add it to .env.local");

  const res = await fetch(`${BASE}/images/generations`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`
    },
    body: JSON.stringify({
      model: MODEL,
      prompt,
      n: 1,
      response_format: "b64_json"
    })
  });

  if (!res.ok) {
    const text = await safeText(res);
    throw new Error(`Grok: ${res.status} ${text}`);
  }

  const data = await res.json();
  const items: any[] = data?.data || [];
  const media: Media[] = items
    .map((it) => {
      if (it.b64_json) {
        return { kind: "image" as const, url: `data:image/png;base64,${it.b64_json}`, mime: "image/png" };
      }
      if (it.url) {
        return { kind: "image" as const, url: it.url };
      }
      return null;
    })
    .filter((x): x is Media => x !== null);

  if (media.length === 0) throw new Error("Grok: no image returned");

  const text = items
    .map((it) => it.revised_prompt)
    .filter(Boolean)
    .join("\n");

  return { media, text: text || undefined };
}

async function safeText(res: Response): Promise<string> {
  try {
    const t = await res.text();
    return t.slice(0, 500);
  } catch {
    return "";
  }
}

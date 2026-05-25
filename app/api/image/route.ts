import { NextRequest, NextResponse } from "next/server";
import { generateImageGemini } from "@/lib/gemini";
import { generateImageGrok } from "@/lib/grok";

export const runtime = "nodejs";
export const maxDuration = 60;

type Body = { prompt?: string; provider?: "gemini" | "grok" };

export async function POST(req: NextRequest) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const prompt = (body.prompt || "").trim();
  const provider = body.provider || "gemini";

  if (!prompt) return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
  if (prompt.length > 2000)
    return NextResponse.json({ error: "Prompt too long (max 2000 chars)" }, { status: 400 });

  try {
    const out =
      provider === "grok" ? await generateImageGrok(prompt) : await generateImageGemini(prompt);
    return NextResponse.json(out);
  } catch (err: any) {
    const message = err?.message || "Image generation failed";
    console.error("[/api/image]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

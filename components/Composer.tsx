"use client";

import { useState, KeyboardEvent } from "react";
import type { Mode, Provider } from "@/app/page";

type Props = {
  mode: Mode;
  provider: Provider;
  onModeChange: (m: Mode) => void;
  onProviderChange: (p: Provider) => void;
  onSend: (prompt: string) => Promise<void> | void;
};

export default function Composer({ mode, provider, onModeChange, onProviderChange, onSend }: Props) {
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    const v = value.trim();
    if (!v || busy) return;
    setBusy(true);
    setValue("");
    try {
      await onSend(v);
    } finally {
      setBusy(false);
    }
  }

  function onKey(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  }

  return (
    <div className="border-t border-line/60 bg-bg px-4 pb-4 pt-3">
      <div className="mx-auto max-w-3xl">
        {/* Mode + Provider selector */}
        <div className="mb-2 flex items-center gap-2 text-xs">
          <div className="flex overflow-hidden rounded-full border border-line/60">
            <button
              onClick={() => onModeChange("image")}
              className={`px-3 py-1 ${
                mode === "image" ? "bg-bg-hover text-zinc-100" : "text-zinc-400 hover:bg-bg-hover"
              }`}
            >
              Image
            </button>
            <button
              onClick={() => onModeChange("video")}
              className={`px-3 py-1 ${
                mode === "video" ? "bg-bg-hover text-zinc-100" : "text-zinc-400 hover:bg-bg-hover"
              }`}
            >
              Video
            </button>
          </div>

          <div className="flex overflow-hidden rounded-full border border-line/60">
            <button
              onClick={() => onProviderChange("gemini")}
              className={`px-3 py-1 ${
                provider === "gemini" ? "bg-bg-hover text-zinc-100" : "text-zinc-400 hover:bg-bg-hover"
              }`}
            >
              Gemini
            </button>
            <button
              onClick={() => mode === "image" && onProviderChange("grok")}
              disabled={mode === "video"}
              title={mode === "video" ? "Grok does not support video generation" : ""}
              className={`px-3 py-1 ${
                provider === "grok" ? "bg-bg-hover text-zinc-100" : "text-zinc-400"
              } ${mode === "video" ? "cursor-not-allowed opacity-40" : "hover:bg-bg-hover"}`}
            >
              Grok
            </button>
          </div>

          <span className="ml-auto text-zinc-500">
            {mode === "image" ? "Image generation" : "Video generation (Gemini Veo)"}
          </span>
        </div>

        {/* Input */}
        <div className="flex items-end gap-2 rounded-2xl border border-line/60 bg-bg-input p-2 focus-within:border-zinc-500">
          <textarea
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={onKey}
            rows={1}
            placeholder={
              mode === "image"
                ? "Describe an image to generate…"
                : "Describe a short video to generate…"
            }
            className="max-h-40 flex-1 resize-none bg-transparent px-3 py-2 text-sm outline-none placeholder:text-zinc-500"
          />
          <button
            onClick={submit}
            disabled={!value.trim() || busy}
            aria-label="Send"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-100 text-bg disabled:opacity-30"
          >
            {busy ? (
              <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M21 12a9 9 0 11-6.2-8.55" />
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M12 19V5M5 12l7-7 7 7" />
              </svg>
            )}
          </button>
        </div>
        <div className="mt-2 text-center text-[11px] text-zinc-500">
          Press Enter to send · Shift+Enter for newline
        </div>
      </div>
    </div>
  );
}

"use client";

import type { Message as TMessage } from "@/app/page";

export default function Message({ message }: { message: TMessage }) {
  const isUser = message.role === "user";

  return (
    <div className={`fade-in mb-6 flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div className={`flex max-w-[85%] gap-3 ${isUser ? "flex-row-reverse" : ""}`}>
        <div
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
            isUser ? "bg-zinc-600" : "bg-accent text-white"
          }`}
          aria-hidden
        >
          {isUser ? "You" : "AI"}
        </div>

        <div
          className={`rounded-2xl px-4 py-3 ${
            isUser ? "bg-bg-input" : "bg-bg-panel border border-line/40"
          }`}
        >
          {message.meta && !isUser && (
            <div className="mb-2 text-[11px] uppercase tracking-wide text-zinc-500">
              {message.meta.provider} · {message.meta.mode}
            </div>
          )}

          {message.text && (
            <div className="whitespace-pre-wrap text-sm leading-relaxed">{message.text}</div>
          )}

          {message.pending && (
            <div className="dot-typing text-sm text-zinc-400">
              {message.meta?.mode === "video" ? "Generating video — this can take 30–90s" : "Generating"}
            </div>
          )}

          {message.error && (
            <div className="mt-1 rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
              {message.error}
            </div>
          )}

          {message.media && message.media.length > 0 && (
            <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {message.media.map((m, i) => (
                <div key={i} className="overflow-hidden rounded-lg border border-line/40 bg-black/20">
                  {m.kind === "image" ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={m.url} alt="generated" className="h-auto w-full" />
                  ) : (
                    <video src={m.url} controls className="h-auto w-full" />
                  )}
                  <div className="flex items-center justify-between border-t border-line/40 px-3 py-2 text-xs text-zinc-400">
                    <span>{m.kind === "image" ? "Image" : "Video"}</span>
                    <a
                      href={m.url}
                      download
                      target="_blank"
                      rel="noreferrer"
                      className="hover:text-zinc-100"
                    >
                      Download
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

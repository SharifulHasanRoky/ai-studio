"use client";

import { useEffect, useRef } from "react";
import type { Message as TMessage } from "@/app/page";
import Message from "@/components/Message";

export default function ChatArea({ messages }: { messages: TMessage[] }) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center px-4 text-center">
        <div className="mb-3 text-2xl font-medium text-zinc-200">What will you create today?</div>
        <div className="max-w-md text-sm text-zinc-500">
          Describe an image or a short video. Pick a model below and press send.
        </div>
        <div className="mt-6 grid w-full max-w-2xl grid-cols-1 gap-2 sm:grid-cols-2">
          {[
            "A photorealistic red panda barista pouring latte art",
            "Cyberpunk Tokyo street at night, neon reflections",
            "Cinematic 5s clip: waves crashing on black sand beach",
            "Flat-style icon set for a fintech app, pastel colors"
          ].map((s) => (
            <div
              key={s}
              className="cursor-default rounded-lg border border-line/60 bg-bg-panel/40 px-3 py-3 text-left text-sm text-zinc-400"
            >
              {s}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="mx-auto max-w-3xl px-4 py-6">
        {messages.map((m) => (
          <Message key={m.id} message={m} />
        ))}
        <div ref={endRef} />
      </div>
    </div>
  );
}

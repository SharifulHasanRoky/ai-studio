"use client";

import type { Message } from "@/app/page";

export type Conversation = {
  id: string;
  title: string;
  createdAt: number;
  messages: Message[];
};

type Props = {
  open: boolean;
  conversations: Conversation[];
  activeId: string;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
  onToggle: () => void;
};

export default function Sidebar({
  open,
  conversations,
  activeId,
  onSelect,
  onNew,
  onDelete,
  onToggle
}: Props) {
  if (!open) return null;

  return (
    <aside className="flex h-full w-64 shrink-0 flex-col border-r border-line/60 bg-bg-panel">
      <div className="flex items-center justify-between p-2">
        <button
          onClick={onNew}
          className="flex flex-1 items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-bg-hover"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14M5 12h14" />
          </svg>
          New chat
        </button>
        <button
          aria-label="Collapse sidebar"
          onClick={onToggle}
          className="ml-1 rounded p-1.5 text-zinc-400 hover:bg-bg-hover hover:text-zinc-100"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 6h18M3 12h18M3 18h18" />
          </svg>
        </button>
      </div>

      <div className="px-3 pb-1 pt-2 text-xs uppercase tracking-wide text-zinc-500">
        Recent
      </div>

      <nav className="flex-1 overflow-y-auto px-2 pb-4">
        {conversations.length === 0 && (
          <div className="px-3 py-6 text-sm text-zinc-500">No conversations yet.</div>
        )}
        {conversations.map((c) => {
          const active = c.id === activeId;
          return (
            <div
              key={c.id}
              className={`group flex items-center gap-2 rounded-md px-3 py-2 text-sm ${
                active ? "bg-bg-hover" : "hover:bg-bg-hover"
              }`}
            >
              <button
                onClick={() => onSelect(c.id)}
                className="flex-1 truncate text-left"
                title={c.title}
              >
                {c.title || "New chat"}
              </button>
              <button
                aria-label="Delete conversation"
                onClick={() => onDelete(c.id)}
                className="invisible rounded p-1 text-zinc-400 hover:bg-bg/60 hover:text-zinc-100 group-hover:visible"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
                </svg>
              </button>
            </div>
          );
        })}
      </nav>

      <div className="border-t border-line/60 p-3 text-xs text-zinc-500">
        <div className="font-medium text-zinc-400">AI Studio</div>
        <div>Gemini · Grok · Veo</div>
      </div>
    </aside>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import Sidebar, { Conversation } from "@/components/Sidebar";
import ChatArea from "@/components/ChatArea";
import Composer from "@/components/Composer";

export type Mode = "image" | "video";
export type Provider = "gemini" | "grok";

export type Message = {
  id: string;
  role: "user" | "assistant";
  text?: string;
  media?: { kind: "image" | "video"; url: string; mime?: string }[];
  pending?: boolean;
  error?: string;
  meta?: { provider: Provider; mode: Mode };
};

const STORAGE_KEY = "ai-studio:conversations:v1";

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function newConversation(): Conversation {
  return { id: uid(), title: "New chat", createdAt: Date.now(), messages: [] };
}

export default function Page() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string>("");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mode, setMode] = useState<Mode>("image");
  const [provider, setProvider] = useState<Provider>("gemini");
  const hydrated = useRef(false);

  // Load from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? (JSON.parse(raw) as Conversation[]) : [];
      if (parsed.length) {
        setConversations(parsed);
        setActiveId(parsed[0].id);
      } else {
        const c = newConversation();
        setConversations([c]);
        setActiveId(c.id);
      }
    } catch {
      const c = newConversation();
      setConversations([c]);
      setActiveId(c.id);
    }
    hydrated.current = true;
  }, []);

  // Persist
  useEffect(() => {
    if (!hydrated.current) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations));
    } catch {}
  }, [conversations]);

  // Video only supported by Gemini
  useEffect(() => {
    if (mode === "video" && provider !== "gemini") setProvider("gemini");
  }, [mode, provider]);

  const active = conversations.find((c) => c.id === activeId);

  function updateActive(updater: (c: Conversation) => Conversation) {
    setConversations((prev) => prev.map((c) => (c.id === activeId ? updater(c) : c)));
  }

  function startNewChat() {
    const c = newConversation();
    setConversations((prev) => [c, ...prev]);
    setActiveId(c.id);
  }

  function deleteChat(id: string) {
    setConversations((prev) => {
      const next = prev.filter((c) => c.id !== id);
      if (id === activeId) {
        if (next.length) setActiveId(next[0].id);
        else {
          const c = newConversation();
          setActiveId(c.id);
          return [c];
        }
      }
      return next;
    });
  }

  async function send(prompt: string) {
    if (!prompt.trim() || !active) return;

    const userMsg: Message = { id: uid(), role: "user", text: prompt };
    const assistantId = uid();
    const pendingMsg: Message = {
      id: assistantId,
      role: "assistant",
      pending: true,
      meta: { provider, mode }
    };

    updateActive((c) => ({
      ...c,
      title: c.messages.length === 0 ? prompt.slice(0, 40) : c.title,
      messages: [...c.messages, userMsg, pendingMsg]
    }));

    try {
      const endpoint = mode === "image" ? "/api/image" : "/api/video";
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, provider })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || `Request failed (${res.status})`);

      const media = (data.media || []) as { kind: "image" | "video"; url: string; mime?: string }[];

      updateActive((c) => ({
        ...c,
        messages: c.messages.map((m) =>
          m.id === assistantId
            ? { ...m, pending: false, media, text: data.text || undefined }
            : m
        )
      }));
    } catch (err: any) {
      updateActive((c) => ({
        ...c,
        messages: c.messages.map((m) =>
          m.id === assistantId
            ? { ...m, pending: false, error: err?.message || "Something went wrong" }
            : m
        )
      }));
    }
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-bg text-zinc-100">
      <Sidebar
        open={sidebarOpen}
        conversations={conversations}
        activeId={activeId}
        onSelect={setActiveId}
        onNew={startNewChat}
        onDelete={deleteChat}
        onToggle={() => setSidebarOpen((v) => !v)}
      />
      <main className="flex flex-1 flex-col">
        <header className="flex h-12 items-center justify-between border-b border-line/60 px-4">
          <div className="flex items-center gap-2">
            {!sidebarOpen && (
              <button
                aria-label="Open sidebar"
                onClick={() => setSidebarOpen(true)}
                className="rounded p-1.5 hover:bg-bg-hover"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 6h18M3 12h18M3 18h18" />
                </svg>
              </button>
            )}
            <span className="font-medium">AI Studio</span>
            <span className="text-xs text-zinc-500">· Image & Video Generation</span>
          </div>
        </header>

        <ChatArea messages={active?.messages || []} />

        <Composer
          mode={mode}
          provider={provider}
          onModeChange={setMode}
          onProviderChange={setProvider}
          onSend={send}
        />
      </main>
    </div>
  );
}

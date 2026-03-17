"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { ChatMessage } from "./chat-message";
import { ChatInput } from "./chat-input";
import { DocumentPanel } from "./document-panel";
import { streamQuery } from "@/lib/api";
import type { ChatMessage as ChatMessageType } from "@/lib/types";
import { BrainCogIcon } from "lucide-react";

const STORAGE_KEY = "documind-chat-messages";

function loadMessages(): ChatMessageType[] {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ChatMessageType[];
    return parsed.map((m) => ({
      ...m,
      timestamp: new Date(m.timestamp),
      isStreaming: false,
    }));
  } catch {
    return [];
  }
}

function saveMessages(msgs: ChatMessageType[]) {
  try {
    const serialisable = msgs.filter((m) => !m.isStreaming || m.content);
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(serialisable));
  } catch {
    // storage full or unavailable — silently ignore
  }
}

interface ChatViewProps {
  refreshTrigger?: number;
}

export function ChatView({ refreshTrigger }: ChatViewProps) {
  const [messages, setMessages] = useState<ChatMessageType[]>(loadMessages);
  const [selectedDocIds, setSelectedDocIds] = useState<string[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    const streaming = messages.some((m) => m.isStreaming);
    if (!streaming) {
      saveMessages(messages);
    }
  }, [messages]);

  const handleSend = async (question: string) => {
    const userMsg: ChatMessageType = {
      id: crypto.randomUUID(),
      role: "user",
      content: question,
      timestamp: new Date(),
    };

    const assistantId = crypto.randomUUID();
    const assistantMsg: ChatMessageType = {
      id: assistantId,
      role: "assistant",
      content: "",
      isStreaming: true,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg, assistantMsg]);
    setIsStreaming(true);

    try {
      await streamQuery(
        {
          question,
          doc_ids: selectedDocIds.length > 0 ? selectedDocIds : undefined,
        },
        (token) => {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId ? { ...m, content: m.content + token } : m,
            ),
          );
        },
        () => {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId ? { ...m, isStreaming: false } : m,
            ),
          );
          setIsStreaming(false);
        },
        (error) => {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId
                ? {
                    ...m,
                    content: `Error: ${error}`,
                    isStreaming: false,
                  }
                : m,
            ),
          );
          setIsStreaming(false);
        },
      );
    } catch {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId
            ? {
                ...m,
                content:
                  "Failed to connect to the server. Is the backend running?",
                isStreaming: false,
              }
            : m,
        ),
      );
      setIsStreaming(false);
    }
  };

  return (
    <div className="flex flex-1 overflow-hidden">
      <div className="flex flex-1 flex-col">
        {messages.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-4">
            <div className="flex size-16 items-center justify-center rounded-full bg-accent">
              <BrainCogIcon className="size-8 text-foreground" />
            </div>
            <div className="text-center">
              <h2 className="text-2xl font-semibold text-foreground">
                What can I help you find?
              </h2>
              <p className="mt-2 max-w-md text-sm text-muted-foreground">
                Ask questions about your uploaded documents. Select specific
                documents in the right panel to focus your search, or query
                across everything.
              </p>
            </div>
          </div>
        ) : (
          <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto">
            <div className="mx-auto max-w-3xl py-4">
              {messages.map((msg) => (
                <ChatMessage key={msg.id} message={msg} />
              ))}
            </div>
          </div>
        )}

        <ChatInput onSend={handleSend} disabled={isStreaming} />
      </div>

      <DocumentPanel
        selectedDocIds={selectedDocIds}
        onSelectionChange={setSelectedDocIds}
        refreshTrigger={refreshTrigger}
      />
    </div>
  );
}

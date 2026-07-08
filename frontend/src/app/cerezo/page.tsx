"use client";

import { useState, useRef, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import ChatBubble from "./ChatBubble";
import PredictionCard from "./PredictionCard";
import TypingIndicator from "./TypingIndicator";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  intent?: string;
  prediction?: PredictionData | null;
}

interface PredictionData {
  local_win_pct: number;
  draw_pct: number;
  visitor_win_pct: number;
  confidence: string;
  total_partidos?: number;
}

export default function CerezoPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "assistant", content: "¡Hola! Soy Cerezo Digital. Preguntame sobre clubes, partidos, la tabla, o pedime predicciones." },
  ]);
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const mutation = useMutation({
    mutationFn: async (message: string) => {
      const res = await fetch(`${API_URL}/api/v1/cerezo/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });
      if (!res.ok) throw new Error("Error al contactar a Cerezo");
      return res.json();
    },
    onSuccess: (data) => {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.message, intent: data.intent, prediction: data.prediction },
      ]);
    },
    onError: () => {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Ups, ocurrió un error. Probá de nuevo." },
      ]);
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || mutation.isPending) return;
    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setInput("");
    mutation.mutate(text);
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 flex flex-col h-[calc(100vh-12rem)]">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Cerezo Digital</h1>
        <p className="text-sm text-gray-400">Asistente de la Liga Paraguaya</p>
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 pr-2 scrollbar-thin">
        {messages.map((msg, i) => (
          <div key={i}>
            <ChatBubble role={msg.role} message={msg.content} />
            {msg.intent === "prediction" && msg.prediction && (
              <div className="flex justify-start mt-1 ml-10">
                <PredictionCard
                  localWinPct={msg.prediction.local_win_pct}
                  drawPct={msg.prediction.draw_pct}
                  visitorWinPct={msg.prediction.visitor_win_pct}
                  confidence={msg.prediction.confidence}
                  totalPartidos={msg.prediction.total_partidos}
                />
              </div>
            )}
          </div>
        ))}
        {mutation.isPending && <TypingIndicator />}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSubmit} className="mt-4 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Preguntale a Cerezo..."
          className="flex-1 rounded-xl px-4 py-3 bg-[#0a1628] border border-white/10 text-[#f8fafc] placeholder-gray-500 focus:outline-none focus:border-[#76e4f7]/50 transition text-sm"
          disabled={mutation.isPending}
        />
        <button
          type="submit"
          disabled={mutation.isPending || !input.trim()}
          className="px-5 py-3 rounded-xl bg-[#76e4f7] text-black font-semibold text-sm hover:brightness-110 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Enviar
        </button>
      </form>
    </div>
  );
}

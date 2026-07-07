"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import ChatMessage from "./ChatMessage";

interface ChatWidgetProps {
  partidoId: string;
}

interface Mensaje {
  id: string;
  user_id: string;
  username: string;
  nombre: string;
  imagen: string;
  contenido: string;
  created_at: string;
}

export default function ChatWidget({ partidoId }: ChatWidgetProps) {
  const [messages, setMessages] = useState<Mensaje[]>([]);
  const [input, setInput] = useState("");
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const wsRef = useRef<WebSocket | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const tokenRef = useRef<string>("");

  const token = typeof window !== "undefined"
    ? localStorage.getItem("auth_token") || ""
    : "";

  useEffect(() => {
    tokenRef.current = token;
  }, [token]);

  // Load history
  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://backend-production-0b7d.up.railway.app";
    fetch(`${apiUrl}/api/v1/partidos/${partidoId}/chat?limit=50`)
      .then((r) => r.json())
      .then((data) => {
        setMessages(data.reverse());
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [partidoId]);

  // WebSocket connection
  useEffect(() => {
    if (!token) return;
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://backend-production-0b7d.up.railway.app";
    const wsUrl = apiUrl.replace(/^http/, "ws");
    const ws = new WebSocket(`${wsUrl}/api/v1/ws/partidos/${partidoId}?token=${token}`);

    ws.onopen = () => setConnected(true);
    ws.onclose = () => setConnected(false);
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.tipo === "mensaje_nuevo") {
        setMessages((prev) => [...prev, data]);
        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
      }
    };

    wsRef.current = ws;
    return () => ws.close();
  }, [partidoId, token]);

  const sendMessage = useCallback(() => {
    if (!input.trim() || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    wsRef.current.send(JSON.stringify({ tipo: "mensaje", contenido: input.trim() }));
    setInput("");
  }, [input]);

  return (
    <div className="mt-6 border border-gray-700 rounded-xl overflow-hidden">
      <div className="bg-gray-800/50 px-4 py-2 border-b border-gray-700 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-200">Chat en Vivo</h3>
        <span className={`w-2 h-2 rounded-full ${connected ? "bg-green-500" : "bg-red-500"}`} />
      </div>

      <div className="h-72 overflow-y-auto bg-gray-900/50">
        {loading ? (
          <div className="flex items-center justify-center h-full text-gray-500 text-sm">
            Cargando mensajes...
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500 text-sm">
            No hay mensajes aún. ¡Sé el primero!
          </div>
        ) : (
          messages.map((msg) => (
            <ChatMessage key={msg.id} {...msg} />
          ))
        )}
        <div ref={bottomRef} />
      </div>

      <div className="flex gap-2 p-3 border-t border-gray-700 bg-gray-800/30">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          placeholder="Escribe un mensaje..."
          maxLength={500}
          className="flex-1 bg-gray-700 text-sm text-white rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500 placeholder-gray-400"
        />
        <button
          onClick={sendMessage}
          disabled={!input.trim() || !connected}
          className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Enviar
        </button>
      </div>
    </div>
  );
}

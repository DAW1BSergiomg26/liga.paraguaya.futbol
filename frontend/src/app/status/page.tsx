"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { API_URL } from "@/lib/api";

interface CheckResult {
  name: string;
  status: "ok" | "slow" | "error" | "pending" | "waking";
  latencyMs: number | null;
  message: string;
  timestamp: string | null;
}

const INITIAL: CheckResult[] = [
  { name: "Backend (Render)", status: "pending", latencyMs: null, message: "Esperando...", timestamp: null },
  { name: "Base de datos (Neon)", status: "pending", latencyMs: null, message: "Esperando...", timestamp: null },
  { name: "Cerezo (IA)", status: "pending", latencyMs: null, message: "Esperando...", timestamp: null },
  { name: "API_URL resuelta", status: "ok", latencyMs: null, message: API_URL, timestamp: new Date().toISOString() },
];

function statusIcon(s: CheckResult["status"]) {
  if (s === "ok") return "✅";
  if (s === "slow") return "⚠️";
  if (s === "waking") return "🔄";
  if (s === "error") return "❌";
  return "⏳";
}

function statusLabel(s: CheckResult["status"]) {
  if (s === "ok") return "OK";
  if (s === "slow") return "Lento";
  if (s === "waking") return "Despertando...";
  if (s === "error") return "Caído";
  return "Verificando...";
}

function fmtTime(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString("es-PY", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

async function pingBackend(signal: AbortSignal): Promise<CheckResult> {
  const start = performance.now();
  try {
    const res = await fetch(`${API_URL}/health`, { signal, cache: "no-store" });
    const latency = Math.round(performance.now() - start);
    if (!res.ok) {
      return { name: "Backend (Render)", status: "error", latencyMs: latency, message: `HTTP ${res.status}`, timestamp: new Date().toISOString() };
    }
    const data = await res.json();
    const dbOk = data.database === "ok";
    return {
      name: "Backend (Render)",
      status: latency > 5000 ? "slow" : "ok",
      latencyMs: latency,
      message: dbOk ? "Activo" : "Activo (DB con problemas)",
      timestamp: new Date().toISOString(),
    };
  } catch (e: unknown) {
    const latency = Math.round(performance.now() - start);
    if (latency > 10000) {
      return { name: "Backend (Render)", status: "waking", latencyMs: latency, message: "Despertando servidor (cold start)...", timestamp: new Date().toISOString() };
    }
    return { name: "Backend (Render)", status: "error", latencyMs: latency, message: "No responde", timestamp: new Date().toISOString() };
  }
}

async function pingDB(signal: AbortSignal): Promise<CheckResult> {
  const start = performance.now();
  try {
    const res = await fetch(`${API_URL}/health`, { signal, cache: "no-store" });
    const latency = Math.round(performance.now() - start);
    if (!res.ok) {
      return { name: "Base de datos (Neon)", status: "error", latencyMs: latency, message: `HTTP ${res.status}`, timestamp: new Date().toISOString() };
    }
    const data = await res.json();
    const dbOk = data.database === "ok";
    return {
      name: "Base de datos (Neon)",
      status: dbOk ? (latency > 3000 ? "slow" : "ok") : "error",
      latencyMs: latency,
      message: dbOk ? "Conectada" : "Error de conexión",
      timestamp: new Date().toISOString(),
    };
  } catch {
    const latency = Math.round(performance.now() - start);
    return { name: "Base de datos (Neon)", status: "error", latencyMs: latency, message: "Inaccesible", timestamp: new Date().toISOString() };
  }
}

async function pingCerezo(signal: AbortSignal): Promise<CheckResult> {
  const start = performance.now();
  try {
    const res = await fetch(`${API_URL}/api/v1/cerezo/ask`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "ping" }),
      signal,
      cache: "no-store",
    });
    const latency = Math.round(performance.now() - start);
    if (!res.ok) {
      return { name: "Cerezo (IA)", status: "error", latencyMs: latency, message: `HTTP ${res.status}`, timestamp: new Date().toISOString() };
    }
    const data = await res.json();
    const valid = typeof data.message === "string" && typeof data.intent === "string";
    return {
      name: "Cerezo (IA)",
      status: valid ? (latency > 5000 ? "slow" : "ok") : "error",
      latencyMs: latency,
      message: valid ? `Activo (${data.intent})` : "Respuesta inválida",
      timestamp: new Date().toISOString(),
    };
  } catch (e: unknown) {
    const latency = Math.round(performance.now() - start);
    if (latency > 10000) {
      return { name: "Cerezo (IA)", status: "waking", latencyMs: latency, message: "Despertando servidor (cold start)...", timestamp: new Date().toISOString() };
    }
    return { name: "Cerezo (IA)", status: "error", latencyMs: latency, message: "No responde", timestamp: new Date().toISOString() };
  }
}

export default function StatusPage() {
  const [checks, setChecks] = useState<CheckResult[]>(INITIAL);
  const [lastRun, setLastRun] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const runChecks = useCallback(async () => {
    if (isRunning) return;
    setIsRunning(true);
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    const results = await Promise.all([
      pingBackend(controller.signal),
      pingDB(controller.signal),
      pingCerezo(controller.signal),
    ]);

    /* API_URL check is static */
    const apiCheck: CheckResult = {
      name: "API_URL resuelta",
      status: API_URL.includes("localhost") ? "error" : "ok",
      latencyMs: null,
      message: API_URL,
      timestamp: new Date().toISOString(),
    };

    if (!controller.signal.aborted) {
      setChecks([...results, apiCheck]);
      setLastRun(new Date().toISOString());
      setIsRunning(false);
    }
  }, [isRunning]);

  /* Initial run + auto-refresh every 30s */
  useEffect(() => {
    runChecks();
    const interval = setInterval(runChecks, 30_000);
    return () => {
      clearInterval(interval);
      abortRef.current?.abort();
    };
  }, [runChecks]);

  const allOk = checks.every((c) => c.status === "ok");

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-texto-principal mb-1">Estado del Sistema</h1>
        <p className="text-sm text-texto-secundario">
          Verificación en tiempo real de todos los servicios.
        </p>
      </div>

      {/* Summary badge */}
      <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold mb-6 ${
        allOk
          ? "bg-[#16C784]/15 text-[#16C784] border border-[#16C784]/30"
          : "bg-[#E5484D]/15 text-[#E5484D] border border-[#E5484D]/30"
      }`}>
        {allOk ? "✅ Todos los servicios operativos" : "⚠️ Algún servicio con problemas"}
      </div>

      {/* Service cards */}
      <div className="space-y-3">
        {checks.map((c) => (
          <div
            key={c.name}
            className="flex items-center justify-between p-4 rounded-xl bg-bg-secundario border border-borde-sutil"
          >
            <div className="flex items-center gap-3">
              <span className="text-lg">{statusIcon(c.status)}</span>
              <div>
                <p className="text-sm font-semibold text-texto-principal">{c.name}</p>
                <p className="text-xs text-texto-secundario">{c.message}</p>
              </div>
            </div>
            <div className="text-right shrink-0">
              <p className="text-xs font-mono text-texto-secundario">
                {c.latencyMs !== null ? `${c.latencyMs} ms` : "—"}
              </p>
              <p className="text-[10px] text-texto-apagado">{fmtTime(c.timestamp)}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div className="mt-6 flex items-center justify-between">
        <p className="text-xs text-texto-apagado">
          {lastRun ? `Última verificación: ${fmtTime(lastRun)}` : ""}
        </p>
        <button
          onClick={runChecks}
          disabled={isRunning}
          className="px-4 py-2 rounded-lg bg-apf-rojo text-white text-sm font-semibold hover:bg-apf-rojo-oscuro disabled:opacity-50 transition"
        >
          {isRunning ? "Verificando..." : "Verificar ahora"}
        </button>
      </div>
    </div>
  );
}

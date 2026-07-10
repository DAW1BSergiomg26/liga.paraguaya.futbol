import { useState, useEffect } from "react";

interface LiveScore {
  goles_local: number | null;
  goles_visitante: number | null;
  minuto: number;
}

const POLL_INTERVAL = 30_000;

export function useLiveScores(): Record<string, LiveScore> {
  const [scores, setScores] = useState<Record<string, LiveScore>>({});

  useEffect(() => {
    let cancelled = false;

    async function poll() {
      try {
        const base = process.env.NEXT_PUBLIC_API_URL || "";
        const res = await fetch(`${base}/api/v1/partidos/marcadores`);
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled) {
          setScores(data);
        }
      } catch {
        // ignore poll errors
      }
    }

    poll();
    const id = setInterval(poll, POLL_INTERVAL);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  return scores;
}

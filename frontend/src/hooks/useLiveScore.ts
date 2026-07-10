import { useState, useEffect } from "react";

interface LiveScore {
  goles_local: number | null;
  goles_visitante: number | null;
  minuto: number | null;
}

const POLL_INTERVAL = 30_000;

export function useLiveScore(partidoId: string): LiveScore {
  const [score, setScore] = useState<LiveScore>({
    goles_local: null,
    goles_visitante: null,
    minuto: null,
  });

  useEffect(() => {
    let cancelled = false;

    async function poll() {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/v1/partidos/${partidoId}/marcador`
        );
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled) {
          setScore({
            goles_local: data.goles_local ?? null,
            goles_visitante: data.goles_visitante ?? null,
            minuto: data.minuto ?? null,
          });
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
  }, [partidoId]);

  return score;
}

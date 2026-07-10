import { useQuery } from "@tanstack/react-query";

interface LiveScore {
  goles_local: number | null;
  goles_visitante: number | null;
  minuto: number;
}

export function useLiveScores(): Record<string, LiveScore> {
  const base = process.env.NEXT_PUBLIC_API_URL || "";
  const { data } = useQuery<Record<string, LiveScore>>({
    queryKey: ["liveScores"],
    queryFn: () => fetch(`${base}/api/v1/partidos/marcadores`).then(r => r.json()),
    refetchInterval: 30_000,
  });
  return data ?? {};
}

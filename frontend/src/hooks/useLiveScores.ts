import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";

interface LiveScore {
  goles_local: number | null;
  goles_visitante: number | null;
  minuto: number;
}

export function useLiveScores(): Record<string, LiveScore> {
  const { data } = useQuery<Record<string, LiveScore>>({
    queryKey: ["liveScores"],
    queryFn: () => apiFetch<Record<string, LiveScore>>("/api/v1/partidos/marcadores"),
    refetchInterval: 30_000,
  });
  return data ?? {};
}

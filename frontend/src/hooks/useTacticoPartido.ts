"use client";

import { useQuery } from "@tanstack/react-query";
import { getTacticoPartido } from "@/lib/api";
import type { AnalisisPartido } from "@/types";

export function useTacticoPartido(partidoId: string | null) {
  return useQuery<AnalisisPartido>({
    queryKey: ["tactico-partido", partidoId],
    queryFn: () => getTacticoPartido(partidoId!),
    enabled: !!partidoId,
  });
}

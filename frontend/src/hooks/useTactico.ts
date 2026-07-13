"use client";

import { useQuery } from "@tanstack/react-query";
import { getTacticoEquipos, getTacticoEquipo } from "@/lib/api";
import type { EquipoTactico, EquipoResumenTactico } from "@/types";

export function useTacticoEquipos() {
  return useQuery<EquipoResumenTactico[]>({
    queryKey: ["tactico-equipos"],
    queryFn: getTacticoEquipos,
  });
}

export function useTacticoEquipo(equipoId: string | null) {
  return useQuery<EquipoTactico>({
    queryKey: ["tactico-equipo", equipoId],
    queryFn: () => getTacticoEquipo(equipoId!),
    enabled: !!equipoId,
  });
}

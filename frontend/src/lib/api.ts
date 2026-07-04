const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001";

async function fetchJSON<T>(path: string): Promise<T> {
  const res = await fetch(`${API_URL}${path}`);
  if (!res.ok) {
    throw new Error(`API error: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

import type { Club, ClubDetail, Partido, PartidoDetail, TablaRow } from "@/types";

export async function getClubes(ciudad?: string): Promise<Club[]> {
  const params = ciudad ? `?ciudad=${encodeURIComponent(ciudad)}` : "";
  return fetchJSON<Club[]>(`/api/v1/clubes${params}`);
}

export async function getClub(id: string): Promise<ClubDetail> {
  return fetchJSON<ClubDetail>(`/api/v1/clubes/${id}`);
}

export async function getPartidos(torneo?: string, estado?: string): Promise<Partido[]> {
  const params = new URLSearchParams();
  if (torneo) params.set("torneo", torneo);
  if (estado) params.set("estado", estado);
  const qs = params.toString();
  return fetchJSON<Partido[]>(`/api/v1/partidos${qs ? `?${qs}` : ""}`);
}

export async function getPartido(id: string): Promise<PartidoDetail> {
  return fetchJSON<PartidoDetail>(`/api/v1/partidos/${id}`);
}

export async function getTabla(torneo?: string): Promise<TablaRow[]> {
  const params = torneo ? `?torneo=${encodeURIComponent(torneo)}` : "";
  return fetchJSON<TablaRow[]>(`/api/v1/tabla${params}`);
}

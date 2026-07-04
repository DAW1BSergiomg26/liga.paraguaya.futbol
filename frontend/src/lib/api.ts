const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001";

async function fetchJSON<T>(path: string): Promise<T> {
  const res = await fetch(`${API_URL}${path}`);
  if (!res.ok) {
    throw new Error(`API error: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

import type { Club, ClubDetail, Partido, PartidoDetail, PartidoPage, TablaRow } from "@/types";

export async function getClubes(ciudad?: string): Promise<Club[]> {
  const params = ciudad ? `?ciudad=${encodeURIComponent(ciudad)}` : "";
  return fetchJSON<Club[]>(`/api/v1/clubes${params}`);
}

export async function getClub(id: string): Promise<ClubDetail> {
  return fetchJSON<ClubDetail>(`/api/v1/clubes/${id}`);
}

export async function getPartidos(
  torneo?: string,
  estado?: string,
  page?: number,
  per_page?: number
): Promise<PartidoPage> {
  const params = new URLSearchParams();
  if (torneo) params.set("torneo", torneo);
  if (estado) params.set("estado", estado);
  if (page) params.set("page", page.toString());
  if (per_page) params.set("per_page", per_page.toString());
  const qs = params.toString();
  return fetchJSON<PartidoPage>(`/api/v1/partidos${qs ? `?${qs}` : ""}`);
}

export async function getPartido(id: string): Promise<PartidoDetail> {
  return fetchJSON<PartidoDetail>(`/api/v1/partidos/${id}`);
}

export async function getTabla(torneo?: string): Promise<TablaRow[]> {
  const params = torneo ? `?torneo=${encodeURIComponent(torneo)}` : "";
  return fetchJSON<TablaRow[]>(`/api/v1/tabla${params}`);
}

export async function updatePartido(
  id: string,
  data: { goles_local?: number | null; goles_visitante?: number | null; estado?: string },
  apiKey: string
): Promise<PartidoDetail> {
  const res = await fetch(`${API_URL}/api/v1/admin/partidos/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": apiKey,
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Error desconocido" }));
    throw new Error(err.detail || `Error ${res.status}`);
  }
  return res.json();
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://backend-production-0b7d.up.railway.app";

async function fetchJSON<T>(path: string): Promise<T> {
  const res = await fetch(`${API_URL}${path}`);
  if (!res.ok) {
    throw new Error(`API error: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

import type { Club, ClubDetail, Partido, PartidoDetail, PartidoPage, TablaRow, User, PredictionCreate, PredictionDetail, LeaderboardEntry, Noticia, NoticiasResponse, H2HResponse } from "@/types";

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

export async function getTorneos(): Promise<string[]> {
  return fetchJSON<string[]>("/api/v1/tabla/torneos");
}

let authToken: string | null = null;

export function setAuthToken(token: string | null) {
  authToken = token;
  if (token) localStorage.setItem("user_token", token);
  else localStorage.removeItem("user_token");
}

export function getSavedToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("user_token");
}

async function authFetchJSON<T>(path: string, options?: RequestInit): Promise<T> {
  const token = authToken || getSavedToken();
  const headers: Record<string, string> = {
    ...(options?.headers as Record<string, string>),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${API_URL}${path}`, { ...options, headers });
  if (!res.ok) {
    if (res.status === 401) {
      localStorage.removeItem("user_token");
      authToken = null;
    }
    const err = await res.json().catch(() => ({ detail: "Error desconocido" }));
    throw new Error(err.detail || `Error ${res.status}`);
  }
  return res.json();
}

export async function loginWithProvider(data: {
  email: string;
  name: string;
  image?: string;
  provider?: string;
  provider_id?: string;
}): Promise<User> {
  return authFetchJSON<User>("/api/v1/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export async function crearPrediccion(data: PredictionCreate): Promise<PredictionDetail> {
  return authFetchJSON<PredictionDetail>("/api/v1/predicciones", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export async function misPredicciones(): Promise<PredictionDetail[]> {
  return authFetchJSON<PredictionDetail[]>("/api/v1/predicciones/mis");
}

export async function getLeaderboard(): Promise<LeaderboardEntry[]> {
  return fetchJSON<LeaderboardEntry[]>("/api/v1/leaderboard");
}

export async function getNoticias(): Promise<NoticiasResponse> {
  return fetchJSON<NoticiasResponse>("/api/v1/noticias");
}

export async function getH2H(clubA: string, clubB: string): Promise<H2HResponse> {
  const res = await fetchJSON<H2HResponse>(
    `${API_URL}/api/v1/partidos/h2h?club_a=${encodeURIComponent(clubA)}&club_b=${encodeURIComponent(clubB)}`
  );
  return res;
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

function authHeaders(): Record<string, string> {
  const token = authToken || getSavedToken();
  const headers: Record<string, string> = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return headers;
}

export async function getChatHistory(partidoId: string, limit = 50, offset = 0): Promise<MensajeChat[]> {
  const res = await fetch(
    `${API_URL}/api/v1/partidos/${partidoId}/chat?limit=${limit}&offset=${offset}`,
    { headers: authHeaders() }
  );
  if (!res.ok) throw new Error("Failed to fetch chat history");
  return res.json();
}

export interface MensajeChat {
  id: string;
  partido_id: string;
  user_id: string;
  username: string;
  nombre: string;
  imagen: string;
  mensaje: string;
  created_at: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

if (!API_URL) {
  if (typeof window !== "undefined") {
    console.error(
      "NEXT_PUBLIC_API_URL no configurada: el frontend no puede conectar al backend. " +
        "Seteala en Vercel (Settings -> Environment Variables) y redeploy."
    );
  }
}

export async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, options);
  if (!res.ok) {
    throw new Error(`API error: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

import type { Club, ClubDetail, Partido, PartidoDetail, PartidoPage, TablaRow, User, PredictionCreate, PredictionDetail, LeaderboardEntry, Noticia, NoticiasPaginatedResponse, H2HResponse, EquipoTactico, AnalisisPartido, EquipoResumenTactico, AuthUser, TokenResponse, CampeonHistorico, RankingClubHistorico, ClubTemporadaHistorica, EstadisticasTransferencias } from "@/types";

export async function getClubes(ciudad?: string): Promise<Club[]> {
  const params = ciudad ? `?ciudad=${encodeURIComponent(ciudad)}` : "";
  return apiFetch<Club[]>(`/api/v1/clubes${params}`);
}

export async function getClub(id: string): Promise<ClubDetail> {
  return apiFetch<ClubDetail>(`/api/v1/clubes/${id}`);
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
  return apiFetch<PartidoPage>(`/api/v1/partidos${qs ? `?${qs}` : ""}`);
}

export async function getPartido(id: string): Promise<PartidoDetail> {
  return apiFetch<PartidoDetail>(`/api/v1/partidos/${id}`);
}

export async function getTabla(torneo?: string): Promise<TablaRow[]> {
  const params = torneo ? `?torneo=${encodeURIComponent(torneo)}` : "";
  return apiFetch<TablaRow[]>(`/api/v1/tabla${params}`);
}

export async function getTorneos(): Promise<string[]> {
  return apiFetch<string[]>("/api/v1/tabla/torneos");
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

export async function registerUser(email: string, name: string, password: string): Promise<TokenResponse> {
  const data = await apiFetch<TokenResponse>("/api/v1/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, name, password }),
  });
  setAuthToken(data.access_token);
  return data;
}

export async function loginUser(email: string, password: string): Promise<TokenResponse> {
  const data = await apiFetch<TokenResponse>("/api/v1/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  setAuthToken(data.access_token);
  return data;
}

export async function getMe(): Promise<AuthUser> {
  return authFetchJSON<AuthUser>("/api/v1/auth/me");
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
  return apiFetch<LeaderboardEntry[]>("/api/v1/leaderboard");
}

export async function getNoticias(params?: {
  page?: number;
  limit?: number;
  fuente?: string;
  search?: string;
}): Promise<NoticiasPaginatedResponse> {
  const searchParams = new URLSearchParams();
  if (params?.page) searchParams.set("page", params.page.toString());
  if (params?.limit) searchParams.set("limit", params.limit.toString());
  if (params?.fuente) searchParams.set("fuente", params.fuente);
  if (params?.search) searchParams.set("search", params.search);
  const qs = searchParams.toString();
  return apiFetch<NoticiasPaginatedResponse>(`/api/v1/noticias${qs ? `?${qs}` : ""}`);
}

export async function getNoticia(id: string): Promise<Noticia> {
  return apiFetch<Noticia>(`/api/v1/noticias/${id}`);
}

export async function getH2H(clubA: string, clubB: string): Promise<H2HResponse> {
  const res = await apiFetch<H2HResponse>(
    `/api/v1/partidos/h2h?club_a=${encodeURIComponent(clubA)}&club_b=${encodeURIComponent(clubB)}`
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

export async function getTacticoEquipos(): Promise<EquipoResumenTactico[]> {
  return apiFetch<EquipoResumenTactico[]>("/api/v1/tactico/equipos");
}

export async function getTacticoEquipo(equipoId: string): Promise<EquipoTactico> {
  return apiFetch<EquipoTactico>(`/api/v1/tactico/equipo/${equipoId}`);
}

export async function getTacticoPartido(partidoId: string): Promise<AnalisisPartido> {
  return apiFetch<AnalisisPartido>(`/api/v1/tactico/partido/${partidoId}`);
}

export async function getGoleadores(torneo?: string): Promise<{ goleadores: Goleador[]; total: number }> {
  const params = torneo ? `?torneo=${encodeURIComponent(torneo)}` : "";
  return apiFetch(`/api/v1/goleadores${params}`);
}

export async function getGoleadoresHistorial(): Promise<{ goleadores: Goleador[]; total: number }> {
  return apiFetch(`/api/v1/goleadores/historial`);
}

interface Goleador {
  id: string;
  nombre: string;
  club_id: string;
  club_nombre: string;
  goles: number;
  asistencias: number;
  torneo?: string;
  temporada?: string;
}

export async function getCampeones(): Promise<CampeonHistorico[]> {
  return apiFetch<CampeonHistorico[]>("/api/v1/historial/campeones");
}

export async function getRankingClubes(): Promise<RankingClubHistorico[]> {
  return apiFetch<RankingClubHistorico[]>("/api/v1/historial/ranking-clubes");
}

export async function getClubHistorial(clubId: string): Promise<ClubTemporadaHistorica[]> {
  return apiFetch<ClubTemporadaHistorica[]>(`/api/v1/historial/club/${clubId}`);
}

export async function getEstadisticasTransferencias(): Promise<EstadisticasTransferencias> {
  return apiFetch<EstadisticasTransferencias>("/api/v1/transferencias/estadisticas");
}

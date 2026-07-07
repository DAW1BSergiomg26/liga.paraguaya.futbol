export interface Club {
  id: string;
  nombre: string;
  ciudad: string;
  apodo: string;
  colores: string[];
  estadio: string;
  capacidad: number;
  fundacion: number;
  escudo: string;
}

export interface ClubDetail extends Club {
  direccion: string;
  camiseta: string;
}

export interface Partido {
  id: string;
  torneo: string;
  fecha: string;
  jornada: number;
  local_id: string;
  visitante_id: string;
  goles_local: number | null;
  goles_visitante: number | null;
  estado: string;
}

export interface PartidoDetail extends Partido {
  local_nombre: string;
  visitante_nombre: string;
}

export interface PartidoPage {
  data: Partido[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

export interface TablaRow {
  posicion: number;
  club_id: string;
  club: string;
  escudo: string;
  pj: number;
  pg: number;
  pe: number;
  pp: number;
  gf: number;
  gc: number;
  dg: number;
  puntos: number;
}

export interface User {
  id: string;
  email: string;
  name: string;
  image: string;
  username: string;
  puntos: number;
  token: string;
}

export interface PredictionCreate {
  partido_id: string;
  goles_local: number;
  goles_visitante: number;
}

export interface PredictionDetail {
  id: string;
  user_id: string;
  partido_id: string;
  goles_local: number;
  goles_visitante: number;
  puntos: number;
  created_at: string;
  torneo: string;
  jornada: number;
  local_id: string;
  visitante_id: string;
  local_nombre: string;
  visitante_nombre: string;
  goles_real_local: number | null;
  goles_real_visitante: number | null;
  estado: string;
}

export interface LeaderboardEntry {
  username: string;
  name: string;
  image: string;
  puntos: number;
  aciertos: number;
  predicciones: number;
}

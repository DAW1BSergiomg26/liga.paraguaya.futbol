export interface Club {
  id: string;
  nombre: string;
  ciudad: string;
  apodo: string;
  colores: string[];
  estadio: string;
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

export interface TablaRow {
  posicion: number;
  club_id: string;
  club: string;
  pj: number;
  pg: number;
  pe: number;
  pp: number;
  gf: number;
  gc: number;
  dg: number;
  puntos: number;
}

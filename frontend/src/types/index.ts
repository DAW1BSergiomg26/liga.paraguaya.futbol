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
  sitio_web: string;
  descripcion: string;
  titulos_liga: number;
  titulos_info: { torneo: string; cantidad: number }[];
  titulos_internacionales: { torneo: string; cantidad: number }[];
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

export interface ClubDetailData {
  type: "club_detail";
  club: {
    nombre: string;
    escudo: string;
    ciudad: string;
    estadio: string;
    capacidad: number;
    fundacion: number;
    titulos_liga: number;
    descripcion: string;
  };
  titulos: { torneo: string; cantidad: number }[];
}

export interface MatchFormData {
  type: "match_form";
  club: string;
  last5: { rival: string; resultado: string; goles_local: number | null; goles_visit: number | null }[];
  wins: number;
  draws: number;
  losses: number;
}

export interface H2HData {
  type: "h2h";
  club1: { nombre: string; escudo: string };
  club2: { nombre: string; escudo: string };
  total: number;
  wins1: number;
  draws: number;
  wins2: number;
  ultimos: { fecha: string; goles1: number; goles2: number }[];
}

export interface MiniTableData {
  type: "mini_table";
  torneo: string;
  jornada: number;
  clubes: { pos: number; nombre: string; escudo: string; pj: number; pg: number; pe: number; pp: number; pts: number }[];
  club_destacado: { pos: number; nombre: string; escudo: string; pj: number; pg: number; pe: number; pp: number; pts: number } | null;
}

export interface ComparisonData {
  type: "comparison";
  club1: { nombre: string; escudo: string; titulos: number; fundacion: number };
  club2: { nombre: string; escudo: string; titulos: number; fundacion: number };
  advantages: string[];
}

export interface NextMatchData {
  type: "next_match";
  club: string;
  rival: string;
  escudo_rival?: string;
  fecha: string;
  torneo: string;
  estadio?: string;
}

export interface PredictionData {
  type: "prediction";
  local_win_pct: number;
  draw_pct: number;
  visitor_win_pct: number;
  confidence: string;
  total_partidos?: number;
}

export interface ClubResumen {
  id: string;
  nombre: string;
  escudo: string;
}

export interface MayorGoleada {
  goles: number;
  fecha: string;
  goles_recibidos: number;
}

export interface H2HPartidoItem {
  id: string;
  torneo: string;
  jornada: number;
  fecha: string;
  estado: string;
  goles_local: number | null;
  goles_visitante: number | null;
  local_id: string;
  visitante_id: string;
}

export interface H2HResponse {
  club_a: ClubResumen;
  club_b: ClubResumen;
  resumen: {
    pj: number;
    victorias_a: number;
    empates: number;
    victorias_b: number;
    goles_a: number;
    goles_b: number;
    mayor_goleada_a: MayorGoleada | null;
    mayor_goleada_b: MayorGoleada | null;
  };
  partidos: H2HPartidoItem[];
}

export interface Noticia {
  titulo: string;
  fuente: string;
  url: string;
  pub_date: string | null;
  resumen: string;
}

export interface NoticiasResponse {
  noticias: Noticia[];
  fuentes: string[];
  actualizado: string;
}

export type StructuredData = ClubDetailData | MatchFormData | H2HData | MiniTableData | ComparisonData | NextMatchData | PredictionData | { type: "greeting" | "unknown" };

export interface JugadorTactico {
  id: string;
  nombre: string;
  posicion: string;
  numero: number;
  rating: number;
  x: number;
  y: number;
}

export interface EstadisticasEquipo {
  xg: number;
  posesion: number;
  tiros_puerta: number;
  pases_completados: number;
  duelos_ganados: number;
  corners: number;
}

export interface InsightTactico {
  icono: string;
  texto: string;
  metrica: string | null;
}

export interface PartidoResumenTactico {
  fecha: string;
  rival: string;
  resultado: string;
  formacion: string;
}

export interface EquipoTactico {
  equipo_id: string;
  nombre: string;
  escudo: string;
  formacion_principal: string;
  formaciones_disponibles: string[];
  jugadores: JugadorTactico[];
  stats: EstadisticasEquipo;
  tendencias: InsightTactico[];
  ultimos_partidos: PartidoResumenTactico[];
}

export interface EquipoPartidoTactico {
  equipo_id: string;
  nombre: string;
  formacion: string;
  jugadores: JugadorTactico[];
}

export interface StatsComparativa {
  local: EstadisticasEquipo;
  visitante: EstadisticasEquipo;
}

export interface PrediccionIA {
  gana_local: number;
  empate: number;
  gana_visitante: number;
  confianza: string;
}

export interface AnalisisPartido {
  partido_id: string;
  local: EquipoPartidoTactico;
  visitante: EquipoPartidoTactico;
  stats: StatsComparativa;
  prediccion_ia: PrediccionIA;
}

export interface EquipoResumenTactico {
  id: string;
  nombre: string;
  escudo: string;
  formacion: string;
}

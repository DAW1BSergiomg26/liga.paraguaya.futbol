import math

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from ..models.club import Club
from ..models.tabla import TablaPosicion
from ..schemas.simulator import ExactScore, SimulationResultOut


class SimulatorService:

    MAX_GOALS = 7  # Goles máximos a considerar en la matriz de Poisson

    @staticmethod
    def _poisson_pmf(k: int, lam: float) -> float:
        """Calcula la función de masa de Poisson: P(X=k) = (λ^k × e^-λ) / k!"""
        if lam <= 0:
            return 1.0 if k == 0 else 0.0
        return (lam ** k) * math.exp(-lam) / math.factorial(k)

    @staticmethod
    async def _get_club_stats(
        db: AsyncSession, club_id: str
    ) -> tuple[TablaPosicion | None, str]:
        """Recupera las estadísticas más recientes de un club en la tabla de posiciones.
        Retorna una tupla (stats, nombre_club)."""
        stmt = (
            select(TablaPosicion)
            .options(selectinload(TablaPosicion.club_rel))
            .where(TablaPosicion.club_id == club_id)
            .order_by(TablaPosicion.jornada.desc())
            .limit(1)
        )
        result = await db.execute(stmt)
        row = result.scalar_one_or_none()
        if not row:
            return None, ""
        nombre = row.club_rel.nombre if row.club_rel else ""
        return row, nombre

    @staticmethod
    async def _get_league_averages(db: AsyncSession) -> tuple[float, float]:
        """Calcula los promedios de goles a favor y en contra de toda la liga.
        Usa la última jornada disponible de cada club."""
        # Subquery: última jornada por club
        subq = (
            select(
                TablaPosicion.club_id,
                func.max(TablaPosicion.jornada).label("ultima_jornada"),
            )
            .group_by(TablaPosicion.club_id)
            .subquery()
        )

        stmt = select(TablaPosicion).join(
            subq,
            (TablaPosicion.club_id == subq.c.club_id)
            & (TablaPosicion.jornada == subq.c.ultima_jornada),
        )
        result = await db.execute(stmt)
        rows = result.scalars().all()

        if not rows:
            return 1.0, 1.0

        total_gf = sum(r.gf for r in rows)
        total_gc = sum(r.gc for r in rows)
        total_pj = sum(r.pj for r in rows)

        if total_pj == 0:
            return 1.0, 1.0

        # Promedio de goles por partido (no por club)
        avg_gf = total_gf / total_pj
        avg_gc = total_gc / total_pj

        # Evitar división por cero
        return max(avg_gf, 0.1), max(avg_gc, 0.1)

    @classmethod
    async def simulate_match(
        cls, db: AsyncSession, home_club_id: str, away_club_id: str
    ) -> SimulationResultOut:
        """Simula un partido usando distribución de Poisson.
        Calcula probabilidades de victoria/empate/derrota y los 3
        resultados exactos más probables."""

        # Recuperar estadísticas de ambos clubes
        home_stats, home_name = await cls._get_club_stats(db, home_club_id)
        away_stats, away_name = await cls._get_club_stats(db, away_club_id)

        if not home_stats:
            raise ValueError(f"Club {home_club_id} no encontrado en la tabla de posiciones")
        if not away_stats:
            raise ValueError(f"Club {away_club_id} no encontrado en la tabla de posiciones")

        # Promedios de la liga
        avg_gf, avg_gc = await cls._get_league_averages(db)

        # Índices de fuerza ofensiva y defensiva
        home_attack = (home_stats.gf / max(home_stats.pj, 1)) / avg_gf
        home_defense = (home_stats.gc / max(home_stats.pj, 1)) / avg_gc
        away_attack = (away_stats.gf / max(away_stats.pj, 1)) / avg_gf
        away_defense = (away_stats.gc / max(away_stats.pj, 1)) / avg_gc

        # Goles esperados (λ) para cada equipo
        lambda_home = home_attack * away_defense * avg_gf
        lambda_away = away_attack * home_defense * avg_gc

        # Limitar λ para evitar probabilidades extremas
        lambda_home = max(0.1, min(lambda_home, 5.0))
        lambda_away = max(0.1, min(lambda_away, 5.0))

        # Construir matriz de probabilidades de resultado exacto
        matrix: list[list[float]] = []
        for i in range(cls.MAX_GOALS):
            row = []
            for j in range(cls.MAX_GOALS):
                p = cls._poisson_pmf(i, lambda_home) * cls._poisson_pmf(j, lambda_away)
                row.append(p)
            matrix.append(row)

        # Calcular probabilidades de resultado
        prob_home = sum(
            matrix[i][j] for i in range(cls.MAX_GOALS) for j in range(cls.MAX_GOALS) if i > j
        )
        prob_draw = sum(
            matrix[i][j] for i in range(cls.MAX_GOALS) for j in range(cls.MAX_GOALS) if i == j
        )
        prob_away = sum(
            matrix[i][j] for i in range(cls.MAX_GOALS) for j in range(cls.MAX_GOALS) if j > i
        )

        # Normalizar (por si hay truncamiento en MAX_GOALS)
        total = prob_home + prob_draw + prob_away
        if total > 0:
            prob_home /= total
            prob_draw /= total
            prob_away /= total

        # Extraer los 3 resultados exactos más probables
        all_scores: list[ExactScore] = []
        for i in range(cls.MAX_GOALS):
            for j in range(cls.MAX_GOALS):
                all_scores.append(
                    ExactScore(
                        goles_local=i,
                        goles_visitante=j,
                        probabilidad=round(matrix[i][j], 6),
                    )
                )

        all_scores.sort(key=lambda s: s.probabilidad, reverse=True)
        top3 = all_scores[:3]

        return SimulationResultOut(
            home_club_id=home_club_id,
            home_club_name=home_name,
            away_club_id=away_club_id,
            away_club_name=away_name,
            probabilidad_local=round(prob_home * 100, 2),
            probabilidad_empate=round(prob_draw * 100, 2),
            probabilidad_visitante=round(prob_away * 100, 2),
            lambda_local=round(lambda_home, 3),
            lambda_visitante=round(lambda_away, 3),
            resultados_mas_probables=top3,
        )

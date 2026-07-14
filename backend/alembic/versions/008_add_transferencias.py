"""create transferencias table

Revision ID: 008
Revises: 007
Create Date: 2026-07-14
"""
from alembic import op
import sqlalchemy as sa

revision = "008"
down_revision = "007"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "transferencias",
        sa.Column("id", sa.String(50), primary_key=True),
        sa.Column("jugador_nombre", sa.String(200), nullable=False),
        sa.Column("jugador_posicion", sa.String(50), nullable=True),
        sa.Column("club_origen_id", sa.String(50), sa.ForeignKey("clubes.id"), nullable=True),
        sa.Column("club_destino_id", sa.String(50), sa.ForeignKey("clubes.id"), nullable=False),
        sa.Column("fecha", sa.Date, nullable=False),
        sa.Column("tipo", sa.String(20), nullable=False, server_default="confirmada"),
        sa.Column("estado", sa.String(20), nullable=False, server_default="confirmada"),
        sa.Column("monto", sa.Float, nullable=True),
        sa.Column("duracion_meses", sa.Integer, nullable=True),
        sa.Column("fuente_url", sa.String(1000), nullable=True),
        sa.Column("fuente_nombre", sa.String(100), nullable=True),
        sa.Column("verification_level", sa.Integer, server_default="3"),
        sa.Column("is_active", sa.Boolean, server_default="1"),
        sa.Column("created_at", sa.DateTime, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime, server_default=sa.func.now()),
    )
    op.create_index("ix_transferencias_club_destino", "transferencias", ["club_destino_id"])
    op.create_index("ix_transferencias_club_origen", "transferencias", ["club_origen_id"])
    op.create_index("ix_transferencias_fecha", "transferencias", ["fecha"])
    op.create_index("ix_transferencias_estado", "transferencias", ["estado"])


def downgrade() -> None:
    op.drop_table("transferencias")

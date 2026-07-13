"""add goleadores table

Revision ID: 004
Revises: 003
Create Date: 2026-07-13
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "004"
down_revision: Union[str, None] = "003"


def upgrade() -> None:
    op.create_table(
        "goleadores",
        sa.Column("id", sa.String(50), primary_key=True),
        sa.Column("nombre", sa.String(100), nullable=False),
        sa.Column("club_id", sa.String(50), sa.ForeignKey("clubes.id"), nullable=False),
        sa.Column("goles", sa.Integer, server_default=sa.text("0")),
        sa.Column("asistencias", sa.Integer, server_default=sa.text("0")),
        sa.Column("torneo", sa.String(100), nullable=False),
        sa.Column("temporada", sa.String(20), nullable=False),
        sa.Column("updated_at", sa.DateTime, nullable=True),
    )


def downgrade() -> None:
    op.drop_table("goleadores")

"""create noticias table

Revision ID: 006
Revises: 005
Create Date: 2026-07-13
"""
from alembic import op
import sqlalchemy as sa

revision = "006"
down_revision = "005"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "noticias",
        sa.Column("id", sa.String(50), primary_key=True),
        sa.Column("titulo", sa.String(500), nullable=False),
        sa.Column("resumen", sa.Text, nullable=True),
        sa.Column("contenido", sa.Text, nullable=True),
        sa.Column("imagen_url", sa.String(1000), nullable=True),
        sa.Column("video_url", sa.String(500), nullable=True),
        sa.Column("fuente", sa.String(100), nullable=False),
        sa.Column("origen", sa.String(20), nullable=False, server_default="editorial"),
        sa.Column("url_original", sa.String(1000), nullable=True),
        sa.Column("pub_date", sa.DateTime, nullable=False),
        sa.Column("created_at", sa.DateTime, server_default=sa.func.now()),
        sa.Column("is_published", sa.Boolean, server_default=sa.text("1")),
    )
    op.create_index("idx_noticias_pub_date", "noticias", ["pub_date"])
    op.create_index("idx_noticias_origen", "noticias", ["origen"])
    op.create_index("idx_noticias_fuente", "noticias", ["fuente"])


def downgrade() -> None:
    op.drop_index("idx_noticias_fuente")
    op.drop_index("idx_noticias_origen")
    op.drop_index("idx_noticias_pub_date")
    op.drop_table("noticias")

"""add api_keys table

Revision ID: 003
Revises: 6fbc92ce284a
Create Date: 2026-07-08
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "003"
down_revision: Union[str, None] = "6fbc92ce284a"


def upgrade() -> None:
    op.create_table(
        "api_keys",
        sa.Column("key", sa.String(36), primary_key=True),
        sa.Column("owner", sa.String(255), nullable=False),
        sa.Column("email", sa.String(255), nullable=False),
        sa.Column("is_active", sa.Boolean, server_default=sa.text("1")),
        sa.Column("requests_count", sa.Integer, server_default=sa.text("0")),
        sa.Column("created_at", sa.DateTime, server_default=sa.func.now()),
        sa.Column("last_used_at", sa.DateTime, nullable=True),
    )


def downgrade() -> None:
    op.drop_table("api_keys")

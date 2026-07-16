"""add hashed_password to users

Revision ID: 005
Revises: 004
Create Date: 2026-07-13
"""
from alembic import op
import sqlalchemy as sa

revision = "005"
down_revision = "004"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("users", sa.Column("hashed_password", sa.String(256), nullable=True))


def downgrade() -> None:
    op.drop_column("users", "hashed_password")

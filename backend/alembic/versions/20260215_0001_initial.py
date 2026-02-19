"""initial tables

Revision ID: 20260215_0001
Revises: 
Create Date: 2026-02-15
"""

from __future__ import annotations

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision = "20260215_0001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "bot_settings",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("general", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("automod", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("welcome", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("leave", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("leveling", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
    )

    op.create_table(
        "bot_logs",
        sa.Column("id", sa.BigInteger(), primary_key=True),
        sa.Column("timestamp", sa.String(length=32), nullable=False),
        sa.Column("server", sa.String(length=128), nullable=False),
        sa.Column("user", sa.String(length=128), nullable=False),
        sa.Column("action", sa.String(length=64), nullable=False),
        sa.Column("details", sa.Text(), nullable=False),
        sa.Column("level", sa.String(length=16), nullable=False),
    )

    op.create_table(
        "bot_commands",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("name", sa.String(length=64), nullable=False),
        sa.Column("category", sa.String(length=32), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("usage", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("enabled", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("cooldown", sa.String(length=16), nullable=False, server_default="0s"),
    )
    op.create_unique_constraint("uq_bot_commands_name", "bot_commands", ["name"])


def downgrade() -> None:
    op.drop_constraint("uq_bot_commands_name", "bot_commands", type_="unique")
    op.drop_table("bot_commands")
    op.drop_table("bot_logs")
    op.drop_table("bot_settings")

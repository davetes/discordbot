from alembic.config import Config
from alembic import command

# Create alembic configuration
alembic_cfg = Config("alembic.ini")

# Run the upgrade
command.upgrade(alembic_cfg, "head")
print("Migration completed successfully!")

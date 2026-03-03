import sys
sys.path.insert(0, '.')

from app.database import engine, Base
from app.models import UserModel
from sqlalchemy import inspect

# Create all tables
print("Creating users table...")
Base.metadata.create_all(bind=engine)
print("Done!")

# Verify table exists
inspector = inspect(engine)
tables = inspector.get_table_names()
print(f"Tables in database: {tables}")

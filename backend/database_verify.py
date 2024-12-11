from sqlalchemy import inspect
from database import engine

inspector = inspect(engine)

# Check chat_threads structure
print("\nChat Threads columns:")
for column in inspector.get_columns('chat_threads'):
    print(f"- {column['name']}: {column['type']}")

# Check chat_messages structure
print("\nChat Messages columns:")
for column in inspector.get_columns('chat_messages'):
    print(f"- {column['name']}: {column['type']}")

# Check indexes and foreign keys
print("\nChat Messages indexes:")
for index in inspector.get_indexes('chat_messages'):
    print(f"- {index['name']}: {index['column_names']}")

print("\nChat Messages foreign keys:")
for fk in inspector.get_foreign_keys('chat_messages'):
    print(f"- {fk['name']}: {fk['referred_table']}.{fk['referred_columns']}")
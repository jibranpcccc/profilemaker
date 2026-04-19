import sqlite3
import json

def check_db():
    try:
        conn = sqlite3.connect('ProfileMaker.db')
        cursor = conn.cursor()
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
        tables = [t[0] for t in cursor.fetchall()]
        print(f'Tables: {tables}')
        schema = {}
        for table in tables:
            cursor.execute(f'PRAGMA table_info({table});')
            cols = [f'{c[1]} ({c[2]})' for c in cursor.fetchall()]
            schema[table] = cols
            print(f'Schema for {table}: {cols}')
        conn.close()
        return schema
    except Exception as e:
        print(f'Error: {e}')
        return None

if __name__ == "__main__":
    check_db()

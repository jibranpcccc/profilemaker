import os
import sqlite3
import json

def check_local_db():
    db_path = os.path.expandvars(r'%LOCALAPPDATA%\ProfileSubmissionAssistant\data.db')
    if not os.path.exists(db_path):
        print('LocalAppData DB NOT FOUND')
        return
    
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
        tables = [t[0] for t in cursor.fetchall()]
        print(f'Tables: {tables}')
        for table in tables:
            cursor.execute(f'PRAGMA table_info({table});')
            cols = [f'{c[1]} ({c[2]})' for c in cursor.fetchall()]
            print(f'Schema for {table}: {cols}')
        
        if 'Sites' in tables:
            cursor.execute("SELECT COUNT(*) FROM Sites")
            print(f'Sites count: {cursor.fetchone()[0]}')
            cursor.execute("SELECT SignupUrl FROM Sites LIMIT 5")
            print('Sample SignupUrls:', [r[0] for r in cursor.fetchall()])
            
        if 'LearnedSitePatterns' in tables:
            cursor.execute("SELECT COUNT(*) FROM LearnedSitePatterns")
            print(f'LearnedSitePatterns count: {cursor.fetchone()[0]}')
            
        conn.close()
    except Exception as e:
        print(f'Error: {e}')

if __name__ == '__main__':
    check_local_db()

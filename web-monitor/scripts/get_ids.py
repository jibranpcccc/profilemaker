import sqlite3
import os

app_data = os.getenv('LOCALAPPDATA')
db_path = os.path.join(app_data, 'ProfileSubmissionAssistant', 'data.db')

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

cursor.execute('SELECT Id FROM Sites')
site_ids = [row[0] for row in cursor.fetchall()]

conn.close()
print(site_ids)

import sqlite3
import os

app_data = os.getenv('LOCALAPPDATA')
db_path = os.path.join(app_data, 'ProfileSubmissionAssistant', 'data.db')

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

cursor.execute('SELECT FinalProfileUrl FROM Proofs WHERE FinalProfileUrl IS NOT NULL')
urls = cursor.fetchall()
print(f"Total Live Links in DB: {len(urls)}")
for u in urls:
    print(u[-1])
conn.close()

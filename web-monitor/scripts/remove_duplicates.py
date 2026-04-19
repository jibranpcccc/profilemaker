import sqlite3
import os

app_data = os.getenv('LOCALAPPDATA')
db_path = os.path.join(app_data, 'ProfileSubmissionAssistant', 'data.db')

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

cursor.execute('SELECT Id, SiteName FROM Sites ORDER BY Id ASC')
sites = cursor.fetchall()

print(f"Total sites in DB: {len(sites)}")

seen_names = set()
duplicates = []

for site in sites:
    site_id = site[0]
    site_name = site[1]
    if site_name in seen_names:
        duplicates.append(site_id)
    else:
        seen_names.add(site_name)

print(f"Found {len(duplicates)} duplicate domains.")

if duplicates:
    for site_id in duplicates:
        cursor.execute('DELETE FROM SiteTasks WHERE SiteId = ?', (site_id,))
        cursor.execute('DELETE FROM Sites WHERE Id = ?', (site_id,))
    conn.commit()
    print("Duplicates removed.")
else:
    print("No duplicates found.")

conn.close()

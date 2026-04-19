import sqlite3
import os

app_data = os.getenv('LOCALAPPDATA')
db_path = os.path.join(app_data, 'ProfileSubmissionAssistant', 'data.db')

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# Get the latest campaign id
cursor.execute('SELECT Id FROM Campaigns ORDER BY Id DESC LIMIT 1')
latest_campaign = cursor.fetchone()[0]

cursor.execute('''
    SELECT s.SiteName, t.Status, t.Notes, pr.FinalProfileUrl 
    FROM SiteTasks t 
    JOIN Sites s ON t.SiteId = s.Id 
    LEFT JOIN Proofs pr on pr.SiteTaskId = t.Id 
    WHERE t.CampaignId = ?
''', (latest_campaign,))
tasks = cursor.fetchall()

print(f"--- Results for Campaign {latest_campaign} ---")
live_count = 0
for task in tasks:
    site = task[0]
    status = task[1]
    notes = task[2]
    url = task[3]
    if url:
        print(f"[LIVE] {site} -> {url}")
        live_count += 1
    else:
        print(f"[PENDING/FAILED] {site} -> Status: {status} | Notes: {notes}")
        
print(f"Total Live Links Generated in this run: {live_count}")
conn.close()

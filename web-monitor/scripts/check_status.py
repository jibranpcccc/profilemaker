import sqlite3
import os

app_data = os.getenv('LOCALAPPDATA')
db_path = os.path.join(app_data, 'ProfileSubmissionAssistant', 'data.db')

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

cursor.execute('SELECT s.SiteName, t.Status, t.CurrentStep, t.Notes, pr.FinalProfileUrl FROM SiteTasks t JOIN Sites s ON t.SiteId = s.Id LEFT JOIN Proofs pr on pr.SiteTaskId = t.Id WHERE t.CampaignId = 19')
tasks = cursor.fetchall()

print("Tasks for Campaign 19:")
for task in tasks:
    print(f"Domain: {task[0]} | Status: {task[1]} | Step: {task[2]} \nLive URL: {task[4]}\nNotes: {task[3]}\n")

conn.close()

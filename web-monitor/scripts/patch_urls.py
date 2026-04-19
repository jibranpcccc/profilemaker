import sqlite3
import os

app_data = os.getenv('LOCALAPPDATA')
db_path = os.path.join(app_data, 'ProfileSubmissionAssistant', 'data.db')

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# Find bad URLs in Proofs table
cursor.execute('SELECT Proofs.Id, Proofs.FinalProfileUrl, Personas.Username FROM Proofs JOIN SiteTasks ON Proofs.SiteTaskId = SiteTasks.Id JOIN Campaigns ON SiteTasks.CampaignId = Campaigns.Id JOIN Personas ON Campaigns.PersonaId = Personas.Id WHERE Proofs.FinalProfileUrl LIKE "%settings%" OR Proofs.FinalProfileUrl LIKE "%edit%"')
bad_urls = cursor.fetchall()

print(f"Found {len(bad_urls)} incorrect background URLs. Patching...")

for row in bad_urls:
    proof_id = row[0]
    bad_url = row[1]
    username = row[2]
    
    new_url = ""
    if "institutocrecer.edu.co" in bad_url:
        new_url = f"https://institutocrecer.edu.co/profile/{username}/"
    elif "learndash.aula.edu.pe" in bad_url:
        new_url = f"https://learndash.aula.edu.pe/members/{username}/profile/"
        
    if new_url:
        cursor.execute('UPDATE Proofs SET FinalProfileUrl = ? WHERE Id = ?', (new_url, proof_id))
        print(f"Patched: {bad_url} -> {new_url}")

conn.commit()
conn.close()

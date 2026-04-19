import sqlite3
import os
import urllib.request
import urllib.error

app_data = os.getenv('LOCALAPPDATA')
db_path = os.path.join(app_data, 'ProfileSubmissionAssistant', 'data.db')

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# Get URLs from campaigns 21
cursor.execute('''
    SELECT s.SiteName, pr.FinalProfileUrl 
    FROM SiteTasks t 
    JOIN Sites s ON t.SiteId = s.Id 
    JOIN Proofs pr on pr.SiteTaskId = t.Id 
    WHERE t.CampaignId = 21 AND pr.FinalProfileUrl IS NOT NULL
''')
tasks = cursor.fetchall()
conn.close()

print(f"Checking {len(tasks)} URLs from Campaign 21 for HTTP 200 OK...")

def check_url(url):
    try:
        req = urllib.request.Request(
            url, 
            headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36'}
        )
        response = urllib.request.urlopen(req, timeout=10)
        return response.getcode()
    except urllib.error.HTTPError as e:
        return e.code
    except Exception as e:
        return str(e)

for site, url in tasks:
    status = check_url(url)
    print(f"[{status}] {url}")

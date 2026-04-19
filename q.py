import sqlite3, os
db = sqlite3.connect(os.path.join(os.environ['LOCALAPPDATA'], 'ProfileSubmissionAssistant', 'data.db'))
c = db.cursor()
c.execute("SELECT SiteName, SignupUrl FROM Sites LIMIT 20")
print("First 20 sites:")
for r in c.fetchall(): print(r)

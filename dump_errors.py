import sqlite3, os

db = os.path.join(os.environ["LOCALAPPDATA"], "ProfileSubmissionAssistant", "data.db")
conn = sqlite3.connect(db)
cur = conn.cursor()
cur.execute("SELECT s.SiteName, t.Notes FROM SiteTasks t JOIN Sites s ON s.Id=t.SiteId WHERE t.Status='Failed'")
for site, notes in cur.fetchall():
    if notes:
        lines = [l for l in notes.splitlines() if "ERROR" in l or "error" in l.lower() or "WARNING" in l]
        print(f"\n--- {site} ---")
        for l in lines[-5:]:
            print(" ", l)
conn.close()

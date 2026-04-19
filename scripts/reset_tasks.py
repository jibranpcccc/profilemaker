import sqlite3, os

db = os.path.join(os.environ["LOCALAPPDATA"], "ProfileSubmissionAssistant", "data.db")
conn = sqlite3.connect(db)

# Reset ALL failed or pending tasks back to New so they get retried
conn.execute("UPDATE SiteTasks SET Status='New', CurrentStep='Ready to Start', Notes='' WHERE Status IN ('Failed','New')")
conn.commit()

cur = conn.cursor()
cur.execute("SELECT Status, COUNT(*) FROM SiteTasks GROUP BY Status")
for r in cur.fetchall():
    print(r[0], r[1])

conn.close()
print("Done - all tasks reset to New")

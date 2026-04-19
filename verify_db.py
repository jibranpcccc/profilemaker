import sqlite3, os

db = os.path.join(os.environ["LOCALAPPDATA"], "ProfileSubmissionAssistant", "data.db")
conn = sqlite3.connect(db)
cur = conn.cursor()

cur.execute("SELECT Id, SiteName, PlatformVersionOrVariant, EmailVerificationRequired, BacklinkVisibleByDefault FROM Sites ORDER BY Id")
rows = cur.fetchall()
print(f"Total sites in DB: {len(rows)}\n")
print(f"{'#':<3} {'Site':<42} {'Platform':<30} {'Email Verify':<13} {'Backlink'}")
print("-" * 100)
for r in rows:
    ev = "Yes" if r[3] else "No"
    bl = "Yes" if r[4] else "No"
    print(f"{r[0]:<3} {r[1]:<42} {(r[2] or ''):<30} {ev:<13} {bl}")

cur.execute("SELECT COUNT(*) FROM SiteTasks WHERE Status='New'")
print(f"\nPending tasks queued: {cur.fetchone()[0]}")
conn.close()

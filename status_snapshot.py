import sqlite3, os, time, sys

db = os.path.join(os.environ["LOCALAPPDATA"], "ProfileSubmissionAssistant", "data.db")
log = os.path.join(os.environ["LOCALAPPDATA"], "ProfileSubmissionAssistant", "Logs", "ProfileMaker_DebugLog.txt")

# --- DB snapshot ---
conn = sqlite3.connect(db)
cur = conn.cursor()
cur.execute("""
    SELECT s.SiteName, t.Status, t.CurrentStep, t.Notes
    FROM SiteTasks t JOIN Sites s ON s.Id=t.SiteId
    ORDER BY t.Status DESC, s.SiteName
""")
rows = cur.fetchall()
conn.close()

# Summary
completed = [r for r in rows if r[1]=="Completed"]
failed    = [r for r in rows if r[1]=="Failed"]
running   = [r for r in rows if r[1] not in ("New","Completed","Failed","Ready to Start","")]
pending   = [r for r in rows if r[1] in ("New","Ready to Start","")]

print(f"\n{'='*65}")
print(f"  STATUS @ {time.strftime('%H:%M:%S')} | Done:{len(completed)} Failed:{len(failed)} Running:{len(running)} Pending:{len(pending)}")
print(f"{'='*65}")

if completed:
    print("\n[COMPLETED]")
    for r in completed:
        print(f"  OK  {r[0]}")

if running:
    print("\n[RUNNING]")
    for r in running:
        print(f"  >> {r[0]} | {r[1]} | {r[2]}")

if failed:
    print("\n[FAILED]")
    for r in failed:
        # show last error line from notes
        notes_lines = [l for l in (r[3] or "").splitlines() if "ERROR" in l or "error" in l.lower()]
        last_err = notes_lines[-1].strip() if notes_lines else r[2]
        print(f"  XX  {r[0]:<42} {last_err[:60]}")

if pending:
    print("\n[PENDING / QUEUED]")
    for r in pending:
        print(f"  .. {r[0]}")

# --- Last 30 important log lines ---
print(f"\n{'='*65}")
print("  RECENT LOG EVENTS (errors + successes)")
print(f"{'='*65}")
try:
    with open(log, encoding="utf-8", errors="ignore") as f:
        lines = f.readlines()
    important = [l.strip() for l in lines[-200:] if any(kw in l for kw in
        ["SUCCESS","ERROR","CAPTCHA","DONE","Backlink","PROOF","submitted","Registration error",
         "password","mismatch","timeout","verified","handle","username cannot","empty"])]
    for line in important[-30:]:
        print("  " + line)
except Exception as e:
    print(f"  (log read error: {e})")

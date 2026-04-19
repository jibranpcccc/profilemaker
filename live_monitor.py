import sqlite3, os, time, sys

# Force UTF-8 output on Windows
sys.stdout.reconfigure(encoding='utf-8')

db = os.path.join(os.environ["LOCALAPPDATA"], "ProfileSubmissionAssistant", "data.db")
log = os.path.join(os.environ["LOCALAPPDATA"], "ProfileSubmissionAssistant", "Logs", "ProfileMaker_DebugLog.txt")

last_log_size = 0
last_statuses = {}

def get_statuses():
    conn = sqlite3.connect(db)
    cur = conn.cursor()
    cur.execute("""
        SELECT s.SiteName, t.Status, t.CurrentStep
        FROM SiteTasks t JOIN Sites s ON s.Id=t.SiteId
        ORDER BY t.Id
    """)
    rows = {r[0]: (r[1], r[2]) for r in cur.fetchall()}
    conn.close()
    return rows

def get_log_delta():
    global last_log_size
    try:
        size = os.path.getsize(log)
        if size > last_log_size:
            with open(log, encoding="utf-8", errors="ignore") as f:
                f.seek(last_log_size)
                delta = f.read()
            last_log_size = size
            return delta
    except:
        pass
    return ""

print("=" * 60)
print("  LIVE MONITOR — ProfileSubmissionAssistant")
print("  Press Ctrl+C to stop")
print("=" * 60)

iteration = 0
while True:
    iteration += 1
    now = time.strftime("%H:%M:%S")
    statuses = get_statuses()

    # Detect changes
    changed = []
    for site, (status, step) in statuses.items():
        old = last_statuses.get(site, ("", ""))
        if old[0] != status:
            changed.append((site, old[0], status))

    # Print header every iteration
    completed   = sum(1 for s, _ in statuses.values() if s == "Completed")
    failed      = sum(1 for s, _ in statuses.values() if s == "Failed")
    in_progress = sum(1 for s, _ in statuses.values() if s not in ("New", "Completed", "Failed", "Ready to Start"))
    pending     = sum(1 for s, _ in statuses.values() if s in ("New", "Ready to Start"))

    print(f"\n[{now}] TICK #{iteration} | ✅ Done: {completed} | ❌ Failed: {failed} | 🔄 Running: {in_progress} | ⏳ Pending: {pending}")

    # Print status changes
    for site, old_s, new_s in changed:
        emoji = "✅" if new_s == "Completed" else "❌" if new_s == "Failed" else "🔄"
        print(f"  {emoji} STATUS CHANGE: {site:<40} {old_s} → {new_s}")

    # Print recent log lines (errors + successes)
    delta = get_log_delta()
    if delta:
        important = [l for l in delta.splitlines() if any(kw in l for kw in
            ["SUCCESS", "FAILED", "ERROR", "Registration error", "Backlink", "PROOF",
             "DONE!", "timeout", "CAPTCHA", "SUBMIT", "Profile filled", "profile url"])]
        if important:
            print("  📋 Recent events:")
            for line in important[-15:]:
                print(f"     {line.strip()}")

    last_statuses = {s: v for s, v in statuses.items()}

    # Stop if all done
    if completed + failed == 20:
        print("\n" + "=" * 60)
        print(f"  🎉 ALL DONE! Completed: {completed} | Failed: {failed}")
        print("=" * 60)
        break

    time.sleep(20)

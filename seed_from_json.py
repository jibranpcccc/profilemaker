"""
seed_from_json.py
-----------------
Seeds ALL 21 sites from platform_dataset.json into the real app DB at
%LOCALAPPDATA%\ProfileSubmissionAssistant\data.db

Populates every column the schema supports:
  - SiteName, Homepage, SignupUrl, LoginUrl, ProfileEditUrl
  - PublicProfileUrlPattern, PlatformVersionOrVariant
  - WebsiteFieldSelector, BioFieldSelector, SaveButtonSelector
  - EmailVerificationRequired, BacklinkVisibleByDefault
  - RequiredFieldsJson, CheckboxFieldsJson, DropdownFieldsJson
  - IsActive, ReliabilityScore
  And creates a matching SiteTask with status='New'.
"""

import os, sqlite3, json, textwrap

# ── paths ──────────────────────────────────────────────────────────────────────
SCRIPT_DIR  = os.path.dirname(os.path.abspath(__file__))
JSON_PATH   = os.path.join(SCRIPT_DIR, "platform_dataset.json")
DB_PATH     = os.path.join(os.environ["LOCALAPPDATA"], "ProfileSubmissionAssistant", "data.db")

if not os.path.exists(DB_PATH):
    print(f"[ERROR] Database not found at:\n  {DB_PATH}")
    print("Please launch the ProfileSubmissionAssistant app once to create the database, then re-run this script.")
    raise SystemExit(1)

# ── load JSON ──────────────────────────────────────────────────────────────────
with open(JSON_PATH, encoding="utf-8") as f:
    sites = json.load(f)

print(f"[INFO] Loaded {len(sites)} sites from platform_dataset.json")

conn = sqlite3.connect(DB_PATH)
conn.row_factory = sqlite3.Row
cur  = conn.cursor()

# ── ensure a default project exists ───────────────────────────────────────────
cur.execute("SELECT Id FROM Projects LIMIT 1")
row = cur.fetchone()
if row:
    project_id = row["Id"]
    print(f"[INFO] Using existing project Id={project_id}")
else:
    cur.execute("""
        INSERT INTO Projects (Name, BrandName, Niche, WebsiteUrl, CreatedAt, UpdatedAt)
        VALUES ('Default Project', 'Brand', 'General', 'https://example.com',
                datetime('now'), datetime('now'))
    """)
    project_id = cur.lastrowid
    print(f"[INFO] Created new project Id={project_id}")

# ── helper: derive homepage from any URL ──────────────────────────────────────
def homepage(url: str) -> str:
    from urllib.parse import urlparse
    p = urlparse(url)
    return f"{p.scheme}://{p.netloc}/"

# ── seed each site ────────────────────────────────────────────────────────────
added_sites   = 0
skipped_sites = 0
added_tasks   = 0

for s in sites:
    domain  = s.get("domain", "")
    # strip any path prefix that may have been included in domain field
    site_name = domain.replace("www.", "").strip("/")

    signup_url      = s.get("register_url", "")
    login_url       = s.get("login_url", "")
    profile_edit    = s.get("profile_edit_url", "")
    profile_pattern = s.get("profile_pattern", "")
    platform        = s.get("platform", "")
    hp              = homepage(signup_url) if signup_url else ""

    # selectors
    pf = s.get("profile_fields", {})
    website_sel = pf.get("website", "")
    bio_sel     = pf.get("bio", "")
    save_sel    = s.get("save_button", "")

    # registration fields → JSON blob
    req_fields  = json.dumps(s.get("fields", {}))
    cb_fields   = json.dumps(s.get("checkboxes", {}))
    dd_fields   = json.dumps(s.get("dropdowns", {}))

    email_verify    = 1 if str(s.get("email_verification", "FALSE")).upper() == "TRUE" else 0
    backlink_vis    = 1 if str(s.get("backlink_supported", "TRUE")).upper()  == "TRUE" else 0

    # ── insert site if not already there ────────────────────────────────────
    cur.execute("SELECT Id FROM Sites WHERE SiteName = ?", (site_name,))
    existing = cur.fetchone()

    if existing:
        site_id = existing["Id"]
        # update with the full data in case it was inserted with minimal info before
        cur.execute("""
            UPDATE Sites SET
                Homepage                = ?,
                SignupUrl               = ?,
                LoginUrl                = ?,
                ProfileEditUrl          = ?,
                PublicProfileUrlPattern = ?,
                PlatformVersionOrVariant= ?,
                WebsiteFieldSelector    = ?,
                BioFieldSelector        = ?,
                SaveButtonSelector      = ?,
                EmailVerificationRequired = ?,
                BacklinkVisibleByDefault  = ?,
                RequiredFieldsJson      = ?,
                CheckboxFieldsJson      = ?,
                DropdownFieldsJson      = ?,
                IsActive                = 1,
                ReliabilityScore        = 80,
                UpdatedAt               = datetime('now')
            WHERE Id = ?
        """, (hp, signup_url, login_url, profile_edit, profile_pattern,
              platform, website_sel, bio_sel, save_sel,
              email_verify, backlink_vis,
              req_fields, cb_fields, dd_fields,
              site_id))
        print(f"  [UPDATE] {site_name}")
        skipped_sites += 1
    else:
        cur.execute("""
            INSERT INTO Sites (
                ProjectId, SiteName, Homepage, SignupUrl, LoginUrl,
                ProfileEditUrl, PublicProfileUrlPattern, PlatformVersionOrVariant,
                WebsiteFieldSelector, BioFieldSelector, SaveButtonSelector,
                EmailVerificationRequired, BacklinkVisibleByDefault,
                RequiredFieldsJson, CheckboxFieldsJson, DropdownFieldsJson,
                IsActive, ReliabilityScore,
                CreatedAt, UpdatedAt
            ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,datetime('now'),datetime('now'))
        """, (project_id, site_name, hp, signup_url, login_url,
              profile_edit, profile_pattern, platform,
              website_sel, bio_sel, save_sel,
              email_verify, backlink_vis,
              req_fields, cb_fields, dd_fields,
              1, 80))
        site_id = cur.lastrowid
        print(f"  [ADD]    {site_name}")
        added_sites += 1

    # ── create SiteTask if none pending ─────────────────────────────────────
    cur.execute("SELECT COUNT(*) FROM SiteTasks WHERE SiteId = ? AND Status != 'Completed'", (site_id,))
    pending = cur.fetchone()[0]
    if pending == 0:
        cur.execute("""
            INSERT INTO SiteTasks (SiteId, Status, CurrentStep)
            VALUES (?, 'New', 'Ready to Start')
        """, (site_id,))
        added_tasks += 1

conn.commit()
conn.close()

print()
print("=" * 50)
print(f"  Sites added   : {added_sites}")
print(f"  Sites updated : {skipped_sites}")
print(f"  Tasks created : {added_tasks}")
print(f"  DB path       : {DB_PATH}")
print("=" * 50)
print("Done! Open the app and all sites should appear.")

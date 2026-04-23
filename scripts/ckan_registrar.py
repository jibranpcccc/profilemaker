#!/usr/bin/env python3
"""
ckan_registrar.py
ProfileMaker — CKAN Auto-Registration Module
Antigravity Integration | Root: C:\\Users\\jibra\\Desktop\\1\\profile new maker

Flow:
  1. Load CKAN entries from platform_dataset.json
  2. For each site: navigate → fill form → solve captcha → submit
  3. Edit profile: inject DeepSeek bio + backlink URL
  4. Verify profile URL → save to ProfileMaker.db + live_links.json
"""

import asyncio
import json
import os
import random
import string
import sqlite3
import logging
from datetime import datetime
from pathlib import Path

from playwright.async_api import async_playwright, TimeoutError as PWTimeout
from twocaptcha import TwoCaptcha
import httpx

# ─────────────────────────────────────────────
# CONFIG — Edit these before running
# ─────────────────────────────────────────────
ROOT_DIR        = Path(__file__).resolve().parent.parent
DATASET_PATH    = ROOT_DIR / "platform_dataset.json"
DB_PATH         = ROOT_DIR / "ProfileMaker.db"
LIVE_LINKS_PATH = ROOT_DIR / "live_links.json"
LOG_PATH        = ROOT_DIR / "logs" / "ckan_registrar.log"

TWOCAPTCHA_API_KEY = "YOUR_2CAPTCHA_API_KEY"   # ← Replace
DEEPSEEK_API_KEY   = "YOUR_DEEPSEEK_API_KEY"    # ← Replace
TARGET_URL         = "https://YOUR-TARGET-SITE.com"  # ← Your client backlink
NICHE              = "open data and public information"  # ← Your niche keyword

# Email provider: supply a list OR integrate a temp-mail API
# Format: list of "email:password" strings
EMAIL_LIST_PATH = ROOT_DIR / "emails.txt"

HEADLESS        = True    # Set False to watch browser
CONCURRENCY     = 3       # How many browsers run at once
REQUEST_DELAY   = (3, 7)  # Random delay between actions (seconds)

# ─────────────────────────────────────────────
# LOGGING
# ─────────────────────────────────────────────
LOG_PATH.parent.mkdir(exist_ok=True)
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.FileHandler(LOG_PATH),
        logging.StreamHandler()
    ]
)
log = logging.getLogger("ckan_registrar")

# ─────────────────────────────────────────────
# DATABASE SETUP
# ─────────────────────────────────────────────
def init_db():
    conn = sqlite3.connect(DB_PATH)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS ckan_profiles (
            id            INTEGER PRIMARY KEY AUTOINCREMENT,
            domain        TEXT NOT NULL,
            username      TEXT NOT NULL,
            email         TEXT,
            profile_url   TEXT,
            backlink_url  TEXT,
            platform_type TEXT DEFAULT 'ckan',
            status        TEXT DEFAULT 'pending',
            error_msg     TEXT,
            created_at    TEXT
        )
    """)
    conn.commit()
    conn.close()
    log.info("DB initialised at %s", DB_PATH)

def save_to_db(domain, username, email, profile_url, status, error_msg=""):
    conn = sqlite3.connect(DB_PATH)
    conn.execute("""
        INSERT INTO ckan_profiles
            (domain, username, email, profile_url, backlink_url, status, error_msg, created_at)
        VALUES (?,?,?,?,?,?,?,?)
    """, (domain, username, email, profile_url, TARGET_URL, status, error_msg,
          datetime.now().isoformat()))
    conn.commit()
    conn.close()

def save_live_link(domain, profile_url, username):
    data = []
    if LIVE_LINKS_PATH.exists():
        with open(LIVE_LINKS_PATH) as f:
            try:
                data = json.load(f)
            except json.JSONDecodeError:
                data = []
    data.append({
        "domain": domain,
        "profile_url": profile_url,
        "username": username,
        "platform_type": "ckan",
        "added_at": datetime.now().isoformat()
    })
    with open(LIVE_LINKS_PATH, "w") as f:
        json.dump(data, f, indent=2)

# ─────────────────────────────────────────────
# DATA GENERATORS
# ─────────────────────────────────────────────
FIRST_NAMES = ["Alice","James","Omar","Priya","Lucas","Sofia","Tariq","Elena","Noah","Aisha"]
LAST_NAMES  = ["Turner","Hassan","Reyes","Kim","Kovač","Nwosu","Fernandez","Brooks","Patel","Walsh"]

def random_name():
    return random.choice(FIRST_NAMES), random.choice(LAST_NAMES)

def random_username(first, last):
    suffix = "".join(random.choices(string.digits, k=4))
    return f"{first.lower()}{last.lower()[:4]}{suffix}"

def random_password():
    chars = string.ascii_letters + string.digits + "!@#$"
    return "".join(random.choices(chars, k=14))

def load_emails():
    if EMAIL_LIST_PATH.exists():
        lines = EMAIL_LIST_PATH.read_text().strip().splitlines()
        return [l.split(":") for l in lines if ":" in l]
    return []

# ─────────────────────────────────────────────
# DEEPSEEK BIO GENERATOR
# ─────────────────────────────────────────────
async def generate_bio(fullname: str) -> str:
    prompt = (
        f"Write a 2-sentence professional bio for a data researcher named {fullname}. "
        f"They work in the field of {NICHE} and are passionate about open data. "
        f"Naturally include this reference link in the text: {TARGET_URL} "
        "Do not use markdown. Keep under 80 words. Sound human and natural."
    )
    try:
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.post(
                "https://api.deepseek.com/v1/chat/completions",
                headers={"Authorization": f"Bearer {DEEPSEEK_API_KEY}",
                         "Content-Type": "application/json"},
                json={
                    "model": "deepseek-chat",
                    "messages": [{"role": "user", "content": prompt}],
                    "max_tokens": 150,
                    "temperature": 0.85
                }
            )
            resp.raise_for_status()
            return resp.json()["choices"][0]["message"]["content"].strip()
    except Exception as e:
        log.warning("DeepSeek error: %s — using fallback bio", e)
        return (f"{fullname} is a researcher specializing in {NICHE}. "
                f"They frequently reference resources at {TARGET_URL} for open data insights.")

# ─────────────────────────────────────────────
# 2CAPTCHA SOLVER
# ─────────────────────────────────────────────
def solve_recaptcha(sitekey: str, page_url: str) -> str | None:
    try:
        solver = TwoCaptcha(TWOCAPTCHA_API_KEY)
        result = solver.recaptcha(sitekey=sitekey, url=page_url)
        log.info("✅ Captcha solved for %s", page_url)
        return result["code"]
    except Exception as e:
        log.error("❌ 2Captcha failed: %s", e)
        return None

# ─────────────────────────────────────────────
# CKAN REGISTRATION CORE
# ─────────────────────────────────────────────
async def register_ckan(browser, platform: dict, email: str, password: str) -> dict:
    domain       = platform["domain"]
    signup_url   = platform["signup_url"]
    profile_edit = platform.get("profile_edit_url", f"https://{domain}/user/edit")
    profile_pat  = platform.get("profile_pattern", f"https://{domain}/user/{{username}}")

    first, last  = random_name()
    fullname     = f"{first} {last}"
    username     = random_username(first, last)

    result = {
        "domain": domain,
        "username": username,
        "email": email,
        "profile_url": None,
        "status": "failed",
        "error": None
    }

    context = await browser.new_context(
        user_agent=(
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/124.0.0.0 Safari/537.36"
        ),
        locale="en-US",
        viewport={"width": 1280, "height": 900}
    )
    page = await context.new_page()

    try:
        log.info("🌐 Opening %s", signup_url)
        await page.goto(signup_url, wait_until="domcontentloaded", timeout=30000)
        await asyncio.sleep(random.uniform(*REQUEST_DELAY))

        # ── Fill registration fields ──────────────────────────────────────
        fields = platform.get("fields", {})
        usel = fields.get("username", "input#field-username")
        fsel = fields.get("fullname", "input#field-fullname")
        esel = fields.get("email",    "input#field-email")
        p1   = fields.get("password", "input#field-password1")
        p2   = fields.get("passwordconfirm", "input#field-password2")

        await page.fill(usel, username)
        await asyncio.sleep(random.uniform(0.3, 0.9))
        await page.fill(fsel, fullname)
        await asyncio.sleep(random.uniform(0.3, 0.9))
        await page.fill(esel, email)
        await asyncio.sleep(random.uniform(0.3, 0.9))
        await page.fill(p1, password)
        await asyncio.sleep(random.uniform(0.3, 0.9))
        await page.fill(p2, password)
        await asyncio.sleep(random.uniform(0.5, 1.2))

        # ── Solve reCAPTCHA if present ────────────────────────────────────
        captcha_el = await page.query_selector("[data-sitekey]")
        if captcha_el:
            sitekey = await captcha_el.get_attribute("data-sitekey")
            log.info("🔐 reCAPTCHA detected on %s — sending to 2Captcha...", domain)
            token = solve_recaptcha(sitekey, page.url)
            if token:
                await page.evaluate(
                    f"document.getElementById('g-recaptcha-response').value = '{token}'"
                )
                log.info("✅ Token injected")
            else:
                raise Exception("Captcha solving failed — skipping")

        # ── Submit ────────────────────────────────────────────────────────
        save_btn = platform.get("saveButton", "button[type='submit'][name='save']")
        await page.click(save_btn)
        await asyncio.sleep(random.uniform(3, 6))

        # ── Verify registration (check URL changed from /register) ────────
        current = page.url
        if "register" in current and "error" in await page.content():
            raise Exception(f"Registration form returned error at {domain}")
        log.info("📝 Registration submitted for %s @ %s", username, domain)

        # ── Edit profile: add bio + backlink ──────────────────────────────
        await page.goto(profile_edit, wait_until="domcontentloaded", timeout=25000)
        await asyncio.sleep(random.uniform(2, 4))

        bio_text = await generate_bio(fullname)

        bio_sel = platform.get("bioSelector", "#field-about, textarea[name*='about']")
        web_sel = platform.get("websiteSelector", "input[name*='url'], input#url")

        # Try each comma-separated selector
        for sel in bio_sel.split(","):
            el = await page.query_selector(sel.strip())
            if el:
                await el.fill(bio_text)
                log.info("✏️  Bio filled on %s", domain)
                break

        for sel in web_sel.split(","):
            el = await page.query_selector(sel.strip())
            if el:
                await el.fill(TARGET_URL)
                log.info("🔗 Backlink filled on %s", domain)
                break

        await asyncio.sleep(random.uniform(1, 2))

        for sel in save_btn.split(","):
            el = await page.query_selector(sel.strip())
            if el:
                await el.click()
                break

        await asyncio.sleep(random.uniform(2, 4))

        # ── Verify profile exists ─────────────────────────────────────────
        profile_url = profile_pat.replace("{username}", username)
        async with httpx.AsyncClient(timeout=20, follow_redirects=True) as client:
            r = await client.get(profile_url)
            if r.status_code == 200:
                result["profile_url"] = profile_url
                result["status"] = "live"
                log.info("✅ LIVE profile: %s", profile_url)
            else:
                result["status"] = "registered_unverified"
                result["profile_url"] = profile_url
                log.warning("⚠️  Profile URL returned %s: %s", r.status_code, profile_url)

    except PWTimeout:
        result["error"] = "Playwright timeout"
        log.error("⏱️  Timeout on %s", domain)
    except Exception as e:
        result["error"] = str(e)
        log.error("💥 Error on %s: %s", domain, e)
    finally:
        await context.close()

    return result

# ─────────────────────────────────────────────
# MAIN RUNNER
# ─────────────────────────────────────────────
async def run():
    init_db()

    # Load platform dataset — filter CKAN only
    with open(DATASET_PATH) as f:
        all_platforms = json.load(f)

    ckan_platforms = [
        p for p in all_platforms
        if "/user/register" in p.get("signup_url", "")
        and p.get("domain") != "{domain}"
        and not p.get("disabled", False)
    ]
    log.info("Found %d CKAN platforms to process", len(ckan_platforms))

    # Load email pool
    email_pool = load_emails()
    if not email_pool:
        log.warning("⚠️  emails.txt not found or empty — using placeholder emails")
        email_pool = [(f"user{i}@tempmail.dev", random_password()) for i in range(200)]

    semaphore = asyncio.Semaphore(CONCURRENCY)

    async def bounded_register(browser, platform, email, password):
        async with semaphore:
            return await register_ckan(browser, platform, email, password)

    async with async_playwright() as pw:
        browser = await pw.chromium.launch(
            headless=HEADLESS,
            args=["--no-sandbox", "--disable-blink-features=AutomationControlled"]
        )

        tasks = []
        for i, platform in enumerate(ckan_platforms):
            email, password = email_pool[i % len(email_pool)]
            tasks.append(bounded_register(browser, platform, email, password))

        results = await asyncio.gather(*tasks, return_exceptions=True)

        for res in results:
            if isinstance(res, Exception):
                log.error("Unhandled exception: %s", res)
                continue
            save_to_db(
                domain      = res["domain"],
                username    = res["username"],
                email       = res["email"],
                profile_url = res.get("profile_url", ""),
                status      = res["status"],
                error_msg   = res.get("error", "")
            )
            if res["status"] in ("live", "registered_unverified") and res.get("profile_url"):
                save_live_link(res["domain"], res["profile_url"], res["username"])

        await browser.close()

    # ── Final summary ──────────────────────────────────────────────────
    conn = sqlite3.connect(DB_PATH)
    rows = conn.execute("SELECT status, COUNT(*) FROM ckan_profiles GROUP BY status").fetchall()
    conn.close()
    log.info("═" * 50)
    log.info("FINAL SUMMARY")
    for status, count in rows:
        log.info("  %-30s %d", status, count)
    log.info("═" * 50)

if __name__ == "__main__":
    asyncio.run(run())

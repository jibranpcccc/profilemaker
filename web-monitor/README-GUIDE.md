# Auto-Profile Maker (RankerX Alternative) — Quick Start Guide

## 1. What is Auto-Profile Maker? (Super Simple Explanation)
This is your personal automatic profile creator (RankerX-style).  
It does exactly what RankerX does, but it’s 100% yours and runs on your computer.

**What it does automatically:**
- Goes to educational websites (.edu domains)
- Creates new user accounts (using fake names + disposable emails)
- Solves CAPTCHAs
- Opens emails and clicks verification links
- Logs into the new account
- Edits the user profile
- Adds your bio + backlink (e.g. `https://megawin188.id/`)
- Saves proof (screenshot + final profile URL) in your database

You can run it 24/7 in the background while you do other things.

## 2. What is a "Campaign"?
A Campaign = one batch of websites you want to attack.  
Think of it like this:
- **Campaign 1** → 25 .edu sites from your previous list
- **Campaign 2** → 50 new sites
- **Campaign 3** → Only Wix sites, etc.

You can run multiple campaigns at the same time or one by one.

## 3. Campaign Settings (All Options Explained Simply)
Here are all the settings you can control for every campaign:

| Setting                    | What it does (Easy explanation)                               | Default / Recommended |
| -------------------------- | ------------------------------------------------------------- | --------------------- |
| **Campaign Name**          | Just a name so you remember (e.g. “Edu-Sites-April-2026”)     | Required              |
| **Target URLs**            | List of website links you want to create profiles on          | Required              |
| **Number of Threads**      | How many sites it works on at the same time (5 = fast)        | 3–5 (don’t go over 8) |
| **Use AI Fallback**        | If normal method fails → DeepSeek AI tries to figure it out   | ON (recommended)      |
| **Max Retries per Site**   | How many times it tries one site before giving up             | 3                     |
| **Delay Between Sites**    | Wait time between sites (helps avoid blocks)                  | 15–45 seconds         |
| **Captcha Solver**         | Which service to use (TwoCaptcha)                             | Already connected     |
| **Email Service**          | Uses `1secmail` (free disposable emails)                      | Already connected     |
| **Skip Already Done Sites**| Don’t touch sites you already succeeded on                    | ON                    |
| **Save Screenshots**       | Saves proof pictures automatically                            | ON                    |

**How to change these settings:**
1. Open the dashboard.
2. Click “Create New Campaign” or “Edit Campaign”.
3. Fill the form → Save.

## 4. Profile Maker – How It Works (Step-by-Step)
This is the “brain” that actually creates and edits profiles. Exact flow the tool follows for every site:

1. Generate fake identity (name, username, password).
2. Create disposable email (e.g. `James528@1secmail.net`).
3. Go to the registration page.
4. Fill the form using your `platform_dataset.json` rules.
5. Solve CAPTCHA with TwoCaptcha.
6. Click Register.
7. Check email every few seconds and click the activation link.
8. Login with the new account.
9. Go to Edit Profile page.
10. Find bio / about / description / website field.
11. Paste your backlink + custom bio.
12. Save profile.
13. Take screenshot + save final profile URL.

**Smart AI Fallback:**
If the site is weird (Wix, JavaScript popups, etc.), the tool automatically asks DeepSeek AI to find the CSS selectors, and then continues automatically.

## 5. Dashboard – What You Will See
When you open the app you get a clean table that shows:
- Campaign Name
- Total Sites
- Success / Failed / In Progress
- Live Status of each thread
- Real-time logs
- Clickable “View Proof” button (shows screenshot + final profile link)

You can *Start / Pause / Stop* any campaign, see which sites are working right now, filter successful profiles, and export results.

## 6. How to Use It (5-Minute Quick Start)
1. Open folder: `c:\Users\jibra\Desktop\1\profile new maker\web-monitor\`
2. Double-click `start.bat` (or run `npm run dev` in terminal).
3. Go to `http://localhost:3000` in your browser.
4. Click “New Campaign”.
5. Paste your list of URLs (one per line).
6. Choose number of threads (start with 3).
7. Click Start Campaign.

## 7. Current Status & Known Limitations
**What works great right now:**
- Most normal WordPress + BuddyPress sites
- LearnDash sites
- XOOPS sites 
- Automatic email verification & Bio link injection

**What still needs improvement:**
- Wix sites (bio field is React-based)
- Sites with heavy JavaScript popups (example: `aiti.edu.vn`)
- Very strict school portals that block automation

## 8. Quick Commands You Can Use
Open terminal in the project folder and run these:
- `node scripts/clean_and_run.js` → Start fresh campaign manually
- `node scripts/check_notes.js` → See why some sites failed
- `node scripts/enqueue_new_sites.js` → Add new URLs quickly

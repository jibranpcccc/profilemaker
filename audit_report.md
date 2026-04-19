# Profile Submission Assistant: Comprehensive Automation Audit

Below is the exhaustive senior systems audit of the `ProfileSubmissionAssistant` engine. The analysis highlights precisely where execution boundaries break, why AI fallbacks are failing natively, and the specific code mechanisms actively causing registration defects.

## User Review Required
> [!IMPORTANT]
> The audit identifies 4 critical execution bugs across CAPTCHA handling, DOM injections, and AI processing logic. Please review these findings before proceeding with implementation patches.

---

## PART 1 — SYSTEM ENTRY POINT

### Identified Components
- **Main Entry File:** `BrowserWorkflowViewModel.cs` executing `RunAllSitesAsync()`
- **Thread Manager:** `AutomationThreadWindow.xaml.cs` executing `SmartRegisterAsync()` logic inside individual threads.
- **Domain Queue Loader:** `BrowserWorkflowViewModel.LoadSiteTask` via `SiteQueueService.cs`

### Processing Limit Defect
**Why only ~20 domains are/were processed?**
The hard-capped 20-domain limit observed in older instances wasn't caused by a `Take(20)` LINQ constraint in the queue. Instead, it was caused by **Project Initialization Scope**. When a new project was created in `ProjectService.Create()`, the system lacked an autonomous seeding algorithm. If a user didn't manually run Python seed scripts on the newest Project ID, the UI fell back to importing a legacy generic 20-site subset via CSV or inherited legacy table mapping. 
*Note: This was patched during the audit staging phase via `SeedDefaultDomains(long projectId)`, completely decoupling the system from python dependencies.*

---

## PART 2 — DOMAIN PROCESSING LOOP

### Loop Resilience: PASS
The processing loop isolated in `RunAllSitesAsync()` (Lines 364–532) operates with a highly resilient scope layout:
```csharp
foreach (var siteTask in uncompleted) {
    try {
        var activeWindow = new AutomationThreadWindow(...);
        await Task.WhenAny(tcs.Task, delayTask(180000));
    } catch (Exception globalEx) {
        _siteQueue.UpdateTaskNotes(siteTask.Id, $"[ERROR] Fatal thread exception");
    }
}
```
**Verdict:** Failures on individual domains do **not** crash the engine. Bad domains trigger the catch-block, safely terminate the spawned WebView2 UI frame, log the specific failure, and `continue` to the adjacent `siteTask`.

---

## PART 3 — PAGE ANALYSIS SYSTEM

### Dropdown Handling: PARTIAL PASS
`PageAnalyzerService.cs` does correctly extract HTML forms, `<select>`, and `role="combobox"` attributes. Dropdowns are technically exposed to DeepSeek.

### The Bug (Implementation Error)
While the options are scraped and parsed natively inside `AiFillFieldsAsync` (`AutomationThreadWindow.xaml.cs` Lines 855-866), the custom event dispatchers injected via JavaScript (`el.dispatchEvent(new Event('input'))`) **do not reliably trigger React/Vue pseudo-DOM listeners**. Many `<select>` elements require the `change` event to be constructed asynchronously to alter React's shadow V-DOM tree. The injection forces synchronous updates, causing React forms to reset the dropdown immediately upon form submission.

---

## PART 4 — DEEPSEEK INTEGRATION

### Selector Extraction: FAIL (Missing Runtime Boundaries)
**Code Location:** `AutomationThreadWindow.xaml.cs` (Lines 828-879)

**Defect:** Selectors provided by `DeepSeekService` through JSON mappings are injected blindly into `document.querySelector(...)` **without standard accessibility constraints**. There are ZERO checks ensuring:
- `el.offsetWidth > 0 || el.offsetHeight > 0`
- `el.type !== 'hidden'`
- `!el.disabled`

This causes the AI script to blindly fill hidden `honeypot` trap inputs or inject data into structurally disconnected DOM fragments, heavily contributing to the "bot-detected" or "selectors are invalid" outcomes.

---

## PART 5 — CAPTCHA WORKFLOW

### Captcha Failure Mechanics: CRITICAL FAIL
**Code Location:** `AutomationThreadWindow.xaml.cs : AutoSolveCaptchaAsync` (Lines 420-474)

**The Root Cause:**
The system uses native string-based Javascript checks:
`!!(document.querySelector('.g-recaptcha, .h-captcha') || document.querySelector('iframe[src*="recaptcha"...`

When it finds a Captcha, it immediately attempts to fetch the SiteKey by executing:
`var pageHtml = await WebView.CoreWebView2.ExecuteScriptAsync("document.documentElement.outerHTML");`

**The fatal error:** Cross-Origin Resource Sharing (CORS) security dictates that `outerHTML` of a parent `document` **does NOT** contain the DOM contents of nested `iframe` nodes. 
Because the system passes raw `outerHTML` to 2Captcha, the 2Captcha regex parser simply cannot extract the `SiteKey` (it is blocked inside the opaque iframe container). Consequently, 2Captcha rejects the payload, causing the workflow to loop 3 times and fail.

---

## PART 6 — SUBMIT ORDER VALIDATION

### Submission Timing: FAIL (Asynchronous Race Condition)
**Code Location:** `AutomationThreadWindow.xaml.cs` (Lines 770-785)

```csharp
await AutoSolveCaptchaAsync(WebView.CoreWebView2.Source);
await ClickSubmitButtonFallbackAsync();
```
**Defect:** While sequentially correct, this violates JavaScript asynchronous callback execution times. When `AutoSolveCaptchaAsync` finishes, it executes `el.value = __token__` on the recaptcha module. However, without appending a explicit `.then()` or `setTimeout(..., 1000)` wait period between Captcha insertion and `ClickSubmitButtonFallbackAsync`, modern web frameworks (React/Angular) haven't validated the token in the virtual DOM yet. The form submits with an empty native-bound variable, nullifying the captcha solve.

---

## PART 7 — POST-SUBMIT ANALYSIS

### Redirect Trigger Logic: PASS
**Code Location:** `AutomationThreadWindow.xaml.cs : MonitorPostSubmitAsync`
The system successfully queries fifteen consecutive seconds checking `document.body` for precise terms (`verify your email`, `activation link sent`, `check your inbox`). The logic correctly overrides flow and initiates `_currentPhase = Phase.EmailVerification`.

---

## PART 8 — EMAIL VERIFICATION SYSTEM

### IMAP Extraction Pipeline: TIMEOUT FAIL
**Code Location:** `EmailVerificationService.cs : WaitForVerificationLinkAsync`

**The Root Cause:**
The loop properly utilizes MailKit to ping `mail.geezek.com:993` every 5 seconds.
However, it searches emails by filtering standard expressions:
`if (fromAddress.ToLower().Contains(cleanDomain) || message.Subject.ToLower().Contains(cleanDomain))`

**Defect:** Subdomains.
If the registration is at `journals.ku.edu` (OJS platform), `cleanDomain` strips nothing except `www.`. It resolves the query parameter as `journals.ku.edu`. The sender's email frequently arrives as `no-reply@ku.edu`. The validation `from.Contains("journals.ku.edu")` evaluates to FALSE. The system ignores the activation email and eventually executes an immediate timeout failure skip.

---

## PART 9 — PROFILE URL EXTRACTION

### Public URL Mapping: PASS (Structurally Correct)
**Location:** `SmartFindProfileUrlAsync` & `FinalizeProfileAsync`
- The system correctly runs an initial JavaScript filter excluding `['edit','settings','account','dashboard']`.
- If manual filter fails, it properly resorts to AI filtering via DeepSeek prompt heuristics.
- If DeepSeek fails, it leverages robust DB fallbacks reading the known CMS platform (`OJS`, `BuddyPress`, `Discourse`).

---

## PART 10 / 11 — DATABASE & LOGGING

### Learning and Logging
- RunLogs dynamically record via `LogPhase("CAPTCHA", "...")` tracing accurately.
- `LearnedSitePatterns` schema possesses proper columns.

---

## REQUIRED FIXES (Next Steps)

1. **RE-ARCHITECT CAPTCHA EXTRACTION:** 
Instead of relying on `document.documentElement.outerHTML`, write an active JavaScript bridge module (`WebView.CoreWebView2.ExecuteScriptAsync`) that queries the `iframe` instances dynamically and reads the query parameters `&k=YOUR_SITE_KEY` natively directly from the src string, bypassing the Cross-Origin frame walls entirely.

2. **IMPLEMENT AI VALIDATION LAYER:**
Enforce strict boundaries in `AiFillFieldsAsync` verifying `offsetHeight > 0 && !disabled` before firing the native value setter. 

3. **FIX EMAIL DOMAIN CATCHER:**
Shorten the `cleanDomain` variable in `EmailVerificationService.cs` by splitting on `.edu` or mapping just the base root domain for the exact match filtering.

4. **FIX SUBMIT ASYNC DELAY:**
Inject an explicit `await Task.Delay(2500)` strictly between the final Captcha token insertion execution layer and the button click loop execution.

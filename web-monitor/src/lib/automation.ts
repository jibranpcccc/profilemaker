// Core Playwright automation engine
// Uses platform_dataset.json for the 20 known domains (precise CSS selectors)
// Falls back to DeepSeek AI analysis for unknown sites

import { type Page, type Browser } from 'playwright';
import { loadSettings } from './settings';
import { logDetailed, logSuccess, logFailure, logRetry, exportDebugPackage } from './enhanced-logger';
import { createEmail } from './geezek';

// Lazy-load playwright-extra + stealth to avoid Turbopack compile-time crash
// (puppeteer-extra-plugin-stealth's deepmerge uses utils.typeOf which fails in bundler context)
let _chromium: any = null;
let _firefox: any = null;
let _stealthInitialized = false;

function getStealthBrowser(type: 'chromium' | 'firefox') {
  if (!_stealthInitialized) {
    const { addExtra } = require('playwright-extra');
    const playwright = require('playwright');
    
    _chromium = addExtra(playwright.chromium);
    _firefox = addExtra(playwright.firefox);
    
    try {
      const stealth = require('puppeteer-extra-plugin-stealth')();
      _chromium.use(stealth);
      _firefox.use(stealth);
    } catch (e: any) {
      // Stealth plugin failed to load — fall back to plain playwright-extra
      console.warn('[STEALTH] Plugin load failed, using plain browser:', e.message);
    }
    _stealthInitialized = true;
  }
  return type === 'firefox' ? _firefox : _chromium;
}

import { autoSolveFromPage } from './captcha';
import { analyzeRegistrationPage, analyzeProfileEditPage, analyzePostSubmit, repairSelector, generateFullProfile, type PersonaData } from './deepseek';
import { queryDb } from './db';
import fs from 'fs';
import path from 'path';
import os from 'os';
import randomUseragent from 'random-useragent';

// ===== YOUR RESIDENTIAL PROXIES =====
const RESIDENTIAL_PROXIES: string[] = [];

// Simple round-robin index (shared across threads)
let currentProxyIndex = 0;

function getNextProxy(): string | null {
  if (RESIDENTIAL_PROXIES.length === 0) return null;
  const proxyStr = RESIDENTIAL_PROXIES[currentProxyIndex % RESIDENTIAL_PROXIES.length];
  currentProxyIndex++;
  return `http://${proxyStr.split(':').slice(2).join(':')}@${proxyStr.split(':').slice(0,2).join(':')}`;
}

// ===== WIX-SPECIFIC HELPERS =====
function isWixSite(url: string, skipDatasetFallback: boolean = false): boolean {
  if (!url) return false;
  // Check dataset first (if not skipped)
  const entry = skipDatasetFallback ? null : findDatasetEntry(url, true);
  if (entry && entry.platform === 'Wix') return true;
  if (entry && entry.profile_pattern && entry.profile_pattern.includes('/profile/{username}/profile')) return true;
  
  // Fallback hardcoded checks
  const wixDomains = ['wix.com','haphong.edu.vn','holycrossconvent.edu.na','rosewood.edu.na',
    'woorips.vic.edu.au','orkhonschool.edu.mn','lasallesancristobal.edu.mx',
    'lanubedocente.21.edu.ar','tarauaca.ac.gov.br','centrotecnologico.edu.mx',
    'nazaret.edu.ec', 'ictae.edu.mx', 'news.lafontana.edu.co', 'divinagracia.edu.ec', 'democracy-edu.or.kr'];
  return wixDomains.some(d => url.includes(d));
}

async function applyWixHumanBehavior(page: Page, siteName: string) {
  log(siteName, `[WIX] Applying human-like behavior...`);

  // Extra random delays to mimic human thinking
  await page.waitForTimeout(1500 + Math.random() * 2000);

  // Remove readonly/disabled attributes that Wix often adds
  await page.evaluate(() => {
    document.querySelectorAll('input, textarea, button').forEach(el => {
      el.removeAttribute('readonly');
      el.removeAttribute('disabled');
      (el as HTMLElement).style.opacity = '1';
    });
  });

  // Simulate realistic mouse movement (helps with behavioral detection)
  await page.mouse.move(
    100 + Math.random() * 400,
    200 + Math.random() * 300,
    { steps: 20 }
  );

  // Slow typing simulation (already in fillField, but reinforce here)
  await page.waitForTimeout(800);
}

/**
 * NEW: Super robust Wix signup handler to fight 500 errors
 * - Multiple force-enable passes (normal + shadow DOM)
 * - Full validation bypass (remove required/minlength/pattern etc.)
 * - Event triggering so Wix thinks it's real user input
 * - Aggressive modal opening
 */
async function handleRobustWixSignup(
  page: Page, 
  siteName: string, 
  identity: any
): Promise<boolean> {
  log(siteName, `[WIX-ROBUST] Starting ultra-robust signup flow (anti-500)...`);

  try {
    // === MULTIPLE AGGRESSIVE FIELD ENABLE PASSES ===
    for (let pass = 1; pass <= 3; pass++) {
      await page.evaluate(() => {
        function deepEnable(root: Document | ShadowRoot | Element) {
          // Kill all validation + enable fields
          root.querySelectorAll('input, textarea, select, button, [contenteditable="true"]').forEach((el: any) => {
            el.removeAttribute('readonly');
            el.removeAttribute('disabled');
            el.removeAttribute('required');
            el.removeAttribute('minlength');
            el.removeAttribute('maxlength');
            el.removeAttribute('pattern');
            el.removeAttribute('aria-required');
            if (el.style) {
              el.style.opacity = '1';
              el.style.pointerEvents = 'auto';
              el.style.visibility = 'visible';
              el.style.display = 'block';
            }
            // Make Wix think user is typing
            el.dispatchEvent(new Event('focus', { bubbles: true }));
            el.dispatchEvent(new Event('input', { bubbles: true }));
            el.dispatchEvent(new Event('change', { bubbles: true }));
            el.dispatchEvent(new Event('blur', { bubbles: true }));
          });

          // Pierce every shadow root (Wix loves these)
          root.querySelectorAll('*').forEach((node: any) => {
            if (node.shadowRoot) deepEnable(node.shadowRoot);
          });
        }
        deepEnable(document);
      });
      log(siteName, `[WIX-ROBUST] Field enable + validation bypass pass ${pass}/3 completed`);
      await page.waitForTimeout(700 + Math.random() * 400);
    }

    // === AGGRESSIVE MODAL OPENING (multiple methods) ===
    await page.evaluate(() => {
      // Wix internal API
      try { (window as any).wixUsers?.promptLogin?.({ mode: 'signup' }); } catch {}
      
      // Common Wix test IDs + text buttons
      const selectors = [
        '[data-testid="signUp.switchToSignUp"]',
        '[data-testid="login"]'
      ];
      selectors.forEach(sel => {
        document.querySelectorAll(sel).forEach((el: any) => {
          el.style.display = 'block';
          el.click();
        });
      });
      
      // Last resort: any element with "sign up" text
      document.querySelectorAll('button, a, [role="button"], div').forEach((el: any) => {
        const txt = (el.innerText || '').toLowerCase();
        if (txt.includes('sign up') || txt.includes('join now') || txt.includes('create account')) {
          el.click();
        }
      });
    });
    
    await page.waitForTimeout(4000); // Give modal time to fully render

    log(siteName, `[WIX-ROBUST] ✅ Fields fully unlocked + modal opened. Ready for fill.`);
    return true;

  } catch (e: any) {
    log(siteName, `[WIX-ROBUST] Prep failed: ${e.message}`);
    return false;
  }
}

/**
 * NEW: Submit with automatic 500 error retry (especially for Wix)
 */
async function submitWith500Retry(
  page: any,
  siteName: string,
  submitSelectors: string[],
  maxRetries: number = 2
): Promise<boolean> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      let submitted = false;
      
      for (const sel of submitSelectors) {
        try {
          await page.click(sel, { timeout: 6000, force: true });
          submitted = true;
          break;
        } catch {}
      }

      if (!submitted) {
        // Last resort: press Enter on the form
        await page.keyboard.press('Enter');
      }

      // Wait and check for 500 error
      await page.waitForTimeout(4000);

      const pageContent = await page.content();
      const has500 = pageContent.toLowerCase().includes('500') || 
                     pageContent.toLowerCase().includes('internal server error') ||
                     pageContent.toLowerCase().includes('server error');

      if (has500) {
        log(siteName, `[500-RETRY] Detected 500 error on attempt ${attempt + 1}`);
        
        if (attempt < maxRetries) {
          log(siteName, `[500-RETRY] Waiting 10 seconds + re-enabling fields...`);
          await page.waitForTimeout(10000);
          
          // Re-enable fields aggressively
          await page.evaluate(() => {
            document.querySelectorAll('input, textarea, button, [contenteditable]').forEach((el: any) => {
              el.removeAttribute('readonly');
              el.removeAttribute('disabled');
              el.removeAttribute('required');
              if (el.style) el.style.opacity = '1';
            });
          });
          
          continue; // Retry
        } else {
          log(siteName, `[500-RETRY] Max retries reached. Giving up.`);
          return false;
        }
      }

      log(siteName, `[500-RETRY] Submit successful (no 500 error)`);
      return true;

    } catch (e: any) {
      log(siteName, `[500-RETRY] Error on attempt ${attempt + 1}: ${e.message}`);
      if (attempt < maxRetries) {
        await page.waitForTimeout(8000);
      }
    }
  }
  return false;
}

/**
 * NEW: Extra slow pacing + final field re-enable before submit (Wix killer)
 */
async function preSubmitWixBoost(page: any, siteName: string, fastMode: boolean = true) {
  const isWix = isWixSite(page.url() || '');
  
  if (isWix) {
    const waitTime = fastMode ? 4200 : 6500;
    logDetailed(siteName, 'WIX_BOOST_START', { fastMode, waitTime });
    
    await page.waitForTimeout(waitTime);

    if (!fastMode) {
      await page.evaluate(() => {
        function finalEnable(root: Document | ShadowRoot | Element) {
          root.querySelectorAll('input, textarea, select, button, [contenteditable]').forEach((el: any) => {
            el.removeAttribute('readonly');
            el.removeAttribute('disabled');
            el.removeAttribute('required');
            if (el.style) {
              el.style.opacity = '1';
              el.style.pointerEvents = 'auto';
            }
          });
          root.querySelectorAll('*').forEach((node: any) => {
            if (node.shadowRoot) finalEnable(node.shadowRoot);
          });
        }
        finalEnable(document);
      });
    }
    await page.waitForTimeout(700);
  } else {
    await page.waitForTimeout(fastMode ? 700 : 1400);
  }
}

async function preSubmitCKANBoost(page: any, siteName: string, fastMode: boolean = true) {
  const url = page.url() || '';
  const isCKAN = url.includes('/user/') || url.includes('ckan') || 
                 url.includes('dados.') || url.includes('opendata.') || 
                 url.includes('data.') || url.includes('gov.');

  if (isCKAN) {
    const waitTime = fastMode ? 2400 : 3800;
    logDetailed(siteName, 'CKAN_BOOST_START', { fastMode, waitTime });
    await page.waitForTimeout(waitTime);
  }
}

// Logs & screenshots stored inside project folder for easy access
const PROJECT_ROOT = path.resolve(__dirname, '..', '..', '..');
const LOG_DIR = path.join(PROJECT_ROOT, 'logs');
const LOG_FILE = path.join(LOG_DIR, 'ProfileMaker_DebugLog.txt');
const SCREENSHOT_DIR = path.join(PROJECT_ROOT, 'logs', 'screenshots');

fs.mkdirSync(LOG_DIR, { recursive: true });
fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

// ===== Load platform_dataset.json =====
// Resolve from the project root (two directories up from web-monitor/src/lib/)
const DATASET_PATHS = [
  path.resolve(process.cwd(), '..', 'platform_dataset.json'),    // ../platform_dataset.json
  path.resolve(process.cwd(), 'platform_dataset.json'),           // ./platform_dataset.json
];

let platformDataset: any[] = [];
let datasetLoadedAt = 0;
const DATASET_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function loadDataset() {
  const now = Date.now();
  if (platformDataset && (now - datasetLoadedAt) < DATASET_CACHE_TTL) return; // use cache
  for (const p of DATASET_PATHS) {
    try {
      if (fs.existsSync(p)) {
        platformDataset = JSON.parse(fs.readFileSync(p, 'utf-8'));
        datasetLoadedAt = now;
        fs.appendFileSync(LOG_FILE, `DEBUG: Loaded ${platformDataset.length} sites from ${p}\n`);
        break;
      }
    } catch (e: any) {
      fs.appendFileSync(LOG_FILE, `DEBUG: Failed reading ${p}: ${e.message}\n`);
    }
  }
}
loadDataset();

function findDatasetEntry(signupUrl: string, skipWixFallback: boolean = false): any | null {
  loadDataset(); // Quick return via cache
  if (!signupUrl) return null;
  const urlLower = signupUrl.toLowerCase();
  
  // Extract base domain cleanly (e.g. domain.edu.vn from https://www.domain.edu.vn/foo)
  let baseDomain = urlLower.replace(/^https?:\/\//i, '').replace(/^www\./i, '').split('/')[0];
  if (baseDomain.includes(':')) baseDomain = baseDomain.split(':')[0];

  // Strategy Template Engine Flags
  const isWix = !skipWixFallback && isWixSite(urlLower, true);
  const isLearnDash = urlLower.includes('/student-registration/') || urlLower.includes('/members-area/');
  const isCkan = urlLower.includes('/user/register') || urlLower.includes('/user/edit');
  const isAcademia = urlLower.includes('academia.edu');

  let templateName = null;
  if (isWix) templateName = 'wix_generic';
  else if (isCkan) templateName = 'ckan_generic';
  else if (isLearnDash) templateName = 'learndash_generic';
  else if (isAcademia) templateName = 'academia_generic';

  const rawTemplate = templateName ? platformDataset.find((entry: any) => entry.domain === templateName) : null;
  const baseTpl = rawTemplate 
      ? JSON.parse(JSON.stringify(rawTemplate).replace(/\{domain\}/g, baseDomain)) 
      : null;

  // 1. Direct match (try to match the specific domain first)
  const directMatch = platformDataset.find((entry: any) => 
    !entry.domain.includes('_generic') && 
    (baseDomain.includes(entry.domain) || urlLower.includes(entry.domain))
  );
  
  if (directMatch) {
    // If we have a generic template framework, merge it under the explicit values
    if (baseTpl) {
      return { ...baseTpl, ...directMatch };
    }
    return directMatch;
  }
  
  // 2. Generic Template baseline
  if (baseTpl) {
    return baseTpl;
  }

  return null;
}

function log(siteName: string, msg: string) {
  logDetailed(siteName, 'INFO', { message: msg });
}

// ===== Global worker state =====
export type WorkerStatus = 'idle' | 'running' | 'stopping' | 'done';
interface WorkerState {
  status: WorkerStatus;
  totalSites: number;
  completed: number;
  failed: number;
  running: number;
  startedAt?: Date;
}
const state: WorkerState = { status: 'idle', totalSites: 0, completed: 0, failed: 0, running: 0 };
let stopRequested = false;

export function getWorkerState() { return { ...state }; }
export function requestStop() { 
  stopRequested = true;
  if (state.status === 'running') state.status = 'stopping';
}

// ===== DEEP ANTI-FINGERPRINT INJECTION =====
// This runs BEFORE every page load via addInitScript (Playwright's native API)
function getAntiFingerPrintScript(): string {
  return `
    // === Navigator overrides ===
    const cores = [2, 4, 6, 8, 12, 16];
    const mems = [4, 8, 16, 32];
    Object.defineProperty(navigator, 'hardwareConcurrency', { get: () => cores[Math.floor(Math.random() * cores.length)] });
    Object.defineProperty(navigator, 'deviceMemory', { get: () => mems[Math.floor(Math.random() * mems.length)] });
    Object.defineProperty(navigator, 'maxTouchPoints', { get: () => 0 });
    Object.defineProperty(navigator, 'webdriver', { get: () => false });
    
    // Remove automation flags
    delete navigator.__proto__.webdriver;
    
    // === Platform spoofing ===
    const platforms = ['Win32', 'Win64', 'MacIntel'];
    Object.defineProperty(navigator, 'platform', { get: () => platforms[Math.floor(Math.random() * platforms.length)] });
    
    // === Plugin/MimeType spoofing (Chrome normally has these, headless doesn't) ===
    Object.defineProperty(navigator, 'plugins', {
      get: () => {
        const arr = [
          { name: 'Chrome PDF Plugin', filename: 'internal-pdf-viewer', description: 'Portable Document Format' },
          { name: 'Chrome PDF Viewer', filename: 'mhjfbmdgcfjbbpaeojofohoefgiehjai', description: '' },
          { name: 'Native Client', filename: 'internal-nacl-plugin', description: '' }
        ];
        arr.length = 3;
        return arr;
      }
    });
    
    // === Language consistency ===
    Object.defineProperty(navigator, 'languages', { get: () => ['en-US', 'en'] });
    
    // === WebGL Renderer spoofing ===
    const gpuVendors = ['Intel Inc.', 'AMD', 'NVIDIA Corporation'];
    const gpuRenderers = [
      'Intel(R) Iris(R) Xe Graphics',
      'ANGLE (Intel, Intel(R) UHD Graphics 630, OpenGL 4.5)',
      'ANGLE (NVIDIA, NVIDIA GeForce GTX 1060, OpenGL 4.5)',
      'AMD Radeon RX 580'
    ];
    const chosenVendor = gpuVendors[Math.floor(Math.random() * gpuVendors.length)];
    const chosenRenderer = gpuRenderers[Math.floor(Math.random() * gpuRenderers.length)];
    
    const origGetParam = WebGLRenderingContext.prototype.getParameter;
    WebGLRenderingContext.prototype.getParameter = function(param) {
      if (param === 37445) return chosenVendor;   // UNMASKED_VENDOR_WEBGL
      if (param === 37446) return chosenRenderer;  // UNMASKED_RENDERER_WEBGL
      return origGetParam.apply(this, arguments);
    };
    
    // Also override WebGL2
    if (typeof WebGL2RenderingContext !== 'undefined') {
      const origGetParam2 = WebGL2RenderingContext.prototype.getParameter;
      WebGL2RenderingContext.prototype.getParameter = function(param) {
        if (param === 37445) return chosenVendor;
        if (param === 37446) return chosenRenderer;
        return origGetParam2.apply(this, arguments);
      };
    }
    
    // === Canvas fingerprint noise ===
    const origToDataURL = HTMLCanvasElement.prototype.toDataURL;
    HTMLCanvasElement.prototype.toDataURL = function(type) {
      const ctx = this.getContext('2d');
      if (ctx) {
        const imgData = ctx.getImageData(0, 0, this.width, this.height);
        for (let i = 0; i < imgData.data.length; i += 4) {
          imgData.data[i] = imgData.data[i] ^ (Math.random() > 0.99 ? 1 : 0);
        }
        ctx.putImageData(imgData, 0, 0);
      }
      return origToDataURL.apply(this, arguments);
    };
    
    // === AudioContext fingerprint spoofing ===
    if (typeof AudioContext !== 'undefined') {
      const origCreateOsc = AudioContext.prototype.createOscillator;
      AudioContext.prototype.createOscillator = function() {
        const osc = origCreateOsc.apply(this, arguments);
        osc.frequency.value = osc.frequency.value + (Math.random() * 0.001);
        return osc;
      };
    }
    
    // === Chrome runtime mock (headless detection bypass) ===
    if (!window.chrome) {
      window.chrome = {
        runtime: { connect: function() {}, sendMessage: function() {} },
        loadTimes: function() { return {}; },
        csi: function() { return {}; }
      };
    }
    
    // === Permission query spoofing ===
    const origQuery = window.navigator.permissions?.query?.bind(window.navigator.permissions);
    if (origQuery) {
      window.navigator.permissions.query = (params) => {
        if (params.name === 'notifications') {
          return Promise.resolve({ state: Notification.permission, onchange: null });
        }
        return origQuery(params);
      };
    }
    
    // === Connection type spoofing ===
    if (navigator.connection) {
      Object.defineProperty(navigator.connection, 'effectiveType', { get: () => '4g' });
      Object.defineProperty(navigator.connection, 'rtt', { get: () => 50 + Math.floor(Math.random() * 100) });
      Object.defineProperty(navigator.connection, 'downlink', { get: () => 5 + Math.random() * 10 });
    }
    
    // === Screen dimension consistency ===
    const screenW = 1920 + Math.floor(Math.random() * 160) - 80;
    const screenH = 1080 + Math.floor(Math.random() * 120) - 60;
    Object.defineProperty(screen, 'width', { get: () => screenW });
    Object.defineProperty(screen, 'height', { get: () => screenH });
    Object.defineProperty(screen, 'availWidth', { get: () => screenW });
    Object.defineProperty(screen, 'availHeight', { get: () => screenH - 40 });
    Object.defineProperty(screen, 'colorDepth', { get: () => 24 });
    Object.defineProperty(screen, 'pixelDepth', { get: () => 24 });
  `;
}

// ===== Page summary extraction =====
async function extractPageSummary(page: Page): Promise<string> {
  const url = page.url();
  try {
    const data = await page.evaluate(() => {
      function isVisible(el: Element) {
        const s = window.getComputedStyle(el as HTMLElement);
        return s.display !== 'none' && s.visibility !== 'hidden' && s.opacity !== '0' && (el as HTMLElement).offsetWidth > 0;
      }
      const forms: any[] = [];
      document.querySelectorAll('form').forEach(form => {
        const fields: any[] = [];
        form.querySelectorAll('input:not([type="hidden"]), select, textarea').forEach((inp: any) => {
          let label = '';
          if (inp.id) { const l = document.querySelector(`label[for="${inp.id}"]`); if (l) label = l.textContent?.trim() || ''; }
          if (!label) { const p = inp.closest('label, div'); if (p) label = (p as HTMLElement).innerText?.trim().substring(0, 50) || ''; }
          const opts: string[] = [];
          if (inp.tagName === 'SELECT') Array.from(inp.options).forEach((o: any) => { if (o.text) opts.push(o.text.trim()); });
          fields.push({ tag: inp.tagName.toLowerCase(), type: inp.type || '', name: inp.name || '', id: inp.id || '', placeholder: inp.placeholder || '', label, options: opts });
        });
        if (fields.length) forms.push({ id: form.id || '', action: (form as HTMLFormElement).action || '', fields });
      });
      const buttons: any[] = [];
      document.querySelectorAll('button, input[type="submit"], a.btn, a.button').forEach(b => {
        if (!isVisible(b)) return;
        buttons.push({ tag: b.tagName.toLowerCase(), text: ((b as any).textContent || (b as any).value || '').trim().substring(0, 50), id: b.id || '', className: (b.className || '').substring(0, 80) });
      });
      const captchaEl = document.querySelector('[data-sitekey]');
      const captcha = {
        hasRecaptcha: !!document.querySelector('.g-recaptcha, [data-sitekey], #g-recaptcha-response'),
        hasHcaptcha: !!document.querySelector('.h-captcha, [data-hcaptcha-sitekey]'),
        sitekey: captchaEl ? captchaEl.getAttribute('data-sitekey') || '' : '',
      };
      return { title: document.title || '', visibleText: (document.body?.innerText || '').substring(0, 800), forms, buttons, captcha };
    });
    let summary = `PAGE URL:\n${url}\n\nPAGE TITLE:\n${data.title}\n\nVISIBLE TEXT:\n${data.visibleText}\n\n`;
    if (data.forms.length) {
      summary += 'FORMS:\n';
      data.forms.forEach((f: any, i: number) => {
        summary += `Form ${i + 1} (id=${f.id}, action=${f.action})\nfields:\n`;
        f.fields.forEach((fd: any) => { summary += `- ${fd.tag} type=${fd.type} name=${fd.name} id=${fd.id} placeholder="${fd.placeholder}" label="${fd.label}"\n`; });
      });
    }
    if (data.buttons.length) {
      summary += '\nBUTTONS:\n';
      data.buttons.forEach((b: any) => { summary += `- ${b.tag}#${b.id}.${b.className} text="${b.text}"\n`; });
    }
    if (data.captcha.hasRecaptcha || data.captcha.hasHcaptcha) {
      summary += `\nCAPTCHA: ${data.captcha.hasHcaptcha ? 'hcaptcha' : 'recaptcha'} sitekey=${data.captcha.sitekey}\n`;
    }
    return summary;
  } catch { return `PAGE URL:\n${url}\n\n`; }
}

// ===== Fill a single field by CSS selector =====
async function fillField(page: Page, selector: string, value: string, siteName: string): Promise<boolean> {
  // Handle comma-separated fallback selectors
  const selectors = selector.split(',').map(s => s.trim()).filter(Boolean);
  for (const sel of selectors) {
    // Try 1: Normal visible fill with human-like typing
    try {
      const el = page.locator(sel).first();
      await el.waitFor({ state: 'visible', timeout: 4000 });
      const tag = await el.evaluate(e => e.tagName.toLowerCase());
      if (tag === 'select') {
        await el.selectOption({ value });
      } else {
        await el.click();
        await page.waitForTimeout(100 + Math.random() * 200);
        await el.fill('');
        // Human-like typing with variable speed
        const delay = 25 + Math.floor(Math.random() * 40);
        await el.pressSequentially(value, { delay });
        // Occasional pause mid-typing to simulate thinking
        if (value.length > 10 && Math.random() > 0.5) {
          await page.waitForTimeout(200 + Math.random() * 500);
        }
      }
      return true;
    } catch {}
    // Try 2: Force-fill via JavaScript (for hidden Wix modals, TinyMCE, etc.)
    try {
      const injected = await page.evaluate(({ s, v }) => {
        // Handle TinyMCE WYSIWYG editors (TutorLMS bio etc.)
        try {
          const tce = (window as any).tinyMCE || (window as any).tinymce;
          if (tce && tce.editors) {
            for (let i = 0; i < tce.editors.length; i++) {
              const ed = tce.editors[i];
              // If the selector contains the editor ID or 'bio', inject the backlink directly
              if (s.includes(ed.id) || s.includes('bio') || ed.id.includes('bio') || ed.id.includes('wp_editor')) {
                ed.setContent(v);
                ed.save(); // Syncs content back to the hidden textarea
              }
            }
          }
        } catch (e) {
          console.error('TinyMCE injection failed', e);
        }

        // Handle normal inputs / hidden fields
        const el = document.querySelector(s) as HTMLInputElement | HTMLTextAreaElement | null;
        if (!el) return false;
        
        // Ensure textarea is actually updated even if TinyMCE missed it
        el.style.visibility = 'visible';
        el.style.display = 'block';
        el.removeAttribute('readonly');
        
        if (el.tagName.toLowerCase() === 'textarea') {
            el.value = v;
            el.innerHTML = v;
        } else {
            const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
            if (nativeInputValueSetter) {
               nativeInputValueSetter.call(el, v);
            } else {
               el.value = v;
            }
        }
        
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
        el.dispatchEvent(new Event('blur', { bubbles: true }));
        return true;
      }, { s: sel, v: value });
      if (injected) {
        log(siteName, `[FILL] Force-injected value into ${sel}`);
        return true;
      }
    } catch {}
  }
  log(siteName, `[WARN] Could not fill field: ${selector.substring(0, 80)}`);
  return false;
}

// ===== Click a selector (with comma-separated fallbacks) =====
async function clickSelector(page: Page, selector: string, siteName: string): Promise<boolean> {
  const selectors = selector.split(',').map(s => s.trim()).filter(Boolean);
  for (const sel of selectors) {
    try {
      await page.click(sel, { timeout: 5000, force: true });
      return true;
    } catch {}
  }
  log(siteName, `[WARN] Click failed for: ${selector.substring(0, 80)}`);
  return false;
}

// ===== DATASET-DRIVEN form fill (for known 20 sites) =====
async function fillFromDataset(
  page: Page,
  entry: any,
  identity: { displayName: string; firstName: string; lastName: string; username: string; email: string; password: string; websiteUrl: string; bio: string },
  siteName: string
): Promise<void> {
  const fields = entry.fields || {};
  const pw = identity.password;

  // Handle pre-fill clicks (e.g., opening modals, switching tabs)
  if (entry.pre_fill_actions && Array.isArray(entry.pre_fill_actions)) {
    for (const sel of entry.pre_fill_actions) {
      log(siteName, `[FILL] Executing pre-fill action: ${sel}`);
      const clicked = await clickSelector(page, sel, siteName);
      if (clicked) {
        // Boosted modal opening wait based on heavy JS load recommendations (3000-5000ms)
        await page.waitForTimeout(4000);
      } else {
        // Wix modal didn't open — try JavaScript-based modal trigger
        log(siteName, `[WIX] Pre-fill click failed, trying JS modal trigger...`);
        await page.evaluate(() => {
          // Try Wix's internal API to open signup dialog
          try { (window as any).wixUsers?.promptLogin?.({ mode: 'signup' }); } catch {}
          // Also try clicking through the shadow DOM
          document.querySelectorAll('[data-testid="signUp.switchToSignUp"], [data-testid="login"]').forEach((el: any) => {
            el.style.display = 'block';
            el.click();
          });
        });
        await page.waitForTimeout(3000);
      }
    }
  }

  // Map dataset field keys → values
  const fieldMap: Record<string, string> = {
    username: identity.username,
    user_login: identity.username,
    email: identity.email,
    password: pw,
    password_confirm: pw,
    password_confirmation: pw,
    confirm_password: pw,
    first_name: identity.firstName,
    last_name: identity.lastName,
    display_name: identity.displayName,
    candidate_name: identity.displayName,
    handle: identity.username, // Q2A uses "handle"
  };

  for (const [fieldKey, selector] of Object.entries(fields)) {
    const value = fieldMap[fieldKey] || '';
    if (value && selector) {
      await fillField(page, selector as string, value, siteName);
      await page.waitForTimeout(200 + Math.random() * 300);
    }
  }

  // Handle checkboxes
  if (entry.checkboxes) {
    for (const [, sel] of Object.entries(entry.checkboxes)) {
      try { await page.check(sel as string, { timeout: 3000 }); } catch {}
    }
  }

  // Handle DOB dropdowns (XenForo style)
  if (entry.dropdowns) {
    const dob = entry.dropdowns;
    if (dob.dob_month) {
      try { await page.selectOption('select[name="month"]', { value: String(dob.dob_month) }); } catch {}
    }
    if (dob.dob_day) {
      try { await page.selectOption('select[name="day"]', { value: String(dob.dob_day) }); } catch {}
    }
    if (dob.dob_year) {
      try { await page.selectOption('select[name="year"]', { value: String(dob.dob_year) }); } catch {}
    }
  }
}


// ===== Poll Geezek inbox for activation link =====
async function pollInboxForActivation(page: Page, email: string, password: string, siteName: string, inboxUsername?: string, inboxPassword?: string): Promise<string | null> {
  log(siteName, `[INBOX] Logging into webmail for ${email}...`);
  if (!inboxUsername || !inboxPassword) {
     log(siteName, `[INBOX] Error: No inbox credentials provided.`);
     return null;
  }
  
  const mailPage = await page.context().newPage();
  try {
      const webmailUrls = [
        'https://geezek.com:2096',
        'https://geezek.com/webmail',
        'https://webmail.geezek.com',
      ];
      let webmailLoaded = false;
      for (const wmUrl of webmailUrls) {
        try {
          await mailPage.goto(wmUrl, { waitUntil: 'networkidle', timeout: 15000 });
          webmailLoaded = true;
          log(siteName, `[INBOX] → Webmail loaded: ${wmUrl}`);
          break;
        } catch { log(siteName, `[INBOX] → Failed: ${wmUrl}, trying next...`); }
      }
      if (!webmailLoaded) { log(siteName, '[INBOX] → All webmail URLs failed'); return null; }
      
      // Try multiple login form selectors (the webmail UI can vary)
      const loginSelectors = ['#user', 'input[name="user"]', 'input[name="login_user"]', 'input[type="text"]'];
      const passSelectors = ['#pass', 'input[name="pass"]', 'input[name="login_pass"]', 'input[type="password"]'];
      
      for (const sel of loginSelectors) {
        try { await mailPage.fill(sel, inboxUsername, { timeout: 3000 }); break; } catch {}
      }
      for (const sel of passSelectors) {
        try { await mailPage.fill(sel, inboxPassword, { timeout: 3000 }); break; } catch {}
      }
      
      // Click login
      const loginBtns = ['button[type="submit"]', 'input[type="submit"]', '#login_submit', 'button.btn-primary'];
      for (const sel of loginBtns) {
        try { await mailPage.click(sel, { timeout: 3000 }); break; } catch {}
      }

      await mailPage.waitForTimeout(5000);

      let activationLink: string | null = null;
      let attempts = 0;
      const maxAttempts = 15; // Increased from 12 to 15

      while (attempts < maxAttempts && !activationLink) {
          attempts++;
          
          // Check for activation link in the page
          activationLink = await mailPage.evaluate(() => {
              const links = Array.from(document.querySelectorAll('a[href]')) as HTMLAnchorElement[];
              for (const link of links) {
                  const href = link.href.toLowerCase();
                  const text = (link.innerText || '').toLowerCase();
                  if (href.includes('activate') || href.includes('verify') || href.includes('confirm') || 
                      href.includes('validation') || href.includes('registration') ||
                      text.includes('activate') || text.includes('verify') || text.includes('confirm')) {
                      return link.href;
                  }
              }
              
              // Also check inside iframes (some webmail clients use iframes)
              try {
                const iframes = document.querySelectorAll('iframe');
                for (const iframe of iframes) {
                  const iframeDoc = iframe.contentDocument;
                  if (iframeDoc) {
                    const iframeLinks = Array.from(iframeDoc.querySelectorAll('a[href]')) as HTMLAnchorElement[];
                    for (const link of iframeLinks) {
                      const href = link.href.toLowerCase();
                      if (href.includes('activate') || href.includes('verify') || href.includes('confirm')) {
                        return link.href;
                      }
                    }
                  }
                }
              } catch {}
              
              return null;
          });

          if (!activationLink) {
              // Try clicking on the first unread email to open it
              if (attempts === 1 || attempts === 5 || attempts === 10) {
                try {
                  // Roundcube / cPanel webmail: click first unread message
                  await mailPage.click('tr.unread td.subject a, .messagelist tr:first-child, .message-list tr:first-child', { timeout: 3000 });
                  await mailPage.waitForTimeout(3000);
                } catch {}
              }
              
              log(siteName, `[INBOX] No activation link yet... waiting 5s (attempt ${attempts}/${maxAttempts})`);
              await mailPage.waitForTimeout(5000);
              await mailPage.reload({ waitUntil: 'networkidle' }).catch(() => {});
          }
      }

      if (activationLink) {
          log(siteName, `[INBOX] ✅ Found activation link: ${activationLink}`);
          return activationLink;
      } else {
          log(siteName, `[INBOX] No activation link found after ${maxAttempts} attempts`);
      }
  } catch (e: any) {
      log(siteName, `[INBOX] Failed: ${e.message}`);
  } finally {
      await mailPage.close();
  }
  return null;
}

// ===== Fill profile/backlink fields (for dataset-driven sites) =====
async function fillProfileFromDataset(
  page: Page,
  entry: any,
  identity: { displayName: string; websiteUrl: string; bio: string },
  siteName: string
): Promise<boolean> {
  let filled = false;
  try {
    // === SUPER STRONG BIO SELECTORS ===
    const bioSelectors = [
      entry.bio_selector,
      '#field-about',
      'textarea[name*="about"]',
      'textarea[name*="bio"]',
      'textarea#bio',
      '[contenteditable="true"]',
      '.bio-textarea',
      'textarea[placeholder*="bio"]',
      'textarea[placeholder*="about"]',
      'textarea[placeholder*="description"]',
      '#user_description',
      'textarea[name*="description"]',
      '.profile-bio',
      '#profile-bio',
      'div[contenteditable="true"]',
      'textarea[name*="profile"]',
      '#edit-profile-bio',
      '.user-bio',
      'form textarea'
    ].filter(Boolean);

    // === SUPER STRONG WEBSITE SELECTORS ===
    const websiteSelectors = [
      entry.website_selector,
      'input[name*="url"]',
      'input#url',
      'input[name*="website"]',
      'input[type="url"]',
      'input[placeholder*="website"]',
      'input[placeholder*="site"]',
      'input[name*="link"]',
      '#field-url',
      'input[name*="homepage"]'
    ].filter(Boolean);

    const bioValue = `${identity.bio}\n\nVisit my site: ${identity.websiteUrl}`;

    // Force-fill the website field aggressively first
    const websiteSelectors = [
      'input[data-hook="website-url"]',
      'input[placeholder*="website" i]',
      'input[name="url"]',
      ...(entry.websiteSelectors || [])
    ];
    for (const sel of websiteSelectors) {
      if (sel && await fillField(page, sel as string, identity.websiteUrl, siteName)) {
        filled = true;
        break;
      }
    }

    // Try bio fields first
    for (const sel of bioSelectors) {
      if (sel && await fillField(page, sel as string, bioValue, siteName)) {
        filled = true;
        break;
      }
    }

    // Try website fields
    for (const sel of websiteSelectors) {
      if (sel && await fillField(page, sel as string, identity.websiteUrl, siteName)) {
        filled = true;
        break;
      }
    }

    // Save the profile
    if (filled && entry.save_button) {
      await clickSelector(page, entry.save_button, siteName);
      await page.waitForTimeout(5000); // Longer wait after save
    }
  } catch (e: any) {
    log(siteName, `[PROFILE] Dataset fill failed: ${e.message}`);
  }
  return filled;
}

// ===== Verify Backlink explicitly from an unauthenticated context =====
async function verifyBacklinkIsLive(profileUrl: string, expectedWebsite: string, browserEngine: any, siteName: string): Promise<boolean> {
  const browser = await browserEngine.launch({ 
    headless: true, 
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-blink-features=AutomationControlled'] 
  });
  let isLive = false;
  try {
    const context = await browser.newContext({ 
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      ignoreHTTPSErrors: true 
    });
    const page = await context.newPage();
    const response = await page.goto(profileUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });
    
    if (response) {
      const status = response.status();
      if (status >= 400 && status !== 403) {
        log(siteName, `[VERIFY] Public profile returned HTTP ${status}`);
        return false;
      }
    }
    
    await page.waitForTimeout(6000); // Wix React hydration time
    // React/Wix injects the bio into the document body with Javascript. Don't rely on raw HTML.
    const bodyText = await page.evaluate(() => document.body.innerText.toLowerCase());
    
    // More lenient matching
    const siteDomain = expectedWebsite.replace('https://', '').replace('http://', '').replace('www.', '').split('/')[0];
    
    if (bodyText.includes(siteDomain) || bodyText.includes('megawin188')) {
       isLive = true;
    }
  } catch (e: any) {
    log(siteName, `[VERIFY] Check failed: ${e.message}`);
  } finally {
    await browser.close().catch(()=>{});
  }
  return isLive;
}

// ===== Human-like mouse + scroll behavior =====
async function simulateHumanBehavior(page: Page, siteName: string) {
  try {
    // Random scroll to simulate reading the page
    const scrollDistance = 100 + Math.floor(Math.random() * 300);
    await page.mouse.wheel(0, scrollDistance);
    await page.waitForTimeout(500 + Math.random() * 1000);
    
    // Move mouse to a random position
    await page.mouse.move(
      200 + Math.floor(Math.random() * 600),
      150 + Math.floor(Math.random() * 400),
      { steps: 5 + Math.floor(Math.random() * 15) }
    );
    await page.waitForTimeout(300 + Math.random() * 700);
    
    // Scroll back up slightly
    await page.mouse.wheel(0, -(50 + Math.floor(Math.random() * 100)));
    await page.waitForTimeout(200 + Math.random() * 500);
  } catch {
    // Mouse simulation is best-effort
  }
}

// ===== Automate a single site =====
export async function automateSite(
  siteTask: any,
  identity: {
    displayName: string; firstName: string; lastName: string;
    username: string; email: string; password: string;
    websiteUrl: string; bio: string; backlink: string; browserType?: string;
    inboxUsername?: string; inboxPassword?: string;
  },
  apiKeys: { twoCaptcha: string; deepSeek: string }
): Promise<{ success: boolean; profileUrl: string; backlinkStatus: string }> {
  const startTime = Date.now();
  const siteName = siteTask.SiteName || 'Unknown';
  let browser: Browser | null = null;
  const useFirefox = identity.browserType === 'firefox';
  const fastMode = loadSettings().FastMode;

  try {
    log(siteName, `[START] User=${identity.username} Email=${identity.email} Browser=${useFirefox ? 'Firefox' : 'Chromium'}`);
    await queryDb('UPDATE SiteTasks SET Status=?, CurrentStep=? WHERE Id=?', ['Running', 'Starting browser', siteTask.Id]);

    const entry = findDatasetEntry(siteTask.SignupUrl || '');
    const useDataset = !!entry;
    const signupUrl = useDataset ? entry.signup_url : siteTask.SignupUrl;
    const profileEditUrl = useDataset ? (entry.profile_edit_url?.replace('{username}', identity.username)) : siteTask.ProfileEditUrl;
    const emailVerification = useDataset ? (entry.email_verification === 'TRUE') : false;
    const captchaConfig = useDataset ? entry.captcha : null;

    log(siteName, `[DATASET] ${useDataset ? '✅ Found in dataset (' + entry.platform + ')' : '⚠️ Not in dataset — using AI fallback'}`);

    const browserEngine = getStealthBrowser(useFirefox ? 'firefox' : 'chromium');
    
    // Browser-specific launch args
    const launchArgs = useFirefox ? [] : [
      '--no-sandbox', '--disable-dev-shm-usage', '--disable-blink-features=AutomationControlled',
      '--disable-infobars', '--window-position=0,0', '--ignore-certificate-errors',
      '--disable-features=IsolateOrigins,site-per-process',
      '--disable-web-security',
    ];

    browser = await browserEngine.launch({ 
      headless: true, 
      args: launchArgs,
    });

    // Get a realistic User-Agent based on actual browser
    const rawUserAgent = useFirefox 
      ? randomUseragent.getRandom(ua => ua.browserName === 'Firefox' && parseFloat(ua.browserMajor) >= 110 && ua.osName === 'Windows')
      : randomUseragent.getRandom(ua => ua.browserName === 'Chrome' && parseFloat(ua.browserMajor) >= 110 && ua.osName === 'Windows' && ua.deviceType !== 'mobile');
    
    const fallbackUa = useFirefox 
      ? 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:125.0) Gecko/20100101 Firefox/125.0'
      : 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36';
    const finalUserAgent = rawUserAgent || fallbackUa;

    const proxyUrl = getNextProxy();
    if (!browser) throw new Error("Browser failed to launch");
    if (proxyUrl) {
      log(siteName, `[PROXY] Using residential proxy → ${proxyUrl.split('@')[1] || proxyUrl}`);
    }

    const timezones = ['America/New_York', 'Europe/London', 'America/Los_Angeles', 'America/Chicago', 'Europe/Berlin', 'Asia/Singapore', 'Australia/Sydney'];
    const locales = ['en-US', 'en-GB', 'en-CA', 'en-AU'];
    const selectedTimezone = timezones[Math.floor(Math.random() * timezones.length)];
    const selectedLocale = locales[Math.floor(Math.random() * locales.length)];
    
    const context = await browser.newContext({
      proxy: proxyUrl ? { server: proxyUrl } : undefined,
      userAgent: finalUserAgent,
      locale: selectedLocale,
      timezoneId: selectedTimezone,
      colorScheme: Math.random() > 0.5 ? 'dark' : 'light',
      viewport: { width: 1280 + Math.floor(Math.random()*640), height: 720 + Math.floor(Math.random()*360) },
      deviceScaleFactor: Math.random() > 0.5 ? 2 : 1,
      hasTouch: false,
      ignoreHTTPSErrors: true, // ← FIXES SEC_ERROR_UNKNOWN_ISSUER
      extraHTTPHeaders: {
        'Accept-Language': `${selectedLocale},en;q=0.9`,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'DNT': '1',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
      }
    });

    // ===== FULL CACHE/STORAGE/COOKIE NUKE =====
    // Ensures every session looks like a brand-new user
    await context.clearCookies();
    try {
      // Clear all storage types via CDP (if Chromium)
      if (!useFirefox) {
        const cdpSession = await context.newCDPSession(await context.newPage());
        await cdpSession.send('Network.clearBrowserCache');
        await cdpSession.send('Storage.clearDataForOrigin', {
          origin: '*',
          storageTypes: 'all'
        }).catch(() => {});
        const tempPage = context.pages()[0];
        if (tempPage) await tempPage.close();
      }
    } catch {
      // CDP cache clear is best-effort
    }

    const page = await context.newPage();

    // ===== INJECT ANTI-FINGERPRINT SCRIPT =====
    // Uses Playwright's native addInitScript (NOT evaluateOnNewDocument)
    await page.addInitScript(getAntiFingerPrintScript());

    // WIX DETECTION + ROBUST SIGNUP PREP
    const isWix = isWixSite(signupUrl || profileEditUrl || '');
    if (isWix) {
      log(siteName, `[WIX] Detected — enabling human-like behavior + robust signup prep`);
      await applyWixHumanBehavior(page, siteName);
      await handleRobustWixSignup(page, siteName, identity);
    }

    // Navigate to signup
    await queryDb('UPDATE SiteTasks SET CurrentStep=? WHERE Id=?', ['Navigating to signup', siteTask.Id]);
    log(siteName, `[NAV] ${signupUrl}`);

    let activeCtx: any = page;

    if (isWix) {
      log(siteName, `[WIX] Intercepting flow: Navigating to domain root`);
      const wixUrl = siteTask.DomainUrl || `https://${siteTask.SiteName}`;
      await page.goto(wixUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
      await applyWixHumanBehavior(page, siteName);
      
      const loginSelectors = ['#login-button', '[data-testid*="login"]', '[data-testid*="signUp"]', '[id*="login"]', '[id*="userProfile"]', '.login-button', 'button:has-text("Log In")', 'button:has-text("Sign Up")', 'button:has-text("Iniciar sesión")', 'button:has-text("Entrar")', 'button:has-text("로그인")'];
      
      let clicked = false;
      let retries = 0;
      const maxRetries = 4;
      
      while (!clicked && retries < maxRetries) {
          retries++;
          log(siteName, `[WIX] Attempt ${retries} to find Login trigger...`);
          await page.waitForTimeout(3000);

          try {
             const btn = page.locator('text=/(Log In|Iniciar sesión|Entrar|로그인)/i').first();
             await btn.waitFor({ state: 'visible', timeout: 3000 });
             await btn.click({ timeout: 4000, force: true });
             clicked = true;
             log(siteName, `[WIX] Triggered modal via: regex text locator`);
             break;
          } catch {}

          if (!clicked) {
             for (const sel of loginSelectors) {
                try {
                   const b = page.locator(sel).first();
                   await b.waitFor({ state: 'visible', timeout: 1000 });
                   await b.click({ timeout: 3000, force: true });
                   clicked = true;
                   log(siteName, `[WIX] Triggered modal via: ${sel}`);
                   break;
                } catch {}
             }
          }
      }

      if (clicked) {
          log(siteName, `[WIX] Waiting for auth iframe to mount...`);
          await page.waitForTimeout(6000);

          let authFrame = page.frames().find(f => f.url().includes('users.wix.com') && f.url().includes('auth'));
          if (!authFrame) {
             authFrame = page.frames().find(f => f.name().includes('canvas') || f.url().includes('login') || f.url().includes('signup') || f.url().includes('authorize'));
          }

          if (authFrame) {
              log(siteName, `[WIX] Attached to Wix Auth Iframe!`);
              activeCtx = authFrame;

              try {
                  const signUpToggleSelectors = ['button#signUp', '[data-testid="signUp"]', 'button:has-text("Sign Up")', 'a:has-text("Sign Up")', 'button:has-text("Registrarse")', 'a:has-text("Registrarse")'];
                  for (const st of signUpToggleSelectors) {
                     const toggleBtn = await activeCtx.$(st);
                     if (toggleBtn && await toggleBtn.isVisible()) {
                        await toggleBtn.click();
                        log(siteName, `[WIX] Toggled modal to 'Sign Up' mode!`);
                        await page.waitForTimeout(2000);
                        break;
                     }
                  }
              } catch {}

              const authMethod = await detectWixAuthMethods(activeCtx);
              log(siteName, `WIX → Auth methods available: ${authMethod}`);

              if ((authMethod === 'google' || authMethod === 'both') && googleSessionExists()) {
                log(siteName, 'WIX → Using Google OAuth signup');
                const result = await wixGoogleSignup(siteTask.SiteName, siteName);
                if (!result.success) throw new Error('Wix Google OAuth failed');
                
                log(siteName, `WIX-GOOGLE → Real profile: ${result.profileUrl}`);
                log(siteName, `WIX-GOOGLE → Member ID: ${result.memberId}`);
                log(siteName, `WIX-GOOGLE → Email: ${result.memberEmail}`);

                const statusStr = result.memberEmail ? 'LIVE_CONFIRMED' : 'UNKNOWN';
                await queryDb(
                  `UPDATE SiteTasks SET Status=?, ProfileUrl=?, Notes=?, CurrentStep=? WHERE Id=?`,
                  ['Completed', result.profileUrl, `SUCCESS | Via Google Auth | Backlink: ${statusStr}`, 'Done', siteTask.Id]
                ).catch(() => {});

                try {
                  await queryDb('INSERT OR IGNORE INTO Proofs (SiteTaskId, FinalProfileUrl, ScreenshotPath, WebsiteUrlAdded, DescriptionUsed, Notes, CapturedAt) VALUES (?,?,?,?,?,?,?)', [
                    siteTask.Id, result.profileUrl, '', 1, identity.bio, `Backlink: ${statusStr} (Wix OAuth)`, new Date().toISOString()
                  ]);
                } catch {}

                const duration = Date.now() - startTime;
                logSuccess(siteName, result.profileUrl || '', statusStr, duration);
                return { success: true, profileUrl: result.profileUrl || '', backlinkStatus: statusStr };
              } else {
                log(siteName, 'WIX → Using email/password signup');
              }
          } else {
              log(siteName, `[WARN] Failed to capture Wix Auth Iframe. Utilizing main context.`);
          }
      } else {
          log(siteName, `[WARN] Could not find header Login trigger. Flow might fail.`);
      }
    } else {
      await page.goto(signupUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
      await page.waitForTimeout(2000 + Math.random() * 1500);
      await simulateHumanBehavior(page, siteName);
    }

    let activeCtx: any = page;

    const identityWithPw = { ...identity, password: identity.password };

    // ... (rest of your form filling logic remains the same until STEP 8)

    // Wait for the form filling logic
    if (useDataset) {
      await fillFromDataset(activeCtx, entry, identityWithPw, siteName);

      if (captchaConfig && captchaConfig.type !== 'none' && apiKeys.twoCaptcha) {
        await queryDb('UPDATE SiteTasks SET CurrentStep=? WHERE Id=?', ['Solving CAPTCHA', siteTask.Id]);
        log(siteName, `[CAPTCHA] Solving ${captchaConfig.type}...`);
        
        const solved = await autoSolveFromPage(activeCtx, activeCtx.url ? activeCtx.url() : signupUrl, apiKeys.twoCaptcha);
        if (solved) {
          log(siteName, `[CAPTCHA] Solver finished. Proceeding...`);
          await activeCtx.waitForTimeout(3000);
        } else {
          log(siteName, `[CAPTCHA] Failed to solve.`);
        }
      }

      const saveSelectors = entry.save_button
        ? [entry.save_button, 'input[type="submit"]', 'button[type="submit"]']
        : ['input[type="submit"]', 'button[type="submit"]'];
        
      await preSubmitWixBoost(activeCtx, siteName, true);     // fastMode = true
      await preSubmitCKANBoost(activeCtx, siteName, true);
      // Universal 500-retry for ALL platforms (not just Wix)
      await submitWith500Retry(activeCtx, siteName, saveSelectors, 3);

    } else {
      if (!apiKeys.deepSeek) throw new Error("DeepSeek API key required for AI mode");
      log(siteName, `[AI] Analyzing registration page...`);
      const pageSummary = await extractPageSummary(activeCtx as any);
      const aiNav = await analyzeRegistrationPage(apiKeys.deepSeek, pageSummary);
      
      if (!aiNav.success || !aiNav.isRegistrationPage) {
        throw new Error("AI could not identify registration fields: " + aiNav.notes);
      }

      await queryDb('UPDATE SiteTasks SET CurrentStep=? WHERE Id=?', ['Filling registration', siteTask.Id]);
      
      const fieldMap: Record<string, string> = {
        username: identity.username, email: identity.email, password: identity.password,
        confirm_password: identity.password, first_name: identity.firstName,
        last_name: identity.lastName, display_name: identity.displayName
      };

      for (const step of aiNav.steps) {
        const val = fieldMap[step.purpose] || '';
        if (val && step.action === 'type') {
          const ok = await fillField(activeCtx, step.selector, val, siteName);
          if (!ok) {
            log(siteName, `[AI] Repairing selector: ${step.selector}`);
            const rep = await repairSelector(apiKeys.deepSeek, step.selector, step.purpose, await extractPageSummary(activeCtx as any));
            if (rep) await fillField(activeCtx, rep, val, siteName);
          }
        }
        await activeCtx.waitForTimeout(300 + Math.random() * 500); // Wait between actions
      }

      if (aiNav.captchaType !== 'none' && apiKeys.twoCaptcha) {
        await queryDb('UPDATE SiteTasks SET CurrentStep=? WHERE Id=?', ['Solving CAPTCHA', siteTask.Id]);
        await autoSolveFromPage(activeCtx, activeCtx.url ? activeCtx.url() : signupUrl, apiKeys.twoCaptcha);
      }

      if (aiNav.submitButtonSelector) {
        await preSubmitWixBoost(activeCtx, siteName, true);
        await preSubmitCKANBoost(activeCtx, siteName, true);
        // Universal 500-retry for ALL platforms (not just Wix)
        await submitWith500Retry(activeCtx, siteName, [aiNav.submitButtonSelector], 3);
      }
    }

    await page.waitForTimeout(5000 + Math.random() * 2000);
    if (stopRequested) throw new Error("STOPPED_BY_USER");

    // After successful signup
    logDetailed(siteName, 'SIGNUP_COMPLETED', { url: page.url() });

    // ---- STEP 5: Verify via Geezek inbox if needed ----
    const postSubmitSummary = await extractPageSummary(page);
    let postSubmitStatus = 'unknown';
    let needsEmailFix = emailVerification;

    if (apiKeys.deepSeek) {
      const psInfo = await analyzePostSubmit(apiKeys.deepSeek, postSubmitSummary);
      if (psInfo.success) {
        postSubmitStatus = psInfo.status;
        needsEmailFix = psInfo.emailVerificationRequired || emailVerification;
        log(siteName, `[AI] Post-submit info: ${psInfo.message} (Verify required: ${needsEmailFix})`);
      }
    }

    if (needsEmailFix && identity.inboxUsername && identity.inboxPassword) {
      log(siteName, `[EMAIL] AI explicitly detected verification. Switching to webmail...`);
      await queryDb('UPDATE SiteTasks SET CurrentStep=? WHERE Id=?', ['Verifying email via Geezek', siteTask.Id]);
      
      const verificationLink = await pollInboxForActivation(page, identity.email, identity.password, siteName, identity.inboxUsername, identity.inboxPassword);
      if (verificationLink) {
        log(siteName, `[EMAIL] Activating link: ${verificationLink}`);
        try { await page.goto(verificationLink, { timeout: 30000 }); } catch {}
      } else {
        log(siteName, `[EMAIL] No activation link found after polling.`);
        // Don't throw — try to continue anyway, some sites activate immediately
        log(siteName, `[EMAIL] Continuing despite missing verification — profile may still work.`);
      }
    }

    // ---- STEP 7: Fill profile with backlink ----
    await queryDb('UPDATE SiteTasks SET CurrentStep=? WHERE Id=?', ['Filling profile', siteTask.Id]);
    let profileFilled = false;
    const isWixProfile = isWixSite(signupUrl || profileEditUrl || '');

    // === AUTO-DISCOVER profile edit URL if none configured ===
    let effectiveProfileEditUrl = profileEditUrl;
    if (!effectiveProfileEditUrl) {
      const currentUrl = page.url();
      const baseUrl = new URL(currentUrl).origin;
      const discoveryPaths = [
        '/dashboard/settings/',
        '/account',
        '/profile/edit',
        '/profile',
        '/wp-admin/profile.php',
        '/edit-profile/',
        '/settings/',
        '/my-account/',
        '/members/me/',
      ];
      log(siteName, `[PROFILE] No profile URL configured — auto-discovering...`);
      for (const tryPath of discoveryPaths) {
        try {
          const tryUrl = baseUrl + tryPath;
          const resp = await page.goto(tryUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });
          if (resp && resp.status() < 400) {
            const bodyText = await page.evaluate(() => document.body.innerText.substring(0, 1000).toLowerCase());
            // Look for signs this is a real profile/settings page
            if (bodyText.includes('bio') || bodyText.includes('about') || bodyText.includes('website') || 
                bodyText.includes('profile') || bodyText.includes('description') || bodyText.includes('save') ||
                bodyText.includes('update') || bodyText.includes('settings')) {
              effectiveProfileEditUrl = tryUrl;
              log(siteName, `[PROFILE] ✅ Auto-discovered profile page: ${tryUrl}`);
              break;
            }
          }
        } catch {}
      }
    }

    if (effectiveProfileEditUrl) {
      try {
        // Only navigate if we haven't already landed there from discovery
        if (page.url() !== effectiveProfileEditUrl) {
          log(siteName, `[PROFILE] Navigating to profile edit: ${effectiveProfileEditUrl}`);
          await page.goto(effectiveProfileEditUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
          await page.waitForTimeout(isWixProfile ? 4000 : 2500);
        }

        if (isWixProfile) await applyWixHumanBehavior(page, siteName);
        
        // Check if we're actually on the profile edit page (not redirected to login)
        const currentPageText = await page.evaluate(() => document.body.innerText.substring(0, 500).toLowerCase());
        const isOnLoginPage = currentPageText.includes('log in') && currentPageText.includes('password') && !currentPageText.includes('bio');
        
        if (isOnLoginPage) {
          log(siteName, `[PROFILE] ⚠️ Redirected to login page — session lost. Attempting inline login...`);
          if (stopRequested) throw new Error("STOPPED_BY_USER");
          const emailFields = ['input[name="log"]', 'input[name="email"]', 'input[type="email"]', 'input[name="username"]'];
          const passFields = ['input[name="pwd"]', 'input[name="password"]', 'input[type="password"]'];
          for (const sel of emailFields) { try { await page.fill(sel, identity.email, { timeout: 2000 }); break; } catch {} }
          for (const sel of passFields) { try { await page.fill(sel, identity.password, { timeout: 2000 }); break; } catch {} }
          try { await page.click('button[type="submit"], input[type="submit"]', { timeout: 3000 }); } catch {}
          await page.waitForTimeout(4000);
          
          await page.goto(effectiveProfileEditUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
          await page.waitForTimeout(2000);
        }

        // === ATTEMPT 1: Dataset-driven fill (if dataset has profile fields) ===
        if (useDataset && entry.profile_fields) {
          profileFilled = await fillProfileFromDataset(page, entry, identityWithPw, siteName);
          if (profileFilled) log(siteName, `[PROFILE] ✅ Dataset fill succeeded`);
        }

        // === ATTEMPT 2: Brute-force universal fill (ALWAYS try if not filled) ===
        if (!profileFilled) {
          log(siteName, `[PROFILE] Trying brute-force universal fill...`);
          const bioWithLink = `${identity.bio}\n\nVisit my site: ${identity.websiteUrl}`;
          
          // Massive bio selector list
          const allBioSelectors = [
            '#field-about', 'textarea[name*="about"]', 'textarea[name*="bio"]', 'textarea#bio',
            'textarea[name*="description"]', '#user_description', '.profile-bio', '#profile-bio',
            '#edit-profile-bio', '.user-bio', 'form textarea', 'textarea[placeholder*="bio"]',
            'textarea[placeholder*="about"]', 'textarea[placeholder*="description"]',
            'textarea[name*="profile"]', 'textarea.form-control', '#description',
            '[contenteditable="true"]', 'div[contenteditable="true"]',
            'textarea[name="description"]', 'textarea[name="about"]',
            '#biographical-info', '#bp-about', 'textarea[id*="bio"]', 'textarea[id*="about"]',
          ];
          
          // Massive website selector list  
          const allWebSelectors = [
            'input[name*="url"]', 'input#url', 'input[name*="website"]', 'input[type="url"]',
            'input[placeholder*="website"]', 'input[placeholder*="site"]', 'input[name*="link"]',
            '#field-url', 'input[name*="homepage"]', 'input[placeholder*="http"]',
            'input[name="url"]', 'input[name="website"]', '#user-url', '#website',
            'input[id*="url"]', 'input[id*="website"]', 'input[id*="link"]',
          ];

          let bioFilled = false;
          let urlFilled = false;

          for (const sel of allBioSelectors) {
            try {
              const el = await page.$(sel);
              if (el) {
                await el.fill(bioWithLink);
                log(siteName, `[PROFILE] ✅ Bio filled via: ${sel}`);
                bioFilled = true;
                break;
              }
            } catch {}
          }

          for (const sel of allWebSelectors) {
            try {
              const el = await page.$(sel);
              if (el) {
                await el.fill(identity.websiteUrl);
                log(siteName, `[PROFILE] ✅ Website filled via: ${sel}`);
                urlFilled = true;
                break;
              }
            } catch {}
          }

          if (bioFilled || urlFilled) {
            profileFilled = true;
            // Try to save — click any save/update/submit button
            const saveSelectors = [
              'button[type="submit"]', 'input[type="submit"]',
              'button:has-text("Save")', 'button:has-text("Update")', 
              'button:has-text("save")', 'button:has-text("update")',
              '.btn-primary', '#submit', '.save-btn', '.update-btn',
              'button.save', 'button.update', 'input[value="Save"]',
              'input[value="Update Profile"]', 'input[value="Update"]',
            ];
            for (const sel of saveSelectors) {
              try {
                const btn = await page.$(sel);
                if (btn) {
                  await btn.click();
                  log(siteName, `[PROFILE] ✅ Save clicked via: ${sel}`);
                  break;
                }
              } catch {}
            }
            await page.waitForTimeout(5000);
            log(siteName, `[PROFILE] ✅ Brute-force fill completed (bio=${bioFilled}, url=${urlFilled})`);
          }
        }

        // === ATTEMPT 3: AI fallback (last resort) ===
        if (!profileFilled && apiKeys.deepSeek) {
          log(siteName, `[PROFILE] Using AI fallback...`);
          const profileSummary = await extractPageSummary(page);
          const profileNav = await analyzeProfileEditPage(apiKeys.deepSeek, profileSummary);

          if (profileNav.success && profileNav.steps.length > 0) {
            const bioWithLink = `${identity.bio}\n\nVisit my site: ${identity.websiteUrl}`;

            for (const step of profileNav.steps) {
              const val = step.purpose === 'bio' ? bioWithLink : 
                         step.purpose === 'website' ? identity.websiteUrl : '';
              if (val) await fillField(page, step.selector, val, siteName);
              await page.waitForTimeout(isWixProfile ? 1800 : 400);
            }

            if (profileNav.submitButtonSelector) {
              await clickSelector(page, profileNav.submitButtonSelector, siteName);
            }
            await page.waitForTimeout(isWixProfile ? 5000 : 3000);
            profileFilled = true;
          }
        }

        // Final Wix shadow-ban check — only flag actual 404/blocked pages
        if (isWixProfile) {
          const isValid = await page.evaluate(() => {
            const text = document.body.innerText.toLowerCase();
            return !text.includes('page not found') && 
                   !text.includes('this page isn') &&
                   !text.includes('blocked');
          });
          if (!isValid) {
            log(siteName, `[WIX] Shadow-ban detected — page blocked or 404`);
            profileFilled = false;
          }
        }
      } catch (e: any) {
        log(siteName, `[PROFILE] Fill failed: ${e.message}`);
      }
    }

    // Screenshot + Save
    const screenshotPath = path.join(SCREENSHOT_DIR, `${siteName.replace(/[^a-z0-9]/gi, '_')}_${Date.now()}.png`);
    try { await page.screenshot({ path: screenshotPath }); } catch {}

    // ---- STEP 8: Extract TRUE Public Profile URL ----
    // Do not rely solely on profile_pattern as many sites append dynamic internal IDs (e.g., XenForo /members/name.12345/)
    let publicUrl = page.url();
    let dynamicExtractedUrl = null;

    try {
      // Find any internal link on the page containing the username plus common profile path indicators
      // This allows us to naturally discover the internal profile ID if the CMS generates one
      dynamicExtractedUrl = await page.evaluate((uname) => {
        const anchors = Array.from(document.querySelectorAll('a'));
        // Wix uses /profile/{memberId}/profile — NOT username
        const wixProfile = anchors
          .map(a => a.href)
          .filter(h => h.includes('/profile/') && !h.includes('login') && !h.includes('/edit') && !h.includes('/account'));
        if (wixProfile.length > 0) return wixProfile[0];

        const matches = anchors
          .map(a => a.href)
          .filter(h => h.toLowerCase().includes(uname.toLowerCase()) && 
                      (h.includes('/members/') || h.includes('/profile/') || h.includes('/author/') || h.includes('/user/')));
        
        // Return the shortest match to avoid deep sub-pages (like /members/user.123/about)
        if (matches.length > 0) {
           return matches.sort((a, b) => a.length - b.length)[0];
        }
        return null;
      }, identity.username);
    } catch {}

    if (dynamicExtractedUrl) {
      log(siteName, `[VERIFY] Extracted TRUE dynamic profile URL from DOM: ${dynamicExtractedUrl}`);
      publicUrl = dynamicExtractedUrl;
    } else if (entry && entry.profile_pattern) {
      publicUrl = entry.profile_pattern.replace('{username}', identity.username);
    } else if (signupUrl.includes('/user/') || signupUrl.includes('ckan') || signupUrl.includes('dados.') || signupUrl.includes('data.')) {
      // CKAN-specific URL pattern
      const domain = new URL(signupUrl).hostname;
      publicUrl = `https://${domain}/user/${identity.username}`;
    } else if (isWixSite(signupUrl || profileEditUrl || '')) {
       publicUrl = `https://${new URL(signupUrl).hostname}/profile/${identity.username}/profile`;
    }

    let finalBacklinkStatus = profileFilled ? 'INSERTED' : 'SKIPPED';
    
    // After profile fill
    logDetailed(siteName, 'PROFILE_FILLED', { backlinkInserted: profileFilled });

    // Run live verification if we think we inserted it
    if (finalBacklinkStatus === 'INSERTED') {
       log(siteName, `[VERIFY] Launching incognito guest check for: ${publicUrl}`);
       const isLive = await verifyBacklinkIsLive(publicUrl, identity.websiteUrl, browserEngine, siteName);
       if (!isLive) {
          log(siteName, `[VERIFY] Backlink NOT visible! (404/505 or hidden by theme)`);
          finalBacklinkStatus = 'HIDDEN_OR_PRIVATE';
       } else {
          log(siteName, `[VERIFY] ✅ Backlink confirmed LIVE publicly!`);
          finalBacklinkStatus = 'LIVE_CONFIRMED';
       }
    }

    await queryDb('UPDATE SiteTasks SET Status=?, CurrentStep=?, Notes=? WHERE Id=?', [
      'Completed', 'Done',
      `SUCCESS | User: ${identity.username} | Email: ${identity.email} | Pass: ${identity.password} | Backlink: ${finalBacklinkStatus}`,
      siteTask.Id
    ]);

    try {
      await queryDb('INSERT OR IGNORE INTO Proofs (SiteTaskId, FinalProfileUrl, ScreenshotPath, WebsiteUrlAdded, DescriptionUsed, Notes, CapturedAt) VALUES (?,?,?,?,?,?,?)', [
        siteTask.Id, publicUrl, screenshotPath, profileFilled ? 1 : 0, identity.bio, `Backlink: ${finalBacklinkStatus}`, new Date().toISOString()
      ]);
    } catch {}

    const duration = Date.now() - startTime;
    logSuccess(siteName, publicUrl, finalBacklinkStatus, duration);
    return { success: true, profileUrl: publicUrl, backlinkStatus: finalBacklinkStatus };

  } catch (e: any) {
    logFailure(siteName, e.message || 'Unknown error', 'AUTOMATE_SITE');
    await queryDb('UPDATE SiteTasks SET Status=?, CurrentStep=?, Notes=? WHERE Id=?', ['Failed', 'Fatal error', e.message, siteTask.Id]).catch(() => {});
    return { success: false, profileUrl: '', backlinkStatus: '' };
  } finally {
    try { await browser?.close(); } catch {}
  }
}

// ===== Main run function =====
export async function runAutomation(opts: {
  projectId?: number;
  campaignId?: number;
  threadCount: number;
  apiKeys: { twoCaptcha: string; deepSeek: string; geezekBaseUrl: string };
  executionMode: 'all' | 'no_captcha' | 'captcha_only' | 'fastest';
  limitSites?: number; // for test runs
  siteIds?: number[];  // run specific site IDs only
}): Promise<void> {
  if (state.status === 'running') return;

  state.status = 'running';
  state.completed = 0;
  state.failed = 0;
  state.running = 0;
  stopRequested = false;
  state.startedAt = new Date();

  fs.appendFileSync(LOG_FILE, `\n\n--- AUTO RUN STARTED ${new Date().toISOString()} | Mode: ${opts.executionMode} | Threads: ${opts.threadCount}${opts.limitSites ? ` | LIMIT: ${opts.limitSites}` : ''} ---\n`);

  try {
    let project: any;
    let persona: any;

    // Build SQL query for tasks
    let sql = `
      SELECT t.*, s.SiteName, s.SignupUrl, s.ProfileEditUrl, s.CaptchaPresent, 
             s.ReliabilityScore, s.SpeedScore, s.IsActive
      FROM SiteTasks t
      JOIN Sites s ON s.Id = t.SiteId
      WHERE t.Status NOT IN ('Completed')
      AND s.IsActive = 1
    `;
    const sqlParams: any[] = [];

    if (opts.campaignId) {
      const campaigns = await queryDb<any>('SELECT * FROM Campaigns WHERE Id=?', [opts.campaignId]);
      const cmp = campaigns[0];
      if (!cmp) throw new Error(`Campaign ${opts.campaignId} not found`);
      
      const personas = await queryDb<any>('SELECT * FROM Personas WHERE Id=?', [cmp.PersonaId]);
      persona = personas[0];
      
      await queryDb('UPDATE Campaigns SET Status=? WHERE Id=?', ['Running', opts.campaignId]);

      sql += ` AND t.CampaignId = ?`;
      sqlParams.push(opts.campaignId);
    } else if (opts.projectId) {
      const projects = await queryDb<any>('SELECT * FROM Projects WHERE Id=?', [opts.projectId]);
      project = projects[0];
      if (!project) throw new Error(`Project ${opts.projectId} not found`);
      
      sql += ` AND t.CampaignId IS NULL`;
    }

    if (opts.siteIds && opts.siteIds.length > 0) {
      sql += ` AND s.Id IN (${opts.siteIds.map(() => '?').join(',')})`;
      sqlParams.push(...opts.siteIds);
    }
    sql += ` ORDER BY s.ReliabilityScore DESC`;

    let tasks = await queryDb<any>(sql, sqlParams);

    // Filter based on execution mode
    if (opts.executionMode === 'no_captcha') tasks = tasks.filter((t: any) => !t.CaptchaPresent);
    else if (opts.executionMode === 'captcha_only') tasks = tasks.filter((t: any) => t.CaptchaPresent);
    else if (opts.executionMode === 'fastest') tasks = tasks.filter((t: any) => t.ReliabilityScore >= 90 && t.SpeedScore >= 90);

    if (opts.limitSites) tasks = tasks.slice(0, opts.limitSites);

    state.totalSites = tasks.length;
    const logScopeName = project ? (project.BrandName || project.Name) : `Campaign ${opts.campaignId}`;
    fs.appendFileSync(LOG_FILE, `[INFO] Queued ${tasks.length} sites for: ${logScopeName}\n`);
    fs.appendFileSync(LOG_FILE, `[INFO] Dataset has ${platformDataset.length} known domain mappings\n`);

    // Setup base identity (email will be generated per attempt)
    let bio = persona?.Bio || "Professional services setup.";
    let websiteUrl = persona?.WebsiteUrl || "https://google.com";

    const firstName = persona?.FirstName || ['James', 'Maria', 'Alex', 'Sofia', 'Omar', 'Nina'][Math.floor(Math.random() * 6)];
    const lastName = persona?.LastName || ['Smith', 'Garcia', 'Chen', 'Patel', 'Rivera', 'Kim'][Math.floor(Math.random() * 6)];

    let taskIndex = 0;

    const worker = async () => {
      while (taskIndex < tasks.length && !stopRequested) {
        const task = tasks[taskIndex++];
        if (!task) break;

        state.running++;

        let result = { success: false, profileUrl: '', backlinkStatus: '' };

        // Check if site is permanently impossible
        const isPermanentlyImpossible = task.ReliabilityScore === 0 && task.SpeedScore === 0;
        const maxRetries = isPermanentlyImpossible ? 1 : 3;

        // Browser rotation strategy: Chromium → Firefox → Chromium (different UA)
        const browserRotation = ['chromium', 'firefox', 'chromium'] as const;

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
          if (stopRequested) break;

          const browserType = browserRotation[(attempt - 1) % browserRotation.length];
          log(task.SiteName, `[RETRY] Attempt ${attempt}/${maxRetries} (${browserType})`);

          // === CREATE FRESH GEEZEK EMAIL ===
          let emailObj;
          try {
            // Generate natural-looking random username
            const generateRandomUsername = (fName: string, lName: string) => {
              const prefixes = ['pro', 'dev', 'seo', 'web', 'digital', 'marketing', 'growth', 'consult', 'expert', 'online'];
              const randomPrefix = prefixes[Math.floor(Math.random() * prefixes.length)];
              const randomNumber = Math.floor(10000 + Math.random() * 90000);
              
              // 70% chance to use name-based username, 30% chance to use prefix-based
              if (Math.random() > 0.3 && fName && lName) {
                return `${fName.toLowerCase().replace(/[^a-z]/g, '')}${lName.toLowerCase().replace(/[^a-z]/g, '')}${randomNumber}`;
              } else {
                return `${randomPrefix}${randomNumber}`;
              }
            };
            
            const generatedUsername = generateRandomUsername(firstName, lastName);
            const emailObjRaw = await createEmail(generatedUsername, opts.apiKeys.geezekBaseUrl);
            emailObj = {
              email: emailObjRaw.email,
              inboxUsername: emailObjRaw.email,
              inboxPassword: emailObjRaw.password
            };
            
            const identity: any = {
              displayName: `${firstName} ${lastName}`,
              firstName,
              lastName,
              username: generatedUsername,
              email: emailObj.email,
              password: `Pass${Math.floor(Math.random() * 9000) + 1000}!Mx`,
              websiteUrl,
              bio,
              backlink: websiteUrl,
              browserType,
              inboxUsername: emailObj.inboxUsername,
              inboxPassword: emailObj.inboxPassword
            };

            log(task.SiteName, `[EMAIL] Generated target endpoint: ${identity.email}`);

            result = await automateSite(task, identity, opts.apiKeys);

          } catch (err: any) {
            log(task.SiteName, `[EMAIL] Failed to create geezek email: ${err.message}`);
            continue;
          }

          if (result.success) break;
          
          if (attempt < maxRetries) {
            // Longer wait between retries to avoid rate limiting
            const retryDelay = 3000 + Math.random() * 4000;
            log(task.SiteName, `[RETRY] Waiting ${Math.round(retryDelay/1000)}s before next attempt...`);
            await new Promise(r => setTimeout(r, retryDelay));
          }
        }

        if (result.success) state.completed++;
        else state.failed++;

        state.running--;
        await new Promise(r => setTimeout(r, Math.random() * 1500 + 500));
      }
    };

    const workers = Array.from({ length: Math.min(opts.threadCount, tasks.length) }, () => worker());
    await Promise.all(workers);

  } catch (e: any) {
    fs.appendFileSync(LOG_FILE, `[FATAL] Run failed: ${e.message}\n`);
  } finally {
    state.status = 'done';
    
    // === RANKERX-STYLE COMPLETION REPORT ===
    const successRate = state.totalSites > 0 
      ? Math.round((state.completed / state.totalSites) * 100) 
      : 0;

    const report = `
╔══════════════════════════════════════════════════════════════╗
║                 CAMPAIGN COMPLETED SUCCESSFULLY              ║
╠══════════════════════════════════════════════════════════════╣
║ Total Sites      : ${state.totalSites}
║ Successful       : ${state.completed}
║ Failed           : ${state.failed}
║ Success Rate     : ${successRate}%
║ Backlinks Inserted : ${state.completed}
║ Duration         : ${state.startedAt ? ((Date.now() - state.startedAt.getTime()) / 1000 / 60).toFixed(1) : 0} minutes
╚══════════════════════════════════════════════════════════════╝

✅ Check the Proofs table and Screenshots folder for full details.
`;

    console.log(report);
    fs.appendFileSync(LOG_FILE, report + '\n\n');

    if (opts.campaignId) {
      queryDb('UPDATE Campaigns SET Status=? WHERE Id=?', ['Done', opts.campaignId]).catch(() => {});
    }
    
    fs.appendFileSync(LOG_FILE, `\n--- RUN FINISHED ${new Date().toISOString()} | Done: ${state.completed} | Failed: ${state.failed} ---\n`);
  }
}

// === Generate clean list of verified live profiles ===
export async function generateLiveProfilesReport() {
  const reportPath = path.join(LOG_DIR, 'Live_Profiles.txt');

  const liveProfiles = await queryDb<any>(`
    SELECT p.FinalProfileUrl, s.SiteName, p.WebsiteUrlAdded, p.CapturedAt
    FROM Proofs p
    JOIN SiteTasks t ON t.Id = p.SiteTaskId
    JOIN Sites s ON s.Id = t.SiteId
    WHERE p.WebsiteUrlAdded = 1
    AND p.Notes LIKE '%LIVE_CONFIRMED%'
    ORDER BY p.CapturedAt DESC
  `);

  let content = `=== VERIFIED LIVE PROFILES ===\n`;
  content += `Generated: ${new Date().toISOString()}\n`;
  content += `Total Live Backlinks: ${liveProfiles.length}\n\n`;

  liveProfiles.forEach((p: any, index: number) => {
    content += `${index + 1}. ${p.SiteName}\n`;
    content += `   Profile: ${p.FinalProfileUrl}\n`;
    content += `   Captured: ${p.CapturedAt}\n\n`;
  });

  fs.writeFileSync(reportPath, content);
  console.log(`\n✅ Live Profiles Report saved to: ${reportPath}`);
  console.log(`   Total Verified Live Backlinks: ${liveProfiles.length}`);
}

// ============================================================
// UNIVERSAL WIX GOOGLE OAUTH SIGNUP — works for all 90 domains
// ============================================================

const GOOGLE_PROFILE_PATH = path.join(
  process.env.USERPROFILE || os.homedir(),
  'Desktop', '1', 'profile new maker', 'google-session'
);

export type WixAuthMethod = 'google' | 'email' | 'both' | 'unknown';

export async function detectWixAuthMethods(authCtx: any): Promise<WixAuthMethod> {
  await authCtx.waitForTimeout(3000); // let iframe fully render

  const hasGoogle = await authCtx.locator(
    'button:has-text("Google"), [data-testid="google"], [aria-label*="Google" i]'
  ).first().isVisible().catch(() => false);

  const hasEmail = await authCtx.locator(
    'input[type="email"], input[name="email"], [data-testid="emailInput"], button:has-text("Sign up with email")'
  ).first().isVisible().catch(() => false);

  if (hasGoogle && hasEmail) return 'both';
  if (hasGoogle) return 'google';
  if (hasEmail) return 'email';
  return 'unknown';
}

function googleSessionExists(): boolean {
  return fs.existsSync(path.join(GOOGLE_PROFILE_PATH, 'Default', 'Cookies'));
}

/**
 * ONE-TIME SETUP: Run this ONCE manually to save Google session.
 * After this, all 90 sites reuse the saved session automatically.
 */
export async function setupGoogleSession(): Promise<void> {
  const { chromium } = require('playwright');
  const context = await chromium.launchPersistentContext(GOOGLE_PROFILE_PATH, {
    headless: false,
    args: ['--no-sandbox', '--disable-blink-features=AutomationControlled'],
  });
  const page = await context.newPage();
  await page.goto('https://accounts.google.com');
  console.log('\n>>> LOGIN TO YOUR GMAIL IN THE BROWSER WINDOW THAT OPENED.');
  console.log('>>> After you are fully logged in, press ENTER here...\n');
  await new Promise(r => process.stdin.once('data', r));
  await context.close();
  console.log('✅ Google session saved to:', GOOGLE_PROFILE_PATH);
}

/**
 * MAIN FUNCTION: Signup on ANY Wix site using saved Google session.
 * Works for all 90 domains automatically.
 */
export async function wixGoogleSignup(
  siteDomain: string, // e.g. "haphong.edu.vn"
  siteName: string,
): Promise<{
  success: boolean;
  profileUrl: string | null;
  memberEmail: string | null;
  memberId: string | null;
}> {
  const { chromium } = require('playwright');

  // Always use persistent context with saved Google session
  const context = await chromium.launchPersistentContext(GOOGLE_PROFILE_PATH, {
    headless: false, // MUST be false for Google OAuth popup
    args: [
      '--no-sandbox',
      '--disable-blink-features=AutomationControlled',
      '--disable-infobars',
      '--window-size=1280,800',
    ],
    viewport: { width: 1280, height: 720 },
    ignoreHTTPSErrors: true,
  });

  // Inject anti-fingerprint before every page
  await context.addInitScript(getAntiFingerPrintScript());

  const page = await context.newPage();

  try {
    const siteUrl = `https://www.${siteDomain}`;
    log(siteName, `WIX-GOOGLE → Navigating to ${siteUrl}`);

    // ── STEP 1: Navigate to site root ──────────────────────────────────
    await page.goto(siteUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(3000 + Math.random() * 2000);

    // Check if already logged in (member link visible in header)
    const alreadyLoggedIn = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('a'))
        .some((a: any) => a.href.includes('/profile/'));
    });
    if (alreadyLoggedIn) {
      log(siteName, 'WIX-GOOGLE → Already logged in! Skipping signup.');
    } else {
      // ── STEP 2: Click Login/Signup button ──────────────────────────
      log(siteName, 'WIX-GOOGLE → Opening auth modal...');
      const loginTriggers = [
        'button:has-text("Log In")',
        'button:has-text("Sign Up")',
        'button:has-text("Login")',
        'button:has-text("Iniciar sesión")',
        'button:has-text("로그인")',       // Korean (democracy-edu.or.kr)
        'button:has-text("Entrar")',
        '[data-testid="login"]',
        '[data-testid="signUp"]',
        '#login',
        '#userProfile',
        '.login-button',
      ];

      let modalOpened = false;
      // Retry up to 4 times — Wix React can be slow to hydrate
      for (let attempt = 0; attempt < 4 && !modalOpened; attempt++) {
        await page.waitForTimeout(2000);
        for (const sel of loginTriggers) {
          try {
            const btn = page.locator(sel).first();
            await btn.waitFor({ state: 'visible', timeout: 2000 });
            await btn.click({ force: true, timeout: 3000 });
            modalOpened = true;
            log(siteName, `WIX-GOOGLE → Modal opened via: ${sel}`);
            break;
          } catch { /* try next */ }
        }
        if (!modalOpened) {
          // JS fallback — Wix internal API
          await page.evaluate(() => {
            (window as any).wixUsers?.promptLogin?.({ mode: 'signup' });
          });
          await page.waitForTimeout(2000);
          // Check if modal appeared after JS trigger
          modalOpened = await page.locator('[data-testid="switchToSignUp"], button:has-text("Google")')
            .first().isVisible().catch(() => false);
        }
      }

      await page.waitForTimeout(5000); // Wix React modal fully renders

      // ── STEP 3: Attach to Wix Auth iFrame ──────────────────────────
      let authCtx: any = page;
      await page.waitForTimeout(2000);
      const wixFrame = page.frames().find((f: any) =>
        f.url().includes('users.wix.com') ||
        f.url().includes('iam.wix.com') ||
        f.url().includes('accounts.wix.com')
      );
      if (wixFrame) {
        authCtx = wixFrame;
        log(siteName, `WIX-GOOGLE → Auth iframe: ${wixFrame.url()}`);
      } else {
        log(siteName, 'WIX-GOOGLE → No iframe found, using main context');
      }

      // ── STEP 4: Switch to Sign Up (if on Login tab) ────────────────
      const signupSwitchers = [
        '[data-testid="switchToSignUp"]',
        'button:has-text("Sign Up")',
        'a:has-text("Sign Up")',
        'a:has-text("Đăng ký")',
        'a:has-text("Registrarse")',
        'a:has-text("회원가입")',
        'button:has-text("Đăng ký")',
      ];
      for (const sel of signupSwitchers) {
        try {
          const el = await authCtx.$(sel);
          if (el && await el.isVisible()) {
            await el.click();
            log(siteName, `WIX-GOOGLE → Switched to Sign Up via: ${sel}`);
            await page.waitForTimeout(1500);
            break;
          }
        } catch { /* try next */ }
      }

      // ── STEP 5: Click "Sign up with Google" ────────────────────────
      log(siteName, 'WIX-GOOGLE → Clicking Google button...');
      const googleBtns = [
        'button:has-text("Google")',
        'button:has-text("Đăng ký bằng Google")',
        'button:has-text("Registrarse con Google")',
        'button:has-text("Google로 가입")',
        '[data-testid="google"]',
        '[aria-label*="Google" i]',
        'button[class*="google" i]',
      ];

      // Listen for Google popup BEFORE clicking
      const googlePopupPromise = page.context()
        .waitForEvent('page', { timeout: 20000 })
        .catch(() => null);

      let googleClicked = false;
      for (const sel of googleBtns) {
        try {
          const el = await authCtx.$(sel);
          if (el && await el.isVisible()) {
            await el.click({ force: true });
            googleClicked = true;
            log(siteName, `WIX-GOOGLE → Google button clicked via: ${sel}`);
            break;
          }
        } catch { /* try next */ }
      }

      if (!googleClicked) {
        log(siteName, 'WIX-GOOGLE → WARN: Could not find Google button!');
        await context.close();
        return { success: false, profileUrl: null, memberEmail: null, memberId: null };
      }

      // ── STEP 6: Handle Google OAuth popup ──────────────────────────
      const googlePopup: any = await googlePopupPromise;

      if (googlePopup) {
        log(siteName, `WIX-GOOGLE → Google popup opened: ${googlePopup.url()}`);
        await googlePopup.waitForLoadState('domcontentloaded').catch(() => {});
        await googlePopup.waitForTimeout(4000);

        // Pick saved Google account (auto-shown from saved session)
        const accountSelectors = [
          '[data-identifier]',
          'li[data-identifier]',
          '.XLHNAb',
          'div[data-authuser]',
          '[data-email]',
        ];
        for (const sel of accountSelectors) {
          try {
            const acct = googlePopup.locator(sel).first();
            await acct.waitFor({ state: 'visible', timeout: 5000 });
            await acct.click();
            log(siteName, `WIX-GOOGLE → Google account selected`);
            break;
          } catch { /* account may auto-select */ }
        }

        // Wait for popup to close = OAuth success
        await googlePopup.waitForEvent('close', { timeout: 30000 })
          .catch(() => log(siteName, 'WIX-GOOGLE → Popup did not auto-close'));
        log(siteName, 'WIX-GOOGLE → Google OAuth completed ✅');

      } else {
        // Redirect flow (no popup) — just wait for page redirect
        log(siteName, 'WIX-GOOGLE → No popup detected (redirect flow), waiting...');
        await page.waitForNavigation({ timeout: 20000 }).catch(() => {});
      }
    }

    // ── STEP 7: Wait for Wix to finalize login + redirect ──────────────
    await page.waitForTimeout(8000);

    // ── STEP 8: Extract member UUID from DOM ───────────────────────────
    // Wix profile URLs contain /profile/{memberId}/profile
    // memberId is a UUID like "vanavob43247741" — NOT your username
    log(siteName, 'WIX-GOOGLE → Extracting member profile URL...');

    let profileUrl: string | null = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('a'))
        .map((a: any) => a.href)
        .find((h: string) => h.includes('/profile/') && !h.includes('login') && !h.includes('signup'))
        || null;
    });

    // Fallback: navigate to account page if DOM link not found
    if (!profileUrl) {
      await page.goto(`https://www.${siteDomain}/account/info`, {
        waitUntil: 'domcontentloaded', timeout: 20000
      }).catch(() => {});
      await page.waitForTimeout(4000);
      profileUrl = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('a'))
          .map((a: any) => a.href)
          .find((h: string) => h.includes('/profile/'))
          || window.location.href;
      });
    }

    // Extract memberId from URL
    // e.g. https://www.haphong.edu.vn/profile/vanavob43247741/profile → "vanavob43247741"
    const memberIdMatch = profileUrl?.match(/\/profile\/([^/]+)\//);
    const memberId = memberIdMatch ? memberIdMatch[1] : null;
    log(siteName, `WIX-GOOGLE → Profile URL: ${profileUrl}`);
    log(siteName, `WIX-GOOGLE → Member ID: ${memberId}`);

    // ── STEP 9: Extract email from account settings ─────────────────────
    let memberEmail: string | null = null;
    try {
      await page.goto(`https://www.${siteDomain}/account/info`, {
        waitUntil: 'domcontentloaded', timeout: 20000
      });
      await page.waitForTimeout(5000); // React hydration
      memberEmail = await page.evaluate(() => {
        const text = document.body.innerText;
        const match = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
        return match ? match[0] : null;
      });
      log(siteName, `WIX-GOOGLE → Email confirmed: ${memberEmail}`);
    } catch { /* account page may not be accessible */ }

    // ── STEP 10: Save to DB ─────────────────────────────────────────────
    if (profileUrl) {
      await queryDb(
        `UPDATE SiteTasks SET Status=?, ProfileUrl=?, Notes=?, CurrentStep=? WHERE SiteName=?`,
        ['done', profileUrl, `MemberEmail: ${memberEmail} | MemberId: ${memberId}`, 'Google OAuth complete', siteDomain]
      ).catch(() => {});
    }

    await context.close();
    return { success: true, profileUrl, memberEmail, memberId };

  } catch (e: any) {
    log(siteName, `WIX-GOOGLE → ERROR: ${e.message}`);
    // await page.screenshot({ path: path.join(SCREENSHOT_DIR, `${siteName}-google-error.png`) }).catch(() => {});
    await context.close();
    return { success: false, profileUrl: null, memberEmail: null, memberId: null };
  }
}

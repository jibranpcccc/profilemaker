// Port of TwoCaptchaService.cs — calls 2Captcha REST API directly (no SDK needed)

export interface CaptchaResult {
  success: boolean;
  token: string;
  error: string;
  injectionScript: string;
  captchaType: 'recaptcha' | 'hcaptcha' | 'none';
}

const API_IN = 'https://2captcha.com/in.php';
const API_RES = 'https://2captcha.com/res.php';

async function submitTask(params: Record<string, string>): Promise<string> {
  const body = new URLSearchParams(params);
  const res = await fetch(API_IN, {
    method: 'POST',
    body,
    signal: AbortSignal.timeout(15000),
  });
  const text = await res.text();
  if (!text.startsWith('OK|')) throw new Error(`2Captcha submit failed: ${text}`);
  return text.split('|')[1];
}

async function pollResult(apiKey: string, captchaId: string, maxWait = 90): Promise<string> {
  const deadline = Date.now() + maxWait * 1000;
  while (Date.now() < deadline) {
    await new Promise(r => setTimeout(r, 5000));
    const res = await fetch(`${API_RES}?key=${apiKey}&action=get&id=${captchaId}`);
    const text = await res.text();
    if (text === 'CAPCHA_NOT_READY') continue;
    if (text.startsWith('OK|')) return text.split('|')[1];
    throw new Error(`2Captcha poll error: ${text}`);
  }
  throw new Error('2Captcha timeout');
}

export async function solveRecaptchaV2(
  apiKey: string,
  siteKey: string,
  pageUrl: string
): Promise<CaptchaResult> {
  try {
    const id = await submitTask({ key: apiKey, method: 'userrecaptcha', googlekey: siteKey, pageurl: pageUrl, json: '0' });
    const token = await pollResult(apiKey, id);
    return { success: true, token, error: '', captchaType: 'recaptcha', injectionScript: buildRecaptchaScript(token) };
  } catch (e: any) {
    return { success: false, token: '', error: e.message, captchaType: 'recaptcha', injectionScript: '' };
  }
}

export async function solveHCaptcha(
  apiKey: string,
  siteKey: string,
  pageUrl: string
): Promise<CaptchaResult> {
  try {
    const id = await submitTask({ key: apiKey, method: 'hcaptcha', sitekey: siteKey, pageurl: pageUrl, json: '0' });
    const token = await pollResult(apiKey, id);
    return { success: true, token, error: '', captchaType: 'hcaptcha', injectionScript: buildHCaptchaScript(token) };
  } catch (e: any) {
    return { success: false, token: '', error: e.message, captchaType: 'hcaptcha', injectionScript: '' };
  }
}

export async function autoSolveFromPage(
  page: any,
  pageUrl: string,
  apiKey: string
): Promise<boolean> {
  if (!apiKey) {
    console.log('2Captcha API key not set');
    return false;
  }
  
  let pageHtml = '';
  try {
    pageHtml = await page.content();
  } catch (e) {
    return false;
  }

  // Detect sitekey
  let siteKey = '';
  const standardMatch = pageHtml.match(/data-sitekey="([^"]+)"/);
  if (standardMatch) siteKey = standardMatch[1];
  
  if (!siteKey) {
    const iframeMatch = pageHtml.match(/src="[^"]*?(?:recaptcha|hcaptcha)[^"]*?[k|sitekey]=([^"&]+)/);
    if (iframeMatch) siteKey = iframeMatch[1];
  }

  if (!siteKey) return false;

  const isHCaptcha = pageHtml.toLowerCase().includes('hcaptcha') || siteKey.startsWith('10000000');
  
  let result;
  if (isHCaptcha) {
    result = await solveHCaptcha(apiKey, siteKey, pageUrl);
  } else {
    result = await solveRecaptchaV2(apiKey, siteKey, pageUrl);
  }
  
  if (result.success && result.injectionScript) {
    try {
      await page.evaluate(result.injectionScript);
      return true;
    } catch {
      return false;
    }
  }
  return false;
}

function buildRecaptchaScript(token: string): string {
  return `
    (function() {
      var token = ${JSON.stringify(token)};
      var textarea = document.querySelector('[name="g-recaptcha-response"]');
      if (!textarea) {
        textarea = document.createElement('textarea');
        textarea.name = 'g-recaptcha-response';
        textarea.style.display = 'none';
        document.body.appendChild(textarea);
      }
      var nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value')?.set;
      if (nativeSetter) nativeSetter.call(textarea, token);
      else textarea.value = token;
      textarea.dispatchEvent(new Event('input', { bubbles: true }));
      textarea.dispatchEvent(new Event('change', { bubbles: true }));
      var div = document.querySelector('.g-recaptcha');
      if (div) { var cb = div.getAttribute('data-callback'); if (cb && typeof window[cb] === 'function') window[cb](token); }
      if (typeof grecaptcha !== 'undefined' && grecaptcha.getResponse) { grecaptcha.getResponse = function() { return token; }; }
    })();
  `;
}

function buildHCaptchaScript(token: string): string {
  return `
    (function() {
      var token = ${JSON.stringify(token)};
      var r = document.querySelector('[name="h-captcha-response"]');
      if (r) r.value = token;
      var g = document.querySelector('[name="g-recaptcha-response"]');
      if (g) g.value = token;
    })();
  `;
}

import fs from 'fs';
import path from 'path';
import os from 'os';

const localAppData = process.env.LOCALAPPDATA 
  || (process.platform === 'darwin' 
      ? path.join(os.homedir(), 'Library', 'Application Support')
      : process.platform === 'linux'
      ? path.join(os.homedir(), '.config')
      : path.join(os.homedir(), 'AppData', 'Local'));
const SETTINGS_PATH = path.join(localAppData, 'ProfileSubmissionAssistant', 'settings.json');

export interface AppSettings {
  TwoCaptchaApiKey: string;
  DeepSeekApiKey: string;
  GeezekBaseUrl: string;
  DefaultUsernamePrefix: string;
  ProxyAddress: string;
  ThreadCount: number;
  FastMode: boolean;
  MaxThreads: number;
}

const DEFAULT_SETTINGS: AppSettings = {
  TwoCaptchaApiKey: '',
  DeepSeekApiKey: '',
  GeezekBaseUrl: 'https://geezek.com/create_email.php',
  DefaultUsernamePrefix: 'user',
  ProxyAddress: '',
  ThreadCount: 12,
  FastMode: true,
  MaxThreads: 12,
};

export function loadSettings(): AppSettings {
  try {
    if (fs.existsSync(SETTINGS_PATH)) {
      const raw = fs.readFileSync(SETTINGS_PATH, 'utf-8');
      return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
    }
  } catch {}
  return { ...DEFAULT_SETTINGS };
}

export function saveSettings(settings: Partial<AppSettings>): void {
  try {
    const current = loadSettings();
    const merged = { ...current, ...settings };
    fs.mkdirSync(path.dirname(SETTINGS_PATH), { recursive: true });
    fs.writeFileSync(SETTINGS_PATH, JSON.stringify(merged, null, 2), 'utf-8');
  } catch (e) {
    console.error('Failed to save settings:', e);
  }
}

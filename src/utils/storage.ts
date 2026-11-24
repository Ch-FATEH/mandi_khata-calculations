import {
  AppLanguage,
  AppSettings,
  BackupPayload,
  CropItem,
  PartyPayment,
  PurchaseRecord,
  RefCounters,
  SaleRecord,
  ThemeMode,
} from '../types/mandi';
import { formatRefNumber } from './calculations';

export const STORAGE_KEYS = {
  SALES: 'mandi_khata_sales_v1',
  PURCHASES: 'mandi_khata_purchases_v1',
  LEDGER: 'mandi_khata_ledger_v1',
  COUNTERS: 'mandi_khata_counters_v1',
  SETTINGS: 'mandi_khata_settings_v1',
  THEME: 'mandi_khata_theme_v1',
  LANGUAGE: 'mandi_khata_lang_v1',
  LOGO: 'mandi_khata_logo_v1',
  SIGNATURE: 'mandi_khata_signature_v1',
  SETUP_DONE: 'mandi_khata_setup_done_v1',
} as const;

export const DEFAULT_CROPS: CropItem[] = [
  {
    id: 'wheat',
    nameUr: 'گندم',
    nameEn: 'Wheat',
    varieties: ['اکبر 2019', 'دلکش', 'فخر بھکر', 'صبحانی'],
  },
  {
    id: 'paddy',
    nameUr: 'مونجی',
    nameEn: 'Paddy / Rice',
    varieties: ['سپر 1509', 'ایری 6', 'سپر ہائبرڈ', '1121', 'سپر 386'],
  },
  {
    id: 'maize',
    nameUr: 'مکئی',
    nameEn: 'Maize',
    varieties: ['سپر ہائبرڈ', 'پائنیر', 'مقامی'],
  },
  {
    id: 'potato',
    nameUr: 'آلو',
    nameEn: 'Potato',
    varieties: ['ایسٹرکس', 'موزیکا', 'کروڈا'],
  },
  {
    id: 'mustard',
    nameUr: 'سرسوں',
    nameEn: 'Mustard',
    varieties: ['کینولا', 'رایا', 'دیسی سرسوں'],
  },
];

export const DEFAULT_SETTINGS: AppSettings = {
  shopNameUr: '',
  shopNameEn: '',
  tagline: '',
  owners: [
    { name: '', phone: '' },
    { name: '', phone: '' },
    { name: '', phone: '' },
  ],
  address: '',
  city: '',

  commissionPercent: 0,
  commissionMode: 'off',
  maundKg: 40,
  bardanaPerBag: 1.25,
  bardanaEnabledSales: true,
  bardanaEnabledPurchase: true,
  chungiEnabledPurchase: true,
  chungiDivisor: 2,
  marginEnabledSales: true,
  defaultMarginCut: 0,
  kandaEnabledSales: true,
  kandaEnabledPurchase: true,
  taxLabourLabelUr: 'بینک ٹیکس / مزدوری',
  taxLabourLabelEn: 'Bank Tax / Labour',
  roundAmounts: true,
  maundTwoDecimals: true,

  crops: DEFAULT_CROPS,
  receiptHeaderLine: '',
  receiptFooterAddress: '',
  showOwnerPhonesOnReceipt: true,
  showSignatureOnReceipt: true,
  salesPrefix: 'F',
  salesStartNumber: 1,
  purchasePrefix: 'K',
  purchaseStartNumber: 1,
};

export const DEFAULT_COUNTERS: RefCounters = {
  salesNext: 1,
  purchaseNext: 1,
};

function safeGet<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function safeSet(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error('Failed to persist to localStorage:', err);
  }
}

export function loadSales(): SaleRecord[] {
  const list = safeGet<SaleRecord[]>(STORAGE_KEYS.SALES, []);
  return Array.isArray(list) ? list : [];
}

export function saveSales(sales: SaleRecord[]): void {
  safeSet(STORAGE_KEYS.SALES, sales);
}

export function loadPurchases(): PurchaseRecord[] {
  const list = safeGet<PurchaseRecord[]>(STORAGE_KEYS.PURCHASES, []);
  return Array.isArray(list) ? list : [];
}

export function savePurchases(purchases: PurchaseRecord[]): void {
  safeSet(STORAGE_KEYS.PURCHASES, purchases);
}

export function loadLedger(): PartyPayment[] {
  const list = safeGet<PartyPayment[]>(STORAGE_KEYS.LEDGER, []);
  return Array.isArray(list) ? list : [];
}

export function saveLedger(ledger: PartyPayment[]): void {
  safeSet(STORAGE_KEYS.LEDGER, ledger);
}

export function loadCounters(settings: AppSettings): RefCounters {
  const stored = safeGet<RefCounters | null>(STORAGE_KEYS.COUNTERS, null);
  if (!stored) {
    return {
      salesNext: Math.max(1, settings.salesStartNumber || 1),
      purchaseNext: Math.max(1, settings.purchaseStartNumber || 1),
    };
  }
  return {
    salesNext: Math.max(stored.salesNext || 1, settings.salesStartNumber || 1),
    purchaseNext: Math.max(stored.purchaseNext || 1, settings.purchaseStartNumber || 1),
  };
}

export function saveCounters(counters: RefCounters): void {
  safeSet(STORAGE_KEYS.COUNTERS, counters);
}

/**
 * Allocates the next reference number monotonically.
 * Never reuses deleted numbers, and advances past any existing record numbers.
 */
export function allocateNextRef(
  kind: 'sale' | 'purchase',
  counters: RefCounters,
  settings: AppSettings
): { refNo: string; nextCounters: RefCounters } {
  if (kind === 'sale') {
    const current = Math.max(counters.salesNext, settings.salesStartNumber || 1);
    const refNo = formatRefNumber(settings.salesPrefix || 'F', current);
    return {
      refNo,
      nextCounters: { ...counters, salesNext: current + 1 },
    };
  }
  const current = Math.max(counters.purchaseNext, settings.purchaseStartNumber || 1);
  const refNo = formatRefNumber(settings.purchasePrefix || 'K', current);
  return {
    refNo,
    nextCounters: { ...counters, purchaseNext: current + 1 },
  };
}

export function loadSettings(): AppSettings {
  const stored = safeGet<Partial<AppSettings>>(STORAGE_KEYS.SETTINGS, {});
  const merged: AppSettings = {
    ...DEFAULT_SETTINGS,
    ...stored,
    owners:
      Array.isArray(stored.owners) && stored.owners.length === 3
        ? stored.owners
        : DEFAULT_SETTINGS.owners,
    crops:
      Array.isArray(stored.crops) && stored.crops.length > 0
        ? stored.crops
        : DEFAULT_SETTINGS.crops,
  };
  return merged;
}

export function saveSettings(settings: AppSettings): void {
  safeSet(STORAGE_KEYS.SETTINGS, settings);
}

export function loadTheme(): ThemeMode {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.THEME);
    if (raw === 'dark' || raw === 'light') return raw;
    if (raw === '"dark"') return 'dark';
    if (raw === '"light"') return 'light';
  } catch {
    // ignore
  }
  return 'light';
}

export function saveTheme(theme: ThemeMode): void {
  try {
    localStorage.setItem(STORAGE_KEYS.THEME, theme);
  } catch {
    // ignore
  }
}

export function loadLanguage(): AppLanguage {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.LANGUAGE);
    if (raw === 'en' || raw === 'ur') return raw;
    if (raw === '"en"') return 'en';
    if (raw === '"ur"') return 'ur';
  } catch {
    // ignore
  }
  return 'ur';
}

export function saveLanguage(lang: AppLanguage): void {
  try {
    localStorage.setItem(STORAGE_KEYS.LANGUAGE, lang);
  } catch {
    // ignore
  }
}

export function loadLogo(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEYS.LOGO);
  } catch {
    return null;
  }
}

export function saveLogo(dataUrl: string | null): void {
  try {
    if (dataUrl) {
      localStorage.setItem(STORAGE_KEYS.LOGO, dataUrl);
    } else {
      localStorage.removeItem(STORAGE_KEYS.LOGO);
    }
  } catch {
    // ignore
  }
}

export function loadSignature(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEYS.SIGNATURE);
  } catch {
    return null;
  }
}

export function saveSignature(dataUrl: string | null): void {
  try {
    if (dataUrl) {
      localStorage.setItem(STORAGE_KEYS.SIGNATURE, dataUrl);
    } else {
      localStorage.removeItem(STORAGE_KEYS.SIGNATURE);
    }
  } catch {
    // ignore
  }
}

export function loadSetupDone(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEYS.SETUP_DONE) === 'true';
  } catch {
    return false;
  }
}

export function saveSetupDone(done: boolean): void {
  try {
    localStorage.setItem(STORAGE_KEYS.SETUP_DONE, done ? 'true' : 'false');
  } catch {
    // ignore
  }
}

export function createBackupPayload(params: {
  sales: SaleRecord[];
  purchases: PurchaseRecord[];
  ledger: PartyPayment[];
  counters: RefCounters;
  settings: AppSettings;
  theme: ThemeMode;
  language: AppLanguage;
  logo: string | null;
  signature: string | null;
}): BackupPayload {
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    ...params,
  };
}

export function validateBackupPayload(raw: unknown): {
  valid: boolean;
  payload?: BackupPayload;
  error?: string;
} {
  if (!raw || typeof raw !== 'object') {
    return { valid: false, error: 'Invalid JSON object' };
  }
  const obj = raw as Record<string, unknown>;
  if (!Array.isArray(obj.sales) || !Array.isArray(obj.purchases)) {
    return { valid: false, error: 'Missing sales or purchases arrays' };
  }
  if (!obj.settings || typeof obj.settings !== 'object') {
    return { valid: false, error: 'Missing settings object' };
  }

  const payload: BackupPayload = {
    version: typeof obj.version === 'number' ? obj.version : 1,
    exportedAt: typeof obj.exportedAt === 'string' ? obj.exportedAt : new Date().toISOString(),
    sales: obj.sales as SaleRecord[],
    purchases: obj.purchases as PurchaseRecord[],
    ledger: Array.isArray(obj.ledger) ? (obj.ledger as PartyPayment[]) : [],
    counters:
      obj.counters && typeof obj.counters === 'object'
        ? (obj.counters as RefCounters)
        : DEFAULT_COUNTERS,
    settings: { ...DEFAULT_SETTINGS, ...(obj.settings as Partial<AppSettings>) },
    theme: obj.theme === 'dark' ? 'dark' : 'light',
    language: obj.language === 'en' ? 'en' : 'ur',
    logo: typeof obj.logo === 'string' ? obj.logo : null,
    signature: typeof obj.signature === 'string' ? obj.signature : null,
  };

  return { valid: true, payload };
}

export function mergeBackupData(
  current: {
    sales: SaleRecord[];
    purchases: PurchaseRecord[];
    ledger: PartyPayment[];
    counters: RefCounters;
  },
  incoming: BackupPayload
): {
  sales: SaleRecord[];
  purchases: PurchaseRecord[];
  ledger: PartyPayment[];
  counters: RefCounters;
} {
  const mergeById = <T extends { id: string }>(existing: T[], added: T[]): T[] => {
    const map = new Map<string, T>();
    for (const item of existing) map.set(item.id, item);
    for (const item of added) {
      if (!map.has(item.id)) map.set(item.id, item);
    }
    return Array.from(map.values());
  };

  return {
    sales: mergeById(current.sales, incoming.sales),
    purchases: mergeById(current.purchases, incoming.purchases),
    ledger: mergeById(current.ledger, incoming.ledger),
    counters: {
      salesNext: Math.max(current.counters.salesNext, incoming.counters.salesNext || 1),
      purchaseNext: Math.max(current.counters.purchaseNext, incoming.counters.purchaseNext || 1),
    },
  };
}

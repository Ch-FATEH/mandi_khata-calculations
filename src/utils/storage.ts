import {
  AppLanguage,
  AppSettings,
  AutoBackupSettings,
  BackupPayload,
  CropItem,
  LocalSnapshot,
  PartyMeta,
  PartyPayment,
  PurchaseRecord,
  QuickNote,
  RefCounters,
  RoznamchaEntry,
  RoznamchaSettings,
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
  // Additive v2 keys
  PARTY_META: 'mandi_khata_parties_meta_v1',
  AUTO_BACKUP: 'mandi_khata_auto_backup_v1',
  LOCAL_SNAPSHOTS: 'mandi_khata_local_snapshots_v1',
  DISMISSED_ADS: 'mandi_khata_dismissed_ads_v1',
  // Additive v3 Roznamcha keys
  ROZNAMCHA_ENTRIES: 'mandi_khata_roznamcha_entries_v1',
  ROZNAMCHA_SETTINGS: 'mandi_khata_roznamcha_settings_v1',
  // Additive v4 Quick Notes key
  QUICK_NOTES: 'mandi_khata_quick_notes_v1',
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
  shopMapLink: '',
  shopLat: null,
  shopLng: null,
  showMapLinkOnReceipt: false,

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

export const DEFAULT_AUTO_BACKUP: AutoBackupSettings = {
  frequency: 'daily',
  googleDriveEnabled: true,
  lastBackupAt: null,
  lastBackupSizeBytes: 0,
  lastDriveBackupAt: null,
  lastDriveFileName: null,
  lastDriveFileId: null,
  pendingDriveUpload: false,
};

export const DEFAULT_ROZNAMCHA_SETTINGS: RoznamchaSettings = {
  openingBalance: 0,
  inCategories: [
    'فصل/منجی وصولی',
    'پارٹی سے وصولی',
    'کمیشن وصولی',
    'قرض لیا',
    'ذاتی جمع',
    'دیگر آمد',
  ],
  outCategories: [
    'منجی/فصل خریدی',
    'پلے داری/مزدوری',
    'تیل/ڈیزل',
    'گاڑی کرایہ/لوڈنگ',
    'چائے/کھانا',
    'دکان خرچ',
    'بیعانہ دیا',
    'پارٹی کو ادائیگی',
    'دیگر خرچ',
  ],
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

export function loadPartyMeta(): Record<string, PartyMeta> {
  const data = safeGet<Record<string, PartyMeta>>(STORAGE_KEYS.PARTY_META, {});
  return data && typeof data === 'object' ? data : {};
}

export function savePartyMeta(meta: Record<string, PartyMeta>): void {
  safeSet(STORAGE_KEYS.PARTY_META, meta);
}

export function loadAutoBackupSettings(): AutoBackupSettings {
  const stored = safeGet<Partial<AutoBackupSettings>>(STORAGE_KEYS.AUTO_BACKUP, {});
  return { ...DEFAULT_AUTO_BACKUP, ...stored };
}

export function saveAutoBackupSettings(cfg: AutoBackupSettings): void {
  safeSet(STORAGE_KEYS.AUTO_BACKUP, cfg);
}

export function loadLocalSnapshots(): LocalSnapshot[] {
  const list = safeGet<LocalSnapshot[]>(STORAGE_KEYS.LOCAL_SNAPSHOTS, []);
  return Array.isArray(list) ? list : [];
}

export function saveLocalSnapshots(list: LocalSnapshot[]): void {
  safeSet(STORAGE_KEYS.LOCAL_SNAPSHOTS, list.slice(0, 3));
}

export function pushLocalSnapshot(payload: BackupPayload): {
  snapshots: LocalSnapshot[];
  latest: LocalSnapshot;
} {
  const existing = loadLocalSnapshots();
  const serialized = JSON.stringify(payload);
  const sizeBytes = new Blob([serialized]).size;
  const latest: LocalSnapshot = {
    id: `snap_${Date.now()}`,
    createdAt: new Date().toISOString(),
    sizeBytes,
    payload,
  };
  const next = [latest, ...existing].slice(0, 3);
  saveLocalSnapshots(next);
  return { snapshots: next, latest };
}

export function loadDismissedAdIds(): string[] {
  const list = safeGet<string[]>(STORAGE_KEYS.DISMISSED_ADS, []);
  return Array.isArray(list) ? list : [];
}

export function saveDismissedAdIds(ids: string[]): void {
  safeSet(STORAGE_KEYS.DISMISSED_ADS, ids);
}

export function loadRoznamchaEntries(): RoznamchaEntry[] {
  const list = safeGet<RoznamchaEntry[]>(STORAGE_KEYS.ROZNAMCHA_ENTRIES, []);
  return Array.isArray(list) ? list : [];
}

export function saveRoznamchaEntries(entries: RoznamchaEntry[]): void {
  safeSet(STORAGE_KEYS.ROZNAMCHA_ENTRIES, entries);
}

export function loadRoznamchaSettings(): RoznamchaSettings {
  const stored = safeGet<Partial<RoznamchaSettings>>(STORAGE_KEYS.ROZNAMCHA_SETTINGS, {});
  return {
    openingBalance:
      typeof stored.openingBalance === 'number' && Number.isFinite(stored.openingBalance)
        ? stored.openingBalance
        : 0,
    inCategories:
      Array.isArray(stored.inCategories) && stored.inCategories.length > 0
        ? stored.inCategories
        : DEFAULT_ROZNAMCHA_SETTINGS.inCategories,
    outCategories:
      Array.isArray(stored.outCategories) && stored.outCategories.length > 0
        ? stored.outCategories
        : DEFAULT_ROZNAMCHA_SETTINGS.outCategories,
  };
}

export function saveRoznamchaSettings(settings: RoznamchaSettings): void {
  safeSet(STORAGE_KEYS.ROZNAMCHA_SETTINGS, settings);
}

export function loadQuickNotes(): QuickNote[] {
  const list = safeGet<QuickNote[]>(STORAGE_KEYS.QUICK_NOTES, []);
  return Array.isArray(list) ? list : [];
}

export function saveQuickNotes(notes: QuickNote[]): void {
  safeSet(STORAGE_KEYS.QUICK_NOTES, notes);
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

export function isAutoBackupDue(
  autoBackup: AutoBackupSettings,
  nowMs: number = Date.now()
): boolean {
  if (autoBackup.frequency === 'never') return false;
  if (autoBackup.pendingDriveUpload) return true;
  if (!autoBackup.lastBackupAt) return true;
  const lastMs = Date.parse(autoBackup.lastBackupAt);
  if (!Number.isFinite(lastMs)) return true;

  const elapsedHours = (nowMs - lastMs) / (1000 * 60 * 60);
  if (autoBackup.frequency === 'daily') return elapsedHours >= 24;
  if (autoBackup.frequency === 'weekly') return elapsedHours >= 24 * 7;
  if (autoBackup.frequency === 'monthly') return elapsedHours >= 24 * 30;
  return false;
}

export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';
  if (bytes < 1024) return `${Math.round(bytes)} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function createBackupPayload(params: {
  sales: SaleRecord[];
  purchases: PurchaseRecord[];
  ledger: PartyPayment[];
  partyMeta?: Record<string, PartyMeta>;
  roznamchaEntries?: RoznamchaEntry[];
  roznamchaSettings?: RoznamchaSettings;
  quickNotes?: QuickNote[];
  counters: RefCounters;
  settings: AppSettings;
  theme: ThemeMode;
  language: AppLanguage;
  logo: string | null;
  signature: string | null;
}): BackupPayload {
  return {
    version: 3,
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
    partyMeta:
      obj.partyMeta && typeof obj.partyMeta === 'object'
        ? (obj.partyMeta as Record<string, PartyMeta>)
        : {},
    roznamchaEntries: Array.isArray(obj.roznamchaEntries)
      ? (obj.roznamchaEntries as RoznamchaEntry[])
      : [],
    roznamchaSettings:
      obj.roznamchaSettings && typeof obj.roznamchaSettings === 'object'
        ? {
            ...DEFAULT_ROZNAMCHA_SETTINGS,
            ...(obj.roznamchaSettings as Partial<RoznamchaSettings>),
          }
        : undefined,
    quickNotes: Array.isArray(obj.quickNotes) ? (obj.quickNotes as QuickNote[]) : [],
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
    partyMeta?: Record<string, PartyMeta>;
    roznamchaEntries?: RoznamchaEntry[];
    quickNotes?: QuickNote[];
    counters: RefCounters;
  },
  incoming: BackupPayload
): {
  sales: SaleRecord[];
  purchases: PurchaseRecord[];
  ledger: PartyPayment[];
  partyMeta: Record<string, PartyMeta>;
  roznamchaEntries: RoznamchaEntry[];
  quickNotes: QuickNote[];
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
    partyMeta: {
      ...(incoming.partyMeta || {}),
      ...(current.partyMeta || {}),
    },
    roznamchaEntries: mergeById(
      current.roznamchaEntries || [],
      incoming.roznamchaEntries || []
    ),
    quickNotes: mergeById(current.quickNotes || [], incoming.quickNotes || []),
    counters: {
      salesNext: Math.max(current.counters.salesNext, incoming.counters.salesNext || 1),
      purchaseNext: Math.max(current.counters.purchaseNext, incoming.counters.purchaseNext || 1),
    },
  };
}

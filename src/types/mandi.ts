export type AppLanguage = 'ur' | 'en';
export type ThemeMode = 'light' | 'dark';
export type CommissionMode = 'sales' | 'purchase' | 'both' | 'off';

export interface OwnerInfo {
  name: string;
  phone: string;
}

export interface CropItem {
  id: string;
  nameUr: string;
  nameEn: string;
  varieties: string[];
}

export interface AppSettings {
  // Shop Identity
  shopNameUr: string;
  shopNameEn: string;
  tagline: string;
  owners: OwnerInfo[];
  address: string;
  city: string;
  shopMapLink?: string;
  shopLat?: number | null;
  shopLng?: number | null;
  showMapLinkOnReceipt?: boolean;

  // Calculation Settings
  commissionPercent: number;
  commissionMode: CommissionMode;
  maundKg: number;
  bardanaPerBag: number;
  bardanaEnabledSales: boolean;
  bardanaEnabledPurchase: boolean;
  chungiEnabledPurchase: boolean;
  chungiDivisor: number;
  marginEnabledSales: boolean;
  defaultMarginCut: number;
  kandaEnabledSales: boolean;
  kandaEnabledPurchase: boolean;
  taxLabourLabelUr: string;
  taxLabourLabelEn: string;
  roundAmounts: boolean;
  maundTwoDecimals: boolean;

  // Business / Receipt Settings
  crops: CropItem[];
  receiptHeaderLine: string;
  receiptFooterAddress: string;
  showOwnerPhonesOnReceipt: boolean;
  showSignatureOnReceipt: boolean;
  salesPrefix: string;
  salesStartNumber: number;
  purchasePrefix: string;
  purchaseStartNumber: number;
}

export interface TradeCalculationInput {
  totalWeight: number;
  bags: number;
  marginCut?: number;
  kandaCut: number;
  ratePerMaund: number;
  advance: number;
  taxLabour: number;
}

export interface TradeCalculationResult {
  bardanaKg: number;
  chungiKg: number;
  marginCutKg: number;
  kandaCutKg: number;
  netWeightKg: number;
  maundExact: number;
  maundDisplay: number;
  grossAmount: number;
  commissionApplied: boolean;
  commissionPercentUsed: number;
  commissionAmount: number;
  advance: number;
  taxLabour: number;
  totalMizan: number;
  isValid: boolean;
  errorKey?: 'negativeNetWeight' | 'invalidTotalWeight';
}

export interface BaseTradeRecord {
  id: string;
  refNo: string;
  date: string; // YYYY-MM-DD
  partyName: string;
  cropId: string;
  cropNameUr: string;
  cropNameEn: string;
  variety: string;
  totalWeight: number;
  bags: number;
  kandaCut: number;
  ratePerMaund: number;
  advance: number;
  taxLabour: number;
  notes: string;
  // Snapshot of calculated values and settings used at save time
  bardanaPerBagUsed: number;
  maundKgUsed: number;
  bardanaKg: number;
  netWeightKg: number;
  maund: number;
  grossAmount: number;
  commissionApplied: boolean;
  commissionPercentUsed: number;
  commissionAmount: number;
  totalMizan: number;
  createdAt: string;
  updatedAt: string;
}

export interface SaleRecord extends BaseTradeRecord {
  type: 'sale';
  marginCut: number;
}

export interface PurchaseRecord extends BaseTradeRecord {
  type: 'purchase';
  chungiKg: number;
  chungiDivisorUsed: number;
}

export type TradeRecord = SaleRecord | PurchaseRecord;

export type LedgerEntryDirection = 'jama' | 'banam'; // jama = received/credit, banam = paid/debit
export type PaymentMethod = 'Cash' | 'Bank' | 'JazzCash' | 'EasyPaisa';

export interface PartyPayment {
  id: string;
  date: string; // YYYY-MM-DD
  partyName: string;
  direction: LedgerEntryDirection;
  amount: number;
  method?: PaymentMethod;
  note: string;
  createdAt: string;
  updatedAt?: string;
}

export interface PartyMeta {
  partyName: string;
  phone: string;
  wadaDate: string; // YYYY-MM-DD
  notes?: string;
  updatedAt: string;
}

export type PartyBalanceStatus = 'CLEAR' | 'PARTIAL' | 'PENDING' | 'OVERDUE';

export interface RefCounters {
  salesNext: number;
  purchaseNext: number;
}

export type AutoBackupFrequency = 'daily' | 'weekly' | 'monthly' | 'never';

export interface AutoBackupSettings {
  frequency: AutoBackupFrequency;
  googleDriveEnabled: boolean;
  lastBackupAt: string | null;
  lastBackupSizeBytes: number;
  lastDriveBackupAt: string | null;
  lastDriveFileName: string | null;
  lastDriveFileId: string | null;
  pendingDriveUpload: boolean;
}

export type RoznamchaSide = 'in' | 'out';

export interface RoznamchaEntry {
  id: string;
  date: string; // YYYY-MM-DD
  side: RoznamchaSide; // 'in' = JAMA / AAMAD (آئے), 'out' = NAAM / KHARCH (گئے)
  amount: number;
  tafseel: string;
  category: string;
  partyName?: string;
  method: PaymentMethod;
  note?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface RoznamchaSettings {
  openingBalance: number;
  inCategories: string[];
  outCategories: string[];
}

export type QuickNoteTag = 'reminder' | 'task' | 'rate';

export interface QuickNote {
  id: string;
  text: string;
  tag: QuickNoteTag;
  done: boolean;
  pinned: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BackupPayload {
  version: number;
  exportedAt: string;
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
}

export interface LocalSnapshot {
  id: string;
  createdAt: string;
  sizeBytes: number;
  payload: BackupPayload;
}

export interface AdBanner {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
  buttonText: string;
  buttonLink: string;
  active: boolean;
  placement: 'dashboard_top';
  startDate: string;
  endDate: string;
  authorUid?: string;
}

export interface GlobalAppConfig {
  tutorialYoutubeUrl: string;
  aiEnabled: boolean;
  aiDailySummaryEnabled: boolean;
  aiDraftEntryEnabled: boolean;
  aiChatEnabled: boolean;
}

export interface AuthUserSummary {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  emailVerified: boolean;
}

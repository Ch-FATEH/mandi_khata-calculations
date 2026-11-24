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

export interface PartyPayment {
  id: string;
  date: string; // YYYY-MM-DD
  partyName: string;
  direction: LedgerEntryDirection;
  amount: number;
  note: string;
  createdAt: string;
}

export interface RefCounters {
  salesNext: number;
  purchaseNext: number;
}

export interface BackupPayload {
  version: number;
  exportedAt: string;
  sales: SaleRecord[];
  purchases: PurchaseRecord[];
  ledger: PartyPayment[];
  counters: RefCounters;
  settings: AppSettings;
  theme: ThemeMode;
  language: AppLanguage;
  logo: string | null;
  signature: string | null;
}

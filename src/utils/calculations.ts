import {
  AppSettings,
  PartyPayment,
  PurchaseRecord,
  SaleRecord,
  TradeCalculationInput,
  TradeCalculationResult,
} from '../types/mandi';

export function roundTo2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function roundAmount(value: number, roundWhole: boolean): number {
  if (roundWhole) {
    return Math.round(value);
  }
  return roundTo2(value);
}

export function calculateSale(
  input: TradeCalculationInput,
  settings: AppSettings
): TradeCalculationResult {
  const totalWeight = Number.isFinite(input.totalWeight) ? Math.max(0, input.totalWeight) : 0;
  const bags = Number.isFinite(input.bags) ? Math.max(0, input.bags) : 0;
  const marginCutKg = settings.marginEnabledSales
    ? Number.isFinite(input.marginCut ?? 0)
      ? Math.max(0, input.marginCut ?? 0)
      : 0
    : 0;
  const kandaCutKg = settings.kandaEnabledSales
    ? Number.isFinite(input.kandaCut)
      ? Math.max(0, input.kandaCut)
      : 0
    : 0;
  const rate = Number.isFinite(input.ratePerMaund) ? Math.max(0, input.ratePerMaund) : 0;
  const advance = Number.isFinite(input.advance) ? Math.max(0, input.advance) : 0;
  const taxLabour = Number.isFinite(input.taxLabour) ? Math.max(0, input.taxLabour) : 0;

  const maundKg = settings.maundKg > 0 ? settings.maundKg : 40;
  const bardanaPerBag = settings.bardanaEnabledSales ? Math.max(0, settings.bardanaPerBag) : 0;
  const bardanaKg = roundTo2(bags * bardanaPerBag);

  // Sales NEVER applies chungi
  const chungiKg = 0;
  const netWeightKg = roundTo2(totalWeight - marginCutKg - bardanaKg - kandaCutKg);

  if (totalWeight <= 0) {
    return {
      bardanaKg,
      chungiKg,
      marginCutKg,
      kandaCutKg,
      netWeightKg,
      maundExact: 0,
      maundDisplay: 0,
      grossAmount: 0,
      commissionApplied: false,
      commissionPercentUsed: 0,
      commissionAmount: 0,
      advance,
      taxLabour,
      totalMizan: 0,
      isValid: false,
      errorKey: 'invalidTotalWeight',
    };
  }

  if (netWeightKg < 0) {
    return {
      bardanaKg,
      chungiKg,
      marginCutKg,
      kandaCutKg,
      netWeightKg,
      maundExact: 0,
      maundDisplay: 0,
      grossAmount: 0,
      commissionApplied: false,
      commissionPercentUsed: 0,
      commissionAmount: 0,
      advance,
      taxLabour,
      totalMizan: 0,
      isValid: false,
      errorKey: 'negativeNetWeight',
    };
  }

  const maundExact = netWeightKg / maundKg;
  const maundDisplay = settings.maundTwoDecimals ? roundTo2(maundExact) : Math.round(maundExact * 10000) / 10000;
  const grossAmount = roundAmount(maundExact * rate, settings.roundAmounts);

  const commissionApplied =
    settings.commissionPercent > 0 &&
    (settings.commissionMode === 'sales' || settings.commissionMode === 'both');
  const commissionPercentUsed = commissionApplied ? settings.commissionPercent : 0;
  const commissionAmount = commissionApplied
    ? roundAmount(grossAmount * (commissionPercentUsed / 100), settings.roundAmounts)
    : 0;

  const totalMizan = roundAmount(
    grossAmount - commissionAmount - advance - taxLabour,
    settings.roundAmounts
  );

  return {
    bardanaKg,
    chungiKg,
    marginCutKg,
    kandaCutKg,
    netWeightKg,
    maundExact,
    maundDisplay,
    grossAmount,
    commissionApplied,
    commissionPercentUsed,
    commissionAmount,
    advance,
    taxLabour,
    totalMizan,
    isValid: true,
  };
}

export function calculatePurchase(
  input: TradeCalculationInput,
  settings: AppSettings
): TradeCalculationResult {
  const totalWeight = Number.isFinite(input.totalWeight) ? Math.max(0, input.totalWeight) : 0;
  const bags = Number.isFinite(input.bags) ? Math.max(0, input.bags) : 0;
  // Purchase NEVER applies margin cut
  const marginCutKg = 0;
  const kandaCutKg = settings.kandaEnabledPurchase
    ? Number.isFinite(input.kandaCut)
      ? Math.max(0, input.kandaCut)
      : 0
    : 0;
  const rate = Number.isFinite(input.ratePerMaund) ? Math.max(0, input.ratePerMaund) : 0;
  const advance = Number.isFinite(input.advance) ? Math.max(0, input.advance) : 0;
  const taxLabour = Number.isFinite(input.taxLabour) ? Math.max(0, input.taxLabour) : 0;

  const maundKg = settings.maundKg > 0 ? settings.maundKg : 40;
  const bardanaPerBag = settings.bardanaEnabledPurchase ? Math.max(0, settings.bardanaPerBag) : 0;
  const bardanaKg = roundTo2(bags * bardanaPerBag);

  const chungiDivisor = settings.chungiDivisor > 0 ? settings.chungiDivisor : 2;
  const weightAfterBardanaAndKanda = totalWeight - bardanaKg - kandaCutKg;
  const chungiKg =
    settings.chungiEnabledPurchase && weightAfterBardanaAndKanda > 0
      ? Math.round(weightAfterBardanaAndKanda / maundKg / chungiDivisor)
      : 0;

  const netWeightKg = roundTo2(totalWeight - bardanaKg - kandaCutKg - chungiKg);

  if (totalWeight <= 0) {
    return {
      bardanaKg,
      chungiKg,
      marginCutKg,
      kandaCutKg,
      netWeightKg,
      maundExact: 0,
      maundDisplay: 0,
      grossAmount: 0,
      commissionApplied: false,
      commissionPercentUsed: 0,
      commissionAmount: 0,
      advance,
      taxLabour,
      totalMizan: 0,
      isValid: false,
      errorKey: 'invalidTotalWeight',
    };
  }

  if (netWeightKg < 0) {
    return {
      bardanaKg,
      chungiKg,
      marginCutKg,
      kandaCutKg,
      netWeightKg,
      maundExact: 0,
      maundDisplay: 0,
      grossAmount: 0,
      commissionApplied: false,
      commissionPercentUsed: 0,
      commissionAmount: 0,
      advance,
      taxLabour,
      totalMizan: 0,
      isValid: false,
      errorKey: 'negativeNetWeight',
    };
  }

  const maundExact = netWeightKg / maundKg;
  const maundDisplay = settings.maundTwoDecimals ? roundTo2(maundExact) : Math.round(maundExact * 10000) / 10000;
  const grossAmount = roundAmount(maundExact * rate, settings.roundAmounts);

  const commissionApplied =
    settings.commissionPercent > 0 &&
    (settings.commissionMode === 'purchase' || settings.commissionMode === 'both');
  const commissionPercentUsed = commissionApplied ? settings.commissionPercent : 0;
  const commissionAmount = commissionApplied
    ? roundAmount(grossAmount * (commissionPercentUsed / 100), settings.roundAmounts)
    : 0;

  const totalMizan = roundAmount(
    grossAmount - commissionAmount - advance - taxLabour,
    settings.roundAmounts
  );

  return {
    bardanaKg,
    chungiKg,
    marginCutKg,
    kandaCutKg,
    netWeightKg,
    maundExact,
    maundDisplay,
    grossAmount,
    commissionApplied,
    commissionPercentUsed,
    commissionAmount,
    advance,
    taxLabour,
    totalMizan,
    isValid: true,
  };
}

export interface DashboardSummary {
  todaySalesAmount: number;
  todayPurchaseAmount: number;
  todayCommissionAmount: number;
  todaySalesWeightKg: number;
  todayPurchaseWeightKg: number;
  todayTransactionCount: number;
  totalRecordsCount: number;
}

export function calculateDashboardSummary(
  sales: SaleRecord[],
  purchases: PurchaseRecord[],
  todayDate: string
): DashboardSummary {
  const todaySales = sales.filter((s) => s.date === todayDate);
  const todayPurchases = purchases.filter((p) => p.date === todayDate);

  const todaySalesAmount = todaySales.reduce((acc, s) => acc + s.totalMizan, 0);
  const todayPurchaseAmount = todayPurchases.reduce((acc, p) => acc + p.totalMizan, 0);
  const todayCommissionAmount =
    todaySales.reduce((acc, s) => acc + s.commissionAmount, 0) +
    todayPurchases.reduce((acc, p) => acc + p.commissionAmount, 0);

  const todaySalesWeightKg = roundTo2(todaySales.reduce((acc, s) => acc + s.netWeightKg, 0));
  const todayPurchaseWeightKg = roundTo2(
    todayPurchases.reduce((acc, p) => acc + p.netWeightKg, 0)
  );

  return {
    todaySalesAmount,
    todayPurchaseAmount,
    todayCommissionAmount,
    todaySalesWeightKg,
    todayPurchaseWeightKg,
    todayTransactionCount: todaySales.length + todayPurchases.length,
    totalRecordsCount: sales.length + purchases.length,
  };
}

export interface PartyLedgerLine {
  id: string;
  date: string;
  kind: 'sale' | 'purchase' | 'jama' | 'banam';
  refNo?: string;
  description: string;
  debit: number; // بنام / Receivable from buyer or paid out
  credit: number; // جمع / Payable to farmer or cash received
  runningBalance: number;
  createdAt: string;
}

export interface PartySummary {
  partyName: string;
  totalSales: number;
  totalPurchases: number;
  totalBusiness: number;
  totalJama: number;
  totalBanam: number;
  netBalance: number; // positive => party owes shop (وصولی), negative => shop owes party (ادائیگی)
  transactionCount: number;
  lastDate: string;
}

export function normalizePartyName(name: string): string {
  return name.trim().replace(/\s+/g, ' ');
}

export function buildPartySummaries(
  sales: SaleRecord[],
  purchases: PurchaseRecord[],
  payments: PartyPayment[]
): PartySummary[] {
  const map = new Map<string, PartySummary>();

  const ensure = (rawName: string): PartySummary => {
    const clean = normalizePartyName(rawName);
    const key = clean.toLowerCase();
    let existing = map.get(key);
    if (!existing) {
      existing = {
        partyName: clean,
        totalSales: 0,
        totalPurchases: 0,
        totalBusiness: 0,
        totalJama: 0,
        totalBanam: 0,
        netBalance: 0,
        transactionCount: 0,
        lastDate: '',
      };
      map.set(key, existing);
    }
    return existing;
  };

  for (const s of sales) {
    if (!s.partyName.trim()) continue;
    const item = ensure(s.partyName);
    item.totalSales += s.totalMizan;
    item.totalBusiness += s.totalMizan;
    // Sale to buyer/mill: buyer owes totalMizan (debit/banam), advance already deducted in totalMizan
    item.netBalance += s.totalMizan;
    item.transactionCount += 1;
    if (s.date > item.lastDate) item.lastDate = s.date;
  }

  for (const p of purchases) {
    if (!p.partyName.trim()) continue;
    const item = ensure(p.partyName);
    item.totalPurchases += p.totalMizan;
    item.totalBusiness += p.totalMizan;
    // Purchase from farmer/seller: shop owes seller totalMizan (credit/jama)
    item.netBalance -= p.totalMizan;
    item.transactionCount += 1;
    if (p.date > item.lastDate) item.lastDate = p.date;
  }

  for (const pay of payments) {
    if (!pay.partyName.trim()) continue;
    const item = ensure(pay.partyName);
    if (pay.direction === 'jama') {
      // Cash received from party -> reduces what party owes shop (or increases credit)
      item.totalJama += pay.amount;
      item.netBalance -= pay.amount;
    } else {
      // Cash paid to party -> increases what party owes / settles what shop owed
      item.totalBanam += pay.amount;
      item.netBalance += pay.amount;
    }
    item.transactionCount += 1;
    if (pay.date > item.lastDate) item.lastDate = pay.date;
  }

  return Array.from(map.values()).sort((a, b) => b.lastDate.localeCompare(a.lastDate));
}

export function buildPartyLedgerLines(
  partyName: string,
  sales: SaleRecord[],
  purchases: PurchaseRecord[],
  payments: PartyPayment[],
  language: 'ur' | 'en' = 'ur'
): PartyLedgerLine[] {
  const targetKey = normalizePartyName(partyName).toLowerCase();
  const lines: Omit<PartyLedgerLine, 'runningBalance'>[] = [];
  const maundUnit = language === 'ur' ? 'من' : 'Maund';
  const jamaDefault = language === 'ur' ? 'وصولی (جمع)' : 'Jama (Received)';
  const banamDefault = language === 'ur' ? 'ادائیگی (بنام)' : 'Banam (Paid)';

  for (const s of sales) {
    if (normalizePartyName(s.partyName).toLowerCase() !== targetKey) continue;
    const cropLabel =
      language === 'ur' ? s.cropNameUr || s.cropNameEn : s.cropNameEn || s.cropNameUr;
    lines.push({
      id: s.id,
      date: s.date,
      kind: 'sale',
      refNo: s.refNo,
      description: `${cropLabel}${s.variety ? ` (${s.variety})` : ''} — ${formatNumber(s.maund)} ${maundUnit}`,
      debit: s.totalMizan,
      credit: 0,
      createdAt: s.createdAt,
    });
  }

  for (const p of purchases) {
    if (normalizePartyName(p.partyName).toLowerCase() !== targetKey) continue;
    const cropLabel =
      language === 'ur' ? p.cropNameUr || p.cropNameEn : p.cropNameEn || p.cropNameUr;
    lines.push({
      id: p.id,
      date: p.date,
      kind: 'purchase',
      refNo: p.refNo,
      description: `${cropLabel}${p.variety ? ` (${p.variety})` : ''} — ${formatNumber(p.maund)} ${maundUnit}`,
      debit: 0,
      credit: p.totalMizan,
      createdAt: p.createdAt,
    });
  }

  for (const pay of payments) {
    if (normalizePartyName(pay.partyName).toLowerCase() !== targetKey) continue;
    lines.push({
      id: pay.id,
      date: pay.date,
      kind: pay.direction,
      description: pay.note || (pay.direction === 'jama' ? jamaDefault : banamDefault),
      debit: pay.direction === 'banam' ? pay.amount : 0,
      credit: pay.direction === 'jama' ? pay.amount : 0,
      createdAt: pay.createdAt,
    });
  }

  lines.sort((a, b) => {
    const d = a.date.localeCompare(b.date);
    if (d !== 0) return d;
    return a.createdAt.localeCompare(b.createdAt);
  });

  let running = 0;
  return lines.map((line) => {
    running = roundAmount(running + line.debit - line.credit, true);
    return {
      ...line,
      runningBalance: running,
    };
  });
}

export function formatRefNumber(prefix: string, num: number): string {
  const cleanPrefix = (prefix || 'R').trim().toUpperCase();
  const padded = String(Math.max(1, num)).padStart(3, '0');
  return `${cleanPrefix}-${padded}`;
}

export function formatNumber(value: number, maxDecimals = 2): string {
  if (!Number.isFinite(value)) return '0';
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: maxDecimals,
  }).format(value);
}

export function formatRs(value: number): string {
  if (!Number.isFinite(value)) return 'Rs 0';
  const abs = Math.abs(Math.round(value));
  const formatted = new Intl.NumberFormat('en-US').format(abs);
  return value < 0 ? `-Rs ${formatted}` : `Rs ${formatted}`;
}

export function getTodayISO(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

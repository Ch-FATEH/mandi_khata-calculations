import {
  AppSettings,
  PartyBalanceStatus,
  PartyMeta,
  PartyPayment,
  PurchaseRecord,
  RoznamchaEntry,
  RoznamchaSettings,
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
  method?: string;
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
  kulRaqam: number; // total billed amount on active side
  wasoolPaid: number; // total received / paid towards settlement
  baqiAmount: number; // absolute remaining balance
  status: PartyBalanceStatus;
  phone: string;
  wadaDate: string;
  transactionCount: number;
  lastDate: string;
}

export function normalizePartyName(name: string): string {
  return name.trim().replace(/\s+/g, ' ');
}

export function computePartyStatus(params: {
  kulRaqam: number;
  wasoolPaid: number;
  baqiAmount: number;
  wadaDate?: string;
  todayDate?: string;
}): PartyBalanceStatus {
  const { baqiAmount, wasoolPaid, wadaDate, todayDate } = params;
  if (baqiAmount <= 0) {
    return 'CLEAR';
  }
  const today = todayDate || getTodayISO();
  if (wadaDate && wadaDate.trim() && wadaDate < today) {
    return 'OVERDUE';
  }
  if (wasoolPaid > 0) {
    return 'PARTIAL';
  }
  return 'PENDING';
}

export function buildPartySummaries(
  sales: SaleRecord[],
  purchases: PurchaseRecord[],
  payments: PartyPayment[],
  partyMetaMap?: Record<string, PartyMeta>,
  todayDate?: string
): PartySummary[] {
  const map = new Map<string, PartySummary>();
  const today = todayDate || getTodayISO();

  const ensure = (rawName: string): PartySummary => {
    const clean = normalizePartyName(rawName);
    const key = clean.toLowerCase();
    let existing = map.get(key);
    if (!existing) {
      const meta = partyMetaMap?.[key];
      existing = {
        partyName: clean,
        totalSales: 0,
        totalPurchases: 0,
        totalBusiness: 0,
        totalJama: 0,
        totalBanam: 0,
        netBalance: 0,
        kulRaqam: 0,
        wasoolPaid: 0,
        baqiAmount: 0,
        status: 'CLEAR',
        phone: meta?.phone || '',
        wadaDate: meta?.wadaDate || '',
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
    item.netBalance += s.totalMizan;
    item.transactionCount += 1;
    if (s.date > item.lastDate) item.lastDate = s.date;
  }

  for (const p of purchases) {
    if (!p.partyName.trim()) continue;
    const item = ensure(p.partyName);
    item.totalPurchases += p.totalMizan;
    item.totalBusiness += p.totalMizan;
    item.netBalance -= p.totalMizan;
    item.transactionCount += 1;
    if (p.date > item.lastDate) item.lastDate = p.date;
  }

  for (const pay of payments) {
    if (!pay.partyName.trim()) continue;
    const item = ensure(pay.partyName);
    if (pay.direction === 'jama') {
      item.totalJama += pay.amount;
      item.netBalance -= pay.amount;
    } else {
      item.totalBanam += pay.amount;
      item.netBalance += pay.amount;
    }
    item.transactionCount += 1;
    if (pay.date > item.lastDate) item.lastDate = pay.date;
  }

  if (partyMetaMap) {
    for (const [key, meta] of Object.entries(partyMetaMap)) {
      if (!map.has(key) && meta.partyName?.trim()) {
        ensure(meta.partyName);
      }
    }
  }

  for (const item of map.values()) {
    item.baqiAmount = Math.abs(Math.round(item.netBalance));
    if (item.totalSales >= item.totalPurchases) {
      // Primarily a buyer (receivable)
      item.kulRaqam = Math.max(item.totalSales, item.totalJama);
      item.wasoolPaid = Math.min(
        item.kulRaqam,
        Math.max(0, item.kulRaqam - item.baqiAmount)
      );
      if (item.totalSales > 0 && item.totalPurchases === 0 && item.totalBanam === 0) {
        item.kulRaqam = item.totalSales;
        item.wasoolPaid = item.totalJama;
      }
    } else {
      // Primarily a seller / farmer (payable)
      item.kulRaqam = Math.max(item.totalPurchases, item.totalBanam);
      item.wasoolPaid = Math.min(
        item.kulRaqam,
        Math.max(0, item.kulRaqam - item.baqiAmount)
      );
      if (item.totalPurchases > 0 && item.totalSales === 0 && item.totalJama === 0) {
        item.kulRaqam = item.totalPurchases;
        item.wasoolPaid = item.totalBanam;
      }
    }
    item.status = computePartyStatus({
      kulRaqam: item.kulRaqam,
      wasoolPaid: item.wasoolPaid,
      baqiAmount: item.baqiAmount,
      wadaDate: item.wadaDate,
      todayDate: today,
    });
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
    const methodLabel = pay.method || 'Cash';
    lines.push({
      id: pay.id,
      date: pay.date,
      kind: pay.direction,
      method: methodLabel,
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

export function formatWhatsappPhone(rawPhone: string): string {
  const digits = rawPhone.replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('00')) return digits.slice(2);
  if (digits.startsWith('0') && digits.length >= 10) {
    return `92${digits.slice(1)}`;
  }
  return digits;
}

export function buildWhatsappReminderUrl(params: {
  phone: string;
  partyName: string;
  baqiAmount: number;
  netBalance: number;
  wadaDate?: string;
  shopName?: string;
}): string | null {
  const intlPhone = formatWhatsappPhone(params.phone);
  if (!intlPhone) return null;

  const shop = params.shopName?.trim() ? ` (${params.shopName.trim()})` : '';
  const directionText =
    params.netBalance >= 0
      ? `آپ کے ذمہ بقایا رقم ${formatRs(params.baqiAmount)} واجب الادا ہے`
      : `آپ کا بقایا حساب ${formatRs(params.baqiAmount)} ہمارے ذمہ ہے`;
  const wadaLine = params.wadaDate
    ? `\nوعدہ تاریخ: ${params.wadaDate}`
    : '';
  const msg = `السلام علیکم ${params.partyName} صاحب،\nمنڈی کھاتہ${shop} کی یاد دہانی:\n${directionText}۔${wadaLine}\nشکریہ۔`;

  return `https://wa.me/${intlPhone}?text=${encodeURIComponent(msg)}`;
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

export interface RoznamchaDaySummary {
  date: string;
  pichlaBaqi: number;
  aajKulAaye: number;
  aajKulGaye: number;
  aajKaBaqi: number;
  kulBaqi: number;
  inEntries: RoznamchaEntry[];
  outEntries: RoznamchaEntry[];
  chronologicalWithRunning: Array<RoznamchaEntry & { runningBalance: number }>;
}

export function calculateRoznamchaDay(
  entries: RoznamchaEntry[],
  targetDate: string,
  settings: RoznamchaSettings
): RoznamchaDaySummary {
  const baseOpening = Number.isFinite(settings.openingBalance)
    ? Math.round(settings.openingBalance)
    : 0;

  let priorDelta = 0;
  const dayEntries: RoznamchaEntry[] = [];

  for (const e of entries) {
    const amt = Number.isFinite(e.amount) ? Math.round(e.amount) : 0;
    if (e.date < targetDate) {
      priorDelta += e.side === 'in' ? amt : -amt;
    } else if (e.date === targetDate) {
      dayEntries.push(e);
    }
  }

  dayEntries.sort((a, b) => a.createdAt.localeCompare(b.createdAt));

  const pichlaBaqi = baseOpening + priorDelta;
  const inEntries = dayEntries.filter((e) => e.side === 'in');
  const outEntries = dayEntries.filter((e) => e.side === 'out');

  const aajKulAaye = inEntries.reduce((sum, e) => sum + Math.round(e.amount), 0);
  const aajKulGaye = outEntries.reduce((sum, e) => sum + Math.round(e.amount), 0);
  const aajKaBaqi = aajKulAaye - aajKulGaye;
  const kulBaqi = pichlaBaqi + aajKaBaqi;

  let running = pichlaBaqi;
  const chronologicalWithRunning = dayEntries.map((entry) => {
    const amt = Math.round(entry.amount);
    running += entry.side === 'in' ? amt : -amt;
    return { ...entry, runningBalance: running };
  });

  return {
    date: targetDate,
    pichlaBaqi,
    aajKulAaye,
    aajKulGaye,
    aajKaBaqi,
    kulBaqi,
    inEntries,
    outEntries,
    chronologicalWithRunning,
  };
}

export interface RoznamchaMonthDayRow {
  date: string;
  aaye: number;
  gaye: number;
  net: number;
  closingBalance: number;
  count: number;
}

export function calculateRoznamchaMonth(
  entries: RoznamchaEntry[],
  monthPrefix: string, // YYYY-MM
  settings: RoznamchaSettings
): {
  days: RoznamchaMonthDayRow[];
  totalAaye: number;
  totalGaye: number;
  netChange: number;
  openingBalance: number;
  closingBalance: number;
} {
  const baseOpening = Number.isFinite(settings.openingBalance)
    ? Math.round(settings.openingBalance)
    : 0;

  let openingDelta = 0;
  const dayMap = new Map<string, { aaye: number; gaye: number; count: number }>();

  for (const e of entries) {
    const amt = Number.isFinite(e.amount) ? Math.round(e.amount) : 0;
    if (e.date < `${monthPrefix}-01`) {
      openingDelta += e.side === 'in' ? amt : -amt;
    } else if (e.date.startsWith(monthPrefix)) {
      const curr = dayMap.get(e.date) || { aaye: 0, gaye: 0, count: 0 };
      if (e.side === 'in') curr.aaye += amt;
      else curr.gaye += amt;
      curr.count += 1;
      dayMap.set(e.date, curr);
    }
  }

  const openingBalance = baseOpening + openingDelta;
  const sortedDates = Array.from(dayMap.keys()).sort((a, b) => a.localeCompare(b));

  let running = openingBalance;
  let totalAaye = 0;
  let totalGaye = 0;

  const days: RoznamchaMonthDayRow[] = sortedDates.map((d) => {
    const info = dayMap.get(d)!;
    const net = info.aaye - info.gaye;
    running += net;
    totalAaye += info.aaye;
    totalGaye += info.gaye;
    return {
      date: d,
      aaye: info.aaye,
      gaye: info.gaye,
      net,
      closingBalance: running,
      count: info.count,
    };
  });

  return {
    days: days.reverse(), // most recent day first for UX
    totalAaye,
    totalGaye,
    netChange: totalAaye - totalGaye,
    openingBalance,
    closingBalance: openingBalance + totalAaye - totalGaye,
  };
}

export interface RoznamchaCategorySummary {
  category: string;
  inTotal: number;
  outTotal: number;
  count: number;
}

export function buildRoznamchaCategoryReport(
  entries: RoznamchaEntry[],
  fromDate?: string,
  toDate?: string
): RoznamchaCategorySummary[] {
  const map = new Map<string, RoznamchaCategorySummary>();
  for (const e of entries) {
    if (fromDate && e.date < fromDate) continue;
    if (toDate && e.date > toDate) continue;
    const cat = e.category?.trim() || 'دیگر';
    const row = map.get(cat) || { category: cat, inTotal: 0, outTotal: 0, count: 0 };
    const amt = Math.round(e.amount);
    if (e.side === 'in') row.inTotal += amt;
    else row.outTotal += amt;
    row.count += 1;
    map.set(cat, row);
  }
  return Array.from(map.values()).sort(
    (a, b) => b.inTotal + b.outTotal - (a.inTotal + a.outTotal)
  );
}

export function calculateRoznamchaRange(
  entries: RoznamchaEntry[],
  settings: RoznamchaSettings,
  fromDate?: string,
  toDate?: string
): {
  openingBalance: number;
  totalIn: number;
  totalOut: number;
  closingBalance: number;
  rows: Array<RoznamchaEntry & { runningBalance: number }>;
} {
  const baseOpening = Number.isFinite(settings.openingBalance)
    ? Math.round(settings.openingBalance)
    : 0;

  const sorted = [...entries].sort((a, b) => {
    const d = a.date.localeCompare(b.date);
    if (d !== 0) return d;
    return a.createdAt.localeCompare(b.createdAt);
  });

  let running = baseOpening;
  let rangeOpening = baseOpening;
  let rangeStarted = !fromDate;
  let totalIn = 0;
  let totalOut = 0;
  const rows: Array<RoznamchaEntry & { runningBalance: number }> = [];

  for (const e of sorted) {
    const amt = Number.isFinite(e.amount) ? Math.round(e.amount) : 0;
    if (fromDate && e.date < fromDate) {
      running += e.side === 'in' ? amt : -amt;
      rangeOpening = running;
      continue;
    }
    if (!rangeStarted) {
      rangeOpening = running;
      rangeStarted = true;
    }
    if (toDate && e.date > toDate) {
      continue;
    }
    running += e.side === 'in' ? amt : -amt;
    if (e.side === 'in') totalIn += amt;
    else totalOut += amt;
    rows.push({ ...e, runningBalance: running });
  }

  return {
    openingBalance: rangeOpening,
    totalIn,
    totalOut,
    closingBalance: running,
    rows,
  };
}


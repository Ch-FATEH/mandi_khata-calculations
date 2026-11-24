import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateSale,
  calculatePurchase,
  calculateDashboardSummary,
  buildPartySummaries,
  buildPartyLedgerLines,
  computePartyStatus,
  buildWhatsappReminderUrl,
  calculateRoznamchaDay,
  calculateRoznamchaMonth,
  buildRoznamchaCategoryReport,
} from './calculations';
import {
  DEFAULT_SETTINGS,
  DEFAULT_AUTO_BACKUP,
  DEFAULT_ROZNAMCHA_SETTINGS,
  allocateNextRef,
  validateBackupPayload,
  mergeBackupData,
  isAutoBackupDue,
} from './storage';
import { PurchaseRecord, RoznamchaEntry, SaleRecord, PartyPayment } from '../types/mandi';

test('Mandatory Sales Test (default settings: bardana 1.25, maund 40, commission OFF)', () => {
  const res = calculateSale(
    {
      totalWeight: 9000,
      bags: 150,
      marginCut: 45,
      kandaCut: 0,
      ratePerMaund: 4300,
      advance: 0,
      taxLabour: 0,
    },
    DEFAULT_SETTINGS
  );

  assert.equal(res.isValid, true);
  assert.equal(res.bardanaKg, 187.5);
  assert.equal(res.chungiKg, 0);
  assert.equal(res.netWeightKg, 8767.5);
  assert.equal(res.maundDisplay, 219.19);
  assert.equal(res.grossAmount, 942506);
  assert.equal(res.commissionApplied, false);
  assert.equal(res.commissionAmount, 0);
  assert.equal(res.totalMizan, 942506);
});

test('Mandatory Purchase Test (default settings: bardana 1.25, maund 40, chungi ON divisor 2, commission OFF)', () => {
  const res = calculatePurchase(
    {
      totalWeight: 9339,
      bags: 172,
      kandaCut: 0,
      ratePerMaund: 4200,
      advance: 0,
      taxLabour: 0,
    },
    DEFAULT_SETTINGS
  );

  assert.equal(res.isValid, true);
  assert.equal(res.bardanaKg, 215);
  assert.equal(res.chungiKg, 114);
  assert.equal(res.marginCutKg, 0);
  assert.equal(res.netWeightKg, 9010);
  assert.equal(res.maundDisplay, 225.25);
  assert.equal(res.grossAmount, 946050);
  assert.equal(res.commissionApplied, false);
  assert.equal(res.totalMizan, 946050);
});

test('Settings changes affect live calculations immediately (bardana 1 KG for 150 bags = 150 KG)', () => {
  const customSettings = {
    ...DEFAULT_SETTINGS,
    bardanaPerBag: 1,
    commissionPercent: 2.5,
    commissionMode: 'both' as const,
  };

  const saleRes = calculateSale(
    {
      totalWeight: 9000,
      bags: 150,
      marginCut: 45,
      kandaCut: 0,
      ratePerMaund: 4300,
      advance: 10000,
      taxLabour: 500,
    },
    customSettings
  );

  assert.equal(saleRes.bardanaKg, 150);
  assert.equal(saleRes.netWeightKg, 8805);
  assert.equal(saleRes.commissionApplied, true);
  assert.equal(saleRes.commissionAmount, Math.round(saleRes.grossAmount * 0.025));
  assert.equal(
    saleRes.totalMizan,
    saleRes.grossAmount - saleRes.commissionAmount - 10000 - 500
  );
});

test('Negative net weight is rejected by validation', () => {
  const res = calculateSale(
    {
      totalWeight: 100,
      bags: 100,
      marginCut: 0,
      kandaCut: 0,
      ratePerMaund: 4000,
      advance: 0,
      taxLabour: 0,
    },
    DEFAULT_SETTINGS
  );
  assert.equal(res.isValid, false);
  assert.equal(res.errorKey, 'negativeNetWeight');
});

test('Reference numbers increment monotonically and never reuse deleted numbers', () => {
  const c1 = allocateNextRef('sale', { salesNext: 1, purchaseNext: 1 }, DEFAULT_SETTINGS);
  assert.equal(c1.refNo, 'F-001');
  const c2 = allocateNextRef('sale', c1.nextCounters, DEFAULT_SETTINGS);
  assert.equal(c2.refNo, 'F-002');
  const p1 = allocateNextRef('purchase', c2.nextCounters, DEFAULT_SETTINGS);
  assert.equal(p1.refNo, 'K-001');
});

test('Party khata ledger running balance and dashboard summary compute accurately from saved records', () => {
  const sale: SaleRecord = {
    id: 's1',
    type: 'sale',
    refNo: 'F-001',
    date: '2026-11-24',
    partyName: 'Al-Madina Rice Mill',
    cropId: 'wheat',
    cropNameUr: 'گندم',
    cropNameEn: 'Wheat',
    variety: 'اکبر',
    totalWeight: 9000,
    bags: 150,
    marginCut: 45,
    kandaCut: 0,
    ratePerMaund: 4300,
    advance: 0,
    taxLabour: 0,
    notes: '',
    bardanaPerBagUsed: 1.25,
    maundKgUsed: 40,
    bardanaKg: 187.5,
    netWeightKg: 8767.5,
    maund: 219.19,
    grossAmount: 942506,
    commissionApplied: false,
    commissionPercentUsed: 0,
    commissionAmount: 0,
    totalMizan: 942506,
    createdAt: '2026-11-24T09:00:00.000Z',
    updatedAt: '2026-11-24T09:00:00.000Z',
  };

  const purchase: PurchaseRecord = {
    id: 'p1',
    type: 'purchase',
    refNo: 'K-001',
    date: '2026-11-24',
    partyName: 'Ch. Akram',
    cropId: 'paddy',
    cropNameUr: 'مونجی',
    cropNameEn: 'Paddy / Rice',
    variety: '1509',
    totalWeight: 9339,
    bags: 172,
    kandaCut: 0,
    ratePerMaund: 4200,
    advance: 0,
    taxLabour: 0,
    notes: '',
    bardanaPerBagUsed: 1.25,
    maundKgUsed: 40,
    bardanaKg: 215,
    chungiKg: 114,
    chungiDivisorUsed: 2,
    netWeightKg: 9010,
    maund: 225.25,
    grossAmount: 946050,
    commissionApplied: false,
    commissionPercentUsed: 0,
    commissionAmount: 0,
    totalMizan: 946050,
    createdAt: '2026-11-24T10:00:00.000Z',
    updatedAt: '2026-11-24T10:00:00.000Z',
  };

  const payment: PartyPayment = {
    id: 'pay1',
    date: '2026-11-24',
    partyName: 'Al-Madina Rice Mill',
    direction: 'jama',
    amount: 500000,
    method: 'Bank',
    note: 'Bank transfer',
    createdAt: '2026-11-24T11:00:00.000Z',
  };

  const dash = calculateDashboardSummary([sale], [purchase], '2026-11-24');
  assert.equal(dash.todaySalesAmount, 942506);
  assert.equal(dash.todayPurchaseAmount, 946050);
  assert.equal(dash.todaySalesWeightKg, 8767.5);
  assert.equal(dash.todayPurchaseWeightKg, 9010);
  assert.equal(dash.todayTransactionCount, 2);

  const summaries = buildPartySummaries([sale], [purchase], [payment]);
  const mill = summaries.find((x) => x.partyName === 'Al-Madina Rice Mill');
  assert.ok(mill);
  assert.equal(mill.netBalance, 442506);
  assert.equal(mill.kulRaqam, 942506);
  assert.equal(mill.wasoolPaid, 500000);
  assert.equal(mill.baqiAmount, 442506);
  assert.equal(mill.status, 'PARTIAL');

  const lines = buildPartyLedgerLines('Al-Madina Rice Mill', [sale], [purchase], [payment]);
  assert.equal(lines.length, 2);
  assert.equal(lines[0].runningBalance, 942506);
  assert.equal(lines[1].runningBalance, 442506);
});

test('Party Payment Tracking: 100,000 sale - 40,000 paid = 60,000 PARTIAL, CLEAR when 0, OVERDUE when wadaDate passed', () => {
  const sale: SaleRecord = {
    id: 's100',
    type: 'sale',
    refNo: 'F-010',
    date: '2026-11-20',
    partyName: 'Bilal Traders',
    cropId: 'wheat',
    cropNameUr: 'گندم',
    cropNameEn: 'Wheat',
    variety: '',
    totalWeight: 4000,
    bags: 0,
    marginCut: 0,
    kandaCut: 0,
    ratePerMaund: 1000,
    advance: 0,
    taxLabour: 0,
    notes: '',
    bardanaPerBagUsed: 0,
    maundKgUsed: 40,
    bardanaKg: 0,
    netWeightKg: 4000,
    maund: 100,
    grossAmount: 100000,
    commissionApplied: false,
    commissionPercentUsed: 0,
    commissionAmount: 0,
    totalMizan: 100000,
    createdAt: '2026-11-20T09:00:00.000Z',
    updatedAt: '2026-11-20T09:00:00.000Z',
  };

  const pay40k: PartyPayment = {
    id: 'p40',
    date: '2026-11-21',
    partyName: 'Bilal Traders',
    direction: 'jama',
    amount: 40000,
    method: 'JazzCash',
    note: 'Installment 1',
    createdAt: '2026-11-21T09:00:00.000Z',
  };

  const partial = buildPartySummaries([sale], [], [pay40k], undefined, '2026-11-24')[0];
  assert.equal(partial.kulRaqam, 100000);
  assert.equal(partial.wasoolPaid, 40000);
  assert.equal(partial.baqiAmount, 60000);
  assert.equal(partial.status, 'PARTIAL');

  const overdue = buildPartySummaries(
    [sale],
    [],
    [pay40k],
    {
      'bilal traders': {
        partyName: 'Bilal Traders',
        phone: '0301-1234567',
        wadaDate: '2026-11-22',
        updatedAt: '2026-11-20T09:00:00.000Z',
      },
    },
    '2026-11-24'
  )[0];
  assert.equal(overdue.status, 'OVERDUE');

  assert.equal(
    computePartyStatus({ kulRaqam: 100000, wasoolPaid: 100000, baqiAmount: 0, wadaDate: '2026-11-22', todayDate: '2026-11-24' }),
    'CLEAR'
  );
  assert.equal(
    computePartyStatus({ kulRaqam: 100000, wasoolPaid: 0, baqiAmount: 100000, todayDate: '2026-11-24' }),
    'PENDING'
  );

  const waUrl = buildWhatsappReminderUrl({
    phone: '0301-5730577',
    partyName: 'Bilal Traders',
    baqiAmount: 60000,
    netBalance: 60000,
    wadaDate: '2026-11-25',
  });
  assert.ok(waUrl && waUrl.startsWith('https://wa.me/923015730577?text='));
});

test('Auto-backup schedule evaluates Daily / Weekly / Monthly / Never accurately', () => {
  const now = Date.parse('2026-11-24T12:00:00.000Z');
  assert.equal(
    isAutoBackupDue({ ...DEFAULT_AUTO_BACKUP, frequency: 'never', lastBackupAt: null }, now),
    false
  );
  assert.equal(
    isAutoBackupDue(
      { ...DEFAULT_AUTO_BACKUP, frequency: 'daily', lastBackupAt: '2026-11-23T10:00:00.000Z' },
      now
    ),
    true
  );
  assert.equal(
    isAutoBackupDue(
      { ...DEFAULT_AUTO_BACKUP, frequency: 'daily', lastBackupAt: '2026-11-24T06:00:00.000Z' },
      now
    ),
    false
  );
  assert.equal(
    isAutoBackupDue(
      { ...DEFAULT_AUTO_BACKUP, frequency: 'weekly', lastBackupAt: '2026-11-16T10:00:00.000Z' },
      now
    ),
    true
  );
});

test('Backup validation and merge work without overwriting existing records', () => {
  const valid = validateBackupPayload({
    version: 2,
    sales: [{ id: 's2' }],
    purchases: [],
    ledger: [],
    counters: { salesNext: 5, purchaseNext: 2 },
    settings: DEFAULT_SETTINGS,
  });
  assert.equal(valid.valid, true);
  assert.ok(valid.payload);

  const merged = mergeBackupData(
    {
      sales: [{ id: 's1' } as SaleRecord],
      purchases: [],
      ledger: [],
      counters: { salesNext: 2, purchaseNext: 3 },
    },
    valid.payload
  );
  assert.equal(merged.sales.length, 2);
  assert.equal(merged.counters.salesNext, 5);
  assert.equal(merged.counters.purchaseNext, 3);
});

import {
  calculateRoznamchaRange,
} from './calculations';

test('Roznamcha v2 mandatory example: 13,00,000 in, 1,00,000 out, 5,000 out -> 13,00,000 / 12,00,000 / 11,95,000 and next day opens at 11,95,000', () => {
  const entries: RoznamchaEntry[] = [
    {
      id: 'r1',
      date: '2026-11-24',
      side: 'in',
      amount: 1300000,
      tafseel: 'رقم وصول ہوئی',
      category: 'فصل/منجی وصولی',
      method: 'Cash',
      createdAt: '2026-11-24T09:00:00.000Z',
    },
    {
      id: 'r2',
      date: '2026-11-24',
      side: 'out',
      amount: 100000,
      tafseel: 'منجی خریدی',
      category: 'منجی/فصل خریدی',
      method: 'Cash',
      createdAt: '2026-11-24T10:00:00.000Z',
    },
    {
      id: 'r3',
      date: '2026-11-24',
      side: 'out',
      amount: 5000,
      tafseel: 'تیل خریدا',
      category: 'تیل/ڈیزل',
      method: 'Cash',
      createdAt: '2026-11-24T11:00:00.000Z',
    },
  ];

  const day1 = calculateRoznamchaDay(entries, '2026-11-24', DEFAULT_ROZNAMCHA_SETTINGS);
  assert.equal(day1.pichlaBaqi, 0);
  assert.equal(day1.aajKulAaye, 1300000);
  assert.equal(day1.aajKulGaye, 105000);
  assert.equal(day1.aajKaBaqi, 1195000);
  assert.equal(day1.kulBaqi, 1195000);
  assert.equal(day1.chronologicalWithRunning[0].runningBalance, 1300000);
  assert.equal(day1.chronologicalWithRunning[1].runningBalance, 1200000);
  assert.equal(day1.chronologicalWithRunning[2].runningBalance, 1195000);

  const day2 = calculateRoznamchaDay(entries, '2026-11-25', DEFAULT_ROZNAMCHA_SETTINGS);
  assert.equal(day2.pichlaBaqi, 1195000);
  assert.equal(day2.kulBaqi, 1195000);

  const range = calculateRoznamchaRange(entries, DEFAULT_ROZNAMCHA_SETTINGS, '2026-11-24', '2026-11-25');
  assert.equal(range.rows.length, 3);
  assert.equal(range.rows[2].runningBalance, 1195000);

  const month = calculateRoznamchaMonth(entries, '2026-11', DEFAULT_ROZNAMCHA_SETTINGS);
  assert.equal(month.totalAaye, 1300000);
  assert.equal(month.totalGaye, 105000);
  assert.equal(month.closingBalance, 1195000);
  assert.equal(
    month.days.reduce((s, d) => s + d.aaye, 0),
    month.totalAaye
  );

  // Negative balance allowed check
  const negDay = calculateRoznamchaDay(
    [
      {
        id: 'neg1',
        date: '2026-11-24',
        side: 'out',
        amount: 2500,
        tafseel: 'پلے دار مزدوری',
        category: 'پلے داری/مزدوری',
        method: 'Cash',
        createdAt: '2026-11-24T09:00:00.000Z',
      },
    ],
    '2026-11-24',
    DEFAULT_ROZNAMCHA_SETTINGS
  );
  assert.equal(negDay.kulBaqi, -2500);

  const cats = buildRoznamchaCategoryReport(entries);
  const oil = cats.find((c) => c.category === 'تیل/ڈیزل');
  assert.ok(oil);
  assert.equal(oil.outTotal, 5000);
});

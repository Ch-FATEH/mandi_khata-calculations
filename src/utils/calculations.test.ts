import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateSale,
  calculatePurchase,
  calculateDashboardSummary,
  buildPartySummaries,
  buildPartyLedgerLines,
} from './calculations';
import {
  DEFAULT_SETTINGS,
  allocateNextRef,
  validateBackupPayload,
  mergeBackupData,
} from './storage';
import { PurchaseRecord, SaleRecord, PartyPayment } from '../types/mandi';

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

  const lines = buildPartyLedgerLines('Al-Madina Rice Mill', [sale], [purchase], [payment]);
  assert.equal(lines.length, 2);
  assert.equal(lines[0].runningBalance, 942506);
  assert.equal(lines[1].runningBalance, 442506);
});

test('Backup validation and merge work without overwriting existing records', () => {
  const valid = validateBackupPayload({
    version: 1,
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

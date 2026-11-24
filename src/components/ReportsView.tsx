import React, { useMemo, useState } from 'react';
import { Download, Layers, List, Printer } from 'lucide-react';
import {
  AppLanguage,
  PurchaseRecord,
  RoznamchaEntry,
  RoznamchaSettings,
  SaleRecord,
  TradeRecord,
} from '../types/mandi';
import { Translations } from '../i18n/translations';
import {
  buildRoznamchaCategoryReport,
  calculateRoznamchaRange,
  formatNumber,
  formatRs,
  roundTo2,
} from '../utils/calculations';

interface ReportsViewProps {
  language: AppLanguage;
  t: Translations;
  sales: SaleRecord[];
  purchases: PurchaseRecord[];
  roznamchaEntries: RoznamchaEntry[];
  roznamchaSettings: RoznamchaSettings;
  onViewSlip?: (record: TradeRecord) => void;
}

type ReportTab =
  | 'sales'
  | 'purchase'
  | 'crop'
  | 'party'
  | 'weight'
  | 'commission'
  | 'mizan'
  | 'roznamcha';
type PeriodGranularity = 'daily' | 'monthly' | 'yearly';
type ReportViewMode = 'summary' | 'detailed';

export const ReportsView: React.FC<ReportsViewProps> = ({
  language,
  t,
  sales,
  purchases,
  roznamchaEntries,
  roznamchaSettings,
  onViewSlip,
}) => {
  const [tab, setTab] = useState<ReportTab>('sales');
  const [granularity, setGranularity] = useState<PeriodGranularity>('daily');
  const [viewMode, setViewMode] = useState<ReportViewMode>('summary');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [drillPeriod, setDrillPeriod] = useState<string>('');
  const [drillParty, setDrillParty] = useState<string>('');
  const [drillCrop, setDrillCrop] = useState<string>('');

  const filterRange = <T extends { date: string }>(list: T[]): T[] =>
    list.filter((item) => {
      if (fromDate && item.date < fromDate) return false;
      if (toDate && item.date > toDate) return false;
      return true;
    });

  const filteredSales = useMemo(
    () => filterRange(sales),
    [sales, fromDate, toDate]
  );
  const filteredPurchases = useMemo(
    () => filterRange(purchases),
    [purchases, fromDate, toDate]
  );
  const filteredRoznamcha = useMemo(
    () => filterRange(roznamchaEntries),
    [roznamchaEntries, fromDate, toDate]
  );

  const periodKey = (dateStr: string) => {
    if (granularity === 'yearly') return dateStr.slice(0, 4);
    if (granularity === 'monthly') return dateStr.slice(0, 7);
    return dateStr;
  };

  const groupByPeriod = (list: TradeRecord[]) => {
    const map = new Map<
      string,
      {
        period: string;
        count: number;
        netWeight: number;
        gross: number;
        commission: number;
        mizan: number;
      }
    >();
    for (const r of list) {
      const k = periodKey(r.date);
      const curr = map.get(k) || {
        period: k,
        count: 0,
        netWeight: 0,
        gross: 0,
        commission: 0,
        mizan: 0,
      };
      curr.count += 1;
      curr.netWeight = roundTo2(curr.netWeight + r.netWeightKg);
      curr.gross += r.grossAmount;
      curr.commission += r.commissionAmount;
      curr.mizan += r.totalMizan;
      map.set(k, curr);
    }
    return Array.from(map.values()).sort((a, b) =>
      b.period.localeCompare(a.period)
    );
  };

  const salesByPeriod = useMemo(
    () => groupByPeriod(filteredSales),
    [filteredSales, granularity]
  );
  const purchasesByPeriod = useMemo(
    () => groupByPeriod(filteredPurchases),
    [filteredPurchases, granularity]
  );

  const cropRows = useMemo(() => {
    const map = new Map<
      string,
      {
        crop: string;
        salesCount: number;
        salesWeight: number;
        salesAmount: number;
        purchaseCount: number;
        purchaseWeight: number;
        purchaseAmount: number;
      }
    >();

    for (const s of filteredSales) {
      const label =
        language === 'ur' ? s.cropNameUr || s.cropNameEn : s.cropNameEn || s.cropNameUr;
      const row = map.get(label) || {
        crop: label,
        salesCount: 0,
        salesWeight: 0,
        salesAmount: 0,
        purchaseCount: 0,
        purchaseWeight: 0,
        purchaseAmount: 0,
      };
      row.salesCount += 1;
      row.salesWeight = roundTo2(row.salesWeight + s.netWeightKg);
      row.salesAmount += s.totalMizan;
      map.set(label, row);
    }

    for (const p of filteredPurchases) {
      const label =
        language === 'ur' ? p.cropNameUr || p.cropNameEn : p.cropNameEn || p.cropNameUr;
      const row = map.get(label) || {
        crop: label,
        salesCount: 0,
        salesWeight: 0,
        salesAmount: 0,
        purchaseCount: 0,
        purchaseWeight: 0,
        purchaseAmount: 0,
      };
      row.purchaseCount += 1;
      row.purchaseWeight = roundTo2(row.purchaseWeight + p.netWeightKg);
      row.purchaseAmount += p.totalMizan;
      map.set(label, row);
    }

    return Array.from(map.values());
  }, [filteredSales, filteredPurchases, language]);

  const partyRows = useMemo(() => {
    const map = new Map<
      string,
      {
        party: string;
        salesAmount: number;
        purchaseAmount: number;
        commission: number;
        count: number;
      }
    >();

    for (const s of filteredSales) {
      const row = map.get(s.partyName) || {
        party: s.partyName,
        salesAmount: 0,
        purchaseAmount: 0,
        commission: 0,
        count: 0,
      };
      row.salesAmount += s.totalMizan;
      row.commission += s.commissionAmount;
      row.count += 1;
      map.set(s.partyName, row);
    }
    for (const p of filteredPurchases) {
      const row = map.get(p.partyName) || {
        party: p.partyName,
        salesAmount: 0,
        purchaseAmount: 0,
        commission: 0,
        count: 0,
      };
      row.purchaseAmount += p.totalMizan;
      row.commission += p.commissionAmount;
      row.count += 1;
      map.set(p.partyName, row);
    }
    return Array.from(map.values()).sort(
      (a, b) =>
        b.salesAmount + b.purchaseAmount - (a.salesAmount + a.purchaseAmount)
    );
  }, [filteredSales, filteredPurchases]);

  const totals = useMemo(() => {
    const sWeight = roundTo2(filteredSales.reduce((a, b) => a + b.netWeightKg, 0));
    const pWeight = roundTo2(filteredPurchases.reduce((a, b) => a + b.netWeightKg, 0));
    const sGross = filteredSales.reduce((a, b) => a + b.grossAmount, 0);
    const pGross = filteredPurchases.reduce((a, b) => a + b.grossAmount, 0);
    const sComm = filteredSales.reduce((a, b) => a + b.commissionAmount, 0);
    const pComm = filteredPurchases.reduce((a, b) => a + b.commissionAmount, 0);
    const sMizan = filteredSales.reduce((a, b) => a + b.totalMizan, 0);
    const pMizan = filteredPurchases.reduce((a, b) => a + b.totalMizan, 0);
    return { sWeight, pWeight, sGross, pGross, sComm, pComm, sMizan, pMizan };
  }, [filteredSales, filteredPurchases]);

  const roznamchaRange = useMemo(
    () =>
      calculateRoznamchaRange(
        roznamchaEntries,
        roznamchaSettings,
        fromDate || undefined,
        toDate || undefined
      ),
    [roznamchaEntries, roznamchaSettings, fromDate, toDate]
  );

  const roznamchaCategories = useMemo(
    () =>
      buildRoznamchaCategoryReport(
        roznamchaEntries,
        fromDate || undefined,
        toDate || undefined
      ),
    [roznamchaEntries, fromDate, toDate]
  );

  const roznamchaByPeriod = useMemo(() => {
    const map = new Map<
      string,
      { period: string; count: number; aaye: number; gaye: number; net: number }
    >();
    for (const e of filteredRoznamcha) {
      const k = periodKey(e.date);
      const curr = map.get(k) || { period: k, count: 0, aaye: 0, gaye: 0, net: 0 };
      const amt = Math.round(e.amount);
      curr.count += 1;
      if (e.side === 'in') {
        curr.aaye += amt;
        curr.net += amt;
      } else {
        curr.gaye += amt;
        curr.net -= amt;
      }
      map.set(k, curr);
    }
    return Array.from(map.values()).sort((a, b) => b.period.localeCompare(a.period));
  }, [filteredRoznamcha, granularity]);

  const detailedTradeRecords = useMemo(() => {
    let base: TradeRecord[] = [];
    if (tab === 'sales') base = filteredSales;
    else if (tab === 'purchase') base = filteredPurchases;
    else base = [...filteredSales, ...filteredPurchases];

    if (drillPeriod) {
      base = base.filter((r) => periodKey(r.date) === drillPeriod);
    }
    if (drillParty) {
      base = base.filter((r) => r.partyName === drillParty);
    }
    if (drillCrop) {
      base = base.filter((r) => {
        const label =
          language === 'ur' ? r.cropNameUr || r.cropNameEn : r.cropNameEn || r.cropNameUr;
        return label === drillCrop;
      });
    }

    return [...base].sort((a, b) => {
      const d = b.date.localeCompare(a.date);
      if (d !== 0) return d;
      return b.createdAt.localeCompare(a.createdAt);
    });
  }, [tab, filteredSales, filteredPurchases, drillPeriod, drillParty, drillCrop, granularity, language]);

  const clearDrills = () => {
    setDrillPeriod('');
    setDrillParty('');
    setDrillCrop('');
  };

  const handleExportCsv = () => {
    const header = [
      'Type',
      'RefNo',
      'Date',
      'Party',
      'Crop',
      'Variety',
      'Bags',
      'TotalWeightKG',
      'NetWeightKG',
      'Maund',
      'Rate',
      'GrossRs',
      'CommissionRs',
      'AdvanceRs',
      'TaxLabourRs',
      'TotalMizanRs',
      'CategoryOrNotes',
      'RunningBalanceRs',
    ];
    const rows: string[][] = [
      ...filteredSales.map((s) => [
        'Sale',
        s.refNo,
        s.date,
        s.partyName,
        s.cropNameEn || s.cropNameUr,
        s.variety,
        String(s.bags),
        String(s.totalWeight),
        String(s.netWeightKg),
        String(s.maund),
        String(s.ratePerMaund),
        String(s.grossAmount),
        String(s.commissionAmount),
        String(s.advance),
        String(s.taxLabour),
        String(s.totalMizan),
        s.notes,
        '',
      ]),
      ...filteredPurchases.map((p) => [
        'Purchase',
        p.refNo,
        p.date,
        p.partyName,
        p.cropNameEn || p.cropNameUr,
        p.variety,
        String(p.bags),
        String(p.totalWeight),
        String(p.netWeightKg),
        String(p.maund),
        String(p.ratePerMaund),
        String(p.grossAmount),
        String(p.commissionAmount),
        String(p.advance),
        String(p.taxLabour),
        String(p.totalMizan),
        p.notes,
        '',
      ]),
      ...roznamchaRange.rows.map((r) => [
        r.side === 'in' ? 'Roznamcha-In' : 'Roznamcha-Out',
        r.method,
        r.date,
        r.partyName || '',
        r.category,
        '',
        '',
        '',
        '',
        '',
        '',
        r.side === 'in' ? String(r.amount) : '0',
        '0',
        '0',
        r.side === 'out' ? String(r.amount) : '0',
        r.side === 'in' ? String(r.amount) : String(-r.amount),
        r.tafseel,
        String(r.runningBalance),
      ]),
    ];

    const csvContent =
      '\uFEFF' +
      [header, ...rows]
        .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))
        .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mandi-khata-report-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const tabs: { id: ReportTab; label: string }[] = [
    { id: 'sales', label: t.reportSalesTab },
    { id: 'purchase', label: t.reportPurchaseTab },
    { id: 'crop', label: t.reportCropTab },
    { id: 'party', label: t.reportPartyTab },
    { id: 'weight', label: t.reportWeightTab },
    { id: 'commission', label: t.reportCommissionTab },
    { id: 'mizan', label: t.reportMizanTab },
    { id: 'roznamcha', label: t.reportRoznamchaTab },
  ];

  const renderDetailedTradeTable = () => (
    <div className="space-y-2">
      {(drillPeriod || drillParty || drillCrop) && (
        <div className="no-print flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-[#0B7D50]/30 bg-emerald-50/70 px-4 py-2 text-xs font-bold text-[#12452D] dark:bg-emerald-950/30 dark:text-emerald-300">
          <span>
            {drillPeriod || drillParty || drillCrop} ({detailedTradeRecords.length})
          </span>
          <button
            type="button"
            onClick={clearDrills}
            className="underline hover:text-[#0B7D50]"
          >
            {t.all}
          </button>
        </div>
      )}
      <div className="overflow-x-auto rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <table className="w-full min-w-[680px] text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-xs font-bold text-slate-700 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-200">
              <th className="px-4 py-3 text-start">{t.refNoLabel}</th>
              <th className="px-4 py-3 text-start">{t.dateLabel}</th>
              <th className="px-4 py-3 text-start">{t.partyLabel}</th>
              <th className="px-4 py-3 text-start">{t.cropLabel}</th>
              <th className="px-4 py-3 text-end">{t.netWeightLabel}</th>
              <th className="px-4 py-3 text-end">{t.commissionLabel}</th>
              <th className="px-4 py-3 text-end">{t.totalMizanLabel}</th>
              {onViewSlip && <th className="no-print px-4 py-3 text-end">{t.viewSlip}</th>}
            </tr>
          </thead>
          <tbody>
            {detailedTradeRecords.length === 0 ? (
              <tr>
                <td
                  colSpan={onViewSlip ? 8 : 7}
                  className="px-4 py-8 text-center text-slate-600 dark:text-slate-300"
                >
                  {t.noRecordsFound}
                </td>
              </tr>
            ) : (
              detailedTradeRecords.map((rec) => {
                const cropLabel =
                  language === 'ur'
                    ? rec.cropNameUr || rec.cropNameEn
                    : rec.cropNameEn || rec.cropNameUr;
                return (
                  <tr
                    key={rec.id}
                    className="border-b border-slate-100 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/40"
                  >
                    <td className="ltr-num px-4 py-3 font-bold text-slate-900 dark:text-slate-100">
                      {rec.refNo}
                    </td>
                    <td className="ltr-num px-4 py-3 text-slate-700 dark:text-slate-300">
                      {rec.date}
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-900 dark:text-slate-100">
                      {rec.partyName}
                    </td>
                    <td className="px-4 py-3 text-slate-700 dark:text-slate-300">
                      {cropLabel}
                      {rec.variety ? ` (${rec.variety})` : ''}
                    </td>
                    <td className="ltr-num px-4 py-3 text-end">
                      {formatNumber(rec.netWeightKg)} KG
                    </td>
                    <td className="ltr-num px-4 py-3 text-end">
                      {formatRs(rec.commissionAmount)}
                    </td>
                    <td className="ltr-num px-4 py-3 text-end font-bold text-[#0B7D50] dark:text-emerald-400">
                      {formatRs(rec.totalMizan)}
                    </td>
                    {onViewSlip && (
                      <td className="no-print px-4 py-3 text-end">
                        <button
                          type="button"
                          onClick={() => onViewSlip(rec)}
                          className="rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-bold text-[#0B7D50] hover:bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-300"
                        >
                          {t.viewSlip}
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="space-y-5">
      <div className="no-print flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-extrabold text-slate-900 dark:text-slate-100">
          {t.reportsTitle}
        </h1>
        <div className="flex flex-wrap items-center gap-2">
          {/* Summary (Total) vs Detailed (Entries) Toggle */}
          <div className="flex items-center rounded-xl border border-slate-200 bg-white p-1 dark:border-slate-800 dark:bg-slate-900">
            <button
              type="button"
              onClick={() => {
                setViewMode('summary');
                clearDrills();
              }}
              className={`flex min-h-[34px] items-center gap-1 rounded-lg px-3 py-1 text-xs font-bold ${
                viewMode === 'summary'
                  ? 'bg-[#0B7D50] text-white'
                  : 'text-slate-700 dark:text-slate-300'
              }`}
            >
              <Layers className="h-3.5 w-3.5" />
              <span>{t.summaryViewLabel}</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('detailed')}
              className={`flex min-h-[34px] items-center gap-1 rounded-lg px-3 py-1 text-xs font-bold ${
                viewMode === 'detailed'
                  ? 'bg-[#0B7D50] text-white'
                  : 'text-slate-700 dark:text-slate-300'
              }`}
            >
              <List className="h-3.5 w-3.5" />
              <span>{t.detailedViewLabel}</span>
            </button>
          </div>

          <button
            type="button"
            onClick={handleExportCsv}
            className="flex min-h-[42px] items-center gap-1.5 rounded-xl bg-[#0B7D50] px-4 py-2 text-xs font-bold text-white hover:bg-[#12452D]"
          >
            <Download className="h-4 w-4" />
            {t.exportCsv}
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="flex min-h-[42px] items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          >
            <Printer className="h-4 w-4" />
            {t.print}
          </button>
        </div>
      </div>

      {/* Date Range & Granularity Controls */}
      <div className="no-print grid grid-cols-1 gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:grid-cols-3 dark:border-slate-800 dark:bg-slate-900">
        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
            {t.fromDate}
          </label>
          <input
            type="date"
            dir="ltr"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="ltr-num min-h-[40px] w-full rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
            {t.toDate}
          </label>
          <input
            type="date"
            dir="ltr"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="ltr-num min-h-[40px] w-full rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          />
        </div>
        <div>
          <span className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
            {t.today} / {t.thisMonth} / {t.thisYear}
          </span>
          <div className="grid grid-cols-3 gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
            {(['daily', 'monthly', 'yearly'] as PeriodGranularity[]).map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => setGranularity(g)}
                className={`min-h-[34px] rounded-lg text-xs font-semibold ${
                  granularity === g
                    ? 'bg-white text-[#0B7D50] shadow-sm dark:bg-slate-900 dark:text-emerald-400'
                    : 'text-slate-700 dark:text-slate-300'
                }`}
              >
                {g === 'daily'
                  ? t.periodDaily
                  : g === 'monthly'
                    ? t.periodMonthly
                    : t.periodYearly}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Report Tabs */}
      <div className="no-print flex flex-wrap gap-2">
        {tabs.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => {
              setTab(item.id);
              clearDrills();
            }}
            className={`min-h-[40px] rounded-xl px-4 py-2 text-xs font-bold transition ${
              tab === item.id
                ? 'bg-[#0B7D50] text-white'
                : 'border border-slate-200 bg-white text-slate-800 hover:border-[#0B7D50] dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <p className="text-xs font-medium text-slate-600 dark:text-slate-300">
        {t.reportsDisclaimer}
      </p>

      {/* Content */}
      {tab === 'roznamcha' ? (
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                {t.pichlaBaqiLabel}
              </span>
              <p className="ltr-num mt-1 text-lg font-extrabold text-slate-900 dark:text-slate-100">
                {formatRs(roznamchaRange.openingBalance)}
              </p>
            </div>
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 dark:border-emerald-900 dark:bg-emerald-950/30">
              <span className="text-xs font-semibold text-[#12452D] dark:text-emerald-300">
                {t.roznamchaAaye}
              </span>
              <p className="ltr-num mt-1 text-lg font-extrabold text-[#0B7D50] dark:text-emerald-400">
                {formatRs(roznamchaRange.totalIn)}
              </p>
            </div>
            <div className="rounded-2xl border border-rose-200 bg-rose-50/70 p-4 dark:border-rose-900 dark:bg-rose-950/30">
              <span className="text-xs font-semibold text-rose-900 dark:text-rose-300">
                {t.roznamchaGaye}
              </span>
              <p className="ltr-num mt-1 text-lg font-extrabold text-rose-700 dark:text-rose-400">
                {formatRs(roznamchaRange.totalOut)}
              </p>
            </div>
            <div className="rounded-2xl border border-[#D9AA45]/50 bg-[#F5F2E7] p-4 dark:border-[#D9AA45]/30 dark:bg-slate-800">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                {t.kulBaqiLabel}
              </span>
              <p
                className={`ltr-num mt-1 text-lg font-extrabold ${
                  roznamchaRange.closingBalance < 0
                    ? 'text-red-600 dark:text-red-400'
                    : 'text-[#12452D] dark:text-[#F2CC70]'
                }`}
              >
                {formatRs(roznamchaRange.closingBalance)}
              </p>
            </div>
          </div>

          {viewMode === 'summary' ? (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <div className="overflow-x-auto rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-xs font-bold text-slate-700 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-200">
                      <th className="px-4 py-3 text-start">{t.dateLabel}</th>
                      <th className="px-4 py-3 text-end">{t.roznamchaAaye}</th>
                      <th className="px-4 py-3 text-end">{t.roznamchaGaye}</th>
                      <th className="px-4 py-3 text-end">{t.aajKaBaqiLabel}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {roznamchaByPeriod.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                          {t.noRecordsFound}
                        </td>
                      </tr>
                    ) : (
                      roznamchaByPeriod.map((row) => (
                        <tr
                          key={row.period}
                          onClick={() => setViewMode('detailed')}
                          className="cursor-pointer border-b border-slate-100 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/40"
                        >
                          <td className="ltr-num px-4 py-3 font-bold">{row.period}</td>
                          <td className="ltr-num px-4 py-3 text-end font-bold text-[#0B7D50] dark:text-emerald-400">
                            {formatRs(row.aaye)}
                          </td>
                          <td className="ltr-num px-4 py-3 text-end font-bold text-rose-700 dark:text-rose-400">
                            {formatRs(row.gaye)}
                          </td>
                          <td
                            className={`ltr-num px-4 py-3 text-end font-extrabold ${
                              row.net < 0 ? 'text-red-600' : 'text-slate-900 dark:text-slate-100'
                            }`}
                          >
                            {formatRs(row.net)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <div className="overflow-x-auto rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-xs font-bold text-slate-700 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-200">
                      <th className="px-4 py-3 text-start">{t.categoryLabel}</th>
                      <th className="px-4 py-3 text-end">{t.roznamchaAaye}</th>
                      <th className="px-4 py-3 text-end">{t.roznamchaGaye}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {roznamchaCategories.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="px-4 py-8 text-center text-slate-500">
                          {t.noRecordsFound}
                        </td>
                      </tr>
                    ) : (
                      roznamchaCategories.map((cat) => (
                        <tr key={cat.category} className="border-b border-slate-100 dark:border-slate-800">
                          <td className="px-4 py-3 font-bold">
                            {cat.category} <span className="ltr-num text-xs text-slate-500">({cat.count})</span>
                          </td>
                          <td className="ltr-num px-4 py-3 text-end font-bold text-[#0B7D50] dark:text-emerald-400">
                            {cat.inTotal > 0 ? formatRs(cat.inTotal) : '—'}
                          </td>
                          <td className="ltr-num px-4 py-3 text-end font-bold text-rose-700 dark:text-rose-400">
                            {cat.outTotal > 0 ? formatRs(cat.outTotal) : '—'}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <table className="w-full min-w-[600px] text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-xs font-bold text-slate-700 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-200">
                    <th className="px-4 py-3 text-start">{t.colDate}</th>
                    <th className="px-4 py-3 text-start">{t.tafseelLabel}</th>
                    <th className="px-4 py-3 text-end">{t.roznamchaAaye}</th>
                    <th className="px-4 py-3 text-end">{t.roznamchaGaye}</th>
                    <th className="px-4 py-3 text-end">{t.runningBalanceCol}</th>
                  </tr>
                </thead>
                <tbody>
                  {roznamchaRange.rows.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                        {t.noRecordsFound}
                      </td>
                    </tr>
                  ) : (
                    roznamchaRange.rows.map((r) => (
                      <tr key={r.id} className="border-b border-slate-100 dark:border-slate-800">
                        <td className="ltr-num px-4 py-3 text-slate-700 dark:text-slate-300">
                          {r.date}
                        </td>
                        <td className="px-4 py-3 font-semibold text-slate-900 dark:text-slate-100">
                          {r.tafseel}{' '}
                          <span className="text-xs font-normal text-slate-500">
                            ({r.category})
                          </span>
                        </td>
                        <td className="ltr-num px-4 py-3 text-end font-bold text-[#0B7D50] dark:text-emerald-400">
                          {r.side === 'in' ? formatRs(r.amount) : '—'}
                        </td>
                        <td className="ltr-num px-4 py-3 text-end font-bold text-rose-700 dark:text-rose-400">
                          {r.side === 'out' ? formatRs(r.amount) : '—'}
                        </td>
                        <td
                          className={`ltr-num px-4 py-3 text-end font-extrabold ${
                            r.runningBalance < 0
                              ? 'text-red-600 dark:text-red-400'
                              : 'text-slate-900 dark:text-slate-100'
                          }`}
                        >
                          {formatRs(r.runningBalance)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : viewMode === 'detailed' ? (
        renderDetailedTradeTable()
      ) : (
        <>
          {(tab === 'sales' || tab === 'purchase') && (
            <div className="overflow-x-auto rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <table className="w-full min-w-[540px] text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-xs font-bold text-slate-700 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-200">
                    <th className="px-4 py-3 text-start">{t.dateLabel}</th>
                    <th className="px-4 py-3 text-end">{t.totalCount}</th>
                    <th className="px-4 py-3 text-end">{t.totalWeightSum}</th>
                    <th className="px-4 py-3 text-end">{t.totalGrossSum}</th>
                    <th className="px-4 py-3 text-end">{t.totalCommissionSum}</th>
                    <th className="px-4 py-3 text-end">{t.totalMizanSum}</th>
                  </tr>
                </thead>
                <tbody>
                  {(tab === 'sales' ? salesByPeriod : purchasesByPeriod).length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-slate-600 dark:text-slate-300">
                        {t.noRecordsFound}
                      </td>
                    </tr>
                  ) : (
                    (tab === 'sales' ? salesByPeriod : purchasesByPeriod).map((row) => (
                      <tr
                        key={row.period}
                        onClick={() => {
                          setDrillPeriod(row.period);
                          setViewMode('detailed');
                        }}
                        className="cursor-pointer border-b border-slate-100 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/40"
                      >
                        <td className="ltr-num px-4 py-3 font-bold text-slate-900 dark:text-slate-100">
                          {row.period}
                        </td>
                        <td className="ltr-num px-4 py-3 text-end">{row.count}</td>
                        <td className="ltr-num px-4 py-3 text-end">{formatNumber(row.netWeight)} KG</td>
                        <td className="ltr-num px-4 py-3 text-end">{formatRs(row.gross)}</td>
                        <td className="ltr-num px-4 py-3 text-end">{formatRs(row.commission)}</td>
                        <td className="ltr-num px-4 py-3 text-end font-bold text-[#0B7D50] dark:text-emerald-400">
                          {formatRs(row.mizan)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {tab === 'crop' && (
            <div className="overflow-x-auto rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <table className="w-full min-w-[540px] text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-xs font-bold text-slate-700 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-200">
                    <th className="px-4 py-3 text-start">{t.cropLabel}</th>
                    <th className="px-4 py-3 text-end">{t.todaySalesWeight}</th>
                    <th className="px-4 py-3 text-end">{t.reportSalesTab}</th>
                    <th className="px-4 py-3 text-end">{t.todayPurchaseWeight}</th>
                    <th className="px-4 py-3 text-end">{t.reportPurchaseTab}</th>
                  </tr>
                </thead>
                <tbody>
                  {cropRows.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-slate-600 dark:text-slate-300">
                        {t.noRecordsFound}
                      </td>
                    </tr>
                  ) : (
                    cropRows.map((row) => (
                      <tr
                        key={row.crop}
                        onClick={() => {
                          setDrillCrop(row.crop);
                          setViewMode('detailed');
                        }}
                        className="cursor-pointer border-b border-slate-100 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/40"
                      >
                        <td className="px-4 py-3 font-bold text-slate-900 dark:text-slate-100">{row.crop}</td>
                        <td className="ltr-num px-4 py-3 text-end">{formatNumber(row.salesWeight)} KG</td>
                        <td className="ltr-num px-4 py-3 text-end font-bold text-[#0B7D50] dark:text-emerald-400">
                          {formatRs(row.salesAmount)}
                        </td>
                        <td className="ltr-num px-4 py-3 text-end">{formatNumber(row.purchaseWeight)} KG</td>
                        <td className="ltr-num px-4 py-3 text-end font-bold text-amber-700 dark:text-[#F2CC70]">
                          {formatRs(row.purchaseAmount)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {tab === 'party' && (
            <div className="overflow-x-auto rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <table className="w-full min-w-[520px] text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-xs font-bold text-slate-700 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-200">
                    <th className="px-4 py-3 text-start">{t.partyLabel}</th>
                    <th className="px-4 py-3 text-end">{t.totalCount}</th>
                    <th className="px-4 py-3 text-end">{t.reportSalesTab}</th>
                    <th className="px-4 py-3 text-end">{t.reportPurchaseTab}</th>
                    <th className="px-4 py-3 text-end">{t.commissionLabel}</th>
                  </tr>
                </thead>
                <tbody>
                  {partyRows.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-slate-600 dark:text-slate-300">
                        {t.noRecordsFound}
                      </td>
                    </tr>
                  ) : (
                    partyRows.map((row) => (
                      <tr
                        key={row.party}
                        onClick={() => {
                          setDrillParty(row.party);
                          setViewMode('detailed');
                        }}
                        className="cursor-pointer border-b border-slate-100 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/40"
                      >
                        <td className="px-4 py-3 font-bold text-slate-900 dark:text-slate-100">{row.party}</td>
                        <td className="ltr-num px-4 py-3 text-end">{row.count}</td>
                        <td className="ltr-num px-4 py-3 text-end font-bold text-[#0B7D50] dark:text-emerald-400">
                          {formatRs(row.salesAmount)}
                        </td>
                        <td className="ltr-num px-4 py-3 text-end font-bold text-amber-700 dark:text-[#F2CC70]">
                          {formatRs(row.purchaseAmount)}
                        </td>
                        <td className="ltr-num px-4 py-3 text-end">{formatRs(row.commission)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {(tab === 'weight' || tab === 'commission' || tab === 'mizan') && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <h2 className="text-sm font-bold text-slate-600 dark:text-slate-300">
                  {t.reportSalesTab} ({filteredSales.length})
                </h2>
                {tab === 'weight' && (
                  <p className="ltr-num mt-2 text-2xl font-extrabold text-[#0B7D50] dark:text-emerald-400">
                    {formatNumber(totals.sWeight)} KG
                  </p>
                )}
                {tab === 'commission' && (
                  <p className="ltr-num mt-2 text-2xl font-extrabold text-[#0B7D50] dark:text-emerald-400">
                    {formatRs(totals.sComm)}
                  </p>
                )}
                {tab === 'mizan' && (
                  <p className="ltr-num mt-2 text-2xl font-extrabold text-[#0B7D50] dark:text-emerald-400">
                    {formatRs(totals.sMizan)}
                  </p>
                )}
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <h2 className="text-sm font-bold text-slate-600 dark:text-slate-300">
                  {t.reportPurchaseTab} ({filteredPurchases.length})
                </h2>
                {tab === 'weight' && (
                  <p className="ltr-num mt-2 text-2xl font-extrabold text-amber-700 dark:text-[#F2CC70]">
                    {formatNumber(totals.pWeight)} KG
                  </p>
                )}
                {tab === 'commission' && (
                  <p className="ltr-num mt-2 text-2xl font-extrabold text-amber-700 dark:text-[#F2CC70]">
                    {formatRs(totals.pComm)}
                  </p>
                )}
                {tab === 'mizan' && (
                  <p className="ltr-num mt-2 text-2xl font-extrabold text-amber-700 dark:text-[#F2CC70]">
                    {formatRs(totals.pMizan)}
                  </p>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

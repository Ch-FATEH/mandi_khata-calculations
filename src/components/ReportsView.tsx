import React, { useMemo, useState } from 'react';
import { Download, Printer } from 'lucide-react';
import {
  AppLanguage,
  PurchaseRecord,
  SaleRecord,
  TradeRecord,
} from '../types/mandi';
import { Translations } from '../i18n/translations';
import { formatNumber, formatRs, roundTo2 } from '../utils/calculations';

interface ReportsViewProps {
  language: AppLanguage;
  t: Translations;
  sales: SaleRecord[];
  purchases: PurchaseRecord[];
}

type ReportTab =
  | 'sales'
  | 'purchase'
  | 'crop'
  | 'party'
  | 'weight'
  | 'commission'
  | 'mizan';
type PeriodGranularity = 'daily' | 'monthly' | 'yearly';

export const ReportsView: React.FC<ReportsViewProps> = ({
  language,
  t,
  sales,
  purchases,
}) => {
  const [tab, setTab] = useState<ReportTab>('sales');
  const [granularity, setGranularity] = useState<PeriodGranularity>('daily');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const filterRange = <T extends TradeRecord>(list: T[]): T[] =>
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
  ];

  return (
    <div className="space-y-5">
      <div className="no-print flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-extrabold text-slate-900 dark:text-slate-100">
          {t.reportsTitle}
        </h1>
        <div className="flex items-center gap-2">
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
            onClick={() => setTab(item.id)}
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
                  <tr key={row.period} className="border-b border-slate-100 dark:border-slate-800">
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
                  <tr key={row.crop} className="border-b border-slate-100 dark:border-slate-800">
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
                  <tr key={row.party} className="border-b border-slate-100 dark:border-slate-800">
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
    </div>
  );
};

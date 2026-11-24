import React from 'react';
import {
  ArrowDownLeft,
  ArrowUpRight,
  BarChart3,
  BookOpen,
  Calculator,
  FileText,
  Plus,
  Scale,
  Sprout,
} from 'lucide-react';
import {
  AppLanguage,
  AppSettings,
  PurchaseRecord,
  SaleRecord,
  TradeRecord,
} from '../types/mandi';
import { Translations } from '../i18n/translations';
import {
  calculateDashboardSummary,
  formatNumber,
  formatRs,
  getTodayISO,
} from '../utils/calculations';

export type ActiveTab =
  | 'home'
  | 'sales'
  | 'purchase'
  | 'khata'
  | 'calculators'
  | 'reports'
  | 'settings';

interface DashboardProps {
  language: AppLanguage;
  t: Translations;
  settings: AppSettings;
  sales: SaleRecord[];
  purchases: PurchaseRecord[];
  onNavigate: (tab: ActiveTab) => void;
  onOpenQuickSlip: (mode: 'sale' | 'purchase') => void;
  onOpenCalculator: (calcId: string) => void;
  onViewSlip: (record: TradeRecord) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  language,
  t,
  settings,
  sales,
  purchases,
  onNavigate,
  onOpenQuickSlip,
  onOpenCalculator,
  onViewSlip,
}) => {
  const today = getTodayISO();
  const summary = calculateDashboardSummary(sales, purchases, today);

  const recentRecords: TradeRecord[] = [...sales, ...purchases]
    .sort((a, b) => {
      const dateCmp = b.date.localeCompare(a.date);
      if (dateCmp !== 0) return dateCmp;
      return b.createdAt.localeCompare(a.createdAt);
    })
    .slice(0, 8);

  const commissionConfigured = settings.commissionPercent > 0;
  const commissionActive =
    commissionConfigured && settings.commissionMode !== 'off';

  return (
    <div className="space-y-6">
      {/* Hero Khata Card */}
      <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-[#0B7D50] to-[#12452D] p-5 text-white shadow-lg sm:p-7">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-emerald-100">{t.todayAccount}</p>
            <p className="ltr-num mt-0.5 text-xs text-emerald-200">{today}</p>
          </div>
          {(settings.shopNameUr || settings.shopNameEn) && (
            <div className="text-end">
              <p className="text-sm font-bold text-[#F2CC70]">
                {language === 'ur'
                  ? settings.shopNameUr || settings.shopNameEn
                  : settings.shopNameEn || settings.shopNameUr}
              </p>
              {settings.city && (
                <p className="text-xs text-emerald-100">{settings.city}</p>
              )}
            </div>
          )}
        </div>

        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-2xl bg-white/10 p-4 backdrop-blur-sm">
            <span className="text-xs font-medium text-emerald-100">{t.todaySales}</span>
            <p className="ltr-num mt-1 text-2xl font-extrabold text-white">
              {formatRs(summary.todaySalesAmount)}
            </p>
          </div>
          <div className="rounded-2xl bg-white/10 p-4 backdrop-blur-sm">
            <span className="text-xs font-medium text-emerald-100">{t.todayPurchase}</span>
            <p className="ltr-num mt-1 text-2xl font-extrabold text-white">
              {formatRs(summary.todayPurchaseAmount)}
            </p>
          </div>
          <div className="rounded-2xl bg-white/15 p-4 backdrop-blur-sm">
            <span className="text-xs font-medium text-[#F2CC70]">{t.todayCommission}</span>
            {commissionConfigured ? (
              <>
                <p className="ltr-num mt-1 text-2xl font-extrabold text-[#F2CC70]">
                  {formatRs(summary.todayCommissionAmount)}
                </p>
                {!commissionActive && (
                  <p className="mt-1 text-xs text-emerald-100">{t.commissionOffHint}</p>
                )}
              </>
            ) : (
              <>
                <p className="ltr-num mt-1 text-2xl font-extrabold text-[#F2CC70]">—</p>
                <button
                  type="button"
                  onClick={() => onNavigate('settings')}
                  className="mt-1 text-xs font-medium text-emerald-100 underline decoration-[#F2CC70]/70 underline-offset-2 hover:text-white"
                >
                  {t.setCommissionHint}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Two BIG Primary Action Buttons */}
        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => onNavigate('sales')}
            className="flex min-h-[54px] items-center justify-center gap-2.5 rounded-2xl bg-[#D9AA45] px-5 py-3.5 text-base font-extrabold text-[#12452D] shadow-md transition hover:bg-[#e3b859] active:scale-[0.99]"
          >
            <ArrowUpRight className="h-5 w-5" />
            <span>{t.addSaleBtn}</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigate('purchase')}
            className="flex min-h-[54px] items-center justify-center gap-2.5 rounded-2xl bg-white px-5 py-3.5 text-base font-extrabold text-[#12452D] shadow-md transition hover:bg-emerald-50 active:scale-[0.99]"
          >
            <ArrowDownLeft className="h-5 w-5 text-[#0B7D50]" />
            <span>{t.addPurchaseBtn}</span>
          </button>
        </div>
      </section>

      {/* 4 Summary Stat Cards */}
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-300">
            <span>{t.todaySalesWeight}</span>
            <Scale className="h-4 w-4 text-[#0B7D50]" />
          </div>
          <p className="ltr-num mt-2 text-xl font-extrabold text-slate-900 dark:text-slate-100">
            {formatNumber(summary.todaySalesWeightKg)} KG
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-300">
            <span>{t.todayPurchaseWeight}</span>
            <Scale className="h-4 w-4 text-[#D9AA45]" />
          </div>
          <p className="ltr-num mt-2 text-xl font-extrabold text-slate-900 dark:text-slate-100">
            {formatNumber(summary.todayPurchaseWeightKg)} KG
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-300">
            <span>{t.todayTransactions}</span>
            <FileText className="h-4 w-4 text-[#0B7D50]" />
          </div>
          <p className="ltr-num mt-2 text-xl font-extrabold text-slate-900 dark:text-slate-100">
            {formatNumber(summary.todayTransactionCount, 0)}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-300">
            <span>{t.totalRecordsSaved}</span>
            <BookOpen className="h-4 w-4 text-[#12452D] dark:text-emerald-400" />
          </div>
          <p className="ltr-num mt-2 text-xl font-extrabold text-slate-900 dark:text-slate-100">
            {formatNumber(summary.totalRecordsCount, 0)}
          </p>
        </div>
      </section>

      {/* Quick Actions */}
      <section>
        <h2 className="mb-3 text-base font-bold text-slate-900 dark:text-slate-100">
          {t.quickActions}
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <button
            type="button"
            onClick={() => onOpenCalculator('commission')}
            className="flex min-h-[60px] items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3.5 text-start text-sm font-semibold text-slate-900 shadow-sm transition hover:border-[#0B7D50] dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-[#0B7D50] dark:bg-emerald-950 dark:text-emerald-400">
              <Calculator className="h-5 w-5" />
            </div>
            <span>{t.commissionCalc}</span>
          </button>

          <button
            type="button"
            onClick={() => onOpenQuickSlip('sale')}
            className="flex min-h-[60px] items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3.5 text-start text-sm font-semibold text-slate-900 shadow-sm transition hover:border-[#0B7D50] dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-[#9c7218] dark:bg-amber-950/60 dark:text-[#F2CC70]">
              <Plus className="h-5 w-5" />
            </div>
            <span>{t.newSaleSlip}</span>
          </button>

          <button
            type="button"
            onClick={() => onOpenQuickSlip('purchase')}
            className="flex min-h-[60px] items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3.5 text-start text-sm font-semibold text-slate-900 shadow-sm transition hover:border-[#0B7D50] dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-[#0B7D50] dark:bg-emerald-950 dark:text-emerald-400">
              <Plus className="h-5 w-5" />
            </div>
            <span>{t.newPurchaseSlip}</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('khata')}
            className="flex min-h-[60px] items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3.5 text-start text-sm font-semibold text-slate-900 shadow-sm transition hover:border-[#0B7D50] dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-[#0B7D50] dark:bg-emerald-950 dark:text-emerald-400">
              <BookOpen className="h-5 w-5" />
            </div>
            <span>{t.navKhata}</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('reports')}
            className="flex min-h-[60px] items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3.5 text-start text-sm font-semibold text-slate-900 shadow-sm transition hover:border-[#0B7D50] dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-[#0B7D50] dark:bg-emerald-950 dark:text-emerald-400">
              <BarChart3 className="h-5 w-5" />
            </div>
            <span>{t.navReports}</span>
          </button>
        </div>
      </section>

      {/* Recent Transactions / Attractive Empty State */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
            {t.recentTransactions}
          </h2>
          {recentRecords.length > 0 && (
            <button
              type="button"
              onClick={() => onNavigate('reports')}
              className="text-xs font-semibold text-[#0B7D50] hover:underline dark:text-emerald-400"
            >
              {t.navReports}
            </button>
          )}
        </div>

        {recentRecords.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center dark:border-slate-700 dark:bg-slate-900">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F5F2E7] text-[#0B7D50] dark:bg-slate-800 dark:text-emerald-400">
              <Sprout className="h-7 w-7" />
            </div>
            <h3 className="mt-4 text-lg font-bold text-slate-900 dark:text-slate-100">
              {t.emptyDashboardTitle}
            </h3>
            <p className="mx-auto mt-1.5 max-w-md text-sm text-slate-600 dark:text-slate-300">
              {t.emptyDashboardDesc}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {recentRecords.map((rec) => {
              const isSale = rec.type === 'sale';
              const cropName =
                language === 'ur'
                  ? rec.cropNameUr || rec.cropNameEn
                  : rec.cropNameEn || rec.cropNameUr;

              return (
                <button
                  key={rec.id}
                  type="button"
                  onClick={() => onViewSlip(rec)}
                  className="flex w-full items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-start shadow-sm transition hover:border-[#0B7D50] dark:border-slate-800 dark:bg-slate-900 dark:hover:border-emerald-500"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                        isSale
                          ? 'bg-amber-50 text-[#9c7218] dark:bg-amber-950/60 dark:text-[#F2CC70]'
                          : 'bg-emerald-50 text-[#0B7D50] dark:bg-emerald-950/60 dark:text-emerald-400'
                      }`}
                    >
                      {isSale ? (
                        <ArrowUpRight className="h-5 w-5" />
                      ) : (
                        <ArrowDownLeft className="h-5 w-5" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-slate-900 dark:text-slate-100">
                        {rec.partyName}
                      </p>
                      <p className="mt-0.5 truncate text-xs text-slate-600 dark:text-slate-300">
                        <span className="ltr-num font-semibold">{rec.refNo}</span>
                        {' · '}
                        <span>{cropName}</span>
                        {' · '}
                        <span className="ltr-num">{rec.date}</span>
                      </p>
                    </div>
                  </div>

                  <div className="shrink-0 text-end">
                    <p className="ltr-num text-base font-extrabold text-slate-900 dark:text-slate-100">
                      {formatRs(rec.totalMizan)}
                    </p>
                    <p className="ltr-num text-xs font-medium text-slate-600 dark:text-slate-300">
                      {formatNumber(rec.netWeightKg)} KG
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};

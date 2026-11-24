import React, { useState } from 'react';
import {
  ArrowDownLeft,
  ArrowUpRight,
  BarChart3,
  BookOpen,
  BookOpenText,
  Calculator,
  FileText,
  Layers,
  List,
  Plus,
  Scale,
  Sparkles,
  Sprout,
  X,
} from 'lucide-react';
import {
  AdBanner,
  AppLanguage,
  AppSettings,
  GlobalAppConfig,
  PurchaseRecord,
  QuickNote,
  QuickNoteTag,
  RoznamchaEntry,
  RoznamchaSettings,
  SaleRecord,
  TradeRecord,
} from '../types/mandi';
import { Translations } from '../i18n/translations';
import { QuickNotesCard } from './QuickNotesCard';
import {
  calculateDashboardSummary,
  calculateRoznamchaDay,
  formatNumber,
  formatRs,
  getTodayISO,
} from '../utils/calculations';

export type ActiveTab =
  | 'home'
  | 'sales'
  | 'purchase'
  | 'roznamcha'
  | 'khata'
  | 'calculators'
  | 'reports'
  | 'tutorial'
  | 'about'
  | 'premium'
  | 'settings'
  | 'admin';

interface DashboardProps {
  language: AppLanguage;
  t: Translations;
  settings: AppSettings;
  sales: SaleRecord[];
  purchases: PurchaseRecord[];
  roznamchaEntries: RoznamchaEntry[];
  roznamchaSettings: RoznamchaSettings;
  quickNotes: QuickNote[];
  activeAd: AdBanner | null;
  globalConfig: GlobalAppConfig;
  onAddQuickNote: (text: string, tag: QuickNoteTag) => void;
  onToggleQuickNoteDone: (id: string) => void;
  onToggleQuickNotePin: (id: string) => void;
  onEditQuickNote: (id: string, text: string, tag: QuickNoteTag) => void;
  onDeleteQuickNote: (id: string) => void;
  onClearDoneQuickNotes: () => void;
  onDismissAd: (adId: string) => void;
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
  roznamchaEntries,
  roznamchaSettings,
  quickNotes,
  activeAd,
  globalConfig,
  onAddQuickNote,
  onToggleQuickNoteDone,
  onToggleQuickNotePin,
  onEditQuickNote,
  onDeleteQuickNote,
  onClearDoneQuickNotes,
  onDismissAd,
  onNavigate,
  onOpenQuickSlip,
  onOpenCalculator,
  onViewSlip,
}) => {
  const [viewMode, setViewMode] = useState<'total' | 'detail'>('total');
  const [expandedTodayType, setExpandedTodayType] = useState<'all' | 'sale' | 'purchase'>('all');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSummaryText, setAiSummaryText] = useState<string | null>(null);

  const today = getTodayISO();
  const summary = calculateDashboardSummary(sales, purchases, today);
  const roznamchaToday = calculateRoznamchaDay(
    roznamchaEntries,
    today,
    roznamchaSettings
  );

  const allSortedRecords: TradeRecord[] = [...sales, ...purchases].sort((a, b) => {
    const dateCmp = b.date.localeCompare(a.date);
    if (dateCmp !== 0) return dateCmp;
    return b.createdAt.localeCompare(a.createdAt);
  });

  const recentRecords = allSortedRecords.slice(0, 8);
  const detailRecords =
    viewMode === 'detail'
      ? allSortedRecords
          .filter((r) =>
            expandedTodayType === 'all' ? true : r.type === expandedTodayType
          )
          .slice(0, 20)
      : recentRecords;

  const commissionConfigured = settings.commissionPercent > 0;
  const commissionActive =
    commissionConfigured && settings.commissionMode !== 'off';

  const handleGenerateAiSummary = async () => {
    setAiLoading(true);
    try {
      const res = await fetch('/api/ai/summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          language,
          todayDate: today,
          shopName:
            language === 'ur'
              ? settings.shopNameUr || settings.shopNameEn
              : settings.shopNameEn || settings.shopNameUr,
          summary,
          recentRecords: allSortedRecords.slice(0, 10),
        }),
      });
      const data = (await res.json()) as { configured?: boolean; text?: string };
      if (res.status === 503 || !data.configured || !res.ok) {
        setAiSummaryText(t.aiPremiumComingSoon);
      } else {
        setAiSummaryText(data.text || t.aiPremiumComingSoon);
      }
    } catch {
      setAiSummaryText(t.aiPremiumComingSoon);
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Dismissible Ad Banner (Max 1 Active) */}
      {activeAd && (
        <section className="relative overflow-hidden rounded-2xl border border-[#D9AA45]/50 bg-white p-4 shadow-sm dark:border-[#D9AA45]/30 dark:bg-slate-900">
          <button
            type="button"
            onClick={() => onDismissAd(activeAd.id)}
            aria-label={t.dismissAd}
            className="absolute end-3 top-3 rounded-lg bg-slate-100 p-1.5 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
          >
            <X className="h-4 w-4" />
          </button>
          <div className="flex flex-wrap items-center gap-4 pe-8">
            {activeAd.imageUrl && (
              <img
                src={activeAd.imageUrl}
                alt={activeAd.title}
                className="h-16 w-24 rounded-xl object-cover"
              />
            )}
            <div className="min-w-0 flex-1">
              <span className="inline-block rounded bg-amber-100 px-2 py-0.5 text-[10px] font-extrabold text-amber-900 dark:bg-amber-950 dark:text-[#F2CC70]">
                {t.sponsoredLabel}
              </span>
              <h2 className="mt-1 text-base font-extrabold text-slate-900 dark:text-slate-100">
                {activeAd.title}
              </h2>
              {activeAd.description && (
                <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-300">
                  {activeAd.description}
                </p>
              )}
            </div>
            {activeAd.buttonLink && activeAd.buttonText && (
              <a
                href={activeAd.buttonLink}
                target="_blank"
                rel="noopener noreferrer"
                className="min-h-[40px] rounded-xl bg-[#0B7D50] px-4 py-2 text-xs font-extrabold text-white hover:bg-[#12452D]"
              >
                {activeAd.buttonText}
              </a>
            )}
          </div>
        </section>
      )}

      {/* Hero Khata Card */}
      <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-[#0B7D50] to-[#12452D] p-5 text-white shadow-lg sm:p-7">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-emerald-100">{t.todayAccount}</p>
            <p className="ltr-num mt-0.5 text-xs text-emerald-200">{today}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {/* Total View vs Detail View Toggle */}
            <div className="flex items-center rounded-xl bg-black/20 p-1">
              <button
                type="button"
                onClick={() => {
                  setViewMode('total');
                  setExpandedTodayType('all');
                }}
                className={`flex min-h-[32px] items-center gap-1 rounded-lg px-3 py-1 text-xs font-bold transition ${
                  viewMode === 'total'
                    ? 'bg-[#D9AA45] text-[#12452D]'
                    : 'text-emerald-100 hover:text-white'
                }`}
              >
                <Layers className="h-3.5 w-3.5" />
                <span>{t.totalViewLabel}</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('detail')}
                className={`flex min-h-[32px] items-center gap-1 rounded-lg px-3 py-1 text-xs font-bold transition ${
                  viewMode === 'detail'
                    ? 'bg-[#D9AA45] text-[#12452D]'
                    : 'text-emerald-100 hover:text-white'
                }`}
              >
                <List className="h-3.5 w-3.5" />
                <span>{t.detailViewLabel}</span>
              </button>
            </div>
          </div>
        </div>

        {(settings.shopNameUr || settings.shopNameEn) && (
          <div className="mt-2">
            <p className="text-sm font-bold text-[#F2CC70]">
              {language === 'ur'
                ? settings.shopNameUr || settings.shopNameEn
                : settings.shopNameEn || settings.shopNameUr}
              {settings.city ? ` · ${settings.city}` : ''}
            </p>
          </div>
        )}

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <button
            type="button"
            onClick={() => {
              setExpandedTodayType('sale');
              setViewMode('detail');
            }}
            className="rounded-2xl bg-white/10 p-4 text-start backdrop-blur-sm transition hover:bg-white/15"
          >
            <span className="text-xs font-medium text-emerald-100">{t.todaySales}</span>
            <p className="ltr-num mt-1 text-2xl font-extrabold text-white">
              {formatRs(summary.todaySalesAmount)}
            </p>
            <p className="mt-1 text-[11px] text-emerald-200">{t.tapToViewDetails}</p>
          </button>

          <button
            type="button"
            onClick={() => {
              setExpandedTodayType('purchase');
              setViewMode('detail');
            }}
            className="rounded-2xl bg-white/10 p-4 text-start backdrop-blur-sm transition hover:bg-white/15"
          >
            <span className="text-xs font-medium text-emerald-100">{t.todayPurchase}</span>
            <p className="ltr-num mt-1 text-2xl font-extrabold text-white">
              {formatRs(summary.todayPurchaseAmount)}
            </p>
            <p className="mt-1 text-[11px] text-emerald-200">{t.tapToViewDetails}</p>
          </button>

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

      {/* Today's Roznamcha Summary Card + AI Summary Card */}
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <button
          type="button"
          onClick={() => onNavigate('roznamcha')}
          className="flex flex-col justify-between rounded-3xl border border-slate-200 bg-white p-5 text-start shadow-sm transition hover:border-[#0B7D50] dark:border-slate-800 dark:bg-slate-900"
        >
          <div className="flex w-full items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-[#0B7D50] dark:bg-emerald-950 dark:text-emerald-400">
                <BookOpenText className="h-5 w-5" />
              </div>
              <span className="text-base font-extrabold text-slate-900 dark:text-slate-100">
                {t.todayRoznamchaCard}
              </span>
            </div>
            <span className="text-xs font-bold text-[#0B7D50] dark:text-emerald-400">
              {t.navRoznamcha}
            </span>
          </div>
          <div className="mt-4 grid w-full grid-cols-3 gap-2">
            <div className="rounded-xl bg-emerald-50/70 p-2.5 dark:bg-emerald-950/30">
              <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                {t.roznamchaAaye}
              </span>
              <p className="ltr-num mt-0.5 text-sm font-extrabold text-[#0B7D50] dark:text-emerald-400">
                {formatRs(roznamchaToday.aajKulAaye)}
              </p>
            </div>
            <div className="rounded-xl bg-rose-50/70 p-2.5 dark:bg-rose-950/30">
              <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                {t.roznamchaGaye}
              </span>
              <p className="ltr-num mt-0.5 text-sm font-extrabold text-rose-700 dark:text-rose-400">
                {formatRs(roznamchaToday.aajKulGaye)}
              </p>
            </div>
            <div className="rounded-xl bg-[#F5F2E7] p-2.5 dark:bg-slate-800">
              <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                {t.roznamchaKulBaqi}
              </span>
              <p
                className={`ltr-num mt-0.5 text-sm font-extrabold ${
                  roznamchaToday.kulBaqi < 0
                    ? 'text-red-600 dark:text-red-400'
                    : 'text-[#12452D] dark:text-emerald-300'
                }`}
              >
                {formatRs(roznamchaToday.kulBaqi)}
              </p>
            </div>
          </div>
        </button>

        {globalConfig.aiEnabled && globalConfig.aiDailySummaryEnabled && (
          <div className="flex flex-col justify-between rounded-3xl border border-[#D9AA45]/40 bg-white p-5 shadow-sm dark:border-[#D9AA45]/30 dark:bg-slate-900">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-[#9c7218] dark:bg-amber-950/60 dark:text-[#F2CC70]">
                  <Sparkles className="h-5 w-5" />
                </div>
                <span className="text-base font-extrabold text-slate-900 dark:text-slate-100">
                  {t.aiDailySummaryTitle}
                </span>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('premium')}
                className="text-xs font-bold text-[#0B7D50] hover:underline dark:text-emerald-400"
              >
                {t.navPremium}
              </button>
            </div>
            <div className="mt-3">
              {aiSummaryText ? (
                <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-200">
                  {aiSummaryText}
                </p>
              ) : (
                <button
                  type="button"
                  disabled={aiLoading}
                  onClick={handleGenerateAiSummary}
                  className="min-h-[42px] w-full rounded-xl bg-[#F5F2E7] px-4 py-2 text-xs font-extrabold text-[#12452D] transition hover:bg-amber-100 dark:bg-slate-800 dark:text-[#F2CC70]"
                >
                  {aiLoading ? '...' : t.aiGenerateSummaryBtn}
                </button>
              )}
            </div>
          </div>
        )}
      </section>

      {/* 4 Summary Stat Cards (visible in Total View) */}
      {viewMode === 'total' && (
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
      )}

      {/* Quick Actions */}
      <section>
        <h2 className="mb-3 text-base font-bold text-slate-900 dark:text-slate-100">
          {t.quickActions}
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <button
            type="button"
            onClick={() => onNavigate('roznamcha')}
            className="flex min-h-[60px] items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3.5 text-start text-sm font-semibold text-slate-900 shadow-sm transition hover:border-[#0B7D50] dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-[#0B7D50] dark:bg-emerald-950 dark:text-emerald-400">
              <BookOpenText className="h-5 w-5" />
            </div>
            <span>{t.navRoznamcha}</span>
          </button>

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

      {/* Quick Notes (Informal daily rates, tasks & reminders) */}
      <QuickNotesCard
        language={language}
        t={t}
        notes={quickNotes}
        onAddNote={onAddQuickNote}
        onToggleDone={onToggleQuickNoteDone}
        onTogglePin={onToggleQuickNotePin}
        onEditNote={onEditQuickNote}
        onDeleteNote={onDeleteQuickNote}
        onClearDone={onClearDoneQuickNotes}
      />

      {/* Recent Transactions / Detailed Transactions */}
      <section>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
            {viewMode === 'detail' ? t.detailViewLabel : t.recentTransactions}
          </h2>
          {viewMode === 'detail' && expandedTodayType !== 'all' && (
            <button
              type="button"
              onClick={() => setExpandedTodayType('all')}
              className="text-xs font-bold text-[#0B7D50] hover:underline dark:text-emerald-400"
            >
              {t.all}
            </button>
          )}
        </div>

        {detailRecords.length === 0 ? (
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
            {detailRecords.map((rec) => {
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

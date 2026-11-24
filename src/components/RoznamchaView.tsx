import React, { useMemo, useState } from 'react';
import {
  ArrowDownLeft,
  ArrowUpRight,
  BookOpenText,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Edit3,
  FolderCog,
  ListOrdered,
  PieChart,
  Plus,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import {
  AppLanguage,
  AppSettings,
  PaymentMethod,
  RoznamchaEntry,
  RoznamchaSettings,
  RoznamchaSide,
} from '../types/mandi';
import { Translations } from '../i18n/translations';
import {
  buildRoznamchaCategoryReport,
  calculateRoznamchaDay,
  calculateRoznamchaMonth,
  calculateRoznamchaRange,
  formatRs,
  getTodayISO,
} from '../utils/calculations';
import { ConfirmDialog } from './ConfirmDialog';

interface RoznamchaViewProps {
  language: AppLanguage;
  t: Translations;
  settings: AppSettings;
  entries: RoznamchaEntry[];
  roznamchaSettings: RoznamchaSettings;
  knownParties: string[];
  onSaveEntry: (
    data: Omit<RoznamchaEntry, 'id' | 'createdAt'>,
    editingId?: string
  ) => void;
  onDeleteEntry: (id: string) => void;
  onUpdateRoznamchaSettings: (next: RoznamchaSettings) => void;
}

type RoznamchaSubTab = 'diary' | 'detail' | 'month' | 'categories' | 'settings';

function shiftIsoDate(isoDate: string, deltaDays: number): string {
  const parts = isoDate.split('-').map(Number);
  if (parts.length !== 3) return getTodayISO();
  const d = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2] + deltaDays));
  return d.toISOString().slice(0, 10);
}

function getDayPageNumber(isoDate: string): number {
  const parts = isoDate.split('-').map(Number);
  if (parts.length !== 3) return 1;
  const start = Date.UTC(parts[0], 0, 1);
  const current = Date.UTC(parts[0], parts[1] - 1, parts[2]);
  return Math.max(1, Math.round((current - start) / 86400000) + 1);
}

function formatUrduDisplayDate(isoDate: string, language: AppLanguage): string {
  const parts = isoDate.split('-').map(Number);
  if (parts.length !== 3) return isoDate;
  const dt = new Date(parts[0], parts[1] - 1, parts[2]);
  try {
    return new Intl.DateTimeFormat(language === 'ur' ? 'ur-PK' : 'en-PK', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(dt);
  } catch {
    return isoDate;
  }
}

export const RoznamchaView: React.FC<RoznamchaViewProps> = ({
  language,
  t,
  settings,
  entries,
  roznamchaSettings,
  knownParties,
  onSaveEntry,
  onDeleteEntry,
  onUpdateRoznamchaSettings,
}) => {
  const today = getTodayISO();
  const [selectedDate, setSelectedDate] = useState<string>(today);
  const [selectedMonth, setSelectedMonth] = useState<string>(today.slice(0, 7));
  const [subTab, setSubTab] = useState<RoznamchaSubTab>('diary');
  const [mobileSideTab, setMobileSideTab] = useState<RoznamchaSide>('in');

  // Detail table & category range filters
  const [rangeFrom, setRangeFrom] = useState<string>(today);
  const [rangeTo, setRangeTo] = useState<string>(today);
  const [detailSearch, setDetailSearch] = useState<string>('');

  // Quick Entry Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEntryId, setEditingEntryId] = useState<string | undefined>(undefined);
  const [entrySide, setEntrySide] = useState<RoznamchaSide>('in');
  const [entryDate, setEntryDate] = useState<string>(today);
  const [entryAmount, setEntryAmount] = useState<string>('');
  const [entryTafseel, setEntryTafseel] = useState<string>('');
  const [entryCategory, setEntryCategory] = useState<string>('');
  const [entryPartyName, setEntryPartyName] = useState<string>('');
  const [entryMethod, setEntryMethod] = useState<PaymentMethod>('Cash');
  const [entryNote, setEntryNote] = useState<string>('');
  const [formError, setFormError] = useState<string>('');

  // Delete Confirm
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Category CRUD state
  const [newInCat, setNewInCat] = useState('');
  const [newOutCat, setNewOutCat] = useState('');
  const [editingCat, setEditingCat] = useState<{
    side: RoznamchaSide;
    idx: number;
    value: string;
  } | null>(null);

  const daySummary = useMemo(
    () => calculateRoznamchaDay(entries, selectedDate, roznamchaSettings),
    [entries, selectedDate, roznamchaSettings]
  );

  const detailRangeData = useMemo(
    () =>
      calculateRoznamchaRange(
        entries,
        roznamchaSettings,
        rangeFrom || undefined,
        rangeTo || undefined
      ),
    [entries, roznamchaSettings, rangeFrom, rangeTo]
  );

  const filteredDetailRows = useMemo(() => {
    const q = detailSearch.trim().toLowerCase();
    if (!q) return detailRangeData.rows;
    return detailRangeData.rows.filter((r) => {
      const hay = [
        r.tafseel,
        r.category,
        r.partyName || '',
        r.note || '',
        String(r.amount),
      ]
        .join(' ')
        .toLowerCase();
      return hay.includes(q);
    });
  }, [detailRangeData.rows, detailSearch]);

  const monthSummary = useMemo(
    () => calculateRoznamchaMonth(entries, selectedMonth, roznamchaSettings),
    [entries, selectedMonth, roznamchaSettings]
  );

  const categorySummary = useMemo(
    () =>
      buildRoznamchaCategoryReport(
        entries,
        rangeFrom || undefined,
        rangeTo || undefined
      ),
    [entries, rangeFrom, rangeTo]
  );

  const shopDisplayName =
    language === 'ur'
      ? settings.shopNameUr || settings.shopNameEn || t.defaultShopName
      : settings.shopNameEn || settings.shopNameUr || t.defaultShopName;

  const openAddModal = (side: RoznamchaSide) => {
    setEditingEntryId(undefined);
    setEntrySide(side);
    setEntryDate(selectedDate);
    setEntryAmount('');
    setEntryTafseel('');
    const cats =
      side === 'in'
        ? roznamchaSettings.inCategories
        : roznamchaSettings.outCategories;
    setEntryCategory(cats[0] || '');
    setEntryPartyName('');
    setEntryMethod('Cash');
    setEntryNote('');
    setFormError('');
    setModalOpen(true);
  };

  const openEditModal = (entry: RoznamchaEntry) => {
    setEditingEntryId(entry.id);
    setEntrySide(entry.side);
    setEntryDate(entry.date);
    setEntryAmount(String(entry.amount));
    setEntryTafseel(entry.tafseel);
    setEntryCategory(entry.category || '');
    setEntryPartyName(entry.partyName || '');
    setEntryMethod(entry.method || 'Cash');
    setEntryNote(entry.note || '');
    setFormError('');
    setModalOpen(true);
  };

  const handleSaveModal = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = Math.round(Number(entryAmount) || 0);
    if (amt <= 0) {
      setFormError(language === 'ur' ? 'براہ کرم درست رقم درج کریں۔' : 'Please enter a valid amount.');
      return;
    }
    if (!entryTafseel.trim()) {
      setFormError(language === 'ur' ? 'براہ کرم تفصیل درج کریں۔' : 'Please enter description / tafseel.');
      return;
    }
    onSaveEntry(
      {
        date: entryDate,
        side: entrySide,
        amount: amt,
        tafseel: entryTafseel.trim(),
        category:
          entryCategory.trim() ||
          (entrySide === 'in'
            ? roznamchaSettings.inCategories[0] || 'دیگر آمد'
            : roznamchaSettings.outCategories[0] || 'دیگر خرچ'),
        partyName: entryPartyName.trim() || undefined,
        method: entryMethod,
        note: entryNote.trim() || undefined,
      },
      editingEntryId
    );
    setModalOpen(false);
  };

  const handleAddCategory = (side: RoznamchaSide) => {
    const val = (side === 'in' ? newInCat : newOutCat).trim();
    if (!val) return;
    if (side === 'in') {
      if (!roznamchaSettings.inCategories.includes(val)) {
        onUpdateRoznamchaSettings({
          ...roznamchaSettings,
          inCategories: [...roznamchaSettings.inCategories, val],
        });
      }
      setNewInCat('');
    } else {
      if (!roznamchaSettings.outCategories.includes(val)) {
        onUpdateRoznamchaSettings({
          ...roznamchaSettings,
          outCategories: [...roznamchaSettings.outCategories, val],
        });
      }
      setNewOutCat('');
    }
  };

  const handleDeleteCategory = (side: RoznamchaSide, idx: number) => {
    if (side === 'in' && roznamchaSettings.inCategories.length > 1) {
      onUpdateRoznamchaSettings({
        ...roznamchaSettings,
        inCategories: roznamchaSettings.inCategories.filter((_, i) => i !== idx),
      });
    } else if (side === 'out' && roznamchaSettings.outCategories.length > 1) {
      onUpdateRoznamchaSettings({
        ...roznamchaSettings,
        outCategories: roznamchaSettings.outCategories.filter((_, i) => i !== idx),
      });
    }
  };

  const handleSaveCategoryEdit = () => {
    if (!editingCat || !editingCat.value.trim()) {
      setEditingCat(null);
      return;
    }
    if (editingCat.side === 'in') {
      const next = [...roznamchaSettings.inCategories];
      next[editingCat.idx] = editingCat.value.trim();
      onUpdateRoznamchaSettings({ ...roznamchaSettings, inCategories: next });
    } else {
      const next = [...roznamchaSettings.outCategories];
      next[editingCat.idx] = editingCat.value.trim();
      onUpdateRoznamchaSettings({ ...roznamchaSettings, outCategories: next });
    }
    setEditingCat(null);
  };

  const renderPaperPage = (side: RoznamchaSide) => {
    const isIn = side === 'in';
    const list = isIn ? daySummary.inEntries : daySummary.outEntries;
    const sideTotal = isIn ? daySummary.aajKulAaye : daySummary.aajKulGaye;
    const isUrdu = language === 'ur';

    return (
      <div
        dir={isUrdu ? 'rtl' : 'ltr'}
        className={`flex flex-col overflow-hidden rounded-2xl border-2 shadow-sm ${
          isIn
            ? 'border-emerald-700/30 bg-[#FFFDF7] dark:border-emerald-700/50 dark:bg-slate-900'
            : 'border-rose-700/30 bg-[#FFFDF7] dark:border-rose-700/50 dark:bg-slate-900'
        }`}
      >
        {/* Register Page Header */}
        <div
          className={`flex items-center justify-between border-b-2 px-4 py-3 ${
            isIn
              ? 'border-emerald-600/30 bg-emerald-800 text-white dark:bg-emerald-950'
              : 'border-rose-600/30 bg-rose-800 text-white dark:bg-rose-950'
          }`}
        >
          <div>
            <h2 className="text-base font-extrabold">
              {isIn ? t.roznamchaLeftTitle : t.roznamchaRightTitle}
            </h2>
            <p className="text-[11px] opacity-90">
              {isIn
                ? isUrdu
                  ? 'دائیں صفحہ · وصولی / آمدنی'
                  : 'Right Page · Money Received'
                : isUrdu
                  ? 'بائیں صفحہ · ادائیگی / خرچہ'
                  : 'Left Page · Money Spent'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => openAddModal(side)}
            className="flex min-h-[38px] items-center gap-1 rounded-xl bg-white px-3 py-1.5 text-xs font-extrabold text-slate-900 shadow-sm transition hover:bg-amber-50"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>{isIn ? t.roznamchaAddInBtn.replace(/^\+\s*/, '') : t.roznamchaAddOutBtn.replace(/^\+\s*/, '')}</span>
          </button>
        </div>

        {/* Column Header matching traditional paper bahi: نمبر | تفصیل | رقم */}
        <div className="grid grid-cols-12 border-b-2 border-amber-700/30 bg-amber-50/70 px-3 py-2 text-xs font-extrabold text-slate-700 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-200">
          <div className="col-span-2 text-start">{isUrdu ? 'نمبر' : '#'}</div>
          <div className="col-span-6 text-start">
            {isIn
              ? isUrdu
                ? 'تفصیل آمدن'
                : 'Tafseel (In)'
              : isUrdu
                ? 'تفصیل خرچ'
                : 'Tafseel (Out)'}
          </div>
          <div className="col-span-4 text-end">{isUrdu ? 'رقم (Rs)' : 'Amount'}</div>
        </div>

        {/* Ruled Notebook Lines */}
        <div className="flex-1 divide-y divide-dashed divide-amber-800/20 dark:divide-slate-800">
          {list.length === 0 ? (
            <div className="flex min-h-[180px] flex-col items-center justify-center p-6 text-center text-xs text-slate-500 dark:text-slate-400">
              <p>
                {isUrdu
                  ? isIn
                    ? 'آج آمدن کا کوئی اندراج نہیں۔'
                    : 'آج خرچ کا کوئی اندراج نہیں۔'
                  : isIn
                    ? 'No cash-in entries for this date.'
                    : 'No cash-out entries for this date.'}
              </p>
            </div>
          ) : (
            list.map((entry, idx) => (
              <div
                key={entry.id}
                className="grid grid-cols-12 items-start gap-2 px-3 py-2.5 text-sm transition hover:bg-amber-50/50 dark:hover:bg-slate-800/40"
              >
                <div className="ltr-num col-span-2 pt-0.5 text-xs font-bold text-slate-500 dark:text-slate-400">
                  {idx + 1}
                </div>
                <div className="col-span-6 min-w-0">
                  <p className="font-bold text-slate-900 dark:text-slate-100">
                    {entry.tafseel}
                  </p>
                  <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[11px] text-slate-600 dark:text-slate-400">
                    <span className="rounded bg-slate-100 px-1.5 py-0.5 font-semibold dark:bg-slate-800">
                      {entry.category}
                    </span>
                    {entry.partyName && (
                      <span className="font-semibold text-[#0B7D50] dark:text-emerald-400">
                        · {entry.partyName}
                      </span>
                    )}
                    {entry.method && entry.method !== 'Cash' && (
                      <span className="ltr-num">· {entry.method}</span>
                    )}
                  </div>
                  {entry.note && (
                    <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                      {entry.note}
                    </p>
                  )}
                </div>
                <div className="col-span-4 flex flex-col items-end gap-1">
                  <span
                    className={`ltr-num font-extrabold ${
                      isIn
                        ? 'text-[#0B7D50] dark:text-emerald-400'
                        : 'text-rose-700 dark:text-rose-400'
                    }`}
                  >
                    {formatRs(entry.amount)}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => openEditModal(entry)}
                      aria-label={`${t.edit} ${entry.tafseel}`}
                      className="rounded-lg p-1 text-slate-500 hover:bg-slate-200 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-700"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteId(entry.id)}
                      aria-label={`${t.delete} ${entry.tafseel}`}
                      className="rounded-lg p-1 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/60"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Page Bottom Total */}
        <div
          className={`flex items-center justify-between border-t-2 px-4 py-3 text-sm font-extrabold ${
            isIn
              ? 'border-emerald-700/30 bg-emerald-50 text-[#12452D] dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300'
              : 'border-rose-700/30 bg-rose-50 text-rose-900 dark:border-rose-800 dark:bg-rose-950/50 dark:text-rose-300'
          }`}
        >
          <span>{isIn ? t.aajKulAayeLabel : t.aajKulGayeLabel}</span>
          <span className="ltr-num text-base">{formatRs(sideTotal)}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-5">
      {/* Header & Top Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 dark:text-slate-100">
            {t.roznamchaTitle}
          </h1>
          <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-300">
            {t.roznamchaSubtitle}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => openAddModal('in')}
            className="flex min-h-[44px] items-center gap-1.5 rounded-xl bg-[#0B7D50] px-4 py-2 text-xs font-extrabold text-white shadow-sm hover:bg-[#12452D]"
          >
            <ArrowDownLeft className="h-4 w-4" />
            <span>{t.roznamchaAddInBtn}</span>
          </button>
          <button
            type="button"
            onClick={() => openAddModal('out')}
            className="flex min-h-[44px] items-center gap-1.5 rounded-xl bg-rose-700 px-4 py-2 text-xs font-extrabold text-white shadow-sm hover:bg-rose-800"
          >
            <ArrowUpRight className="h-4 w-4" />
            <span>{t.roznamchaAddOutBtn}</span>
          </button>
        </div>
      </div>

      {/* Sub-navigation tabs */}
      <div className="flex flex-wrap gap-2">
        {(
          [
            { id: 'diary', label: t.roznamchaDayView, icon: BookOpenText },
            { id: 'detail', label: t.roznamchaSingleListView, icon: ListOrdered },
            { id: 'month', label: t.roznamchaMonthView, icon: Calendar },
            { id: 'categories', label: t.roznamchaCategoryReport, icon: PieChart },
            { id: 'settings', label: t.roznamchaSettingsTab, icon: FolderCog },
          ] as { id: RoznamchaSubTab; label: string; icon: React.ComponentType<{ className?: string }> }[]
        ).map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setSubTab(item.id)}
              className={`flex min-h-[40px] items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition ${
                subTab === item.id
                  ? 'bg-[#0B7D50] text-white shadow-sm'
                  : 'border border-slate-200 bg-white text-slate-800 hover:border-[#0B7D50] dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Date Navigation Strip (shown for Diary View) */}
      {subTab === 'diary' && (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setSelectedDate((d) => shiftIsoDate(d, -1))}
                className="flex min-h-[40px] items-center gap-1 rounded-xl border border-slate-300 px-3 py-1.5 text-xs font-bold text-slate-800 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-100 dark:hover:bg-slate-800"
              >
                {language === 'ur' ? (
                  <ChevronRight className="h-4 w-4" />
                ) : (
                  <ChevronLeft className="h-4 w-4" />
                )}
                <span>{t.roznamchaPrevDay}</span>
              </button>

              <input
                type="date"
                dir="ltr"
                aria-label={t.dateLabel}
                value={selectedDate}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val) {
                    setSelectedDate(val);
                    setRangeFrom(val);
                    setRangeTo(val);
                  }
                }}
                className="ltr-num min-h-[40px] rounded-xl border border-[#0B7D50]/40 bg-[#F5F2E7] px-3 py-1.5 text-sm font-bold text-[#12452D] dark:border-emerald-700 dark:bg-slate-800 dark:text-emerald-300"
              />

              <button
                type="button"
                onClick={() => setSelectedDate((d) => shiftIsoDate(d, 1))}
                className="flex min-h-[40px] items-center gap-1 rounded-xl border border-slate-300 px-3 py-1.5 text-xs font-bold text-slate-800 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-100 dark:hover:bg-slate-800"
              >
                <span>{t.roznamchaNextDay}</span>
                {language === 'ur' ? (
                  <ChevronLeft className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </button>

              {selectedDate !== today && (
                <button
                  type="button"
                  onClick={() => setSelectedDate(today)}
                  className="min-h-[40px] rounded-xl bg-[#D9AA45] px-3 py-1.5 text-xs font-extrabold text-[#12452D]"
                >
                  {t.roznamchaGoToday}
                </button>
              )}
            </div>

            <div className="text-xs font-semibold text-slate-600 dark:text-slate-300">
              <span>{shopDisplayName}</span>
              {' · '}
              <span>{formatUrduDisplayDate(selectedDate, language)}</span>
              {' · '}
              <span>
                {language === 'ur' ? 'صفحہ نمبر' : 'Page'}{' '}
                <span className="ltr-num font-bold">{getDayPageNumber(selectedDate)}</span>
              </span>
            </div>
          </div>

          {/* Daily Mizaan Summary Box */}
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-5">
            <div className="rounded-2xl border border-slate-200 bg-white p-3.5 dark:border-slate-800 dark:bg-slate-900">
              <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                {t.pichlaBaqiLabel}
              </span>
              <p
                className={`ltr-num mt-1 text-base font-extrabold ${
                  daySummary.pichlaBaqi < 0
                    ? 'text-red-600 dark:text-red-400'
                    : 'text-slate-900 dark:text-slate-100'
                }`}
              >
                {formatRs(daySummary.pichlaBaqi)}
              </p>
            </div>
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-3.5 dark:border-emerald-900 dark:bg-emerald-950/30">
              <span className="text-[11px] font-semibold text-[#12452D] dark:text-emerald-300">
                {t.aajKulAayeLabel}
              </span>
              <p className="ltr-num mt-1 text-base font-extrabold text-[#0B7D50] dark:text-emerald-400">
                {formatRs(daySummary.aajKulAaye)}
              </p>
            </div>
            <div className="rounded-2xl border border-rose-200 bg-rose-50/70 p-3.5 dark:border-rose-900 dark:bg-rose-950/30">
              <span className="text-[11px] font-semibold text-rose-900 dark:text-rose-300">
                {t.aajKulGayeLabel}
              </span>
              <p className="ltr-num mt-1 text-base font-extrabold text-rose-700 dark:text-rose-400">
                {formatRs(daySummary.aajKulGaye)}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-3.5 dark:border-slate-800 dark:bg-slate-900">
              <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                {t.aajKaBaqiLabel}
              </span>
              <p
                className={`ltr-num mt-1 text-base font-extrabold ${
                  daySummary.aajKaBaqi < 0
                    ? 'text-red-600 dark:text-red-400'
                    : 'text-slate-900 dark:text-slate-100'
                }`}
              >
                {formatRs(daySummary.aajKaBaqi)}
              </p>
            </div>
            <div
              className={`col-span-2 rounded-2xl p-3.5 sm:col-span-1 ${
                daySummary.kulBaqi < 0
                  ? 'border border-red-300 bg-red-600 text-white'
                  : 'bg-[#12452D] text-white'
              }`}
            >
              <span className="text-[11px] font-semibold text-white/90">
                {t.kulBaqiLabel}
              </span>
              <p className="ltr-num mt-1 text-lg font-extrabold text-[#F2CC70]">
                {formatRs(daySummary.kulBaqi)}
              </p>
            </div>
          </div>

          {/* Mobile Side Tabs (Right = Aamad first, Left = Kharch second) */}
          <div className="grid grid-cols-2 gap-2 md:hidden">
            <button
              type="button"
              onClick={() => setMobileSideTab('in')}
              className={`min-h-[44px] rounded-xl border text-xs font-extrabold ${
                mobileSideTab === 'in'
                  ? 'border-emerald-700 bg-emerald-700 text-white'
                  : 'border-slate-300 bg-white text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200'
              }`}
            >
              {t.roznamchaLeftTitle} ({daySummary.inEntries.length})
            </button>
            <button
              type="button"
              onClick={() => setMobileSideTab('out')}
              className={`min-h-[44px] rounded-xl border text-xs font-extrabold ${
                mobileSideTab === 'out'
                  ? 'border-rose-700 bg-rose-700 text-white'
                  : 'border-slate-300 bg-white text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200'
              }`}
            >
              {t.roznamchaRightTitle} ({daySummary.outEntries.length})
            </button>
          </div>

          {/* Mobile Single Side */}
          <div className="md:hidden">{renderPaperPage(mobileSideTab)}</div>

          {/* Wide Screen Open Paper Bahi: dir="rtl" puts col 1 (Aamad) on RIGHT and col 2 (Kharch) on LEFT */}
          <div
            dir="rtl"
            className="hidden gap-4 rounded-3xl border border-amber-900/20 bg-amber-950/5 p-3 shadow-inner md:grid md:grid-cols-2 dark:border-slate-700 dark:bg-slate-950/60"
          >
            {renderPaperPage('in')}
            {renderPaperPage('out')}
          </div>
        </>
      )}

      {/* Combined Detail View (Table: تاریخ | تفصیل | آمدنی | خرچہ | باقی رقم) */}
      {subTab === 'detail' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:grid-cols-4 dark:border-slate-800 dark:bg-slate-900">
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                {t.fromDate}
              </label>
              <input
                type="date"
                dir="ltr"
                value={rangeFrom}
                onChange={(e) => setRangeFrom(e.target.value)}
                className="ltr-num min-h-[40px] w-full rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                {t.toDate}
              </label>
              <input
                type="date"
                dir="ltr"
                value={rangeTo}
                onChange={(e) => setRangeTo(e.target.value)}
                className="ltr-num min-h-[40px] w-full rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                {t.search}
              </label>
              <div className="relative">
                <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  value={detailSearch}
                  onChange={(e) => setDetailSearch(e.target.value)}
                  placeholder={t.tafseelPlaceholder}
                  className="min-h-[40px] w-full rounded-xl border border-slate-300 bg-white ps-9 pe-3 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                />
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-[#F5F2E7] px-4 py-3 text-xs font-bold dark:border-slate-800 dark:bg-slate-900">
            <span>
              {t.pichlaBaqiLabel}:{' '}
              <span className="ltr-num font-extrabold">{formatRs(detailRangeData.openingBalance)}</span>
            </span>
            <span>
              {t.aajKulAayeLabel}:{' '}
              <span className="ltr-num font-extrabold text-[#0B7D50] dark:text-emerald-400">
                {formatRs(detailRangeData.totalIn)}
              </span>
            </span>
            <span>
              {t.aajKulGayeLabel}:{' '}
              <span className="ltr-num font-extrabold text-rose-700 dark:text-rose-400">
                {formatRs(detailRangeData.totalOut)}
              </span>
            </span>
            <span>
              {t.kulBaqiLabel}:{' '}
              <span
                className={`ltr-num font-extrabold ${
                  detailRangeData.closingBalance < 0
                    ? 'text-red-600 dark:text-red-400'
                    : 'text-[#12452D] dark:text-emerald-300'
                }`}
              >
                {formatRs(detailRangeData.closingBalance)}
              </span>
            </span>
          </div>

          <div className="overflow-x-auto rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs font-extrabold text-slate-700 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-200">
                  <th className="px-4 py-3 text-start">{language === 'ur' ? 'تاریخ' : 'Date'}</th>
                  <th className="px-4 py-3 text-start">{language === 'ur' ? 'تفصیل' : 'Tafseel'}</th>
                  <th className="px-4 py-3 text-end">{language === 'ur' ? 'آمدنی' : 'Aamdani'}</th>
                  <th className="px-4 py-3 text-end">{language === 'ur' ? 'خرچہ' : 'Kharcha'}</th>
                  <th className="px-4 py-3 text-end">{t.runningBalanceCol}</th>
                  <th className="px-3 py-3 text-center" />
                </tr>
              </thead>
              <tbody>
                {filteredDetailRows.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-slate-600 dark:text-slate-300">
                      {t.noRecordsFound}
                    </td>
                  </tr>
                ) : (
                  filteredDetailRows.map((row) => (
                    <tr
                      key={row.id}
                      className="border-b border-slate-100 last:border-0 dark:border-slate-800"
                    >
                      <td className="ltr-num px-4 py-3 text-xs text-slate-600 dark:text-slate-300">
                        {row.date}
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-bold text-slate-900 dark:text-slate-100">{row.tafseel}</p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          {row.category}
                          {row.partyName ? ` · ${row.partyName}` : ''}
                        </p>
                      </td>
                      <td className="ltr-num px-4 py-3 text-end font-bold text-[#0B7D50] dark:text-emerald-400">
                        {row.side === 'in' ? formatRs(row.amount) : '—'}
                      </td>
                      <td className="ltr-num px-4 py-3 text-end font-bold text-rose-700 dark:text-rose-400">
                        {row.side === 'out' ? formatRs(row.amount) : '—'}
                      </td>
                      <td
                        className={`ltr-num px-4 py-3 text-end font-extrabold ${
                          row.runningBalance < 0
                            ? 'text-red-600 dark:text-red-400'
                            : 'text-slate-900 dark:text-slate-100'
                        }`}
                      >
                        {formatRs(row.runningBalance)}
                      </td>
                      <td className="px-3 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => openEditModal(row)}
                            aria-label={t.edit}
                            className="rounded-lg p-1.5 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteId(row.id)}
                            aria-label={t.delete}
                            className="rounded-lg p-1.5 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/60"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Month View */}
      {subTab === 'month' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <label className="text-sm font-bold text-slate-800 dark:text-slate-100">
              {t.thisMonth}:
            </label>
            <input
              type="month"
              dir="ltr"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="ltr-num min-h-[40px] rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-sm font-bold dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
              <span className="text-xs text-slate-600 dark:text-slate-300">{t.pichlaBaqiLabel}</span>
              <p className="ltr-num mt-1 text-lg font-extrabold text-slate-900 dark:text-slate-100">
                {formatRs(monthSummary.openingBalance)}
              </p>
            </div>
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 dark:border-emerald-900 dark:bg-emerald-950/30">
              <span className="text-xs text-[#12452D] dark:text-emerald-300">
                {language === 'ur' ? 'مہینے کی کل آمدنی' : 'Monthly Total In'}
              </span>
              <p className="ltr-num mt-1 text-lg font-extrabold text-[#0B7D50] dark:text-emerald-400">
                {formatRs(monthSummary.totalAaye)}
              </p>
            </div>
            <div className="rounded-2xl border border-rose-200 bg-rose-50/70 p-4 dark:border-rose-900 dark:bg-rose-950/30">
              <span className="text-xs text-rose-900 dark:text-rose-300">
                {language === 'ur' ? 'مہینے کا کل خرچہ' : 'Monthly Total Out'}
              </span>
              <p className="ltr-num mt-1 text-lg font-extrabold text-rose-700 dark:text-rose-400">
                {formatRs(monthSummary.totalGaye)}
              </p>
            </div>
            <div className="rounded-2xl bg-[#12452D] p-4 text-white">
              <span className="text-xs text-emerald-100">
                {language === 'ur' ? 'مہینے کا اختتامی باقی' : 'Month Closing Balance'}
              </span>
              <p className="ltr-num mt-1 text-lg font-extrabold text-[#F2CC70]">
                {formatRs(monthSummary.closingBalance)}
              </p>
            </div>
          </div>

          <div className="overflow-x-auto rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <table className="w-full min-w-[540px] text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs font-extrabold text-slate-700 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-200">
                  <th className="px-4 py-3 text-start">{t.dateLabel}</th>
                  <th className="px-4 py-3 text-end">{t.roznamchaAaye}</th>
                  <th className="px-4 py-3 text-end">{t.roznamchaGaye}</th>
                  <th className="px-4 py-3 text-end">{t.aajKaBaqiLabel}</th>
                  <th className="px-4 py-3 text-end">{t.kulBaqiLabel}</th>
                </tr>
              </thead>
              <tbody>
                {monthSummary.days.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-slate-600 dark:text-slate-300">
                      {t.noRecordsFound}
                    </td>
                  </tr>
                ) : (
                  monthSummary.days.map((d) => (
                    <tr
                      key={d.date}
                      onClick={() => {
                        setSelectedDate(d.date);
                        setSubTab('diary');
                      }}
                      className="cursor-pointer border-b border-slate-100 transition hover:bg-emerald-50/50 dark:border-slate-800 dark:hover:bg-slate-800/50"
                    >
                      <td className="ltr-num px-4 py-3 font-bold text-[#0B7D50] underline dark:text-emerald-400">
                        {d.date} ({d.count})
                      </td>
                      <td className="ltr-num px-4 py-3 text-end font-semibold text-[#0B7D50] dark:text-emerald-400">
                        {formatRs(d.aaye)}
                      </td>
                      <td className="ltr-num px-4 py-3 text-end font-semibold text-rose-700 dark:text-rose-400">
                        {formatRs(d.gaye)}
                      </td>
                      <td className="ltr-num px-4 py-3 text-end font-semibold">
                        {formatRs(d.net)}
                      </td>
                      <td
                        className={`ltr-num px-4 py-3 text-end font-extrabold ${
                          d.closingBalance < 0 ? 'text-red-600 dark:text-red-400' : ''
                        }`}
                      >
                        {formatRs(d.closingBalance)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Category Report */}
      {subTab === 'categories' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:grid-cols-2 dark:border-slate-800 dark:bg-slate-900">
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                {t.fromDate}
              </label>
              <input
                type="date"
                dir="ltr"
                value={rangeFrom}
                onChange={(e) => setRangeFrom(e.target.value)}
                className="ltr-num min-h-[40px] w-full rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                {t.toDate}
              </label>
              <input
                type="date"
                dir="ltr"
                value={rangeTo}
                onChange={(e) => setRangeTo(e.target.value)}
                className="ltr-num min-h-[40px] w-full rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>
          </div>

          <div className="overflow-x-auto rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <table className="w-full min-w-[480px] text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs font-extrabold text-slate-700 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-200">
                  <th className="px-4 py-3 text-start">{t.categoryLabel}</th>
                  <th className="px-4 py-3 text-end">{t.totalCount}</th>
                  <th className="px-4 py-3 text-end">{t.roznamchaAaye}</th>
                  <th className="px-4 py-3 text-end">{t.roznamchaGaye}</th>
                </tr>
              </thead>
              <tbody>
                {categorySummary.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-slate-600 dark:text-slate-300">
                      {t.noRecordsFound}
                    </td>
                  </tr>
                ) : (
                  categorySummary.map((cat) => (
                    <tr
                      key={cat.category}
                      className="border-b border-slate-100 last:border-0 dark:border-slate-800"
                    >
                      <td className="px-4 py-3 font-bold text-slate-900 dark:text-slate-100">
                        {cat.category}
                      </td>
                      <td className="ltr-num px-4 py-3 text-end">{cat.count}</td>
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
      )}

      {/* Roznamcha Settings (Opening Balance + Categories CRUD) */}
      {subTab === 'settings' && (
        <div className="space-y-5">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <label className="mb-2 block text-sm font-extrabold text-slate-900 dark:text-slate-100">
              {t.openingBalanceLabel}
            </label>
            <input
              type="number"
              dir="ltr"
              value={roznamchaSettings.openingBalance}
              onChange={(e) =>
                onUpdateRoznamchaSettings({
                  ...roznamchaSettings,
                  openingBalance: Math.round(Number(e.target.value) || 0),
                })
              }
              className="ltr-num min-h-[44px] w-full max-w-xs rounded-xl border border-slate-300 bg-white px-4 py-2 text-base font-bold text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            {/* In Categories */}
            <div className="space-y-3 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <h2 className="text-base font-extrabold text-[#0B7D50] dark:text-emerald-400">
                {t.inCategoriesTitle}
              </h2>
              <div className="space-y-2">
                {roznamchaSettings.inCategories.map((cat, idx) => (
                  <div
                    key={`${cat}-${idx}`}
                    className="flex items-center justify-between gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-800 dark:bg-slate-800/50"
                  >
                    {editingCat?.side === 'in' && editingCat.idx === idx ? (
                      <div className="flex flex-1 items-center gap-2">
                        <input
                          type="text"
                          value={editingCat.value}
                          onChange={(e) =>
                            setEditingCat({ ...editingCat, value: e.target.value })
                          }
                          className="flex-1 rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-sm dark:border-slate-600 dark:bg-slate-900"
                        />
                        <button
                          type="button"
                          onClick={handleSaveCategoryEdit}
                          className="rounded-lg bg-[#0B7D50] px-2.5 py-1 text-xs font-bold text-white"
                        >
                          {t.save}
                        </button>
                      </div>
                    ) : (
                      <>
                        <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                          {cat}
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => setEditingCat({ side: 'in', idx, value: cat })}
                            aria-label={`${t.edit} ${cat}`}
                            className="rounded-lg p-1.5 text-slate-600 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-700"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            disabled={roznamchaSettings.inCategories.length <= 1}
                            onClick={() => handleDeleteCategory('in', idx)}
                            aria-label={`${t.delete} ${cat}`}
                            className="rounded-lg p-1.5 text-red-600 hover:bg-red-50 disabled:opacity-30 dark:text-red-400"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
              <div className="flex gap-2 pt-2">
                <input
                  type="text"
                  value={newInCat}
                  onChange={(e) => setNewInCat(e.target.value)}
                  placeholder={t.addCategoryBtn}
                  className="min-h-[42px] flex-1 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                />
                <button
                  type="button"
                  onClick={() => handleAddCategory('in')}
                  className="min-h-[42px] rounded-xl bg-[#0B7D50] px-4 py-2 text-xs font-bold text-white"
                >
                  {t.addCategoryBtn}
                </button>
              </div>
            </div>

            {/* Out Categories */}
            <div className="space-y-3 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <h2 className="text-base font-extrabold text-rose-700 dark:text-rose-400">
                {t.outCategoriesTitle}
              </h2>
              <div className="space-y-2">
                {roznamchaSettings.outCategories.map((cat, idx) => (
                  <div
                    key={`${cat}-${idx}`}
                    className="flex items-center justify-between gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-800 dark:bg-slate-800/50"
                  >
                    {editingCat?.side === 'out' && editingCat.idx === idx ? (
                      <div className="flex flex-1 items-center gap-2">
                        <input
                          type="text"
                          value={editingCat.value}
                          onChange={(e) =>
                            setEditingCat({ ...editingCat, value: e.target.value })
                          }
                          className="flex-1 rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-sm dark:border-slate-600 dark:bg-slate-900"
                        />
                        <button
                          type="button"
                          onClick={handleSaveCategoryEdit}
                          className="rounded-lg bg-rose-700 px-2.5 py-1 text-xs font-bold text-white"
                        >
                          {t.save}
                        </button>
                      </div>
                    ) : (
                      <>
                        <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                          {cat}
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => setEditingCat({ side: 'out', idx, value: cat })}
                            aria-label={`${t.edit} ${cat}`}
                            className="rounded-lg p-1.5 text-slate-600 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-700"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            disabled={roznamchaSettings.outCategories.length <= 1}
                            onClick={() => handleDeleteCategory('out', idx)}
                            aria-label={`${t.delete} ${cat}`}
                            className="rounded-lg p-1.5 text-red-600 hover:bg-red-50 disabled:opacity-30 dark:text-red-400"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
              <div className="flex gap-2 pt-2">
                <input
                  type="text"
                  value={newOutCat}
                  onChange={(e) => setNewOutCat(e.target.value)}
                  placeholder={t.addCategoryBtn}
                  className="min-h-[42px] flex-1 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                />
                <button
                  type="button"
                  onClick={() => handleAddCategory('out')}
                  className="min-h-[42px] rounded-xl bg-rose-700 px-4 py-2 text-xs font-bold text-white"
                >
                  {t.addCategoryBtn}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Entry Add/Edit Modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
        >
          <form
            onSubmit={handleSaveModal}
            className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-5 shadow-2xl dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="mb-4 flex items-center justify-between border-b border-slate-200 pb-3 dark:border-slate-800">
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-slate-100">
                {entrySide === 'in' ? t.roznamchaLeftTitle : t.roznamchaRightTitle}
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                aria-label={t.close}
                className="rounded-xl p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {formError && (
              <p className="mb-3 rounded-xl border border-red-300 bg-red-50 px-3 py-2 text-xs font-bold text-red-800 dark:border-red-900 dark:bg-red-950/60 dark:text-red-200">
                {formError}
              </p>
            )}

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {t.amountRs} *
                </label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  dir="ltr"
                  autoFocus
                  value={entryAmount}
                  onChange={(e) => setEntryAmount(e.target.value)}
                  placeholder="0"
                  className="ltr-num min-h-[44px] w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-base font-extrabold dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {t.dateLabel}
                </label>
                <input
                  type="date"
                  dir="ltr"
                  value={entryDate}
                  onChange={(e) => setEntryDate(e.target.value)}
                  className="ltr-num min-h-[44px] w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {t.tafseelLabel} *
                </label>
                <input
                  type="text"
                  value={entryTafseel}
                  onChange={(e) => setEntryTafseel(e.target.value)}
                  placeholder={t.tafseelPlaceholder}
                  className="min-h-[44px] w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {t.categoryLabel}
                </label>
                <select
                  value={entryCategory}
                  onChange={(e) => setEntryCategory(e.target.value)}
                  className="min-h-[44px] w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                >
                  {(entrySide === 'in'
                    ? roznamchaSettings.inCategories
                    : roznamchaSettings.outCategories
                  ).map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {t.paymentMethodLabel}
                </label>
                <select
                  value={entryMethod}
                  onChange={(e) => setEntryMethod(e.target.value as PaymentMethod)}
                  className="min-h-[44px] w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                >
                  <option value="Cash">{t.methodCash}</option>
                  <option value="Bank">{t.methodBank}</option>
                  <option value="JazzCash">{t.methodJazzCash}</option>
                  <option value="EasyPaisa">{t.methodEasyPaisa}</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {t.optionalPartyLabel}
                </label>
                <input
                  type="text"
                  list="roznamcha-parties-list"
                  value={entryPartyName}
                  onChange={(e) => setEntryPartyName(e.target.value)}
                  placeholder={t.partyPlaceholder}
                  className="min-h-[42px] w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                />
                <datalist id="roznamcha-parties-list">
                  {knownParties.map((p) => (
                    <option key={p} value={p} />
                  ))}
                </datalist>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {t.notes} ({t.optional})
                </label>
                <input
                  type="text"
                  value={entryNote}
                  onChange={(e) => setEntryNote(e.target.value)}
                  className="min-h-[42px] w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                />
              </div>
            </div>

            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="min-h-[44px] rounded-xl border border-slate-300 px-4 py-2 text-xs font-bold text-slate-700 dark:border-slate-700 dark:text-slate-200"
              >
                {t.cancel}
              </button>
              <button
                type="submit"
                className={`min-h-[44px] rounded-xl px-6 py-2 text-sm font-extrabold text-white ${
                  entrySide === 'in'
                    ? 'bg-[#0B7D50] hover:bg-[#12452D]'
                    : 'bg-rose-700 hover:bg-rose-800'
                }`}
              >
                {t.save}
              </button>
            </div>
          </form>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteId}
        title={t.deleteConfirmTitle}
        message={t.deleteRoznamchaConfirm}
        confirmLabel={t.delete}
        cancelLabel={t.cancel}
        onCancel={() => setDeleteId(null)}
        onConfirm={() => {
          if (deleteId) onDeleteEntry(deleteId);
          setDeleteId(null);
        }}
      />
    </div>
  );
};

import React, { useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Plus,
  Search,
  Trash2,
} from 'lucide-react';
import {
  AppLanguage,
  LedgerEntryDirection,
  PartyPayment,
  PurchaseRecord,
  SaleRecord,
} from '../types/mandi';
import { Translations } from '../i18n/translations';
import {
  buildPartyLedgerLines,
  buildPartySummaries,
  formatRs,
  getTodayISO,
} from '../utils/calculations';
import { ConfirmDialog } from './ConfirmDialog';

interface PartyLedgerProps {
  language: AppLanguage;
  t: Translations;
  sales: SaleRecord[];
  purchases: PurchaseRecord[];
  payments: PartyPayment[];
  onAddPayment: (entry: Omit<PartyPayment, 'id' | 'createdAt'>) => void;
  onDeletePayment: (id: string) => void;
}

export const PartyLedger: React.FC<PartyLedgerProps> = ({
  language,
  t,
  sales,
  purchases,
  payments,
  onAddPayment,
  onDeletePayment,
}) => {
  const [selectedParty, setSelectedParty] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  // New payment entry form
  const [payDate, setPayDate] = useState(getTodayISO());
  const [direction, setDirection] = useState<LedgerEntryDirection>('jama');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [deletePayId, setDeletePayId] = useState<string | null>(null);

  const summaries = useMemo(
    () => buildPartySummaries(sales, purchases, payments),
    [sales, purchases, payments]
  );

  const filteredSummaries = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return summaries;
    return summaries.filter((s) => s.partyName.toLowerCase().includes(q));
  }, [summaries, search]);

  const activePartySummary = useMemo(
    () =>
      selectedParty
        ? summaries.find(
            (s) => s.partyName.toLowerCase() === selectedParty.toLowerCase()
          ) || null
        : null,
    [summaries, selectedParty]
  );

  const ledgerLines = useMemo(() => {
    if (!selectedParty) return [];
    return buildPartyLedgerLines(selectedParty, sales, purchases, payments, language);
  }, [selectedParty, sales, purchases, payments, language]);

  const handleAddPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedParty) return;
    const amt = Number(amount) || 0;
    if (amt <= 0) return;
    onAddPayment({
      date: payDate,
      partyName: selectedParty,
      direction,
      amount: Math.round(amt),
      note: note.trim(),
    });
    setAmount('');
    setNote('');
  };

  const isRtl = language === 'ur';

  if (selectedParty) {
    const currentNet = activePartySummary?.netBalance ?? 0;

    return (
      <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setSelectedParty(null)}
            className="flex min-h-[44px] items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
          >
            {isRtl ? <ArrowRight className="h-4 w-4" /> : <ArrowLeft className="h-4 w-4" />}
            <span>{t.backToParties}</span>
          </button>

          <div className="rounded-2xl bg-[#0B7D50] px-5 py-2.5 text-white">
            <span className="text-xs text-emerald-100">
              {currentNet > 0
                ? t.receivableLabel
                : currentNet < 0
                  ? t.payableLabel
                  : t.settledLabel}
              :{' '}
            </span>
            <span className="ltr-num text-lg font-extrabold">
              {formatRs(Math.abs(currentNet))}
            </span>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h1 className="text-xl font-extrabold text-slate-900 dark:text-slate-100">
            {selectedParty}
          </h1>
          {activePartySummary && (
            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-xl bg-[#F5F2E7] p-3 dark:bg-slate-800">
                <span className="text-xs text-slate-600 dark:text-slate-300">{t.todaySales}</span>
                <p className="ltr-num mt-0.5 text-sm font-bold text-slate-900 dark:text-slate-100">
                  {formatRs(activePartySummary.totalSales)}
                </p>
              </div>
              <div className="rounded-xl bg-[#F5F2E7] p-3 dark:bg-slate-800">
                <span className="text-xs text-slate-600 dark:text-slate-300">{t.todayPurchase}</span>
                <p className="ltr-num mt-0.5 text-sm font-bold text-slate-900 dark:text-slate-100">
                  {formatRs(activePartySummary.totalPurchases)}
                </p>
              </div>
              <div className="rounded-xl bg-[#F5F2E7] p-3 dark:bg-slate-800">
                <span className="text-xs text-slate-600 dark:text-slate-300">{t.jamaOption}</span>
                <p className="ltr-num mt-0.5 text-sm font-bold text-[#0B7D50] dark:text-emerald-400">
                  {formatRs(activePartySummary.totalJama)}
                </p>
              </div>
              <div className="rounded-xl bg-[#F5F2E7] p-3 dark:bg-slate-800">
                <span className="text-xs text-slate-600 dark:text-slate-300">{t.banamOption}</span>
                <p className="ltr-num mt-0.5 text-sm font-bold text-amber-800 dark:text-[#F2CC70]">
                  {formatRs(activePartySummary.totalBanam)}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Add Jama / Banam Payment Entry */}
        <form
          onSubmit={handleAddPayment}
          className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"
        >
          <h2 className="mb-4 text-base font-bold text-slate-900 dark:text-slate-100">
            {t.addPaymentEntry}
          </h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <input
              type="date"
              dir="ltr"
              aria-label={t.dateLabel}
              value={payDate}
              onChange={(e) => setPayDate(e.target.value)}
              className="ltr-num min-h-[44px] rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-[#0B7D50] focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
            <select
              aria-label={t.addPaymentEntry}
              value={direction}
              onChange={(e) => setDirection(e.target.value as LedgerEntryDirection)}
              className="min-h-[44px] rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-900 focus:border-[#0B7D50] focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            >
              <option value="jama">{t.jamaOption}</option>
              <option value="banam">{t.banamOption}</option>
            </select>
            <input
              type="number"
              min="1"
              step="1"
              dir="ltr"
              aria-label={t.amountRs}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder={t.amountRs}
              className="ltr-num min-h-[44px] rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-bold text-slate-900 focus:border-[#0B7D50] focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
            <input
              type="text"
              aria-label={t.notes}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={t.paymentNotePlaceholder}
              className="min-h-[44px] rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-[#0B7D50] focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
            <button
              type="submit"
              className="flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl bg-[#0B7D50] px-4 py-2 text-sm font-bold text-white hover:bg-[#12452D]"
            >
              <Plus className="h-4 w-4" />
              <span>{t.saveEntry}</span>
            </button>
          </div>
        </form>

        {/* Ledger Table */}
        <div className="overflow-x-auto rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <table className="w-full min-w-[600px] text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-xs font-bold text-slate-700 dark:border-slate-800 dark:bg-slate-800/70 dark:text-slate-200">
                <th className="px-4 py-3 text-start">{t.colDate}</th>
                <th className="px-4 py-3 text-start">{t.colParticulars}</th>
                <th className="px-4 py-3 text-end">{t.colBanam}</th>
                <th className="px-4 py-3 text-end">{t.colJama}</th>
                <th className="px-4 py-3 text-end">{t.colBalance}</th>
                <th className="px-3 py-3 text-center" />
              </tr>
            </thead>
            <tbody>
              {ledgerLines.map((line) => (
                <tr
                  key={`${line.kind}-${line.id}`}
                  className="border-b border-slate-100 last:border-0 dark:border-slate-800"
                >
                  <td className="ltr-num px-4 py-3 text-xs text-slate-700 dark:text-slate-300">
                    {line.date}
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-semibold text-slate-900 dark:text-slate-100">
                      {line.refNo ? `${line.refNo} — ` : ''}
                      {line.description}
                    </span>
                  </td>
                  <td className="ltr-num px-4 py-3 text-end font-semibold text-amber-800 dark:text-[#F2CC70]">
                    {line.debit > 0 ? formatRs(line.debit) : '—'}
                  </td>
                  <td className="ltr-num px-4 py-3 text-end font-semibold text-[#0B7D50] dark:text-emerald-400">
                    {line.credit > 0 ? formatRs(line.credit) : '—'}
                  </td>
                  <td className="ltr-num px-4 py-3 text-end font-extrabold text-slate-900 dark:text-slate-100">
                    {formatRs(line.runningBalance)}
                  </td>
                  <td className="px-3 py-3 text-center">
                    {(line.kind === 'jama' || line.kind === 'banam') && (
                      <button
                        type="button"
                        onClick={() => setDeletePayId(line.id)}
                        aria-label={t.delete}
                        className="inline-flex min-h-[36px] min-w-[36px] items-center justify-center rounded-lg text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/60"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <ConfirmDialog
          open={!!deletePayId}
          title={t.deleteConfirmTitle}
          message={t.deletePaymentConfirm}
          confirmLabel={t.delete}
          cancelLabel={t.cancel}
          onCancel={() => setDeletePayId(null)}
          onConfirm={() => {
            if (deletePayId) onDeletePayment(deletePayId);
            setDeletePayId(null);
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-extrabold text-slate-900 dark:text-slate-100">
          {t.khataTitle}
        </h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{t.khataSubtitle}</p>
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute start-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t.searchPartyPlaceholder}
          className="min-h-[44px] w-full rounded-xl border border-slate-300 bg-white ps-10 pe-4 py-2 text-sm text-slate-900 focus:border-[#0B7D50] focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
        />
      </div>

      {filteredSummaries.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center dark:border-slate-700 dark:bg-slate-900">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F5F2E7] text-[#0B7D50] dark:bg-slate-800 dark:text-emerald-400">
            <BookOpen className="h-7 w-7" />
          </div>
          <p className="mx-auto mt-3 max-w-md text-sm text-slate-600 dark:text-slate-300">
            {t.noPartiesYet}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {filteredSummaries.map((party) => {
            const balLabel =
              party.netBalance > 0
                ? t.receivableLabel
                : party.netBalance < 0
                  ? t.payableLabel
                  : t.settledLabel;

            return (
              <button
                key={party.partyName}
                type="button"
                onClick={() => setSelectedParty(party.partyName)}
                className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-start shadow-sm transition hover:border-[#0B7D50] dark:border-slate-800 dark:bg-slate-900 dark:hover:border-emerald-500"
              >
                <div className="min-w-0">
                  <h2 className="truncate text-base font-bold text-slate-900 dark:text-slate-100">
                    {party.partyName}
                  </h2>
                  <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                    {t.totalBusiness}:{' '}
                    <span className="ltr-num font-semibold">
                      {formatRs(party.totalBusiness)}
                    </span>{' '}
                    · <span className="ltr-num">{party.transactionCount}</span>
                  </p>
                </div>

                <div className="shrink-0 text-end">
                  <p
                    className={`ltr-num text-base font-extrabold ${
                      party.netBalance > 0
                        ? 'text-[#0B7D50] dark:text-emerald-400'
                        : party.netBalance < 0
                          ? 'text-amber-700 dark:text-[#F2CC70]'
                          : 'text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {formatRs(Math.abs(party.netBalance))}
                  </p>
                  <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                    {balLabel}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

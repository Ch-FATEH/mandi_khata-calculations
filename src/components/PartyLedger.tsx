import React, { useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Calendar,
  Edit3,
  MessageCircle,
  Phone,
  Plus,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import {
  AppLanguage,
  AppSettings,
  LedgerEntryDirection,
  PartyBalanceStatus,
  PartyMeta,
  PartyPayment,
  PaymentMethod,
  PurchaseRecord,
  RoznamchaEntry,
  SaleRecord,
} from '../types/mandi';
import { Translations } from '../i18n/translations';
import {
  buildPartyLedgerLines,
  buildPartySummaries,
  buildWhatsappReminderUrl,
  formatRs,
  getTodayISO,
  normalizePartyName,
} from '../utils/calculations';
import { ConfirmDialog } from './ConfirmDialog';

interface PartyLedgerProps {
  language: AppLanguage;
  t: Translations;
  settings: AppSettings;
  sales: SaleRecord[];
  purchases: PurchaseRecord[];
  payments: PartyPayment[];
  partyMeta: Record<string, PartyMeta>;
  roznamchaEntries: RoznamchaEntry[];
  onAddPayment: (entry: Omit<PartyPayment, 'id' | 'createdAt'>) => void;
  onUpdatePayment: (id: string, patch: Partial<Omit<PartyPayment, 'id' | 'createdAt'>>) => void;
  onDeletePayment: (id: string) => void;
  onUpdatePartyMeta: (partyName: string, patch: { phone?: string; wadaDate?: string }) => void;
}

type StatusFilter = 'all' | 'pending' | 'clear' | 'overdue';

export const PartyLedger: React.FC<PartyLedgerProps> = ({
  language,
  t,
  settings,
  sales,
  purchases,
  payments,
  partyMeta,
  roznamchaEntries,
  onAddPayment,
  onUpdatePayment,
  onDeletePayment,
  onUpdatePartyMeta,
}) => {
  const [selectedParty, setSelectedParty] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  // New / Edit payment entry form
  const [editingPaymentId, setEditingPaymentId] = useState<string | null>(null);
  const [payDate, setPayDate] = useState(getTodayISO());
  const [direction, setDirection] = useState<LedgerEntryDirection>('jama');
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<PaymentMethod>('Cash');
  const [note, setNote] = useState('');
  const [deletePayId, setDeletePayId] = useState<string | null>(null);
  const [reminderHint, setReminderHint] = useState('');

  const today = getTodayISO();

  const summaries = useMemo(
    () => buildPartySummaries(sales, purchases, payments, partyMeta, today),
    [sales, purchases, payments, partyMeta, today]
  );

  const filteredSummaries = useMemo(() => {
    const q = search.trim().toLowerCase();
    return summaries.filter((s) => {
      if (q && !s.partyName.toLowerCase().includes(q)) return false;
      if (statusFilter === 'clear' && s.status !== 'CLEAR') return false;
      if (statusFilter === 'overdue' && s.status !== 'OVERDUE') return false;
      if (
        statusFilter === 'pending' &&
        s.baqiAmount <= 0
      ) {
        return false;
      }
      return true;
    });
  }, [summaries, search, statusFilter]);

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

  const partyRoznamchaRefs = useMemo(() => {
    if (!selectedParty) return [];
    const target = normalizePartyName(selectedParty).toLowerCase();
    return roznamchaEntries
      .filter(
        (r) => r.partyName && normalizePartyName(r.partyName).toLowerCase() === target
      )
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [roznamchaEntries, selectedParty]);

  const resetPaymentForm = () => {
    setEditingPaymentId(null);
    setPayDate(getTodayISO());
    setDirection('jama');
    setAmount('');
    setMethod('Cash');
    setNote('');
  };

  const handleSavePayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedParty) return;
    const amt = Number(amount) || 0;
    if (amt <= 0) return;

    if (editingPaymentId) {
      onUpdatePayment(editingPaymentId, {
        date: payDate,
        direction,
        amount: Math.round(amt),
        method,
        note: note.trim(),
      });
    } else {
      onAddPayment({
        date: payDate,
        partyName: selectedParty,
        direction,
        amount: Math.round(amt),
        method,
        note: note.trim(),
      });
    }
    resetPaymentForm();
  };

  const renderStatusChip = (status: PartyBalanceStatus) => {
    if (status === 'CLEAR') {
      return (
        <span className="rounded-lg bg-emerald-100 px-2.5 py-0.5 text-[11px] font-extrabold text-[#0B7D50] dark:bg-emerald-950 dark:text-emerald-300">
          {t.statusClear}
        </span>
      );
    }
    if (status === 'PARTIAL') {
      return (
        <span className="rounded-lg bg-amber-100 px-2.5 py-0.5 text-[11px] font-extrabold text-amber-900 dark:bg-amber-950 dark:text-[#F2CC70]">
          {t.statusPartial}
        </span>
      );
    }
    if (status === 'OVERDUE') {
      return (
        <span className="rounded-lg bg-red-100 px-2.5 py-0.5 text-[11px] font-extrabold text-red-800 dark:bg-red-950 dark:text-red-300">
          {t.statusOverdue}
        </span>
      );
    }
    return (
      <span className="rounded-lg bg-slate-200 px-2.5 py-0.5 text-[11px] font-extrabold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
        {t.statusPending}
      </span>
    );
  };

  const isRtl = language === 'ur';
  const shopDisplayName =
    language === 'ur'
      ? settings.shopNameUr || settings.shopNameEn
      : settings.shopNameEn || settings.shopNameUr;

  if (selectedParty) {
    const currentNet = activePartySummary?.netBalance ?? 0;
    const phoneVal = activePartySummary?.phone || '';
    const wadaVal = activePartySummary?.wadaDate || '';
    const whatsappHref = activePartySummary
      ? buildWhatsappReminderUrl({
          phone: phoneVal,
          partyName: selectedParty,
          baqiAmount: activePartySummary.baqiAmount,
          netBalance: activePartySummary.netBalance,
          wadaDate: wadaVal,
          shopName: shopDisplayName,
        })
      : null;

    return (
      <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => {
              setSelectedParty(null);
              resetPaymentForm();
              setReminderHint('');
            }}
            className="flex min-h-[44px] items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
          >
            {isRtl ? <ArrowRight className="h-4 w-4" /> : <ArrowLeft className="h-4 w-4" />}
            <span>{t.backToParties}</span>
          </button>

          <div className="flex flex-wrap items-center gap-2">
            {activePartySummary && renderStatusChip(activePartySummary.status)}
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
        </div>

        {/* Party Header, Kul/Wasool/Baqi & Contact / Wada Date / WhatsApp Reminder */}
        <div className="space-y-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h1 className="text-xl font-extrabold text-slate-900 dark:text-slate-100">
              {selectedParty}
            </h1>

            {whatsappHref ? (
              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className="flex min-h-[42px] items-center gap-2 rounded-xl bg-[#16A34A] px-4 py-2 text-xs font-extrabold text-white hover:bg-[#15803D]"
              >
                <MessageCircle className="h-4 w-4" />
                <span>{t.whatsappReminderBtn}</span>
              </a>
            ) : (
              <button
                type="button"
                onClick={() => setReminderHint(t.addPhoneForReminderMsg)}
                className="flex min-h-[42px] items-center gap-2 rounded-xl border border-emerald-600 px-4 py-2 text-xs font-extrabold text-[#0B7D50] hover:bg-emerald-50 dark:text-emerald-400"
              >
                <MessageCircle className="h-4 w-4" />
                <span>{t.whatsappReminderBtn}</span>
              </button>
            )}
          </div>

          {reminderHint && (
            <p className="rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-900 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-200">
              {reminderHint}
            </p>
          )}

          {activePartySummary && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded-2xl bg-[#F5F2E7] p-3.5 dark:bg-slate-800">
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                  {t.kulRaqamLabel}
                </span>
                <p className="ltr-num mt-0.5 text-lg font-extrabold text-slate-900 dark:text-slate-100">
                  {formatRs(activePartySummary.kulRaqam)}
                </p>
              </div>
              <div className="rounded-2xl bg-emerald-50/70 p-3.5 dark:bg-emerald-950/30">
                <span className="text-xs font-semibold text-[#12452D] dark:text-emerald-300">
                  {t.wasoolPaidLabel}
                </span>
                <p className="ltr-num mt-0.5 text-lg font-extrabold text-[#0B7D50] dark:text-emerald-400">
                  {formatRs(activePartySummary.wasoolPaid)}
                </p>
              </div>
              <div className="rounded-2xl bg-amber-50/80 p-3.5 dark:bg-amber-950/30">
                <span className="text-xs font-semibold text-amber-900 dark:text-[#F2CC70]">
                  {t.baqiRaqamLabel}
                </span>
                <p className="ltr-num mt-0.5 text-lg font-extrabold text-amber-900 dark:text-[#F2CC70]">
                  {formatRs(activePartySummary.baqiAmount)}
                </p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 gap-3 border-t border-slate-100 pt-3 sm:grid-cols-2 dark:border-slate-800">
            <div>
              <label className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
                <Phone className="h-3.5 w-3.5 text-[#0B7D50]" />
                <span>{t.partyMobileLabel}</span>
              </label>
              <input
                type="tel"
                dir="ltr"
                value={phoneVal}
                placeholder="03XX-XXXXXXX"
                onChange={(e) => {
                  setReminderHint('');
                  onUpdatePartyMeta(selectedParty, { phone: e.target.value });
                }}
                className="ltr-num min-h-[42px] w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-bold text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>
            <div>
              <label className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
                <Calendar className="h-3.5 w-3.5 text-[#0B7D50]" />
                <span>{t.wadaDateLabel}</span>
              </label>
              <input
                type="date"
                dir="ltr"
                value={wadaVal}
                onChange={(e) =>
                  onUpdatePartyMeta(selectedParty, { wadaDate: e.target.value })
                }
                className="ltr-num min-h-[42px] w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-bold text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>
          </div>
        </div>

        {/* Add / Edit Payment Form */}
        <form
          onSubmit={handleSavePayment}
          className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"
        >
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
              {editingPaymentId ? t.editPaymentTitle : t.addPaymentEntry}
            </h2>
            {editingPaymentId && (
              <button
                type="button"
                onClick={resetPaymentForm}
                className="flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-1 text-xs font-bold"
              >
                <X className="h-3.5 w-3.5" />
                {t.cancel}
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-6">
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
            <select
              aria-label={t.paymentMethodLabel}
              value={method}
              onChange={(e) => setMethod(e.target.value as PaymentMethod)}
              className="min-h-[44px] rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-900 focus:border-[#0B7D50] focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            >
              <option value="Cash">{t.methodCash}</option>
              <option value="Bank">{t.methodBank}</option>
              <option value="JazzCash">{t.methodJazzCash}</option>
              <option value="EasyPaisa">{t.methodEasyPaisa}</option>
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
              <span>{editingPaymentId ? t.update : t.saveEntry}</span>
            </button>
          </div>
        </form>

        {/* Ledger Table */}
        <div className="overflow-x-auto rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <table className="w-full min-w-[640px] text-sm">
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
              {ledgerLines.map((line) => {
                const isPayment = line.kind === 'jama' || line.kind === 'banam';
                const rawPay = isPayment
                  ? payments.find((p) => p.id === line.id)
                  : undefined;

                return (
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
                      {line.method && (
                        <span className="ltr-num ms-2 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                          {line.method}
                        </span>
                      )}
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
                      {isPayment && rawPay && (
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingPaymentId(rawPay.id);
                              setPayDate(rawPay.date);
                              setDirection(rawPay.direction);
                              setAmount(String(rawPay.amount));
                              setMethod(rawPay.method || 'Cash');
                              setNote(rawPay.note || '');
                            }}
                            aria-label={t.edit}
                            className="inline-flex min-h-[34px] min-w-[34px] items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeletePayId(line.id)}
                            aria-label={t.delete}
                            className="inline-flex min-h-[34px] min-w-[34px] items-center justify-center rounded-lg text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/60"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Roznamcha Reference Notes (Info only) */}
        {partyRoznamchaRefs.length > 0 && (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
            <h3 className="text-xs font-extrabold text-slate-700 dark:text-slate-300">
              {t.roznamchaReferenceNote}
            </h3>
            <div className="mt-2 space-y-1.5">
              {partyRoznamchaRefs.map((ref) => (
                <div
                  key={ref.id}
                  className="flex items-center justify-between text-xs text-slate-700 dark:text-slate-300"
                >
                  <span>
                    <span className="ltr-num font-semibold">{ref.date}</span> · {ref.tafseel} (
                    {ref.category})
                  </span>
                  <span
                    className={`ltr-num font-bold ${
                      ref.side === 'in'
                        ? 'text-[#0B7D50] dark:text-emerald-400'
                        : 'text-rose-700 dark:text-rose-400'
                    }`}
                  >
                    {ref.side === 'in' ? '+' : '-'} {formatRs(ref.amount)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <ConfirmDialog
          open={!!deletePayId}
          title={t.deleteConfirmTitle}
          message={t.deletePaymentConfirm}
          confirmLabel={t.delete}
          cancelLabel={t.cancel}
          onCancel={() => setDeletePayId(null)}
          onConfirm={() => {
            if (deletePayId) onDeletePayment(deletePayId);
            if (editingPaymentId === deletePayId) resetPaymentForm();
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

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="pointer-events-none absolute start-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t.searchPartyPlaceholder}
            className="min-h-[44px] w-full rounded-xl border border-slate-300 bg-white ps-10 pe-4 py-2 text-sm text-slate-900 focus:border-[#0B7D50] focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          />
        </div>

        <div className="flex flex-wrap gap-1.5">
          {(
            [
              ['all', t.filterAll],
              ['pending', t.filterPending],
              ['clear', t.filterClear],
              ['overdue', t.filterOverdue],
            ] as [StatusFilter, string][]
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setStatusFilter(id)}
              className={`min-h-[40px] rounded-xl px-3.5 py-2 text-xs font-bold transition ${
                statusFilter === id
                  ? 'bg-[#0B7D50] text-white'
                  : 'border border-slate-300 bg-white text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
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
                className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-start shadow-sm transition hover:border-[#0B7D50] dark:border-slate-800 dark:bg-slate-900 dark:hover:border-emerald-500"
              >
                <div className="flex w-full items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h2 className="truncate text-base font-extrabold text-slate-900 dark:text-slate-100">
                      {party.partyName}
                    </h2>
                    <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                      {party.wadaDate ? `${t.wadaDateLabel}: ${party.wadaDate}` : `${t.totalCount}: ${party.transactionCount}`}
                    </p>
                  </div>
                  {renderStatusChip(party.status)}
                </div>

                <div className="grid w-full grid-cols-3 gap-2 rounded-xl bg-[#F5F2E7] p-2.5 text-xs dark:bg-slate-800/80">
                  <div>
                    <span className="text-[10px] text-slate-600 dark:text-slate-300">
                      {t.kulRaqamLabel}
                    </span>
                    <p className="ltr-num font-bold text-slate-900 dark:text-slate-100">
                      {formatRs(party.kulRaqam)}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-600 dark:text-slate-300">
                      {t.wasoolPaidLabel}
                    </span>
                    <p className="ltr-num font-bold text-[#0B7D50] dark:text-emerald-400">
                      {formatRs(party.wasoolPaid)}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-600 dark:text-slate-300">
                      {balLabel}
                    </span>
                    <p
                      className={`ltr-num font-extrabold ${
                        party.netBalance > 0
                          ? 'text-[#0B7D50] dark:text-emerald-400'
                          : party.netBalance < 0
                            ? 'text-amber-700 dark:text-[#F2CC70]'
                            : 'text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {formatRs(party.baqiAmount)}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

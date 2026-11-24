import React, { useMemo, useState } from 'react';
import {
  Check,
  Edit3,
  FileText,
  Plus,
  RotateCcw,
  Search,
  Trash2,
  AlertCircle,
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
  calculatePurchase,
  calculateSale,
  formatNumber,
  formatRs,
  getTodayISO,
} from '../utils/calculations';
import { ConfirmDialog } from './ConfirmDialog';

interface TradeRegisterProps {
  mode: 'sale' | 'purchase';
  language: AppLanguage;
  t: Translations;
  settings: AppSettings;
  records: TradeRecord[];
  knownParties: string[];
  onSaveSale: (
    data: Omit<SaleRecord, 'id' | 'refNo' | 'createdAt' | 'updatedAt' | 'type'>,
    editingId?: string
  ) => void;
  onSavePurchase: (
    data: Omit<PurchaseRecord, 'id' | 'refNo' | 'createdAt' | 'updatedAt' | 'type'>,
    editingId?: string
  ) => void;
  onDeleteRecord: (id: string) => void;
  onViewSlip: (record: TradeRecord) => void;
}

type DateFilter = 'all' | 'today' | 'month' | 'year';

export const TradeRegister: React.FC<TradeRegisterProps> = ({
  mode,
  language,
  t,
  settings,
  records,
  knownParties,
  onSaveSale,
  onSavePurchase,
  onDeleteRecord,
  onViewSlip,
}) => {
  const isSale = mode === 'sale';
  const defaultCrop = settings.crops[0] || {
    id: 'wheat',
    nameUr: 'گندم',
    nameEn: 'Wheat',
    varieties: [],
  };

  const [editingId, setEditingId] = useState<string | undefined>(undefined);
  const [date, setDate] = useState(getTodayISO());
  const [partyName, setPartyName] = useState('');
  const [showPartyDropdown, setShowPartyDropdown] = useState(false);
  const [cropId, setCropId] = useState(defaultCrop.id);
  const [variety, setVariety] = useState('');
  const [totalWeight, setTotalWeight] = useState('');
  const [bags, setBags] = useState('');
  const [marginCut, setMarginCut] = useState(
    isSale && settings.marginEnabledSales && settings.defaultMarginCut > 0
      ? String(settings.defaultMarginCut)
      : ''
  );
  const [kandaCut, setKandaCut] = useState('');
  const [ratePerMaund, setRatePerMaund] = useState('');
  const [advance, setAdvance] = useState('');
  const [taxLabour, setTaxLabour] = useState('');
  const [notes, setNotes] = useState('');

  const [errorMsg, setErrorMsg] = useState('');
  const [toastMsg, setToastMsg] = useState('');

  // History filters
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const [cropFilter, setCropFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [historyViewMode, setHistoryViewMode] = useState<'detail' | 'total'>('detail');
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const selectedCrop =
    settings.crops.find((c) => c.id === cropId) || defaultCrop;

  const partySuggestions = useMemo(() => {
    const q = partyName.trim().toLowerCase();
    if (!q) return knownParties.slice(0, 8);
    return knownParties.filter((p) => p.toLowerCase().includes(q)).slice(0, 8);
  }, [knownParties, partyName]);

  const exactPartyExists = knownParties.some(
    (p) => p.toLowerCase() === partyName.trim().toLowerCase()
  );

  const liveCalc = useMemo(() => {
    const input = {
      totalWeight: Number(totalWeight) || 0,
      bags: Number(bags) || 0,
      marginCut: Number(marginCut) || 0,
      kandaCut: Number(kandaCut) || 0,
      ratePerMaund: Number(ratePerMaund) || 0,
      advance: Number(advance) || 0,
      taxLabour: Number(taxLabour) || 0,
    };
    return isSale
      ? calculateSale(input, settings)
      : calculatePurchase(input, settings);
  }, [
    isSale,
    totalWeight,
    bags,
    marginCut,
    kandaCut,
    ratePerMaund,
    advance,
    taxLabour,
    settings,
  ]);

  const resetForm = () => {
    setEditingId(undefined);
    setDate(getTodayISO());
    setPartyName('');
    setCropId(defaultCrop.id);
    setVariety('');
    setTotalWeight('');
    setBags('');
    setMarginCut(
      isSale && settings.marginEnabledSales && settings.defaultMarginCut > 0
        ? String(settings.defaultMarginCut)
        : ''
    );
    setKandaCut('');
    setRatePerMaund('');
    setAdvance('');
    setTaxLabour('');
    setNotes('');
    setErrorMsg('');
  };

  const handleEditRecord = (rec: TradeRecord) => {
    setEditingId(rec.id);
    setDate(rec.date);
    setPartyName(rec.partyName);
    setCropId(rec.cropId);
    setVariety(rec.variety);
    setTotalWeight(String(rec.totalWeight));
    setBags(String(rec.bags));
    setMarginCut(rec.type === 'sale' ? String(rec.marginCut) : '');
    setKandaCut(rec.kandaCut ? String(rec.kandaCut) : '');
    setRatePerMaund(String(rec.ratePerMaund));
    setAdvance(rec.advance ? String(rec.advance) : '');
    setTaxLabour(rec.taxLabour ? String(rec.taxLabour) : '');
    setNotes(rec.notes || '');
    setErrorMsg('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const cleanParty = partyName.trim();
    if (!cleanParty) {
      setErrorMsg(t.errPartyRequired);
      return;
    }

    const w = Number(totalWeight) || 0;
    if (w <= 0) {
      setErrorMsg(t.errTotalWeight);
      return;
    }

    if (!liveCalc.isValid && liveCalc.errorKey === 'negativeNetWeight') {
      setErrorMsg(t.errNegativeNetWeight);
      return;
    }

    const rate = Number(ratePerMaund) || 0;
    if (rate <= 0) {
      setErrorMsg(t.errRateInvalid);
      return;
    }

    const common = {
      date,
      partyName: cleanParty,
      cropId: selectedCrop.id,
      cropNameUr: selectedCrop.nameUr,
      cropNameEn: selectedCrop.nameEn,
      variety: variety.trim(),
      totalWeight: w,
      bags: Number(bags) || 0,
      kandaCut: liveCalc.kandaCutKg,
      ratePerMaund: rate,
      advance: Number(advance) || 0,
      taxLabour: Number(taxLabour) || 0,
      notes: notes.trim(),
      bardanaPerBagUsed: isSale
        ? settings.bardanaEnabledSales
          ? settings.bardanaPerBag
          : 0
        : settings.bardanaEnabledPurchase
          ? settings.bardanaPerBag
          : 0,
      maundKgUsed: settings.maundKg,
      bardanaKg: liveCalc.bardanaKg,
      netWeightKg: liveCalc.netWeightKg,
      maund: liveCalc.maundDisplay,
      grossAmount: liveCalc.grossAmount,
      commissionApplied: liveCalc.commissionApplied,
      commissionPercentUsed: liveCalc.commissionPercentUsed,
      commissionAmount: liveCalc.commissionAmount,
      totalMizan: liveCalc.totalMizan,
    };

    if (isSale) {
      onSaveSale(
        {
          ...common,
          marginCut: liveCalc.marginCutKg,
        },
        editingId
      );
    } else {
      onSavePurchase(
        {
          ...common,
          chungiKg: liveCalc.chungiKg,
          chungiDivisorUsed: settings.chungiDivisor,
        },
        editingId
      );
    }

    resetForm();
    setToastMsg(t.savedToast);
    setTimeout(() => setToastMsg(''), 2500);
  };

  const filteredRecords = useMemo(() => {
    const todayStr = getTodayISO();
    const monthPrefix = todayStr.slice(0, 7);
    const yearPrefix = todayStr.slice(0, 4);
    const q = searchQuery.trim().toLowerCase();

    return records
      .filter((r) => {
        if (dateFilter === 'today' && r.date !== todayStr) return false;
        if (dateFilter === 'month' && !r.date.startsWith(monthPrefix)) return false;
        if (dateFilter === 'year' && !r.date.startsWith(yearPrefix)) return false;
        if (cropFilter !== 'all' && r.cropId !== cropFilter) return false;
        if (q) {
          const haystack = [
            r.refNo,
            r.partyName,
            r.cropNameUr,
            r.cropNameEn,
            r.variety,
            r.notes,
          ]
            .join(' ')
            .toLowerCase();
          if (!haystack.includes(q)) return false;
        }
        return true;
      })
      .sort((a, b) => {
        const d = b.date.localeCompare(a.date);
        if (d !== 0) return d;
        return b.createdAt.localeCompare(a.createdAt);
      });
  }, [records, dateFilter, cropFilter, searchQuery]);

  const cropTotals = useMemo(() => {
    const map = new Map<
      string,
      {
        cropId: string;
        cropName: string;
        count: number;
        netWeight: number;
        gross: number;
        commission: number;
        mizan: number;
      }
    >();
    for (const r of filteredRecords) {
      const label =
        language === 'ur' ? r.cropNameUr || r.cropNameEn : r.cropNameEn || r.cropNameUr;
      const curr = map.get(r.cropId) || {
        cropId: r.cropId,
        cropName: label,
        count: 0,
        netWeight: 0,
        gross: 0,
        commission: 0,
        mizan: 0,
      };
      curr.count += 1;
      curr.netWeight += r.netWeightKg;
      curr.gross += r.grossAmount;
      curr.commission += r.commissionAmount;
      curr.mizan += r.totalMizan;
      map.set(r.cropId, curr);
    }
    return Array.from(map.values());
  }, [filteredRecords, language]);

  const taxLabel =
    language === 'ur' ? settings.taxLabourLabelUr : settings.taxLabourLabelEn;

  return (
    <div className="space-y-6">
      {/* Sticky Live Calculation Bar */}
      <div className="sticky top-14 z-20 rounded-2xl border border-[#0B7D50]/30 bg-white/95 p-3.5 shadow-md backdrop-blur-md dark:border-emerald-700/40 dark:bg-slate-900/95">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs sm:text-sm">
            <div>
              <span className="text-slate-600 dark:text-slate-300">{t.bardanaLabel}: </span>
              <span className="ltr-num font-bold text-slate-900 dark:text-slate-100">
                {formatNumber(liveCalc.bardanaKg)} KG
              </span>
            </div>
            {!isSale && (
              <div>
                <span className="text-slate-600 dark:text-slate-300">{t.chungiLabel}: </span>
                <span className="ltr-num font-bold text-slate-900 dark:text-slate-100">
                  {formatNumber(liveCalc.chungiKg)} KG
                </span>
              </div>
            )}
            <div>
              <span className="text-slate-600 dark:text-slate-300">{t.netWeightLabel}: </span>
              <span
                className={`ltr-num font-bold ${
                  liveCalc.netWeightKg < 0
                    ? 'text-red-600 dark:text-red-400'
                    : 'text-[#0B7D50] dark:text-emerald-400'
                }`}
              >
                {formatNumber(liveCalc.netWeightKg)} KG
              </span>
            </div>
            <div>
              <span className="text-slate-600 dark:text-slate-300">{t.maundLabel}: </span>
              <span className="ltr-num font-bold text-slate-900 dark:text-slate-100">
                {formatNumber(liveCalc.maundDisplay)}
              </span>
            </div>
            {liveCalc.commissionApplied && (
              <div>
                <span className="text-slate-600 dark:text-slate-300">
                  {t.commissionLabel} ({liveCalc.commissionPercentUsed}%):{' '}
                </span>
                <span className="ltr-num font-bold text-amber-700 dark:text-[#F2CC70]">
                  {formatRs(liveCalc.commissionAmount)}
                </span>
              </div>
            )}
          </div>

          <div className="rounded-xl bg-[#0B7D50] px-4 py-2 text-white">
            <span className="text-xs text-emerald-100">{t.totalMizanLabel}: </span>
            <span className="ltr-num text-base font-extrabold sm:text-lg">
              {formatRs(liveCalc.totalMizan)}
            </span>
          </div>
        </div>
      </div>

      {/* Entry Form */}
      <form
        onSubmit={handleSubmit}
        className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 dark:border-slate-800 dark:bg-slate-900"
      >
        <div className="mb-5 flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-4 dark:border-slate-800">
          <h1 className="text-xl font-extrabold text-slate-900 dark:text-slate-100">
            {editingId
              ? isSale
                ? t.editSaleTitle
                : t.editPurchaseTitle
              : isSale
                ? t.salesRegisterTitle
                : t.purchaseRegisterTitle}
          </h1>
          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="flex min-h-[40px] items-center gap-1.5 rounded-xl border border-slate-300 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              {t.resetFormBtn}
            </button>
          )}
        </div>

        {toastMsg && (
          <div className="mb-4 flex items-center gap-2 rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-900 dark:border-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-200">
            <Check className="h-4 w-4 text-[#0B7D50]" />
            <span>{toastMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div
            role="alert"
            className="mb-4 flex items-center gap-2 rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800 dark:border-red-800 dark:bg-red-950/60 dark:text-red-200"
          >
            <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {/* Date */}
          <div>
            <label
              htmlFor="trade-date"
              className="mb-1.5 block text-sm font-semibold text-slate-800 dark:text-slate-200"
            >
              {t.dateLabel}
            </label>
            <input
              id="trade-date"
              type="date"
              dir="ltr"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="ltr-num min-h-[44px] w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 focus:border-[#0B7D50] focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
          </div>

          {/* Party Name with Autocomplete + Add-New */}
          <div className="relative sm:col-span-2 lg:col-span-2">
            <label
              htmlFor="trade-party"
              className="mb-1.5 block text-sm font-semibold text-slate-800 dark:text-slate-200"
            >
              {isSale ? t.buyerPartyLabel : t.farmerPartyLabel}
            </label>
            <input
              id="trade-party"
              type="text"
              value={partyName}
              onFocus={() => setShowPartyDropdown(true)}
              onBlur={() => setTimeout(() => setShowPartyDropdown(false), 180)}
              onChange={(e) => {
                setPartyName(e.target.value);
                setShowPartyDropdown(true);
              }}
              placeholder={t.partyPlaceholder}
              className="min-h-[44px] w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 focus:border-[#0B7D50] focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
            {showPartyDropdown && (partySuggestions.length > 0 || (partyName.trim() && !exactPartyExists)) && (
              <div className="absolute z-30 mt-1 max-h-52 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-800">
                {partySuggestions.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onMouseDown={() => {
                      setPartyName(p);
                      setShowPartyDropdown(false);
                    }}
                    className="flex w-full items-center justify-between px-4 py-2.5 text-start text-sm text-slate-900 hover:bg-emerald-50 dark:text-slate-100 dark:hover:bg-slate-700"
                  >
                    <span>{p}</span>
                  </button>
                ))}
                {partyName.trim() && !exactPartyExists && (
                  <button
                    type="button"
                    onMouseDown={() => setShowPartyDropdown(false)}
                    className="flex w-full items-center gap-2 border-t border-slate-100 px-4 py-2.5 text-start text-sm font-bold text-[#0B7D50] hover:bg-emerald-50 dark:border-slate-700 dark:text-emerald-400 dark:hover:bg-slate-700"
                  >
                    <Plus className="h-4 w-4" />
                    <span>
                      {t.addNewPartyBtn}: {partyName.trim()}
                    </span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Crop */}
          <div>
            <label
              htmlFor="trade-crop"
              className="mb-1.5 block text-sm font-semibold text-slate-800 dark:text-slate-200"
            >
              {t.cropLabel}
            </label>
            <select
              id="trade-crop"
              value={cropId}
              onChange={(e) => {
                setCropId(e.target.value);
                setVariety('');
              }}
              className="min-h-[44px] w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 focus:border-[#0B7D50] focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            >
              {settings.crops.map((c) => (
                <option key={c.id} value={c.id}>
                  {language === 'ur' ? c.nameUr : c.nameEn}
                </option>
              ))}
            </select>
          </div>

          {/* Variety (datalist for dropdown + free-text) */}
          <div>
            <label
              htmlFor="trade-variety"
              className="mb-1.5 block text-sm font-semibold text-slate-800 dark:text-slate-200"
            >
              {t.varietyLabel}
            </label>
            <input
              id="trade-variety"
              type="text"
              list="crop-varieties-list"
              value={variety}
              onChange={(e) => setVariety(e.target.value)}
              placeholder={t.varietyPlaceholder}
              className="min-h-[44px] w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 focus:border-[#0B7D50] focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
            <datalist id="crop-varieties-list">
              {selectedCrop.varieties.map((v) => (
                <option key={v} value={v} />
              ))}
            </datalist>
          </div>

          {/* Total Weight KG */}
          <div>
            <label
              htmlFor="trade-weight"
              className="mb-1.5 block text-sm font-semibold text-slate-800 dark:text-slate-200"
            >
              {t.totalWeightLabel}
            </label>
            <input
              id="trade-weight"
              type="number"
              step="0.01"
              min="0"
              dir="ltr"
              value={totalWeight}
              onChange={(e) => setTotalWeight(e.target.value)}
              placeholder="0"
              className="ltr-num min-h-[44px] w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-base font-bold text-slate-900 focus:border-[#0B7D50] focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
          </div>

          {/* Bags */}
          <div>
            <label
              htmlFor="trade-bags"
              className="mb-1.5 block text-sm font-semibold text-slate-800 dark:text-slate-200"
            >
              {t.bagsLabel}
            </label>
            <input
              id="trade-bags"
              type="number"
              step="1"
              min="0"
              dir="ltr"
              value={bags}
              onChange={(e) => setBags(e.target.value)}
              placeholder="0"
              className="ltr-num min-h-[44px] w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-base font-bold text-slate-900 focus:border-[#0B7D50] focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
          </div>

          {/* Margin Cut (Sales ONLY) */}
          {isSale && settings.marginEnabledSales && (
            <div>
              <label
                htmlFor="trade-margin"
                className="mb-1.5 block text-sm font-semibold text-slate-800 dark:text-slate-200"
              >
                {t.marginCutLabel}
              </label>
              <input
                id="trade-margin"
                type="number"
                step="0.01"
                min="0"
                dir="ltr"
                value={marginCut}
                onChange={(e) => setMarginCut(e.target.value)}
                placeholder="0"
                className="ltr-num min-h-[44px] w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-base text-slate-900 focus:border-[#0B7D50] focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>
          )}

          {/* Kanda Cut */}
          {((isSale && settings.kandaEnabledSales) ||
            (!isSale && settings.kandaEnabledPurchase)) && (
            <div>
              <label
                htmlFor="trade-kanda"
                className="mb-1.5 block text-sm font-semibold text-slate-800 dark:text-slate-200"
              >
                {t.kandaCutLabel}
              </label>
              <input
                id="trade-kanda"
                type="number"
                step="0.01"
                min="0"
                dir="ltr"
                value={kandaCut}
                onChange={(e) => setKandaCut(e.target.value)}
                placeholder="0"
                className="ltr-num min-h-[44px] w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-base text-slate-900 focus:border-[#0B7D50] focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>
          )}

          {/* Rate per Maund */}
          <div>
            <label
              htmlFor="trade-rate"
              className="mb-1.5 block text-sm font-semibold text-slate-800 dark:text-slate-200"
            >
              {t.ratePerMaundLabel}
            </label>
            <input
              id="trade-rate"
              type="number"
              step="1"
              min="0"
              dir="ltr"
              value={ratePerMaund}
              onChange={(e) => setRatePerMaund(e.target.value)}
              placeholder="0"
              className="ltr-num min-h-[44px] w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-base font-bold text-slate-900 focus:border-[#0B7D50] focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
          </div>

          {/* Advance */}
          <div>
            <label
              htmlFor="trade-advance"
              className="mb-1.5 block text-sm font-semibold text-slate-800 dark:text-slate-200"
            >
              {t.advanceLabel}
            </label>
            <input
              id="trade-advance"
              type="number"
              step="1"
              min="0"
              dir="ltr"
              value={advance}
              onChange={(e) => setAdvance(e.target.value)}
              placeholder="0"
              className="ltr-num min-h-[44px] w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-base text-slate-900 focus:border-[#0B7D50] focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
          </div>

          {/* Bank Tax / Labour */}
          <div>
            <label
              htmlFor="trade-tax"
              className="mb-1.5 block text-sm font-semibold text-slate-800 dark:text-slate-200"
            >
              {taxLabel} (Rs)
            </label>
            <input
              id="trade-tax"
              type="number"
              step="1"
              min="0"
              dir="ltr"
              value={taxLabour}
              onChange={(e) => setTaxLabour(e.target.value)}
              placeholder="0"
              className="ltr-num min-h-[44px] w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-base text-slate-900 focus:border-[#0B7D50] focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
          </div>

          {/* Notes */}
          <div className="sm:col-span-2 lg:col-span-3">
            <label
              htmlFor="trade-notes"
              className="mb-1.5 block text-sm font-semibold text-slate-800 dark:text-slate-200"
            >
              {t.notes} ({t.optional})
            </label>
            <input
              id="trade-notes"
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t.notesPlaceholder}
              className="min-h-[44px] w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 focus:border-[#0B7D50] focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
          </div>
        </div>

        {/* Live Breakdown Box */}
        <div className="mt-5 grid grid-cols-2 gap-3 rounded-2xl bg-[#F5F2E7] p-4 sm:grid-cols-4 dark:bg-slate-800/80">
          <div>
            <span className="text-xs text-slate-600 dark:text-slate-300">{t.bardanaLabel}</span>
            <p className="ltr-num text-sm font-bold text-slate-900 dark:text-slate-100">
              {formatNumber(liveCalc.bardanaKg)} KG
            </p>
          </div>
          {!isSale && (
            <div>
              <span className="text-xs text-slate-600 dark:text-slate-300">{t.chungiLabel}</span>
              <p className="ltr-num text-sm font-bold text-slate-900 dark:text-slate-100">
                {formatNumber(liveCalc.chungiKg)} KG
              </p>
            </div>
          )}
          <div>
            <span className="text-xs text-slate-600 dark:text-slate-300">{t.netWeightLabel}</span>
            <p className="ltr-num text-sm font-bold text-[#0B7D50] dark:text-emerald-400">
              {formatNumber(liveCalc.netWeightKg)} KG ({formatNumber(liveCalc.maundDisplay)} {t.maundUnit})
            </p>
          </div>
          <div>
            <span className="text-xs text-slate-600 dark:text-slate-300">{t.grossAmountLabel}</span>
            <p className="ltr-num text-sm font-bold text-slate-900 dark:text-slate-100">
              {formatRs(liveCalc.grossAmount)}
            </p>
          </div>
          {liveCalc.commissionApplied && (
            <div>
              <span className="text-xs text-slate-600 dark:text-slate-300">
                {t.commissionLabel} ({liveCalc.commissionPercentUsed}%)
              </span>
              <p className="ltr-num text-sm font-bold text-amber-800 dark:text-[#F2CC70]">
                - {formatRs(liveCalc.commissionAmount)}
              </p>
            </div>
          )}
          <div>
            <span className="text-xs font-bold text-[#12452D] dark:text-emerald-300">
              {t.totalMizanLabel}
            </span>
            <p className="ltr-num text-base font-extrabold text-[#12452D] dark:text-emerald-300">
              {formatRs(liveCalc.totalMizan)}
            </p>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button
            type="submit"
            className="flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-2xl bg-[#0B7D50] px-6 py-3 text-base font-bold text-white shadow-sm transition hover:bg-[#12452D] sm:flex-none"
          >
            <Check className="h-5 w-5" />
            <span>
              {editingId ? t.update : isSale ? t.saveSaleBtn : t.savePurchaseBtn}
            </span>
          </button>
          <button
            type="button"
            onClick={resetForm}
            className="min-h-[48px] rounded-2xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            {t.resetFormBtn}
          </button>
        </div>
      </form>

      {/* History & Filters */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-extrabold text-slate-900 dark:text-slate-100">
            {t.historyTitle} (<span className="ltr-num">{filteredRecords.length}</span>)
          </h2>

          <div className="flex flex-wrap items-center gap-2">
            {/* Total View vs Detail View toggle */}
            <div className="flex items-center gap-1 rounded-xl bg-slate-200/70 p-1 dark:bg-slate-800">
              <button
                type="button"
                onClick={() => setHistoryViewMode('total')}
                className={`min-h-[36px] rounded-lg px-3 py-1 text-xs font-bold transition ${
                  historyViewMode === 'total'
                    ? 'bg-[#0B7D50] text-white shadow-sm'
                    : 'text-slate-700 dark:text-slate-300'
                }`}
              >
                {t.totalViewLabel}
              </button>
              <button
                type="button"
                onClick={() => setHistoryViewMode('detail')}
                className={`min-h-[36px] rounded-lg px-3 py-1 text-xs font-bold transition ${
                  historyViewMode === 'detail'
                    ? 'bg-[#0B7D50] text-white shadow-sm'
                    : 'text-slate-700 dark:text-slate-300'
                }`}
              >
                {t.detailViewLabel}
              </button>
            </div>

            {/* Period segmented buttons */}
            <div className="flex flex-wrap items-center gap-1 rounded-xl bg-slate-200/70 p-1 dark:bg-slate-800">
              {(['today', 'month', 'year', 'all'] as DateFilter[]).map((df) => (
                <button
                  key={df}
                  type="button"
                  onClick={() => setDateFilter(df)}
                  className={`min-h-[36px] rounded-lg px-3 py-1 text-xs font-semibold transition ${
                    dateFilter === df
                      ? 'bg-white text-[#12452D] shadow-sm dark:bg-slate-900 dark:text-emerald-400'
                      : 'text-slate-700 hover:text-slate-900 dark:text-slate-300'
                  }`}
                >
                  {df === 'today'
                    ? t.today
                    : df === 'month'
                      ? t.thisMonth
                      : df === 'year'
                        ? t.thisYear
                        : t.all}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="relative sm:col-span-2">
            <Search className="pointer-events-none absolute start-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.filterSearchPlaceholder}
              className="min-h-[44px] w-full rounded-xl border border-slate-300 bg-white ps-10 pe-4 py-2 text-sm text-slate-900 focus:border-[#0B7D50] focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            />
          </div>
          <select
            aria-label={t.cropLabel}
            value={cropFilter}
            onChange={(e) => setCropFilter(e.target.value)}
            className="min-h-[44px] rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 focus:border-[#0B7D50] focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          >
            <option value="all">{t.filterAllCrops}</option>
            {settings.crops.map((c) => (
              <option key={c.id} value={c.id}>
                {language === 'ur' ? c.nameUr : c.nameEn}
              </option>
            ))}
          </select>
        </div>

        {filteredRecords.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
            {t.noRecordsFound}
          </div>
        ) : historyViewMode === 'total' ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {cropTotals.map((row) => (
              <button
                key={row.cropId}
                type="button"
                onClick={() => {
                  setCropFilter(row.cropId);
                  setHistoryViewMode('detail');
                }}
                className="rounded-2xl border border-slate-200 bg-white p-4 text-start shadow-sm transition hover:border-[#0B7D50] dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100">
                    {row.cropName}
                  </h3>
                  <span className="ltr-num rounded-lg bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-[#0B7D50] dark:bg-emerald-950 dark:text-emerald-400">
                    {row.count}
                  </span>
                </div>
                <p className="ltr-num mt-2 text-lg font-extrabold text-[#12452D] dark:text-emerald-300">
                  {formatRs(row.mizan)}
                </p>
                <p className="ltr-num mt-0.5 text-xs text-slate-600 dark:text-slate-300">
                  {formatNumber(row.netWeight)} KG · {t.commissionLabel}: {formatRs(row.commission)}
                </p>
                <p className="mt-1.5 text-[11px] font-semibold text-[#0B7D50] dark:text-emerald-400">
                  {t.tapToViewDetails}
                </p>
              </button>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {filteredRecords.map((rec) => {
              const cropName =
                language === 'ur'
                  ? rec.cropNameUr || rec.cropNameEn
                  : rec.cropNameEn || rec.cropNameUr;

              return (
                <div
                  key={rec.id}
                  className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
                        <span className="ltr-num font-bold text-[#0B7D50] dark:text-emerald-400">
                          {rec.refNo}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="ltr-num">{rec.date}</span>
                      </div>
                      <h3 className="mt-1 text-base font-bold text-slate-900 dark:text-slate-100">
                        {rec.partyName}
                      </h3>
                      <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-300">
                        {cropName}
                        {rec.variety ? ` (${rec.variety})` : ''} ·{' '}
                        <span className="ltr-num">{rec.bags} {t.bagsUnit}</span> ·{' '}
                        <span className="ltr-num">{formatNumber(rec.netWeightKg)} KG</span>
                      </p>
                    </div>

                    <div className="text-end">
                      <p className="ltr-num text-lg font-extrabold text-slate-900 dark:text-slate-100">
                        {formatRs(rec.totalMizan)}
                      </p>
                      <p className="ltr-num text-xs text-slate-600 dark:text-slate-300">
                        {formatNumber(rec.maund)} {t.maundUnit}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => onViewSlip(rec)}
                      className="flex min-h-[40px] flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#0B7D50] px-3 py-2 text-xs font-bold text-white hover:bg-[#12452D]"
                    >
                      <FileText className="h-3.5 w-3.5" />
                      {t.viewSlip}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleEditRecord(rec)}
                      aria-label={`${t.edit} ${rec.refNo}`}
                      className="flex min-h-[40px] items-center justify-center gap-1.5 rounded-xl border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                      {t.edit}
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteTargetId(rec.id)}
                      aria-label={`${t.delete} ${rec.refNo}`}
                      className="flex min-h-[40px] items-center justify-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-100 dark:border-red-900 dark:bg-red-950/60 dark:text-red-300"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      {t.delete}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <ConfirmDialog
        open={!!deleteTargetId}
        title={t.deleteConfirmTitle}
        message={t.deleteRecordConfirmMsg}
        confirmLabel={t.delete}
        cancelLabel={t.cancel}
        onCancel={() => setDeleteTargetId(null)}
        onConfirm={() => {
          if (deleteTargetId) {
            onDeleteRecord(deleteTargetId);
            if (editingId === deleteTargetId) resetForm();
          }
          setDeleteTargetId(null);
        }}
      />
    </div>
  );
};

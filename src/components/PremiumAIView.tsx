import React, { useEffect, useState } from 'react';
import { Check, Send, Sparkles, X } from 'lucide-react';
import {
  AppLanguage,
  AppSettings,
  GlobalAppConfig,
  PurchaseRecord,
  SaleRecord,
} from '../types/mandi';
import { Translations } from '../i18n/translations';
import {
  buildPartySummaries,
  calculateDashboardSummary,
  calculatePurchase,
  calculateSale,
  formatNumber,
  formatRs,
  getTodayISO,
} from '../utils/calculations';

interface DraftEntryFromAI {
  type: 'sale' | 'purchase';
  partyName: string;
  cropId: string;
  variety: string;
  totalWeight: number;
  bags: number;
  marginCut: number;
  kandaCut: number;
  ratePerMaund: number;
  advance: number;
  taxLabour: number;
  notes: string;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  draft?: DraftEntryFromAI | null;
}

interface PremiumAIViewProps {
  language: AppLanguage;
  t: Translations;
  settings: AppSettings;
  globalConfig: GlobalAppConfig;
  sales: SaleRecord[];
  purchases: PurchaseRecord[];
  onSaveSale: (
    data: Omit<SaleRecord, 'id' | 'refNo' | 'createdAt' | 'updatedAt' | 'type'>
  ) => void;
  onSavePurchase: (
    data: Omit<PurchaseRecord, 'id' | 'refNo' | 'createdAt' | 'updatedAt' | 'type'>
  ) => void;
}

export const PremiumAIView: React.FC<PremiumAIViewProps> = ({
  language,
  t,
  settings,
  globalConfig,
  sales,
  purchases,
  onSaveSale,
  onSavePurchase,
}) => {
  const [serverConfigured, setServerConfigured] = useState<boolean | null>(null);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [pendingDraft, setPendingDraft] = useState<DraftEntryFromAI | null>(null);
  const [draftDate, setDraftDate] = useState<string>(getTodayISO());
  const [savedNotice, setSavedNotice] = useState('');

  useEffect(() => {
    let active = true;
    fetch('/api/ai/status')
      .then((res) => (res.ok ? res.json() : { configured: false }))
      .then((data: { configured?: boolean }) => {
        if (active) setServerConfigured(Boolean(data.configured));
      })
      .catch(() => {
        if (active) setServerConfigured(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const today = getTodayISO();
  const todaySummary = calculateDashboardSummary(sales, purchases, today);
  const partyHighlights = buildPartySummaries(sales, purchases, []).slice(0, 15);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    const userMsg: ChatMessage = {
      id: `u_${Date.now()}`,
      role: 'user',
      text: trimmed,
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          language,
          message: trimmed,
          todayDate: today,
          settings: {
            shopNameUr: settings.shopNameUr,
            shopNameEn: settings.shopNameEn,
            maundKg: settings.maundKg,
            bardanaPerBag: settings.bardanaPerBag,
            commissionPercent: settings.commissionPercent,
            commissionMode: settings.commissionMode,
            crops: settings.crops.map((c) => ({
              id: c.id,
              nameUr: c.nameUr,
              nameEn: c.nameEn,
            })),
          },
          summary: todaySummary,
          records: [...sales, ...purchases].slice(0, 30),
          parties: partyHighlights,
        }),
      });
      const data = (await res.json()) as {
        configured?: boolean;
        reply?: string;
        hasDraftEntry?: boolean;
        draftEntry?: DraftEntryFromAI | null;
        error?: string;
      };
      if (res.status === 503 || data.configured === false) {
        setServerConfigured(false);
        setMessages((prev) => [
          ...prev,
          { id: `a_${Date.now()}`, role: 'assistant', text: t.aiPremiumComingSoon },
        ]);
        return;
      }
      if (!res.ok) {
        setMessages((prev) => [
          ...prev,
          { id: `a_${Date.now()}`, role: 'assistant', text: t.aiPremiumComingSoon },
        ]);
        return;
      }

      const draft =
        globalConfig.aiDraftEntryEnabled && data.hasDraftEntry && data.draftEntry
          ? data.draftEntry
          : null;
      if (draft) {
        setPendingDraft(draft);
        setDraftDate(today);
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `a_${Date.now()}`,
          role: 'assistant',
          text: data.reply || t.aiPremiumComingSoon,
          draft,
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { id: `a_${Date.now()}`, role: 'assistant', text: t.aiPremiumComingSoon },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const draftCalc = pendingDraft
    ? pendingDraft.type === 'sale'
      ? calculateSale(
          {
            totalWeight: Number(pendingDraft.totalWeight) || 0,
            bags: Number(pendingDraft.bags) || 0,
            marginCut: Number(pendingDraft.marginCut) || 0,
            kandaCut: Number(pendingDraft.kandaCut) || 0,
            ratePerMaund: Number(pendingDraft.ratePerMaund) || 0,
            advance: Number(pendingDraft.advance) || 0,
            taxLabour: Number(pendingDraft.taxLabour) || 0,
          },
          settings
        )
      : calculatePurchase(
          {
            totalWeight: Number(pendingDraft.totalWeight) || 0,
            bags: Number(pendingDraft.bags) || 0,
            kandaCut: Number(pendingDraft.kandaCut) || 0,
            ratePerMaund: Number(pendingDraft.ratePerMaund) || 0,
            advance: Number(pendingDraft.advance) || 0,
            taxLabour: Number(pendingDraft.taxLabour) || 0,
          },
          settings
        )
    : null;

  const handleConfirmSaveDraft = () => {
    if (!pendingDraft || !draftCalc || !draftCalc.isValid) return;
    const crop =
      settings.crops.find((c) => c.id === pendingDraft.cropId) || settings.crops[0];
    const common = {
      date: draftDate,
      partyName: pendingDraft.partyName.trim() || 'Walk-in Party',
      cropId: crop.id,
      cropNameUr: crop.nameUr,
      cropNameEn: crop.nameEn,
      variety: pendingDraft.variety || '',
      totalWeight: Number(pendingDraft.totalWeight) || 0,
      bags: Number(pendingDraft.bags) || 0,
      kandaCut: draftCalc.kandaCutKg,
      ratePerMaund: Number(pendingDraft.ratePerMaund) || 0,
      advance: Number(pendingDraft.advance) || 0,
      taxLabour: Number(pendingDraft.taxLabour) || 0,
      notes: pendingDraft.notes || '',
      bardanaPerBagUsed:
        pendingDraft.type === 'sale'
          ? settings.bardanaEnabledSales
            ? settings.bardanaPerBag
            : 0
          : settings.bardanaEnabledPurchase
            ? settings.bardanaPerBag
            : 0,
      maundKgUsed: settings.maundKg,
      bardanaKg: draftCalc.bardanaKg,
      netWeightKg: draftCalc.netWeightKg,
      maund: draftCalc.maundDisplay,
      grossAmount: draftCalc.grossAmount,
      commissionApplied: draftCalc.commissionApplied,
      commissionPercentUsed: draftCalc.commissionPercentUsed,
      commissionAmount: draftCalc.commissionAmount,
      totalMizan: draftCalc.totalMizan,
    };

    if (pendingDraft.type === 'sale') {
      onSaveSale({ ...common, marginCut: draftCalc.marginCutKg });
    } else {
      onSavePurchase({
        ...common,
        chungiKg: draftCalc.chungiKg,
        chungiDivisorUsed: settings.chungiDivisor,
      });
    }
    setPendingDraft(null);
    setSavedNotice(t.savedToast);
    setTimeout(() => setSavedNotice(''), 3000);
  };

  if (!globalConfig.aiEnabled) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <Sparkles className="mx-auto h-10 w-10 text-[#D9AA45]" />
        <h1 className="mt-3 text-xl font-extrabold text-slate-900 dark:text-slate-100">
          {t.premiumTitle}
        </h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          {t.aiDisabledByAdmin}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="rounded-3xl bg-gradient-to-br from-[#12452D] to-[#0B7D50] p-6 text-white shadow-lg">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15 text-[#F2CC70]">
            <Sparkles className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold">{t.premiumTitle}</h1>
            <p className="text-xs text-emerald-100">{t.premiumSubtitle}</p>
          </div>
        </div>
      </div>

      {savedNotice && (
        <div className="flex items-center gap-2 rounded-2xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-200">
          <Check className="h-4 w-4 text-[#0B7D50]" />
          <span>{savedNotice}</span>
        </div>
      )}

      {serverConfigured === false ? (
        <div className="rounded-3xl border border-amber-300 bg-amber-50 p-6 text-center dark:border-amber-800 dark:bg-amber-950/40">
          <Sparkles className="mx-auto h-8 w-8 text-amber-700 dark:text-[#F2CC70]" />
          <p className="mt-2 text-base font-extrabold text-amber-950 dark:text-amber-200">
            {t.aiPremiumComingSoon}
          </p>
        </div>
      ) : (
        <>
          {/* Draft Entry Confirmation Card */}
          {pendingDraft && draftCalc && (
            <div className="rounded-3xl border-2 border-[#0B7D50] bg-[#F5F2E7] p-5 shadow-sm dark:bg-slate-800">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-base font-extrabold text-[#12452D] dark:text-emerald-300">
                  {t.aiDraftConfirmTitle}
                </h2>
                <button
                  type="button"
                  onClick={() => setPendingDraft(null)}
                  className="rounded-lg p-1 text-slate-600 hover:bg-slate-200 dark:text-slate-300"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                <div>
                  <span className="text-xs text-slate-600 dark:text-slate-300">{t.partyLabel}</span>
                  <p className="font-bold">{pendingDraft.partyName}</p>
                </div>
                <div>
                  <span className="text-xs text-slate-600 dark:text-slate-300">{t.totalWeightLabel}</span>
                  <p className="ltr-num font-bold">{formatNumber(pendingDraft.totalWeight)} KG</p>
                </div>
                <div>
                  <span className="text-xs text-slate-600 dark:text-slate-300">{t.netWeightLabel}</span>
                  <p className="ltr-num font-bold">{formatNumber(draftCalc.netWeightKg)} KG</p>
                </div>
                <div>
                  <span className="text-xs text-slate-600 dark:text-slate-300">{t.totalMizanLabel}</span>
                  <p className="ltr-num font-extrabold text-[#0B7D50] dark:text-emerald-400">
                    {formatRs(draftCalc.totalMizan)}
                  </p>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={!draftCalc.isValid}
                  onClick={handleConfirmSaveDraft}
                  className="flex min-h-[42px] items-center gap-1.5 rounded-xl bg-[#0B7D50] px-4 py-2 text-xs font-extrabold text-white hover:bg-[#12452D] disabled:opacity-50"
                >
                  <Check className="h-4 w-4" />
                  {t.aiConfirmSaveBtn}
                </button>
                <button
                  type="button"
                  onClick={() => setPendingDraft(null)}
                  className="min-h-[42px] rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200"
                >
                  {t.aiDiscardDraftBtn}
                </button>
              </div>
            </div>
          )}

          {/* Chat Thread */}
          {globalConfig.aiChatEnabled ? (
            <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="mb-4 max-h-[380px] min-h-[160px] space-y-3 overflow-y-auto p-1">
                {messages.length === 0 && (
                  <p className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">
                    {t.aiChatPlaceholder}
                  </p>
                )}
                {messages.map((m) => (
                  <div
                    key={m.id}
                    className={`max-w-[88%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                      m.role === 'user'
                        ? 'ms-auto bg-[#0B7D50] text-white'
                        : 'me-auto bg-[#F5F2E7] text-slate-900 dark:bg-slate-800 dark:text-slate-100'
                    }`}
                  >
                    {m.text}
                  </div>
                ))}
              </div>

              <form onSubmit={handleSend} className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={t.aiChatPlaceholder}
                  className="min-h-[46px] flex-1 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                />
                <button
                  type="submit"
                  disabled={loading || !input.trim()}
                  className="flex min-h-[46px] items-center gap-1.5 rounded-xl bg-[#0B7D50] px-5 py-2 text-sm font-extrabold text-white hover:bg-[#12452D] disabled:opacity-50"
                >
                  <Send className="h-4 w-4" />
                  <span>{t.aiSendBtn}</span>
                </button>
              </form>
            </div>
          ) : (
            <div className="rounded-3xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
              {t.aiDisabledByAdmin}
            </div>
          )}
        </>
      )}
    </div>
  );
};

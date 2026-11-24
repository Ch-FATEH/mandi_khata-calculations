import React, { useEffect, useState } from 'react';
import { Calculator } from 'lucide-react';
import { AppLanguage, AppSettings } from '../types/mandi';
import { Translations } from '../i18n/translations';
import {
  calculatePurchase,
  calculateSale,
  formatNumber,
  formatRs,
  roundTo2,
} from '../utils/calculations';

interface CalculatorCentreProps {
  language: AppLanguage;
  t: Translations;
  settings: AppSettings;
  initialCalculator?: string;
}

export type CalcId =
  | 'commission'
  | 'sale'
  | 'purchase'
  | 'weight'
  | 'maundKg'
  | 'rate'
  | 'totalAmount'
  | 'profit'
  | 'discount'
  | 'percentage'
  | 'agriExpense';

export const CalculatorCentre: React.FC<CalculatorCentreProps> = ({
  language,
  t,
  settings,
  initialCalculator,
}) => {
  const [active, setActive] = useState<CalcId>(
    (initialCalculator as CalcId) || 'commission'
  );

  useEffect(() => {
    if (initialCalculator) setActive(initialCalculator as CalcId);
  }, [initialCalculator]);

  const isUr = language === 'ur';

  const calcList: { id: CalcId; label: string }[] = [
    { id: 'commission', label: t.calcCommission },
    { id: 'sale', label: t.calcSale },
    { id: 'purchase', label: t.calcPurchase },
    { id: 'weight', label: t.calcWeight },
    { id: 'maundKg', label: t.calcMaundKg },
    { id: 'rate', label: t.calcRate },
    { id: 'totalAmount', label: t.calcTotalAmount },
    { id: 'profit', label: t.calcProfit },
    { id: 'discount', label: t.calcDiscount },
    { id: 'percentage', label: t.calcPercentage },
    { id: 'agriExpense', label: t.calcAgriExpense },
  ];

  // 1. Commission state
  const [commAmount, setCommAmount] = useState('100000');
  const [commRate, setCommRate] = useState(
    settings.commissionPercent > 0 ? String(settings.commissionPercent) : ''
  );

  useEffect(() => {
    if (settings.commissionPercent > 0) {
      setCommRate(String(settings.commissionPercent));
    }
  }, [settings.commissionPercent]);

  // 2 & 3. Sale / Purchase calculator state
  const [spWeight, setSpWeight] = useState('9000');
  const [spBags, setSpBags] = useState('150');
  const [spMargin, setSpMargin] = useState('45');
  const [spKanda, setSpKanda] = useState('0');
  const [spRate, setSpRate] = useState('4300');
  const [spAdvance, setSpAdvance] = useState('0');
  const [spTax, setSpTax] = useState('0');

  // 4. Weight calculator
  const [wtBags, setWtBags] = useState('100');
  const [wtPerBag, setWtPerBag] = useState('50');
  const [wtExtraCut, setWtExtraCut] = useState('0');

  // 5. Maund <-> KG
  const [mkMode, setMkMode] = useState<'kgToMaund' | 'maundToKg'>('kgToMaund');
  const [mkValue, setMkValue] = useState('400');

  // 6. Rate calculator
  const [rateMaundVal, setRateMaundVal] = useState('4000');

  // 7. Total amount
  const [totQty, setTotQty] = useState('25');
  const [totRate, setTotRate] = useState('4200');

  // 8. Profit calculator
  const [profBuy, setProfBuy] = useState('400000');
  const [profSell, setProfSell] = useState('435000');
  const [profExp, setProfExp] = useState('8000');

  // 9. Discount calculator
  const [discPrice, setDiscPrice] = useState('10000');
  const [discPct, setDiscPct] = useState('5');

  // 10. Percentage calculator
  const [pctPart, setPctPart] = useState('2500');
  const [pctWhole, setPctWhole] = useState('100000');

  // 11. Agri Expense calculator
  const [expSeed, setExpSeed] = useState('15000');
  const [expFert, setExpFert] = useState('32000');
  const [expSpray, setExpSpray] = useState('12000');
  const [expWater, setExpWater] = useState('18000');
  const [expHarvest, setExpHarvest] = useState('22000');
  const [expTransport, setExpTransport] = useState('9000');
  const [expAcres, setExpAcres] = useState('2');

  const inputClass =
    'ltr-num min-h-[44px] w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-base font-bold text-slate-900 focus:border-[#0B7D50] focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100';
  const labelClass =
    'mb-1.5 block text-sm font-semibold text-slate-800 dark:text-slate-200';

  const renderBody = () => {
    switch (active) {
      case 'commission': {
        const amt = Number(commAmount) || 0;
        const pct = Number(commRate) || 0;
        const comm = Math.round(amt * (pct / 100));
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className={labelClass}>{isUr ? 'کل رقم (روپے)' : 'Amount (Rs)'}</label>
                <input
                  type="number"
                  dir="ltr"
                  value={commAmount}
                  onChange={(e) => setCommAmount(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>{t.commissionPercentLabel}</label>
                <input
                  type="number"
                  step="0.1"
                  dir="ltr"
                  value={commRate}
                  placeholder={
                    settings.commissionPercent > 0
                      ? String(settings.commissionPercent)
                      : '0'
                  }
                  onChange={(e) => setCommRate(e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3 rounded-2xl bg-[#F5F2E7] p-4 sm:grid-cols-2 dark:bg-slate-800">
              <div>
                <span className="text-xs text-slate-600 dark:text-slate-300">
                  {t.commissionLabel}
                </span>
                <p className="ltr-num text-2xl font-extrabold text-[#0B7D50] dark:text-emerald-400">
                  {formatRs(comm)}
                </p>
              </div>
              <div>
                <span className="text-xs text-slate-600 dark:text-slate-300">
                  {isUr ? 'کمیشن کٹوتی کے بعد باقی' : 'Net After Commission'}
                </span>
                <p className="ltr-num text-2xl font-extrabold text-slate-900 dark:text-slate-100">
                  {formatRs(amt - comm)}
                </p>
              </div>
            </div>
          </div>
        );
      }

      case 'sale':
      case 'purchase': {
        const isSaleMode = active === 'sale';
        const res = isSaleMode
          ? calculateSale(
              {
                totalWeight: Number(spWeight) || 0,
                bags: Number(spBags) || 0,
                marginCut: Number(spMargin) || 0,
                kandaCut: Number(spKanda) || 0,
                ratePerMaund: Number(spRate) || 0,
                advance: Number(spAdvance) || 0,
                taxLabour: Number(spTax) || 0,
              },
              settings
            )
          : calculatePurchase(
              {
                totalWeight: Number(spWeight) || 0,
                bags: Number(spBags) || 0,
                kandaCut: Number(spKanda) || 0,
                ratePerMaund: Number(spRate) || 0,
                advance: Number(spAdvance) || 0,
                taxLabour: Number(spTax) || 0,
              },
              settings
            );

        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <div>
                <label className={labelClass}>{t.totalWeightLabel}</label>
                <input
                  type="number"
                  dir="ltr"
                  value={spWeight}
                  onChange={(e) => setSpWeight(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>{t.bagsLabel}</label>
                <input
                  type="number"
                  dir="ltr"
                  value={spBags}
                  onChange={(e) => setSpBags(e.target.value)}
                  className={inputClass}
                />
              </div>
              {isSaleMode && (
                <div>
                  <label className={labelClass}>{t.marginCutLabel}</label>
                  <input
                    type="number"
                    dir="ltr"
                    value={spMargin}
                    onChange={(e) => setSpMargin(e.target.value)}
                    className={inputClass}
                  />
                </div>
              )}
              <div>
                <label className={labelClass}>{t.kandaCutLabel}</label>
                <input
                  type="number"
                  dir="ltr"
                  value={spKanda}
                  onChange={(e) => setSpKanda(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>{t.ratePerMaundLabel}</label>
                <input
                  type="number"
                  dir="ltr"
                  value={spRate}
                  onChange={(e) => setSpRate(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>{t.advanceLabel}</label>
                <input
                  type="number"
                  dir="ltr"
                  value={spAdvance}
                  onChange={(e) => setSpAdvance(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>
                  {isUr ? settings.taxLabourLabelUr : settings.taxLabourLabelEn} (Rs)
                </label>
                <input
                  type="number"
                  dir="ltr"
                  value={spTax}
                  onChange={(e) => setSpTax(e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 rounded-2xl bg-[#F5F2E7] p-4 sm:grid-cols-3 dark:bg-slate-800">
              <div>
                <span className="text-xs text-slate-600 dark:text-slate-300">{t.bardanaLabel}</span>
                <p className="ltr-num text-base font-bold text-slate-900 dark:text-slate-100">
                  {formatNumber(res.bardanaKg)} KG
                </p>
              </div>
              {!isSaleMode && (
                <div>
                  <span className="text-xs text-slate-600 dark:text-slate-300">{t.chungiLabel}</span>
                  <p className="ltr-num text-base font-bold text-slate-900 dark:text-slate-100">
                    {formatNumber(res.chungiKg)} KG
                  </p>
                </div>
              )}
              <div>
                <span className="text-xs text-slate-600 dark:text-slate-300">{t.netWeightLabel}</span>
                <p className="ltr-num text-base font-bold text-[#0B7D50] dark:text-emerald-400">
                  {formatNumber(res.netWeightKg)} KG
                </p>
              </div>
              <div>
                <span className="text-xs text-slate-600 dark:text-slate-300">{t.maundLabel}</span>
                <p className="ltr-num text-base font-bold text-slate-900 dark:text-slate-100">
                  {formatNumber(res.maundDisplay)}
                </p>
              </div>
              <div>
                <span className="text-xs text-slate-600 dark:text-slate-300">{t.grossAmountLabel}</span>
                <p className="ltr-num text-base font-bold text-slate-900 dark:text-slate-100">
                  {formatRs(res.grossAmount)}
                </p>
              </div>
              {res.commissionApplied && (
                <div>
                  <span className="text-xs text-slate-600 dark:text-slate-300">
                    {t.commissionLabel} ({res.commissionPercentUsed}%)
                  </span>
                  <p className="ltr-num text-base font-bold text-amber-700 dark:text-[#F2CC70]">
                    - {formatRs(res.commissionAmount)}
                  </p>
                </div>
              )}
              <div>
                <span className="text-xs font-bold text-[#12452D] dark:text-emerald-300">
                  {t.totalMizanLabel}
                </span>
                <p className="ltr-num text-xl font-extrabold text-[#0B7D50] dark:text-emerald-400">
                  {formatRs(res.totalMizan)}
                </p>
              </div>
            </div>
          </div>
        );
      }

      case 'weight': {
        const b = Number(wtBags) || 0;
        const per = Number(wtPerBag) || 0;
        const cut = Number(wtExtraCut) || 0;
        const grossKg = roundTo2(b * per);
        const bardana = roundTo2(b * settings.bardanaPerBag);
        const netKg = roundTo2(grossKg - bardana - cut);
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div>
                <label className={labelClass}>{t.bagsLabel}</label>
                <input type="number" dir="ltr" value={wtBags} onChange={(e) => setWtBags(e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>{isUr ? 'فی بوری وزن (کلو)' : 'Weight per Bag (KG)'}</label>
                <input type="number" dir="ltr" value={wtPerBag} onChange={(e) => setWtPerBag(e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>{isUr ? 'اضافی کاٹ (کلو)' : 'Extra Cut (KG)'}</label>
                <input type="number" dir="ltr" value={wtExtraCut} onChange={(e) => setWtExtraCut(e.target.value)} className={inputClass} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 rounded-2xl bg-[#F5F2E7] p-4 dark:bg-slate-800">
              <div>
                <span className="text-xs text-slate-600 dark:text-slate-300">{t.totalWeightLabel}</span>
                <p className="ltr-num text-lg font-bold text-slate-900 dark:text-slate-100">{formatNumber(grossKg)} KG</p>
              </div>
              <div>
                <span className="text-xs text-slate-600 dark:text-slate-300">{t.bardanaLabel}</span>
                <p className="ltr-num text-lg font-bold text-red-700 dark:text-red-400">{formatNumber(bardana)} KG</p>
              </div>
              <div>
                <span className="text-xs text-slate-600 dark:text-slate-300">{t.netWeightLabel}</span>
                <p className="ltr-num text-lg font-extrabold text-[#0B7D50] dark:text-emerald-400">{formatNumber(netKg)} KG</p>
              </div>
            </div>
          </div>
        );
      }

      case 'maundKg': {
        const val = Number(mkValue) || 0;
        const maundKg = settings.maundKg > 0 ? settings.maundKg : 40;
        const result =
          mkMode === 'kgToMaund' ? roundTo2(val / maundKg) : roundTo2(val * maundKg);
        return (
          <div className="space-y-4">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setMkMode('kgToMaund')}
                className={`min-h-[40px] rounded-xl px-4 py-2 text-xs font-bold ${
                  mkMode === 'kgToMaund'
                    ? 'bg-[#0B7D50] text-white'
                    : 'border border-slate-300 text-slate-700 dark:border-slate-700 dark:text-slate-200'
                }`}
              >
                {isUr ? 'کلوگرام ← من' : 'KG → Maund'}
              </button>
              <button
                type="button"
                onClick={() => setMkMode('maundToKg')}
                className={`min-h-[40px] rounded-xl px-4 py-2 text-xs font-bold ${
                  mkMode === 'maundToKg'
                    ? 'bg-[#0B7D50] text-white'
                    : 'border border-slate-300 text-slate-700 dark:border-slate-700 dark:text-slate-200'
                }`}
              >
                {isUr ? 'من ← کلوگرام' : 'Maund → KG'}
              </button>
            </div>
            <div>
              <label className={labelClass}>
                {mkMode === 'kgToMaund'
                  ? isUr
                    ? 'وزن (کلوگرام)'
                    : 'Weight (KG)'
                  : isUr
                    ? 'وزن (من)'
                    : 'Weight (Maund)'}
              </label>
              <input type="number" dir="ltr" value={mkValue} onChange={(e) => setMkValue(e.target.value)} className={inputClass} />
            </div>
            <div className="rounded-2xl bg-[#F5F2E7] p-4 dark:bg-slate-800">
              <span className="text-xs text-slate-600 dark:text-slate-300">
                1 {t.maundUnit} = {maundKg} KG
              </span>
              <p className="ltr-num mt-1 text-2xl font-extrabold text-[#0B7D50] dark:text-emerald-400">
                {formatNumber(result)} {mkMode === 'kgToMaund' ? t.maundUnit : 'KG'}
              </p>
            </div>
          </div>
        );
      }

      case 'rate': {
        const rm = Number(rateMaundVal) || 0;
        const maundKg = settings.maundKg > 0 ? settings.maundKg : 40;
        const perKg = roundTo2(rm / maundKg);
        const per100Kg = Math.round(perKg * 100);
        return (
          <div className="space-y-4">
            <div>
              <label className={labelClass}>{t.ratePerMaundLabel}</label>
              <input type="number" dir="ltr" value={rateMaundVal} onChange={(e) => setRateMaundVal(e.target.value)} className={inputClass} />
            </div>
            <div className="grid grid-cols-2 gap-3 rounded-2xl bg-[#F5F2E7] p-4 dark:bg-slate-800">
              <div>
                <span className="text-xs text-slate-600 dark:text-slate-300">
                  {isUr ? 'فی کلوگرام ریٹ' : 'Rate per KG'}
                </span>
                <p className="ltr-num text-2xl font-extrabold text-[#0B7D50] dark:text-emerald-400">
                  Rs {formatNumber(perKg)}
                </p>
              </div>
              <div>
                <span className="text-xs text-slate-600 dark:text-slate-300">
                  {isUr ? 'فی کوئنٹل (100 کلو) ریٹ' : 'Rate per 100 KG'}
                </span>
                <p className="ltr-num text-2xl font-extrabold text-slate-900 dark:text-slate-100">
                  {formatRs(per100Kg)}
                </p>
              </div>
            </div>
          </div>
        );
      }

      case 'totalAmount': {
        const q = Number(totQty) || 0;
        const r = Number(totRate) || 0;
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>{isUr ? 'تعداد / من' : 'Quantity / Maund'}</label>
                <input type="number" step="0.01" dir="ltr" value={totQty} onChange={(e) => setTotQty(e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>{t.rateLabel}</label>
                <input type="number" dir="ltr" value={totRate} onChange={(e) => setTotRate(e.target.value)} className={inputClass} />
              </div>
            </div>
            <div className="rounded-2xl bg-[#F5F2E7] p-4 dark:bg-slate-800">
              <span className="text-xs text-slate-600 dark:text-slate-300">{t.grossAmountLabel}</span>
              <p className="ltr-num mt-1 text-2xl font-extrabold text-[#0B7D50] dark:text-emerald-400">
                {formatRs(Math.round(q * r))}
              </p>
            </div>
          </div>
        );
      }

      case 'profit': {
        const b = Number(profBuy) || 0;
        const s = Number(profSell) || 0;
        const ex = Number(profExp) || 0;
        const net = s - b - ex;
        const pct = b > 0 ? roundTo2((net / b) * 100) : 0;
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div>
                <label className={labelClass}>{isUr ? 'لاگت / خرید (روپے)' : 'Cost / Buy (Rs)'}</label>
                <input type="number" dir="ltr" value={profBuy} onChange={(e) => setProfBuy(e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>{isUr ? 'فروخت قیمت (روپے)' : 'Sell Price (Rs)'}</label>
                <input type="number" dir="ltr" value={profSell} onChange={(e) => setProfSell(e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>{isUr ? 'اخراجات (روپے)' : 'Expenses (Rs)'}</label>
                <input type="number" dir="ltr" value={profExp} onChange={(e) => setProfExp(e.target.value)} className={inputClass} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 rounded-2xl bg-[#F5F2E7] p-4 dark:bg-slate-800">
              <div>
                <span className="text-xs text-slate-600 dark:text-slate-300">
                  {net >= 0 ? (isUr ? 'خالص نفع' : 'Net Profit') : isUr ? 'نقصان' : 'Net Loss'}
                </span>
                <p className={`ltr-num text-2xl font-extrabold ${net >= 0 ? 'text-[#0B7D50] dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                  {formatRs(net)}
                </p>
              </div>
              <div>
                <span className="text-xs text-slate-600 dark:text-slate-300">{isUr ? 'فیصد' : 'Margin %'}</span>
                <p className="ltr-num text-2xl font-extrabold text-slate-900 dark:text-slate-100">{pct}%</p>
              </div>
            </div>
          </div>
        );
      }

      case 'discount': {
        const p = Number(discPrice) || 0;
        const d = Number(discPct) || 0;
        const saved = Math.round(p * (d / 100));
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>{isUr ? 'اصل رقم (روپے)' : 'Original Amount (Rs)'}</label>
                <input type="number" dir="ltr" value={discPrice} onChange={(e) => setDiscPrice(e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>{isUr ? 'رعایت (%)' : 'Discount (%)'}</label>
                <input type="number" step="0.1" dir="ltr" value={discPct} onChange={(e) => setDiscPct(e.target.value)} className={inputClass} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 rounded-2xl bg-[#F5F2E7] p-4 dark:bg-slate-800">
              <div>
                <span className="text-xs text-slate-600 dark:text-slate-300">{isUr ? 'رعایت رقم' : 'Discount Amount'}</span>
                <p className="ltr-num text-xl font-bold text-red-700 dark:text-red-400">{formatRs(saved)}</p>
              </div>
              <div>
                <span className="text-xs text-slate-600 dark:text-slate-300">{isUr ? 'قابل ادائیگی رقم' : 'Final Payable'}</span>
                <p className="ltr-num text-2xl font-extrabold text-[#0B7D50] dark:text-emerald-400">{formatRs(p - saved)}</p>
              </div>
            </div>
          </div>
        );
      }

      case 'percentage': {
        const part = Number(pctPart) || 0;
        const whole = Number(pctWhole) || 0;
        const pct = whole > 0 ? roundTo2((part / whole) * 100) : 0;
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>{isUr ? 'حصہ / رقم' : 'Part Value'}</label>
                <input type="number" dir="ltr" value={pctPart} onChange={(e) => setPctPart(e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>{isUr ? 'کل رقم' : 'Total Value'}</label>
                <input type="number" dir="ltr" value={pctWhole} onChange={(e) => setPctWhole(e.target.value)} className={inputClass} />
              </div>
            </div>
            <div className="rounded-2xl bg-[#F5F2E7] p-4 dark:bg-slate-800">
              <span className="text-xs text-slate-600 dark:text-slate-300">{isUr ? 'نتیجہ فیصد' : 'Percentage'}</span>
              <p className="ltr-num mt-1 text-2xl font-extrabold text-[#0B7D50] dark:text-emerald-400">{pct}%</p>
            </div>
          </div>
        );
      }

      case 'agriExpense': {
        const total =
          (Number(expSeed) || 0) +
          (Number(expFert) || 0) +
          (Number(expSpray) || 0) +
          (Number(expWater) || 0) +
          (Number(expHarvest) || 0) +
          (Number(expTransport) || 0);
        const acres = Math.max(1, Number(expAcres) || 1);
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <div>
                <label className={labelClass}>{isUr ? 'بیج (روپے)' : 'Seed (Rs)'}</label>
                <input type="number" dir="ltr" value={expSeed} onChange={(e) => setExpSeed(e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>{isUr ? 'کھاد (روپے)' : 'Fertilizer (Rs)'}</label>
                <input type="number" dir="ltr" value={expFert} onChange={(e) => setExpFert(e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>{isUr ? 'سپرے / دوائی' : 'Spray / Pesticides'}</label>
                <input type="number" dir="ltr" value={expSpray} onChange={(e) => setExpSpray(e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>{isUr ? 'پانی / ڈیزل' : 'Irrigation / Fuel'}</label>
                <input type="number" dir="ltr" value={expWater} onChange={(e) => setExpWater(e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>{isUr ? 'کٹائی / تھریشر' : 'Harvesting / Labour'}</label>
                <input type="number" dir="ltr" value={expHarvest} onChange={(e) => setExpHarvest(e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>{isUr ? 'کرایہ / ٹرانسپورٹ' : 'Transport'}</label>
                <input type="number" dir="ltr" value={expTransport} onChange={(e) => setExpTransport(e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>{isUr ? 'کل رقبہ (ایکڑ)' : 'Total Area (Acres)'}</label>
                <input type="number" min="1" dir="ltr" value={expAcres} onChange={(e) => setExpAcres(e.target.value)} className={inputClass} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 rounded-2xl bg-[#F5F2E7] p-4 dark:bg-slate-800">
              <div>
                <span className="text-xs text-slate-600 dark:text-slate-300">{isUr ? 'کل زرعی خرچہ' : 'Total Expense'}</span>
                <p className="ltr-num text-2xl font-extrabold text-[#0B7D50] dark:text-emerald-400">{formatRs(total)}</p>
              </div>
              <div>
                <span className="text-xs text-slate-600 dark:text-slate-300">{isUr ? 'فی ایکڑ خرچہ' : 'Cost per Acre'}</span>
                <p className="ltr-num text-2xl font-extrabold text-slate-900 dark:text-slate-100">{formatRs(Math.round(total / acres))}</p>
              </div>
            </div>
          </div>
        );
      }
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-extrabold text-slate-900 dark:text-slate-100">
          {t.calcCentreTitle}
        </h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{t.calcSelectPrompt}</p>
      </div>

      {/* 11 Calculator Selector Tabs */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
        {calcList.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => setActive(c.id)}
            className={`flex min-h-[44px] items-center gap-2 rounded-xl border px-3 py-2 text-start text-xs font-bold transition sm:text-sm ${
              active === c.id
                ? 'border-[#0B7D50] bg-[#0B7D50] text-white shadow-sm'
                : 'border-slate-200 bg-white text-slate-800 hover:border-[#0B7D50] dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100'
            }`}
          >
            <Calculator className="h-4 w-4 shrink-0" />
            <span className="truncate">{c.label}</span>
          </button>
        ))}
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 dark:border-slate-800 dark:bg-slate-900">
        <h2 className="mb-4 border-b border-slate-200 pb-3 text-lg font-extrabold text-slate-900 dark:border-slate-800 dark:text-slate-100">
          {calcList.find((x) => x.id === active)?.label}
        </h2>
        {renderBody()}
      </div>
    </div>
  );
};

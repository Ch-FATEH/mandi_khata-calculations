import React, { useEffect, useState } from 'react';
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ImagePlus,
  PenTool,
  Settings2,
  Store,
  Trash2,
  Users,
  MapPin,
} from 'lucide-react';
import { AppLanguage, AppSettings, CommissionMode } from '../types/mandi';
import { Translations } from '../i18n/translations';

interface SetupWizardProps {
  open: boolean;
  language: AppLanguage;
  t: Translations;
  settings: AppSettings;
  logo: string | null;
  signature: string | null;
  onUpdateSettings: (next: AppSettings) => void;
  onUpdateLogo: (dataUrl: string | null) => void;
  onUpdateSignature: (dataUrl: string | null) => void;
  onFinish: () => void;
  onSkip: () => void;
}

function readImageAsDataUrl(file: File, maxDim = 480): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('File read error'));
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
        const w = Math.max(1, Math.round(img.width * scale));
        const h = Math.max(1, Math.round(img.height * scale));
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(String(reader.result));
          return;
        }
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/png'));
      };
      img.onerror = () => resolve(String(reader.result));
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

export const SetupWizard: React.FC<SetupWizardProps> = ({
  open,
  language,
  t,
  settings,
  logo,
  signature,
  onUpdateSettings,
  onUpdateLogo,
  onUpdateSignature,
  onFinish,
  onSkip,
}) => {
  const [step, setStep] = useState(1);
  const [draft, setDraft] = useState<AppSettings>(settings);

  useEffect(() => {
    if (open) {
      setDraft(settings);
      setStep(1);
    }
  }, [open]);

  if (!open) return null;

  const totalSteps = 6;
  const isRtl = language === 'ur';

  const commitDraft = (next: AppSettings) => {
    setDraft(next);
    onUpdateSettings(next);
  };

  const handleImagePick = async (
    e: React.ChangeEvent<HTMLInputElement>,
    kind: 'logo' | 'signature'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const dataUrl = await readImageAsDataUrl(file, kind === 'logo' ? 360 : 480);
    if (kind === 'logo') onUpdateLogo(dataUrl);
    else onUpdateSignature(dataUrl);
    e.target.value = '';
  };

  const stepIcons = [Store, Users, MapPin, ImagePlus, Settings2, CheckCircle2];
  const StepIcon = stepIcons[step - 1] || Store;

  const handleFinish = () => {
    onUpdateSettings(draft);
    onFinish();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-3 sm:p-6 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="wizard-heading"
    >
      <div className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
        {/* Top bar */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-[#0B7D50] px-5 py-4 text-white dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15">
              <StepIcon className="h-5 w-5 text-[#F2CC70]" />
            </div>
            <div>
              <h2 id="wizard-heading" className="text-base font-bold sm:text-lg">
                {t.wizardTitle}
              </h2>
              <p className="text-xs text-emerald-100">
                {t.wizardStep} <span className="ltr-num">{step} / {totalSteps}</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onSkip}
            className="min-h-[40px] rounded-xl bg-white/15 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-white/25"
          >
            {t.wizardSkip}
          </button>
        </div>

        {/* Progress indicator */}
        <div className="grid grid-cols-6 gap-1.5 bg-slate-50 px-5 py-3 dark:bg-slate-950/50">
          {[1, 2, 3, 4, 5, 6].map((num) => (
            <button
              key={num}
              type="button"
              onClick={() => setStep(num)}
              aria-label={`${t.wizardStep} ${num}`}
              className={`h-2 rounded-full transition-colors ${
                num <= step ? 'bg-[#0B7D50]' : 'bg-slate-200 dark:bg-slate-800'
              }`}
            />
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-7">
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                  {t.step1Title}
                </h3>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{t.step1Desc}</p>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-800 dark:text-slate-200">
                  {t.shopNameUr}
                </label>
                <input
                  type="text"
                  dir="rtl"
                  value={draft.shopNameUr}
                  onChange={(e) => commitDraft({ ...draft, shopNameUr: e.target.value })}
                  placeholder="اپنی دکان کا اردو نام لکھیں"
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 focus:border-[#0B7D50] focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-800 dark:text-slate-200">
                  {t.shopNameEn}
                </label>
                <input
                  type="text"
                  dir="ltr"
                  value={draft.shopNameEn}
                  onChange={(e) => commitDraft({ ...draft, shopNameEn: e.target.value })}
                  placeholder="Enter your shop name in English"
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 focus:border-[#0B7D50] focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-800 dark:text-slate-200">
                  {t.taglineLabel} ({t.optional})
                </label>
                <input
                  type="text"
                  value={draft.tagline}
                  onChange={(e) =>
                    commitDraft({
                      ...draft,
                      tagline: e.target.value,
                      receiptHeaderLine: e.target.value,
                    })
                  }
                  placeholder={isRtl ? 'آڑھت غلہ منڈی و زرعی اجناس' : 'Grain Market & Agricultural Commodities'}
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 focus:border-[#0B7D50] focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                  {t.step2Title}
                </h3>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{t.step2Desc}</p>
              </div>
              {draft.owners.map((owner, idx) => (
                <div
                  key={idx}
                  className="grid grid-cols-1 gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:grid-cols-2 dark:border-slate-800 dark:bg-slate-800/50"
                >
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      {t.ownerLabel} {idx + 1} — {t.ownerName}
                    </label>
                    <input
                      type="text"
                      value={owner.name}
                      onChange={(e) => {
                        const owners = [...draft.owners];
                        owners[idx] = { ...owners[idx], name: e.target.value };
                        commitDraft({ ...draft, owners });
                      }}
                      className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-[#0B7D50] focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      {t.ownerMobile}
                    </label>
                    <input
                      type="tel"
                      dir="ltr"
                      value={owner.phone}
                      onChange={(e) => {
                        const owners = [...draft.owners];
                        owners[idx] = { ...owners[idx], phone: e.target.value };
                        commitDraft({ ...draft, owners });
                      }}
                      placeholder="03XX-XXXXXXX"
                      className="ltr-num w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-[#0B7D50] focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                  {t.step3Title}
                </h3>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{t.step3Desc}</p>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-800 dark:text-slate-200">
                  {t.addressLabel}
                </label>
                <textarea
                  rows={3}
                  value={draft.address}
                  onChange={(e) =>
                    commitDraft({
                      ...draft,
                      address: e.target.value,
                      receiptFooterAddress: e.target.value,
                    })
                  }
                  placeholder={isRtl ? 'دکان نمبر، غلہ منڈی...' : 'Shop No., Grain Market...'}
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 focus:border-[#0B7D50] focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-800 dark:text-slate-200">
                  {t.cityLabel}
                </label>
                <input
                  type="text"
                  value={draft.city}
                  onChange={(e) => commitDraft({ ...draft, city: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 focus:border-[#0B7D50] focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                />
              </div>
              <div className="space-y-2 rounded-2xl border border-slate-200 bg-slate-50 p-3.5 dark:border-slate-800 dark:bg-slate-800/40">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  {t.googleMapsLinkLabel}
                </label>
                <input
                  type="url"
                  dir="ltr"
                  value={draft.shopMapLink || ''}
                  onChange={(e) => commitDraft({ ...draft, shopMapLink: e.target.value })}
                  placeholder="https://maps.google.com/?q=..."
                  className="ltr-num w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-[#0B7D50] focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                />
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (!navigator.geolocation) return;
                      navigator.geolocation.getCurrentPosition(
                        (pos) => {
                          const lat = Number(pos.coords.latitude.toFixed(6));
                          const lng = Number(pos.coords.longitude.toFixed(6));
                          const mapsUrl = `https://www.google.com/maps?q=${lat},${lng}`;
                          commitDraft({
                            ...draft,
                            shopLat: lat,
                            shopLng: lng,
                            shopMapLink: draft.shopMapLink?.trim() || mapsUrl,
                          });
                        },
                        () => {
                          // User denied or unavailable; manual link still works
                        },
                        { enableHighAccuracy: true, timeout: 8000 }
                      );
                    }}
                    className="inline-flex min-h-[38px] items-center gap-1.5 rounded-xl border border-[#0B7D50] bg-white px-3 py-1.5 text-xs font-bold text-[#0B7D50] hover:bg-emerald-50 dark:bg-slate-900 dark:text-emerald-400"
                  >
                    <MapPin className="h-3.5 w-3.5" />
                    <span>{t.useCurrentLocationBtn}</span>
                  </button>
                  {(draft.shopMapLink?.trim() || (draft.shopLat && draft.shopLng)) && (
                    <a
                      href={
                        draft.shopMapLink?.trim() ||
                        `https://www.google.com/maps?q=${draft.shopLat},${draft.shopLng}`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex min-h-[38px] items-center gap-1.5 rounded-xl bg-[#0B7D50] px-3 py-1.5 text-xs font-bold text-white"
                    >
                      <MapPin className="h-3.5 w-3.5 text-[#F2CC70]" />
                      <span>{t.openInMapsBtn}</span>
                    </a>
                  )}
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-5">
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                  {t.step4Title}
                </h3>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{t.step4Desc}</p>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/50">
                  <div className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-800 dark:text-slate-100">
                    <ImagePlus className="h-4 w-4 text-[#0B7D50]" />
                    <span>{t.uploadLogo}</span>
                  </div>
                  {logo ? (
                    <div className="space-y-3">
                      <img
                        src={logo}
                        alt="Shop Logo"
                        className="mx-auto h-24 w-24 rounded-xl border border-slate-200 bg-white object-contain p-1"
                      />
                      <button
                        type="button"
                        onClick={() => onUpdateLogo(null)}
                        className="flex w-full min-h-[40px] items-center justify-center gap-1.5 rounded-xl border border-red-300 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-100"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        {t.removeLogo}
                      </button>
                    </div>
                  ) : (
                    <label className="flex min-h-[112px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-white p-4 text-center text-xs font-medium text-slate-600 hover:border-[#0B7D50] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
                      <ImagePlus className="mb-2 h-6 w-6 text-[#0B7D50]" />
                      <span>{t.uploadLogo}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImagePick(e, 'logo')}
                        className="sr-only"
                      />
                    </label>
                  )}
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/50">
                  <div className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-800 dark:text-slate-100">
                    <PenTool className="h-4 w-4 text-[#0B7D50]" />
                    <span>{t.uploadSignature}</span>
                  </div>
                  {signature ? (
                    <div className="space-y-3">
                      <img
                        src={signature}
                        alt="Owner Signature"
                        className="mx-auto h-24 w-full rounded-xl border border-slate-200 bg-white object-contain p-2"
                      />
                      <button
                        type="button"
                        onClick={() => onUpdateSignature(null)}
                        className="flex w-full min-h-[40px] items-center justify-center gap-1.5 rounded-xl border border-red-300 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-100"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        {t.removeSignature}
                      </button>
                    </div>
                  ) : (
                    <label className="flex min-h-[112px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-white p-4 text-center text-xs font-medium text-slate-600 hover:border-[#0B7D50] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
                      <PenTool className="mb-2 h-6 w-6 text-[#0B7D50]" />
                      <span>{t.uploadSignature}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImagePick(e, 'signature')}
                        className="sr-only"
                      />
                    </label>
                  )}
                  <p className="mt-2 text-xs text-slate-600 dark:text-slate-400">
                    {t.signatureHint}
                  </p>
                </div>
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                  {t.step5Title}
                </h3>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{t.step5Desc}</p>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-800 dark:text-slate-200">
                    {t.commissionPercentLabel}
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    dir="ltr"
                    value={draft.commissionPercent || ''}
                    placeholder="0"
                    onChange={(e) =>
                      commitDraft({
                        ...draft,
                        commissionPercent: Math.max(0, Number(e.target.value) || 0),
                      })
                    }
                    className="ltr-num w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-base text-slate-900 focus:border-[#0B7D50] focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-800 dark:text-slate-200">
                    {t.commissionModeLabel}
                  </label>
                  <select
                    value={draft.commissionMode}
                    onChange={(e) =>
                      commitDraft({
                        ...draft,
                        commissionMode: e.target.value as CommissionMode,
                      })
                    }
                    className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-[#0B7D50] focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  >
                    <option value="off">{t.commModeOff}</option>
                    <option value="sales">{t.commModeSales}</option>
                    <option value="purchase">{t.commModePurchase}</option>
                    <option value="both">{t.commModeBoth}</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-800 dark:text-slate-200">
                    {t.maundKgLabel}
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    min="1"
                    dir="ltr"
                    value={draft.maundKg}
                    onChange={(e) =>
                      commitDraft({
                        ...draft,
                        maundKg: Math.max(1, Number(e.target.value) || 40),
                      })
                    }
                    className="ltr-num w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-base text-slate-900 focus:border-[#0B7D50] focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-800 dark:text-slate-200">
                    {t.bardanaPerBagLabel}
                  </label>
                  <input
                    type="number"
                    step="0.05"
                    min="0"
                    dir="ltr"
                    value={draft.bardanaPerBag}
                    onChange={(e) =>
                      commitDraft({
                        ...draft,
                        bardanaPerBag: Math.max(0, Number(e.target.value) || 0),
                      })
                    }
                    className="ltr-num w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-base text-slate-900 focus:border-[#0B7D50] focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  />
                </div>
              </div>
            </div>
          )}

          {step === 6 && (
            <div className="space-y-4 py-4 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 text-[#0B7D50] dark:bg-emerald-950 dark:text-emerald-400">
                <CheckCircle2 className="h-9 w-9" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                {t.step6Title}
              </h3>
              <p className="mx-auto max-w-md text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                {t.step6Desc}
              </p>
              <div className="mx-auto max-w-sm rounded-2xl border border-slate-200 bg-[#F5F2E7] p-4 text-start dark:border-slate-700 dark:bg-slate-800">
                <p className="text-sm font-bold text-[#12452D] dark:text-emerald-300">
                  {draft.shopNameUr || draft.shopNameEn || t.defaultShopName}
                </p>
                {draft.city && (
                  <p className="mt-1 text-xs text-slate-700 dark:text-slate-300">{draft.city}</p>
                )}
                <p className="mt-2 text-xs text-slate-700 dark:text-slate-300">
                  {t.maundKgLabel}: <span className="ltr-num font-bold">{draft.maundKg} KG</span> ·{' '}
                  {t.bardanaPerBagLabel}:{' '}
                  <span className="ltr-num font-bold">{draft.bardanaPerBag} KG</span>
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-5 py-4 dark:border-slate-800 dark:bg-slate-950/60">
          <button
            type="button"
            disabled={step === 1}
            onClick={() => setStep((s) => Math.max(1, s - 1))}
            className="flex min-h-[44px] items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:opacity-40 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
          >
            {isRtl ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            {t.wizardBack}
          </button>

          {step < totalSteps ? (
            <button
              type="button"
              onClick={() => setStep((s) => Math.min(totalSteps, s + 1))}
              className="flex min-h-[44px] items-center gap-1.5 rounded-xl bg-[#0B7D50] px-6 py-2 text-sm font-bold text-white transition hover:bg-[#12452D]"
            >
              {t.wizardNext}
              {isRtl ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </button>
          ) : (
            <button
              type="button"
              onClick={handleFinish}
              className="flex min-h-[44px] items-center gap-2 rounded-xl bg-[#0B7D50] px-6 py-2 text-sm font-bold text-white transition hover:bg-[#12452D]"
            >
              <CheckCircle2 className="h-4 w-4" />
              {t.wizardFinish}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

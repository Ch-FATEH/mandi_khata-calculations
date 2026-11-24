import React, { useEffect, useState } from 'react';
import {
  Check,
  Edit3,
  ImagePlus,
  Plus,
  Shield,
  Trash2,
} from 'lucide-react';
import {
  AdBanner,
  AuthUserSummary,
  GlobalAppConfig,
} from '../types/mandi';
import { Translations } from '../i18n/translations';
import { isAdminUser } from '../config';
import {
  deleteAdInFirestore,
  ensureFirestoreAdminSignedIn,
  needsSeparateFirestoreAdminAuth,
  saveAdToFirestore,
  saveGlobalAppConfig,
  subscribeAllAdsForAdmin,
} from '../services/firebaseService';

interface AdminPanelProps {
  t: Translations;
  authUser: AuthUserSummary | null;
  globalConfig: GlobalAppConfig;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  t,
  authUser,
  globalConfig,
}) => {
  const [ads, setAds] = useState<AdBanner[]>([]);
  const [editingAdId, setEditingAdId] = useState<string | undefined>(undefined);
  const [adTitle, setAdTitle] = useState('');
  const [adDesc, setAdDesc] = useState('');
  const [adImg, setAdImg] = useState('');
  const [adBtnText, setAdBtnText] = useState('');
  const [adBtnLink, setAdBtnLink] = useState('');
  const [adActive, setAdActive] = useState(true);
  const [adStart, setAdStart] = useState('');
  const [adEnd, setAdEnd] = useState('');

  const [configDraft, setConfigDraft] = useState<GlobalAppConfig>(globalConfig);
  const [statusMsg, setStatusMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    setConfigDraft(globalConfig);
  }, [globalConfig]);

  useEffect(() => {
    if (!isAdminUser(authUser?.email)) return;
    const unsub = subscribeAllAdsForAdmin(setAds);
    return () => unsub();
  }, [authUser?.email]);

  if (!isAdminUser(authUser?.email)) {
    return null;
  }

  const showSuccess = (msg: string) => {
    setErrorMsg('');
    setStatusMsg(msg);
    setTimeout(() => setStatusMsg(''), 3000);
  };

  const handleConnectFirestoreAdmin = async () => {
    try {
      await ensureFirestoreAdminSignedIn();
      showSuccess(t.savedToast);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Admin auth failed');
    }
  };

  const handleImagePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, 720 / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(img.width * scale));
        canvas.height = Math.max(1, Math.round(img.height * scale));
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          setAdImg(canvas.toDataURL('image/jpeg', 0.8));
        }
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const resetAdForm = () => {
    setEditingAdId(undefined);
    setAdTitle('');
    setAdDesc('');
    setAdImg('');
    setAdBtnText('');
    setAdBtnLink('');
    setAdActive(true);
    setAdStart('');
    setAdEnd('');
  };

  const handleSaveAd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adTitle.trim()) return;
    try {
      await saveAdToFirestore(
        {
          title: adTitle.trim(),
          description: adDesc.trim(),
          imageUrl: adImg.trim(),
          buttonText: adBtnText.trim(),
          buttonLink: adBtnLink.trim(),
          active: adActive,
          startDate: adStart.trim(),
          endDate: adEnd.trim(),
          placement: 'dashboard_top',
        },
        editingAdId
      );
      resetAdForm();
      showSuccess(t.savedToast);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to save ad');
    }
  };

  const handleSaveConfig = async () => {
    try {
      await saveGlobalAppConfig(configDraft);
      showSuccess(t.savedToast);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to save config');
    }
  };

  const inputClass =
    'min-h-[42px] w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100';

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl bg-[#12452D] p-5 text-white">
        <div className="flex items-center gap-3">
          <Shield className="h-6 w-6 text-[#F2CC70]" />
          <div>
            <h1 className="text-xl font-extrabold">{t.adminTitle}</h1>
            <p className="ltr-num text-xs text-emerald-100">{authUser?.email}</p>
          </div>
        </div>
        {needsSeparateFirestoreAdminAuth() && (
          <button
            type="button"
            onClick={handleConnectFirestoreAdmin}
            className="min-h-[40px] rounded-xl bg-[#D9AA45] px-4 py-2 text-xs font-extrabold text-[#12452D]"
          >
            {t.adminConnectSessionBtn}
          </button>
        )}
      </div>

      {statusMsg && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-900">
          <Check className="h-4 w-4 text-[#0B7D50]" />
          <span>{statusMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm font-bold text-red-800">
          {errorMsg}
        </div>
      )}

      {/* Global Tutorial Video & Premium AI Toggles */}
      <section className="space-y-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-base font-extrabold text-slate-900 dark:text-slate-100">
          {t.adminAppConfigSection}
        </h2>
        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
            {t.adminYoutubeUrlLabel}
          </label>
          <input
            type="url"
            dir="ltr"
            value={configDraft.tutorialYoutubeUrl}
            onChange={(e) =>
              setConfigDraft({ ...configDraft, tutorialYoutubeUrl: e.target.value })
            }
            placeholder="https://www.youtube.com/watch?v=..."
            className={inputClass}
          />
        </div>
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          {(
            [
              ['aiEnabled', t.adminAiMasterToggle],
              ['aiDailySummaryEnabled', t.adminAiDailyToggle],
              ['aiDraftEntryEnabled', t.adminAiDraftToggle],
              ['aiChatEnabled', t.adminAiChatToggle],
            ] as [keyof GlobalAppConfig, string][]
          ).map(([key, label]) => (
            <label
              key={key}
              className="flex min-h-[44px] cursor-pointer items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold dark:border-slate-800 dark:bg-slate-800/50"
            >
              <span>{label}</span>
              <input
                type="checkbox"
                checked={Boolean(configDraft[key])}
                onChange={(e) =>
                  setConfigDraft({ ...configDraft, [key]: e.target.checked })
                }
                className="h-5 w-5 accent-[#0B7D50]"
              />
            </label>
          ))}
        </div>
        <button
          type="button"
          onClick={handleSaveConfig}
          className="min-h-[44px] rounded-xl bg-[#0B7D50] px-5 py-2.5 text-sm font-extrabold text-white hover:bg-[#12452D]"
        >
          {t.save}
        </button>
      </section>

      {/* Ads CRUD */}
      <section className="space-y-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-base font-extrabold text-slate-900 dark:text-slate-100">
          {t.adminAdsSection}
        </h2>
        <form onSubmit={handleSaveAd} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <input
            type="text"
            value={adTitle}
            onChange={(e) => setAdTitle(e.target.value)}
            placeholder={t.adminAdTitle}
            className={inputClass}
          />
          <input
            type="text"
            value={adBtnText}
            onChange={(e) => setAdBtnText(e.target.value)}
            placeholder={t.adminAdBtnText}
            className={inputClass}
          />
          <textarea
            rows={2}
            value={adDesc}
            onChange={(e) => setAdDesc(e.target.value)}
            placeholder={t.adminAdDesc}
            className={`sm:col-span-2 ${inputClass}`}
          />
          <input
            type="url"
            dir="ltr"
            value={adBtnLink}
            onChange={(e) => setAdBtnLink(e.target.value)}
            placeholder={t.adminAdBtnLink}
            className={inputClass}
          />
          <div className="flex gap-2">
            <input
              type="text"
              dir="ltr"
              value={adImg}
              onChange={(e) => setAdImg(e.target.value)}
              placeholder={t.adminAdImgUrl}
              className={inputClass}
            />
            <label className="flex min-h-[42px] shrink-0 cursor-pointer items-center gap-1 rounded-xl border border-slate-300 px-3 text-xs font-bold dark:border-slate-700">
              <ImagePlus className="h-4 w-4 text-[#0B7D50]" />
              <input type="file" accept="image/*" onChange={handleImagePick} className="sr-only" />
            </label>
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold">{t.adminAdStartDate}</label>
            <input
              type="date"
              dir="ltr"
              value={adStart}
              onChange={(e) => setAdStart(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold">{t.adminAdEndDate}</label>
            <input
              type="date"
              dir="ltr"
              value={adEnd}
              onChange={(e) => setAdEnd(e.target.value)}
              className={inputClass}
            />
          </div>
          <label className="flex min-h-[42px] items-center justify-between rounded-xl border border-slate-200 px-3 text-sm font-semibold dark:border-slate-700">
            <span>{t.adminAdActive}</span>
            <input
              type="checkbox"
              checked={adActive}
              onChange={(e) => setAdActive(e.target.checked)}
              className="h-5 w-5 accent-[#0B7D50]"
            />
          </label>
          <div className="flex gap-2">
            <button
              type="submit"
              className="flex min-h-[42px] flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#0B7D50] px-4 py-2 text-xs font-extrabold text-white"
            >
              <Plus className="h-4 w-4" />
              <span>{editingAdId ? t.update : t.adminAddAdBtn}</span>
            </button>
            {editingAdId && (
              <button
                type="button"
                onClick={resetAdForm}
                className="min-h-[42px] rounded-xl border border-slate-300 px-3 text-xs font-bold"
              >
                {t.cancel}
              </button>
            )}
          </div>
        </form>

        <div className="space-y-2.5 pt-2">
          {ads.map((ad) => (
            <div
              key={ad.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3.5 dark:border-slate-800 dark:bg-slate-800/50"
            >
              <div className="min-w-0 flex-1">
                <p className="font-extrabold text-slate-900 dark:text-slate-100">
                  {ad.title}{' '}
                  <span
                    className={`ms-2 rounded px-2 py-0.5 text-[10px] font-bold ${
                      ad.active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {ad.active ? 'ACTIVE' : 'OFF'}
                  </span>
                </p>
                <p className="truncate text-xs text-slate-600 dark:text-slate-300">
                  {ad.description}
                </p>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setEditingAdId(ad.id);
                    setAdTitle(ad.title);
                    setAdDesc(ad.description);
                    setAdImg(ad.imageUrl || '');
                    setAdBtnText(ad.buttonText || '');
                    setAdBtnLink(ad.buttonLink || '');
                    setAdActive(ad.active);
                    setAdStart(ad.startDate || '');
                    setAdEnd(ad.endDate || '');
                  }}
                  className="rounded-lg border border-slate-300 p-2 text-slate-700 dark:border-slate-700 dark:text-slate-200"
                >
                  <Edit3 className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => deleteAdInFirestore(ad.id)}
                  className="rounded-lg border border-red-200 bg-red-50 p-2 text-red-700 dark:border-red-900 dark:bg-red-950/60 dark:text-red-300"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

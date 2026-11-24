import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  Check,
  Cloud,
  CloudUpload,
  Download,
  ExternalLink,
  History,
  ImagePlus,
  LogIn,
  LogOut,
  MapPin,
  PenTool,
  Plus,
  RefreshCw,
  RotateCcw,
  Trash2,
  Upload,
  UserCheck,
  X,
} from 'lucide-react';
import {
  AppLanguage,
  AppSettings,
  AuthUserSummary,
  AutoBackupFrequency,
  AutoBackupSettings,
  BackupPayload,
  CommissionMode,
  CropItem,
  LocalSnapshot,
  PartyMeta,
  PartyPayment,
  PurchaseRecord,
  RefCounters,
  RoznamchaEntry,
  RoznamchaSettings,
  SaleRecord,
  ThemeMode,
} from '../types/mandi';
import { Translations } from '../i18n/translations';
import {
  createBackupPayload,
  formatBytes,
  validateBackupPayload,
} from '../utils/storage';
import { isFirebaseAuthConfigured } from '../config';
import { DriveBackupFileMeta } from '../services/driveBackupService';
import { buildShopMapsHref } from './AboutView';

interface CropRowProps {
  crop: CropItem;
  canDelete: boolean;
  t: Translations;
  inputClass: string;
  onUpdate: (patch: Partial<CropItem>) => void;
  onDelete: () => void;
}

const CropRow: React.FC<CropRowProps> = ({
  crop,
  canDelete,
  t,
  inputClass,
  onUpdate,
  onDelete,
}) => {
  const [varietiesText, setVarietiesText] = useState(crop.varieties.join(', '));

  useEffect(() => {
    setVarietiesText(crop.varieties.join(', '));
  }, [crop.id]);

  return (
    <div className="grid grid-cols-1 gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-3 sm:grid-cols-12 dark:border-slate-800 dark:bg-slate-800/40">
      <div className="sm:col-span-3">
        <input
          type="text"
          dir="rtl"
          aria-label={t.addCropNameUr}
          value={crop.nameUr}
          onChange={(e) => onUpdate({ nameUr: e.target.value })}
          className={inputClass}
        />
      </div>
      <div className="sm:col-span-3">
        <input
          type="text"
          dir="ltr"
          aria-label={t.addCropNameEn}
          value={crop.nameEn}
          onChange={(e) => onUpdate({ nameEn: e.target.value })}
          className={inputClass}
        />
      </div>
      <div className="sm:col-span-5">
        <input
          type="text"
          aria-label={t.varietyLabel}
          value={varietiesText}
          placeholder={t.varietiesPlaceholder}
          onChange={(e) => {
            const raw = e.target.value;
            setVarietiesText(raw);
            onUpdate({
              varieties: raw
                .split(',')
                .map((s) => s.trim())
                .filter(Boolean),
            });
          }}
          className={inputClass}
        />
      </div>
      <div className="flex items-center justify-end sm:col-span-1">
        <button
          type="button"
          disabled={!canDelete}
          onClick={onDelete}
          aria-label={`${t.delete} ${crop.nameEn}`}
          className="flex min-h-[40px] min-w-[40px] items-center justify-center rounded-xl text-red-600 hover:bg-red-100 disabled:opacity-30 dark:text-red-400"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

interface SettingsViewProps {
  language: AppLanguage;
  theme: ThemeMode;
  t: Translations;
  settings: AppSettings;
  logo: string | null;
  signature: string | null;
  sales: SaleRecord[];
  purchases: PurchaseRecord[];
  ledger: PartyPayment[];
  partyMeta: Record<string, PartyMeta>;
  roznamchaEntries: RoznamchaEntry[];
  roznamchaSettings: RoznamchaSettings;
  counters: RefCounters;
  authUser: AuthUserSummary | null;
  hasDriveToken: boolean;
  authNotice: string;
  autoBackupSettings: AutoBackupSettings;
  localSnapshots: LocalSnapshot[];
  onUpdateSettings: (next: AppSettings) => void;
  onUpdateLogo: (dataUrl: string | null) => void;
  onUpdateSignature: (dataUrl: string | null) => void;
  onChangeTheme: (next: ThemeMode) => void;
  onChangeLanguage: (next: AppLanguage) => void;
  onReopenWizard: () => void;
  onRestoreBackup: (payload: BackupPayload, mode: 'merge' | 'replace') => void;
  onGoogleSignIn: () => Promise<void>;
  onGoogleSignOut: () => Promise<void>;
  onUpdateAutoBackup: (patch: Partial<AutoBackupSettings>) => void;
  onBackupNow: () => Promise<void>;
  onDriveBackupNow: () => Promise<void>;
  onListDriveBackups: () => Promise<DriveBackupFileMeta[]>;
  onDownloadDriveBackup: (fileId: string) => Promise<BackupPayload>;
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

function formatDateTimeDisplay(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString('en-PK', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  language,
  theme,
  t,
  settings,
  logo,
  signature,
  sales,
  purchases,
  ledger,
  partyMeta,
  roznamchaEntries,
  roznamchaSettings,
  counters,
  authUser,
  hasDriveToken,
  authNotice,
  autoBackupSettings,
  localSnapshots,
  onUpdateSettings,
  onUpdateLogo,
  onUpdateSignature,
  onChangeTheme,
  onChangeLanguage,
  onReopenWizard,
  onRestoreBackup,
  onGoogleSignIn,
  onGoogleSignOut,
  onUpdateAutoBackup,
  onBackupNow,
  onDriveBackupNow,
  onListDriveBackups,
  onDownloadDriveBackup,
}) => {
  const [newCropUr, setNewCropUr] = useState('');
  const [newCropEn, setNewCropEn] = useState('');
  const [newCropVarieties, setNewCropVarieties] = useState('');

  const [pendingBackup, setPendingBackup] = useState<BackupPayload | null>(null);
  const [backupError, setBackupError] = useState('');
  const [backupSuccess, setBackupSuccess] = useState('');
  const [backupBusy, setBackupBusy] = useState(false);

  const [driveModalOpen, setDriveModalOpen] = useState(false);
  const [driveFiles, setDriveFiles] = useState<DriveBackupFileMeta[]>([]);
  const [driveBusy, setDriveBusy] = useState(false);

  const [locBusy, setLocBusy] = useState(false);
  const [locMsg, setLocMsg] = useState('');

  const update = (patch: Partial<AppSettings>) => {
    onUpdateSettings({ ...settings, ...patch });
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

  const handleAddCrop = () => {
    const ur = newCropUr.trim();
    const en = newCropEn.trim();
    if (!ur && !en) return;
    const vars = newCropVarieties
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const crop: CropItem = {
      id: `crop_${Date.now()}`,
      nameUr: ur || en,
      nameEn: en || ur,
      varieties: vars,
    };
    update({ crops: [...settings.crops, crop] });
    setNewCropUr('');
    setNewCropEn('');
    setNewCropVarieties('');
  };

  const handleUpdateCrop = (id: string, patch: Partial<CropItem>) => {
    update({
      crops: settings.crops.map((c) => (c.id === id ? { ...c, ...patch } : c)),
    });
  };

  const handleDeleteCrop = (id: string) => {
    if (settings.crops.length <= 1) return;
    update({ crops: settings.crops.filter((c) => c.id !== id) });
  };

  const handleCaptureLocation = () => {
    setLocMsg('');
    if (!navigator.geolocation) {
      setLocMsg(t.locationErrorMsg);
      return;
    }
    setLocBusy(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = Number(pos.coords.latitude.toFixed(6));
        const lng = Number(pos.coords.longitude.toFixed(6));
        const mapsUrl = `https://www.google.com/maps?q=${lat},${lng}`;
        update({
          shopLat: lat,
          shopLng: lng,
          shopMapLink: settings.shopMapLink?.trim() || mapsUrl,
        });
        setLocBusy(false);
        setLocMsg(t.locationSavedMsg);
        setTimeout(() => setLocMsg(''), 3000);
      },
      () => {
        setLocBusy(false);
        setLocMsg(t.locationErrorMsg);
      },
      { enableHighAccuracy: true, timeout: 9000 }
    );
  };

  const handleExportJson = () => {
    const payload = createBackupPayload({
      sales,
      purchases,
      ledger,
      partyMeta,
      roznamchaEntries,
      roznamchaSettings,
      counters,
      settings,
      theme,
      language,
      logo,
      signature,
    });
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mandi-khata-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const handleBackupFilePick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setBackupError('');
    setBackupSuccess('');
    setPendingBackup(null);
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const result = validateBackupPayload(parsed);
      if (!result.valid || !result.payload) {
        setBackupError(t.backupInvalidError);
      } else {
        setPendingBackup(result.payload);
      }
    } catch {
      setBackupError(t.backupInvalidError);
    }
    e.target.value = '';
  };

  const handleManualBackupNow = async () => {
    setBackupError('');
    setBackupSuccess('');
    setBackupBusy(true);
    try {
      await onBackupNow();
      setBackupSuccess(t.savedToast);
      setTimeout(() => setBackupSuccess(''), 3000);
    } catch (err) {
      setBackupError(err instanceof Error ? err.message : 'Backup failed');
    } finally {
      setBackupBusy(false);
    }
  };

  const handleDriveUploadClick = async () => {
    setBackupError('');
    setBackupSuccess('');
    setDriveBusy(true);
    try {
      await onDriveBackupNow();
      setBackupSuccess(t.savedToast);
      setTimeout(() => setBackupSuccess(''), 3000);
    } catch (err) {
      setBackupError(err instanceof Error ? err.message : 'Drive backup failed');
    } finally {
      setDriveBusy(false);
    }
  };

  const handleOpenDriveList = async () => {
    setBackupError('');
    setDriveModalOpen(true);
    setDriveBusy(true);
    try {
      const files = await onListDriveBackups();
      setDriveFiles(files);
    } catch (err) {
      setBackupError(err instanceof Error ? err.message : 'Drive list failed');
      setDriveFiles([]);
    } finally {
      setDriveBusy(false);
    }
  };

  const handleSelectDriveFile = async (fileId: string) => {
    setBackupError('');
    setDriveBusy(true);
    try {
      const payload = await onDownloadDriveBackup(fileId);
      setDriveModalOpen(false);
      setPendingBackup(payload);
    } catch (err) {
      setBackupError(err instanceof Error ? err.message : 'Drive download failed');
    } finally {
      setDriveBusy(false);
    }
  };

  const applyBackup = (mode: 'merge' | 'replace') => {
    if (!pendingBackup) return;
    onRestoreBackup(pendingBackup, mode);
    setPendingBackup(null);
    setBackupSuccess(t.backupSuccessMsg);
    setTimeout(() => setBackupSuccess(''), 3000);
  };

  const mapsHref = buildShopMapsHref(settings);

  const inputClass =
    'min-h-[42px] w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 focus:border-[#0B7D50] focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100';
  const numInputClass = `ltr-num font-bold ${inputClass}`;
  const labelClass =
    'mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300';
  const sectionClass =
    'rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 dark:border-slate-800 dark:bg-slate-900 space-y-4';

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 dark:text-slate-100">
            {t.settingsTitle}
          </h1>
          <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
            {t.settingsSavedNote}
          </p>
        </div>
        <button
          type="button"
          onClick={onReopenWizard}
          className="flex min-h-[42px] items-center gap-2 rounded-xl border border-[#0B7D50] px-4 py-2 text-xs font-bold text-[#0B7D50] hover:bg-emerald-50 dark:border-emerald-500 dark:text-emerald-400 dark:hover:bg-emerald-950/50"
        >
          <RotateCcw className="h-4 w-4" />
          {t.reopenWizard}
        </button>
      </div>

      {/* 0. Google Account & Cloud Sync */}
      <section className={sectionClass}>
        <h2 className="text-base font-extrabold text-slate-900 dark:text-slate-100">
          {t.googleAccountSection}
        </h2>

        {authUser ? (
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 dark:border-emerald-900 dark:bg-emerald-950/30">
            <div className="flex items-center gap-3">
              {authUser.photoURL ? (
                <img
                  src={authUser.photoURL}
                  alt={authUser.displayName || 'User'}
                  className="h-12 w-12 rounded-full border border-[#0B7D50]/30 object-cover"
                />
              ) : (
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#0B7D50] text-white">
                  <UserCheck className="h-6 w-6" />
                </div>
              )}
              <div>
                <p className="text-sm font-extrabold text-slate-900 dark:text-slate-100">
                  {authUser.displayName || t.signedInAs}
                </p>
                <p className="ltr-num text-xs text-slate-600 dark:text-slate-300">
                  {authUser.email}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onGoogleSignOut}
              className="flex min-h-[40px] items-center gap-1.5 rounded-xl border border-red-300 bg-white px-4 py-2 text-xs font-bold text-red-700 hover:bg-red-50 dark:border-red-900 dark:bg-slate-900 dark:text-red-300"
            >
              <LogOut className="h-4 w-4" />
              <span>{t.signOutBtn}</span>
            </button>
          </div>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/40">
            <div>
              <span className="inline-block rounded-lg bg-slate-200 px-2.5 py-0.5 text-[11px] font-bold text-slate-800 dark:bg-slate-700 dark:text-slate-200">
                {t.guestModeLabel}
              </span>
              <p className="mt-1.5 text-xs text-slate-600 dark:text-slate-300">
                {t.guestSkipHint}
              </p>
            </div>
            <button
              type="button"
              onClick={onGoogleSignIn}
              className="flex min-h-[44px] items-center gap-2 rounded-xl bg-[#0B7D50] px-5 py-2.5 text-sm font-extrabold text-white shadow-sm hover:bg-[#12452D]"
            >
              <LogIn className="h-4 w-4 text-[#F2CC70]" />
              <span>{t.continueWithGoogle}</span>
            </button>
          </div>
        )}

        {(!isFirebaseAuthConfigured() || authNotice) && (
          <p className="rounded-xl border border-amber-300 bg-amber-50 px-3.5 py-2.5 text-xs font-semibold text-amber-950 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
            {authNotice || t.googleLoginNotConfigured}
          </p>
        )}
      </section>

      {/* 1. Appearance & Language */}
      <section className={sectionClass}>
        <h2 className="text-base font-extrabold text-slate-900 dark:text-slate-100">
          {t.appearanceSection}
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <span className={labelClass}>{t.languageLabel}</span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => onChangeLanguage('ur')}
                className={`min-h-[44px] rounded-xl border text-sm font-bold ${
                  language === 'ur'
                    ? 'border-[#0B7D50] bg-[#0B7D50] text-white'
                    : 'border-slate-300 text-slate-800 dark:border-slate-700 dark:text-slate-200'
                }`}
              >
                {t.urduLang}
              </button>
              <button
                type="button"
                onClick={() => onChangeLanguage('en')}
                className={`min-h-[44px] rounded-xl border text-sm font-bold ${
                  language === 'en'
                    ? 'border-[#0B7D50] bg-[#0B7D50] text-white'
                    : 'border-slate-300 text-slate-800 dark:border-slate-700 dark:text-slate-200'
                }`}
              >
                {t.englishLang}
              </button>
            </div>
          </div>

          <div>
            <span className={labelClass}>{t.themeLabel}</span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => onChangeTheme('light')}
                className={`min-h-[44px] rounded-xl border text-sm font-bold ${
                  theme === 'light'
                    ? 'border-[#0B7D50] bg-[#0B7D50] text-white'
                    : 'border-slate-300 text-slate-800 dark:border-slate-700 dark:text-slate-200'
                }`}
              >
                {t.lightMode}
              </button>
              <button
                type="button"
                onClick={() => onChangeTheme('dark')}
                className={`min-h-[44px] rounded-xl border text-sm font-bold ${
                  theme === 'dark'
                    ? 'border-[#0B7D50] bg-[#0B7D50] text-white'
                    : 'border-slate-300 text-slate-800 dark:border-slate-700 dark:text-slate-200'
                }`}
              >
                {t.darkMode}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Calculation Settings (LIVE) */}
      <section className={sectionClass}>
        <h2 className="text-base font-extrabold text-slate-900 dark:text-slate-100">
          {t.calcSettingsSection}
        </h2>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <label htmlFor="set-comm-pct" className={labelClass}>
              {t.commissionPercentLabel}
            </label>
            <input
              id="set-comm-pct"
              type="number"
              step="0.1"
              min="0"
              dir="ltr"
              value={settings.commissionPercent || ''}
              placeholder="0"
              onChange={(e) =>
                update({ commissionPercent: Math.max(0, Number(e.target.value) || 0) })
              }
              className={numInputClass}
            />
          </div>

          <div>
            <label htmlFor="set-comm-mode" className={labelClass}>
              {t.commissionModeLabel}
            </label>
            <select
              id="set-comm-mode"
              value={settings.commissionMode}
              onChange={(e) =>
                update({ commissionMode: e.target.value as CommissionMode })
              }
              className={inputClass}
            >
              <option value="off">{t.commModeOff}</option>
              <option value="sales">{t.commModeSales}</option>
              <option value="purchase">{t.commModePurchase}</option>
              <option value="both">{t.commModeBoth}</option>
            </select>
          </div>

          <div>
            <label htmlFor="set-maund-kg" className={labelClass}>
              {t.maundKgLabel}
            </label>
            <input
              id="set-maund-kg"
              type="number"
              step="0.001"
              min="1"
              dir="ltr"
              value={settings.maundKg}
              onChange={(e) =>
                update({ maundKg: Math.max(1, Number(e.target.value) || 40) })
              }
              className={numInputClass}
            />
          </div>

          <div>
            <label htmlFor="set-bardana" className={labelClass}>
              {t.bardanaPerBagLabel}
            </label>
            <input
              id="set-bardana"
              type="number"
              step="0.05"
              min="0"
              dir="ltr"
              value={settings.bardanaPerBag}
              onChange={(e) =>
                update({ bardanaPerBag: Math.max(0, Number(e.target.value) || 0) })
              }
              className={numInputClass}
            />
          </div>

          <div>
            <label htmlFor="set-chungi-div" className={labelClass}>
              {t.chungiDivisorLabel}
            </label>
            <input
              id="set-chungi-div"
              type="number"
              step="0.1"
              min="0.5"
              dir="ltr"
              value={settings.chungiDivisor}
              onChange={(e) =>
                update({ chungiDivisor: Math.max(0.5, Number(e.target.value) || 2) })
              }
              className={numInputClass}
            />
          </div>

          <div>
            <label htmlFor="set-def-margin" className={labelClass}>
              {t.defaultMarginLabel}
            </label>
            <input
              id="set-def-margin"
              type="number"
              step="0.1"
              min="0"
              dir="ltr"
              value={settings.defaultMarginCut}
              onChange={(e) =>
                update({ defaultMarginCut: Math.max(0, Number(e.target.value) || 0) })
              }
              className={numInputClass}
            />
          </div>

          <div className="sm:col-span-2 lg:col-span-3">
            <label htmlFor="set-tax-label" className={labelClass}>
              {t.taxLabourNameLabel}
            </label>
            <input
              id="set-tax-label"
              type="text"
              value={
                language === 'ur'
                  ? settings.taxLabourLabelUr
                  : settings.taxLabourLabelEn
              }
              onChange={(e) =>
                language === 'ur'
                  ? update({ taxLabourLabelUr: e.target.value })
                  : update({ taxLabourLabelEn: e.target.value })
              }
              className={inputClass}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-2.5 pt-2 sm:grid-cols-2">
          {[
            {
              key: 'bardanaEnabledSales',
              label: t.bardanaSalesToggle,
              val: settings.bardanaEnabledSales,
            },
            {
              key: 'bardanaEnabledPurchase',
              label: t.bardanaPurchaseToggle,
              val: settings.bardanaEnabledPurchase,
            },
            {
              key: 'chungiEnabledPurchase',
              label: t.chungiPurchaseToggle,
              val: settings.chungiEnabledPurchase,
            },
            {
              key: 'marginEnabledSales',
              label: t.marginSalesToggle,
              val: settings.marginEnabledSales,
            },
            {
              key: 'kandaEnabledSales',
              label: t.kandaSalesToggle,
              val: settings.kandaEnabledSales,
            },
            {
              key: 'kandaEnabledPurchase',
              label: t.kandaPurchaseToggle,
              val: settings.kandaEnabledPurchase,
            },
            {
              key: 'roundAmounts',
              label: t.roundAmountsToggle,
              val: settings.roundAmounts,
            },
            {
              key: 'maundTwoDecimals',
              label: t.maundDecimalsToggle,
              val: settings.maundTwoDecimals,
            },
          ].map((item) => (
            <label
              key={item.key}
              className="flex min-h-[44px] cursor-pointer items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-900 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-100"
            >
              <span>{item.label}</span>
              <input
                type="checkbox"
                checked={item.val}
                onChange={(e) => update({ [item.key]: e.target.checked })}
                className="h-5 w-5 accent-[#0B7D50]"
              />
            </label>
          ))}
        </div>
      </section>

      {/* 3. Shop Profile & Optional Location */}
      <section className={sectionClass}>
        <h2 className="text-base font-extrabold text-slate-900 dark:text-slate-100">
          {t.shopProfileSection}
        </h2>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass}>{t.shopNameUr}</label>
            <input
              type="text"
              dir="rtl"
              value={settings.shopNameUr}
              onChange={(e) => update({ shopNameUr: e.target.value })}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>{t.shopNameEn}</label>
            <input
              type="text"
              dir="ltr"
              value={settings.shopNameEn}
              onChange={(e) => update({ shopNameEn: e.target.value })}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>{t.taglineLabel}</label>
            <input
              type="text"
              value={settings.tagline}
              onChange={(e) => update({ tagline: e.target.value })}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>{t.cityLabel}</label>
            <input
              type="text"
              value={settings.city}
              onChange={(e) => update({ city: e.target.value })}
              className={inputClass}
            />
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass}>{t.addressLabel}</label>
            <input
              type="text"
              value={settings.address}
              onChange={(e) => update({ address: e.target.value })}
              className={inputClass}
            />
          </div>
        </div>

        {/* Optional Shop Location */}
        <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/40">
          <p className="text-xs font-extrabold text-slate-800 dark:text-slate-100">
            {t.shopLocationSection}
          </p>
          <div>
            <label className={labelClass}>{t.googleMapsLinkLabel}</label>
            <input
              type="url"
              dir="ltr"
              value={settings.shopMapLink || ''}
              onChange={(e) => update({ shopMapLink: e.target.value })}
              placeholder="https://maps.google.com/?q=..."
              className={numInputClass}
            />
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              disabled={locBusy}
              onClick={handleCaptureLocation}
              className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border border-[#0B7D50] bg-white px-4 py-2 text-xs font-bold text-[#0B7D50] hover:bg-emerald-50 dark:bg-slate-900 dark:text-emerald-400"
            >
              <MapPin className="h-4 w-4" />
              <span>{locBusy ? t.locationLoading : t.useCurrentLocationBtn}</span>
            </button>

            {mapsHref && (
              <a
                href={mapsHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl bg-[#0B7D50] px-4 py-2 text-xs font-extrabold text-white hover:bg-[#12452D]"
              >
                <MapPin className="h-4 w-4 text-[#F2CC70]" />
                <span>{t.openInMapsBtn}</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            )}
          </div>
          {locMsg && (
            <p className="text-xs font-semibold text-[#0B7D50] dark:text-emerald-400">
              {locMsg}
            </p>
          )}
          <label className="flex min-h-[42px] cursor-pointer items-center justify-between rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100">
            <span>{t.showMapOnReceiptToggle}</span>
            <input
              type="checkbox"
              checked={Boolean(settings.showMapLinkOnReceipt)}
              onChange={(e) => update({ showMapLinkOnReceipt: e.target.checked })}
              className="h-4 w-4 accent-[#0B7D50]"
            />
          </label>
        </div>

        <div className="space-y-2.5 pt-2">
          {settings.owners.map((owner, idx) => (
            <div key={idx} className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <input
                type="text"
                aria-label={`${t.ownerLabel} ${idx + 1} ${t.ownerName}`}
                placeholder={`${t.ownerLabel} ${idx + 1} — ${t.ownerName}`}
                value={owner.name}
                onChange={(e) => {
                  const owners = [...settings.owners];
                  owners[idx] = { ...owners[idx], name: e.target.value };
                  update({ owners });
                }}
                className={inputClass}
              />
              <input
                type="tel"
                dir="ltr"
                aria-label={`${t.ownerLabel} ${idx + 1} ${t.ownerMobile}`}
                placeholder="03XX-XXXXXXX"
                value={owner.phone}
                onChange={(e) => {
                  const owners = [...settings.owners];
                  owners[idx] = { ...owners[idx], phone: e.target.value };
                  update({ owners });
                }}
                className={numInputClass}
              />
            </div>
          ))}
        </div>

        {/* Logo & Signature */}
        <div className="grid grid-cols-1 gap-4 pt-2 sm:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
            <p className="mb-2 text-xs font-bold text-slate-700 dark:text-slate-300">
              {t.uploadLogo}
            </p>
            {logo ? (
              <div className="flex items-center gap-3">
                <img
                  src={logo}
                  alt="Logo"
                  className="h-14 w-14 rounded-xl border bg-white object-contain p-1"
                />
                <button
                  type="button"
                  onClick={() => onUpdateLogo(null)}
                  className="min-h-[40px] rounded-xl bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-100"
                >
                  {t.removeLogo}
                </button>
              </div>
            ) : (
              <label className="inline-flex min-h-[42px] cursor-pointer items-center gap-2 rounded-xl border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-100">
                <ImagePlus className="h-4 w-4 text-[#0B7D50]" />
                {t.uploadLogo}
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImagePick(e, 'logo')}
                  className="sr-only"
                />
              </label>
            )}
          </div>

          <div className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
            <p className="mb-2 text-xs font-bold text-slate-700 dark:text-slate-300">
              {t.uploadSignature}
            </p>
            {signature ? (
              <div className="flex items-center gap-3">
                <img
                  src={signature}
                  alt="Signature"
                  className="h-14 w-28 rounded-xl border bg-white object-contain p-1"
                />
                <button
                  type="button"
                  onClick={() => onUpdateSignature(null)}
                  className="min-h-[40px] rounded-xl bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-100"
                >
                  {t.removeSignature}
                </button>
              </div>
            ) : (
              <label className="inline-flex min-h-[42px] cursor-pointer items-center gap-2 rounded-xl border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-100">
                <PenTool className="h-4 w-4 text-[#0B7D50]" />
                {t.uploadSignature}
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImagePick(e, 'signature')}
                  className="sr-only"
                />
              </label>
            )}
          </div>
        </div>
      </section>

      {/* 4. Business Settings: Crops & Varieties CRUD */}
      <section className={sectionClass}>
        <h2 className="text-base font-extrabold text-slate-900 dark:text-slate-100">
          {t.businessSettingsSection}
        </h2>

        <div className="space-y-3">
          {settings.crops.map((crop) => (
            <CropRow
              key={crop.id}
              crop={crop}
              canDelete={settings.crops.length > 1}
              t={t}
              inputClass={inputClass}
              onUpdate={(patch) => handleUpdateCrop(crop.id, patch)}
              onDelete={() => handleDeleteCrop(crop.id)}
            />
          ))}
        </div>

        <div className="grid grid-cols-1 gap-2 rounded-2xl border border-dashed border-slate-300 p-3 sm:grid-cols-12 dark:border-slate-700">
          <input
            type="text"
            dir="rtl"
            value={newCropUr}
            onChange={(e) => setNewCropUr(e.target.value)}
            placeholder={t.addCropNameUr}
            className={`sm:col-span-3 ${inputClass}`}
          />
          <input
            type="text"
            dir="ltr"
            value={newCropEn}
            onChange={(e) => setNewCropEn(e.target.value)}
            placeholder={t.addCropNameEn}
            className={`sm:col-span-3 ${inputClass}`}
          />
          <input
            type="text"
            value={newCropVarieties}
            onChange={(e) => setNewCropVarieties(e.target.value)}
            placeholder={t.varietiesPlaceholder}
            className={`sm:col-span-4 ${inputClass}`}
          />
          <button
            type="button"
            onClick={handleAddCrop}
            className="flex min-h-[42px] items-center justify-center gap-1.5 rounded-xl bg-[#0B7D50] px-3 py-2 text-xs font-bold text-white hover:bg-[#12452D] sm:col-span-2"
          >
            <Plus className="h-4 w-4" />
            {t.addCropBtn}
          </button>
        </div>
      </section>

      {/* 5. Receipt & Reference Numbering */}
      <section className={sectionClass}>
        <h2 className="text-base font-extrabold text-slate-900 dark:text-slate-100">
          {t.receiptSettingsSection}
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass}>{t.receiptHeaderLabel}</label>
            <input
              type="text"
              value={settings.receiptHeaderLine}
              onChange={(e) => update({ receiptHeaderLine: e.target.value })}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>{t.receiptFooterLabel}</label>
            <input
              type="text"
              value={settings.receiptFooterAddress}
              onChange={(e) => update({ receiptFooterAddress: e.target.value })}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>{t.salesPrefixLabel}</label>
            <input
              type="text"
              dir="ltr"
              value={settings.salesPrefix}
              onChange={(e) => update({ salesPrefix: e.target.value })}
              className={numInputClass}
            />
          </div>
          <div>
            <label className={labelClass}>{t.salesStartLabel}</label>
            <input
              type="number"
              min="1"
              dir="ltr"
              value={settings.salesStartNumber}
              onChange={(e) =>
                update({ salesStartNumber: Math.max(1, Number(e.target.value) || 1) })
              }
              className={numInputClass}
            />
          </div>
          <div>
            <label className={labelClass}>{t.purchasePrefixLabel}</label>
            <input
              type="text"
              dir="ltr"
              value={settings.purchasePrefix}
              onChange={(e) => update({ purchasePrefix: e.target.value })}
              className={numInputClass}
            />
          </div>
          <div>
            <label className={labelClass}>{t.purchaseStartLabel}</label>
            <input
              type="number"
              min="1"
              dir="ltr"
              value={settings.purchaseStartNumber}
              onChange={(e) =>
                update({
                  purchaseStartNumber: Math.max(1, Number(e.target.value) || 1),
                })
              }
              className={numInputClass}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          <label className="flex min-h-[44px] cursor-pointer items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-900 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-100">
            <span>{t.showPhonesToggle}</span>
            <input
              type="checkbox"
              checked={settings.showOwnerPhonesOnReceipt}
              onChange={(e) =>
                update({ showOwnerPhonesOnReceipt: e.target.checked })
              }
              className="h-5 w-5 accent-[#0B7D50]"
            />
          </label>
          <label className="flex min-h-[44px] cursor-pointer items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-900 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-100">
            <span>{t.showSignatureToggle}</span>
            <input
              type="checkbox"
              checked={settings.showSignatureOnReceipt}
              onChange={(e) =>
                update({ showSignatureOnReceipt: e.target.checked })
              }
              className="h-5 w-5 accent-[#0B7D50]"
            />
          </label>
        </div>
      </section>

      {/* 6. WhatsApp-like Auto Backup, Google Drive & Device Export/Import */}
      <section className={sectionClass}>
        <h2 className="text-base font-extrabold text-slate-900 dark:text-slate-100">
          {t.backupSection}
        </h2>
        <p className="rounded-xl border border-amber-300 bg-amber-50 p-3.5 text-xs font-semibold leading-relaxed text-amber-950 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-200">
          {t.deviceStorageNotice}
        </p>

        {/* Auto Backup Schedule + Back Up Now */}
        <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/40">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-extrabold text-slate-900 dark:text-slate-100">
                {t.autoBackupFreqLabel}
              </p>
              <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                {t.lastBackupLabel}:{' '}
                <span className="ltr-num font-bold">
                  {autoBackupSettings.lastBackupAt
                    ? formatDateTimeDisplay(autoBackupSettings.lastBackupAt)
                    : t.neverBackedUp}
                </span>
                {autoBackupSettings.lastBackupSizeBytes > 0 && (
                  <>
                    {' · '}
                    {t.backupSizeLabel}:{' '}
                    <span className="ltr-num font-bold">
                      {formatBytes(autoBackupSettings.lastBackupSizeBytes)}
                    </span>
                  </>
                )}
              </p>
            </div>
            <button
              type="button"
              disabled={backupBusy}
              onClick={handleManualBackupNow}
              className="flex min-h-[42px] items-center gap-1.5 rounded-xl bg-[#0B7D50] px-4 py-2 text-xs font-extrabold text-white hover:bg-[#12452D] disabled:opacity-60"
            >
              <RefreshCw className={`h-4 w-4 ${backupBusy ? 'animate-spin' : ''}`} />
              <span>{t.backupNowBtn}</span>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {(
              [
                ['daily', t.freqDaily],
                ['weekly', t.freqWeekly],
                ['monthly', t.freqMonthly],
                ['never', t.freqNever],
              ] as [AutoBackupFrequency, string][]
            ).map(([freq, label]) => (
              <button
                key={freq}
                type="button"
                onClick={() => onUpdateAutoBackup({ frequency: freq })}
                className={`min-h-[40px] rounded-xl border px-3 text-xs font-bold transition ${
                  autoBackupSettings.frequency === freq
                    ? 'border-[#0B7D50] bg-[#0B7D50] text-white'
                    : 'border-slate-300 bg-white text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Google Drive Backup Controls */}
          <div className="space-y-3 border-t border-slate-200 pt-3 dark:border-slate-700">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label className="flex cursor-pointer items-center gap-2.5 text-sm font-bold text-slate-900 dark:text-slate-100">
                <input
                  type="checkbox"
                  checked={autoBackupSettings.googleDriveEnabled}
                  onChange={(e) =>
                    onUpdateAutoBackup({ googleDriveEnabled: e.target.checked })
                  }
                  className="h-5 w-5 accent-[#0B7D50]"
                />
                <Cloud className="h-4 w-4 text-[#0B7D50]" />
                <span>{t.driveBackupToggle}</span>
              </label>

              {authUser && hasDriveToken && (
                <span className="rounded-lg bg-emerald-100 px-2.5 py-1 text-[11px] font-bold text-emerald-900 dark:bg-emerald-950 dark:text-emerald-300">
                  {t.driveConnectedBadge}
                </span>
              )}
            </div>

            {autoBackupSettings.pendingDriveUpload && (
              <p className="text-xs font-semibold text-amber-700 dark:text-[#F2CC70]">
                {t.driveOfflineQueued}
              </p>
            )}

            {authUser && !hasDriveToken && (
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-950 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
                <span>{t.driveReconnectHint}</span>
                <button
                  type="button"
                  onClick={onGoogleSignIn}
                  className="rounded-lg bg-[#0B7D50] px-3 py-1 text-xs font-bold text-white"
                >
                  {t.continueWithGoogle}
                </button>
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={driveBusy}
                onClick={handleDriveUploadClick}
                className="flex min-h-[40px] items-center gap-1.5 rounded-xl bg-[#12452D] px-4 py-2 text-xs font-bold text-white hover:bg-[#0B7D50] disabled:opacity-60"
              >
                <CloudUpload className="h-4 w-4 text-[#F2CC70]" />
                <span>{t.driveBackupNowBtn}</span>
              </button>
              <button
                type="button"
                disabled={driveBusy}
                onClick={handleOpenDriveList}
                className="flex min-h-[40px] items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-800 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              >
                <Cloud className="h-4 w-4 text-[#0B7D50]" />
                <span>{t.driveRestoreBtn}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Last 3 Local Auto-Snapshots */}
        {localSnapshots.length > 0 && (
          <div className="space-y-2 rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
            <div className="flex items-center gap-2 text-xs font-extrabold text-slate-800 dark:text-slate-200">
              <History className="h-4 w-4 text-[#0B7D50]" />
              <span>{t.localSnapshotsTitle}</span>
            </div>
            <div className="space-y-2">
              {localSnapshots.map((snap) => (
                <div
                  key={snap.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-slate-50 px-3 py-2 text-xs dark:bg-slate-800/50"
                >
                  <div>
                    <span className="ltr-num font-bold text-slate-900 dark:text-slate-100">
                      {formatDateTimeDisplay(snap.createdAt)}
                    </span>
                    <span className="ltr-num ms-2 text-slate-600 dark:text-slate-400">
                      ({formatBytes(snap.sizeBytes)})
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPendingBackup(snap.payload)}
                    className="rounded-lg border border-[#0B7D50] px-3 py-1 font-bold text-[#0B7D50] hover:bg-emerald-50 dark:text-emerald-400"
                  >
                    {t.restoreSnapshotBtn}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Device JSON Export / Import */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleExportJson}
            className="flex min-h-[44px] items-center gap-2 rounded-xl bg-[#0B7D50] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#12452D]"
          >
            <Download className="h-4 w-4" />
            {t.exportJsonBtn}
          </button>

          <label className="flex min-h-[44px] cursor-pointer items-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-bold text-slate-800 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100">
            <Upload className="h-4 w-4 text-[#0B7D50]" />
            <span>{t.importJsonBtn}</span>
            <input
              type="file"
              accept="application/json,.json"
              onChange={handleBackupFilePick}
              className="sr-only"
            />
          </label>
        </div>

        {backupError && (
          <div className="flex items-center gap-2 rounded-xl border border-red-300 bg-red-50 p-3 text-sm font-semibold text-red-800 dark:border-red-800 dark:bg-red-950/60 dark:text-red-200">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{backupError}</span>
          </div>
        )}

        {backupSuccess && (
          <div className="flex items-center gap-2 rounded-xl border border-emerald-300 bg-emerald-50 p-3 text-sm font-semibold text-emerald-900 dark:border-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-200">
            <Check className="h-4 w-4 shrink-0" />
            <span>{backupSuccess}</span>
          </div>
        )}

        {pendingBackup && (
          <div className="space-y-3 rounded-2xl border border-[#0B7D50] bg-[#F5F2E7] p-4 dark:bg-slate-800">
            <h3 className="text-sm font-extrabold text-[#12452D] dark:text-emerald-300">
              {t.backupPreviewTitle}
            </h3>
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
              {t.navSales}: <span className="ltr-num font-extrabold">{pendingBackup.sales.length}</span> ·{' '}
              {t.navPurchase}: <span className="ltr-num font-extrabold">{pendingBackup.purchases.length}</span> ·{' '}
              {t.navKhata}: <span className="ltr-num font-extrabold">{pendingBackup.ledger.length}</span> ·{' '}
              {t.navRoznamcha}:{' '}
              <span className="ltr-num font-extrabold">
                {pendingBackup.roznamchaEntries?.length || 0}
              </span>
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => applyBackup('merge')}
                className="min-h-[42px] rounded-xl bg-[#0B7D50] px-4 py-2 text-xs font-bold text-white hover:bg-[#12452D]"
              >
                {t.mergeBackupBtn}
              </button>
              <button
                type="button"
                onClick={() => applyBackup('replace')}
                className="min-h-[42px] rounded-xl bg-amber-600 px-4 py-2 text-xs font-bold text-white hover:bg-amber-700"
              >
                {t.replaceBackupBtn}
              </button>
              <button
                type="button"
                onClick={() => setPendingBackup(null)}
                className="min-h-[42px] rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200"
              >
                {t.cancel}
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Google Drive Backups Picker Modal */}
      {driveModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md space-y-4 rounded-3xl bg-white p-5 shadow-2xl dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100">
                  {t.driveBackupsListTitle}
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  {t.driveFolderLabel}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setDriveModalOpen(false)}
                className="rounded-xl p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {driveBusy ? (
              <p className="py-6 text-center text-sm font-semibold text-slate-600 dark:text-slate-300">
                ...
              </p>
            ) : driveFiles.length === 0 ? (
              <p className="py-6 text-center text-sm text-slate-600 dark:text-slate-300">
                {t.noDriveBackups}
              </p>
            ) : (
              <div className="max-h-72 space-y-2 overflow-y-auto">
                {driveFiles.map((file) => (
                  <button
                    key={file.id}
                    type="button"
                    onClick={() => handleSelectDriveFile(file.id)}
                    className="flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-3 text-start hover:border-[#0B7D50] dark:border-slate-800 dark:bg-slate-800"
                  >
                    <div className="min-w-0">
                      <p className="ltr-num truncate text-xs font-extrabold text-slate-900 dark:text-slate-100">
                        {file.name}
                      </p>
                      <p className="ltr-num text-[11px] text-slate-600 dark:text-slate-400">
                        {formatDateTimeDisplay(file.createdTime)} ·{' '}
                        {formatBytes(file.sizeBytes)}
                      </p>
                    </div>
                    <Download className="h-4 w-4 shrink-0 text-[#0B7D50]" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

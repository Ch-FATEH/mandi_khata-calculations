import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowDownLeft,
  ArrowUpRight,
  BarChart3,
  BookOpen,
  BookOpenText,
  Calculator,
  ChevronDown,
  GraduationCap,
  Home,
  Info,
  Languages,
  Menu,
  Moon,
  Plus,
  Settings,
  Shield,
  Sparkles,
  Sun,
  X,
} from 'lucide-react';
import {
  AdBanner,
  AppLanguage,
  AppSettings,
  AuthUserSummary,
  AutoBackupSettings,
  BackupPayload,
  GlobalAppConfig,
  LocalSnapshot,
  PartyMeta,
  PartyPayment,
  PurchaseRecord,
  QuickNote,
  QuickNoteTag,
  RefCounters,
  RoznamchaEntry,
  RoznamchaSettings,
  SaleRecord,
  ThemeMode,
  TradeRecord,
} from './types/mandi';
import { TRANSLATIONS } from './i18n/translations';
import {
  DEFAULT_APP_CONFIG,
  DEVELOPER_CREDIT,
  isAdminUser,
  isFirebaseAuthConfigured,
} from './config';
import {
  allocateNextRef,
  createBackupPayload,
  formatBytes,
  isAutoBackupDue,
  loadAutoBackupSettings,
  loadCounters,
  loadDismissedAdIds,
  loadLanguage,
  loadLedger,
  loadLocalSnapshots,
  loadLogo,
  loadPartyMeta,
  loadPurchases,
  loadQuickNotes,
  loadRoznamchaEntries,
  loadRoznamchaSettings,
  loadSales,
  loadSettings,
  loadSetupDone,
  loadSignature,
  loadTheme,
  mergeBackupData,
  pushLocalSnapshot,
  saveAutoBackupSettings,
  saveCounters,
  saveDismissedAdIds,
  saveLanguage,
  saveLedger,
  saveLogo,
  savePartyMeta,
  savePurchases,
  saveQuickNotes,
  saveRoznamchaEntries,
  saveRoznamchaSettings,
  saveSales,
  saveSettings,
  saveSetupDone,
  saveSignature,
  saveTheme,
} from './utils/storage';
import {
  clearCompletedQuickNotes,
  createQuickNote,
  deleteQuickNote,
  toggleQuickNoteDone,
  toggleQuickNotePin,
  updateQuickNote,
} from './utils/quickNotes';
import { getTodayISO, normalizePartyName } from './utils/calculations';
import {
  getInMemoryDriveToken,
  signInWithGoogleAccount,
  signOutGoogleAccount,
  subscribeActiveAds,
  subscribeAuthState,
  subscribePublicAppConfig,
  testFirestoreConnection,
} from './services/firebaseService';
import {
  downloadDriveBackup,
  DriveBackupFileMeta,
  listDriveBackups,
  uploadBackupToDrive,
} from './services/driveBackupService';
import { BrandLogo } from './components/BrandLogo';
import { SplashScreen } from './components/SplashScreen';
import { ActiveTab, Dashboard } from './components/Dashboard';
import { TradeRegister } from './components/TradeRegister';
import { PartyLedger } from './components/PartyLedger';
import { RoznamchaView } from './components/RoznamchaView';
import { CalculatorCentre } from './components/CalculatorCentre';
import { ReportsView } from './components/ReportsView';
import { SettingsView } from './components/SettingsView';
import { TutorialView } from './components/TutorialView';
import { AboutView } from './components/AboutView';
import { PremiumAIView } from './components/PremiumAIView';
import { AdminPanel } from './components/AdminPanel';
import { ReceiptModal } from './components/ReceiptModal';
import { SetupWizard } from './components/SetupWizard';
import { OfflineIndicator, PWAInstallButton } from './components/PWAControls';

export default function App() {
  const [settings, setSettings] = useState<AppSettings>(() => loadSettings());
  const [sales, setSales] = useState<SaleRecord[]>(() => loadSales());
  const [purchases, setPurchases] = useState<PurchaseRecord[]>(() => loadPurchases());
  const [ledger, setLedger] = useState<PartyPayment[]>(() => loadLedger());
  const [partyMeta, setPartyMeta] = useState<Record<string, PartyMeta>>(() =>
    loadPartyMeta()
  );
  const [roznamchaEntries, setRoznamchaEntries] = useState<RoznamchaEntry[]>(() =>
    loadRoznamchaEntries()
  );
  const [roznamchaSettings, setRoznamchaSettings] = useState<RoznamchaSettings>(() =>
    loadRoznamchaSettings()
  );
  const [quickNotes, setQuickNotes] = useState<QuickNote[]>(() => loadQuickNotes());
  const [counters, setCounters] = useState<RefCounters>(() =>
    loadCounters(loadSettings())
  );
  const [theme, setTheme] = useState<ThemeMode>(() => loadTheme());
  const [language, setLanguage] = useState<AppLanguage>(() => loadLanguage());
  const [logo, setLogo] = useState<string | null>(() => loadLogo());
  const [signature, setSignature] = useState<string | null>(() => loadSignature());
  const [autoBackupSettings, setAutoBackupSettings] = useState<AutoBackupSettings>(() =>
    loadAutoBackupSettings()
  );
  const [localSnapshots, setLocalSnapshots] = useState<LocalSnapshot[]>(() =>
    loadLocalSnapshots()
  );
  const [dismissedAdIds, setDismissedAdIds] = useState<string[]>(() =>
    loadDismissedAdIds()
  );

  const [authUser, setAuthUser] = useState<AuthUserSummary | null>(null);
  const [hasDriveToken, setHasDriveToken] = useState<boolean>(false);
  const [authNotice, setAuthNotice] = useState<string>('');
  const [adsList, setAdsList] = useState<AdBanner[]>([]);
  const [globalConfig, setGlobalConfig] = useState<GlobalAppConfig>(DEFAULT_APP_CONFIG);

  const [wizardOpen, setWizardOpen] = useState<boolean>(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('autostart') === '1') return false;
    return !loadSetupDone();
  });

  const [activeTab, setActiveTab] = useState<ActiveTab>('home');
  const [activeCalcId, setActiveCalcId] = useState<string>('commission');
  const [activeSlip, setActiveSlip] = useState<TradeRecord | null>(null);
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [moreDesktopOpen, setMoreDesktopOpen] = useState(false);
  const [moreMobileOpen, setMoreMobileOpen] = useState(false);

  const [driveRestorePrompt, setDriveRestorePrompt] = useState<{
    file: DriveBackupFileMeta;
  } | null>(null);
  const [drivePromptRestorePayload, setDrivePromptRestorePayload] =
    useState<BackupPayload | null>(null);
  const driveCheckedForUidRef = useRef<string | null>(null);

  const t = TRANSLATIONS[language];
  const isAdmin = isAdminUser(authUser?.email);

  useEffect(() => {
    const root = document.documentElement;
    root.dir = language === 'ur' ? 'rtl' : 'ltr';
    root.lang = language;
    saveLanguage(language);
  }, [language]);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    saveTheme(theme);
  }, [theme]);

  useEffect(() => {
    const unsubAuth = subscribeAuthState((user, tokenAvailable) => {
      setAuthUser(user);
      setHasDriveToken(tokenAvailable);
      if (!user) {
        driveCheckedForUidRef.current = null;
      }
    });
    const unsubAds = subscribeActiveAds(setAdsList);
    const unsubCfg = subscribePublicAppConfig(setGlobalConfig);
    void testFirestoreConnection();

    return () => {
      unsubAuth();
      unsubAds();
      unsubCfg();
    };
  }, []);

  // Protect Admin route if user signs out or switches account
  useEffect(() => {
    if (activeTab === 'admin' && !isAdmin) {
      setActiveTab('home');
    }
  }, [activeTab, isAdmin]);

  const buildCurrentPayload = useCallback(
    (): BackupPayload =>
      createBackupPayload({
        sales,
        purchases,
        ledger,
        partyMeta,
        roznamchaEntries,
        roznamchaSettings,
        quickNotes,
        counters,
        settings,
        theme,
        language,
        logo,
        signature,
      }),
    [
      sales,
      purchases,
      ledger,
      partyMeta,
      roznamchaEntries,
      roznamchaSettings,
      quickNotes,
      counters,
      settings,
      theme,
      language,
      logo,
      signature,
    ]
  );

  const updateAutoBackup = useCallback((patch: Partial<AutoBackupSettings>) => {
    setAutoBackupSettings((prev) => {
      const next = { ...prev, ...patch };
      saveAutoBackupSettings(next);
      return next;
    });
  }, []);

  const performBackupNow = useCallback(
    async (forceDriveUpload = false) => {
      const payload = buildCurrentPayload();
      const { snapshots, latest } = pushLocalSnapshot(payload);
      setLocalSnapshots(snapshots);

      const nowIso = new Date().toISOString();
      const shouldUploadDrive =
        forceDriveUpload || autoBackupSettings.googleDriveEnabled;
      const token = getInMemoryDriveToken();

      if (shouldUploadDrive && authUser && token && navigator.onLine) {
        try {
          const uploaded = await uploadBackupToDrive(token, payload, authUser.uid);
          updateAutoBackup({
            lastBackupAt: nowIso,
            lastBackupSizeBytes: latest.sizeBytes,
            lastDriveBackupAt: uploaded.createdTime,
            lastDriveFileName: uploaded.name,
            lastDriveFileId: uploaded.id,
            pendingDriveUpload: false,
          });
          return;
        } catch {
          updateAutoBackup({
            lastBackupAt: nowIso,
            lastBackupSizeBytes: latest.sizeBytes,
            pendingDriveUpload: true,
          });
          if (forceDriveUpload) throw new Error('Drive upload failed');
          return;
        }
      }

      updateAutoBackup({
        lastBackupAt: nowIso,
        lastBackupSizeBytes: latest.sizeBytes,
        pendingDriveUpload: shouldUploadDrive && Boolean(authUser) && !navigator.onLine,
      });
    },
    [authUser, autoBackupSettings.googleDriveEnabled, buildCurrentPayload, updateAutoBackup]
  );

  // WhatsApp-style auto-backup scheduler + online flush
  useEffect(() => {
    const checkDue = () => {
      const hasAnyData =
        sales.length > 0 ||
        purchases.length > 0 ||
        ledger.length > 0 ||
        roznamchaEntries.length > 0;
      if (!hasAnyData) return;
      if (isAutoBackupDue(autoBackupSettings)) {
        void performBackupNow(false);
      }
    };
    checkDue();
    const timer = setInterval(checkDue, 15 * 60 * 1000);
    window.addEventListener('online', checkDue);
    return () => {
      clearInterval(timer);
      window.removeEventListener('online', checkDue);
    };
  }, [
    autoBackupSettings,
    ledger.length,
    performBackupNow,
    purchases.length,
    roznamchaEntries.length,
    sales.length,
  ]);

  const handleGoogleSignIn = async () => {
    setAuthNotice('');
    if (!isFirebaseAuthConfigured()) {
      setAuthNotice(t.googleLoginNotConfigured);
      return;
    }
    try {
      const res = await signInWithGoogleAccount();
      setAuthUser(res.user);
      setHasDriveToken(Boolean(res.accessToken));

      if (res.accessToken && driveCheckedForUidRef.current !== res.user.uid) {
        driveCheckedForUidRef.current = res.user.uid;
        try {
          const files = await listDriveBackups(res.accessToken);
          if (files.length > 0) {
            setDriveRestorePrompt({ file: files[0] });
          }
        } catch {
          // Drive check is best-effort on login
        }
      }
    } catch (err) {
      if (err instanceof Error && err.message === 'FIREBASE_NOT_CONFIGURED') {
        setAuthNotice(t.googleLoginNotConfigured);
      } else {
        setAuthNotice(err instanceof Error ? err.message : t.googleLoginNotConfigured);
      }
    }
  };

  const handleGoogleSignOut = async () => {
    await signOutGoogleAccount();
    setAuthUser(null);
    setHasDriveToken(false);
    setDriveRestorePrompt(null);
  };

  const handleDriveBackupNow = async () => {
    let token = getInMemoryDriveToken();
    let user = authUser;
    if (!user || !token) {
      if (!isFirebaseAuthConfigured()) {
        throw new Error(t.googleLoginNotConfigured);
      }
      const res = await signInWithGoogleAccount();
      token = res.accessToken;
      user = res.user;
      setAuthUser(user);
      setHasDriveToken(Boolean(token));
    }
    if (!token || !user) {
      throw new Error(t.driveReconnectHint);
    }
    const payload = buildCurrentPayload();
    const { snapshots, latest } = pushLocalSnapshot(payload);
    setLocalSnapshots(snapshots);
    const uploaded = await uploadBackupToDrive(token, payload, user.uid);
    updateAutoBackup({
      lastBackupAt: new Date().toISOString(),
      lastBackupSizeBytes: latest.sizeBytes,
      lastDriveBackupAt: uploaded.createdTime,
      lastDriveFileName: uploaded.name,
      lastDriveFileId: uploaded.id,
      pendingDriveUpload: false,
    });
  };

  const handleListDriveBackups = async (): Promise<DriveBackupFileMeta[]> => {
    let token = getInMemoryDriveToken();
    if (!token) {
      if (!isFirebaseAuthConfigured()) {
        throw new Error(t.googleLoginNotConfigured);
      }
      const res = await signInWithGoogleAccount();
      token = res.accessToken;
      setAuthUser(res.user);
      setHasDriveToken(Boolean(token));
    }
    if (!token) throw new Error(t.driveReconnectHint);
    return listDriveBackups(token);
  };

  const handleDownloadDriveBackup = async (fileId: string): Promise<BackupPayload> => {
    const token = getInMemoryDriveToken();
    if (!token) throw new Error(t.driveReconnectHint);
    return downloadDriveBackup(token, fileId);
  };

  const handleUpdateSettings = (next: AppSettings) => {
    setSettings(next);
    saveSettings(next);
  };

  const handleUpdateLogo = (dataUrl: string | null) => {
    setLogo(dataUrl);
    saveLogo(dataUrl);
  };

  const handleUpdateSignature = (dataUrl: string | null) => {
    setSignature(dataUrl);
    saveSignature(dataUrl);
  };

  const knownParties = useMemo(() => {
    const set = new Map<string, string>();
    for (const s of sales) {
      const clean = normalizePartyName(s.partyName);
      if (clean) set.set(clean.toLowerCase(), clean);
    }
    for (const p of purchases) {
      const clean = normalizePartyName(p.partyName);
      if (clean) set.set(clean.toLowerCase(), clean);
    }
    for (const l of ledger) {
      const clean = normalizePartyName(l.partyName);
      if (clean) set.set(clean.toLowerCase(), clean);
    }
    for (const r of roznamchaEntries) {
      if (r.partyName) {
        const clean = normalizePartyName(r.partyName);
        if (clean) set.set(clean.toLowerCase(), clean);
      }
    }
    return Array.from(set.values()).sort((a, b) => a.localeCompare(b));
  }, [sales, purchases, ledger, roznamchaEntries]);

  const handleSaveSale = (
    data: Omit<SaleRecord, 'id' | 'refNo' | 'createdAt' | 'updatedAt' | 'type'>,
    editingId?: string
  ) => {
    const now = new Date().toISOString();
    if (editingId) {
      const next = sales.map((s) =>
        s.id === editingId ? { ...s, ...data, updatedAt: now } : s
      );
      setSales(next);
      saveSales(next);
      return;
    }
    const { refNo, nextCounters } = allocateNextRef('sale', counters, settings);
    const created: SaleRecord = {
      ...data,
      id: `sale_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      type: 'sale',
      refNo,
      createdAt: now,
      updatedAt: now,
    };
    const nextSales = [created, ...sales];
    setSales(nextSales);
    saveSales(nextSales);
    setCounters(nextCounters);
    saveCounters(nextCounters);
  };

  const handleSavePurchase = (
    data: Omit<PurchaseRecord, 'id' | 'refNo' | 'createdAt' | 'updatedAt' | 'type'>,
    editingId?: string
  ) => {
    const now = new Date().toISOString();
    if (editingId) {
      const next = purchases.map((p) =>
        p.id === editingId ? { ...p, ...data, updatedAt: now } : p
      );
      setPurchases(next);
      savePurchases(next);
      return;
    }
    const { refNo, nextCounters } = allocateNextRef('purchase', counters, settings);
    const created: PurchaseRecord = {
      ...data,
      id: `pur_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      type: 'purchase',
      refNo,
      createdAt: now,
      updatedAt: now,
    };
    const nextPurchases = [created, ...purchases];
    setPurchases(nextPurchases);
    savePurchases(nextPurchases);
    setCounters(nextCounters);
    saveCounters(nextCounters);
  };

  const handleDeleteSale = (id: string) => {
    const next = sales.filter((s) => s.id !== id);
    setSales(next);
    saveSales(next);
  };

  const handleDeletePurchase = (id: string) => {
    const next = purchases.filter((p) => p.id !== id);
    setPurchases(next);
    savePurchases(next);
  };

  const handleAddPayment = (entry: Omit<PartyPayment, 'id' | 'createdAt'>) => {
    const created: PartyPayment = {
      ...entry,
      id: `pay_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      createdAt: new Date().toISOString(),
    };
    const next = [created, ...ledger];
    setLedger(next);
    saveLedger(next);
  };

  const handleUpdatePayment = (
    id: string,
    patch: Partial<Omit<PartyPayment, 'id' | 'createdAt'>>
  ) => {
    const now = new Date().toISOString();
    const next = ledger.map((item) =>
      item.id === id ? { ...item, ...patch, updatedAt: now } : item
    );
    setLedger(next);
    saveLedger(next);
  };

  const handleDeletePayment = (id: string) => {
    const next = ledger.filter((l) => l.id !== id);
    setLedger(next);
    saveLedger(next);
  };

  const handleUpdatePartyMeta = (
    partyName: string,
    patch: { phone?: string; wadaDate?: string }
  ) => {
    const clean = normalizePartyName(partyName);
    const key = clean.toLowerCase();
    setPartyMeta((prev) => {
      const existing = prev[key] || {
        partyName: clean,
        phone: '',
        wadaDate: '',
        updatedAt: new Date().toISOString(),
      };
      const next: Record<string, PartyMeta> = {
        ...prev,
        [key]: {
          ...existing,
          ...patch,
          partyName: clean,
          updatedAt: new Date().toISOString(),
        },
      };
      savePartyMeta(next);
      return next;
    });
  };

  const handleSaveRoznamchaEntry = (
    data: Omit<RoznamchaEntry, 'id' | 'createdAt'>,
    editingId?: string
  ) => {
    const now = new Date().toISOString();
    if (editingId) {
      const next = roznamchaEntries.map((item) =>
        item.id === editingId ? { ...item, ...data, updatedAt: now } : item
      );
      setRoznamchaEntries(next);
      saveRoznamchaEntries(next);
      return;
    }
    const created: RoznamchaEntry = {
      ...data,
      id: `roz_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      createdAt: now,
      updatedAt: now,
    };
    const next = [created, ...roznamchaEntries];
    setRoznamchaEntries(next);
    saveRoznamchaEntries(next);
  };

  const handleDeleteRoznamchaEntry = (id: string) => {
    const next = roznamchaEntries.filter((e) => e.id !== id);
    setRoznamchaEntries(next);
    saveRoznamchaEntries(next);
  };

  const handleUpdateRoznamchaSettings = (next: RoznamchaSettings) => {
    setRoznamchaSettings(next);
    saveRoznamchaSettings(next);
  };

  const handleAddQuickNote = (text: string, tag: QuickNoteTag) => {
    const created = createQuickNote(text, tag);
    if (!created) return;
    setQuickNotes((prev) => {
      const next = [created, ...prev];
      saveQuickNotes(next);
      return next;
    });
  };

  const handleToggleQuickNoteDone = (id: string) => {
    setQuickNotes((prev) => {
      const next = toggleQuickNoteDone(prev, id);
      saveQuickNotes(next);
      return next;
    });
  };

  const handleToggleQuickNotePin = (id: string) => {
    setQuickNotes((prev) => {
      const next = toggleQuickNotePin(prev, id);
      saveQuickNotes(next);
      return next;
    });
  };

  const handleEditQuickNote = (id: string, text: string, tag: QuickNoteTag) => {
    setQuickNotes((prev) => {
      const next = updateQuickNote(prev, id, text, tag);
      saveQuickNotes(next);
      return next;
    });
  };

  const handleDeleteQuickNote = (id: string) => {
    setQuickNotes((prev) => {
      const next = deleteQuickNote(prev, id);
      saveQuickNotes(next);
      return next;
    });
  };

  const handleClearDoneQuickNotes = () => {
    setQuickNotes((prev) => {
      const next = clearCompletedQuickNotes(prev);
      saveQuickNotes(next);
      return next;
    });
  };

  const handleRestoreBackup = (payload: BackupPayload, mode: 'merge' | 'replace') => {
    if (mode === 'replace') {
      setSales(payload.sales);
      saveSales(payload.sales);
      setPurchases(payload.purchases);
      savePurchases(payload.purchases);
      setLedger(payload.ledger);
      saveLedger(payload.ledger);
      const nextMeta = payload.partyMeta || {};
      setPartyMeta(nextMeta);
      savePartyMeta(nextMeta);
      const nextRoz = payload.roznamchaEntries || [];
      setRoznamchaEntries(nextRoz);
      saveRoznamchaEntries(nextRoz);
      if (payload.roznamchaSettings) {
        setRoznamchaSettings(payload.roznamchaSettings);
        saveRoznamchaSettings(payload.roznamchaSettings);
      }
      const nextNotes = payload.quickNotes || [];
      setQuickNotes(nextNotes);
      saveQuickNotes(nextNotes);
      setCounters(payload.counters);
      saveCounters(payload.counters);
      setSettings(payload.settings);
      saveSettings(payload.settings);
      setTheme(payload.theme);
      setLanguage(payload.language);
      handleUpdateLogo(payload.logo);
      handleUpdateSignature(payload.signature);
    } else {
      const merged = mergeBackupData(
        {
          sales,
          purchases,
          ledger,
          partyMeta,
          roznamchaEntries,
          quickNotes,
          counters,
        },
        payload
      );
      setSales(merged.sales);
      saveSales(merged.sales);
      setPurchases(merged.purchases);
      savePurchases(merged.purchases);
      setLedger(merged.ledger);
      saveLedger(merged.ledger);
      setPartyMeta(merged.partyMeta);
      savePartyMeta(merged.partyMeta);
      setRoznamchaEntries(merged.roznamchaEntries);
      saveRoznamchaEntries(merged.roznamchaEntries);
      setQuickNotes(merged.quickNotes);
      saveQuickNotes(merged.quickNotes);
      setCounters(merged.counters);
      saveCounters(merged.counters);
    }
  };

  const activeAd = useMemo(() => {
    const today = getTodayISO();
    const eligible = adsList.filter((ad) => {
      if (!ad.active) return false;
      if (dismissedAdIds.includes(ad.id)) return false;
      if (ad.startDate && today < ad.startDate) return false;
      if (ad.endDate && today > ad.endDate) return false;
      return true;
    });
    return eligible[0] || null;
  }, [adsList, dismissedAdIds]);

  const handleDismissAd = (adId: string) => {
    const next = Array.from(new Set([...dismissedAdIds, adId]));
    setDismissedAdIds(next);
    saveDismissedAdIds(next);
  };

  const shopDisplayName =
    language === 'ur'
      ? settings.shopNameUr || settings.shopNameEn || t.appTitle
      : settings.shopNameEn || settings.shopNameUr || t.appTitle;

  const primaryDesktopItems: { id: ActiveTab; label: string }[] = [
    { id: 'home', label: t.navHome },
    { id: 'sales', label: t.navSales },
    { id: 'purchase', label: t.navPurchase },
    { id: 'roznamcha', label: t.navRoznamcha },
    { id: 'khata', label: t.navKhata },
    { id: 'reports', label: t.navReports },
    { id: 'settings', label: t.navSettings },
  ];

  const secondaryItems: { id: ActiveTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'calculators', label: t.navCalculators, icon: Calculator },
    { id: 'tutorial', label: t.navTutorial, icon: GraduationCap },
    { id: 'about', label: t.navAbout, icon: Info },
    ...(globalConfig.aiEnabled
      ? [{ id: 'premium' as ActiveTab, label: t.navPremium, icon: Sparkles }]
      : []),
    ...(isAdmin
      ? [{ id: 'admin' as ActiveTab, label: t.navAdmin, icon: Shield }]
      : []),
  ];

  const navigateTo = (tab: ActiveTab) => {
    setActiveTab(tab);
    setMoreDesktopOpen(false);
    setMoreMobileOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#F5F2E7] text-slate-900 pb-24 lg:pb-10 dark:bg-slate-950 dark:text-slate-100">
      <SplashScreen language={language} shopName={shopDisplayName} />

      {/* Top Header */}
      <header className="no-print sticky top-0 z-30 border-b border-emerald-900/15 bg-[#12452D] text-white shadow-sm">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-3 px-4">
          {/* Brand Zone */}
          <button
            type="button"
            onClick={() => navigateTo('home')}
            className="flex min-w-0 items-center gap-2.5 text-start"
          >
            {logo ? (
              <img
                src={logo}
                alt={shopDisplayName}
                className="h-9 w-9 shrink-0 rounded-xl bg-white object-contain p-0.5"
              />
            ) : (
              <BrandLogo size={36} animated />
            )}
            <span className="truncate text-base font-extrabold tracking-tight text-white sm:text-lg">
              {shopDisplayName}
            </span>
          </button>

          {/* Desktop Navigation Links */}
          <nav className="hidden items-center gap-1 lg:flex" aria-label="Primary Navigation">
            {primaryDesktopItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => navigateTo(item.id)}
                className={`min-h-[38px] rounded-xl px-3 py-1.5 text-xs font-bold transition whitespace-nowrap shrink-0 ${
                  activeTab === item.id
                    ? 'bg-[#0B7D50] text-[#F2CC70]'
                    : 'text-emerald-100 hover:bg-white/10 hover:text-white'
                }`}
              >
                {item.label}
              </button>
            ))}

            <div className="relative">
              <button
                type="button"
                onClick={() => setMoreDesktopOpen((v) => !v)}
                className={`flex min-h-[38px] items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-bold transition whitespace-nowrap shrink-0 ${
                  secondaryItems.some((s) => s.id === activeTab)
                    ? 'bg-[#0B7D50] text-[#F2CC70]'
                    : 'text-emerald-100 hover:bg-white/10 hover:text-white'
                }`}
              >
                <span>{t.moreMenu}</span>
                <ChevronDown className="h-3.5 w-3.5" />
              </button>
              {moreDesktopOpen && (
                <div className="absolute end-0 top-11 z-40 w-48 rounded-2xl border border-slate-200 bg-white p-1.5 text-slate-900 shadow-xl dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100">
                  {secondaryItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => navigateTo(item.id)}
                        className={`flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold ${
                          activeTab === item.id
                            ? 'bg-[#0B7D50] text-white'
                            : 'hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </nav>

          {/* Actions: User indicator + Language + Theme + PWA Install */}
          <div className="flex items-center gap-2 shrink-0">
            <PWAInstallButton t={t} />

            {authUser && authUser.photoURL && (
              <button
                type="button"
                onClick={() => navigateTo('settings')}
                title={authUser.displayName || authUser.email || ''}
                className="hidden h-8 w-8 overflow-hidden rounded-full ring-2 ring-[#F2CC70]/70 sm:block"
              >
                <img
                  src={authUser.photoURL}
                  alt={authUser.displayName || 'Google'}
                  className="h-full w-full object-cover"
                />
              </button>
            )}

            <button
              type="button"
              onClick={() => setLanguage((l) => (l === 'ur' ? 'en' : 'ur'))}
              aria-label={t.languageLabel}
              className="flex min-h-[38px] items-center gap-1.5 rounded-xl bg-white/10 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-white/20 whitespace-nowrap shrink-0"
            >
              <Languages className="h-4 w-4 text-[#F2CC70]" />
              <span>{language === 'ur' ? 'EN' : 'اردو'}</span>
            </button>

            <button
              type="button"
              onClick={() => setTheme((th) => (th === 'light' ? 'dark' : 'light'))}
              aria-label={t.themeLabel}
              className="flex min-h-[38px] min-w-[38px] items-center justify-center rounded-xl bg-white/10 text-white transition hover:bg-white/20"
            >
              {theme === 'light' ? (
                <Moon className="h-4 w-4 text-[#F2CC70]" />
              ) : (
                <Sun className="h-4 w-4 text-[#F2CC70]" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Viewport */}
      <main className="mx-auto max-w-7xl px-4 py-5 sm:px-6 sm:py-6">
        {activeTab === 'home' && (
          <Dashboard
            language={language}
            t={t}
            settings={settings}
            sales={sales}
            purchases={purchases}
            roznamchaEntries={roznamchaEntries}
            roznamchaSettings={roznamchaSettings}
            quickNotes={quickNotes}
            activeAd={activeAd}
            globalConfig={globalConfig}
            onAddQuickNote={handleAddQuickNote}
            onToggleQuickNoteDone={handleToggleQuickNoteDone}
            onToggleQuickNotePin={handleToggleQuickNotePin}
            onEditQuickNote={handleEditQuickNote}
            onDeleteQuickNote={handleDeleteQuickNote}
            onClearDoneQuickNotes={handleClearDoneQuickNotes}
            onDismissAd={handleDismissAd}
            onNavigate={navigateTo}
            onOpenQuickSlip={(m) => navigateTo(m === 'sale' ? 'sales' : 'purchase')}
            onOpenCalculator={(calcId) => {
              setActiveCalcId(calcId);
              navigateTo('calculators');
            }}
            onViewSlip={(rec) => setActiveSlip(rec)}
          />
        )}

        {activeTab === 'sales' && (
          <TradeRegister
            key="sales-register"
            mode="sale"
            language={language}
            t={t}
            settings={settings}
            records={sales}
            knownParties={knownParties}
            onSaveSale={handleSaveSale}
            onSavePurchase={handleSavePurchase}
            onDeleteRecord={handleDeleteSale}
            onViewSlip={(rec) => setActiveSlip(rec)}
          />
        )}

        {activeTab === 'purchase' && (
          <TradeRegister
            key="purchase-register"
            mode="purchase"
            language={language}
            t={t}
            settings={settings}
            records={purchases}
            knownParties={knownParties}
            onSaveSale={handleSaveSale}
            onSavePurchase={handleSavePurchase}
            onDeleteRecord={handleDeletePurchase}
            onViewSlip={(rec) => setActiveSlip(rec)}
          />
        )}

        {activeTab === 'roznamcha' && (
          <RoznamchaView
            language={language}
            t={t}
            settings={settings}
            entries={roznamchaEntries}
            roznamchaSettings={roznamchaSettings}
            knownParties={knownParties}
            onSaveEntry={handleSaveRoznamchaEntry}
            onDeleteEntry={handleDeleteRoznamchaEntry}
            onUpdateRoznamchaSettings={handleUpdateRoznamchaSettings}
          />
        )}

        {activeTab === 'khata' && (
          <PartyLedger
            language={language}
            t={t}
            settings={settings}
            sales={sales}
            purchases={purchases}
            payments={ledger}
            partyMeta={partyMeta}
            roznamchaEntries={roznamchaEntries}
            onAddPayment={handleAddPayment}
            onUpdatePayment={handleUpdatePayment}
            onDeletePayment={handleDeletePayment}
            onUpdatePartyMeta={handleUpdatePartyMeta}
          />
        )}

        {activeTab === 'calculators' && (
          <CalculatorCentre
            language={language}
            t={t}
            settings={settings}
            initialCalculator={activeCalcId}
          />
        )}

        {activeTab === 'reports' && (
          <ReportsView
            language={language}
            t={t}
            sales={sales}
            purchases={purchases}
            roznamchaEntries={roznamchaEntries}
            roznamchaSettings={roznamchaSettings}
            onViewSlip={(rec) => setActiveSlip(rec)}
          />
        )}

        {activeTab === 'tutorial' && (
          <TutorialView
            language={language}
            t={t}
            youtubeUrl={globalConfig.tutorialYoutubeUrl}
          />
        )}

        {activeTab === 'about' && (
          <AboutView language={language} t={t} settings={settings} />
        )}

        {activeTab === 'premium' && (
          <PremiumAIView
            language={language}
            t={t}
            settings={settings}
            globalConfig={globalConfig}
            sales={sales}
            purchases={purchases}
            onSaveSale={(d) => handleSaveSale(d)}
            onSavePurchase={(d) => handleSavePurchase(d)}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsView
            language={language}
            theme={theme}
            t={t}
            settings={settings}
            logo={logo}
            signature={signature}
            sales={sales}
            purchases={purchases}
            ledger={ledger}
            partyMeta={partyMeta}
            roznamchaEntries={roznamchaEntries}
            roznamchaSettings={roznamchaSettings}
            counters={counters}
            authUser={authUser}
            hasDriveToken={hasDriveToken}
            authNotice={authNotice}
            autoBackupSettings={autoBackupSettings}
            localSnapshots={localSnapshots}
            onUpdateSettings={handleUpdateSettings}
            onUpdateLogo={handleUpdateLogo}
            onUpdateSignature={handleUpdateSignature}
            onChangeTheme={setTheme}
            onChangeLanguage={setLanguage}
            onReopenWizard={() => setWizardOpen(true)}
            onRestoreBackup={handleRestoreBackup}
            onGoogleSignIn={handleGoogleSignIn}
            onGoogleSignOut={handleGoogleSignOut}
            onUpdateAutoBackup={updateAutoBackup}
            onBackupNow={() => performBackupNow(false)}
            onDriveBackupNow={handleDriveBackupNow}
            onListDriveBackups={handleListDriveBackups}
            onDownloadDriveBackup={handleDownloadDriveBackup}
          />
        )}

        {activeTab === 'admin' && isAdmin && (
          <AdminPanel t={t} authUser={authUser} globalConfig={globalConfig} />
        )}

        {/* Fixed Non-Editable Developer Credit Footer (Never on Customer Receipts) */}
        <footer className="no-print mt-10 border-t border-slate-200/80 pt-5 text-center dark:border-slate-800">
          <button
            type="button"
            onClick={() => navigateTo('about')}
            className="text-xs font-bold text-slate-600 hover:text-[#0B7D50] dark:text-slate-400 dark:hover:text-emerald-400"
          >
            {DEVELOPER_CREDIT.footerText} · {DEVELOPER_CREDIT.phoneDisplay}
          </button>
        </footer>
      </main>

      {/* Mobile Floating + Action Button (hidden on entry views that already show dedicated add buttons) */}
      {activeTab !== 'roznamcha' && activeTab !== 'sales' && activeTab !== 'purchase' && (
        <button
          type="button"
          onClick={() => setQuickAddOpen(true)}
          aria-label={t.addSaleBtn}
          className="no-print fixed bottom-20 end-4 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-[#0B7D50] text-white shadow-xl transition hover:bg-[#12452D] active:scale-95 lg:hidden"
        >
          <Plus className="h-7 w-7" />
        </button>
      )}

      {/* Mobile Quick Add Action Sheet */}
      {quickAddOpen && (
        <div
          className="no-print fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={() => setQuickAddOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-t-3xl bg-white p-5 shadow-2xl dark:bg-slate-900"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <span className="text-base font-extrabold text-slate-900 dark:text-slate-100">
                {t.quickActions}
              </span>
              <button
                type="button"
                onClick={() => setQuickAddOpen(false)}
                aria-label={t.close}
                className="flex min-h-[40px] min-w-[40px] items-center justify-center rounded-xl text-slate-600 dark:text-slate-300"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  setQuickAddOpen(false);
                  navigateTo('sales');
                }}
                className="flex min-h-[54px] items-center justify-center gap-2 rounded-2xl bg-[#D9AA45] px-4 py-3 text-sm font-extrabold text-[#12452D]"
              >
                <ArrowUpRight className="h-4 w-4" />
                {t.addSaleBtn}
              </button>
              <button
                type="button"
                onClick={() => {
                  setQuickAddOpen(false);
                  navigateTo('purchase');
                }}
                className="flex min-h-[54px] items-center justify-center gap-2 rounded-2xl bg-[#0B7D50] px-4 py-3 text-sm font-extrabold text-white"
              >
                <ArrowDownLeft className="h-4 w-4" />
                {t.addPurchaseBtn}
              </button>
              <button
                type="button"
                onClick={() => {
                  setQuickAddOpen(false);
                  navigateTo('roznamcha');
                }}
                className="flex min-h-[48px] items-center justify-center gap-2 rounded-2xl border border-slate-300 px-4 py-2 text-sm font-bold text-slate-800 dark:border-slate-700 dark:text-slate-100"
              >
                <BookOpenText className="h-4 w-4 text-[#0B7D50]" />
                {t.navRoznamcha}
              </button>
              <button
                type="button"
                onClick={() => {
                  setQuickAddOpen(false);
                  navigateTo('khata');
                }}
                className="flex min-h-[48px] items-center justify-center gap-2 rounded-2xl border border-slate-300 px-4 py-2 text-sm font-bold text-slate-800 dark:border-slate-700 dark:text-slate-100"
              >
                <BookOpen className="h-4 w-4 text-[#0B7D50]" />
                {t.navKhata}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile More Menu Sheet */}
      {moreMobileOpen && (
        <div
          className="no-print fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={() => setMoreMobileOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-t-3xl bg-white p-5 shadow-2xl dark:bg-slate-900"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <span className="text-base font-extrabold text-slate-900 dark:text-slate-100">
                {t.moreMenu}
              </span>
              <button
                type="button"
                onClick={() => setMoreMobileOpen(false)}
                aria-label={t.close}
                className="flex min-h-[40px] min-w-[40px] items-center justify-center rounded-xl text-slate-600 dark:text-slate-300"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              {[
                { id: 'khata' as ActiveTab, label: t.navKhata, icon: BookOpen },
                { id: 'calculators' as ActiveTab, label: t.navCalculators, icon: Calculator },
                { id: 'reports' as ActiveTab, label: t.navReports, icon: BarChart3 },
                { id: 'tutorial' as ActiveTab, label: t.navTutorial, icon: GraduationCap },
                { id: 'about' as ActiveTab, label: t.navAbout, icon: Info },
                ...(globalConfig.aiEnabled
                  ? [{ id: 'premium' as ActiveTab, label: t.navPremium, icon: Sparkles }]
                  : []),
                { id: 'settings' as ActiveTab, label: t.navSettings, icon: Settings },
                ...(isAdmin
                  ? [{ id: 'admin' as ActiveTab, label: t.navAdmin, icon: Shield }]
                  : []),
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => navigateTo(item.id)}
                    className={`flex min-h-[48px] items-center gap-2 rounded-2xl border px-3.5 py-2 text-xs font-bold ${
                      activeTab === item.id
                        ? 'border-[#0B7D50] bg-[#0B7D50] text-white'
                        : 'border-slate-200 bg-slate-50 text-slate-900 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-100'
                    }`}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Mobile Fixed Bottom Tab Bar: Home, Sales, Purchase, Roznamcha, More */}
      <nav
        aria-label="Mobile Navigation"
        className="no-print fixed bottom-0 left-0 right-0 z-30 border-t border-slate-200 bg-white/95 backdrop-blur-md lg:hidden dark:border-slate-800 dark:bg-slate-900/95"
      >
        <div className="grid h-16 grid-cols-5 items-center">
          {[
            { id: 'home' as ActiveTab, label: t.navHome, icon: Home },
            { id: 'sales' as ActiveTab, label: t.navSales, icon: ArrowUpRight },
            { id: 'purchase' as ActiveTab, label: t.navPurchase, icon: ArrowDownLeft },
            { id: 'roznamcha' as ActiveTab, label: t.navRoznamcha, icon: BookOpenText },
          ].map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => navigateTo(item.id)}
                className={`flex min-h-[48px] flex-col items-center justify-center gap-0.5 text-[11px] font-bold transition ${
                  isActive
                    ? 'text-[#0B7D50] dark:text-emerald-400'
                    : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="max-w-[64px] truncate">{item.label}</span>
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => setMoreMobileOpen(true)}
            className={`flex min-h-[48px] flex-col items-center justify-center gap-0.5 text-[11px] font-bold transition ${
              ['khata', 'calculators', 'reports', 'tutorial', 'about', 'premium', 'settings', 'admin'].includes(
                activeTab
              )
                ? 'text-[#0B7D50] dark:text-emerald-400'
                : 'text-slate-600 dark:text-slate-300'
            }`}
          >
            <Menu className="h-5 w-5" />
            <span className="max-w-[64px] truncate">{t.moreMenu}</span>
          </button>
        </div>
      </nav>

      <OfflineIndicator t={t} />

      <ReceiptModal
        record={activeSlip}
        settings={settings}
        logo={logo}
        signature={signature}
        language={language}
        t={t}
        onClose={() => setActiveSlip(null)}
      />

      <SetupWizard
        open={wizardOpen}
        language={language}
        t={t}
        settings={settings}
        logo={logo}
        signature={signature}
        onUpdateSettings={handleUpdateSettings}
        onUpdateLogo={handleUpdateLogo}
        onUpdateSignature={handleUpdateSignature}
        onFinish={() => {
          saveSetupDone(true);
          setWizardOpen(false);
        }}
        onSkip={() => {
          saveSetupDone(true);
          setWizardOpen(false);
        }}
      />

      {/* Google Drive Restore Detection Prompt */}
      {driveRestorePrompt && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md space-y-4 rounded-3xl bg-white p-6 shadow-2xl dark:bg-slate-900">
            <h3 className="text-lg font-extrabold text-slate-900 dark:text-slate-100">
              {t.driveRestorePromptTitle}
            </h3>
            <p className="text-sm text-slate-700 dark:text-slate-300">
              {t.driveRestorePromptDesc} (
              <span className="ltr-num font-bold">
                {driveRestorePrompt.file.createdTime.slice(0, 10)} ·{' '}
                {formatBytes(driveRestorePrompt.file.sizeBytes)}
              </span>
              )
            </p>

            {drivePromptRestorePayload ? (
              <div className="space-y-3 rounded-2xl border border-[#0B7D50] bg-[#F5F2E7] p-4 dark:bg-slate-800">
                <p className="text-xs font-bold">
                  {t.navSales}: {drivePromptRestorePayload.sales.length} ·{' '}
                  {t.navPurchase}: {drivePromptRestorePayload.purchases.length} ·{' '}
                  {t.navKhata}: {drivePromptRestorePayload.ledger.length} ·{' '}
                  {t.navRoznamcha}:{' '}
                  {drivePromptRestorePayload.roznamchaEntries?.length || 0}
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      handleRestoreBackup(drivePromptRestorePayload, 'merge');
                      setDrivePromptRestorePayload(null);
                      setDriveRestorePrompt(null);
                    }}
                    className="min-h-[40px] rounded-xl bg-[#0B7D50] px-4 py-2 text-xs font-bold text-white"
                  >
                    {t.mergeBackupBtn}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      handleRestoreBackup(drivePromptRestorePayload, 'replace');
                      setDrivePromptRestorePayload(null);
                      setDriveRestorePrompt(null);
                    }}
                    className="min-h-[40px] rounded-xl bg-amber-600 px-4 py-2 text-xs font-bold text-white"
                  >
                    {t.replaceBackupBtn}
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      const payload = await handleDownloadDriveBackup(
                        driveRestorePrompt.file.id
                      );
                      setDrivePromptRestorePayload(payload);
                    } catch {
                      setDriveRestorePrompt(null);
                    }
                  }}
                  className="min-h-[42px] rounded-xl bg-[#0B7D50] px-5 py-2 text-xs font-extrabold text-white"
                >
                  {t.driveRestoreBtn}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDrivePromptRestorePayload(null);
                    setDriveRestorePrompt(null);
                  }}
                  className="min-h-[42px] rounded-xl border border-slate-300 px-4 py-2 text-xs font-bold text-slate-700 dark:border-slate-700 dark:text-slate-200"
                >
                  {t.restoreLaterBtn}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

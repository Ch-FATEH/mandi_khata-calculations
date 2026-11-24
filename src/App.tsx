import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowDownLeft,
  ArrowUpRight,
  BarChart3,
  BookOpen,
  Calculator,
  Home,
  Languages,
  Moon,
  Plus,
  Settings,
  Sprout,
  Sun,
  X,
} from 'lucide-react';
import {
  AppLanguage,
  AppSettings,
  BackupPayload,
  PartyPayment,
  PurchaseRecord,
  RefCounters,
  SaleRecord,
  ThemeMode,
  TradeRecord,
} from './types/mandi';
import { TRANSLATIONS } from './i18n/translations';
import {
  allocateNextRef,
  loadCounters,
  loadLanguage,
  loadLedger,
  loadLogo,
  loadPurchases,
  loadSales,
  loadSettings,
  loadSetupDone,
  loadSignature,
  loadTheme,
  mergeBackupData,
  saveCounters,
  saveLanguage,
  saveLedger,
  saveLogo,
  savePurchases,
  saveSales,
  saveSettings,
  saveSetupDone,
  saveSignature,
  saveTheme,
} from './utils/storage';
import { normalizePartyName } from './utils/calculations';
import { ActiveTab, Dashboard } from './components/Dashboard';
import { TradeRegister } from './components/TradeRegister';
import { PartyLedger } from './components/PartyLedger';
import { CalculatorCentre } from './components/CalculatorCentre';
import { ReportsView } from './components/ReportsView';
import { SettingsView } from './components/SettingsView';
import { ReceiptModal } from './components/ReceiptModal';
import { SetupWizard } from './components/SetupWizard';
import { OfflineIndicator, PWAInstallButton } from './components/PWAControls';

export default function App() {
  const [settings, setSettings] = useState<AppSettings>(() => loadSettings());
  const [sales, setSales] = useState<SaleRecord[]>(() => loadSales());
  const [purchases, setPurchases] = useState<PurchaseRecord[]>(() => loadPurchases());
  const [ledger, setLedger] = useState<PartyPayment[]>(() => loadLedger());
  const [counters, setCounters] = useState<RefCounters>(() => loadCounters(loadSettings()));
  const [theme, setTheme] = useState<ThemeMode>(() => loadTheme());
  const [language, setLanguage] = useState<AppLanguage>(() => loadLanguage());
  const [logo, setLogo] = useState<string | null>(() => loadLogo());
  const [signature, setSignature] = useState<string | null>(() => loadSignature());

  const [wizardOpen, setWizardOpen] = useState<boolean>(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('autostart') === '1') return false;
    return !loadSetupDone();
  });

  const [activeTab, setActiveTab] = useState<ActiveTab>('home');
  const [activeCalcId, setActiveCalcId] = useState<string>('commission');
  const [activeSlip, setActiveSlip] = useState<TradeRecord | null>(null);
  const [quickAddOpen, setQuickAddOpen] = useState(false);

  const t = TRANSLATIONS[language];

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
    return Array.from(set.values()).sort((a, b) => a.localeCompare(b));
  }, [sales, purchases, ledger]);

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

  const handleDeletePayment = (id: string) => {
    const next = ledger.filter((l) => l.id !== id);
    setLedger(next);
    saveLedger(next);
  };

  const handleRestoreBackup = (payload: BackupPayload, mode: 'merge' | 'replace') => {
    if (mode === 'replace') {
      setSales(payload.sales);
      saveSales(payload.sales);
      setPurchases(payload.purchases);
      savePurchases(payload.purchases);
      setLedger(payload.ledger);
      saveLedger(payload.ledger);
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
        { sales, purchases, ledger, counters },
        payload
      );
      setSales(merged.sales);
      saveSales(merged.sales);
      setPurchases(merged.purchases);
      savePurchases(merged.purchases);
      setLedger(merged.ledger);
      saveLedger(merged.ledger);
      setCounters(merged.counters);
      saveCounters(merged.counters);
    }
  };

  const shopDisplayName =
    language === 'ur'
      ? settings.shopNameUr || settings.shopNameEn || t.appTitle
      : settings.shopNameEn || settings.shopNameUr || t.appTitle;

  const desktopNavItems: { id: ActiveTab; label: string }[] = [
    { id: 'home', label: t.navHome },
    { id: 'sales', label: t.navSales },
    { id: 'purchase', label: t.navPurchase },
    { id: 'khata', label: t.navKhata },
    { id: 'calculators', label: t.navCalculators },
    { id: 'reports', label: t.navReports },
    { id: 'settings', label: t.navSettings },
  ];

  return (
    <div className="min-h-screen bg-[#F5F2E7] text-slate-900 pb-24 lg:pb-10 dark:bg-slate-950 dark:text-slate-100">
      {/* Top Header */}
      <header className="no-print sticky top-0 z-30 border-b border-emerald-900/15 bg-[#12452D] text-white shadow-sm">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-4 px-4">
          {/* Brand Zone */}
          <button
            type="button"
            onClick={() => setActiveTab('home')}
            className="flex min-w-0 items-center gap-2.5 text-start"
          >
            {logo ? (
              <img
                src={logo}
                alt={shopDisplayName}
                className="h-9 w-9 shrink-0 rounded-xl bg-white object-contain p-0.5"
              />
            ) : (
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#0B7D50] text-[#F2CC70]">
                <Sprout className="h-5 w-5" />
              </div>
            )}
            <span className="truncate text-base font-extrabold tracking-tight text-white sm:text-lg">
              {shopDisplayName}
            </span>
          </button>

          {/* Desktop Navigation Links */}
          <nav className="hidden items-center gap-1 lg:flex" aria-label="Primary Navigation">
            {desktopNavItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`min-h-[38px] rounded-xl px-3 py-1.5 text-xs font-bold transition whitespace-nowrap shrink-0 ${
                  activeTab === item.id
                    ? 'bg-[#0B7D50] text-[#F2CC70]'
                    : 'text-emerald-100 hover:bg-white/10 hover:text-white'
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>

          {/* Actions: Language + Theme + PWA Install */}
          <div className="flex items-center gap-2 shrink-0">
            <PWAInstallButton t={t} />

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
            onNavigate={setActiveTab}
            onOpenQuickSlip={(m) => setActiveTab(m === 'sale' ? 'sales' : 'purchase')}
            onOpenCalculator={(calcId) => {
              setActiveCalcId(calcId);
              setActiveTab('calculators');
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

        {activeTab === 'khata' && (
          <PartyLedger
            language={language}
            t={t}
            sales={sales}
            purchases={purchases}
            payments={ledger}
            onAddPayment={handleAddPayment}
            onDeletePayment={handleDeletePayment}
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
            counters={counters}
            onUpdateSettings={handleUpdateSettings}
            onUpdateLogo={handleUpdateLogo}
            onUpdateSignature={handleUpdateSignature}
            onChangeTheme={setTheme}
            onChangeLanguage={setLanguage}
            onReopenWizard={() => setWizardOpen(true)}
            onRestoreBackup={handleRestoreBackup}
          />
        )}
      </main>

      {/* Mobile Floating + Action Button */}
      <button
        type="button"
        onClick={() => setQuickAddOpen(true)}
        aria-label={t.addSaleBtn}
        className="no-print fixed bottom-20 end-4 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-[#0B7D50] text-white shadow-xl transition hover:bg-[#12452D] active:scale-95 lg:hidden"
      >
        <Plus className="h-7 w-7" />
      </button>

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
                  setActiveTab('sales');
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
                  setActiveTab('purchase');
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
                  setActiveTab('khata');
                }}
                className="flex min-h-[48px] items-center justify-center gap-2 rounded-2xl border border-slate-300 px-4 py-2 text-sm font-bold text-slate-800 dark:border-slate-700 dark:text-slate-100"
              >
                <BookOpen className="h-4 w-4 text-[#0B7D50]" />
                {t.navKhata}
              </button>
              <button
                type="button"
                onClick={() => {
                  setQuickAddOpen(false);
                  setActiveTab('calculators');
                }}
                className="flex min-h-[48px] items-center justify-center gap-2 rounded-2xl border border-slate-300 px-4 py-2 text-sm font-bold text-slate-800 dark:border-slate-700 dark:text-slate-100"
              >
                <Calculator className="h-4 w-4 text-[#0B7D50]" />
                {t.navCalculators}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Fixed Bottom Tab Bar: Home, فروخت, خرید, Reports, Settings */}
      <nav
        aria-label="Mobile Navigation"
        className="no-print fixed bottom-0 left-0 right-0 z-30 border-t border-slate-200 bg-white/95 backdrop-blur-md lg:hidden dark:border-slate-800 dark:bg-slate-900/95"
      >
        <div className="grid h-16 grid-cols-5 items-center">
          {[
            { id: 'home' as ActiveTab, label: t.navHome, icon: Home },
            { id: 'sales' as ActiveTab, label: t.navSales, icon: ArrowUpRight },
            { id: 'purchase' as ActiveTab, label: t.navPurchase, icon: ArrowDownLeft },
            { id: 'reports' as ActiveTab, label: t.navReports, icon: BarChart3 },
            { id: 'settings' as ActiveTab, label: t.navSettings, icon: Settings },
          ].map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`flex min-h-[48px] flex-col items-center justify-center gap-0.5 text-[11px] font-bold transition ${
                  isActive
                    ? 'text-[#0B7D50] dark:text-emerald-400'
                    : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="truncate max-w-[64px]">{item.label}</span>
              </button>
            );
          })}
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
    </div>
  );
}

import React, { useState } from 'react';
import { Download, Smartphone, WifiOff } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { Translations } from '../i18n/translations';

interface PWAControlsProps {
  t: Translations;
}

export const PWAInstallButton: React.FC<PWAControlsProps> = ({ t }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (isInstalled) {
    return null;
  }

  if (isInstallable) {
    return (
      <button
        type="button"
        onClick={install}
        className="flex min-h-[38px] items-center gap-1.5 rounded-xl bg-[#D9AA45] px-3 py-1.5 text-xs font-extrabold text-[#12452D] shadow-sm transition hover:bg-[#e3b859] whitespace-nowrap shrink-0"
      >
        <Download className="h-3.5 w-3.5" />
        <span>{t.installApp}</span>
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          type="button"
          onClick={() => setShowIOSGuide(true)}
          className="flex min-h-[38px] items-center gap-1.5 rounded-xl border border-[#D9AA45] bg-white/10 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-white/20 whitespace-nowrap shrink-0"
        >
          <Smartphone className="h-3.5 w-3.5" />
          <span>{t.installIOS}</span>
        </button>

        {showIOSGuide && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
            role="dialog"
            aria-modal="true"
          >
            <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-900">
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                {t.iosGuideTitle}
              </h3>
              <ol className="mt-3 list-inside list-decimal space-y-2 text-sm text-slate-700 dark:text-slate-300">
                <li>{t.iosGuideStep1}</li>
                <li>{t.iosGuideStep2}</li>
              </ol>
              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="mt-5 min-h-[44px] w-full rounded-xl bg-[#0B7D50] py-2 text-sm font-bold text-white hover:bg-[#12452D]"
              >
                {t.close}
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};

export const OfflineIndicator: React.FC<PWAControlsProps> = ({ t }) => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div
      role="status"
      className="no-print fixed bottom-20 start-4 z-40 flex items-center gap-2 rounded-xl bg-amber-600 px-3.5 py-2 text-xs font-bold text-white shadow-lg lg:bottom-4"
    >
      <WifiOff className="h-4 w-4 shrink-0" />
      <span>{t.offlineBanner}</span>
    </div>
  );
};

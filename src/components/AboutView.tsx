import React from 'react';
import { ExternalLink, MapPin, MessageCircle, Phone, ShieldCheck } from 'lucide-react';
import { AppLanguage, AppSettings } from '../types/mandi';
import { Translations } from '../i18n/translations';
import { DEVELOPER_CREDIT } from '../config';
import { BrandLogo } from './BrandLogo';

interface AboutViewProps {
  language: AppLanguage;
  t: Translations;
  settings: AppSettings;
}

export function buildShopMapsHref(settings: AppSettings): string | null {
  if (settings.shopMapLink?.trim()) {
    return settings.shopMapLink.trim();
  }
  if (
    typeof settings.shopLat === 'number' &&
    typeof settings.shopLng === 'number' &&
    Number.isFinite(settings.shopLat) &&
    Number.isFinite(settings.shopLng)
  ) {
    return `https://www.google.com/maps?q=${settings.shopLat},${settings.shopLng}`;
  }
  return null;
}

export const AboutView: React.FC<AboutViewProps> = ({ language, t, settings }) => {
  const shopName =
    language === 'ur'
      ? settings.shopNameUr || settings.shopNameEn || t.defaultShopName
      : settings.shopNameEn || settings.shopNameUr || t.defaultShopName;
  const mapsHref = buildShopMapsHref(settings);
  const fullAddress = [settings.address, settings.city].filter(Boolean).join('، ');

  return (
    <div className="space-y-6">
      {/* App & Brand Hero */}
      <section className="rounded-3xl bg-gradient-to-br from-[#12452D] to-[#0B7D50] p-6 text-white shadow-lg">
        <div className="flex flex-wrap items-center gap-4">
          <BrandLogo size={64} animated />
          <div>
            <h1 className="text-2xl font-extrabold text-white">{t.appTitle}</h1>
            <p className="mt-1 text-sm text-emerald-100">{t.aboutTitle}</p>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2 text-xs font-semibold text-emerald-100">
          <ShieldCheck className="h-4 w-4 text-[#F2CC70]" />
          <span>{t.offlineBanner}</span>
        </div>
      </section>

      {/* Fixed Developer / Designing Team Credit Card (Non-Editable) */}
      <section className="rounded-3xl border-2 border-[#D9AA45]/60 bg-white p-6 shadow-sm dark:border-[#D9AA45]/40 dark:bg-slate-900">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4 dark:border-slate-800">
          <div>
            <p className="ltr-num text-lg font-extrabold text-[#12452D] dark:text-[#F2CC70]">
              {DEVELOPER_CREDIT.teamLabel}
            </p>
            <p className="ltr-num mt-0.5 text-xs font-semibold text-slate-600 dark:text-slate-300">
              {DEVELOPER_CREDIT.phoneDisplay}
            </p>
          </div>
          <span className="rounded-xl bg-[#F5F2E7] px-3 py-1.5 text-xs font-extrabold text-[#12452D] dark:bg-slate-800 dark:text-emerald-300">
            {DEVELOPER_CREDIT.footerText}
          </span>
        </div>

        <p className="mt-4 text-sm font-semibold leading-relaxed text-slate-800 dark:text-slate-100">
          {DEVELOPER_CREDIT.whatsappPitchUr}
        </p>

        <div className="mt-5 flex flex-wrap gap-3">
          <a
            href={DEVELOPER_CREDIT.whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex min-h-[46px] items-center justify-center gap-2 rounded-2xl bg-[#16A34A] px-5 py-2.5 text-sm font-extrabold text-white shadow-sm transition hover:bg-[#15803D]"
          >
            <MessageCircle className="h-5 w-5" />
            <span>{t.whatsappContactBtn}</span>
          </a>
          <a
            href={DEVELOPER_CREDIT.telUrl}
            className="flex min-h-[46px] items-center justify-center gap-2 rounded-2xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-extrabold text-slate-900 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          >
            <Phone className="h-4 w-4 text-[#0B7D50]" />
            <span>{t.callContactBtn}</span>
          </a>
        </div>
      </section>

      {/* Shop Profile & Optional Google Maps Directions */}
      {(settings.shopNameUr || settings.shopNameEn || fullAddress || mapsHref) && (
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-base font-extrabold text-slate-900 dark:text-slate-100">
            {t.shopProfileCardTitle}
          </h2>
          <p className="mt-2 text-lg font-bold text-[#12452D] dark:text-emerald-300">
            {shopName}
          </p>
          {fullAddress && (
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{fullAddress}</p>
          )}
          {mapsHref && (
            <div className="mt-4">
              <a
                href={mapsHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-[#0B7D50] px-4 py-2.5 text-xs font-extrabold text-white hover:bg-[#12452D]"
              >
                <MapPin className="h-4 w-4 text-[#F2CC70]" />
                <span>{t.openInMapsBtn}</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          )}
        </section>
      )}
    </div>
  );
};

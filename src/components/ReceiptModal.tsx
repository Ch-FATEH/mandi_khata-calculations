import React, { useRef, useState } from 'react';
import html2canvas from 'html2canvas-pro';
import { Copy, Download, Printer, Share2, X, Check } from 'lucide-react';
import { AppLanguage, AppSettings, TradeRecord } from '../types/mandi';
import { Translations } from '../i18n/translations';
import { formatNumber, formatRs } from '../utils/calculations';

interface ReceiptModalProps {
  record: TradeRecord | null;
  settings: AppSettings;
  logo: string | null;
  signature: string | null;
  language: AppLanguage;
  t: Translations;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  record,
  settings,
  logo,
  signature,
  language,
  t,
  onClose,
}) => {
  const slipRef = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!record) return null;

  const isSale = record.type === 'sale';
  const activeOwners = settings.owners.filter((o) => o.name.trim() || o.phone.trim());
  const headerTagline = settings.receiptHeaderLine || settings.tagline;
  const footerAddr =
    settings.receiptFooterAddress ||
    [settings.address, settings.city].filter(Boolean).join('، ');
  const cropDisplay =
    language === 'ur'
      ? record.cropNameUr || record.cropNameEn
      : record.cropNameEn || record.cropNameUr;
  const taxLabel =
    language === 'ur' ? settings.taxLabourLabelUr : settings.taxLabourLabelEn;

  const captureSlipBlob = async (): Promise<Blob | null> => {
    if (!slipRef.current) return null;
    const el = slipRef.current;
    const canvas = await html2canvas(el, {
      backgroundColor: '#FFFFFF',
      scale: 2,
      useCORS: true,
      logging: false,
      windowWidth: el.scrollWidth,
      windowHeight: el.scrollHeight,
    });
    return new Promise((resolve) => canvas.toBlob((blob) => resolve(blob), 'image/png'));
  };

  const triggerDownload = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const handleDownloadPng = async () => {
    setBusy(true);
    try {
      const blob = await captureSlipBlob();
      if (blob) {
        triggerDownload(blob, `${record.refNo}-${record.date}.png`);
      }
    } finally {
      setBusy(false);
    }
  };

  const handleShareWhatsapp = async () => {
    setBusy(true);
    try {
      const blob = await captureSlipBlob();
      if (blob) {
        const file = new File([blob], `${record.refNo}.png`, { type: 'image/png' });
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: `${isSale ? t.salesSlipTitle : t.purchaseSlipTitle} (${record.refNo})`,
            text: buildTextSummary(),
          });
          return;
        }
        triggerDownload(blob, `${record.refNo}-${record.date}.png`);
      }
    } catch {
      // User cancelled share sheet or unsupported; fallback already handled
    } finally {
      setBusy(false);
    }
  };

  const buildTextSummary = (): string => {
    const shop = settings.shopNameUr || settings.shopNameEn || t.defaultShopName;
    const lines = [
      `*${shop}*`,
      `${isSale ? t.salesSlipTitle : t.purchaseSlipTitle} | ${record.refNo}`,
      `${t.dateLabel}: ${record.date}`,
      `${t.partyLabel}: ${record.partyName}`,
      `${t.cropVarietyLabel}: ${cropDisplay}${record.variety ? ` (${record.variety})` : ''}`,
      `${t.bagsCountLabel}: ${record.bags} | ${t.totalWeightLabel}: ${formatNumber(record.totalWeight)} KG`,
      `${t.netWeightLabel}: ${formatNumber(record.netWeightKg)} KG (${formatNumber(record.maund)} ${t.maundUnit})`,
      `${t.rateLabel}: ${formatRs(record.ratePerMaund)}`,
      `${t.grossAmountLabel}: ${formatRs(record.grossAmount)}`,
    ];
    if (record.commissionApplied) {
      lines.push(
        `${t.commissionLabel} (${record.commissionPercentUsed}%): -${formatRs(record.commissionAmount)}`
      );
    }
    if (record.advance > 0) lines.push(`${t.advanceLabel}: -${formatRs(record.advance)}`);
    if (record.taxLabour > 0) lines.push(`${taxLabel}: -${formatRs(record.taxLabour)}`);
    lines.push(`*${t.totalMizanLabel}: ${formatRs(record.totalMizan)}*`);
    return lines.join('\n');
  };

  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(buildTextSummary());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore clipboard errors
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 p-2 sm:p-6 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={isSale ? t.salesSlipTitle : t.purchaseSlipTitle}
    >
      <div className="my-2 w-full max-w-xl rounded-2xl bg-slate-100 p-3 shadow-2xl sm:p-5 dark:bg-slate-800">
        {/* Top Action Bar */}
        <div className="no-print mb-4 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={handleDownloadPng}
              className="flex min-h-[40px] items-center gap-1.5 rounded-xl bg-[#0B7D50] px-3.5 py-2 text-xs font-bold text-white transition hover:bg-[#12452D] disabled:opacity-60"
            >
              <Download className="h-4 w-4" />
              {t.downloadPng}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={handleShareWhatsapp}
              className="flex min-h-[40px] items-center gap-1.5 rounded-xl bg-[#12452D] px-3.5 py-2 text-xs font-bold text-white transition hover:bg-[#0B7D50] disabled:opacity-60"
            >
              <Share2 className="h-4 w-4" />
              {t.shareWhatsapp}
            </button>
            <button
              type="button"
              onClick={handleCopyText}
              className="flex min-h-[40px] items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-800 transition hover:bg-slate-50"
            >
              {copied ? <Check className="h-4 w-4 text-[#0B7D50]" /> : <Copy className="h-4 w-4" />}
              {copied ? t.copiedSuccess : t.copyText}
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="flex min-h-[40px] items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-800 transition hover:bg-slate-50"
            >
              <Printer className="h-4 w-4" />
              {t.print}
            </button>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t.close}
            className="flex min-h-[40px] min-w-[40px] items-center justify-center rounded-xl bg-white text-slate-700 hover:bg-slate-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Always-white Pakistani Grain Market Paper Parchi */}
        <div
          ref={slipRef}
          dir={language === 'ur' ? 'rtl' : 'ltr'}
          style={{ backgroundColor: '#FFFFFF', color: '#111827' }}
          className="mx-auto w-full rounded-xl border-2 border-[#0B7D50] bg-white p-5 shadow-md sm:p-7"
        >
          {/* Header Banner */}
          <div
            style={{ borderBottomColor: '#D9AA45' }}
            className="border-b-2 pb-4"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                {logo && (
                  <img
                    src={logo}
                    alt="Shop Logo"
                    className="h-14 w-14 rounded-lg border border-[#0B7D50]/20 bg-white object-contain p-1"
                  />
                )}
                <div>
                  {settings.shopNameUr && (
                    <h2
                      style={{ color: '#12452D' }}
                      className="font-urdu-display text-2xl font-bold leading-snug"
                    >
                      {settings.shopNameUr}
                    </h2>
                  )}
                  {settings.shopNameEn && (
                    <p
                      style={{ color: '#0B7D50' }}
                      className="text-sm font-bold tracking-wide"
                      dir="ltr"
                    >
                      {settings.shopNameEn}
                    </p>
                  )}
                  {!settings.shopNameUr && !settings.shopNameEn && (
                    <h2 style={{ color: '#12452D' }} className="text-xl font-bold">
                      {t.defaultShopName}
                    </h2>
                  )}
                  {headerTagline && (
                    <p style={{ color: '#4B5563' }} className="mt-0.5 text-xs font-medium">
                      {headerTagline}
                    </p>
                  )}
                </div>
              </div>

              <div className="shrink-0 text-end">
                <span
                  style={{ backgroundColor: '#0B7D50', color: '#FFFFFF' }}
                  className="inline-block rounded-lg px-3 py-1 text-xs font-bold"
                >
                  {isSale ? t.salesSlipTitle : t.purchaseSlipTitle}
                </span>
                <p style={{ color: '#111827' }} className="ltr-num mt-1.5 text-sm font-bold">
                  {record.refNo}
                </p>
                <p style={{ color: '#4B5563' }} className="ltr-num text-xs font-medium">
                  {record.date}
                </p>
              </div>
            </div>

            {activeOwners.length > 0 && (
              <div
                style={{ backgroundColor: '#F5F2E7', color: '#12452D' }}
                className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1 rounded-lg px-3 py-2 text-xs font-semibold"
              >
                {activeOwners.map((owner, idx) => (
                  <span key={idx} className="inline-flex items-center gap-1.5">
                    <span>{owner.name}</span>
                    {settings.showOwnerPhonesOnReceipt && owner.phone && (
                      <span className="ltr-num font-bold">{owner.phone}</span>
                    )}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Party & Commodity Info */}
          <div className="mt-4 grid grid-cols-2 gap-3 rounded-lg border border-slate-200 bg-slate-50/70 p-3 text-sm">
            <div>
              <span style={{ color: '#4B5563' }} className="block text-xs">
                {t.partyLabel}
              </span>
              <span style={{ color: '#111827' }} className="font-bold">
                {record.partyName}
              </span>
            </div>
            <div>
              <span style={{ color: '#4B5563' }} className="block text-xs">
                {t.cropVarietyLabel}
              </span>
              <span style={{ color: '#111827' }} className="font-bold">
                {cropDisplay}
                {record.variety ? ` (${record.variety})` : ''}
              </span>
            </div>
            <div>
              <span style={{ color: '#4B5563' }} className="block text-xs">
                {t.bagsCountLabel}
              </span>
              <span style={{ color: '#111827' }} className="ltr-num font-bold">
                {formatNumber(record.bags)}
              </span>
            </div>
            <div>
              <span style={{ color: '#4B5563' }} className="block text-xs">
                {t.rateLabel}
              </span>
              <span style={{ color: '#111827' }} className="ltr-num font-bold">
                {formatRs(record.ratePerMaund)}
              </span>
            </div>
          </div>

          {/* Weight Breakdown Table */}
          <div className="mt-4 overflow-hidden rounded-lg border border-slate-300">
            <table className="w-full text-sm">
              <tbody>
                <tr className="border-b border-slate-200">
                  <td style={{ color: '#374151' }} className="px-3.5 py-2 font-medium">
                    {t.totalWeightLabel}
                  </td>
                  <td className="ltr-num px-3.5 py-2 text-end font-bold">
                    {formatNumber(record.totalWeight)} KG
                  </td>
                </tr>

                {record.type === 'sale' ? (
                  <>
                    <tr className="border-b border-slate-200">
                      <td style={{ color: '#374151' }} className="px-3.5 py-2 font-medium">
                        {t.marginCutLabel}
                      </td>
                      <td className="ltr-num px-3.5 py-2 text-end font-semibold text-red-700">
                        - {formatNumber(record.marginCut)} KG
                      </td>
                    </tr>
                    <tr className="border-b border-slate-200">
                      <td style={{ color: '#374151' }} className="px-3.5 py-2 font-medium">
                        {t.bardanaLabel} ({record.bags} × {record.bardanaPerBagUsed})
                      </td>
                      <td className="ltr-num px-3.5 py-2 text-end font-semibold text-red-700">
                        - {formatNumber(record.bardanaKg)} KG
                      </td>
                    </tr>
                    <tr className="border-b border-slate-200">
                      <td style={{ color: '#374151' }} className="px-3.5 py-2 font-medium">
                        {t.kandaCutLabel}
                      </td>
                      <td className="ltr-num px-3.5 py-2 text-end font-semibold text-red-700">
                        - {formatNumber(record.kandaCut)} KG
                      </td>
                    </tr>
                  </>
                ) : (
                  <>
                    <tr className="border-b border-slate-200">
                      <td style={{ color: '#374151' }} className="px-3.5 py-2 font-medium">
                        {t.bardanaLabel} ({record.bags} × {record.bardanaPerBagUsed})
                      </td>
                      <td className="ltr-num px-3.5 py-2 text-end font-semibold text-red-700">
                        - {formatNumber(record.bardanaKg)} KG
                      </td>
                    </tr>
                    <tr className="border-b border-slate-200">
                      <td style={{ color: '#374151' }} className="px-3.5 py-2 font-medium">
                        {t.kandaCutLabel}
                      </td>
                      <td className="ltr-num px-3.5 py-2 text-end font-semibold text-red-700">
                        - {formatNumber(record.kandaCut)} KG
                      </td>
                    </tr>
                    <tr className="border-b border-slate-200">
                      <td style={{ color: '#374151' }} className="px-3.5 py-2 font-medium">
                        {t.chungiLabel}
                      </td>
                      <td className="ltr-num px-3.5 py-2 text-end font-semibold text-red-700">
                        - {formatNumber(record.chungiKg)} KG
                      </td>
                    </tr>
                  </>
                )}

                <tr style={{ backgroundColor: '#F5F2E7' }}>
                  <td style={{ color: '#12452D' }} className="px-3.5 py-2.5 font-bold">
                    {t.netWeightLabel} / {t.maundLabel}
                  </td>
                  <td style={{ color: '#12452D' }} className="px-3.5 py-2.5 text-end font-bold">
                    <span className="ltr-num">{formatNumber(record.netWeightKg)} KG</span>{' '}
                    <span>
                      (<span className="ltr-num">{formatNumber(record.maund)}</span> {t.maundUnit})
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Financial Calculation Lines */}
          <div className="mt-4 space-y-2 text-sm">
            <div className="flex items-center justify-between px-1">
              <span style={{ color: '#374151' }} className="font-medium">
                {t.grossAmountLabel}
              </span>
              <span className="ltr-num font-bold text-slate-900">
                {formatRs(record.grossAmount)}
              </span>
            </div>

            {record.commissionApplied && (
              <div className="flex items-center justify-between px-1">
                <span style={{ color: '#374151' }} className="font-medium">
                  {t.commissionLabel} ({record.commissionPercentUsed}%)
                </span>
                <span className="ltr-num font-semibold text-red-700">
                  - {formatRs(record.commissionAmount)}
                </span>
              </div>
            )}

            {record.advance > 0 && (
              <div className="flex items-center justify-between px-1">
                <span style={{ color: '#374151' }} className="font-medium">
                  {t.advanceLabel}
                </span>
                <span className="ltr-num font-semibold text-red-700">
                  - {formatRs(record.advance)}
                </span>
              </div>
            )}

            {record.taxLabour > 0 && (
              <div className="flex items-center justify-between px-1">
                <span style={{ color: '#374151' }} className="font-medium">
                  {taxLabel}
                </span>
                <span className="ltr-num font-semibold text-red-700">
                  - {formatRs(record.taxLabour)}
                </span>
              </div>
            )}

            {/* Total Mizan Highlight Box */}
            <div
              style={{
                backgroundColor: '#0B7D50',
                color: '#FFFFFF',
                borderColor: '#D9AA45',
              }}
              className="mt-3 flex items-center justify-between rounded-xl border-2 px-4 py-3"
            >
              <span className="text-base font-bold">{t.totalMizanLabel}</span>
              <span className="ltr-num text-xl font-extrabold">{formatRs(record.totalMizan)}</span>
            </div>
          </div>

          {record.notes && (
            <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700">
              <span className="font-semibold">{t.notes}: </span>
              <span>{record.notes}</span>
            </div>
          )}

          {/* Footer: Address + Signature */}
          <div
            style={{ borderTopColor: '#E5E7EB' }}
            className="mt-6 flex items-end justify-between gap-4 border-t pt-4"
          >
            <div className="max-w-[65%] text-xs text-slate-600">
              {footerAddr && <p className="font-medium leading-relaxed">{footerAddr}</p>}
            </div>

            {settings.showSignatureOnReceipt && (
              <div className="w-36 text-center">
                {signature ? (
                  <img
                    src={signature}
                    alt={t.signatureLabel}
                    className="mx-auto mb-1 h-12 w-32 object-contain"
                  />
                ) : (
                  <div className="h-10" />
                )}
                <div style={{ borderTopColor: '#111827' }} className="border-t pt-1">
                  <span style={{ color: '#374151' }} className="text-xs font-bold">
                    {t.signatureLabel}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { BookOpen, ChevronDown, ChevronUp, HelpCircle, PlayCircle } from 'lucide-react';
import { AppLanguage } from '../types/mandi';
import { Translations } from '../i18n/translations';

interface TutorialViewProps {
  language: AppLanguage;
  t: Translations;
  youtubeUrl: string;
}

export function extractYoutubeEmbedUrl(rawUrl: string): string | null {
  const trimmed = rawUrl.trim();
  if (!trimmed) return null;
  try {
    const url = new URL(trimmed);
    const host = url.hostname.replace(/^www\./, '');
    let videoId = '';
    if (host === 'youtu.be') {
      videoId = url.pathname.replace(/^\//, '').split('/')[0] || '';
    } else if (host === 'youtube.com' || host === 'm.youtube.com') {
      if (url.pathname.startsWith('/embed/')) {
        videoId = url.pathname.split('/')[2] || '';
      } else if (url.pathname.startsWith('/shorts/')) {
        videoId = url.pathname.split('/')[2] || '';
      } else {
        videoId = url.searchParams.get('v') || '';
      }
    }
    if (!videoId || !/^[a-zA-Z0-9_-]{6,20}$/.test(videoId)) return null;
    return `https://www.youtube-nocookie.com/embed/${videoId}`;
  } catch {
    return null;
  }
}

export const TutorialView: React.FC<TutorialViewProps> = ({
  language,
  t,
  youtubeUrl,
}) => {
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const embedUrl = extractYoutubeEmbedUrl(youtubeUrl);
  const isUr = language === 'ur';

  const sections = isUr
    ? [
        {
          title: '1. دکان کا ابتدائی سیٹ اپ',
          body: 'سیٹنگز یا وزرڈ میں اپنی دکان کا اردو اور انگریزی نام، مالکان کے نام و موبائل نمبر، پتہ، لوگو، دستخط، من کا وزن (مثلاً 40 کلو)، باردانہ فی بوری (مثلاً 1.25 کلو)، چونگی اور کمیشن % درج کریں۔ تمام حساب آپ کی سیٹنگز کے مطابق چلتا ہے۔',
        },
        {
          title: '2. فروخت (Sale) کا حساب اور مثال (942,506 روپے)',
          body: 'فروخت میں چونگی نہیں کٹتی۔ صافی وزن = کل وزن − مارجن کاٹ − باردانہ − کنڈہ کاٹ۔\nمثال: کل وزن 9,000 کلو، بوری 150 (باردانہ 1.25 کلو = 187.5 کلو)، مارجن کاٹ 45 کلو، ریٹ 4,300 روپے فی من، کمیشن بند:\nصافی وزن = 8,767.5 کلو (219.19 من) -> کل رقم = 942,506 روپے۔',
        },
        {
          title: '3. خرید (Purchase) کا حساب اور مثال (946,050 روپے)',
          body: 'خرید میں مارجن کاٹ نہیں کٹتا بلکہ چونگی کٹتی ہے۔ چونگی = گول((کل وزن − باردانہ − کنڈہ) / من وزن / چونگی تقسیم کار)۔\nمثال: کل وزن 9,339 کلو، بوری 172 (باردانہ 215 کلو)، چونگی 114 کلو، ریٹ 4,200 روپے فی من، کمیشن بند:\nصافی وزن = 9,010 کلو (225.25 من) -> کل رقم = 946,050 روپے۔',
        },
        {
          title: '4. روزنامچہ (بہی کھاتہ) — دو صفحاتی نقد رجسٹر اور مثال',
          body: 'کاغذی بہی کھاتہ کی طرح دائیں صفحے پر جمع / آمدن (پیسے آئے) اور بائیں صفحے پر بنام / خرچ (پیسے گئے) لکھا جاتا ہے۔\nمثال (ابتدائی بیلنس 0 روپے):\n1) رقم وصول ہوئی: آمدنی 13,00,000 روپے -> باقی 13,00,000 روپے\n2) منجی خریدی: خرچہ 1,00,000 روپے -> باقی 12,00,000 روپے\n3) تیل خریدا: خرچہ 5,000 روپے -> باقی 11,95,000 روپے\nاگلے دن خودکار پچھلا باقی 11,95,000 روپے سے شروع ہوگا۔ تفصیل ویو میں ہر لائن کے ساتھ چلتا باقی نظر آتا ہے۔',
        },
        {
          title: '5. پارٹی کھاتہ، وعدہ تاریخ اور واٹس ایپ یاددہانی',
          body: 'ہر فروخت اور خرید پر پارٹی کھاتہ خود بنتا ہے۔ پارٹی کی کل رقم، وصولی، باقی رقم اور اسٹیٹس (CLEAR / PARTIAL / PENDING / OVERDUE) دیکھیں۔ وعدہ تاریخ اور موبائل نمبر محفوظ کریں اور ایک کلک سے اردو واٹس ایپ یاددہانی بھیجیں۔',
        },
        {
          title: '6. رپورٹس (ٹوٹل ویو بمقابلہ تفصیل ویو) اور CSV',
          body: 'رپورٹس میں روزانہ، ماہانہ یا سالانہ خلاصہ (Total View) دیکھیں یا ہر اندراج کی تفصیل (Detail View) کھول کر پرچی پرنٹ / PNG ڈاؤن لوڈ کریں۔ CSV بٹن سے پورا ریکارڈ ایکسل کے لیے ڈاؤن لوڈ ہو جاتا ہے۔',
        },
        {
          title: '7. واٹس ایپ جیسا آٹو بیک اپ، لوکل اسنیپ شاٹ اور گوگل ڈرائیو',
          body: 'سیٹنگز میں Daily / Weekly / Monthly آٹو بیک اپ چلائیں۔ آخری 3 لوکل بیک اپ ڈیوائس پر خود محفوظ رہتے ہیں، اور گوگل لاگ ان ہونے پر بیک اپ "Mandi Khata Backups" فولڈر میں گوگل ڈرائیو پر بھی محفوظ ہوتا ہے۔',
        },
        {
          title: '8. آف لائن استعمال اور موبائل پر انسٹالیشن',
          body: 'پہلی بار لوڈ ہونے کے بعد پوری ایپ بغیر انٹرنیٹ کے کام کرتی ہے۔ اینڈرائیڈ یا ڈیسک ٹاپ میں "ایپ انسٹال کریں" دبا کر ہوم اسکرین پر شامل کریں۔',
        },
      ]
    : [
        {
          title: '1. Initial Shop Setup',
          body: 'Enter your shop Urdu/English names, owners, phones, address, logo, signature, maund KG, bardana/bag, chungi, and commission % in Setup or Settings. Every calculation reads your live settings.',
        },
        {
          title: '2. Sales Formula & Example (Rs 942,506)',
          body: 'Sales never apply chungi. Net Weight = Total − Margin − Bardana − Kanda. Example: 9,000 KG, 150 bags (187.5 KG bardana), 45 KG margin, Rs 4,300/maund, commission OFF -> Net 8,767.5 KG (219.19 Maund) -> Gross & Mizan Rs 942,506.',
        },
        {
          title: '3. Purchase Formula & Example (Rs 946,050)',
          body: 'Purchase never applies margin; it applies chungi = Math.round((Total − Bardana − Kanda) / MaundKG / ChungiDivisor). Example: 9,339 KG, 172 bags (215 KG bardana), 114 KG chungi, Rs 4,200/maund -> Net 9,010 KG (225.25 Maund) -> Rs 946,050.',
        },
        {
          title: '4. Roznamcha Two-Page Diary Example (Rs 11,95,000)',
          body: 'Right page holds Aamad (Cash In) and Left page holds Kharch (Cash Out). Opening Rs 0 -> In Rs 13,00,000 (Baqi Rs 13,00,000) -> Out Rs 1,00,000 (Baqi Rs 12,00,000) -> Out Rs 5,000 (Baqi Rs 11,95,000). Next day automatically carries forward Rs 11,95,000.',
        },
        {
          title: '5. Party Ledger, Wada Date & WhatsApp Reminders',
          body: 'Track Kul Raqam, Wasool/Paid, Baqi, CLEAR/PARTIAL/PENDING/OVERDUE status, Cash/Bank/JazzCash/EasyPaisa payments, and one-tap Urdu WhatsApp payment reminders.',
        },
        {
          title: '6. Reports (Total vs Detailed View) & CSV Export',
          body: 'Switch between aggregated summaries and line-by-line detailed entries across Sales, Purchase, Crops, Parties, and Roznamcha. Export anytime to CSV.',
        },
        {
          title: '7. Auto Backup, 3 Local Snapshots & Google Drive',
          body: 'Schedule Daily, Weekly, or Monthly backups. Keep 3 rolling local snapshots on-device and sync encrypted-private app JSON backups to your own "Mandi Khata Backups" Google Drive folder.',
        },
        {
          title: '8. Offline PWA Usage',
          body: 'After initial load, calculations, registers, Roznamcha, receipts, and reports work 100% offline. Install to Home Screen from the header button.',
        },
      ];

  const faqs = isUr
    ? [
        {
          q: 'کیا لاگ ان کیے بغیر ایپ کام کرتی ہے؟',
          a: 'جی ہاں! لاگ ان بالکل اختیاری ہے۔ مہمان (Guest) موڈ میں تمام کھاتہ، روزنامچہ، پرچیاں اور لوکل بیک اپ 100% آف لائن کام کرتے ہیں۔',
        },
        {
          q: 'کیا روزنامچہ کا اندراج پارٹی کھاتہ کا بقایا بدلتا ہے؟',
          a: 'نہیں۔ روزنامچہ روزانہ کی نقد ڈائری ہے۔ اگر آپ پارٹی کا نام منتخب کرتے ہیں تو وہ صرف حوالے کے لیے دکھایا جاتا ہے؛ اصل پارٹی کھاتہ بیلنس صرف فروخت، خرید اور پارٹی ادائیگی سے بدلتا ہے۔',
        },
        {
          q: 'موبائل تبدیل کرنے پر ڈیٹا کیسے محفوظ رہے گا؟',
          a: 'سیٹنگز میں جا کر "JSON بیک اپ ڈاؤن لوڈ" کریں یا گوگل لاگ ان کے ساتھ "Drive par backup karen" چلائیں، اور نئے موبائل پر Restore کریں۔',
        },
      ]
    : [
        {
          q: 'Can I use Mandi Khata without Google sign-in?',
          a: 'Yes! Sign-in is completely optional. All registers, Roznamcha, party ledger, receipts, and local backups work 100% offline in Guest mode.',
        },
        {
          q: 'Do Roznamcha entries alter Party Khata balances?',
          a: 'No. Roznamcha is an independent daily cash diary. Optional party links are shown as reference notes only without altering Sale/Purchase or Party Khata balances.',
        },
        {
          q: 'How do I transfer my data to a new phone?',
          a: 'Download a JSON backup or enable Google Drive Auto Backup in Settings, then restore it on the new phone.',
        },
      ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-extrabold text-slate-900 dark:text-slate-100">
          {t.tutorialTitle}
        </h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
          {t.tutorialSubtitle}
        </p>
      </div>

      {/* Video Section */}
      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-3 flex items-center gap-2">
          <PlayCircle className="h-5 w-5 text-[#0B7D50]" />
          <h2 className="text-base font-extrabold text-slate-900 dark:text-slate-100">
            {t.tutorialVideoTitle}
          </h2>
        </div>

        {embedUrl ? (
          <div className="aspect-video w-full overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800">
            <iframe
              src={embedUrl}
              title={t.tutorialVideoTitle}
              className="h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        ) : (
          <div className="flex min-h-[160px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-[#F5F2E7] p-6 text-center dark:border-slate-700 dark:bg-slate-800/60">
            <PlayCircle className="h-10 w-10 text-[#0B7D50] dark:text-emerald-400" />
            <p className="mt-2 text-sm font-extrabold text-[#12452D] dark:text-emerald-300">
              {t.videoComingSoon}
            </p>
          </div>
        )}
      </section>

      {/* Written Offline Guide */}
      <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {sections.map((sec, idx) => (
          <div
            key={idx}
            className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="flex items-start gap-2.5">
              <BookOpen className="mt-1 h-4 w-4 shrink-0 text-[#0B7D50] dark:text-emerald-400" />
              <div className="min-w-0">
                <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100">
                  {sec.title}
                </h3>
                <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                  {sec.body}
                </p>
              </div>
            </div>
          </div>
        ))}
      </section>

      {/* FAQ Accordion */}
      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-4 flex items-center gap-2">
          <HelpCircle className="h-5 w-5 text-[#0B7D50]" />
          <h2 className="text-base font-extrabold text-slate-900 dark:text-slate-100">
            {t.faqTitle}
          </h2>
        </div>
        <div className="space-y-2">
          {faqs.map((item, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div
                key={idx}
                className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  className="flex w-full items-center justify-between gap-3 bg-slate-50 px-4 py-3 text-start text-sm font-bold text-slate-900 dark:bg-slate-800/60 dark:text-slate-100"
                >
                  <span>{item.q}</span>
                  {isOpen ? (
                    <ChevronUp className="h-4 w-4 shrink-0" />
                  ) : (
                    <ChevronDown className="h-4 w-4 shrink-0" />
                  )}
                </button>
                {isOpen && (
                  <div className="bg-white px-4 py-3 text-sm text-slate-700 dark:bg-slate-900 dark:text-slate-300">
                    {item.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};

import React, { useEffect, useState } from 'react';
import { AppLanguage } from '../types/mandi';
import { BrandLogo } from './BrandLogo';

interface SplashScreenProps {
  language: AppLanguage;
  shopName?: string;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ language, shopName }) => {
  const [phase, setPhase] = useState<'visible' | 'fading' | 'done'>(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('autostart') === '1') return 'done';
    return 'visible';
  });

  useEffect(() => {
    if (phase === 'done') return;
    const t1 = setTimeout(() => setPhase('fading'), 950);
    const t2 = setTimeout(() => setPhase('done'), 1350);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [phase]);

  if (phase === 'done') return null;

  return (
    <div
      aria-hidden="true"
      className={`fixed inset-0 z-[80] flex flex-col items-center justify-center bg-gradient-to-br from-[#0B7D50] via-[#12452D] to-[#082B1B] text-white transition-opacity duration-400 ${
        phase === 'fading' ? 'pointer-events-none opacity-0' : 'opacity-100'
      }`}
    >
      <div className="animate-splash-pop flex flex-col items-center px-6 text-center">
        <div className="rounded-3xl bg-white/10 p-3 shadow-2xl ring-2 ring-[#F2CC70]/50">
          <BrandLogo animated size={96} className="rounded-2xl" />
        </div>
        <h1 className="font-urdu-display mt-5 text-3xl font-bold text-[#F2CC70] sm:text-4xl">
          {shopName?.trim() || (language === 'ur' ? 'منڈی کھاتہ' : 'Mandi Khata')}
        </h1>
        <p className="mt-1.5 text-sm font-semibold text-emerald-100">
          {language === 'ur'
            ? 'آڑھت و غلہ منڈی حساب کتاب'
            : 'Commission Shop Calculator & Khata'}
        </p>
      </div>
    </div>
  );
};

import { useState, useEffect } from 'react';

export type Language = 'en' | 'hi';

const translations = {
  en: {
    brandTitle: 'APEX ARCADE',
    winGo: 'Win Go 1Min',
    aviator: 'Aviator',
    balance: 'BALANCE',
    recharge: 'Recharge',
    withdraw: 'Withdraw',
    colorParity: 'Color Parity',
    green: 'Green',
    violet: 'Violet',
    red: 'Red',
    big: 'Big',
    small: 'Small',
    numberBalls: 'Number Balls (0-9)',
    periodNumber: 'Period',
    locksIn: 'Locks in',
    gameRecord: 'Game Record',
    trendChart: 'Trend Chart',
    myBets: 'My Bets',
    installTitle: 'Install Official Android App',
    installBonus: 'Get ₹50 Free Bonus',
    installBtn: 'Install APK',
    instantUpi: '⚡ 24/7 Instant UPI Settlement (GPay • PhonePe • Paytm)',
    onlineUsers: 'Online',
    provablyFair: 'Provably Fair Verified',
    vipSignals: 'VIP Signals',
    autoCashout: 'Auto Cash Out',
    wagerAmount: 'Wager Amount',
    cashOut: 'Cash Out',
    placeBet: 'Place Bet',
    flewAway: 'FLEW AWAY',
    congrats: 'CONGRATULATIONS!',
    youWon: 'You Won',
    allBets: 'All Bets',
    home: 'Home',
    activity: 'Activity',
    wallet: 'Wallet',
    account: 'Account',
    turnoverRemaining: 'Turnover Remaining',
    verifiedSandbox: 'Verified Sandbox Session',
    agencyReferral: 'Agency / Referral',
    attendance: '7-Day Attendance Streak',
    payoutReturn: 'Total Return',
    preparingTakeoff: 'PREPARING FOR TAKEOFF',
    nextRoundIn: 'NEXT ROUND IN',
    bettingLocked: 'BETTING LOCKED',
    openForBets: 'OPEN FOR BETS',
  },
  hi: {
    brandTitle: 'एपेक्स आर्केड',
    winGo: 'विन गो 1 मिनट',
    aviator: 'एविएटर',
    balance: 'शेष राशि',
    recharge: 'रिचार्ज',
    withdraw: 'निकासी',
    colorParity: 'रंग पैरिटी',
    green: 'हरा',
    violet: 'बैंगनी',
    red: 'लाल',
    big: 'बड़ा',
    small: 'छोटा',
    numberBalls: 'लॉटरी बॉल (0-9)',
    periodNumber: 'अवधि',
    locksIn: 'लॉक समय',
    gameRecord: 'खेल रिकॉर्ड',
    trendChart: 'ट्रेंड चार्ट',
    myBets: 'मेरी शर्तें',
    installTitle: 'ऑफिशियल एंड्रॉइड ऐप इंस्टॉल करें',
    installBonus: '₹50 फ्री बोनस पाएं',
    installBtn: 'एपीके इंस्टॉल करें',
    instantUpi: '⚡ 24/7 तुरंत UPI भुगतान (GPay • PhonePe • Paytm)',
    onlineUsers: 'ऑनलाइन',
    provablyFair: 'प्रूवेबली फेयर सत्यापित',
    vipSignals: 'वीआईपी सिग्नल्स',
    autoCashout: 'ऑटो कैश आउट',
    wagerAmount: 'दांव राशि',
    cashOut: 'कैश आउट',
    placeBet: 'दांव लगाएं',
    flewAway: 'उड़ गया',
    congrats: 'बधाई हो!',
    youWon: 'आप जीत गए',
    allBets: 'सभी दांव',
    home: 'होम',
    activity: 'गतिविधि',
    wallet: 'वॉलेट',
    account: 'अकाउंट',
    turnoverRemaining: 'शेष टर्नओवर',
    verifiedSandbox: 'सत्यापित सैंडबॉक्स सत्र',
    agencyReferral: 'एजेंसी / रेफरल',
    attendance: '7-दिवसीय उपस्थिति स्ट्रीक',
    payoutReturn: 'कुल रिटर्न',
    preparingTakeoff: 'उड़ान की तैयारी...',
    nextRoundIn: 'अगला राउंड',
    bettingLocked: 'दांव बंद',
    openForBets: 'दांव खुला है',
  },
};

type TranslationKey = keyof typeof translations.en;

let currentLang: Language = (typeof localStorage !== 'undefined' && (localStorage.getItem('apex_language') as Language)) || 'en';
const listeners = new Set<(lang: Language) => void>();

export const getLanguage = (): Language => currentLang;

export const setLanguage = (lang: Language): void => {
  currentLang = lang;
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('apex_language', lang);
  }
  listeners.forEach((listener) => listener(currentLang));
};

export const toggleLanguage = (): Language => {
  const next = currentLang === 'en' ? 'hi' : 'en';
  setLanguage(next);
  return next;
};

export const t = (key: TranslationKey): string => {
  return translations[currentLang]?.[key] || translations.en[key] || key;
};

export function useTranslation() {
  const [lang, setLang] = useState<Language>(currentLang);

  useEffect(() => {
    const handler = (newLang: Language) => setLang(newLang);
    listeners.add(handler);
    return () => {
      listeners.delete(handler);
    };
  }, []);

  return {
    lang,
    t: (key: TranslationKey) => translations[lang]?.[key] || translations.en[key] || key,
    toggleLang: toggleLanguage,
    setLang: setLanguage,
  };
}

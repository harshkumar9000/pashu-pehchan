import React, { createContext, useContext, useState, useEffect } from 'react';

export type LanguageCode = 'en' | 'hi' | 'bn' | 'pa' | 'ta' | 'te';

export interface LanguageOption {
  code: LanguageCode;
  label: string;
  nativeName: string;
  flag: string;
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: 'en', label: 'English', nativeName: 'English', flag: '🇬🇧' },
  { code: 'hi', label: 'Hindi', nativeName: 'हिंदी', flag: '🇮🇳' },
  { code: 'bn', label: 'Bengali', nativeName: 'বাংলা', flag: '🇮🇳' },
  { code: 'pa', label: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ', flag: '🇮🇳' },
  { code: 'ta', label: 'Tamil', nativeName: 'தமிழ்', flag: '🇮🇳' },
  { code: 'te', label: 'Telugu', nativeName: 'తెలుగు', flag: '🇮🇳' },
];

export interface Translations {
  product: string;
  features: string;
  marketplace: string;
  veterinary: string;
  aiModel: string;
  login: string;
  signup: string;
  openApp: string;
  searchPlaceholder: string;
  startFreeTrial: string;
  howItWorks: string;
  ratedBy: string;
  heroHeadline1: string;
  heroHeadline2: string;
  heroSubtitle: string;
  weatherLocation: string;
  simplifyTitle: string;
  exploreFeatures: string;
  pricingTitle: string;
  pricingSubtitle: string;
  monthly: string;
  yearly: string;
  starter: string;
  agriPro: string;
  enterprise: string;
  bestValue: string;
  choosePlan: string;
  readyTitle: string;
  readySubtitle: string;
  signUpNow: string;
  tagline: string;
}

const DICTIONARY: Record<LanguageCode, Translations> = {
  en: {
    product: 'Product',
    features: 'Features',
    marketplace: 'Marketplace',
    veterinary: 'Veterinary 24x7',
    aiModel: 'AI Model',
    login: 'Log in',
    signup: 'Sign up',
    openApp: 'Open App',
    searchPlaceholder: 'Search breeds, cattle, vets, services...',
    startFreeTrial: 'Start Free Trial',
    howItWorks: 'How it Works',
    ratedBy: 'Rated 4.9 ★ by 10,000+ Indian farmers',
    heroHeadline1: 'Pashu Ko Pehchano, Behtar Sambhalo',
    heroHeadline2: 'From Breed to Bharat Pashudhan - One Livestock Dashboard',
    heroSubtitle: 'Get a clear and comprehensive overview of your livestock operation. Make smarter decisions with PashuPehchan, the interactive AI dashboard for farmers, traders & supervisors.',
    weatherLocation: 'Anand, Gujarat',
    simplifyTitle: 'Simplify How You Manage Your Farmland & Herd.',
    exploreFeatures: 'Explore Features',
    pricingTitle: 'A Smart Investment for Your Farm.',
    pricingSubtitle: 'Choose the operational plan that fits your herd size and team capacity.',
    monthly: 'Monthly',
    yearly: 'Yearly (Save 20%)',
    starter: 'Starter Free',
    agriPro: 'Agri Pro',
    enterprise: 'Enterprise',
    bestValue: 'Best value',
    choosePlan: 'Get Started',
    readyTitle: 'Ready to Transform the Way You Farm & Manage Livestock?',
    readySubtitle: 'Leave behind slow manual methods. Join progressive livestock keepers across India using AI verification with zero hassle.',
    signUpNow: 'Sign Up Now',
    tagline: 'AI LIVESTOCK PLATFORM',
  },
  hi: {
    product: 'उत्पाद',
    features: 'विशेषताएं',
    marketplace: 'मंडी / बाज़ार',
    veterinary: 'पशु चिकित्सक 24x7',
    aiModel: 'एआई मॉडल',
    login: 'लॉग इन',
    signup: 'साइन अप',
    openApp: 'ऐप खोलें',
    searchPlaceholder: 'नस्ल, मवेशी, डॉक्टर, सेवाएं खोजें...',
    startFreeTrial: 'निःशुल्क परीक्षण शुरू करें',
    howItWorks: 'यह कैसे काम करता है',
    ratedBy: '10,000+ भारतीय किसानों द्वारा 4.9 ★ रेटेड',
    heroHeadline1: 'बुवाई से कटाई तक - एक एकीकृत कृषि डैशबोर्ड',
    heroHeadline2: 'नस्ल पहचान से भारत पशुधन तक - पशुधन डैशबोर्ड',
    heroSubtitle: 'अपने पशुधन और कृषि कार्यों का सटीक अवलोकन प्राप्त करें। पशु पहचान के साथ स्मार्ट निर्णय लें — किसानों, व्यापारियों और अधिकारियों के लिए एआई डैशबोर्ड।',
    weatherLocation: 'आनंद, गुजरात',
    simplifyTitle: 'अपने खेत और पशुधन का प्रबंधन आसान बनाएं।',
    exploreFeatures: 'विशेषताएं देखें',
    pricingTitle: 'आपके फार्म के लिए एक स्मार्ट निवेश।',
    pricingSubtitle: 'अपनी मवेशियों की संख्या और जरूरतों के अनुसार उपयुक्त योजना चुनें।',
    monthly: 'मासिक',
    yearly: 'वार्षिक (20% छूट)',
    starter: 'स्टार्टर निःशुल्क',
    agriPro: 'एग्री प्रो',
    enterprise: 'एंटरप्राइज',
    bestValue: 'सर्वश्रेष्ठ मूल्य',
    choosePlan: 'शुरू करें',
    readyTitle: 'क्या आप पशुधन प्रबंधन का तरीका बदलने के लिए तैयार हैं?',
    readySubtitle: 'पारंपरिक कागजी तरीकों को पीछे छोड़ें। भारत के हजारों प्रगतिशील किसानों के साथ एआई आधारित डिजिटल तकनीक अपनाएं।',
    signUpNow: 'अभी साइन अप करें',
    tagline: 'एआई पशुधन प्लेटफॉर्म',
  },
  bn: {
    product: 'পণ্য',
    features: 'বৈশিষ্ট্যসমূহ',
    marketplace: 'বাজার / মার্কেটপ্লেস',
    veterinary: 'পশু চিকিৎসক ২৪x৭',
    aiModel: 'এআই মডেল',
    login: 'লগ ইন',
    signup: 'সাইন আপ',
    openApp: 'অ্যাপ খুলুন',
    searchPlaceholder: 'জাত, গবাদি পশু, ডাক্তার, সেবা খুঁজুন...',
    startFreeTrial: 'বিনামূল্যে ট্রায়াল শুরু করুন',
    howItWorks: 'কীভাবে কাজ করে',
    ratedBy: '১০,০০০+ ভারতীয় কৃষকদের দ্বারা ৪.৯ ★ রেটপ্রাপ্ত',
    heroHeadline1: 'রোপণ থেকে ফসল কাটা - একটি সমন্বিত ড্যাশবোর্ড',
    heroHeadline2: 'জাত থেকে ভারত পশুধান - এক পশুসম্পদ ড্যাশবোর্ড',
    heroSubtitle: 'আপনার গবাদি পশুর সম্পূর্ণ তথ্য সহজে পর্যবেক্ষণ করুন। পশু পরিচর্যায় নিন সঠিক সিদ্ধান্ত — কৃষক ও খামারিদের এআই ড্যাশবোর্ড।',
    weatherLocation: 'আনন্দ, গুজরাত',
    simplifyTitle: 'আপনার খামার ও গবাদি পশু পরিচালনা সহজ করুন।',
    exploreFeatures: 'বৈশিষ্ট্য দেখুন',
    pricingTitle: 'আপনার খামারের জন্য একটি বুদ্ধিমান বিনিয়োগ।',
    pricingSubtitle: 'আপনার খামারের আকার অনুযায়ী সেরা প্ল্যান বেছে নিন।',
    monthly: 'মাসিক',
    yearly: 'বার্ষিক (২০% সাশ্রয়)',
    starter: 'স্টার্টার ফ্রি',
    agriPro: 'এগ্রি প্রো',
    enterprise: 'এন্টারপ্রাইজ',
    bestValue: 'সেরা মূল্য',
    choosePlan: 'শুরু করুন',
    readyTitle: 'আপনার খামার রূপান্তরের জন্য প্রস্তুত?',
    readySubtitle: 'পুরোনো পদ্ধতি বাদ দিয়ে ভারতের হাজারো প্রগতিশীল খামারিদের সঙ্গে এআই প্রযুক্তি ব্যবহার শুরু করুন।',
    signUpNow: 'এখনই সাইন আপ করুন',
    tagline: 'এআই পশুসম্পদ প্ল্যাটফর্ম',
  },
  pa: {
    product: 'ਉਤਪਾਦ',
    features: 'ਵਿਸ਼ੇਸ਼ਤਾਵਾਂ',
    marketplace: 'ਮੰਡੀ / ਬਾਜ਼ਾਰ',
    veterinary: 'ਡੰਗਰਾਂ ਦੇ ਡਾਕਟਰ 24x7',
    aiModel: 'ਏਆਈ ਮਾਡਲ',
    login: 'ਲਾਗ ਇਨ',
    signup: 'ਸਾਈਨ ਅੱਪ',
    openApp: 'ਐਪ ਖੋਲ੍ਹੋ',
    searchPlaceholder: 'ਨਸਲ, ਡੰਗਰ, ਡਾਕਟਰ, ਸੇਵਾਵਾਂ ਖੋਜੋ...',
    startFreeTrial: 'ਮੁਫ਼ਤ ਟ੍ਰਾਇਲ ਸ਼ੁਰੂ ਕਰੋ',
    howItWorks: 'ਇਹ ਕਿਵੇਂ ਕੰਮ ਕਰਦਾ ਹੈ',
    ratedBy: '10,000+ ਭਾਰਤੀ ਕਿਸਾਨਾਂ ਵੱਲੋਂ 4.9 ★ ਰੇਟਿੰਗ',
    heroHeadline1: 'ਬਿਜਾਈ ਤੋਂ ਵਾਢੀ ਤੱਕ - ਇੱਕ ਕਿਸਾਨੀ ਡੈਸ਼ਬੋਰਡ',
    heroHeadline2: 'ਨਸਲ ਤੋਂ ਭਾਰਤ ਪਸ਼ੂਧਨ ਤੱਕ - ਪਸ਼ੂ ਡੈਸ਼ਬੋਰਡ',
    heroSubtitle: 'ਆਪਣੇ ਡੰਗਰਾਂ ਅਤੇ ਖੇਤਾਂ ਦਾ ਪੂਰਾ ਹਿਸਾਬ-ਕਿਤਾਬ ਰੱਖੋ। ਪਸ਼ੂ ਪਹਿਚਾਣ ਏਆਈ ਡੈਸ਼ਬੋਰਡ ਨਾਲ ਬਿਹਤਰ ਫੈਸਲੇ ਲਵੋ।',
    weatherLocation: 'ਆਨੰਦ, ਗੁਜਰਾਤ',
    simplifyTitle: 'ਆਪਣੇ ਫਾਰਮ ਅਤੇ ਡੰਗਰਾਂ ਦੀ ਸਾਂਭ-ਸੰਭਾਲ ਸੌਖੀ ਬਣਾਓ।',
    exploreFeatures: 'ਖਾਸ ਫੀਚਰ ਵੇਖੋ',
    pricingTitle: 'ਤੁਹਾਡੇ ਫਾਰਮ ਲਈ ਇੱਕ ਵਧੀਆ ਨਿਵੇਸ਼।',
    pricingSubtitle: 'ਆਪਣੇ ਡੰਗਰਾਂ ਦੀ ਗਿਣਤੀ ਮੁਤਾਬਕ ਸਹੀ ਪਲਾਨ ਚੁਣੋ।',
    monthly: 'ਮਹੀਨਾਵਾਰ',
    yearly: 'ਸਾਲਾਨਾ (20% ਬੱਚਤ)',
    starter: 'ਸਟਾਰਟਰ ਮੁਫ਼ਤ',
    agriPro: 'ਐਗਰੀ ਪ੍ਰੋ',
    enterprise: 'ਐਂਟਰਪ੍ਰਾਈਜ਼',
    bestValue: 'ਸਭ ਤੋਂ ਵਧੀਆ',
    choosePlan: 'ਸ਼ੁਰੂ ਕਰੋ',
    readyTitle: 'ਕੀ ਤੁਸੀਂ ਡੰਗਰਾਂ ਦੀ ਸਾਂਭ ਦਾ ਤਰੀਕਾ ਬਦਲਣ ਲਈ ਤਿਆਰ ਹੋ?',
    readySubtitle: 'ਪੁਰਾਣੇ ਤਰੀਕੇ ਛੱਡੋ ਅਤੇ ਪੂਰੇ ਭਾਰਤ ਦੇ ਕਿਸਾਨਾਂ ਵਾਂਗ ਏਆਈ ਤਕਨੀਕ ਨਾਲ ਅੱਗੇ ਵਧੋ।',
    signUpNow: 'ਹੁਣੇ ਸਾਈਨ ਅੱਪ ਕਰੋ',
    tagline: 'ਏਆਈ ਪਸ਼ੂਧਨ ਪਲੇਟਫਾਰਮ',
  },
  ta: {
    product: 'தயாரிப்பு',
    features: 'அம்சங்கள்',
    marketplace: 'சந்தை',
    veterinary: 'கால்நடை மருத்துவம் 24x7',
    aiModel: 'AI மாதிரி',
    login: 'உள்நுழைய',
    signup: 'பதிவு செய்ய',
    openApp: 'செயலியைத் திற',
    searchPlaceholder: 'இனம், கால்நடைகள், மருத்துவர் தேட...',
    startFreeTrial: 'இலவச சோதனையைத் தொடங்கு',
    howItWorks: 'இது எவ்வாறு செயல்படுகிறது',
    ratedBy: '10,000+ இந்திய விவசாயிகளால் 4.9 ★ மதிப்பீடு',
    heroHeadline1: 'விதைப்பு முதல் அறுவடை வரை - ஒரு விவசாய டாஷ்போர்டு',
    heroHeadline2: 'இன அடையாளம் முதல் பாரத் பசுதன் வரை - கால்நடை டாஷ்போர்டு',
    heroSubtitle: 'உங்கள் கால்நடை பராமரிப்பின் முழு விவரங்களையும் எளிதாகக் கண்காணிக்கவும். பசுபெஹ்சான் AI மூலம் சிறந்த முடிவுகளை எடுங்கள்.',
    weatherLocation: 'ஆனந்த், குஜராத்',
    simplifyTitle: 'உங்கள் பண்ணை மற்றும் கால்நடைகளை எளிதாக நிர்வகிக்கவும்.',
    exploreFeatures: 'அம்சங்களை ஆராயுங்கள்',
    pricingTitle: 'உங்கள் பண்ணைக்கான சிறந்த முதலீடு.',
    pricingSubtitle: 'உங்கள் கால்நடைகளின் எண்ணிக்கைக்கு ஏற்ப சிறந்த திட்டத்தைத் தேர்ந்தெடுக்கவும்.',
    monthly: 'மாதாந்திர',
    yearly: 'ஆண்டு (20% சேமிப்பு)',
    starter: 'தொடக்க நிலை இலவசம்',
    agriPro: 'அக்ரி ப்ரோ',
    enterprise: 'நிறுவனம்',
    bestValue: 'சிறந்த மதிப்பு',
    choosePlan: 'தொடங்கவும்',
    readyTitle: 'கால்நடை நிர்வாகத்தை நவீனப்படுத்த தயாரா?',
    readySubtitle: 'பழைய முறைகளை விட்டுவிட்டு இந்திய விவசாயிகளுடன் இணைந்து நவீன AI தொழில்நுட்பத்தைப் பயன்படுத்துங்கள்.',
    signUpNow: 'இப்போதே பதிவு செய்யவும்',
    tagline: 'AI கால்நடை தளம்',
  },
  te: {
    product: 'ఉత్పత్తి',
    features: 'ఫీచర్లు',
    marketplace: 'మార్కెట్ ప్లేస్',
    veterinary: 'పశువైద్యం 24x7',
    aiModel: 'AI మోడల్',
    login: 'లాగిన్',
    signup: 'సైన్ అప్',
    openApp: 'యాప్ తెరవండి',
    searchPlaceholder: 'జాతి, పశువులు, డాక్టర్, సేవలు శోధించండి...',
    startFreeTrial: 'ఉచిత ట్రయల్ ప్రారంభించండి',
    howItWorks: 'ఇది ఎలా పనిచేస్తుంది',
    ratedBy: '10,000+ భారతీయ రైతులచే 4.9 ★ రేటింగ్',
    heroHeadline1: 'విత్తనం నుండి కోత వరకు - ఒకే వ్యవసాయ డాష్‌బోర్డ్',
    heroHeadline2: 'జాతి గుర్తింపు నుండి భారత్ పశుధన్ వరకు - పశుసంపద డాష్‌బోర్డ్',
    heroSubtitle: 'మీ పశువుల ఆరోగ్యం మరియు వివరాలను సులభంగా నిర్వహించండి. పశుపెహ్‌చాన్ AI తో సరైన నిర్ణయాలు తీసుకోండి.',
    weatherLocation: 'ఆనంద్, గుజరాత్',
    simplifyTitle: 'మీ వ్యవసాయ క్షేత్రం మరియు పశువుల నిర్వహణను సులభతరం చేయండి.',
    exploreFeatures: 'ఫీచర్లను అన్వేషించండి',
    pricingTitle: 'మీ పాడి క్షేత్రానికి ఒక తెలివైన పెట్టుబడి.',
    pricingSubtitle: 'మీ పశువుల సంఖ్యకు సరిపోయే ఉత్తమ ప్లాన్‌ను ఎంచుకోండి.',
    monthly: 'నెలవారీ',
    yearly: 'వార్షిక (20% ఆదా)',
    starter: 'స్టార్టర్ ఉచితం',
    agriPro: 'అగ్రి ప్రో',
    enterprise: 'ఎంటర్‌ప్రైజ్',
    bestValue: 'అత్యుత్తమ విలువ',
    choosePlan: 'ప్రారంభించండి',
    readyTitle: 'మీ పాడి పరిశ్రమను డిజిటలైజ్ చేయడానికి సిద్ధమా?',
    readySubtitle: 'పాత పద్ధతులను వీడి వేలాది మంది భారతీయ రైతులతో కలిసి AI సాంకేతికతతో ముందడుగు వేయండి.',
    signUpNow: 'ఇప్పుడే సైన్ అప్ చేయండి',
    tagline: 'AI పశుసంపద ప్లాట్‌ఫారమ్',
  },
};

interface LanguageContextType {
  language: LanguageCode;
  languages: LanguageOption[];
  currentLanguage: LanguageOption;
  setLanguage: (code: LanguageCode) => void;
  t: (key: keyof Translations) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<LanguageCode>('en');

  // Trigger Google Translate engine on the whole DOM
  const triggerGoogleTranslate = (code: LanguageCode) => {
    if (typeof window === 'undefined') return;

    try {
      // 1. Set Google Translate cookies
      const domain = window.location.hostname;
      const cookieValue = `/en/${code}`;
      document.cookie = `googtrans=${cookieValue}; path=/;`;
      if (domain) {
        document.cookie = `googtrans=${cookieValue}; domain=.${domain}; path=/;`;
      }

      // 2. Dispatch change to Google Translate select dropdown if loaded
      const selectEl = document.querySelector('.goog-te-combo') as HTMLSelectElement;
      if (selectEl) {
        selectEl.value = code;
        selectEl.dispatchEvent(new Event('change'));
      }

      // 3. Update HTML lang attribute
      document.documentElement.lang = code;
    } catch (err) {
      console.warn('[Translate] Error triggering translation:', err);
    }
  };

  useEffect(() => {
    // Read saved language preference
    try {
      const saved = localStorage.getItem('vetra_preferred_language') as LanguageCode;
      if (saved && SUPPORTED_LANGUAGES.some((l) => l.code === saved)) {
        setLanguageState(saved);
        triggerGoogleTranslate(saved);
      }
    } catch {}
  }, []);

  const setLanguage = (code: LanguageCode) => {
    setLanguageState(code);
    try {
      localStorage.setItem('vetra_preferred_language', code);
    } catch {}
    triggerGoogleTranslate(code);
  };

  const t = (key: keyof Translations): string => {
    return DICTIONARY[language]?.[key] || DICTIONARY.en[key] || '';
  };

  const currentLanguage =
    SUPPORTED_LANGUAGES.find((l) => l.code === language) || SUPPORTED_LANGUAGES[0];

  return (
    <LanguageContext.Provider
      value={{
        language,
        languages: SUPPORTED_LANGUAGES,
        currentLanguage,
        setLanguage,
        t,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    // Fallback if rendered outside provider
    return {
      language: 'en',
      languages: SUPPORTED_LANGUAGES,
      currentLanguage: SUPPORTED_LANGUAGES[0],
      setLanguage: () => {},
      t: (key: keyof Translations) => DICTIONARY.en[key] || '',
    };
  }
  return context;
};

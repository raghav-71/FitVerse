import { create } from 'zustand';
import { translations, SupportedLanguage, TranslationKey, LANGUAGE_OPTIONS } from '../services/i18n/translations';

export const NUMERAL_MAPS: Record<SupportedLanguage, string[]> = {
  en: ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'],
  hi: ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'],
  mr: ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'],
  gu: ['૦', '૧', '૨', '૩', '૪', '૫', '૬', '૭', '૮', '૯'],
  bn: ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'],
  te: ['౦', '౧', '౨', '౩', '౪', '౫', '౬', '౭', '౮', '౯'],
  kn: ['೦', '೧', '೨', '೩', '೪', '೫', '೬', '೭', '೮', '೯'],
  ta: ['௦', '௧', '௨', '௩', '௪', '௫', '௬', '௭', '௮', '௯'],
  ml: ['൦', '൧', '൨', '൩', '൪', '൫', '൬', '൭', '൮', '൯'],
  pa: ['੦', '੧', '੨', '੩', '੪', '੫', '੬', '੭', '੮', '੯'],
  or: ['୦', '୧', '୨', '୩', '୪', '୫', '୬', '୭', '୮', '୯'],
};

export const formatDigits = (
  input: string | number | undefined | null,
  lang: SupportedLanguage
): string => {
  if (input === undefined || input === null) return '';
  const str = String(input);
  const map = NUMERAL_MAPS[lang];
  if (!map || lang === 'en') return str;
  return str.replace(/[0-9]/g, (d) => map[parseInt(d, 10)]);
};

interface LanguageState {
  currentLanguage: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  t: (key: TranslationKey) => string;
  num: (input: string | number | undefined | null) => string;
}

export const useLanguageStore = create<LanguageState>((set, get) => ({
  currentLanguage: 'en', // English by default per user request
  setLanguage: (lang: SupportedLanguage) => set({ currentLanguage: lang }),
  t: (key: TranslationKey) => {
    const lang = get().currentLanguage;
    const langDict = translations[lang] || translations.en;
    const raw = langDict[key] || translations.en[key] || (key as string);
    return formatDigits(raw, lang);
  },
  num: (input: string | number | undefined | null) => {
    return formatDigits(input, get().currentLanguage);
  },
}));

/**
 * Convenient React hook for consuming translations and switching languages
 */
export const useTranslation = () => {
  const currentLanguage = useLanguageStore((state) => state.currentLanguage);
  const setLanguage = useLanguageStore((state) => state.setLanguage);

  const t = (key: TranslationKey): string => {
    const langDict = translations[currentLanguage] || translations.en;
    const raw = langDict[key] || translations.en[key] || (key as string);
    return formatDigits(raw, currentLanguage);
  };

  const num = (input: string | number | undefined | null): string => {
    return formatDigits(input, currentLanguage);
  };

  const currentOption =
    LANGUAGE_OPTIONS.find((opt) => opt.code === currentLanguage) || LANGUAGE_OPTIONS[0];

  return {
    t,
    num,
    currentLanguage,
    setLanguage,
    currentOption,
    languages: LANGUAGE_OPTIONS,
  };
};

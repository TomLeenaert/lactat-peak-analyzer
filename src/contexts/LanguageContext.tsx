import { createContext, useContext, useState, ReactNode } from 'react';

type Lang = 'nl' | 'en';

const translations = {
  nl: {
    // Auth
    'auth.title': 'Lactaat Test',
    'auth.loginDesc': 'Log in om verder te gaan',
    'auth.registerDesc': 'Maak een account aan',
    'auth.email': 'Email',
    'auth.password': 'Wachtwoord',
    'auth.fullName': 'Volledige naam',
    'auth.login': 'Inloggen',
    'auth.register': 'Registreren',
    'auth.submitting': 'Bezig...',
    'auth.forgotPassword': 'Wachtwoord vergeten?',
    'auth.noAccount': 'Nog geen account?',
    'auth.hasAccount': 'Al een account?',
    'auth.registerLink': 'Registreer',
    'auth.loginLink': 'Log in',
    'auth.accountCreated': 'Account aangemaakt',
    'auth.checkEmail': 'Controleer je email om je account te bevestigen.',
    'auth.error': 'Fout',
    'auth.fillEmail': 'Vul je emailadres in',
    'auth.emailSent': 'Email verstuurd',
    'auth.checkInbox': 'Controleer je inbox voor de reset link.',
    'auth.demoLogin': 'Demo: Inloggen als Tom',
    'auth.publicDemo': 'Bekijk publieke demo',
    // Landing
    'landing.badge': 'Lactaat Analyse Platform',
    'landing.headline1': 'Professionele lactaat',
    'landing.headline2': 'drempelanalyse',
    'landing.sub': 'Wetenschappelijk onderbouwde tools voor coaches en sporters. Bepaal LT1 en LT2 nauwkeurig en optimaliseer trainingsintensiteit.',
    'landing.cta': 'Aan de slag',
    'landing.login': 'Inloggen',
    'landing.f1title': 'Meerdere methoden',
    'landing.f1desc': 'Dmax, Modified Dmax, LTP en vaste drempel — alle erkende methoden in één platform.',
    'landing.f2title': 'Directe visualisatie',
    'landing.f2desc': 'Lactaatcurve, drempelpunten en trainingszones live in beeld zodra data is ingevoerd.',
    'landing.f3title': 'Atleetbeheer',
    'landing.f3desc': 'Sla testresultaten op per atleet en volg progressie over meerdere testsessies.',
    'landing.f4title': 'Exporteerbaar',
    'landing.f4desc': 'Resultaten en zones overzichtelijk gepresenteerd, klaar voor rapportage aan sporter of staf.',
    'landing.footer': '© 2026 Lactaat Test. Alle rechten voorbehouden.',
  },
  en: {
    // Auth
    'auth.title': 'Lactate Test',
    'auth.loginDesc': 'Sign in to continue',
    'auth.registerDesc': 'Create an account',
    'auth.email': 'Email',
    'auth.password': 'Password',
    'auth.fullName': 'Full name',
    'auth.login': 'Sign in',
    'auth.register': 'Register',
    'auth.submitting': 'Loading...',
    'auth.forgotPassword': 'Forgot password?',
    'auth.noAccount': 'No account yet?',
    'auth.hasAccount': 'Already have an account?',
    'auth.registerLink': 'Register',
    'auth.loginLink': 'Sign in',
    'auth.accountCreated': 'Account created',
    'auth.checkEmail': 'Check your email to confirm your account.',
    'auth.error': 'Error',
    'auth.fillEmail': 'Enter your email address',
    'auth.emailSent': 'Email sent',
    'auth.checkInbox': 'Check your inbox for the reset link.',
    'auth.demoLogin': 'Demo: Sign in as Tom',
    'auth.publicDemo': 'View public demo',
    // Landing
    'landing.badge': 'Lactate Analysis Platform',
    'landing.headline1': 'Professional lactate',
    'landing.headline2': 'threshold analysis',
    'landing.sub': 'Science-backed tools for coaches and athletes. Accurately determine LT1 and LT2 and optimise training intensity.',
    'landing.cta': 'Get started',
    'landing.login': 'Sign in',
    'landing.f1title': 'Multiple methods',
    'landing.f1desc': 'Dmax, Modified Dmax, LTP and fixed threshold — all recognised methods in one platform.',
    'landing.f2title': 'Instant visualisation',
    'landing.f2desc': 'Lactate curve, threshold points and training zones rendered live as data is entered.',
    'landing.f3title': 'Athlete management',
    'landing.f3desc': 'Store test results per athlete and track progression across multiple test sessions.',
    'landing.f4title': 'Exportable',
    'landing.f4desc': 'Results and zones clearly presented, ready for reporting to the athlete or coaching staff.',
    'landing.footer': '© 2026 Lactate Test. All rights reserved.',
  },
} as const;

type TranslationKey = keyof typeof translations.nl;

interface LanguageContextType {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: TranslationKey) => string;
}

const LanguageContext = createContext<LanguageContextType | null>(null);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [lang, setLangState] = useState<Lang>(() => {
    return (localStorage.getItem('lang') as Lang) || 'nl';
  });

  const setLang = (l: Lang) => {
    localStorage.setItem('lang', l);
    setLangState(l);
  };

  const t = (key: TranslationKey): string => translations[lang][key];

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLang = () => {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLang must be used within LanguageProvider');
  return ctx;
};

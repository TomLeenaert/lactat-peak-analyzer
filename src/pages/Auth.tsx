import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useLang } from '@/contexts/LanguageContext';

const getErrorMessage = (error: unknown) => error instanceof Error ? error.message : 'Er is een onverwachte fout opgetreden.';

const COPY = {
  nl: {
    tagline: 'Lactaatanalyse voor coaches die resultaten willen.',
    sub: 'Geen duur abonnement. Betaal enkel wat je gebruikt.',
    bullets: [
      { icon: '⚡', text: 'Resultaten in minder dan 10 seconden' },
      { icon: '🎯', text: '3 drempelmethoden — OBLA, Dmax, Modified Dmax' },
      { icon: '📊', text: '5 trainingszones automatisch berekend' },
      { icon: '💶', text: '€9.95 per rapport — geen abonnement' },
      { icon: '🔬', text: 'Dezelfde nauwkeurigheid als een labtest' },
    ],
    badge: 'Pay per use',
    badgeSub: 'Geen maandelijkse kosten',
    login: 'Inloggen',
    register: 'Account aanmaken',
    loginDesc: 'Welkom terug',
    registerDesc: 'Start gratis',
    email: 'E-mailadres',
    password: 'Wachtwoord',
    fullName: 'Volledige naam',
    submit: 'Inloggen',
    submitRegister: 'Account aanmaken',
    submitting: 'Bezig...',
    forgot: 'Wachtwoord vergeten?',
    noAccount: 'Nog geen account?',
    hasAccount: 'Al een account?',
    registerLink: 'Registreer gratis',
    loginLink: 'Log in',
    accountCreated: 'Account aangemaakt',
    checkEmail: 'Controleer je e-mail om je account te bevestigen.',
    error: 'Fout',
    fillEmail: 'Vul je e-mailadres in',
    emailSent: 'E-mail verstuurd',
    checkInbox: 'Controleer je inbox voor de reset link.',
    switchLang: 'EN',
  },
  en: {
    tagline: 'Lactate analysis for coaches who want results.',
    sub: 'No expensive subscription. Pay only for what you use.',
    bullets: [
      { icon: '⚡', text: 'Results in under 10 seconds' },
      { icon: '🎯', text: '3 threshold methods — OBLA, Dmax, Modified Dmax' },
      { icon: '📊', text: '5 training zones calculated automatically' },
      { icon: '💶', text: '€9.95 per report — no subscription' },
      { icon: '🔬', text: 'Same accuracy as a lab test' },
    ],
    badge: 'Pay per use',
    badgeSub: 'No monthly costs',
    login: 'Sign in',
    register: 'Create account',
    loginDesc: 'Welcome back',
    registerDesc: 'Start for free',
    email: 'Email address',
    password: 'Password',
    fullName: 'Full name',
    submit: 'Sign in',
    submitRegister: 'Create account',
    submitting: 'Loading...',
    forgot: 'Forgot password?',
    noAccount: 'No account yet?',
    hasAccount: 'Already have an account?',
    registerLink: 'Register for free',
    loginLink: 'Sign in',
    accountCreated: 'Account created',
    checkEmail: 'Check your email to confirm your account.',
    error: 'Error',
    fillEmail: 'Enter your email address',
    emailSent: 'Email sent',
    checkInbox: 'Check your inbox for the reset link.',
    switchLang: 'NL',
  },
};

const Auth = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { lang, setLang } = useLang();
  const c = COPY[lang];

  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) navigate('/dashboard', { replace: true });
  }, [user, loading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate('/dashboard');
      } else {
        const { error } = await supabase.auth.signUp({
          email, password,
          options: { data: { full_name: fullName }, emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        toast({ title: c.accountCreated, description: c.checkEmail });
      }
    } catch (err: unknown) {
      toast({ title: c.error, description: getErrorMessage(err), variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) { toast({ title: c.fillEmail, variant: 'destructive' }); return; }
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) {
      toast({ title: c.error, description: error.message, variant: 'destructive' });
    } else {
      toast({ title: c.emailSent, description: c.checkInbox });
    }
  };

  if (loading) return null;

  return (
    <div style={{ minHeight: '100vh', background: '#0c0d11', display: 'flex', flexDirection: 'column', fontFamily: 'Inter, system-ui, sans-serif' }}>

      {/* Nav */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 10,
        background: 'rgba(12,13,17,0.92)', backdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 32px', height: '58px', flexShrink: 0,
      }}>
        <a href="/" style={{ color: '#fff', textDecoration: 'none', fontSize: '17px', fontWeight: 700, letterSpacing: '-0.3px' }}>
          Lac<span style={{ color: '#6644ff' }}>.</span>Test
        </a>
        <button onClick={() => setLang(lang === 'nl' ? 'en' : 'nl')} style={{
          fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.4)',
          background: 'none', border: '1px solid rgba(255,255,255,0.13)',
          borderRadius: '6px', padding: '5px 11px', cursor: 'pointer',
        }}>
          {c.switchLang}
        </button>
      </nav>

      {/* Split layout */}
      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>

        {/* LEFT — hero panel */}
        <div style={{
          flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center',
          padding: '60px 64px', background: 'linear-gradient(135deg, #0c0d11 0%, #111320 100%)',
          borderRight: '1px solid rgba(255,255,255,0.06)',
          position: 'relative', overflow: 'hidden',
        }}>
          {/* Background glow */}
          <div style={{
            position: 'absolute', top: '-80px', left: '-80px',
            width: '400px', height: '400px', borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(102,68,255,0.12) 0%, transparent 70%)',
            pointerEvents: 'none',
          }} />
          <div style={{
            position: 'absolute', bottom: '-60px', right: '-60px',
            width: '300px', height: '300px', borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(0,201,167,0.08) 0%, transparent 70%)',
            pointerEvents: 'none',
          }} />

          {/* Badge */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            background: 'rgba(102,68,255,0.15)', border: '1px solid rgba(102,68,255,0.3)',
            borderRadius: '20px', padding: '6px 14px', marginBottom: '28px',
            width: 'fit-content',
          }}>
            <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#6644ff', boxShadow: '0 0 8px #6644ff' }} />
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#a090ff', letterSpacing: '0.5px' }}>{c.badge}</span>
            <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)' }}>— {c.badgeSub}</span>
          </div>

          {/* Headline */}
          <h1 style={{
            fontSize: 'clamp(1.8rem, 3vw, 2.6rem)', fontWeight: 800, color: '#fff',
            lineHeight: 1.15, letterSpacing: '-0.5px', marginBottom: '16px',
            maxWidth: '480px',
          }}>
            {c.tagline}
          </h1>
          <p style={{ fontSize: '16px', color: 'rgba(255,255,255,0.5)', marginBottom: '40px', maxWidth: '420px', lineHeight: 1.6 }}>
            {c.sub}
          </p>

          {/* Bullets */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {c.bullets.map((b, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{
                  width: '36px', height: '36px', borderRadius: '10px', flexShrink: 0,
                  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px',
                }}>
                  {b.icon}
                </div>
                <span style={{ fontSize: '14px', color: 'rgba(255,255,255,0.75)', fontWeight: 500 }}>{b.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT — form panel */}
        <div style={{
          width: '460px', flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '48px 48px',
          background: '#0e0f15',
        }}>
          <div style={{ width: '100%', maxWidth: '360px' }}>

            {/* Tab switch */}
            <div style={{
              display: 'flex', background: 'rgba(255,255,255,0.04)',
              borderRadius: '10px', padding: '4px', marginBottom: '32px',
              border: '1px solid rgba(255,255,255,0.07)',
            }}>
              {[{ key: true, label: c.login }, { key: false, label: c.register }].map(({ key, label }) => (
                <button key={String(key)} onClick={() => setIsLogin(key)} style={{
                  flex: 1, padding: '9px', fontSize: '13px', fontWeight: 600,
                  borderRadius: '7px', border: 'none', cursor: 'pointer',
                  background: isLogin === key ? '#6644ff' : 'transparent',
                  color: isLogin === key ? '#fff' : 'rgba(255,255,255,0.4)',
                  transition: 'all .2s',
                }}>
                  {label}
                </button>
              ))}
            </div>

            {/* Title */}
            <div style={{ marginBottom: '24px' }}>
              <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#fff', marginBottom: '4px' }}>
                {isLogin ? c.loginDesc : c.registerDesc}
              </h2>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {!isLogin && (
                <Input
                  placeholder={c.fullName}
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  required
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}
                />
              )}
              <Input
                type="email"
                placeholder={c.email}
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}
              />
              <Input
                type="password"
                placeholder={c.password}
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                minLength={6}
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}
              />
              <Button
                type="submit"
                disabled={submitting}
                style={{
                  background: 'linear-gradient(135deg, #6644ff, #8866ff)',
                  border: 'none', color: '#fff', fontWeight: 700,
                  padding: '12px', fontSize: '15px', borderRadius: '9px',
                  cursor: submitting ? 'not-allowed' : 'pointer',
                  marginTop: '4px',
                }}
              >
                {submitting ? c.submitting : isLogin ? c.submit : c.submitRegister}
              </Button>
            </form>

            {/* Footer links */}
            <div style={{ marginTop: '20px', textAlign: 'center' }}>
              {isLogin && (
                <button onClick={handleForgotPassword} style={{
                  fontSize: '13px', color: 'rgba(255,255,255,0.35)',
                  background: 'none', border: 'none', cursor: 'pointer',
                  textDecoration: 'underline', display: 'block', margin: '0 auto 10px',
                }}>
                  {c.forgot}
                </button>
              )}
              <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.35)' }}>
                {isLogin ? c.noAccount : c.hasAccount}{' '}
                <button onClick={() => setIsLogin(!isLogin)} style={{
                  color: '#a090ff', background: 'none', border: 'none',
                  cursor: 'pointer', fontSize: '13px', textDecoration: 'underline',
                }}>
                  {isLogin ? c.registerLink : c.loginLink}
                </button>
              </p>
            </div>

            {/* Price reminder */}
            <div style={{
              marginTop: '32px', padding: '14px 16px',
              background: 'rgba(0,201,167,0.07)', border: '1px solid rgba(0,201,167,0.2)',
              borderRadius: '10px', textAlign: 'center',
            }}>
              <p style={{ fontSize: '12px', color: 'rgba(0,201,167,0.9)', fontWeight: 600, marginBottom: '2px' }}>
                {lang === 'nl' ? '💡 Gratis analyses — betaal enkel bij export' : '💡 Free analysis — pay only when exporting'}
              </p>
              <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)' }}>
                {lang === 'nl' ? '€9.95 per PDF-rapport · geen abonnement' : '€9.95 per PDF report · no subscription'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;

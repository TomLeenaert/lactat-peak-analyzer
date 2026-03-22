import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import logoSrc from '@/assets/screen.png';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useLang } from '@/contexts/LanguageContext';

const getErrorMessage = (error: unknown) => error instanceof Error ? error.message : 'Er is een onverwachte fout opgetreden.';

const Auth = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { lang, setLang } = useLang();

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
        toast({ title: lang === 'nl' ? 'Account aangemaakt' : 'Account created', description: lang === 'nl' ? 'Controleer je e-mail.' : 'Check your email.' });
      }
    } catch (err: unknown) {
      toast({ title: 'Error', description: getErrorMessage(err), variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) { toast({ title: lang === 'nl' ? 'Vul je e-mailadres in' : 'Enter your email', variant: 'destructive' }); return; }
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` });
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: lang === 'nl' ? 'E-mail verstuurd' : 'Email sent', description: lang === 'nl' ? 'Controleer je inbox.' : 'Check your inbox.' });
    }
  };

  if (loading) return null;

  const inputStyle: React.CSSProperties = {
    width: '100%',
    height: '56px',
    background: '#131313',
    border: '1px solid #262626',
    borderRadius: '2px',
    color: '#fff',
    fontSize: '14px',
    fontFamily: 'Space Grotesk, monospace',
    fontWeight: 500,
    padding: '0 48px 0 16px',
    letterSpacing: '0.05em',
    outline: 'none',
    boxSizing: 'border-box',
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0e0e0e',
      backgroundImage: 'radial-gradient(rgba(255,255,255,0.03) 1px, transparent 1px)',
      backgroundSize: '24px 24px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px 20px',
      fontFamily: 'Inter, sans-serif',
    }}>
      <div style={{ width: '100%', maxWidth: '360px' }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
            <img src={logoSrc} alt="LacTest" style={{ width: '40px', height: '40px', objectFit: 'contain' }} />
            <span style={{
              fontFamily: 'Space Grotesk, sans-serif',
              fontWeight: 900,
              fontSize: '24px',
              letterSpacing: '-0.5px',
              color: '#fff',
            }}>Lac<span style={{ color: '#bd9dff' }}>.</span>Test</span>
          </div>
        </div>

        {/* Price badge */}
        <div style={{
          background: '#131313',
          border: '1px solid #262626',
          borderRadius: '2px',
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '28px',
        }}>
          <div>
            <p style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '9px', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#777575', margin: '0 0 2px' }}>
              Standard Rate
            </p>
            <p style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '22px', fontWeight: 900, color: '#00fdc1', margin: 0, lineHeight: 1, letterSpacing: '-0.5px' }}>
              €9.95 <span style={{ fontSize: '11px', fontWeight: 400, color: '#adaaaa' }}>per analyse</span>
            </p>
          </div>
          <div style={{
            background: '#00fdc1',
            borderRadius: '2px',
            width: '28px', height: '28px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '14px',
          }}>💳</div>
        </div>

        {/* Heading */}
        <div style={{ marginBottom: '24px' }}>
          <h1 style={{
            fontFamily: 'Space Grotesk, sans-serif',
            fontWeight: 900,
            fontSize: '32px',
            letterSpacing: '-1px',
            textTransform: 'uppercase',
            color: '#fff',
            margin: '0 0 4px',
            lineHeight: 1,
          }}>
            {isLogin ? (lang === 'nl' ? 'Inloggen' : 'Sign in') : (lang === 'nl' ? 'Account aanmaken' : 'Create account')}
          </h1>
          <p style={{ fontSize: '13px', color: '#adaaaa', margin: 0, fontWeight: 400 }}>
            {isLogin
              ? (lang === 'nl' ? 'Log in met je e-mail en wachtwoord.' : 'Log in with your email and password.')
              : (lang === 'nl' ? 'Maak een gratis coachaccount aan.' : 'Create a free coach account.')}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

          {!isLogin && (
            <div style={{ position: 'relative' }}>
              <p style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '9px', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#777575', marginBottom: '6px' }}>
                {lang === 'nl' ? 'Naam' : 'Name'}
              </p>
              <input
                style={inputStyle}
                placeholder={lang === 'nl' ? 'Jouw naam' : 'Your name'}
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                required
                onFocus={e => { e.currentTarget.style.border = '1px solid #bd9dff'; e.currentTarget.style.boxShadow = '0 0 0 2px rgba(189,157,255,0.15)'; }}
                onBlur={e => { e.currentTarget.style.border = '1px solid #262626'; e.currentTarget.style.boxShadow = 'none'; }}
              />
            </div>
          )}

          <div style={{ position: 'relative' }}>
            <p style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '9px', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#777575', marginBottom: '6px' }}>
              E-mail
            </p>
            <input
              style={inputStyle}
              type="email"
              placeholder="coach@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              onFocus={e => { e.currentTarget.style.border = '1px solid #bd9dff'; e.currentTarget.style.boxShadow = '0 0 0 2px rgba(189,157,255,0.15)'; }}
              onBlur={e => { e.currentTarget.style.border = '1px solid #262626'; e.currentTarget.style.boxShadow = 'none'; }}
            />
            <span style={{ position: 'absolute', right: '16px', bottom: '18px', color: '#777575', fontSize: '16px' }}>@</span>
          </div>

          <div style={{ position: 'relative' }}>
            <p style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '9px', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#777575', marginBottom: '6px' }}>
              {lang === 'nl' ? 'Wachtwoord' : 'Password'}
            </p>
            <input
              style={inputStyle}
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              minLength={6}
              onFocus={e => { e.currentTarget.style.border = '1px solid #bd9dff'; e.currentTarget.style.boxShadow = '0 0 0 2px rgba(189,157,255,0.15)'; }}
              onBlur={e => { e.currentTarget.style.border = '1px solid #262626'; e.currentTarget.style.boxShadow = 'none'; }}
            />
            <svg style={{ position: 'absolute', right: '16px', bottom: '16px', color: '#777575' }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          </div>

          {/* Primary CTA */}
          <button
            type="submit"
            disabled={submitting}
            style={{
              width: '100%',
              height: '60px',
              background: 'linear-gradient(135deg, #8b4aff 0%, #bd9dff 100%)',
              border: 'none',
              borderRadius: '2px',
              color: '#fff',
              fontFamily: 'Space Grotesk, sans-serif',
              fontWeight: 900,
              fontSize: '15px',
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              cursor: submitting ? 'not-allowed' : 'pointer',
              marginTop: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: '0 8px 24px rgba(139,74,255,0.35)',
              opacity: submitting ? 0.7 : 1,
            }}
          >
            {submitting
              ? (lang === 'nl' ? 'Even geduld...' : 'Please wait...')
              : isLogin
                ? (lang === 'nl' ? 'Inloggen →' : 'Sign in →')
                : (lang === 'nl' ? 'Account aanmaken →' : 'Create account →')}
          </button>
        </form>

        {/* Secondary links */}
        <div style={{ marginTop: '20px', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {isLogin && (
            <button
              onClick={handleForgotPassword}
              style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#777575', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              {lang === 'nl' ? 'Wachtwoord vergeten?' : 'Forgot password?'}
            </button>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ flex: 1, height: '1px', background: '#262626' }} />
            <span style={{ fontSize: '11px', color: '#494847', fontWeight: 700, letterSpacing: '0.1em' }}>OR</span>
            <div style={{ flex: 1, height: '1px', background: '#262626' }} />
          </div>

          <button
            onClick={() => setIsLogin(!isLogin)}
            style={{
              width: '100%',
              height: '52px',
              background: 'transparent',
              border: '1px solid #262626',
              borderRadius: '2px',
              color: '#fff',
              fontFamily: 'Space Grotesk, sans-serif',
              fontWeight: 700,
              fontSize: '13px',
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              cursor: 'pointer',
            }}
          >
            {isLogin
              ? (lang === 'nl' ? 'Nog geen account? Registreer hier' : 'No account yet? Register here')
              : (lang === 'nl' ? 'Al een account? Log in' : 'Already have an account? Sign in')}
          </button>
        </div>


        {/* Language toggle */}
        <div style={{ marginTop: '16px', textAlign: 'center' }}>
          <button
            onClick={() => setLang(lang === 'nl' ? 'en' : 'nl')}
            style={{ fontSize: '11px', color: '#494847', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Space Grotesk, sans-serif', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 600 }}
          >
            {lang === 'nl' ? 'Switch to EN' : 'Schakel naar NL'}
          </button>
        </div>

      </div>
    </div>
  );
};

export default Auth;

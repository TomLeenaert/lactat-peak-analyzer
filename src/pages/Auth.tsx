import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import logoSrc from '@/assets/screen.png';
import { supabase } from '@/integrations/supabase/client';
import { lovable } from '@/integrations/lovable';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useLang } from '@/contexts/LanguageContext';
import { isDisposableEmail } from '@/lib/disposable-emails';
import Seo from '@/components/Seo';

const getErrorMessage = (error: unknown) => error instanceof Error ? error.message : 'Er is een onverwachte fout opgetreden.';

const Auth = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { lang, setLang } = useLang();

  const [isLogin, setIsLogin] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
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
        // Block disposable / throwaway email domains
        if (isDisposableEmail(email)) {
          toast({
            title: lang === 'nl' ? 'Ongeldig e-mailadres' : 'Invalid email',
            description: lang === 'nl'
              ? 'Wegwerp-e-mailadressen zijn niet toegestaan. Gebruik een persoonlijk of werkadres.'
              : 'Disposable email addresses are not allowed. Please use a personal or work address.',
            variant: 'destructive',
          });
          setSubmitting(false);
          return;
        }
        const { error } = await supabase.auth.signUp({
          email, password,
          options: { data: { full_name: `${firstName} ${lastName}`.trim(), first_name: firstName, last_name: lastName }, emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        toast({
          title: lang === 'nl' ? 'Bevestig je e-mail' : 'Confirm your email',
          description: lang === 'nl'
            ? 'We stuurden een bevestigingslink naar je inbox. Klik erop om in te loggen.'
            : 'We sent a confirmation link to your inbox. Click it to sign in.',
        });
      }
    } catch (err: unknown) {
      toast({ title: 'Error', description: getErrorMessage(err), variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogle = async () => {
    setSubmitting(true);
    try {
      const result = await lovable.auth.signInWithOAuth('google', {
        redirect_uri: `${window.location.origin}/dashboard`,
      });
      if (result.error) throw result.error;
      // If redirected, browser navigates away. Otherwise session is set.
      if (!result.redirected) navigate('/dashboard');
    } catch (err: unknown) {
      toast({ title: 'Error', description: getErrorMessage(err), variant: 'destructive' });
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
    <main style={{
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
      <Seo
        title={isLogin ? 'Sign in — MyLactest' : 'Create account — MyLactest'}
        description="Sign in or create your free MyLactest account to analyse lactate threshold tests."
        path="/auth"
        noindex
      />
      <div style={{ width: '100%', maxWidth: '360px' }}>

        {/* Back button */}
        <Link to="/" style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          color: 'rgba(255,255,255,0.5)',
          textDecoration: 'none',
          fontSize: '13px',
          fontFamily: 'Space Grotesk, monospace',
          letterSpacing: '0.08em',
          textTransform: 'uppercase' as const,
          marginBottom: '24px',
          transition: 'color 0.2s',
        }}
        onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.85)')}
        onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.5)')}
        >
          <ArrowLeft size={16} />
          {lang === 'nl' ? 'Terug' : 'Back'}
        </Link>

        {/* Logo — hero-sized with glow */}
        <div style={{ textAlign: 'center', marginBottom: '40px', paddingTop: '8px' }}>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '16px',
          }}>
            <div style={{
              position: 'relative',
              width: '120px',
              height: '120px',
            }}>
              {/* Glow ring behind logo */}
              <div style={{
                position: 'absolute',
                inset: '-12px',
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(139,74,255,0.15) 0%, rgba(139,74,255,0.05) 50%, transparent 70%)',
                filter: 'blur(8px)',
              }} />
              <img
                src={logoSrc}
                alt="LacTest"
                style={{
                  width: '120px',
                  height: '120px',
                  objectFit: 'contain',
                  mixBlendMode: 'lighten',
                  position: 'relative',
                  zIndex: 1,
                  filter: 'drop-shadow(0 4px 24px rgba(139,74,255,0.3))',
                }}
              />
            </div>
            <span style={{
              fontFamily: 'Space Grotesk, sans-serif',
              fontWeight: 900,
              fontSize: '28px',
              letterSpacing: '-0.5px',
              color: '#fff',
            }}>MyLactest</span>
          </div>
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
          <p style={{ fontSize: '13px', color: '#adaaaa', margin: 0, fontWeight: 400, lineHeight: 1.5 }}>
            {isLogin
              ? (lang === 'nl' ? 'Log in met je e-mail en wachtwoord.' : 'Log in with your email and password.')
              : (lang === 'nl' ? 'Maak een gratis account aan en krijg direct toegang tot volledige lactaatanalyse. Geen creditcard nodig.' : 'Create a free account and get instant access to full lactate analysis. No credit card needed.')}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

          {!isLogin && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <p style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '9px', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#777575', marginBottom: '6px' }}>
                  {lang === 'nl' ? 'Voornaam' : 'First name'}
                </p>
                <input
                  style={inputStyle}
                  placeholder={lang === 'nl' ? 'Jan' : 'John'}
                  value={firstName}
                  onChange={e => setFirstName(e.target.value)}
                  required
                  onFocus={e => { e.currentTarget.style.border = '1px solid #bd9dff'; e.currentTarget.style.boxShadow = '0 0 0 2px rgba(189,157,255,0.15)'; }}
                  onBlur={e => { e.currentTarget.style.border = '1px solid #262626'; e.currentTarget.style.boxShadow = 'none'; }}
                />
              </div>
              <div>
                <p style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '9px', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#777575', marginBottom: '6px' }}>
                  {lang === 'nl' ? 'Achternaam' : 'Last name'}
                </p>
                <input
                  style={inputStyle}
                  placeholder={lang === 'nl' ? 'Peeters' : 'Doe'}
                  value={lastName}
                  onChange={e => setLastName(e.target.value)}
                  required
                  onFocus={e => { e.currentTarget.style.border = '1px solid #bd9dff'; e.currentTarget.style.boxShadow = '0 0 0 2px rgba(189,157,255,0.15)'; }}
                  onBlur={e => { e.currentTarget.style.border = '1px solid #262626'; e.currentTarget.style.boxShadow = 'none'; }}
                />
              </div>
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
            type="button"
            onClick={handleGoogle}
            disabled={submitting}
            style={{
              width: '100%',
              height: '52px',
              background: '#fff',
              border: '1px solid #262626',
              borderRadius: '2px',
              color: '#0e0e0e',
              fontFamily: 'Space Grotesk, sans-serif',
              fontWeight: 700,
              fontSize: '13px',
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              cursor: submitting ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              opacity: submitting ? 0.6 : 1,
            }}
          >
            <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
              <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"/>
              <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"/>
              <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"/>
              <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571.001-.001.002-.001.003-.002l6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"/>
            </svg>
            {lang === 'nl' ? 'Doorgaan met Google' : 'Continue with Google'}
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
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

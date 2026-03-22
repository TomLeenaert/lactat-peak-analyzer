import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '4px' }}>
            <span style={{ color: '#bd9dff', fontSize: '20px', lineHeight: 1 }}>✳</span>
            <span style={{
              fontFamily: 'Space Grotesk, sans-serif',
              fontWeight: 900,
              fontSize: '22px',
              letterSpacing: '-0.5px',
              color: '#bd9dff',
            }}>LACTEST</span>
          </div>
          <p style={{
            fontFamily: 'Space Grotesk, sans-serif',
            fontSize: '9px',
            fontWeight: 700,
            letterSpacing: '0.25em',
            textTransform: 'uppercase',
            color: '#adaaaa',
            margin: 0,
          }}>
            Arctic Precision Analytics
          </p>
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

        {/* Coach Access heading */}
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
            {isLogin ? 'Coach Access' : 'New Laboratory'}
          </h1>
          <p style={{ fontSize: '13px', color: '#adaaaa', margin: 0, fontWeight: 400 }}>
            {isLogin
              ? 'Secure credential login required.'
              : 'Register your coach account.'}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

          {!isLogin && (
            <div style={{ position: 'relative' }}>
              <p style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '9px', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#777575', marginBottom: '6px' }}>
                Full Name
              </p>
              <input
                style={inputStyle}
                placeholder="Coach Name"
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
              Terminal ID / Email
            </p>
            <input
              style={inputStyle}
              type="email"
              placeholder="COACH_REF_0492"
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
              Access Code
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
            <span style={{ position: 'absolute', right: '16px', bottom: '18px', color: '#777575', fontSize: '16px' }}>🔒</span>
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
            {submitting ? 'Processing...' : isLogin ? 'Initialize Session ›' : 'Register Laboratory ›'}
          </button>
        </form>

        {/* Secondary links */}
        <div style={{ marginTop: '20px', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {isLogin && (
            <button
              onClick={handleForgotPassword}
              style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#777575', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              Forgot Calibration Keys?
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
            {isLogin ? 'Register New Laboratory' : 'Back to Coach Access'}
          </button>
        </div>

        {/* Footer status */}
        <div style={{ marginTop: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
          <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#00fdc1', boxShadow: '0 0 6px #00fdc1' }} />
          <span style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '9px', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#494847' }}>
            Encrypted Satellite Uplink Active
          </span>
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

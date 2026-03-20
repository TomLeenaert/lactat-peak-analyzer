import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useLang } from '@/contexts/LanguageContext';

const getErrorMessage = (error: unknown) => error instanceof Error ? error.message : 'Er is een onverwachte fout opgetreden.';

const Auth = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { lang, setLang, t } = useLang();
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
          email,
          password,
          options: {
            data: { full_name: fullName },
            emailRedirectTo: window.location.origin,
          },
        });
        if (error) throw error;
        toast({ title: t('auth.accountCreated'), description: t('auth.checkEmail') });
      }
    } catch (err: unknown) {
      toast({ title: t('auth.error'), description: getErrorMessage(err), variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      toast({ title: t('auth.fillEmail'), variant: 'destructive' });
      return;
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) {
      toast({ title: t('auth.error'), description: error.message, variant: 'destructive' });
    } else {
      toast({ title: t('auth.emailSent'), description: t('auth.checkInbox') });
    }
  };

  if (loading) return null;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top nav matching Landing */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 10,
        background: 'rgba(12, 13, 17, 0.90)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 24px', height: '58px',
      }}>
        <a href="/" style={{ color: '#fff', textDecoration: 'none', fontSize: '17px' }}>
          Lac<span style={{ color: '#6644ff' }}>.</span>Test
        </a>
        <button
          onClick={() => setLang(lang === 'nl' ? 'en' : 'nl')}
          style={{
            fontSize: '11px', fontWeight: 600,
            color: 'rgba(255,255,255,0.38)',
            background: 'none', border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: '6px', padding: '5px 10px', cursor: 'pointer',
          }}
        >
          {lang === 'nl' ? 'EN' : 'NL'}
        </button>
      </nav>

      <div className="flex-1 flex items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md" style={{ background: 'hsl(228 12% 9%)', border: '1px solid rgba(255,255,255,0.07)' }}>
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">{t('auth.title')}</CardTitle>
          <CardDescription>
            {isLogin ? t('auth.loginDesc') : t('auth.registerDesc')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <Input
                placeholder={t('auth.fullName')}
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                required
              />
            )}
            <Input
              type="email"
              placeholder={t('auth.email')}
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
            <Input
              type="password"
              placeholder={t('auth.password')}
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              minLength={6}
            />
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? t('auth.submitting') : isLogin ? t('auth.login') : t('auth.register')}
            </Button>
          </form>
          <div className="mt-4 text-center space-y-2">
            {isLogin && (
              <button
                onClick={handleForgotPassword}
                className="text-sm text-muted-foreground hover:text-primary underline"
              >
                {t('auth.forgotPassword')}
              </button>
            )}
            <p className="text-sm text-muted-foreground">
              {isLogin ? t('auth.noAccount') : t('auth.hasAccount')}{' '}
              <button onClick={() => setIsLogin(!isLogin)} className="text-primary underline">
                {isLogin ? t('auth.registerLink') : t('auth.loginLink')}
              </button>
            </p>
          </div>
        </CardContent>
      </Card>
      </div>
    </div>
  );
};

export default Auth;

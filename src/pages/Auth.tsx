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
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      {/* Language toggle */}
      <div className="absolute top-5 right-6">
        <button
          onClick={() => setLang(lang === 'nl' ? 'en' : 'nl')}
          className="text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors px-2.5 py-1 rounded border border-border hover:border-foreground/30"
        >
          {lang === 'nl' ? 'EN' : 'NL'}
        </button>
      </div>

      <Card className="w-full max-w-md">
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
          <div className="mt-6 pt-4 border-t">
            <div className="space-y-3">
              <Button
                variant="outline"
                className="w-full"
                disabled={submitting}
                onClick={async () => {
                  setSubmitting(true);
                  try {
                    const { error: signInError } = await supabase.auth.signInWithPassword({
                      email: 'tom@demo.test',
                      password: 'demo123456',
                    });
                    if (signInError) {
                      const { error: signUpError } = await supabase.auth.signUp({
                        email: 'tom@demo.test',
                        password: 'demo123456',
                        options: { data: { full_name: 'Tom' } },
                      });
                      if (signUpError) throw signUpError;
                      const { error } = await supabase.auth.signInWithPassword({
                        email: 'tom@demo.test',
                        password: 'demo123456',
                      });
                      if (error) throw error;
                    }
                    navigate('/dashboard');
                  } catch (err: unknown) {
                    toast({ title: t('auth.error'), description: getErrorMessage(err), variant: 'destructive' });
                  } finally {
                    setSubmitting(false);
                  }
                }}
              >
                {t('auth.demoLogin')}
              </Button>
              <Button variant="ghost" className="w-full" onClick={() => navigate('/demo')}>
                {t('auth.publicDemo')}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;

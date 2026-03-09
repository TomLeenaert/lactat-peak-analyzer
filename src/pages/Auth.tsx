import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';

const Auth = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
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
        toast({ title: 'Account aangemaakt', description: 'Controleer je email om je account te bevestigen.' });
      }
    } catch (err: any) {
      toast({ title: 'Fout', description: err.message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      toast({ title: 'Vul je email in', variant: 'destructive' });
      return;
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) {
      toast({ title: 'Fout', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Email verstuurd', description: 'Controleer je inbox voor de reset link.' });
    }
  };

  if (loading) return null;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">🔬 Lactaat Test App</CardTitle>
          <CardDescription>{isLogin ? 'Log in om verder te gaan' : 'Maak een account aan'}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <Input
                placeholder="Volledige naam"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                required
              />
            )}
            <Input
              type="email"
              placeholder="Email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
            <Input
              type="password"
              placeholder="Wachtwoord"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              minLength={6}
            />
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? 'Bezig...' : isLogin ? 'Inloggen' : 'Registreren'}
            </Button>
          </form>
          <div className="mt-4 text-center space-y-2">
            {isLogin && (
              <button onClick={handleForgotPassword} className="text-sm text-muted-foreground hover:text-primary underline">
                Wachtwoord vergeten?
              </button>
            )}
            <p className="text-sm text-muted-foreground">
              {isLogin ? 'Nog geen account?' : 'Al een account?'}{' '}
              <button onClick={() => setIsLogin(!isLogin)} className="text-primary underline">
                {isLogin ? 'Registreer' : 'Log in'}
              </button>
            </p>
          </div>
          <div className="mt-6 pt-4 border-t">
            <Button
              variant="outline"
              className="w-full"
              disabled={submitting}
              onClick={async () => {
                setSubmitting(true);
                try {
                  // Try to sign in first, if fails create the account
                  const { error: signInError } = await supabase.auth.signInWithPassword({
                    email: 'tom@demo.test',
                    password: 'demo123456',
                  });
                  if (signInError) {
                    // Create account
                    const { error: signUpError } = await supabase.auth.signUp({
                      email: 'tom@demo.test',
                      password: 'demo123456',
                      options: { data: { full_name: 'Tom' } },
                    });
                    if (signUpError) throw signUpError;
                    // Sign in after signup
                    const { error } = await supabase.auth.signInWithPassword({
                      email: 'tom@demo.test',
                      password: 'demo123456',
                    });
                    if (error) throw error;
                  }
                  navigate('/dashboard');
                } catch (err: any) {
                  toast({ title: 'Fout', description: err.message, variant: 'destructive' });
                } finally {
                  setSubmitting(false);
                }
              }}
            >
              🧪 Demo: Inloggen als Tom
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;

'use client';

import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  Eye,
  EyeOff,
  KeyRound,
  LogIn,
  LogOut,
  ShieldCheck,
  UserPlus,
} from 'lucide-react';
import { useComicForge } from '@/components/providers/comicforge-provider';
import {
  Badge,
  Button,
  Card,
  Input,
  Label,
} from '@/components/ui/primitives';
import {
  createSupabaseBrowserClient,
  isSupabaseConfigured,
} from '@/lib/supabase/client';

type AuthMode = 'signin' | 'signup' | 'forgot' | 'reset';

export default function AuthPage() {
  const { preferences, notify } = useComicForge();
  const isMs = preferences.uiLanguage === 'ms-MY';
  const configured = isSupabaseConfigured();

  const [mode, setMode] = useState<AuthMode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!configured) return;
    const supabase = createSupabaseBrowserClient();
    if (!supabase) return;

    supabase.auth.getUser().then(({ data }) => {
      setUserEmail(data.user?.email ?? null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setMode('reset');
        setUserEmail(null);
      } else if (event === 'SIGNED_IN' && session?.user?.email) {
        setUserEmail(session.user.email);
      } else if (event === 'SIGNED_OUT') {
        setUserEmail(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [configured]);

  const switchMode = (nextMode: AuthMode) => {
    setMode(nextMode);
    setPassword('');
    setConfirmPassword('');
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createSupabaseBrowserClient();
    if (!supabase) return;

    if ((mode === 'signup' || mode === 'reset') && password !== confirmPassword) {
      notify(
        isMs
          ? 'Kata laluan dan pengesahan kata laluan tidak sepadan.'
          : 'Password and confirmation password do not match.',
        'error'
      );
      return;
    }

    setLoading(true);
    try {
      if (mode === 'signin') {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) {
          notify(error.message, 'error');
          return;
        }
        setUserEmail(data.user?.email ?? null);
        notify(isMs ? 'Berjaya log masuk!' : 'Signed in successfully!', 'success');
      } else if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) {
          notify(error.message, 'error');
          return;
        }
        notify(
          isMs
            ? 'Pendaftaran berjaya! Sila semak e-mel untuk pengesahan.'
            : 'Account created! Please check your email to confirm.',
          'success'
        );
      } else if (mode === 'forgot') {
        const redirectTo =
          typeof window !== 'undefined' ? `${window.location.origin}/auth` : undefined;
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo,
        });
        if (error) {
          notify(error.message, 'error');
          return;
        }
        notify(
          isMs
            ? 'Pautan tetapan semula kata laluan telah dihantar ke e-mel anda.'
            : 'Password reset link has been sent to your email.',
          'success'
        );
      } else if (mode === 'reset') {
        const { data, error } = await supabase.auth.updateUser({ password });
        if (error) {
          notify(error.message, 'error');
          return;
        }
        setUserEmail(data.user?.email ?? null);
        switchMode('signin');
        notify(
          isMs
            ? 'Kata laluan baharu berjaya disimpan!'
            : 'New password saved successfully!',
          'success'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    const supabase = createSupabaseBrowserClient();
    if (!supabase) return;
    await supabase.auth.signOut();
    setUserEmail(null);
    notify(isMs ? 'Anda telah log keluar.' : 'Signed out.', 'default');
  };

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">
          {isMs ? 'Akaun & Pengesahan' : 'Account & Authentication'}
        </h1>
        <p className="text-sm text-[var(--cf-muted)]">
          {isMs
            ? 'Log masuk untuk menyegerakkan projek dan watak anda ke Supabase Cloud.'
            : 'Sign in to sync your comic projects and characters with Supabase Cloud.'}
        </p>
      </div>

      {!configured ? (
        <Card className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-bold text-sm flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#00D9FF]" />
              Supabase Auth
            </span>
            <Badge variant="yellow">Not Configured</Badge>
          </div>
          <p className="text-xs text-[var(--cf-muted)] leading-relaxed">
            {isMs
              ? 'Pemboleh ubah NEXT_PUBLIC_SUPABASE_URL dan NEXT_PUBLIC_SUPABASE_ANON_KEY belum ditetapkan. Aplikasi sedang berjalan dalam mod penyimpanan pelayar tempatan (localStorage) dengan selamat.'
              : 'NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are not set yet. The app is running safely in local browser storage mode.'}
          </p>
        </Card>
      ) : userEmail && mode !== 'reset' ? (
        <Card className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-[var(--cf-muted)]">Signed in as</div>
              <div className="font-bold text-base">{userEmail}</div>
            </div>
            <Badge variant="success">Authenticated</Badge>
          </div>
          <Button variant="outline" onClick={handleSignOut}>
            <LogOut className="w-4 h-4" />
            {isMs ? 'Log Keluar' : 'Sign Out'}
          </Button>
        </Card>
      ) : (
        <Card className="space-y-4">
          {mode === 'signin' || mode === 'signup' ? (
            <div className="flex gap-2">
              <Button
                type="button"
                size="sm"
                variant={mode === 'signin' ? 'primary' : 'outline'}
                onClick={() => switchMode('signin')}
              >
                <LogIn className="w-3.5 h-3.5" />
                {isMs ? 'Log Masuk' : 'Sign In'}
              </Button>
              <Button
                type="button"
                size="sm"
                variant={mode === 'signup' ? 'primary' : 'outline'}
                onClick={() => switchMode('signup')}
              >
                <UserPlus className="w-3.5 h-3.5" />
                {isMs ? 'Daftar Akaun' : 'Sign Up'}
              </Button>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-sm">
                <KeyRound className="w-4 h-4 text-[#00D9FF]" />
                {mode === 'forgot'
                  ? isMs
                    ? 'Tetap Semula Kata Laluan'
                    : 'Reset Password'
                  : isMs
                    ? 'Tetapkan Kata Laluan Baharu'
                    : 'Set New Password'}
              </div>
              <button
                type="button"
                onClick={() => switchMode('signin')}
                className="inline-flex items-center gap-1 text-xs font-semibold text-[#00D9FF] hover:underline cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                {isMs ? 'Kembali' : 'Back'}
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode !== 'reset' && (
              <div>
                <Label htmlFor="auth-email">Email</Label>
                <Input
                  id="auth-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="creator@example.com"
                />
              </div>
            )}

            {mode !== 'forgot' && (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <Label htmlFor="auth-password" className="mb-0">
                    {mode === 'reset'
                      ? isMs
                        ? 'Kata Laluan Baharu'
                        : 'New Password'
                      : 'Password'}
                  </Label>
                  {mode === 'signin' && (
                    <button
                      type="button"
                      onClick={() => switchMode('forgot')}
                      className="text-xs font-semibold text-[#00D9FF] hover:text-[#FACC15] transition-colors cursor-pointer"
                    >
                      {isMs ? 'Lupa kata laluan?' : 'Forgot password?'}
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Input
                    id="auth-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimum 8 characters"
                    className="pr-11"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute inset-y-0 right-0 px-3 flex items-center justify-center text-[var(--cf-muted)] hover:text-[#00D9FF] cursor-pointer"
                    aria-label={
                      showPassword
                        ? isMs
                          ? 'Sembunyikan kata laluan'
                          : 'Hide password'
                        : isMs
                          ? 'Tunjukkan kata laluan'
                          : 'Show password'
                    }
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            )}

            {(mode === 'signup' || mode === 'reset') && (
              <div>
                <Label htmlFor="auth-confirm-password">
                  {isMs ? 'Sahkan Kata Laluan' : 'Confirm Password'}
                </Label>
                <div className="relative">
                  <Input
                    id="auth-confirm-password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    minLength={8}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder={
                      isMs ? 'Masukkan semula kata laluan' : 'Re-enter your password'
                    }
                    className="pr-11"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                    className="absolute inset-y-0 right-0 px-3 flex items-center justify-center text-[var(--cf-muted)] hover:text-[#00D9FF] cursor-pointer"
                    aria-label={
                      showConfirmPassword
                        ? isMs
                          ? 'Sembunyikan pengesahan kata laluan'
                          : 'Hide confirmation password'
                        : isMs
                          ? 'Tunjukkan pengesahan kata laluan'
                          : 'Show confirmation password'
                    }
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                {confirmPassword.length > 0 && password !== confirmPassword && (
                  <p className="mt-1.5 text-xs text-rose-400">
                    {isMs ? 'Kata laluan tidak sepadan.' : 'Passwords do not match.'}
                  </p>
                )}
              </div>
            )}

            <Button type="submit" disabled={loading} className="w-full">
              {loading
                ? isMs
                  ? 'Memproses...'
                  : 'Processing...'
                : mode === 'signin'
                  ? isMs
                    ? 'Log Masuk'
                    : 'Sign In'
                  : mode === 'signup'
                    ? isMs
                      ? 'Cipta Akaun'
                      : 'Create Account'
                    : mode === 'forgot'
                      ? isMs
                        ? 'Hantar Pautan Tetapan Semula'
                        : 'Send Reset Link'
                      : isMs
                        ? 'Simpan Kata Laluan Baharu'
                        : 'Save New Password'}
            </Button>
          </form>
        </Card>
      )}
    </div>
  );
}

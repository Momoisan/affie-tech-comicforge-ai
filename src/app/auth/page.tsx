'use client';

import React, { useEffect, useState } from 'react';
import { LogIn, LogOut, ShieldCheck, UserPlus } from 'lucide-react';
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

export default function AuthPage() {
  const { preferences, notify } = useComicForge();
  const isMs = preferences.uiLanguage === 'ms-MY';
  const configured = isSupabaseConfigured();

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!configured) return;
    const supabase = createSupabaseBrowserClient();
    if (!supabase) return;
    supabase.auth.getUser().then(({ data }) => {
      setUserEmail(data.user?.email ?? null);
    });
  }, [configured]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createSupabaseBrowserClient();
    if (!supabase) return;

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
      } else {
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
      ) : userEmail ? (
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
          <div className="flex gap-2">
            <Button
              size="sm"
              variant={mode === 'signin' ? 'primary' : 'outline'}
              onClick={() => setMode('signin')}
            >
              <LogIn className="w-3.5 h-3.5" />
              {isMs ? 'Log Masuk' : 'Sign In'}
            </Button>
            <Button
              size="sm"
              variant={mode === 'signup' ? 'primary' : 'outline'}
              onClick={() => setMode('signup')}
            >
              <UserPlus className="w-3.5 h-3.5" />
              {isMs ? 'Daftar Akaun' : 'Sign Up'}
            </Button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
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
            <div>
              <Label htmlFor="auth-password">Password</Label>
              <Input
                id="auth-password"
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 8 characters"
              />
            </div>
            <Button type="submit" disabled={loading} className="w-full">
              {loading
                ? 'Processing...'
                : mode === 'signin'
                  ? isMs
                    ? 'Log Masuk'
                    : 'Sign In'
                  : isMs
                    ? 'Cipta Akaun'
                    : 'Create Account'}
            </Button>
          </form>
        </Card>
      )}
    </div>
  );
}

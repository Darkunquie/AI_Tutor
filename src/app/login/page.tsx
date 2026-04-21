'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { AuthShell } from '@/components/auth/AuthShell';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false,
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 403 && data.status === 'PENDING') {
          router.push('/pending');
          return;
        }
        const msg =
          (typeof data.error === 'string' && data.error) ||
          data.error?.message ||
          data.message ||
          'Login failed';
        setError(msg);
        return;
      }

      login(data.token, {
        id: data.user.id,
        name: data.user.name,
        email: data.user.email,
        phone: data.user.phone || '',
        level: data.user.level,
        role: data.user.role,
        status: data.user.status,
      });

      if (data.user.role === 'ADMIN') {
        router.push('/admin');
      } else if (data.user.status === 'PENDING') {
        router.push('/pending');
      } else {
        router.push('/dashboard');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const inputCls =
    'w-full bg-transparent border-0 border-b border-[#4FD1FF/20] px-0 py-3 text-[16px] text-[#E6EEF8] placeholder-[#879299] outline-none transition-colors focus:border-[#4FD1FF]';
  const labelCls = 'mb-2 block text-[11px] uppercase tracking-[0.12em] text-[#BCC8CF]';

  return (
    <AuthShell
      eyebrow="Welcome back"
      title="Log in to continue."
      subtitle="Pick up where you left off. Your sessions, streaks and vocabulary are waiting."
      footer={
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span>
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="text-[#4FD1FF] hover:text-[#6FE0FF]">
              Create one
            </Link>
          </span>
          <Link href="/" className="text-[13px] text-[#879299] hover:text-[#BCC8CF]">
            ← Back to home
          </Link>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="email" className={labelCls}>
            Email
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className={inputCls}
            placeholder="you@example.com"
            required
            disabled={isLoading}
            autoComplete="email"
          />
        </div>

        <div>
          <label htmlFor="password" className={labelCls}>
            Password
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className={inputCls + ' pr-14'}
              placeholder="Your password"
              required
              disabled={isLoading}
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-0 top-1/2 -translate-y-1/2 text-[11px] uppercase tracking-[0.1em] text-[#879299] transition-colors hover:text-[#E6EEF8]"
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>
        </div>

        <label className="flex cursor-pointer items-center gap-3 text-[14px] text-[#BCC8CF]">
          <input
            type="checkbox"
            name="rememberMe"
            checked={formData.rememberMe}
            onChange={handleChange}
            className="h-4 w-4 rounded border border-[#4FD1FF/20] bg-transparent accent-[#4FD1FF]"
            disabled={isLoading}
          />
          Keep me signed in for 30 days
        </label>

        {error && (
          <div className="border-l-2 border-[#B5564C] bg-[#B5564C]/10 px-4 py-3 text-[13px] text-[#E6EEF8]">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full rounded-md bg-[#4FD1FF] px-6 py-[14px] text-[15px] font-medium text-[#0D131B] transition-colors hover:bg-[#6FE0FF] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isLoading ? 'Signing in…' : 'Log in'}
        </button>
      </form>
    </AuthShell>
  );
}

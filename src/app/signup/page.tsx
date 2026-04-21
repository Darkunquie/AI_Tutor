'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AuthShell } from '@/components/auth/AuthShell';

export default function SignupPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
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
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      let data;
      try {
        data = await response.json();
      } catch {
        setError('Unexpected server response. Please try again.');
        return;
      }

      if (!response.ok) {
        const msg =
          (typeof data.error === 'string' && data.error) ||
          data.error?.message ||
          data.message ||
          'Signup failed';
        setError(msg);
        return;
      }

      router.push('/pending');
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
      eyebrow="Create an account"
      title="Begin your first session."
      subtitle="Seven days free, no card. Cancel any time. Your progress stays private to you."
      footer={
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span>
            Already have an account?{' '}
            <Link href="/login" className="text-[#4FD1FF] hover:text-[#4FD1FF]">
              Log in
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
          <label htmlFor="name" className={labelCls}>
            Full name
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className={inputCls}
            placeholder="As you&rsquo;d like to be addressed"
            required
            disabled={isLoading}
            autoComplete="name"
          />
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <label htmlFor="phone" className={labelCls}>
              Phone
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className={inputCls}
              placeholder="10-digit mobile"
              required
              disabled={isLoading}
              autoComplete="tel"
            />
          </div>
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
              placeholder="At least 8 characters"
              required
              minLength={8}
              disabled={isLoading}
              autoComplete="new-password"
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
          className="w-full rounded-md bg-[#4FD1FF] px-6 py-[14px] text-[15px] font-medium text-[#0D131B] transition-colors hover:bg-[#4FD1FF] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isLoading ? 'Creating account…' : 'Create my account'}
        </button>

        <p className="text-[12px] leading-[1.5] text-[#879299]">
          By continuing you agree to Talkivo&rsquo;s{' '}
          <span className="text-[#BCC8CF]">Terms</span> and{' '}
          <span className="text-[#BCC8CF]">Privacy Policy</span>.
        </p>
      </form>
    </AuthShell>
  );
}

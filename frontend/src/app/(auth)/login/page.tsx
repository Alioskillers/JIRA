'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Loader2, Mail, Lock, ArrowLeft } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';

const schema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  const login = useAuthStore(s => s.login);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      await login(data.email, data.password);
      router.push('/dashboard');
    } catch {
      toast.error('Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = 'w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-white/40 focus:ring-2 focus:ring-white/10 transition-all text-sm';

  return (
    <div className="min-h-screen bg-black flex">
      {/* Left panel */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 p-12 border-r border-white/10 bg-white/[0.02]">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center">
            <span className="text-xs font-bold text-black">MJ</span>
          </div>
          <span className="font-semibold text-white">Mini Jira</span>
        </Link>

        <div>
          <blockquote className="text-2xl font-medium text-white leading-snug mb-4">
            &ldquo;Clarity in tasks, velocity in delivery.&rdquo;
          </blockquote>
          <p className="text-white/40 text-sm">— Mini Jira</p>
        </div>

        {/* Abstract checkerboard */}
        <div className="grid grid-cols-8 gap-1.5 opacity-20">
          {Array.from({ length: 64 }).map((_, i) => (
            <div
              key={i}
              className="aspect-square rounded-sm bg-white"
              style={{ opacity: (i + Math.floor(i / 8)) % 2 === 0 ? 1 : 0.1 }}
            />
          ))}
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        <div className="w-full max-w-md">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-white/40 hover:text-white transition-colors mb-10"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to home
          </Link>

          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center">
              <span className="text-xs font-bold text-black">MJ</span>
            </div>
            <span className="font-semibold text-white">Mini Jira</span>
          </div>

          <h1 className="text-3xl font-bold text-white tracking-tight mb-2">Welcome back</h1>
          <p className="text-white/40 text-sm mb-8">
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="text-white hover:underline">Sign up</Link>
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <input
                  {...register('email')}
                  type="email"
                  placeholder="Email address"
                  className={inputClass}
                />
              </div>
              {errors.email && <p className="mt-1.5 text-xs text-white/50">{errors.email.message}</p>}
            </div>

            <div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <input
                  {...register('password')}
                  type="password"
                  placeholder="Password"
                  className={inputClass}
                />
              </div>
              {errors.password && <p className="mt-1.5 text-xs text-white/50">{errors.password.message}</p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 bg-white text-black font-semibold rounded-xl hover:bg-white/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm mt-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

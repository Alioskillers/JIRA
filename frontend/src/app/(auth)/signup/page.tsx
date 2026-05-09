'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Loader2, User, Mail, Lock, ArrowLeft, KeyRound } from 'lucide-react';
import axios from 'axios';

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'At least 8 characters')
    .regex(/[A-Z]/, 'Must contain an uppercase letter')
    .regex(/[0-9]/, 'Must contain a number')
    .regex(/[^A-Za-z0-9]/, 'Must contain a special character'),
  confirmPassword: z.string(),
}).refine(d => d.password === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

const confirmSchema = z.object({
  code: z.string().length(6, 'Code must be 6 digits'),
});

type RegisterData = z.infer<typeof registerSchema>;
type ConfirmData = z.infer<typeof confirmSchema>;

const baseURL = process.env.NEXT_PUBLIC_API_BASE_URL;

export default function SignupPage() {
  const router = useRouter();
  const [step, setStep] = useState<'register' | 'confirm'>('register');
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  const registerForm = useForm<RegisterData>({ resolver: zodResolver(registerSchema) });
  const confirmForm = useForm<ConfirmData>({ resolver: zodResolver(confirmSchema) });

  const onRegister = async (data: RegisterData) => {
    setLoading(true);
    try {
      const res = await axios.post(`${baseURL}/auth/register`, {
        name: data.name,
        email: data.email,
        password: data.password,
      });

      // If auto-confirmed, go straight to login
      if (res.data?.message?.includes('sign in')) {
        toast.success('Account created! You can now sign in.');
        router.push('/login');
        return;
      }

      // Otherwise show email confirmation step
      setRegisteredEmail(data.email);
      setStep('confirm');
      toast.success('Check your email for a confirmation code');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Registration failed';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const onConfirm = async (data: ConfirmData) => {
    setLoading(true);
    try {
      await axios.post(`${baseURL}/auth/confirm`, {
        email: registeredEmail,
        code: data.code,
      });
      toast.success('Email confirmed! You can now sign in.');
      router.push('/login');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Confirmation failed';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const resendCode = async () => {
    setResending(true);
    try {
      await axios.post(`${baseURL}/auth/resend-code`, { email: registeredEmail });
      toast.success('New code sent — check your email');
    } catch {
      toast.error('Could not resend code. Try again.');
    } finally {
      setResending(false);
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
            &ldquo;The best way to predict the future is to ship it.&rdquo;
          </blockquote>
          <p className="text-white/40 text-sm">— Mini Jira Team</p>
        </div>

        <div className="grid grid-cols-6 gap-2 opacity-20">
          {Array.from({ length: 48 }).map((_, i) => (
            <div
              key={i}
              className="aspect-square rounded border border-white/20 bg-white/5"
              style={{ opacity: (i * 7 + 3) % 3 === 0 ? 1 : 0.3 }}
            />
          ))}
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        <div className="w-full max-w-md">
          <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-white/40 hover:text-white transition-colors mb-10">
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to home
          </Link>

          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center">
              <span className="text-xs font-bold text-black">MJ</span>
            </div>
            <span className="font-semibold text-white">Mini Jira</span>
          </div>

          {step === 'register' ? (
            <>
              <h1 className="text-3xl font-bold text-white tracking-tight mb-2">Create your account</h1>
              <p className="text-white/40 text-sm mb-8">
                Already have one?{' '}
                <Link href="/login" className="text-white hover:underline">Sign in</Link>
              </p>

              <form onSubmit={registerForm.handleSubmit(onRegister)} className="space-y-4">
                <div>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                    <input {...registerForm.register('name')} placeholder="Full name" className={inputClass} />
                  </div>
                  {registerForm.formState.errors.name && (
                    <p className="mt-1.5 text-xs text-red-400">{registerForm.formState.errors.name.message}</p>
                  )}
                </div>

                <div>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                    <input {...registerForm.register('email')} type="email" placeholder="Email address" className={inputClass} />
                  </div>
                  {registerForm.formState.errors.email && (
                    <p className="mt-1.5 text-xs text-red-400">{registerForm.formState.errors.email.message}</p>
                  )}
                </div>

                <div>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                    <input {...registerForm.register('password')} type="password" placeholder="Password" className={inputClass} />
                  </div>
                  {registerForm.formState.errors.password && (
                    <p className="mt-1.5 text-xs text-red-400">{registerForm.formState.errors.password.message}</p>
                  )}
                </div>

                <div>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                    <input {...registerForm.register('confirmPassword')} type="password" placeholder="Confirm password" className={inputClass} />
                  </div>
                  {registerForm.formState.errors.confirmPassword && (
                    <p className="mt-1.5 text-xs text-red-400">{registerForm.formState.errors.confirmPassword.message}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-white text-black font-semibold rounded-xl hover:bg-white/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm mt-2"
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  {loading ? 'Creating account...' : 'Create account'}
                </button>
              </form>

              <p className="text-xs text-white/20 text-center mt-6">
                You will receive a confirmation code by email.
              </p>
            </>
          ) : (
            <>
              <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center mb-6">
                <KeyRound className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-white tracking-tight mb-2">Check your email</h1>
              <p className="text-white/40 text-sm mb-8">
                We sent a 6-digit confirmation code to <span className="text-white">{registeredEmail}</span>
              </p>

              <form onSubmit={confirmForm.handleSubmit(onConfirm)} className="space-y-4">
                <div>
                  <div className="relative">
                    <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                    <input
                      {...confirmForm.register('code')}
                      placeholder="000000"
                      maxLength={6}
                      className={inputClass + ' tracking-widest text-center text-lg font-mono'}
                    />
                  </div>
                  {confirmForm.formState.errors.code && (
                    <p className="mt-1.5 text-xs text-red-400">{confirmForm.formState.errors.code.message}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-white text-black font-semibold rounded-xl hover:bg-white/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm"
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  {loading ? 'Confirming...' : 'Confirm email'}
                </button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-sm text-white/40">
                  Didn&apos;t receive it?{' '}
                  <button
                    onClick={resendCode}
                    disabled={resending}
                    className="text-white hover:underline disabled:opacity-50"
                  >
                    {resending ? 'Sending...' : 'Resend code'}
                  </button>
                </p>
                <button
                  onClick={() => setStep('register')}
                  className="mt-3 text-sm text-white/30 hover:text-white/60 transition-colors"
                >
                  ← Use a different email
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

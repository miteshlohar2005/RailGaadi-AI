'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Headset, Zap, MessageCircleQuestion, ThumbsUp, Send, Loader2, CheckCircle2, AlertCircle, Mail
} from 'lucide-react';
import { cn } from '@/utils/cn';

const SUPPORT_POINTS = [
  { icon: Zap, title: 'Quick response' },
  { icon: MessageCircleQuestion, title: 'Questions & support' },
  { icon: ThumbsUp, title: 'Feedback welcome' },
];

type Status = 'idle' | 'sending' | 'success' | 'error';

interface FieldErrors {
  name?: string;
  email?: string;
  message?: string;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function ContactSection() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [errors, setErrors] = useState<FieldErrors>({});

  const validate = (): FieldErrors => {
    const next: FieldErrors = {};
    if (!name.trim()) next.name = 'Please enter your name';
    if (!email.trim()) next.email = 'Please enter your email';
    else if (!EMAIL_REGEX.test(email.trim())) next.email = 'Please enter a valid email address';
    if (!message.trim()) next.message = 'Please tell us how we can help';
    return next;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (status === 'sending') return;

    const fieldErrors = validate();
    setErrors(fieldErrors);
    if (Object.keys(fieldErrors).length > 0) return;

    setStatus('sending');
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), email: email.trim(), message: message.trim() }),
      });
      if (res.ok) {
        setStatus('success');
        setName('');
        setEmail('');
        setMessage('');
      } else {
        setStatus('error');
      }
    } catch {
      setStatus('error');
    }
  };

  const inputBase =
    'w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-[14.5px] font-medium text-foreground placeholder:text-slate-400 outline-none transition-all duration-200 focus:border-rail-blue/60 focus:ring-4 focus:ring-rail-blue/10';

  return (
    <section id="contact" className="relative scroll-mt-24 overflow-hidden">
      {/* Subtle sky-blue glow behind the section */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(600px 320px at 12% 18%, rgba(8,127,229,0.05), transparent 70%), radial-gradient(480px 300px at 88% 86%, rgba(8,127,229,0.04), transparent 70%)',
        }}
      />

      <div className="relative mx-auto max-w-7xl px-5 py-20 sm:px-8 sm:py-24 lg:py-28">
        <div className="grid grid-cols-1 items-start gap-12 lg:grid-cols-2 lg:gap-16">
          {/* ── Left: copy ─────────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-flex items-center gap-1.5 rounded-full border border-rail-blue/25 bg-rail-blue/[0.06] px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-widest text-rail-blue">
              <Headset className="h-3.5 w-3.5" strokeWidth={2} />
              Contact Support
            </span>

            <h2 className="mt-5 max-w-md text-4xl font-bold leading-[1.08] tracking-tight text-foreground sm:text-[42px] lg:text-[46px]">
              Need Help?{" "}
              <span className="text-rail-blue">We&rsquo;re Here.</span>
            </h2>

            <p className="mt-4 max-w-md text-base leading-relaxed text-muted-foreground sm:text-lg">
              Have a question, found an issue, or need support? Send us a message and we&rsquo;ll get
              back to you.
            </p>

            <ul className="mt-8 space-y-4">
              {SUPPORT_POINTS.map(({ icon: Icon, title }) => (
                <li key={title} className="flex items-center gap-3.5">
                  <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-rail-blue/[0.08] text-rail-blue">
                    <Icon className="h-[18px] w-[18px]" strokeWidth={2} />
                  </span>
                  <span className="text-[15px] font-semibold text-foreground">{title}</span>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* ── Right: contact form ────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.6, delay: 0.08 }}
            className="w-full"
          >
            <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-[0_24px_60px_-30px_rgba(7,26,61,0.25)] sm:p-8">
              <form onSubmit={handleSubmit} noValidate className="space-y-5">
                <div>
                  <label htmlFor="contact-name" className="mb-1.5 block text-sm font-semibold text-foreground">
                    Full Name
                  </label>
                  <input
                    id="contact-name"
                    type="text"
                    autoComplete="name"
                    placeholder="Enter your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    aria-invalid={!!errors.name}
                    className={cn(inputBase, errors.name && 'border-rose-300 focus:border-rose-400 focus:ring-rose-100')}
                  />
                  {errors.name && <p className="mt-1.5 text-xs font-medium text-rose-500">{errors.name}</p>}
                </div>

                <div>
                  <label htmlFor="contact-email" className="mb-1.5 block text-sm font-semibold text-foreground">
                    Email Address
                  </label>
                  <input
                    id="contact-email"
                    type="email"
                    autoComplete="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    aria-invalid={!!errors.email}
                    className={cn(inputBase, errors.email && 'border-rose-300 focus:border-rose-400 focus:ring-rose-100')}
                  />
                  {errors.email && <p className="mt-1.5 text-xs font-medium text-rose-500">{errors.email}</p>}
                </div>

                <div>
                  <label htmlFor="contact-message" className="mb-1.5 block text-sm font-semibold text-foreground">
                    Question / Message
                  </label>
                  <textarea
                    id="contact-message"
                    rows={5}
                    placeholder="Tell us how we can help you..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    aria-invalid={!!errors.message}
                    className={cn(inputBase, 'resize-none', errors.message && 'border-rose-300 focus:border-rose-400 focus:ring-rose-100')}
                  />
                  {errors.message && <p className="mt-1.5 text-xs font-medium text-rose-500">{errors.message}</p>}
                </div>

                <button
                  type="submit"
                  disabled={status === 'sending'}
                  className="group flex w-full items-center justify-center gap-2 rounded-xl bg-rail-blue px-6 py-3.5 text-[15px] font-semibold text-white shadow-[0_14px_30px_-12px_rgba(8,127,229,0.55)] transition-all duration-200 hover:bg-rail-navy hover:shadow-[0_16px_36px_-12px_rgba(7,26,61,0.55)] active:translate-y-[0.5px] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {status === 'sending' ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2.4} />
                      Sending...
                    </>
                  ) : (
                    <>
                      Send Message
                      <Send className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" strokeWidth={2.2} />
                    </>
                  )}
                </button>

                <div aria-live="polite">
                  {status === 'success' && (
                    <motion.div
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-2.5 rounded-xl border border-emerald-200/70 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700"
                    >
                      <CheckCircle2 className="h-[18px] w-[18px] flex-shrink-0 text-emerald-600" strokeWidth={2} />
                      Message sent successfully! We&rsquo;ll get back to you soon.
                    </motion.div>
                  )}

                  {status === 'error' && (
                    <motion.div
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-2.5 rounded-xl border border-rose-200/70 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700"
                    >
                      <AlertCircle className="h-[18px] w-[18px] flex-shrink-0 text-rose-600" strokeWidth={2} />
                      Something went wrong. Please try again.
                    </motion.div>
                  )}
                </div>
              </form>
            </div>

            <p className="mt-4 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
              <Mail className="h-3.5 w-3.5" strokeWidth={2} />
              We usually respond within one business day.
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
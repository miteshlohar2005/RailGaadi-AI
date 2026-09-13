import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { env } from '@/config/env';

export const runtime = 'nodejs';

const EMAIL_SUBJECT = 'RailGaadi AI - New Support Message';
const FROM_NAME = 'RailGaadi AI Website';
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Light in-memory cooldown per client IP to prevent rapid duplicate submissions.
const cooldowns = new Map<string, number>();
const COOLDOWN_MS = 15_000;

interface ContactPayload {
  name?: unknown;
  email?: unknown;
  message?: unknown;
}

function jsonError(error: string, status: number) {
  return NextResponse.json({ success: false, error }, { status });
}

export async function POST(request: NextRequest) {
  let payload: ContactPayload;
  try {
    payload = (await request.json()) as ContactPayload;
  } catch {
    return jsonError('INVALID_REQUEST', 400);
  }

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  const now = Date.now();
  const last = cooldowns.get(ip) || 0;
  if (now - last < COOLDOWN_MS) {
    return jsonError('THROTTLED', 429);
  }

  const name = typeof payload.name === 'string' ? payload.name.trim() : '';
  const email = typeof payload.email === 'string' ? payload.email.trim() : '';
  const message = typeof payload.message === 'string' ? payload.message.trim() : '';

  // ── Server-side validation ─────────────────────────────────
  if (!name) return jsonError('NAME_REQUIRED', 422);
  if (name.length > 120) return jsonError('NAME_TOO_LONG', 422);

  if (!email) return jsonError('EMAIL_REQUIRED', 422);
  if (email.length > 254 || !EMAIL_REGEX.test(email)) return jsonError('INVALID_EMAIL', 422);

  if (!message) return jsonError('MESSAGE_REQUIRED', 422);
  if (message.length > 5000) return jsonError('MESSAGE_TOO_LONG', 422);

  // ── SMTP must be configured in `.env`/`.env.local` ─────────
  if (!env.SMTP_HOST || !env.SMTP_USER || !env.SMTP_PASS) {
    console.warn(
      '[api/contact] SMTP not configured. Add SMTP_HOST, SMTP_USER, SMTP_PASS (and optionally SMTP_PORT/SMTP_SECURE) to .env — see .env.example.'
    );
    return jsonError('EMAIL_NOT_CONFIGURED', 503);
  }

  const transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_SECURE,
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASS,
    },
  });

  const textBody = [
    `Name: ${name}`,
    `Email: ${email}`,
    '',
    'Question / Message:',
    message,
  ].join('\n');

  try {
    await transporter.sendMail({
      from: `"${FROM_NAME}" <${env.SMTP_USER}>`,
      to: env.CONTACT_EMAIL_TO,
      replyTo: email,
      subject: EMAIL_SUBJECT,
      text: textBody,
    });
    cooldowns.set(ip, now);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(
      '[api/contact] sendMail failed:',
      err instanceof Error ? err.message : String(err)
    );
    return jsonError('SEND_FAILED', 500);
  }
}
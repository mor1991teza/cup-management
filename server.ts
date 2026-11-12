/**
 * @file server.ts
 * سرور اختصاصی و خودمیزبان (Self-Hosted) برای رصد زنده و احراز هویت ادمین
 */

import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import { fileURLToPath } from 'url';

// بارگذاری متغیرهای محیطی با امکان رونویسی
dotenv.config({ override: true });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'pes_tournament_live_monitor_super_secret_jwt_key_2026';

// بدنه درخواست‌ها به فرمت JSON دریافت شود
app.use(express.json({ limit: '2mb' }));

// مسیر ذخیره‌سازی داده‌های رویدادها
const DATA_DIR = path.join(__dirname, 'data');
const EVENTS_FILE = path.join(DATA_DIR, 'events.json');

// اطمینان از وجود پوشه data و فایل events.json
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

interface StoredEvent {
  eventName: string;
  timestamp: string;
  sessionId: string;
  payload?: Record<string, unknown>;
}

// حافظه موقت در رم جهت دسترسی سریع به آمار لحظه‌ای
let inMemoryEvents: StoredEvent[] = [];

try {
  if (fs.existsSync(EVENTS_FILE)) {
    const raw = fs.readFileSync(EVENTS_FILE, 'utf-8');
    inMemoryEvents = JSON.parse(raw);
    if (!Array.isArray(inMemoryEvents)) {
      inMemoryEvents = [];
    }
  } else {
    fs.writeFileSync(EVENTS_FILE, JSON.stringify([], null, 2), 'utf-8');
  }
} catch (e) {
  inMemoryEvents = [];
  fs.writeFileSync(EVENTS_FILE, JSON.stringify([], null, 2), 'utf-8');
}

// نوشتن در دیسک به صورت ایمن و زمان‌بندی‌شده
let isPersisting = false;
let pendingSave = false;

function scheduleSaveToDisk() {
  if (isPersisting) {
    pendingSave = true;
    return;
  }
  isPersisting = true;
  pendingSave = false;

  setTimeout(() => {
    try {
      // نگه‌داری حداکثر ۱۰،۰۰۰ رویداد اخیر در فایل برای جلوگیری از حجیم شدن بیش از حد
      if (inMemoryEvents.length > 10000) {
        inMemoryEvents = inMemoryEvents.slice(-10000);
      }
      fs.writeFileSync(EVENTS_FILE, JSON.stringify(inMemoryEvents, null, 2), 'utf-8');
    } catch (err) {
      console.error('خطا در ذخیره‌سازی رویدادها روی دیسک:', err);
    } finally {
      isPersisting = false;
      if (pendingSave) {
        scheduleSaveToDisk();
      }
    }
  }, 1000);
}

// ==========================================
// ابزارهای احراز هویت و توکن JWT (کاملاً بومی بدون وابستگی خارجی)
// ==========================================

function base64UrlEncode(str: string): string {
  return Buffer.from(str)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function base64UrlDecode(str: string): string {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) {
    str += '=';
  }
  return Buffer.from(str, 'base64').toString('utf-8');
}

function signJwt(payload: Record<string, unknown>, secret: string): string {
  const header = { alg: 'HS256', typ: 'JWT' };
  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const data = `${encodedHeader}.${encodedPayload}`;
  const signature = crypto
    .createHmac('sha256', secret)
    .update(data)
    .digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
  return `${data}.${signature}`;
}

function verifyJwt(token: string, secret: string): Record<string, unknown> | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const [headerB64, payloadB64, signatureB64] = parts;
    const data = `${headerB64}.${payloadB64}`;
    const expectedSig = crypto
      .createHmac('sha256', secret)
      .update(data)
      .digest('base64')
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');

    if (
      !crypto.timingSafeEqual(
        Buffer.from(signatureB64),
        Buffer.from(expectedSig)
      )
    ) {
      return null;
    }

    const payload = JSON.parse(base64UrlDecode(payloadB64));
    if (payload.exp && Date.now() > payload.exp) {
      return null; // منقضی شده است
    }
    return payload;
  } catch {
    return null;
  }
}

// اعتبارسنجی رمز عبور با فرمت salt:hash
function verifyPassword(password: string, storedHash: string): boolean {
  if (!storedHash || !storedHash.includes(':')) return false;
  const [salt, hash] = storedHash.split(':');
  if (!salt || !hash) return false;

  const derivedHash = crypto
    .pbkdf2Sync(password, salt, 100000, 64, 'sha512')
    .toString('hex');

  const bufA = Buffer.from(derivedHash, 'hex');
  const bufB = Buffer.from(hash, 'hex');

  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

// سیستم Rate Limiting برای لاگین: حداکثر ۵ تلاش ناموفق در ۱۵ دقیقه به ازای هر IP
interface RateLimitRecord {
  attempts: number;
  lockUntil: number;
}
const loginRateLimits = new Map<string, RateLimitRecord>();

function getClientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }
  return req.socket.remoteAddress || 'unknown';
}

// میدلور بررسی دسترسی ادمین
function requireAdminAuth(req: Request, res: Response, next: NextFunction) {
  // اعمال هدرهای امنیتی برای پاسخ‌های ادمین
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Content-Security-Policy', "frame-ancestors 'none'");

  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'دسترسی غیرمجاز. لطفاً ابتدا وارد شوید.' });
    return;
  }

  const token = authHeader.substring(7);
  const decoded = verifyJwt(token, JWT_SECRET);

  if (!decoded || decoded.role !== 'admin') {
    res.status(401).json({ error: 'توکن نامعتبر است یا منقضی شده است.' });
    return;
  }

  next();
}

// ==========================================
// روت‌های API
// ==========================================

/**
 * بررسی و اعتبارسنجی لایسنس
 * POST /api/verify-license
 */
app.post('/api/verify-license', (req: Request, res: Response) => {
  const { licenseKey } = req.body;
  if (!licenseKey || typeof licenseKey !== 'string') {
    res.status(400).json({ valid: false, error: 'کد لایسنس نامعتبر است.' });
    return;
  }

  try {
    const licensesFilePath = path.join(__dirname, 'licenses.json');
    if (!fs.existsSync(licensesFilePath)) {
      res.status(500).json({ valid: false, error: 'فایل لایسنس‌ها در سرور یافت نشد.' });
      return;
    }

    const fileContent = fs.readFileSync(licensesFilePath, 'utf-8');
    const licenses = JSON.parse(fileContent);

    if (!Array.isArray(licenses)) {
      res.status(500).json({ valid: false, error: 'ساختار فایل لایسنس‌ها نامعتبر است.' });
      return;
    }

    const found = licenses.find((l: any) => l.key.trim() === licenseKey.trim());
    if (!found) {
      res.status(401).json({ valid: false, error: 'کد لایسنس وارد شده وجود ندارد.' });
      return;
    }

    // بررسی تاریخ انقضا
    const expiryTime = new Date(found.expiryDate).getTime();
    if (Date.now() > expiryTime) {
      res.status(401).json({ valid: false, error: 'مهلت استفاده از این لایسنس به پایان رسیده است.' });
      return;
    }

    // تولید توکن JWT با کلید process.env.JWT_SECRET یا مقدار پیش‌فرض امن
    const secret = process.env.JWT_SECRET || 'pes_tournament_live_monitor_super_secret_jwt_key_2026';
    const token = jwt.sign(
      {
        licenseKey: found.key,
        type: found.type,
        clientName: found.clientName,
        exp: Math.floor(expiryTime / 1000),
      },
      secret
    );

    res.json({
      valid: true,
      token,
      type: found.type,
      clientName: found.clientName,
    });
  } catch (err) {
    console.error('Error verifying license:', err);
    res.status(500).json({ valid: false, error: 'خطای داخلی سرور در بررسی لایسنس.' });
  }
});

/**
 * ۱. روت عمومی ثبت دسته‌ای رویدادها
 * POST /api/events
 */
app.post('/api/events', (req: Request, res: Response) => {
  const body = req.body;
  const events: unknown[] = Array.isArray(body) ? body : [body];
  const validEvents: StoredEvent[] = [];

  for (const item of events) {
    if (typeof item === 'object' && item !== null) {
      const e = item as Record<string, unknown>;
      if (typeof e.eventName === 'string' && e.eventName.trim().length > 0) {
        const eventName = e.eventName.trim().slice(0, 80);
        const timestamp =
          typeof e.timestamp === 'string' ? e.timestamp : new Date().toISOString();
        const sessionId =
          typeof e.sessionId === 'string'
            ? e.sessionId.slice(0, 80)
            : 'anonymous-session';
        const payload =
          typeof e.payload === 'object' && e.payload !== null
            ? (e.payload as Record<string, unknown>)
            : {};

        // هیچ‌گونه داده هویتی یا آی‌پی کاربر در فایل ذخیره نمی‌شود
        validEvents.push({
          eventName,
          timestamp,
          sessionId,
          payload,
        });
      }
    }
  }

  if (validEvents.length > 0) {
    inMemoryEvents.push(...validEvents);
    scheduleSaveToDisk();
  }

  res.status(200).json({ success: true, count: validEvents.length });
});

/**
 * ۲. روت ورود ادمین با محافظت در برابر Brute-Force
 * POST /api/admin/login
 */
app.post('/api/admin/login', (req: Request, res: Response) => {
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Content-Security-Policy', "frame-ancestors 'none'");

  const ip = getClientIp(req);
  const now = Date.now();
  const limit = loginRateLimits.get(ip) || { attempts: 0, lockUntil: 0 };

  // بررسی وضعیت مسدودیت
  if (limit.lockUntil > now) {
    const remainingMinutes = Math.ceil((limit.lockUntil - now) / 60000);
    res.status(429).json({
      error: `تعداد تلاش‌های ناموفق بیش از حد مجاز است. لطفاً ${remainingMinutes} دقیقه دیگر تلاش کنید.`,
    });
    return;
  }

  const { password } = req.body;

  if (typeof password !== 'string' || !password) {
    res.status(400).json({ error: 'رمز عبور را وارد کنید.' });
    return;
  }

  dotenv.config({ override: true });
  const currentPasswordHash = process.env.ADMIN_PASSWORD_HASH || '';
  const isMatch = verifyPassword(password, currentPasswordHash);

  if (!isMatch) {
    limit.attempts += 1;
    if (limit.attempts >= 5) {
      limit.lockUntil = now + 15 * 60 * 1000; // مسدود به مدت ۱۵ دقیقه
    }
    loginRateLimits.set(ip, limit);

    const remainingAttempts = Math.max(0, 5 - limit.attempts);
    res.status(401).json({
      error:
        remainingAttempts > 0
          ? `رمز عبور نادرست است. (${remainingAttempts} تلاش باقی‌مانده)`
          : 'تعداد تلاش‌های ناموفق بیش از حد مجاز شد. دسترسی شما به مدت ۱۵ دقیقه مسدود شد.',
    });
    return;
  }

  // ورود موفق: ریست کردن خطاهای این IP
  loginRateLimits.delete(ip);

  // تولید توکن امن JWT با انقضای ۲ ساعت (۷۲۰۰ ثانیه)
  const token = signJwt(
    {
      role: 'admin',
      exp: now + 2 * 60 * 60 * 1000,
    },
    JWT_SECRET
  );

  res.json({
    success: true,
    token,
    expiresIn: 7200,
  });
});

/**
 * ۳. روت آمار زنده و تحلیلی ادمین
 * GET /api/live-stats
 */
app.get('/api/live-stats', requireAdminAuth, (_req: Request, res: Response) => {
  const now = Date.now();
  const fiveMinutesAgo = now - 5 * 60 * 1000;
  const oneHourAgo = now - 60 * 60 * 1000;

  // محاسبه ابتدای روز جاری به وقت محلی
  // محاسبه ابتدای روز جاری به وقت تهران (Asia/Tehran)
  const tehranDateStr = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Tehran',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
  const startOfTodayTime = new Date(`${tehranDateStr}T00:00:00+03:30`).getTime();

  // کاربران فعال: کاربرانی که در ۵ دقیقه گذشته رویداد داشته‌اند
  const activeSessionIds = new Set<string>();
  let totalEventsToday = 0;
  let matchesSubmittedToday = 0;
  let tournamentsStartedToday = 0;
  let playersAddedToday = 0;

  // ۱۲ بازه ۵ دقیقه‌ای برای ۱ ساعت گذشته به وقت ایران (تهران)
  const intervals: { timeLabel: string; count: number; start: number; end: number }[] = [];
  for (let i = 11; i >= 0; i--) {
    const end = now - i * 5 * 60 * 1000;
    const start = end - 5 * 60 * 1000;
    const timeLabel = new Date(end).toLocaleTimeString('fa-IR', {
      timeZone: 'Asia/Tehran',
      hour: '2-digit',
      minute: '2-digit',
    });
    intervals.push({ timeLabel, count: 0, start, end });
  }

  for (let i = inMemoryEvents.length - 1; i >= 0; i--) {
    const ev = inMemoryEvents[i];
    const eventTime = new Date(ev.timestamp).getTime();

    // محاسبه کاربران ۵ دقیقه اخیر
    if (eventTime >= fiveMinutesAgo) {
      activeSessionIds.add(ev.sessionId);
    }

    // آمار امروز
    if (eventTime >= startOfTodayTime) {
      totalEventsToday++;
      if (ev.eventName === 'match_result_submitted') matchesSubmittedToday++;
      if (ev.eventName === 'tournament_started') tournamentsStartedToday++;
      if (ev.eventName === 'player_added') playersAddedToday++;
    }

    // بازه‌های ۱ ساعت گذشته برای چارت
    if (eventTime >= oneHourAgo) {
      for (const bucket of intervals) {
        if (eventTime >= bucket.start && eventTime < bucket.end) {
          bucket.count++;
          break;
        }
      }
    }
  }

  // ۵۰ رویداد آخر به ترتیب از جدید به قدیم
  const recentEvents = [...inMemoryEvents].slice(-50).reverse();

  res.json({
    onlineUsers: activeSessionIds.size,
    todayStats: {
      totalEvents: totalEventsToday,
      matchesSubmitted: matchesSubmittedToday,
      tournamentsStarted: tournamentsStartedToday,
      playersAdded: playersAddedToday,
    },
    eventsPer5Min: intervals.map((it) => ({
      timeLabel: it.timeLabel,
      timestamp: it.end,
      count: it.count,
    })),
    recentEvents,
  });
});

// ==========================================
// راه‌اندازی سرور و اتصال فرانت‌اند (Vite / Static)
// ==========================================

async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    // در محیط توسعه، استفاده از Vite Middleware
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // در محیط پروداکشن، سرو کردن فایل‌های ساخت نهایی dist
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const portNum = Number(PORT) || 3000;
  app.listen(portNum, '0.0.0.0', () => {
    console.log(`🚀 سرور با موفقیت روی پورت ${portNum} شروع به کار کرد.`);
  });
}

startServer().catch((err) => {
  console.error('خطا در اجرای سرور:', err);
});

/**
 * @file tracker.ts
 * سیستم کلاینت ردیابی امن و سلف‌هاستد رویدادها
 * بدون ارسال داده‌های حساس یا استفاده از سرویس‌های شخص ثالث
 */

export interface TrackedEvent {
  eventName: string;
  timestamp: string;
  sessionId: string;
  payload?: Record<string, unknown>;
}

declare global {
  interface Window {
    trackEvent?: (eventName: string, payload?: Record<string, unknown>) => void;
  }
}

// کلید ذخیره‌سازی شناسه نشست در localStorage
const SESSION_STORAGE_KEY = 'tm_session_id';

// تولید یا دریافت شناسه یکتای نشست (UUID v4)
function getOrCreateSessionId(): string {
  try {
    let id = localStorage.getItem(SESSION_STORAGE_KEY);
    if (!id) {
      if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        id = crypto.randomUUID();
      } else {
        // روش جایگزین در صورت عدم پشتیبانی مرورگرهای قدیمی
        id = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
          const r = (Math.random() * 16) | 0;
          const v = c === 'x' ? r : (r & 0x3) | 0x8;
          return v.toString(16);
        });
      }
      localStorage.setItem(SESSION_STORAGE_KEY, id);
    }
    return id;
  } catch {
    // در صورت مسدود بودن localStorage در حالت خصوصی
    return 'anon-' + Math.random().toString(36).substring(2, 10);
  }
}

// صف محلی رویدادها جهت ارسال دسته‌ای (Batching)
let eventQueue: TrackedEvent[] = [];
let flushTimeout: ReturnType<typeof setTimeout> | null = null;

/**
 * ارسال دسته‌ای رویدادهای موجود در صف به سرور
 */
export async function flushEvents(): Promise<void> {
  if (eventQueue.length === 0) return;

  const eventsToSend = [...eventQueue];
  eventQueue = [];

  try {
    await fetch('/api/events', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(eventsToSend),
      keepalive: true, // اطمینان از ارسال حتی در زمان بستن تب
    });
  } catch (err) {
    // در صورت بروز خطای شبکه، رویدادها را مجدداً به ابتدای صف برمی‌گردانیم (حداکثر ۵۰ مورد)
    eventQueue = [...eventsToSend.slice(-30), ...eventQueue];
  }
}

/**
 * تابع اصلی ثبت رویداد
 * @param eventName نام رویداد (مانند page_view، player_added)
 * @param payload شیء اطلاعات تکمیلی غیرحساس
 */
export function trackEvent(eventName: string, payload?: Record<string, unknown>): void {
  try {
    const sessionId = getOrCreateSessionId();
    const event: TrackedEvent = {
      eventName,
      timestamp: new Date().toISOString(),
      sessionId,
      payload: payload || {},
    };

    eventQueue.push(event);

    // اگر تعداد به ۱۰ رسید، بلافاصله ارسال شود
    if (eventQueue.length >= 10) {
      if (flushTimeout) {
        clearTimeout(flushTimeout);
        flushTimeout = null;
      }
      flushEvents();
    } else if (!flushTimeout) {
      // در غیر این صورت پس از ۵ ثانیه ارسال دسته‌ای انجام گیرد
      flushTimeout = setTimeout(() => {
        flushTimeout = null;
        flushEvents();
      }, 5000);
    }
  } catch {
    // نادیده‌گیری خطاهای احتمالی جهت جلوگیری از تداخل با عملکرد اصلی اپ
  }
}

// ثبت در شیء سراسری window جهت دسترسی عمومی
if (typeof window !== 'undefined') {
  window.trackEvent = trackEvent;

  // ارسال رویدادهای باقی‌مانده در زمان ترک صفحه
  window.addEventListener('beforeunload', () => {
    flushEvents();
  });
}

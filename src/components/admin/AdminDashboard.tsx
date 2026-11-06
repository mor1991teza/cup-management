/**
 * @file AdminDashboard.tsx
 * داشبورد رصد لایو، پایش رویدادها و آمار کاربران فعال
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Users,
  Activity,
  Calendar,
  Trophy,
  LogOut,
  RefreshCw,
  Play,
  Pause,
  Clock,
  UserCheck,
  CheckCircle2,
  BarChart3,
  ListFilter,
  ShieldAlert,
} from 'lucide-react';

interface EventItem {
  eventName: string;
  timestamp: string;
  sessionId: string;
  payload?: Record<string, unknown>;
}

interface StatsData {
  onlineUsers: number;
  todayStats: {
    totalEvents: number;
    matchesSubmitted: number;
    tournamentsStarted: number;
    playersAdded: number;
  };
  eventsPer5Min: { timeLabel: string; count: number; timestamp?: number }[];
  recentEvents: EventItem[];
}

interface AdminDashboardProps {
  onLogout: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onLogout }) => {
  const [data, setData] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAutoRefresh, setIsAutoRefresh] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string>('');

  const fetchStats = useCallback(async () => {
    const token = localStorage.getItem('tm_admin_token');
    if (!token) {
      onLogout();
      return;
    }

    try {
      const response = await fetch('/api/live-stats', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 401) {
        localStorage.removeItem('tm_admin_token');
        onLogout();
        return;
      }

      if (!response.ok) {
        throw new Error('خطا در دریافت اطلاعات زنده از سرور.');
      }

      const resData = (await response.json()) as StatsData;
      setData(resData);
      setError(null);
      setLastUpdated(
        new Date().toLocaleTimeString('fa-IR', {
          timeZone: 'Asia/Tehran',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('خطا در برقراری ارتباط با سرور.');
      }
    } finally {
      setLoading(false);
    }
  }, [onLogout]);

  // زمان‌بندی رفرش خودکار هر ۵ ثانیه
  useEffect(() => {
    fetchStats();
    if (!isAutoRefresh) return;

    const timer = setInterval(() => {
      fetchStats();
    }, 5000);

    return () => clearInterval(timer);
  }, [fetchStats, isAutoRefresh]);

  // برچسب فارسی و رنگی برای هر نوع رویداد
  const getEventBadge = (eventName: string) => {
    switch (eventName) {
      case 'page_view':
        return { label: 'مشاهده صفحه', color: 'bg-blue-500/15 text-blue-300 border-blue-500/30' };
      case 'mode_group_enter':
        return { label: 'انتخاب کاپ گروهی', color: 'bg-amber-500/15 text-amber-300 border-amber-500/30' };
      case 'mode_knockout_enter':
        return { label: 'انتخاب کاپ حذفی', color: 'bg-purple-500/15 text-purple-300 border-purple-500/30' };
      case 'player_added':
        return { label: 'افزودن بازیکن', color: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30' };
      case 'player_removed':
        return { label: 'حذف بازیکن', color: 'bg-rose-500/15 text-rose-300 border-rose-500/30' };
      case 'groups_shuffled':
        return { label: 'قرعه‌کشی گروه‌ها', color: 'bg-orange-500/15 text-orange-300 border-orange-500/30' };
      case 'match_result_submitted':
        return { label: 'ثبت نتیجه بازی', color: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' };
      case 'tournament_started':
        return { label: 'شروع مسابقات', color: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30' };
      case 'tournament_finished':
        return { label: 'پایان تورنمنت', color: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40' };
      default:
        return { label: eventName, color: 'bg-slate-700/40 text-slate-300 border-slate-600/40' };
    }
  };

  // محاسبه حداکثر تعداد رویداد در نمودار میله‌ای
  const maxBarCount = Math.max(
    1,
    ...(data?.eventsPer5Min.map((i) => i.count) || [1])
  );

  return (
    <div className="min-h-screen bg-[#070b12] text-slate-100 p-4 md:p-6 lg:p-8 font-['Vazirmatn',sans-serif] selection:bg-rose-500/30">
      {/* هدر بالای صفحه */}
      <header className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-3">
            <span className="flex h-3 w-3 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            <h1 className="text-xl md:text-2xl font-black text-white tracking-wide">
              سامانه رصد زنده و پایش نرم‌افزار
            </h1>
            <span className="px-2.5 py-0.5 text-[11px] font-bold bg-slate-800 text-slate-300 rounded-full border border-slate-700">
              PES 2021 Tournament
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            نظارت لحظه‌ای بر فعالیت کاربران، ثبت مسابقات و بار مصرفی سیستم بدون وابستگی شخص ثالث
          </p>
        </div>

        {/* دکمه‌های کنترلی بالا */}
        <div className="flex items-center gap-2.5 self-stretch md:self-auto flex-wrap">
          <div className="text-xs text-slate-400 px-3 py-1.5 bg-slate-900/90 border border-slate-800 rounded-xl flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>آخرین بروزرسانی:</span>
            <span className="font-mono text-emerald-400 font-bold">{lastUpdated || '--:--:--'}</span>
          </div>

          <button
            onClick={() => setIsAutoRefresh(!isAutoRefresh)}
            className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              isAutoRefresh
                ? 'bg-emerald-950/40 text-emerald-300 border-emerald-800 hover:bg-emerald-900/40'
                : 'bg-amber-950/40 text-amber-300 border-amber-800 hover:bg-amber-900/40'
            }`}
          >
            {isAutoRefresh ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{isAutoRefresh ? 'رفرش خودکار (فعال)' : 'رفرش خودکار (متوقف)'}</span>
          </button>

          <button
            onClick={() => fetchStats()}
            disabled={loading}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-colors cursor-pointer"
            title="بروزرسانی دستی"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-400' : ''}`} />
          </button>

          <button
            onClick={onLogout}
            className="px-3.5 py-1.5 bg-rose-950/60 hover:bg-rose-900/70 text-rose-200 border border-rose-800/80 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>خروج</span>
          </button>
        </div>
      </header>

      {/* پیام خطا در صورت وجود */}
      {error && (
        <div className="max-w-7xl mx-auto mt-4 p-3 bg-rose-950/70 border border-rose-800 rounded-xl text-rose-200 text-xs flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      <main className="max-w-7xl mx-auto mt-6 space-y-6">
        {/* ردیف کارت‌های آماری */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* کارت ۱: کاربران آنلاین در لحظه */}
          <div className="bg-[#0f172a] border border-slate-800/90 rounded-2xl p-5 shadow-xl relative overflow-hidden group hover:border-emerald-500/40 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400">کاربران فعال (۵ دقیقه اخیر)</span>
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-4 flex items-baseline gap-3">
              <span className="text-4xl font-black text-white font-mono">
                {data?.onlineUsers ?? 0}
              </span>
              <span className="text-xs text-emerald-400 flex items-center gap-1 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                در حال حاضر فعال
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-2">
              بر اساس شناسه‌های یکتای نشست (Session ID)
            </p>
          </div>

          {/* کارت ۲: کل رویدادهای امروز */}
          <div className="bg-[#0f172a] border border-slate-800/90 rounded-2xl p-5 shadow-xl relative overflow-hidden group hover:border-blue-500/40 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400">کل رویدادهای امروز</span>
              <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                <Activity className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-4 flex items-baseline gap-3">
              <span className="text-4xl font-black text-white font-mono">
                {data?.todayStats.totalEvents ?? 0}
              </span>
              <span className="text-xs text-slate-400 font-medium">رویداد ثبت‌شده</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-2">از ساعت ۰۰:۰۰ بامداد امروز</p>
          </div>

          {/* کارت ۳: مسابقات ثبت‌شده امروز */}
          <div className="bg-[#0f172a] border border-slate-800/90 rounded-2xl p-5 shadow-xl relative overflow-hidden group hover:border-purple-500/40 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400">نتایج بازی‌های ثبت‌شده</span>
              <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-4 flex items-baseline gap-3">
              <span className="text-4xl font-black text-white font-mono">
                {data?.todayStats.matchesSubmitted ?? 0}
              </span>
              <span className="text-xs text-purple-400 font-medium">مسابقه تمام‌شده</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-2">شامل بازی‌های گروهی و حذفی</p>
          </div>

          {/* کارت ۴: تورنمنت‌های شروع‌شده */}
          <div className="bg-[#0f172a] border border-slate-800/90 rounded-2xl p-5 shadow-xl relative overflow-hidden group hover:border-amber-500/40 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400">تورنمنت‌های کلیدخورده</span>
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <Trophy className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-4 flex items-baseline gap-3">
              <span className="text-4xl font-black text-white font-mono">
                {data?.todayStats.tournamentsStarted ?? 0}
              </span>
              <span className="text-xs text-amber-400 font-medium">دوره جدید</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-2">
              با {data?.todayStats.playersAdded ?? 0} بازیکن ثبت‌نام شده
            </p>
          </div>
        </div>

        {/* کارت ۳: فعالیت ۱ ساعت اخیر (نمودار میله‌ای SVG/CSS) */}
        <section className="bg-[#0f172a] border border-slate-800/90 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-6 pb-3 border-b border-slate-800/80">
            <div className="flex items-center gap-2.5">
              <BarChart3 className="w-5 h-5 text-emerald-400" />
              <h2 className="text-sm font-bold text-white">
                توزیع فعالیت در ۱ ساعت اخیر (بازه‌های ۵ دقیقه‌ای)
              </h2>
            </div>
            <span className="text-xs text-slate-400">
              مجموع ۶۰ دقیقه اخیر
            </span>
          </div>

          <div className="h-44 w-full flex items-end gap-2 md:gap-4 pt-6 pb-2 px-2">
            {data?.eventsPer5Min && data.eventsPer5Min.length > 0 ? (
              data.eventsPer5Min.map((item, index) => {
                const heightPercent =
                  item.count > 0 ? Math.max(12, Math.round((item.count / maxBarCount) * 100)) : 4;
                return (
                  <div key={index} className="flex-1 flex flex-col items-center h-full justify-end group relative">
                    {/* برچسب تعداد در هاور */}
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-6 text-[10px] font-mono font-bold bg-slate-800 text-emerald-300 px-1.5 py-0.5 rounded shadow pointer-events-none">
                      {item.count}
                    </span>

                    {/* خود میله */}
                    <div
                      style={{ height: `${heightPercent}%` }}
                      className={`w-full max-w-[40px] rounded-t-lg transition-all duration-300 ${
                        item.count > 0
                          ? 'bg-gradient-to-t from-emerald-600 to-teal-400 group-hover:from-emerald-500 group-hover:to-teal-300 shadow-md shadow-emerald-950/30'
                          : 'bg-slate-800/40'
                      }`}
                    />

                    {/* زمان زیر میله به وقت تهران */}
                    <span className="text-[10px] text-slate-500 font-mono mt-2 tracking-tighter">
                      {item.timestamp
                        ? new Date(item.timestamp).toLocaleTimeString('fa-IR', {
                            timeZone: 'Asia/Tehran',
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : item.timeLabel}
                    </span>
                  </div>
                );
              })
            ) : (
              <div className="w-full text-center text-xs text-slate-500 py-10">
                در حال حاضر اطلاعاتی برای نمایش نمودار موجود نیست.
              </div>
            )}
          </div>
        </section>

        {/* جدول زنده آخرین ۵۰ رویداد */}
        <section className="bg-[#0f172a] border border-slate-800/90 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800/80">
            <div className="flex items-center gap-2.5">
              <ListFilter className="w-5 h-5 text-teal-400" />
              <h2 className="text-sm font-bold text-white">
                جدول زنده رویدادها (۵۰ رویداد آخر)
              </h2>
            </div>
            <span className="text-xs text-slate-400 font-mono">
              تعداد نمایش: {data?.recentEvents.length ?? 0}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 bg-slate-900/60 font-medium">
                  <th className="py-3 px-4 w-32">زمان (تهران)</th>
                  <th className="py-3 px-4 w-28">شناسه نشست</th>
                  <th className="py-3 px-4 w-44">نوع رویداد</th>
                  <th className="py-3 px-4">جزئیات (Payload)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {data?.recentEvents && data.recentEvents.length > 0 ? (
                  data.recentEvents.map((ev, idx) => {
                    const badge = getEventBadge(ev.eventName);
                    const timeStr = new Date(ev.timestamp).toLocaleTimeString('fa-IR', {
                      timeZone: 'Asia/Tehran',
                      hour: '2-digit',
                      minute: '2-digit',
                    });
                    const fullTimeStr = new Date(ev.timestamp).toLocaleTimeString('fa-IR', {
                      timeZone: 'Asia/Tehran',
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                    });
                    const dateStr = new Date(ev.timestamp).toLocaleDateString('fa-IR', {
                      timeZone: 'Asia/Tehran',
                      year: 'numeric',
                      month: '2-digit',
                      day: '2-digit',
                    });
                    const sessionShort = ev.sessionId.substring(0, 6) + '...';
                    const payloadStr =
                      ev.payload && Object.keys(ev.payload).length > 0
                        ? JSON.stringify(ev.payload)
                        : '-';

                    return (
                      <tr
                        key={idx}
                        className="hover:bg-slate-800/40 transition-colors"
                      >
                        <td
                          className="py-3 px-4 font-mono text-slate-300 dir-ltr text-right"
                          title={`${dateStr} - ${fullTimeStr}`}
                        >
                          <div className="font-semibold text-slate-200">{timeStr}</div>
                          <div className="text-[10px] text-slate-500">{dateStr}</div>
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-400 text-xs">
                          <span
                            className="bg-slate-800/80 px-2 py-0.5 rounded text-[11px] border border-slate-700/60"
                            title={ev.sessionId}
                          >
                            {sessionShort}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-bold border ${badge.color}`}
                          >
                            {badge.label}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-400 font-mono text-[11px] max-w-md truncate">
                          {payloadStr}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={4} className="text-center py-12 text-slate-500">
                      هنوز هیچ رویدادی ثبت نشده است. با کار با بخش‌های مختلف اپلیکیشن، رویدادها در این بخش ظاهر می‌شوند.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>

      {/* پاورقی سلب مسئولیت */}
      <footer className="max-w-7xl mx-auto mt-12 pt-6 border-t border-slate-900 text-center text-xs text-slate-500">
        <p>
          این پنل فقط برای نظارت فنی و رفع اشکال است و هیچ داده هویتی جمع‌آوری نمی‌شود.
        </p>
      </footer>
    </div>
  );
};

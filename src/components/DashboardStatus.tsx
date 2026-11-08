import React from 'react';
import {
  Trophy,
  Users,
  Grid,
  ShieldAlert,
  Flame,
  CheckCircle2,
  Calendar,
} from 'lucide-react';
import { TournamentState } from '../types/tournament';

interface DashboardStatusProps {
  state: TournamentState;
  activeTab: 'main' | 'groups' | 'fixtures' | 'bracket' | 'stats';
  setActiveTab: (tab: 'main' | 'groups' | 'fixtures' | 'bracket' | 'stats') => void;
  onAdvanceToKnockout?: () => void;
  canAdvanceToKnockout?: boolean;
  onOpenCelebrationModal?: () => void;
}

export const DashboardStatus: React.FC<DashboardStatusProps> = ({
  state,
  activeTab,
  setActiveTab,
  onAdvanceToKnockout,
  canAdvanceToKnockout,
  onOpenCelebrationModal,
}) => {
  // Metrics calculation
  const totalMatches = state.matches.length;
  const finishedMatches = state.matches.filter((m) => m.isFinished).length;
  const progressPercent = totalMatches > 0 ? Math.round((finishedMatches / totalMatches) * 100) : 0;

  let totalGoals = 0;
  state.matches.forEach((m) => {
    if (m.isFinished && m.homeScore !== null && m.awayScore !== null) {
      totalGoals += m.homeScore + m.awayScore;
    }
  });

  const avgGoals = finishedMatches > 0 ? (totalGoals / finishedMatches).toFixed(1) : '0.0';

  const isDirectKnockout =
    state.tournamentFormat === 'knockout_single' ||
    state.tournamentFormat === 'knockout_double' ||
    state.tournamentFormat === 'knockout_black';

  const getStageBadgeText = () => {
    switch (state.status) {
      case 'setup':
        return 'مرحله ۱: ثبت‌نام و قرعه‌کشی';
      case 'group':
        return 'مرحله ۲: دور گروهی مسابقات';
      case 'knockout':
        if (state.tournamentFormat === 'knockout_single') {
          return `مرحله حذفی تک: دور ${state.currentKnockoutRoundIndex || 1} مسابقات`;
        }
        if (state.tournamentFormat === 'knockout_black') {
          const sub = state.blackModeSubsequentFormat
            ? state.blackModeSubsequentFormat === 'bo3'
              ? ' (Bo3)'
              : ' (تک‌بازی)'
            : ' (مرحله ۱: تک‌حذفی)';
          return `حالت بلک${sub}: دور ${state.currentKnockoutRoundIndex || 1}`;
        }
        if (state.tournamentFormat === 'knockout_double') {
          return `مرحله حذفی دوگانه (Bo3): دور ${state.currentKnockoutRoundIndex || 1}`;
        }
        return state.gameType === 'billiards' ? 'مراحل حذفی' : 'مرحله ۳: جدول حذفی و پلی‌آف';
      case 'finished':
        return 'پایان مسابقات و معرفی قهرمان';
    }
  };

  return (
    <div className="bg-slate-950/60 backdrop-blur-md border-b border-white/[0.08] text-white">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-3.5">
        {/* Status Row */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
          {/* Unboxed Metadata with · separator */}
          <div className="flex items-center flex-wrap gap-2 text-slate-400">
            <span className="font-semibold text-app-primary">
              {getStageBadgeText()}
            </span>
            <span className="text-white/20" aria-hidden="true">·</span>
            <span>{state.players.length} شرکت‌کننده</span>
            <span className="text-white/20" aria-hidden="true">·</span>
            {isDirectKnockout ? (
              <>
                <span className="text-app-primary font-semibold">
                  {state.tournamentFormat === 'knockout_single'
                    ? 'فرمت تک‌حذفی'
                    : state.tournamentFormat === 'knockout_black'
                    ? 'حالت بلک'
                    : 'فرمت حذفی دوگانه (Bo3)'}
                </span>
                <span className="text-white/20" aria-hidden="true">·</span>
              </>
            ) : (
              <>
                <span>{state.groups.length} گروه رقابتی</span>
                <span className="text-white/20" aria-hidden="true">·</span>
              </>
            )}
            <span>
              <span className="font-mono tabular-nums text-emerald-400 font-bold">{finishedMatches}</span> از{' '}
              <span className="font-mono tabular-nums text-white font-bold">{totalMatches}</span> بازی انجام شده
            </span>
            <span className="text-white/20" aria-hidden="true">·</span>
            <span>
              {state.gameType === 'billiards' ? 'مجموع فریم‌های برده: ' : 'مجموع گلهای زده: '}
              <span className="font-mono tabular-nums text-app-primary font-bold">{totalGoals}</span>
              <span className="text-slate-400/80 mr-1 font-normal">
                ({avgGoals} {state.gameType === 'billiards' ? 'فریم در هر بازی' : 'گل در هر بازی'})
              </span>
            </span>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto flex-wrap">
            {/* Celebration Podium Button (if champion crowned) */}
            {state.championId && onOpenCelebrationModal && (
              <button
                onClick={onOpenCelebrationModal}
                className="btn-primary-glass flex items-center justify-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-slate-950 bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-400 hover:brightness-110 rounded-xl shadow-md transition-all whitespace-nowrap cursor-pointer"
              >
                <Trophy className="w-3.5 h-3.5 text-slate-950" />
                <span>سکوی قهرمانی و تصاویر</span>
              </button>
            )}

            {/* Quick Stage Promotion Button (if eligible) */}
            {state.status === 'group' && canAdvanceToKnockout && onAdvanceToKnockout && (
              <button
                onClick={onAdvanceToKnockout}
                className="btn-primary-glass flex items-center justify-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white rounded-xl shadow-md transition-all whitespace-nowrap cursor-pointer"
              >
                <Trophy className="w-3.5 h-3.5" />
                <span>شروع مرحله حذفی (تکمیل گروهی)</span>
              </button>
            )}
          </div>
        </div>

        {/* Linear Progress Bar */}
        {totalMatches > 0 && (
          <div className="mt-2.5 w-full bg-app-bg rounded-full h-1.5 overflow-hidden border border-app-border/40">
            <div
              className="h-full bg-app-primary transition-all duration-300 rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        )}

        {/* Mobile Sub-Navigation Bar */}
        <div className="flex lg:hidden items-center gap-1 mt-3 overflow-x-auto pb-1 text-xs">
          {(!isDirectKnockout || state.gameType === 'billiards' || state.groups.length > 0) && (
            <>
              <button
                onClick={() => setActiveTab('main')}
                className={`px-3 py-1.5 rounded font-medium whitespace-nowrap transition-colors cursor-pointer ${
                  activeTab === 'main'
                    ? 'bg-app-primary/20 text-app-primary border border-app-primary/40 shadow-sm font-bold'
                    : 'text-app-text-muted hover:text-app-text'
                }`}
              >
                داشبورد
              </button>
              <button
                onClick={() => setActiveTab('groups')}
                className={`px-3 py-1.5 rounded font-medium whitespace-nowrap transition-colors cursor-pointer ${
                  activeTab === 'groups'
                    ? 'bg-app-primary/20 text-app-primary border border-app-primary/40 shadow-sm font-bold'
                    : 'text-app-text-muted hover:text-app-text'
                }`}
              >
                جدول رده‌بندی
              </button>
            </>
          )}
          <button
            onClick={() => setActiveTab('bracket')}
            className={`px-3 py-1.5 rounded font-medium whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === 'bracket'
                ? 'bg-app-primary/20 text-app-primary border border-app-primary/40 shadow-sm font-bold'
                : 'text-app-text-muted hover:text-app-text'
            }`}
          >
            {state.gameType === 'billiards' ? 'مراحل حذفی' : isDirectKnockout ? 'براکت مسابقات' : 'براکت حذفی'}
          </button>
          <button
            onClick={() => setActiveTab('fixtures')}
            className={`px-3 py-1.5 rounded font-medium whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === 'fixtures'
                ? 'bg-app-primary/20 text-app-primary border border-app-primary/40 shadow-sm font-bold'
                : 'text-app-text-muted hover:text-app-text'
            }`}
          >
            برنامه مسابقات ({finishedMatches}/{totalMatches})
          </button>
          <button
            onClick={() => setActiveTab('stats')}
            className={`px-3 py-1.5 rounded font-medium whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === 'stats'
                ? 'bg-app-primary/20 text-app-primary border border-app-primary/40 shadow-sm font-bold'
                : 'text-app-text-muted hover:text-app-text'
            }`}
          >
            آمار مسابقات
          </button>
        </div>
      </div>
    </div>
  );
};

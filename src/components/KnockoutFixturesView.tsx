import React, { useState, useMemo } from 'react';
import { Match, Player, TournamentState } from '../types/tournament';
import { MatchCard } from './MatchCard';
import {
  Calendar,
  Filter,
  CheckCircle2,
  Clock,
  Search,
  Trophy,
  Dices,
  GitBranch,
  Flame,
} from 'lucide-react';
import { sound } from '../utils/audio';

interface KnockoutFixturesViewProps {
  state: TournamentState;
  playersMap: Map<string, Player>;
  onSaveScore: (
    matchId: string,
    homeScore: number,
    awayScore: number,
    winnerId?: string | null,
    homePenalties?: number | null,
    awayPenalties?: number | null
  ) => void;
  onSaveBo3Game?: (
    matchId: string,
    gameNumber: number,
    homeScore: number,
    awayScore: number
  ) => void;
  onQuickBo3Win?: (matchId: string, winningSide: 'home' | 'away') => void;
  onResetScore?: (matchId: string) => void;
  onAdvanceKnockoutRound?: () => void;
  onOpenCelebrationModal?: () => void;
  onOpenSingleGroupFinalDecision?: () => void;
  onSelectPlayer?: (playerId: string) => void;
}

export const KnockoutFixturesView: React.FC<KnockoutFixturesViewProps> = ({
  state,
  playersMap,
  onSaveScore,
  onSaveBo3Game,
  onQuickBo3Win,
  onResetScore,
  onAdvanceKnockoutRound,
  onOpenCelebrationModal,
  onOpenSingleGroupFinalDecision,
  onSelectPlayer,
}) => {
  const isDoubleElim = state.tournamentFormat === 'knockout_double';
  const activeRoundIndex = state.currentKnockoutRoundIndex || 1;

  // Filters state
  const [selectedRoundFilter, setSelectedRoundFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'finished'>('all');
  const [bracketTypeFilter, setBracketTypeFilter] = useState<'all' | 'winners' | 'grand_final'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const knockoutMatches = useMemo(() => {
    return state.matches.filter((m) => m.stage === 'knockout');
  }, [state.matches]);

  // Distinct rounds present
  const availableRounds = useMemo(() => {
    const roundsMap = new Map<number, { roundIndex: number; label: string; count: number }>();
    knockoutMatches.forEach((m) => {
      const rIdx = m.roundIndex || 1;
      const label = m.knockoutRoundLabel || m.roundLabel || `مرحله ${rIdx}`;
      if (!roundsMap.has(rIdx)) {
        roundsMap.set(rIdx, { roundIndex: rIdx, label, count: 1 });
      } else {
        roundsMap.get(rIdx)!.count++;
      }
    });
    return Array.from(roundsMap.values()).sort((a, b) => a.roundIndex - b.roundIndex);
  }, [knockoutMatches]);

  // Filtered matches
  const filteredMatches = useMemo(() => {
    return knockoutMatches.filter((m) => {
      // Round filter
      if (selectedRoundFilter !== 'all') {
        const rIndex = parseInt(selectedRoundFilter, 10);
        if ((m.roundIndex || 1) !== rIndex) return false;
      }

      // Status filter
      if (statusFilter === 'pending' && m.isFinished) return false;
      if (statusFilter === 'finished' && !m.isFinished) return false;

      // Bracket filter for Double Elim
      if (isDoubleElim && bracketTypeFilter !== 'all') {
        if (bracketTypeFilter === 'winners') {
          if (m.bracketType !== 'winners' && m.bracketType && m.knockoutRound === 'final') return false;
        } else if (bracketTypeFilter === 'grand_final') {
          if (m.bracketType !== 'grand_final' && m.bracketType !== 'grand_final_reset' && m.knockoutRound !== 'final') return false;
        }
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const homePlayer = m.homePlayerId ? playersMap.get(m.homePlayerId) : null;
        const awayPlayer = m.awayPlayerId ? playersMap.get(m.awayPlayerId) : null;
        const homeName = homePlayer?.name.toLowerCase() || '';
        const awayName = awayPlayer?.name.toLowerCase() || '';
        const homeTeam = homePlayer?.team?.toLowerCase() || '';
        const awayTeam = awayPlayer?.team?.toLowerCase() || '';
        const matchLabel = (m.knockoutRoundLabel || m.roundLabel || '').toLowerCase();

        const match =
          homeName.includes(q) ||
          awayName.includes(q) ||
          homeTeam.includes(q) ||
          awayTeam.includes(q) ||
          matchLabel.includes(q);

        if (!match) return false;
      }

      return true;
    });
  }, [knockoutMatches, selectedRoundFilter, statusFilter, bracketTypeFilter, searchQuery, isDoubleElim, playersMap]);

  // Overall match metrics
  const totalMatches = knockoutMatches.length;
  const finishedMatches = knockoutMatches.filter((m) => m.isFinished).length;
  const pendingMatches = totalMatches - finishedMatches;

  // Active round progress check
  const currentRoundMatches = knockoutMatches.filter(
    (m) => (m.roundIndex || 1) === activeRoundIndex && (!m.bracketType || m.bracketType === 'single' || m.bracketType === 'winners')
  );
  const isCurrentRoundFinished =
    currentRoundMatches.length > 0 && currentRoundMatches.every((m) => m.isFinished && m.winnerId);
  const isTournamentFinished = state.status === 'finished' || Boolean(state.championId);

  // Check if current round is Semi-final or Final
  const isFinalRound = useMemo(() => {
    return currentRoundMatches.some(
      (m) => m.knockoutRound === 'final' || m.knockoutRound === 'thirdPlace'
    );
  }, [currentRoundMatches]);

  const isSemiFinalRound = useMemo(() => {
    if (currentRoundMatches.length !== 2) return false;
    return !isFinalRound;
  }, [currentRoundMatches, isFinalRound]);

  return (
    <div className="space-y-6">
      {/* Top Banner / Format Information */}
      <div className="card-stadium p-4 sm:p-5 rounded-2xl border border-app-border bg-app-surface text-app-text shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-app-primary text-xs font-bold">
              <Calendar className="w-4 h-4" />
              <span>
                {state.tournamentFormat === 'knockout_single'
                  ? 'برنامه و لیست مسابقات حذفی تک (تک‌بازی مستقیم / بدون Bo3)'
                  : state.tournamentFormat === 'knockout_black'
                  ? 'برنامه مسابقات حالت بلک (مرحله ۱ تک‌حذفی + انتخاب فرمت در مراحل بعد)'
                  : 'برنامه و لیست مسابقات حذفی دوگانه (بهترین از ۳ بازی - Bo3)'}
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-black text-app-text">
              جدول زمان‌بندی و ثبت نتایج تمام مراحل
            </h2>
            <p className="text-xs text-app-text-muted">
              {state.tournamentFormat === 'knockout_single'
                ? state.gameType === 'billiards'
                  ? 'با اولین باخت بازیکن حذف می‌شود. تساوی مجاز نیست و در صورت مساوی، بازی تکراری (یا فرمت Race to X) تعیین‌کننده است.'
                  : 'با اولین باخت بازیکن حذف می‌شود. تساوی مجاز نیست و در صورت مساوی ضربات پنالتی تعیین‌کننده است.'
                : state.tournamentFormat === 'knockout_black'
                ? state.blackModeSubsequentFormat
                  ? `مرحله اول تک‌بازی بود؛ از مرحله ۲ تا فینال مسابقات به صورت ${state.blackModeSubsequentFormat === 'bo3' ? 'بهترین از ۳ بازی (Bo3)' : 'تک‌بازی مستقیم'} برگزار می‌شوند.`
                  : 'مرحله اول تک‌بازی حذفی است و با پایان آن، فرمت مراحل باقیمانده را انتخاب خواهید کرد.'
                : 'هر مسابقه تا ۲ برد (Bo3) برگزار می‌شود و هر بازیکن با دو باخت در مراحل مختلف حذف می‌شود.'}
            </p>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <div className="bg-app-bg border border-app-border rounded-xl px-3 py-1.5 text-center">
              <span className="text-[10px] text-app-text-muted block">کل مسابقات</span>
              <span className="text-sm font-black font-mono text-app-text">{totalMatches}</span>
            </div>
            <div className="bg-[#0b1c12] border border-emerald-900/60 rounded-xl px-3 py-1.5 text-center">
              <span className="text-[10px] text-emerald-400 block">انجام‌شده</span>
              <span className="text-sm font-black font-mono text-emerald-300">{finishedMatches}</span>
            </div>
            <div className="bg-[#1c1509] border border-amber-900/60 rounded-xl px-3 py-1.5 text-center">
              <span className="text-[10px] text-amber-400 block">باقیمانده</span>
              <span className="text-sm font-black font-mono text-amber-300">{pendingMatches}</span>
            </div>
          </div>
        </div>
      </div>

      {/* پیام تکمیل مسابقه پلی‌آف در لیگ ۱ گروه */}
      {state.groups?.length === 1 &&
        knockoutMatches.some((m) => m.knockoutRound === 'tiebreaker' && m.isFinished) &&
        !knockoutMatches.some((m) => m.knockoutRound === 'final') &&
        !isTournamentFinished &&
        onOpenSingleGroupFinalDecision && (
          <div className="card-stadium p-4 sm:p-5 rounded-2xl border-2 border-emerald-500/80 bg-gradient-to-r from-emerald-950/90 via-[#0e1d15] to-emerald-950/90 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-4 animate-fade-in">
            <div className="flex items-center gap-3 text-center md:text-right">
              <div className="w-11 h-11 rounded-xl bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center text-emerald-400 shrink-0">
                <CheckCircle2 className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <h4 className="text-sm sm:text-base font-extrabold text-white flex items-center gap-2 justify-center md:justify-start">
                  <span>مسابقه پلی‌آف تساوی‌شکنی با موفقیت پایان یافت!</span>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/40">
                    آخرین صعودکننده مشخص شد
                  </span>
                </h4>
                <p className="text-xs text-slate-300 mt-0.5">
                  {(state.groups[0]?.advanceCount || 2) > 2
                    ? 'اکنون می‌توانید براکت مرحله حذفی را ایجاد کنید.'
                    : 'اکنون می‌توانید بین برگزاری مسابقه فینال رسمی یا اعلام مستقیم قهرمان از روی جدول تصمیم‌گیری کنید.'}
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                sound.playClick();
                onOpenSingleGroupFinalDecision();
              }}
              className="px-5 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-emerald-500/30 transition-all active:scale-95 cursor-pointer shrink-0"
            >
              <Trophy className="w-4 h-4" />
              <span>
                {(state.groups[0]?.advanceCount || 2) > 2
                  ? 'ساخت براکت مرحله حذفی 🏆'
                  : 'تصمیم‌گیری فینال لیگ 🏆'}
              </span>
            </button>
          </div>
        )}

      {/* Prominent Redraw Button when active round finished */}
      {state.groups?.length !== 1 &&
        isCurrentRoundFinished &&
        !isTournamentFinished &&
        !isSemiFinalRound &&
        !isFinalRound && (
        <div className="card-stadium p-4 sm:p-5 rounded-2xl border-2 border-emerald-500/80 bg-gradient-to-r from-emerald-950/90 via-[#0e1d15] to-emerald-950/90 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-4 animate-fade-in">
          <div className="flex items-center gap-3 text-center md:text-right">
            <div className="w-11 h-11 rounded-xl bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center text-emerald-400 shrink-0">
              <CheckCircle2 className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <h4 className="text-sm sm:text-base font-extrabold text-white flex items-center gap-2 justify-center md:justify-start">
                <span>تمام بازی‌های مرحله {activeRoundIndex} به پایان رسید!</span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/40">
                  آماده قرعه‌کشی
                </span>
              </h4>
              <p className="text-xs text-slate-300 mt-0.5">
                برای جفت‌سازی تصادفی برندگان و شروع مسابقات مرحله {activeRoundIndex + 1} کلیک کنید.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              sound.playWhistle();
              onAdvanceKnockoutRound?.();
            }}
            className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-xs sm:text-sm rounded-xl shadow-xl shadow-emerald-950/60 flex items-center gap-2 transition-all cursor-pointer shrink-0 animate-pulse hover:scale-105"
          >
            <Dices className="w-4 h-4 text-slate-950" />
            <span>قرعه‌کشی و شروع مرحله {activeRoundIndex + 1}</span>
          </button>
        </div>
      )}

      {/* Control Filters Bar */}
      <div className="card-stadium p-4 rounded-xl border border-app-border space-y-3.5 bg-app-surface text-app-text">
        {/* Round Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <span className="text-app-text-muted text-xs font-semibold pl-1 shrink-0 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5 text-app-primary" />
            <span>انتخاب مرحله:</span>
          </span>

          <button
            type="button"
            onClick={() => {
              sound.playClick();
              setSelectedRoundFilter('all');
            }}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all whitespace-nowrap cursor-pointer ${
              selectedRoundFilter === 'all'
                ? 'bg-app-primary text-white shadow-sm'
                : 'bg-app-bg text-app-text-muted hover:text-app-text border border-app-border'
            }`}
          >
            همه مراحل ({totalMatches})
          </button>

          {availableRounds.map((rnd) => {
            const isSelected = selectedRoundFilter === String(rnd.roundIndex);
            const isActive = activeRoundIndex === rnd.roundIndex;
            return (
              <button
                key={rnd.roundIndex}
                type="button"
                onClick={() => {
                  sound.playClick();
                  setSelectedRoundFilter(String(rnd.roundIndex));
                }}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                  isSelected
                    ? 'bg-app-primary text-white shadow-sm ring-1 ring-app-primary'
                    : isActive
                    ? 'bg-app-primary/20 text-app-primary border border-app-primary/40'
                    : 'bg-app-bg text-app-text-muted hover:text-app-text border border-app-border'
                }`}
              >
                <span>{rnd.label}</span>
                <span className="text-[10px] opacity-80 font-mono">({rnd.count})</span>
                {isActive && (
                  <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block animate-ping" />
                )}
              </button>
            );
          })}
        </div>

        {/* Secondary Filters: Status + Double Elim Tabs + Search */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-2 border-t border-app-border">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Status Filter */}
            <div className="flex items-center bg-app-bg p-0.5 rounded-lg border border-app-border text-xs">
              <button
                type="button"
                onClick={() => {
                  sound.playClick();
                  setStatusFilter('all');
                }}
                className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                  statusFilter === 'all'
                    ? 'bg-app-primary text-white font-bold'
                    : 'text-app-text-muted hover:text-app-text'
                }`}
              >
                همه
              </button>
              <button
                type="button"
                onClick={() => {
                  sound.playClick();
                  setStatusFilter('pending');
                }}
                className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer flex items-center gap-1 ${
                  statusFilter === 'pending'
                    ? 'bg-rose-950 text-amber-300 font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Clock className="w-3 h-3 text-amber-400" />
                <span>در انتظار ({pendingMatches})</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  sound.playClick();
                  setStatusFilter('finished');
                }}
                className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer flex items-center gap-1 ${
                  statusFilter === 'finished'
                    ? 'bg-rose-950 text-emerald-300 font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                <span>انجام‌شده ({finishedMatches})</span>
              </button>
            </div>

            {/* Double Elim Sub-bracket filter if applicable */}
            {isDoubleElim && (
              <div className="flex items-center bg-[#130509] p-0.5 rounded-lg border border-rose-950 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    sound.playClick();
                    setBracketTypeFilter('all');
                  }}
                  className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                    bracketTypeFilter === 'all'
                      ? 'bg-rose-950 text-white font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  همه براکت‌ها
                </button>
                <button
                  type="button"
                  onClick={() => {
                    sound.playClick();
                    setBracketTypeFilter('winners');
                  }}
                  className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                    bracketTypeFilter === 'winners'
                      ? 'bg-rose-950 text-rose-300 font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  برندگان
                </button>
                <button
                  type="button"
                  onClick={() => {
                    sound.playClick();
                    setBracketTypeFilter('grand_final');
                  }}
                  className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                    bracketTypeFilter === 'grand_final'
                      ? 'bg-rose-950 text-amber-300 font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  فینال کل
                </button>
              </div>
            )}
          </div>

          {/* Quick Search */}
          <div className="relative w-full md:w-64">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute right-3 top-2.5 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="جستجوی بازیکن یا تیم..."
              className="w-full bg-app-bg border border-app-border text-app-text placeholder-app-text-muted text-xs rounded-lg pr-9 pl-3 py-1.5 outline-none focus:border-app-primary transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Matches Grid: Exactly 3 matches per row on desktop (grid-cols-1 md:grid-cols-2 lg:grid-cols-3) */}
      {filteredMatches.length === 0 ? (
        <div className="card-stadium p-12 rounded-2xl border border-app-border text-center text-app-text-muted">
          <Calendar className="w-10 h-10 mx-auto text-app-primary/60 mb-3" />
          <p className="text-sm font-bold text-app-text mb-1">مسابقه‌ای با این فیلترها یافت نشد</p>
          <p className="text-xs text-slate-500">لطفاً فیلترهای انتخابی یا عبارت جستجو را تغییر دهید.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4.5">
          {filteredMatches.map((match) => (
            <MatchCard
              key={match.id}
              match={match}
              playersMap={playersMap}
              onSaveScore={onSaveScore}
              onSaveBo3Game={onSaveBo3Game}
              onQuickBo3Win={onQuickBo3Win}
              onResetScore={onResetScore}
              isKnockout={true}
              gameType={state.gameType || 'pes'}
              billiardsFormat={state.billiardsFormat}
              onSelectPlayer={onSelectPlayer}
            />
          ))}
        </div>
      )}
    </div>
  );
};

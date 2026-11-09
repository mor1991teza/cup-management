import React, { useState, useMemo } from 'react';
import {
  Match,
  Player,
  TournamentState,
} from '../types/tournament';
import { KNOCKOUT_ROUND_LABELS } from '../utils/tournament';
import { MatchCard } from './MatchCard';
import {
  Trophy,
  Crown,
  Sparkles,
  Shuffle,
  Dices,
  GitBranch,
  CheckCircle2,
  LayoutGrid,
  Maximize2,
  Calendar,
  Clock,
  CircleDot,
} from 'lucide-react';
import { sound } from '../utils/audio';

interface BracketViewProps {
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
  onOpenCelebrationModal?: () => void;
  onAdvanceKnockoutRound?: () => void;
  onOpenSingleGroupFinalDecision?: () => void;
}

export const BracketView: React.FC<BracketViewProps> = ({
  state,
  playersMap,
  onSaveScore,
  onSaveBo3Game,
  onQuickBo3Win,
  onResetScore,
  onOpenCelebrationModal,
  onAdvanceKnockoutRound,
  onOpenSingleGroupFinalDecision,
}) => {
  const isDirectKnockout =
    state.tournamentFormat === 'knockout_single' ||
    state.tournamentFormat === 'knockout_double' ||
    state.tournamentFormat === 'knockout_black';
  const isDoubleElim = state.tournamentFormat === 'knockout_double';
  const isBilliards = state.gameType === 'billiards';
  const cleanPlayerName = (name: string) => (isBilliards ? name.replace(/\s*\([^)]*\)/g, '').trim() : name);

  const [doubleElimTab, setDoubleElimTab] = useState<'winners' | 'grand_final'>(() => {
    if (state.tournamentFormat !== 'knockout_double') return 'winners';
    const semiMatches = state.matches.filter(
      (m) =>
        m.stage === 'knockout' &&
        (m.knockoutRound === 'semi' ||
          m.knockoutRoundLabel?.includes('نیمه‌نهایی') ||
          m.roundLabel?.includes('نیمه‌نهایی')) &&
        (m.bracketType === 'winners' || !m.bracketType)
    );
    const isSemiDone =
      semiMatches.length > 0 && semiMatches.every((m) => m.isFinished && Boolean(m.winnerId));
    return isSemiDone ? 'grand_final' : 'winners';
  });
  const [viewMode, setViewMode] = useState<'grid3' | 'tree'>('grid3'); // Grid of 3 matches per row by default

  const knockoutMatches = useMemo(() => {
    return state.matches.filter((m) => m.stage === 'knockout');
  }, [state.matches]);

  // Check if semi-final round in winners bracket is completed
  const semiFinalMatches = useMemo(() => {
    return knockoutMatches.filter(
      (m) =>
        (m.knockoutRound === 'semi' ||
          m.knockoutRoundLabel?.includes('نیمه‌نهایی') ||
          m.roundLabel?.includes('نیمه‌نهایی')) &&
        (m.bracketType === 'winners' || !m.bracketType)
    );
  }, [knockoutMatches]);

  const hasGrandFinalMatch = useMemo(() => {
    return knockoutMatches.some(
      (m) => m.bracketType === 'grand_final' || m.knockoutRound === 'final'
    );
  }, [knockoutMatches]);

  const isSemiFinalCompleted = useMemo(() => {
    return (
      semiFinalMatches.length > 0 &&
      semiFinalMatches.every((m) => m.isFinished && Boolean(m.winnerId))
    );
  }, [semiFinalMatches]);

  const prevSemiCompletedRef = React.useRef(isSemiFinalCompleted);

  // Auto-switch to Grand Final tab when semi-finals are completed in winners bracket
  React.useEffect(() => {
    if (isDoubleElim) {
      if (isSemiFinalCompleted && !prevSemiCompletedRef.current) {
        if (!hasGrandFinalMatch && onAdvanceKnockoutRound) {
          onAdvanceKnockoutRound();
        }
        setDoubleElimTab('grand_final');
      }
      prevSemiCompletedRef.current = isSemiFinalCompleted;
    }
  }, [isSemiFinalCompleted, isDoubleElim, hasGrandFinalMatch, onAdvanceKnockoutRound]);

  const championPlayer = state.championId ? playersMap.get(state.championId) : null;
  const runnerUpPlayer = state.runnerUpId ? playersMap.get(state.runnerUpId) : null;
  const thirdPlayer = state.thirdPlaceId ? playersMap.get(state.thirdPlaceId) : null;

  // Active round progress check
  const activeRoundIndex = state.currentKnockoutRoundIndex || 1;
  const currentRoundMatches = knockoutMatches.filter(
    (m) => (m.roundIndex || 1) === activeRoundIndex && (!m.bracketType || m.bracketType === 'single' || m.bracketType === 'winners')
  );
  const isCurrentRoundFinished =
    currentRoundMatches.length > 0 && currentRoundMatches.every((m) => m.isFinished && m.winnerId);
  const isTournamentFinished = state.status === 'finished' || Boolean(state.championId);

  // Group matches by roundIndex
  const maxRound = Math.max(...knockoutMatches.map((m) => m.roundIndex || 1), 1);
  const roundsList: number[] = [];
  for (let r = 1; r <= maxRound; r++) {
    roundsList.push(r);
  }

  // Selected round filter for the 3-columns grid view
  const [selectedRoundFilter, setSelectedRoundFilter] = useState<string>('all');

  // Filter matches for Double Elimination view if applicable (losers bracket removed)
  const displayedMatches = useMemo(() => {
    if (!isDoubleElim) return knockoutMatches;
    return knockoutMatches.filter((m) => {
      if (doubleElimTab === 'winners') return m.bracketType === 'winners' || (!m.bracketType && m.knockoutRound !== 'final');
      return (
        m.bracketType === 'grand_final' ||
        m.bracketType === 'grand_final_reset' ||
        m.knockoutRound === 'final' ||
        m.knockoutRound === 'thirdPlace'
      );
    });
  }, [knockoutMatches, isDoubleElim, doubleElimTab]);

  return (
    <div className="space-y-6">
      {/* Champion Pedestal Banner (If final is played or tournament finished) */}
      {championPlayer ? (
        <div className={`card-stadium p-6 rounded-2xl border-2 ${
          isBilliards
            ? 'border-emerald-500/60 bg-gradient-to-b from-emerald-950/40 via-[#062417]/90 to-[#020e08]'
            : 'border-amber-500/50 bg-gradient-to-b from-amber-950/40 via-slate-900/90 to-slate-950'
        } shadow-2xl relative overflow-hidden`}>
          <div className={`absolute top-0 right-0 w-64 h-64 ${
            isBilliards ? 'bg-emerald-500/15' : 'bg-amber-500/10'
          } rounded-full blur-3xl pointer-events-none`} />
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4 text-center md:text-right">
              {/* Champion Avatar or Crown */}
              <div className={`relative w-16 h-16 rounded-2xl p-0.5 ${
                isBilliards
                  ? 'bg-gradient-to-tr from-emerald-500 to-teal-300 shadow-lg shadow-emerald-500/30'
                  : 'bg-gradient-to-tr from-amber-500 to-yellow-300 shadow-lg shadow-amber-500/30'
              } shrink-0`}>
                {championPlayer.avatarUrl ? (
                  <img
                    src={championPlayer.avatarUrl}
                    alt={cleanPlayerName(championPlayer.name)}
                    className="w-full h-full object-cover rounded-[14px]"
                  />
                ) : (
                  <div className={`w-full h-full ${isBilliards ? 'bg-[#03180e]' : 'bg-[#090d16]'} rounded-[14px] flex items-center justify-center`}>
                    {isBilliards ? (
                      <CircleDot className="w-9 h-9 text-emerald-400 animate-pulse" />
                    ) : (
                      <Crown className="w-9 h-9 text-amber-400 animate-bounce" />
                    )}
                  </div>
                )}
                <div className={`absolute -top-2 -right-2 ${isBilliards ? 'bg-emerald-500' : 'bg-amber-500'} text-slate-950 p-1 rounded-full shadow`}>
                  <Crown className="w-3.5 h-3.5" />
                </div>
              </div>

              <div>
                <span className={`text-xs uppercase tracking-widest ${isBilliards ? 'text-emerald-400' : 'text-amber-400'} font-bold`}>
                  {isBilliards ? (
                    state.tournamentFormat === 'knockout_single'
                      ? 'قهرمان مسابقات حذفی بیلیارد'
                      : state.tournamentFormat === 'knockout_double'
                      ? 'قهرمان مسابقات حذفی دوگانه بیلیارد'
                      : state.tournamentFormat === 'knockout_black'
                      ? 'قهرمان مسابقات بیلیارد (Black Mode)'
                      : 'قهرمان کاپ گروهی بیلیارد'
                  ) : (
                    state.tournamentFormat === 'knockout_single'
                      ? 'قهرمان مسابقات حذفی تک PES 2021'
                      : state.tournamentFormat === 'knockout_double'
                      ? 'قهرمان مسابقات حذفی دوگانه PES 2021 (Bo3)'
                      : state.tournamentFormat === 'knockout_black'
                      ? 'قهرمان مسابقات حالت بلک PES 2021'
                      : 'قهرمان کاپ گروهی PES 2021'
                  )}
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-0.5">
                  {cleanPlayerName(championPlayer.name)}
                </h2>
                {!isBilliards && championPlayer.team && (
                  <p className="text-sm text-slate-300 mt-0.5">
                    با تیم قدرتمند {championPlayer.team}
                  </p>
                )}
              </div>
            </div>

            {/* Podium Details & Open Celebration Modal */}
            <div className="flex items-center gap-4 flex-wrap justify-center text-xs">
              {runnerUpPlayer && (
                <div className={`px-4 py-2 ${
                  isBilliards ? 'bg-[#062417]/90 border-emerald-700/60' : 'bg-slate-900/80 border-slate-700'
                } border rounded-xl text-center flex items-center gap-2.5`}>
                  {runnerUpPlayer.avatarUrl && (
                    <img
                      src={runnerUpPlayer.avatarUrl}
                      alt={cleanPlayerName(runnerUpPlayer.name)}
                      className="w-7 h-7 rounded-lg object-cover"
                    />
                  )}
                  <div>
                    <span className={`text-[10px] ${isBilliards ? 'text-emerald-300/80' : 'text-slate-400'} block font-semibold`}>نایب قهرمان</span>
                    <span className="text-slate-200 font-bold">{cleanPlayerName(runnerUpPlayer.name)}</span>
                  </div>
                </div>
              )}

              {thirdPlayer && (
                <div className={`px-4 py-2 ${
                  isBilliards ? 'bg-[#062417]/90 border-emerald-700/60' : 'bg-slate-900/80 border-slate-700'
                } border rounded-xl text-center flex items-center gap-2.5`}>
                  {thirdPlayer.avatarUrl && (
                    <img
                      src={thirdPlayer.avatarUrl}
                      alt={cleanPlayerName(thirdPlayer.name)}
                      className="w-7 h-7 rounded-lg object-cover"
                    />
                  )}
                  <div>
                    <span className="text-[10px] text-amber-500/80 block font-semibold">مقام سوم</span>
                    <span className="text-slate-200 font-bold">{cleanPlayerName(thirdPlayer.name)}</span>
                  </div>
                </div>
              )}

              {onOpenCelebrationModal && (
                <button
                  type="button"
                  onClick={() => {
                    sound.playFanfare();
                    onOpenCelebrationModal();
                  }}
                  className="flex items-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-amber-400 to-yellow-300 hover:from-amber-300 hover:to-yellow-200 text-slate-950 font-bold rounded-xl shadow-lg shadow-amber-950/40 transition-all cursor-pointer"
                >
                  <Trophy className="w-4 h-4 text-slate-950" />
                  <span>مشاهده سکوی قهرمانی و عکس‌ها</span>
                </button>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="card-stadium p-4 rounded-xl border border-rose-950/80 flex items-center justify-between text-xs text-slate-400 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-rose-400" />
            <span className="text-slate-200 font-medium">
              {state.tournamentFormat === 'knockout_single'
                ? state.gameType === 'billiards'
                  ? 'مسابقات حذفی تک: با اولین باخت بازیکن کلاً حذف می‌شود. در صورت تساوی، بازی تکراری (یا فرمت Race to X) تعیین‌کننده است.'
                  : 'مسابقات حذفی تک: با اولین باخت بازیکن کلاً حذف می‌شود (تک‌بازی مستقیم / بدون Bo3). در صورت تساوی، پنالتی برنده را تعیین می‌کند.'
                : state.tournamentFormat === 'knockout_double'
                ? 'مسابقات حذفی دوگانه: مسابقات بهترین از ۳ بازی (Bo3) و با ۲ باخت حذف می‌شوند.'
                : state.tournamentFormat === 'knockout_black'
                ? state.blackModeSubsequentFormat
                  ? `حالت بلک: مرحله ۱ تک‌بازی بود؛ از مرحله ۲ تا فینال مسابقات به صورت ${state.blackModeSubsequentFormat === 'bo3' ? 'بهترین از ۳ بازی (Bo3)' : 'تک‌بازی مستقیم'} برگزار می‌شوند.`
                  : 'حالت بلک: مرحله اول تک‌بازی مستقیم، و در پایان مرحله اول فرمت مراحل بعد (تک‌بازی یا Bo3) توسط میزبان تعیین می‌شود.'
                : 'مسابقات حذفی به صورت تک‌حذفی (Single Elimination) برگزار می‌شود. برنده هر بازی به مرحله بعد صعود می‌کند.'}
            </span>
          </div>
          <span className="text-rose-400 font-bold">
            {state.tournamentFormat === 'knockout_single'
              ? 'شروع از ۱/۳۲ نهایی • قرعه‌کشی رندوم در پایان هر دور'
              : isDirectKnockout
              ? 'قرعه‌کشی رندوم در پایان هر دور'
              : state.gameType === 'billiards'
              ? 'در صورت تساوی، بازی تکراری (Race to X) تعیین‌کننده است'
              : 'در صورت تساوی، پنالتی تعیین‌کننده است'}
          </span>
        </div>
      )}

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
                    فینالیست دوم مشخص شد
                  </span>
                </h4>
                <p className="text-xs text-slate-300 mt-0.5">
                  اکنون می‌توانید بین برگزاری مسابقه فینال رسمی یا اعلام مستقیم قهرمان از روی جدول تصمیم‌گیری کنید.
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
              <span>تصمیم‌گیری فینال لیگ 🏆</span>
            </button>
          </div>
        )}

      {/* Prominent Next Round Redraw Banner (when active round finished and tournament not finished) */}
      {state.groups?.length !== 1 && isDirectKnockout && isCurrentRoundFinished && !isTournamentFinished && (
        <div className="card-stadium p-4 sm:p-5 rounded-2xl border-2 border-emerald-500/80 bg-gradient-to-r from-emerald-950/90 via-[#0e1d15] to-emerald-950/90 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-4 animate-fade-in">
          <div className="flex items-center gap-3.5 text-center md:text-right">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center text-emerald-400 shrink-0">
              <CheckCircle2 className="w-7 h-7 text-emerald-400" />
            </div>
            <div>
              <h4 className="text-sm sm:text-base font-extrabold text-white flex items-center gap-2 justify-center md:justify-start">
                <span>تمام مسابقات مرحله {activeRoundIndex} به پایان رسید!</span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/40">
                  آماده قرعه‌کشی مرحله بعد
                </span>
              </h4>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                اسامی برندگان صعودکننده در استخر قرعه‌کشی قرار گرفتند. برای جفت‌سازی تصادفی (Fisher-Yates) و آغاز مرحله جدید کلیک کنید.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              sound.playWhistle();
              onAdvanceKnockoutRound?.();
            }}
            className="px-6 py-3 bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-sm rounded-xl shadow-xl shadow-emerald-950/60 flex items-center gap-2.5 transition-all cursor-pointer shrink-0 animate-pulse hover:scale-105"
          >
            <Dices className="w-5 h-5 text-slate-950" />
            <span>قرعه‌کشی و شروع مرحله {activeRoundIndex + 1}</span>
          </button>
        </div>
      )}

      {/* Double Elimination Sub-tabs if applicable */}
      {isDoubleElim && (
        <div className="flex items-center gap-2 p-1.5 bg-app-surface border border-app-border rounded-xl">
          <button
            type="button"
            onClick={() => setDoubleElimTab('winners')}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              doubleElimTab === 'winners'
                ? 'bg-app-primary/20 border border-app-primary text-app-text shadow'
                : 'text-app-text-muted hover:text-app-text'
            }`}
          >
            <GitBranch className="w-3.5 h-3.5" />
            <span>براکت برندگان (Winners Bracket)</span>
          </button>
          <button
            type="button"
            onClick={() => setDoubleElimTab('grand_final')}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              doubleElimTab === 'grand_final'
                ? 'bg-app-primary/20 border border-app-primary text-app-text shadow'
                : 'text-app-text-muted hover:text-app-text'
            }`}
          >
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <span>فینال کل (Grand Final)</span>
          </button>
        </div>
      )}

      {/* View Toolbar: 3-per-row grid vs tree, plus round selector chips */}
      <div className="card-stadium p-4 rounded-2xl border border-app-border space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-app-primary" />
            <h3 className="font-bold text-sm sm:text-base text-app-text">
              {isDirectKnockout
                ? 'براکت مسابقات حذفی (نمایش ۳ مسابقه در هر سطر)'
                : 'نمودار درختی مرحله حذفی'}
            </h3>
          </div>

          {/* View mode toggle */}
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-app-bg p-0.5 rounded-lg border border-app-border text-xs">
              <button
                type="button"
                onClick={() => {
                  sound.playClick();
                  setViewMode('grid3');
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-bold transition-colors cursor-pointer ${
                  viewMode === 'grid3'
                    ? 'bg-app-primary text-white shadow-sm'
                    : 'text-app-text-muted hover:text-app-text'
                }`}
                title="نمایش ۳ مسابقه در هر ردیف برای ثبت سریع نتیجه"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>۳ مسابقه در هر ردیف</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  sound.playClick();
                  setViewMode('tree');
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-bold transition-colors cursor-pointer ${
                  viewMode === 'tree'
                    ? 'bg-app-primary text-white shadow-sm'
                    : 'text-app-text-muted hover:text-app-text'
                }`}
                title="نمایش درختی افقی مراحل"
              >
                <Maximize2 className="w-3.5 h-3.5" />
                <span>نمای درختی افقی</span>
              </button>
            </div>
          </div>
        </div>

        {/* Round selector chips (Hidden in Grand Final tab) */}
        {roundsList.length > 1 && (!isDoubleElim || doubleElimTab !== 'grand_final') && (
          <div className="flex items-center gap-1.5 overflow-x-auto pt-2 border-t border-app-border pb-1 text-xs">
            <span className="text-app-text-muted text-xs font-semibold pl-1 shrink-0">فیلتر مرحله:</span>
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
              همه مراحل ({displayedMatches.length})
            </button>

            {roundsList.map((rIndex) => {
              const matchesInRound = displayedMatches.filter((m) => (m.roundIndex || 1) === rIndex);
              if (matchesInRound.length === 0) return null;
              const firstM = matchesInRound[0];
              const roundLabel = firstM.knockoutRoundLabel || firstM.roundLabel || `مرحله ${rIndex}`;
              const isSelected = selectedRoundFilter === String(rIndex);
              const isActive = activeRoundIndex === rIndex;
              const isDone = matchesInRound.every((m) => m.isFinished);

              return (
                <button
                  key={rIndex}
                  type="button"
                  onClick={() => {
                    sound.playClick();
                    setSelectedRoundFilter(String(rIndex));
                  }}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                    isSelected
                      ? 'bg-app-primary text-white shadow-sm ring-1 ring-app-primary'
                      : isActive
                      ? 'bg-app-primary/20 text-app-primary border border-app-primary/40'
                      : 'bg-app-bg text-app-text-muted hover:text-app-text border border-app-border'
                  }`}
                >
                  <span>{roundLabel}</span>
                  <span className="text-[10px] opacity-80 font-mono">({matchesInRound.length})</span>
                  {isDone && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
                  {isActive && !isDone && (
                    <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block animate-ping" />
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Main Matches Presentation: 3 Matches Per Row by Round */}
      {viewMode === 'grid3' ? (
        <div className="space-y-8">
          {doubleElimTab === 'grand_final' && displayedMatches.length === 0 && (
            <div className="card-stadium p-8 rounded-2xl border border-app-border bg-app-surface text-center space-y-3">
              <Trophy className="w-12 h-12 text-amber-400/60 mx-auto" />
              <h4 className="text-base font-bold text-app-text">در انتظار مشخص شدن فینالیست‌ها</h4>
              <p className="text-xs text-app-text-muted max-w-md mx-auto">
                با ثبت نتایج مرحله نیمه‌نهایی در براکت برندگان، فینالیست‌های مسابقه نهایی به صورت خودکار مشخص شده و در این بخش نمایش داده می‌شوند.
              </p>
            </div>
          )}

          {roundsList.map((rIndex) => {
            if (
              (!isDoubleElim || doubleElimTab !== 'grand_final') &&
              selectedRoundFilter !== 'all' &&
              selectedRoundFilter !== String(rIndex)
            ) {
              return null;
            }

            const matchesInRound = displayedMatches.filter((m) => (m.roundIndex || 1) === rIndex);
            if (matchesInRound.length === 0) return null;

            const firstMatch = matchesInRound[0];
            const roundTitle =
              firstMatch.knockoutRoundLabel || firstMatch.roundLabel || `مرحله ${rIndex}`;
            const isCurrentActive = activeRoundIndex === rIndex;
            const finishedInRound = matchesInRound.filter((m) => m.isFinished).length;
            const isRoundDone = finishedInRound === matchesInRound.length;

            return (
              <div
                key={rIndex}
                className="card-stadium p-5 sm:p-6 rounded-2xl border border-app-border bg-app-surface space-y-4"
              >
                {/* Round Header Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-rose-950/70 pb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                        firstMatch.knockoutRound === 'final'
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/50'
                          : isCurrentActive
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/50'
                          : 'bg-slate-800/60 text-slate-400 border border-slate-700'
                      }`}
                    >
                      {rIndex}
                    </div>

                    <div>
                      <h4 className="text-base font-extrabold text-white flex items-center gap-2">
                        <span>{roundTitle}</span>
                        {isRoundDone && (
                          <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/40 font-normal">
                            تکمیل شده
                          </span>
                        )}
                        {isCurrentActive && !isRoundDone && (
                          <span className="text-[10px] bg-rose-500/20 text-rose-300 px-2 py-0.5 rounded-full border border-rose-500/40 font-normal">
                            مرحله در حال برگزاری
                          </span>
                        )}
                      </h4>
                      <p className="text-xs text-slate-400">
                        {matchesInRound.length} مسابقه • {finishedInRound} مسابقه به پایان رسیده
                      </p>
                    </div>
                  </div>

                  {/* Progress Indicator */}
                  <div className="flex items-center gap-3 self-end sm:self-auto">
                    <div className="text-left text-xs">
                      <span className="font-mono text-white font-bold">{finishedInRound}</span>
                      <span className="text-slate-500"> / </span>
                      <span className="font-mono text-slate-400">{matchesInRound.length}</span>
                    </div>
                    <div className="w-24 sm:w-32 bg-app-bg rounded-full h-2 overflow-hidden border border-app-border">
                      <div
                        className="bg-gradient-to-r from-app-primary to-emerald-400 h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${(finishedInRound / matchesInRound.length) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Matches Grid: Exactly 3 matches per row on desktop (grid-cols-1 md:grid-cols-2 lg:grid-cols-3) */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4.5 pt-1">
                  {matchesInRound.map((match) => (
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
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Horizontal Tree Bracket (Optional Alternate View) */
        <div className="card-stadium p-6 rounded-2xl border border-app-border overflow-x-auto">
          <div className="min-w-[850px] space-y-6">
            <div className="flex items-center justify-between border-b border-app-border pb-3">
              <h3 className="font-bold text-sm text-app-text flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-app-primary" />
                <span>نمودار درختی افقی مراحل مسابقات</span>
              </h3>
              <span className="text-xs text-app-text-muted">
                از راست به چپ: ترتیب مراحل مسابقات تا رسیدن به فینال
              </span>
            </div>

            <div className="grid grid-flow-col auto-cols-[320px] gap-8 items-start py-4">
              {roundsList.map((rIndex) => {
                const matchesInRound = displayedMatches.filter((m) => (m.roundIndex || 1) === rIndex);
                if (matchesInRound.length === 0) return null;

                const firstMatch = matchesInRound[0];
                const roundTitle =
                  firstMatch.knockoutRoundLabel || firstMatch.roundLabel || `مرحله ${rIndex}`;
                const isCurrentActive = activeRoundIndex === rIndex;

                return (
                  <div key={rIndex} className="space-y-4">
                    <div
                      className={`text-center font-bold text-xs py-2 px-3 rounded-xl border flex items-center justify-between ${
                        firstMatch.knockoutRound === 'final'
                          ? 'bg-gradient-to-r from-amber-950 to-yellow-950 border-amber-500/80 text-amber-300'
                          : isCurrentActive
                          ? 'bg-app-primary/20 border-app-primary text-app-text ring-1 ring-app-primary/50'
                          : 'bg-app-surface border-app-border text-app-text-muted'
                      }`}
                    >
                      <span className="font-bold">{roundTitle}</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-app-bg text-app-primary border border-app-border">
                        {matchesInRound.length} مسابقه
                      </span>
                    </div>

                    <div className="space-y-4">
                      {matchesInRound.map((match) => (
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
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

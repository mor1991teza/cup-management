import React from 'react';
import { TournamentState, Player, Match } from '../types/tournament';
import {
  X,
  Trophy,
  CheckCircle2,
  XCircle,
  Clock,
  Dices,
  GitBranch,
  Shield,
  Crown,
  Medal,
  ChevronLeft,
  Sparkles,
} from 'lucide-react';
import { sound } from '../utils/audio';
import { calculateKnockoutTree, getKnockoutRoundPersianLabel } from '../utils/tournament';

interface PlayerProgressionModalProps {
  playerId: string | null;
  onClose: () => void;
  state: TournamentState;
  playersMap: Map<string, Player>;
}

interface ProgressionStep {
  stageId: string;
  stageName: string;
  stageType: 'group' | 'knockout';
  roundIndex?: number;
  match?: Match;
  status: 'won' | 'lost' | 'current' | 'future_tbd' | 'future_fixed';
  opponentName?: string;
  opponentTeam?: string;
  opponentUniqueId?: string;
  opponentAvatar?: string;
  scoreText?: string;
  isBye?: boolean;
  notes?: string;
}

export const PlayerProgressionModal: React.FC<PlayerProgressionModalProps> = ({
  playerId,
  onClose,
  state,
  playersMap,
}) => {
  if (!playerId) return null;

  const player = playersMap.get(playerId);
  if (!player) return null;

  const isBilliards = state.gameType === 'billiards';
  const cleanPlayerName = (name: string) => (isBilliards ? name.replace(/\s*\([^)]*\)/g, '').trim() : name);

  // 1. All matches played by this player
  const playerMatches = state.matches.filter(
    (m) => m.homePlayerId === playerId || m.awayPlayerId === playerId || m.waitPlayerId === playerId
  );

  // Group matches vs Knockout matches
  const groupMatches = playerMatches.filter((m) => m.stage === 'group');
  const knockoutMatches = playerMatches.filter((m) => m.stage === 'knockout');

  // Stats calculation
  let totalPlayed = 0;
  let totalWon = 0;
  let totalLost = 0;
  let totalGoalsFor = 0;
  let totalGoalsAgainst = 0;

  playerMatches.forEach((m) => {
    if (!m.isFinished) return;
    totalPlayed++;
    const isHome = m.homePlayerId === playerId;
    const myScore = isHome ? m.homeScore || 0 : m.awayScore || 0;
    const oppScore = isHome ? m.awayScore || 0 : m.homeScore || 0;
    totalGoalsFor += myScore;
    totalGoalsAgainst += oppScore;

    if (m.winnerId === playerId) {
      totalWon++;
    } else if (m.winnerId) {
      totalLost++;
    } else if (myScore > oppScore) {
      totalWon++;
    } else if (oppScore > myScore) {
      totalLost++;
    }
  });

  // Check tournament final outcome
  const isChampion = state.championId === playerId;
  const isRunnerUp = state.runnerUpId === playerId;
  const isThirdPlace = state.thirdPlaceId === playerId;

  // Check if player has been eliminated in knockout
  const lostKnockoutMatch = knockoutMatches.find(
    (m) =>
      m.isFinished &&
      m.winnerId &&
      m.winnerId !== playerId &&
      m.knockoutRound !== 'semi' && // semi losers might go to 3rd place
      m.knockoutRound !== 'thirdPlace'
  );
  const lostThirdPlace = knockoutMatches.find(
    (m) => m.knockoutRound === 'thirdPlace' && m.isFinished && m.winnerId && m.winnerId !== playerId
  );
  const isEliminated = Boolean(lostKnockoutMatch || lostThirdPlace);

  // 2. Build full stepped progression path
  const steps: ProgressionStep[] = [];

  // Group stage step (if applicable)
  if (state.tournamentFormat === 'group_knockout' || state.groups.length > 0) {
    const playerGroup = state.groups.find((g) => g.playerIds.includes(playerId));
    if (playerGroup) {
      const gMatches = groupMatches.filter((m) => m.groupId === playerGroup.id);
      const finishedCount = gMatches.filter((m) => m.isFinished).length;
      const allGroupDone = gMatches.length > 0 && finishedCount === gMatches.length;

      // Group matches summary
      let groupWins = 0;
      let groupLosses = 0;
      let groupDraws = 0;
      gMatches.forEach((gm) => {
        if (!gm.isFinished) return;
        if (gm.winnerId === playerId) groupWins++;
        else if (gm.winnerId) groupLosses++;
        else {
          const isH = gm.homePlayerId === playerId;
          const s1 = isH ? gm.homeScore || 0 : gm.awayScore || 0;
          const s2 = isH ? gm.awayScore || 0 : gm.homeScore || 0;
          if (s1 > s2) groupWins++;
          else if (s2 > s1) groupLosses++;
          else groupDraws++;
        }
      });

      steps.push({
        stageId: 'group-stage',
        stageName: `مرحله گروهی (${playerGroup.name})`,
        stageType: 'group',
        status: allGroupDone ? (groupWins >= groupLosses ? 'won' : 'lost') : 'current',
        opponentName: `${gMatches.length} مسابقه دوره‌ای`,
        scoreText: `${groupWins} برد • ${groupDraws} مساوی • ${groupLosses} باخت`,
        notes: allGroupDone ? 'مرحله گروهی با موفقیت به پایان رسید' : `در حال برگزاری (${finishedCount} از ${gMatches.length} بازی)`,
      });
    }
  }

  // Knockout stages calculation
  const isPlayInRange = state.players.length > 64 && state.players.length <= 128;
  const totalRounds =
    state.totalKnockoutRounds ||
    (isPlayInRange ? 6 : calculateKnockoutTree(state.players.length).totalRounds);
  const activeRoundIndex = state.currentKnockoutRoundIndex || 1;

  // Track each knockout round
  const maxKoRounds = Math.max(
    totalRounds,
    Math.max(...state.matches.filter((m) => m.stage === 'knockout').map((m) => m.roundIndex || 1), 1)
  );

  for (let r = 1; r <= maxKoRounds; r++) {
    const roundsFromEnd = maxKoRounds - r;
    const roundPersianLabel =
      roundsFromEnd === 0
        ? 'فینال و رده‌بندی'
        : roundsFromEnd === 1
        ? 'نیمه‌نهایی'
        : getKnockoutRoundPersianLabel(Math.pow(2, roundsFromEnd + 1));

    // Find if player has a match in this round
    const matchInRound = knockoutMatches.find((m) => (m.roundIndex || 1) === r);

    if (matchInRound) {
      const isHome = matchInRound.homePlayerId === playerId;
      const opponentId = isHome ? matchInRound.awayPlayerId : matchInRound.homePlayerId;
      const opponent = opponentId ? playersMap.get(opponentId) : null;
      const myScore = isHome ? matchInRound.homeScore : matchInRound.awayScore;
      const oppScore = isHome ? matchInRound.awayScore : matchInRound.homeScore;

      let scoreDisplay = '';
      if (matchInRound.isBo3) {
        const myWins = isHome ? matchInRound.homeGamesWon || 0 : matchInRound.awayGamesWon || 0;
        const oppWins = isHome ? matchInRound.awayGamesWon || 0 : matchInRound.homeGamesWon || 0;
        scoreDisplay = `${myWins} - ${oppWins} (Bo3)`;
      } else if (matchInRound.isFinished && myScore !== null && oppScore !== null) {
        scoreDisplay = `${myScore} - ${oppScore}`;
        if (matchInRound.hasPenalties) {
          const myPen = isHome ? matchInRound.homePenaltyScore : matchInRound.awayPenaltyScore;
          const oppPen = isHome ? matchInRound.awayPenaltyScore : matchInRound.homePenaltyScore;
          scoreDisplay += ` (پنالتی: ${myPen} - ${oppPen})`;
        }
      }

      const isWon = matchInRound.isFinished && matchInRound.winnerId === playerId;
      const isLost = matchInRound.isFinished && matchInRound.winnerId !== playerId;

      steps.push({
        stageId: matchInRound.id,
        stageName: matchInRound.roundLabel || matchInRound.knockoutRoundLabel || roundPersianLabel,
        stageType: 'knockout',
        roundIndex: r,
        match: matchInRound,
        status: isWon ? 'won' : isLost ? 'lost' : 'current',
        opponentName: opponent
          ? cleanPlayerName(opponent.name)
          : (isHome ? matchInRound.awaySeedLabel : matchInRound.homeSeedLabel) || 'در انتظار تعیین حریف',
        opponentTeam: opponent?.team,
        opponentUniqueId: opponent?.uniqueId,
        opponentAvatar: opponent?.avatarUrl,
        scoreText: scoreDisplay,
        notes: isWon
          ? 'پیروزی و صعود به دور بعد 🏆'
          : isLost
          ? (matchInRound.knockoutRound === 'semi' ? 'انتقال به مسابقه رده‌بندی' : 'حذف از مسابقات')
          : 'مسابقه در حال برگزاری',
      });
    } else {
      // Player does NOT have a match in this round yet
      // Check if player is already eliminated
      if (isEliminated) {
        // Stop rendering future stages if already eliminated before this round
        break;
      }

      // If player won previous knockout round or is still active, show future TBD / Fixed stage
      const isRedrawRound = roundsFromEnd >= 2;
      const isSemi = roundsFromEnd === 1;
      const isFinal = roundsFromEnd === 0;

      if (isRedrawRound) {
        steps.push({
          stageId: `future-r${r}`,
          stageName: roundPersianLabel,
          stageType: 'knockout',
          roundIndex: r,
          status: 'future_tbd',
          opponentName: 'TBD • در انتظار قرعه‌کشی رندوم',
          notes: 'حریف پس از قرعه‌کشی مرحله جدید مشخص خواهد شد',
        });
      } else if (isSemi) {
        steps.push({
          stageId: `future-semi`,
          stageName: 'مرحله نیمه‌نهایی',
          stageType: 'knockout',
          roundIndex: r,
          status: 'future_fixed',
          opponentName: 'برنده بازی مرحله یک‌چهارم',
          notes: 'مسابقه ثابت طبق نمودار براکت حذفی',
        });
      } else if (isFinal) {
        steps.push({
          stageId: `future-final`,
          stageName: 'فینال و رده‌بندی',
          stageType: 'knockout',
          roundIndex: r,
          status: 'future_fixed',
          opponentName: 'فینال قهرمانی یا دیدار رده‌بندی',
          notes: 'تعیین قهرمان و سکوی برترین‌های مسابقات',
        });
      }
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="card-stadium w-full max-w-2xl max-h-[92vh] bg-[#0c1424]/95 border-2 border-emerald-500/40 rounded-3xl shadow-2xl overflow-hidden flex flex-col text-slate-100 animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header Bar with Glassmorphism */}
        <div className="p-5 sm:p-6 border-b border-white/10 bg-gradient-to-r from-emerald-950/80 via-slate-900/90 to-teal-950/80 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-0.5 shadow-lg shadow-emerald-500/30 flex items-center justify-center shrink-0">
              {player.avatarUrl ? (
                <img
                  src={player.avatarUrl}
                  alt={player.name}
                  className="w-full h-full object-cover rounded-[14px]"
                />
              ) : (
                <div className="w-full h-full bg-[#08121a] rounded-[14px] flex items-center justify-center">
                  <GitBranch className="w-6 h-6 text-emerald-400" />
                </div>
              )}
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-lg sm:text-xl font-extrabold text-white">
                  {cleanPlayerName(player.name)}
                </h3>
                {player.uniqueId && (
                  <span className="text-xs font-mono px-2 py-0.5 rounded-md bg-white/10 text-white font-semibold border border-white/20">
                    ID: {player.uniqueId}
                  </span>
                )}
                {/* Status Badge */}
                {isChampion ? (
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/50 font-black flex items-center gap-1">
                    <Crown className="w-3.5 h-3.5 text-amber-400" />
                    <span>قهرمان تورنمنت 🏆</span>
                  </span>
                ) : isRunnerUp ? (
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-400/20 text-slate-200 border border-slate-400/50 font-bold flex items-center gap-1">
                    <Medal className="w-3.5 h-3.5 text-slate-300" />
                    <span>نایب قهرمان 🥈</span>
                  </span>
                ) : isThirdPlace ? (
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-700/20 text-amber-200 border border-amber-700/50 font-bold flex items-center gap-1">
                    <Medal className="w-3.5 h-3.5 text-amber-500" />
                    <span>مقام سوم 🥉</span>
                  </span>
                ) : isEliminated ? (
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 font-semibold">
                    حذف شده
                  </span>
                ) : (
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
                    <span>در حال رقابت</span>
                  </span>
                )}
              </div>

              {!isBilliards && player.team && (
                <div className="text-xs text-slate-300 mt-0.5 flex items-center gap-1.5">
                  <Shield className="w-3 h-3 text-slate-400" />
                  <span>تیم: {player.team}</span>
                </div>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-all cursor-pointer"
            title="بستن پنجره"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Stats Bar */}
        <div className="grid grid-cols-4 gap-2 p-3 sm:p-4 bg-slate-950/60 border-b border-white/5 text-center text-xs">
          <div className="p-2 rounded-xl bg-white/5 border border-white/5">
            <span className="text-slate-400 text-[11px] block">بازی‌ها</span>
            <span className="text-sm font-black font-mono text-white">{totalPlayed}</span>
          </div>
          <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
            <span className="text-emerald-400 text-[11px] block">برد</span>
            <span className="text-sm font-black font-mono text-emerald-400">{totalWon}</span>
          </div>
          <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20">
            <span className="text-rose-400 text-[11px] block">باخت</span>
            <span className="text-sm font-black font-mono text-rose-400">{totalLost}</span>
          </div>
          <div className="p-2 rounded-xl bg-teal-500/10 border border-teal-500/20">
            <span className="text-teal-400 text-[11px] block">{isBilliards ? 'تفاضل فریم' : 'تفاضل گل'}</span>
            <span
              className={`text-sm font-black font-mono ${
                totalGoalsFor - totalGoalsAgainst > 0
                  ? 'text-emerald-400'
                  : totalGoalsFor - totalGoalsAgainst < 0
                  ? 'text-rose-400'
                  : 'text-slate-300'
              }`}
            >
              {totalGoalsFor - totalGoalsAgainst > 0 ? `+${totalGoalsFor - totalGoalsAgainst}` : totalGoalsFor - totalGoalsAgainst}
            </span>
          </div>
        </div>

        {/* Stepped Timeline Body (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>فلوچارت مسیر صعود تا فینال</span>
            </h4>
            <span className="text-xs text-slate-400">از مرحله اول تا مسابقه پایانی</span>
          </div>

          <div className="relative border-r-2 border-emerald-500/30 mr-3 sm:mr-4 pr-5 sm:pr-7 space-y-5">
            {steps.map((step, idx) => {
              const isLast = idx === steps.length - 1;

              // Step Icon & Color
              let circleBg = 'bg-slate-800 border-slate-600 text-slate-400';
              let icon = <Clock className="w-4 h-4" />;

              if (step.status === 'won') {
                circleBg = 'bg-emerald-500 border-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/30';
                icon = <CheckCircle2 className="w-4 h-4" />;
              } else if (step.status === 'lost') {
                circleBg = 'bg-rose-500 border-rose-400 text-white shadow-lg shadow-rose-500/30';
                icon = <XCircle className="w-4 h-4" />;
              } else if (step.status === 'current') {
                circleBg = 'bg-amber-500 border-amber-400 text-slate-950 animate-pulse shadow-lg shadow-amber-500/40';
                icon = <Clock className="w-4 h-4" />;
              } else if (step.status === 'future_tbd') {
                circleBg = 'bg-slate-900 border-slate-700 text-slate-400 border-dashed';
                icon = <Dices className="w-4 h-4" />;
              } else if (step.status === 'future_fixed') {
                circleBg = 'bg-slate-900 border-amber-500/50 text-amber-400 border-dashed';
                icon = <Trophy className="w-4 h-4" />;
              }

              return (
                <div key={step.stageId} className="relative group animate-fade-in">
                  {/* Step Marker on the Right Axis */}
                  <div
                    className={`absolute -right-[31px] sm:-right-[39px] top-3 w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${circleBg}`}
                  >
                    {icon}
                  </div>

                  {/* Step Card Content */}
                  <div
                    className={`p-4 rounded-2xl border transition-all ${
                      step.status === 'won'
                        ? 'bg-emerald-950/30 border-emerald-500/30 hover:border-emerald-500/50'
                        : step.status === 'lost'
                        ? 'bg-rose-950/30 border-rose-500/30'
                        : step.status === 'current'
                        ? 'bg-amber-950/30 border-amber-500/40 shadow-lg shadow-amber-500/10'
                        : 'bg-slate-900/40 border-white/5 opacity-75'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/5 pb-2 mb-2.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-extrabold text-white">{step.stageName}</span>
                        {step.status === 'won' && (
                          <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/40 font-bold">
                            پیروزی ✓
                          </span>
                        )}
                        {step.status === 'lost' && (
                          <span className="text-[10px] bg-rose-500/20 text-rose-300 px-2 py-0.5 rounded-full border border-rose-500/40 font-bold">
                            شکست ✗
                          </span>
                        )}
                        {step.status === 'current' && (
                          <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/40 font-bold animate-pulse">
                            در جریان
                          </span>
                        )}
                        {step.status === 'future_tbd' && (
                          <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full border border-dashed border-slate-700">
                            در انتظار قرعه‌کشی
                          </span>
                        )}
                        {step.status === 'future_fixed' && (
                          <span className="text-[10px] bg-amber-500/10 text-amber-300 px-2 py-0.5 rounded-full border border-dashed border-amber-500/30">
                            مرحله فینال
                          </span>
                        )}
                      </div>

                      {step.scoreText && (
                        <span className="text-xs font-mono font-bold text-emerald-400 bg-black/40 px-2 py-0.5 rounded-lg border border-white/10 self-start sm:self-auto">
                          {step.scoreText}
                        </span>
                      )}
                    </div>

                    {/* Opponent & Match Details */}
                    <div className="flex items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-2.5">
                        <span className="text-slate-400 text-[11px]">حریف:</span>
                        <div className="flex items-center gap-1.5">
                          {step.opponentAvatar && (
                            <img
                              src={step.opponentAvatar}
                              alt={step.opponentName}
                              className="w-5 h-5 rounded object-cover"
                            />
                          )}
                          <span
                            className={`font-bold ${
                              step.status === 'future_tbd' || step.status === 'future_fixed'
                                ? 'text-slate-400 font-mono italic opacity-75'
                                : 'text-slate-100'
                            }`}
                          >
                            {step.opponentName}
                          </span>
                          {step.opponentUniqueId && (
                            <span className="text-[10px] font-mono text-slate-400">
                              ({step.opponentUniqueId})
                            </span>
                          )}
                          {!isBilliards && step.opponentTeam && (
                            <span className="text-[10px] text-slate-400">
                              - تیم {step.opponentTeam}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {step.notes && (
                      <p className="text-[11px] text-slate-400 mt-2 pt-2 border-t border-white/5 leading-relaxed">
                        {step.notes}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-white/10 bg-slate-950/80 flex items-center justify-between gap-3 text-xs">
          <span className="text-slate-400">
            مسیر صعود زنده • بروزرسانی خودکار با ثبت نتایج مسابقات
          </span>
          <button
            type="button"
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="px-5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold transition-all cursor-pointer"
          >
            بستن
          </button>
        </div>
      </div>
    </div>
  );
};

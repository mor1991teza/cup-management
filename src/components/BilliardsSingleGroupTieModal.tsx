import React from 'react';
import { Player, GroupStanding, Match, BilliardsFormat } from '../types/tournament';
import { Trophy, Swords, Scale, Zap, Flame, X, CheckCircle, AlertTriangle } from 'lucide-react';

interface BilliardsSingleGroupTieModalProps {
  isOpen: boolean;
  onClose: () => void;
  rank2: GroupStanding;
  rank3: GroupStanding;
  playersMap: Map<string, Player>;
  directMatch?: Match;
  onSelectHeadToHead: (winnerId: string, loserId: string) => void;
  onSelectPlayoffMatch: (format: BilliardsFormat) => void;
}

export const BilliardsSingleGroupTieModal: React.FC<BilliardsSingleGroupTieModalProps> = ({
  isOpen,
  onClose,
  rank2,
  rank3,
  playersMap,
  directMatch,
  onSelectHeadToHead,
  onSelectPlayoffMatch,
}) => {
  if (!isOpen) return null;

  const player2 = playersMap.get(rank2.playerId);
  const player3 = playersMap.get(rank3.playerId);

  const cleanName2 = rank2.playerName.replace(/\s*\([^)]*\)/g, '').trim();
  const cleanName3 = rank3.playerName.replace(/\s*\([^)]*\)/g, '').trim();

  // مشخص کردن برنده بازی رو در رو
  let directWinnerId: string | null = null;
  let directLoserId: string | null = null;
  let directWinnerName = '';
  let directScoreText = '';

  if (directMatch && directMatch.homeScore !== null && directMatch.awayScore !== null) {
    if (directMatch.homeScore > directMatch.awayScore) {
      directWinnerId = directMatch.homePlayerId;
      directLoserId = directMatch.awayPlayerId;
    } else if (directMatch.awayScore > directMatch.homeScore) {
      directWinnerId = directMatch.awayPlayerId;
      directLoserId = directMatch.homePlayerId;
    }

    if (directWinnerId) {
      directWinnerName = directWinnerId === rank2.playerId ? cleanName2 : cleanName3;
      const hScore = directMatch.homeScore;
      const aScore = directMatch.awayScore;
      directScoreText = `${hScore} - ${aScore}`;
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg bg-gradient-to-b from-slate-900/95 via-emerald-950/40 to-slate-950/95 border border-emerald-500/30 rounded-3xl p-6 sm:p-7 shadow-2xl shadow-emerald-950/60 text-white overflow-hidden backdrop-blur-xl">
        {/* Glow Accents */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-teal-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 left-4 p-2 text-slate-400 hover:text-white rounded-full bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="text-center space-y-2 mb-5">
          <div className="inline-flex p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 mb-1 shadow-inner">
            <Scale className="w-8 h-8 text-amber-400 animate-pulse" />
          </div>
          <h3 className="text-lg sm:text-xl font-black text-white tracking-wide">
            تساوی امتیاز برای مقام دوم بیلیارد
          </h3>
          <p className="text-xs sm:text-sm text-emerald-200/90 leading-relaxed max-w-md mx-auto">
            بازیکنان <strong className="text-emerald-300 font-bold">{cleanName2}</strong> و <strong className="text-teal-300 font-bold">{cleanName3}</strong> دارای امتیاز مساوی (<span className="font-mono font-bold text-amber-300">{rank2.points} امتیاز</span>) برای جایگاه دوم و صعود به فینال هستند.
          </p>
        </div>

        {/* Tied Players Comparison Cards */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          <div className="bg-emerald-950/30 border border-emerald-500/30 rounded-2xl p-3 text-center">
            <div className="text-xs text-emerald-400 font-mono font-bold">رتبه دوم جدول</div>
            <div className="font-black text-sm text-white truncate mt-1">{cleanName2}</div>
            <div className="mt-2 text-[11px] font-mono text-slate-300 flex items-center justify-center gap-1.5 pt-1.5 border-t border-white/10">
              <span className="text-amber-300 font-bold">{rank2.points} امتیاز</span>
              <span>·</span>
              <span>تفاضل {rank2.goalDifference > 0 ? `+${rank2.goalDifference}` : rank2.goalDifference}</span>
            </div>
          </div>

          <div className="bg-teal-950/30 border border-teal-500/30 rounded-2xl p-3 text-center">
            <div className="text-xs text-teal-400 font-mono font-bold">رتبه سوم جدول</div>
            <div className="font-black text-sm text-white truncate mt-1">{cleanName3}</div>
            <div className="mt-2 text-[11px] font-mono text-slate-300 flex items-center justify-center gap-1.5 pt-1.5 border-t border-white/10">
              <span className="text-amber-300 font-bold">{rank3.points} امتیاز</span>
              <span>·</span>
              <span>تفاضل {rank3.goalDifference > 0 ? `+${rank3.goalDifference}` : rank3.goalDifference}</span>
            </div>
          </div>
        </div>

        {/* Head-to-head info box */}
        {directWinnerId && (
          <div className="mb-5 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>نتیجه بازی رو در رو در گروه:</span>
            </div>
            <div className="font-bold text-emerald-300 font-mono">
              برتری {directWinnerName} ({directScoreText})
            </div>
          </div>
        )}

        {/* 4 Decision Options */}
        <div className="space-y-2.5">
          <div className="text-xs font-bold text-slate-300 mb-1">
            نحوه تعیین صعودکننده دوم را انتخاب کنید:
          </div>

          {/* Option 1: Head to Head */}
          <button
            onClick={() => {
              if (directWinnerId && directLoserId) {
                onSelectHeadToHead(directWinnerId, directLoserId);
              } else {
                // در صورت تساوی بازی رو در رو، بر اساس تفاضل بهتر
                const wId = rank2.goalDifference >= rank3.goalDifference ? rank2.playerId : rank3.playerId;
                const lId = wId === rank2.playerId ? rank3.playerId : rank2.playerId;
                onSelectHeadToHead(wId, lId);
              }
            }}
            className="w-full p-3.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-emerald-500/30 hover:border-emerald-400/60 text-white font-bold text-xs sm:text-sm flex items-center justify-between transition-all active:scale-[0.98] cursor-pointer group"
          >
            <div className="flex items-center gap-2.5 text-right">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-300 flex items-center justify-center shrink-0">
                <CheckCircle className="w-4 h-4" />
              </div>
              <div>
                <div className="font-bold">۱. ملاک بودن نتیجه رو در رو</div>
                <div className="text-[11px] text-emerald-300/80 font-normal">
                  {directWinnerId ? `برنده مسابقه قبلی (${directWinnerName}) صعود می‌کند` : 'برنده بازی رو در رو مستقیماً صعود می‌کند'}
                </div>
              </div>
            </div>
            <span className="text-[11px] font-bold text-emerald-400 px-2 py-1 rounded bg-emerald-500/10 shrink-0">
              اعمال رو در رو ←
            </span>
          </button>

          {/* Option 2: Single Frame Playoff */}
          <button
            onClick={() => onSelectPlayoffMatch('single')}
            className="w-full p-3.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-white/10 hover:border-amber-400/50 text-white font-bold text-xs sm:text-sm flex items-center justify-between transition-all active:scale-[0.98] cursor-pointer group"
          >
            <div className="flex items-center gap-2.5 text-right">
              <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-300 flex items-center justify-center shrink-0">
                <Zap className="w-4 h-4" />
              </div>
              <div>
                <div className="font-bold">۲. بازی تک‌حذفی (یک بازی)</div>
                <div className="text-[11px] text-slate-400 font-normal">
                  یک مسابقه تک‌فریم تساوی‌شکنی بین {cleanName2} و {cleanName3}
                </div>
              </div>
            </div>
            <span className="text-[11px] font-bold text-amber-400 px-2 py-1 rounded bg-amber-500/10 shrink-0">
              ساخت مسابقه تک‌فریم
            </span>
          </button>

          {/* Option 3: Bo3 Playoff */}
          <button
            onClick={() => onSelectPlayoffMatch('bo3')}
            className="w-full p-3.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-white/10 hover:border-teal-400/50 text-white font-bold text-xs sm:text-sm flex items-center justify-between transition-all active:scale-[0.98] cursor-pointer group"
          >
            <div className="flex items-center gap-2.5 text-right">
              <div className="w-8 h-8 rounded-lg bg-teal-500/20 text-teal-300 flex items-center justify-center shrink-0">
                <Swords className="w-4 h-4" />
              </div>
              <div>
                <div className="font-bold">۳. بازی بهترین از سه (Bo3)</div>
                <div className="text-[11px] text-slate-400 font-normal">
                  مسابقه تا ۲ برد (حداکثر ۳ فریم) برای تعیین فینالیست دوم
                </div>
              </div>
            </div>
            <span className="text-[11px] font-bold text-teal-400 px-2 py-1 rounded bg-teal-500/10 shrink-0">
              ساخت مسابقه Bo3
            </span>
          </button>

          {/* Option 4: Bo5 Playoff */}
          <button
            onClick={() => onSelectPlayoffMatch('bo5')}
            className="w-full p-3.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-white/10 hover:border-rose-400/50 text-white font-bold text-xs sm:text-sm flex items-center justify-between transition-all active:scale-[0.98] cursor-pointer group"
          >
            <div className="flex items-center gap-2.5 text-right">
              <div className="w-8 h-8 rounded-lg bg-rose-500/20 text-rose-300 flex items-center justify-center shrink-0">
                <Flame className="w-4 h-4" />
              </div>
              <div>
                <div className="font-bold">۴. بازی بهترین از پنج (Bo5)</div>
                <div className="text-[11px] text-slate-400 font-normal">
                  مسابقه تا ۳ برد (حداکثر ۵ فریم) برای تعیین فینالیست دوم
                </div>
              </div>
            </div>
            <span className="text-[11px] font-bold text-rose-400 px-2 py-1 rounded bg-rose-500/10 shrink-0">
              ساخت مسابقه Bo5
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

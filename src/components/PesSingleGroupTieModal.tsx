import React from 'react';
import { Player, GroupStanding, Match } from '../types/tournament';
import { Swords, Scale, Zap, X, CheckCircle, AlertCircle, ShieldAlert, UserCheck } from 'lucide-react';

interface PesSingleGroupTieModalProps {
  isOpen: boolean;
  onClose: () => void;
  rank2: GroupStanding;
  rank3: GroupStanding;
  playersMap: Map<string, Player>;
  directMatch?: Match;
  onSelectHeadToHead: (winnerId: string, loserId: string) => void;
  onSelectPlayoffMatch: () => void;
  onSelectManualWinner: (winnerId: string) => void;
}

export const PesSingleGroupTieModal: React.FC<PesSingleGroupTieModalProps> = ({
  isOpen,
  onClose,
  rank2,
  rank3,
  playersMap,
  directMatch,
  onSelectHeadToHead,
  onSelectPlayoffMatch,
  onSelectManualWinner,
}) => {
  if (!isOpen) return null;

  const player2 = playersMap.get(rank2.playerId);
  const player3 = playersMap.get(rank3.playerId);

  const cleanName2 = rank2.playerName.replace(/\s*\([^)]*\)/g, '').trim();
  const cleanName3 = rank3.playerName.replace(/\s*\([^)]*\)/g, '').trim();

  // تعیین برنده بازی رو در رو
  let directWinnerId: string | null = null;
  let directLoserId: string | null = null;
  let directWinnerName = '';
  let directScoreText = '';
  let isDirectDraw = false;

  if (directMatch && directMatch.homeScore !== null && directMatch.awayScore !== null) {
    const hScore = directMatch.homeScore;
    const aScore = directMatch.awayScore;
    directScoreText = `${hScore} - ${aScore}`;

    if (hScore > aScore) {
      directWinnerId = directMatch.homePlayerId;
      directLoserId = directMatch.awayPlayerId;
    } else if (aScore > hScore) {
      directWinnerId = directMatch.awayPlayerId;
      directLoserId = directMatch.homePlayerId;
    } else {
      isDirectDraw = true;
    }

    if (directWinnerId) {
      directWinnerName = directWinnerId === rank2.playerId ? cleanName2 : cleanName3;
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg bg-gradient-to-b from-slate-900/95 via-rose-950/40 to-slate-950/95 border border-rose-500/30 rounded-3xl p-6 sm:p-7 shadow-2xl shadow-rose-950/60 text-white overflow-hidden backdrop-blur-xl">
        {/* Glow Accents */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-rose-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

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
            تساوی برای رتبه {rank2.rank || 2} و صعود به مرحله بعدی لیگ PES
          </h3>
          <p className="text-xs sm:text-sm text-rose-200/90 leading-relaxed max-w-md mx-auto">
            بازیکنان <strong className="text-amber-300 font-bold">{cleanName2}</strong> و <strong className="text-sky-300 font-bold">{cleanName3}</strong> دارای تمامی معیارهای مساوی (<span className="font-mono font-bold text-amber-300">{rank2.points} امتیاز</span>، <span className="font-mono font-bold text-rose-300">تفاضل {rank2.goalDifference > 0 ? `+${rank2.goalDifference}` : rank2.goalDifference}</span>) برای رتبه {rank2.rank || 2} و صعود هستند.
          </p>
        </div>

        {/* Tied Players Comparison Cards */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          {/* Player 2 Card */}
          <div className="bg-rose-950/30 border border-rose-500/30 rounded-2xl p-3 text-center">
            <div className="text-xs text-rose-400 font-mono font-bold">رتبه {rank2.rank || 2} جدول</div>
            <div className="font-black text-sm text-white truncate mt-1">{cleanName2}</div>
            {player2?.team && (
              <div className="text-[11px] text-rose-300/80 truncate mt-0.5">{player2.team}</div>
            )}
            <div className="mt-2 text-[11px] font-mono text-slate-300 flex items-center justify-center gap-1.5 pt-1.5 border-t border-white/10">
              <span className="text-amber-300 font-bold">{rank2.points} امتیاز</span>
              <span>·</span>
              <span>تفاضل {rank2.goalDifference > 0 ? `+${rank2.goalDifference}` : rank2.goalDifference}</span>
              <span>·</span>
              <span>{rank2.goalsFor} گل‌زده</span>
            </div>
          </div>

          {/* Player 3 Card */}
          <div className="bg-sky-950/30 border border-sky-500/30 rounded-2xl p-3 text-center">
            <div className="text-xs text-sky-400 font-mono font-bold">رتبه {rank3.rank || (rank2.rank ? rank2.rank + 1 : 3)} جدول</div>
            <div className="font-black text-sm text-white truncate mt-1">{cleanName3}</div>
            {player3?.team && (
              <div className="text-[11px] text-sky-300/80 truncate mt-0.5">{player3.team}</div>
            )}
            <div className="mt-2 text-[11px] font-mono text-slate-300 flex items-center justify-center gap-1.5 pt-1.5 border-t border-white/10">
              <span className="text-amber-300 font-bold">{rank3.points} امتیاز</span>
              <span>·</span>
              <span>تفاضل {rank3.goalDifference > 0 ? `+${rank3.goalDifference}` : rank3.goalDifference}</span>
              <span>·</span>
              <span>{rank3.goalsFor} گل‌زده</span>
            </div>
          </div>
        </div>

        {/* Head-to-Head Info Box */}
        {directMatch && directMatch.homeScore !== null && directMatch.awayScore !== null && (
          <div className="mb-5 p-3 rounded-xl bg-slate-900/90 border border-white/15 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              {directWinnerId ? (
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
              )}
              <span>نتیجه بازی رو در رو در لیگ:</span>
            </div>
            <div className="font-bold font-mono">
              {directWinnerId ? (
                <span className="text-emerald-400">برتری {directWinnerName} ({directScoreText})</span>
              ) : (
                <span className="text-amber-300">تساوی ({directScoreText})</span>
              )}
            </div>
          </div>
        )}

        {/* Decision Options */}
        <div className="space-y-2.5">
          <div className="text-xs font-bold text-slate-300 mb-1">
            شیوه تعیین بازیکن صعودکننده را انتخاب کنید:
          </div>

          {/* Option 1: Head to Head */}
          <button
            onClick={() => {
              if (directWinnerId && directLoserId) {
                onSelectHeadToHead(directWinnerId, directLoserId);
              } else {
                // اگر بازی رو در رو مساوی بوده، بر اساس گل زده بیشتر یا رتبه ۲
                const wId = rank2.goalsFor >= rank3.goalsFor ? rank2.playerId : rank3.playerId;
                const lId = wId === rank2.playerId ? rank3.playerId : rank2.playerId;
                onSelectHeadToHead(wId, lId);
              }
            }}
            className="w-full p-3.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-rose-500/30 hover:border-rose-400/60 text-white font-bold text-xs sm:text-sm flex items-center justify-between transition-all active:scale-[0.98] cursor-pointer group"
          >
            <div className="flex items-center gap-2.5 text-right">
              <div className="w-8 h-8 rounded-lg bg-rose-500/20 text-rose-300 flex items-center justify-center shrink-0">
                <CheckCircle className="w-4 h-4" />
              </div>
              <div>
                <div className="font-bold">۱. ملاک بودن نتیجه بازی رو در رو</div>
                <div className="text-[11px] text-rose-300/80 font-normal">
                  {directWinnerId
                    ? `برنده مسابقه قبلی (${directWinnerName}) صعود می‌کند`
                    : isDirectDraw
                    ? `بازی مساوی بود؛ اولویت با گل‌زده بیشتر (${rank2.goalsFor >= rank3.goalsFor ? cleanName2 : cleanName3})`
                    : 'بررسی نتیجه بازی مستقیم دو بازیکن در جدول لیگ'}
                </div>
              </div>
            </div>
            <span className="text-[11px] font-bold text-rose-400 px-2.5 py-1 rounded-lg bg-rose-500/10 shrink-0">
              اعمال رو در رو ←
            </span>
          </button>

          {/* Option 2: Single Playoff Match */}
          <button
            onClick={onSelectPlayoffMatch}
            className="w-full p-3.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-white/10 hover:border-amber-400/50 text-white font-bold text-xs sm:text-sm flex items-center justify-between transition-all active:scale-[0.98] cursor-pointer group"
          >
            <div className="flex items-center gap-2.5 text-right">
              <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-300 flex items-center justify-center shrink-0">
                <Swords className="w-4 h-4" />
              </div>
              <div>
                <div className="font-bold">۲. برگزاری بازی پلی‌آف تساوی‌شکنی</div>
                <div className="text-[11px] text-slate-400 font-normal">
                  یک مسابقه تک‌حذفی مستقیم در PES 2021 بین {cleanName2} و {cleanName3}
                </div>
              </div>
            </div>
            <span className="text-[11px] font-bold text-amber-400 px-2.5 py-1 rounded-lg bg-amber-500/10 shrink-0">
              ساخت مسابقه پلی‌آف ←
            </span>
          </button>

          {/* Option 3: Manual Host Selection */}
          <div className="p-3 rounded-xl bg-slate-900/60 border border-white/10 space-y-2">
            <div className="text-[11px] text-slate-300 font-semibold flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5 text-sky-400" />
              <span>۳. تصمیم مستقیم میزبان (قرعه سکه، کارت‌ها یا توافق):</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => onSelectManualWinner(rank2.playerId)}
                className="py-2 px-3 rounded-lg bg-white/5 hover:bg-rose-500/20 border border-white/10 hover:border-rose-400/40 text-xs font-bold text-slate-200 hover:text-white transition-all active:scale-95 cursor-pointer text-center truncate"
              >
                صعود {cleanName2}
              </button>
              <button
                onClick={() => onSelectManualWinner(rank3.playerId)}
                className="py-2 px-3 rounded-lg bg-white/5 hover:bg-sky-500/20 border border-white/10 hover:border-sky-400/40 text-xs font-bold text-slate-200 hover:text-white transition-all active:scale-95 cursor-pointer text-center truncate"
              >
                صعود {cleanName3}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

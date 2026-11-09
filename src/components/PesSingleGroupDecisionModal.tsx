import React from 'react';
import { Player, GroupStanding } from '../types/tournament';
import { Trophy, Swords, Table, Sparkles, X, ShieldAlert } from 'lucide-react';

interface PesSingleGroupDecisionModalProps {
  isOpen: boolean;
  onClose: () => void;
  rank1: GroupStanding;
  rank2: GroupStanding;
  playersMap: Map<string, Player>;
  onSelectFinalMatch: () => void;
  onSelectDirectByTable: () => void;
}

export const PesSingleGroupDecisionModal: React.FC<PesSingleGroupDecisionModalProps> = ({
  isOpen,
  onClose,
  rank1,
  rank2,
  playersMap,
  onSelectFinalMatch,
  onSelectDirectByTable,
}) => {
  if (!isOpen) return null;

  const player1 = playersMap.get(rank1.playerId);
  const player2 = playersMap.get(rank2.playerId);

  const cleanName1 = rank1.playerName.replace(/\s*\([^)]*\)/g, '').trim();
  const cleanName2 = rank2.playerName.replace(/\s*\([^)]*\)/g, '').trim();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
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
        <div className="text-center space-y-2 mb-6">
          <div className="inline-flex p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 mb-1 shadow-inner">
            <Trophy className="w-8 h-8 text-amber-400 animate-bounce" style={{ animationDuration: '2.5s' }} />
          </div>
          <h3 className="text-lg sm:text-xl font-black text-white tracking-wide">
            پایان مسابقات لیگ PES 2021
          </h3>
          <p className="text-xs sm:text-sm text-rose-200/90 leading-relaxed max-w-md mx-auto">
            بازی‌های گروهی به پایان رسید. نفر اول <strong className="text-amber-300 font-bold">{cleanName1}</strong> و نفر دوم <strong className="text-sky-300 font-bold">{cleanName2}</strong> هستند. قهرمان چگونه مشخص شود؟
          </p>
        </div>

        {/* Top 2 Cards Comparison */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {/* Rank 1 Card */}
          <div className="bg-gradient-to-b from-amber-500/15 to-amber-950/20 border border-amber-500/40 rounded-2xl p-3.5 text-center relative overflow-hidden shadow-lg">
            <span className="absolute top-2 right-2 px-2 py-0.5 rounded-md text-[10px] font-black bg-amber-500 text-slate-950">
              مقام اول 🥇
            </span>
            <div className="mt-4 font-black text-sm sm:text-base text-white truncate">
              {cleanName1}
            </div>
            {player1?.team && (
              <div className="text-[11px] text-amber-300/80 truncate mt-0.5 font-medium">
                {player1.team}
              </div>
            )}
            <div className="flex items-center justify-center gap-2 mt-2 pt-2 border-t border-amber-500/20 font-mono text-xs">
              <span className="text-amber-300 font-bold">{rank1.points} امتیاز</span>
              <span className="text-slate-400">·</span>
              <span className="text-slate-300">تفاضل {rank1.goalDifference > 0 ? `+${rank1.goalDifference}` : rank1.goalDifference}</span>
            </div>
          </div>

          {/* Rank 2 Card */}
          <div className="bg-gradient-to-b from-sky-500/10 to-slate-900/40 border border-sky-500/30 rounded-2xl p-3.5 text-center relative overflow-hidden shadow-lg">
            <span className="absolute top-2 right-2 px-2 py-0.5 rounded-md text-[10px] font-black bg-sky-500 text-slate-950">
              مقام دوم 🥈
            </span>
            <div className="mt-4 font-black text-sm sm:text-base text-white truncate">
              {cleanName2}
            </div>
            {player2?.team && (
              <div className="text-[11px] text-sky-300/80 truncate mt-0.5 font-medium">
                {player2.team}
              </div>
            )}
            <div className="flex items-center justify-center gap-2 mt-2 pt-2 border-t border-sky-500/20 font-mono text-xs">
              <span className="text-sky-300 font-bold">{rank2.points} امتیاز</span>
              <span className="text-slate-400">·</span>
              <span className="text-slate-300">تفاضل {rank2.goalDifference > 0 ? `+${rank2.goalDifference}` : rank2.goalDifference}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          {/* Button 1: Final Match */}
          <button
            onClick={onSelectFinalMatch}
            className="w-full p-4 rounded-2xl bg-gradient-to-r from-rose-600 via-rose-500 to-amber-500 hover:from-rose-500 hover:to-amber-400 text-white font-black text-sm flex items-center justify-between shadow-xl shadow-rose-950/50 border border-rose-400/40 transition-all active:scale-[0.98] cursor-pointer group"
          >
            <div className="flex items-center gap-3 text-right">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                <Swords className="w-5 h-5 text-white group-hover:rotate-12 transition-transform" />
              </div>
              <div>
                <div className="font-bold text-sm">برگزاری بازی فینال</div>
                <div className="text-[11px] text-rose-100 font-normal">
                  یک مسابقه مستقیم بین {cleanName1} و {cleanName2} برگزار می‌شود
                </div>
              </div>
            </div>
            <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-white/20 shrink-0">
              شروع فینال ←
            </span>
          </button>

          {/* Button 2: Direct By Table */}
          <button
            onClick={onSelectDirectByTable}
            className="w-full p-4 rounded-2xl bg-slate-900/80 hover:bg-slate-800/90 text-white font-bold text-sm flex items-center justify-between border border-white/10 hover:border-amber-500/40 transition-all active:scale-[0.98] cursor-pointer group"
          >
            <div className="flex items-center gap-3 text-right">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center shrink-0">
                <Table className="w-5 h-5 text-amber-400 group-hover:scale-110 transition-transform" />
              </div>
              <div>
                <div className="font-bold text-sm text-slate-100">ملاک بودن جدول (بدون فینال)</div>
                <div className="text-[11px] text-slate-400 font-normal">
                  {cleanName1} قهرمان و {cleanName2} نایب‌قهرمان لیگ اعلام می‌شوند
                </div>
              </div>
            </div>
            <span className="text-xs font-bold text-amber-400 px-2.5 py-1 rounded-lg bg-amber-500/10 shrink-0">
              مشاهده سکوی افتخار ←
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

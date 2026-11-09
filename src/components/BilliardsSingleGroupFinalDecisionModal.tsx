import React from 'react';
import { Player, GroupStanding, BilliardsFormat } from '../types/tournament';
import { Trophy, Swords, Table, Sparkles, X } from 'lucide-react';

interface BilliardsSingleGroupFinalDecisionModalProps {
  isOpen: boolean;
  onClose: () => void;
  rank1: GroupStanding;
  rank2: GroupStanding;
  playersMap: Map<string, Player>;
  tournamentBilliardsFormat?: BilliardsFormat;
  onSelectFinalMatch: () => void;
  onSelectDirectByTable: () => void;
}

export const BilliardsSingleGroupFinalDecisionModal: React.FC<BilliardsSingleGroupFinalDecisionModalProps> = ({
  isOpen,
  onClose,
  rank1,
  rank2,
  playersMap,
  tournamentBilliardsFormat = 'single',
  onSelectFinalMatch,
  onSelectDirectByTable,
}) => {
  if (!isOpen) return null;

  const player1 = playersMap.get(rank1.playerId);
  const player2 = playersMap.get(rank2.playerId);

  const cleanName1 = rank1.playerName.replace(/\s*\([^)]*\)/g, '').trim();
  const cleanName2 = rank2.playerName.replace(/\s*\([^)]*\)/g, '').trim();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg bg-gradient-to-b from-slate-900/95 via-emerald-950/45 to-slate-950/95 border border-emerald-500/30 rounded-3xl p-6 sm:p-7 shadow-2xl shadow-emerald-950/60 text-white overflow-hidden backdrop-blur-xl">
        {/* Glow Accents */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
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
          <div className="inline-flex p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 mb-1 shadow-inner">
            <Trophy className="w-8 h-8 text-amber-400 animate-bounce" style={{ animationDuration: '2.5s' }} />
          </div>
          <h3 className="text-lg sm:text-xl font-black text-white tracking-wide">
            تعیین قهرمان لیگ بیلیارد
          </h3>
          <p className="text-xs sm:text-sm text-emerald-200/90 leading-relaxed max-w-md mx-auto">
            بازی‌های گروهی بیلیارد به پایان رسید و ۲ فینالیست برتر مشخص شدند: نفر اول <strong className="text-amber-300 font-bold">{cleanName1}</strong> و نفر دوم <strong className="text-emerald-300 font-bold">{cleanName2}</strong>. قهرمان چگونه مشخص شود؟
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
            <div className="flex items-center justify-center gap-2 mt-2 pt-2 border-t border-amber-500/20 font-mono text-xs">
              <span className="text-amber-300 font-bold">{rank1.points} امتیاز</span>
              <span className="text-slate-400">·</span>
              <span className="text-slate-300">تفاضل {rank1.goalDifference > 0 ? `+${rank1.goalDifference}` : rank1.goalDifference}</span>
            </div>
            <div className="text-[10px] text-emerald-300/80 font-mono mt-1">
              {rank1.goalsFor} فریم برده
            </div>
          </div>

          {/* Rank 2 Card */}
          <div className="bg-gradient-to-b from-emerald-500/15 to-slate-900/40 border border-emerald-500/30 rounded-2xl p-3.5 text-center relative overflow-hidden shadow-lg">
            <span className="absolute top-2 right-2 px-2 py-0.5 rounded-md text-[10px] font-black bg-emerald-500 text-slate-950">
              مقام دوم 🥈
            </span>
            <div className="mt-4 font-black text-sm sm:text-base text-white truncate">
              {cleanName2}
            </div>
            <div className="flex items-center justify-center gap-2 mt-2 pt-2 border-t border-emerald-500/20 font-mono text-xs">
              <span className="text-emerald-300 font-bold">{rank2.points} امتیاز</span>
              <span className="text-slate-400">·</span>
              <span className="text-slate-300">تفاضل {rank2.goalDifference > 0 ? `+${rank2.goalDifference}` : rank2.goalDifference}</span>
            </div>
            <div className="text-[10px] text-emerald-300/80 font-mono mt-1">
              {rank2.goalsFor} فریم برده
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          {/* Button 1: Final Match */}
          <button
            onClick={onSelectFinalMatch}
            className="w-full p-4 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-sm flex items-center justify-between shadow-xl shadow-emerald-950/50 border border-emerald-400/40 transition-all active:scale-[0.98] cursor-pointer group"
          >
            <div className="flex items-center gap-3 text-right">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                <Swords className="w-5 h-5 text-white group-hover:rotate-12 transition-transform" />
              </div>
              <div>
                <div className="font-bold text-sm">برگزاری بازی فینال (بین نفر اول و دوم)</div>
                <div className="text-[11px] text-emerald-100 font-normal">
                  مسابقه فینال رسمی بین {cleanName1} و {cleanName2} برگزار می‌شود
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
                <div className="font-bold text-sm text-slate-100">ملاک بودن جدول (نفر اول مستقیماً قهرمان)</div>
                <div className="text-[11px] text-slate-400 font-normal">
                  {cleanName1} مستقیماً قهرمان و {cleanName2} نایب‌قهرمان بیلیارد اعلام می‌شوند
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

import React from 'react';
import { Group, GroupStanding } from '../types/tournament';

interface LiveThirdPlaceStandingsProps {
  groups: Group[];
  standingsMap: Record<string, GroupStanding[]>;
  gameType: 'pes' | 'billiards';
}

export const LiveThirdPlaceStandings: React.FC<LiveThirdPlaceStandingsProps> = ({
  groups,
  standingsMap,
  gameType,
}) => {
  if (groups.length !== 3) return null;

  // استخراج نفرات سوم هر ۳ گروه
  const thirdPlaceList: Array<{
    groupCode: string;
    groupName: string;
    playerId: string;
    standing: GroupStanding;
    isAdvancing: boolean;
  }> = [];

  groups.forEach((g) => {
    const list = standingsMap[g.id] || [];
    if (list.length >= 3 && list[2]) {
      thirdPlaceList.push({
        groupCode: g.code,
        groupName: g.name,
        playerId: list[2].playerId,
        standing: list[2],
        isAdvancing: false,
      });
    }
  });

  if (thirdPlaceList.length < 3) return null;

  // مرتب‌سازی نفرات سوم بر اساس: امتیاز > تفاضل > گل/فریم زده > حروف الفبا
  thirdPlaceList.sort((a, b) => {
    if (b.standing.points !== a.standing.points) return b.standing.points - a.standing.points;
    if (b.standing.goalDifference !== a.standing.goalDifference) {
      return b.standing.goalDifference - a.standing.goalDifference;
    }
    if (b.standing.goalsFor !== a.standing.goalsFor) {
      return b.standing.goalsFor - a.standing.goalsFor;
    }
    return a.standing.playerName.localeCompare(b.standing.playerName, 'fa');
  });

  // ۲ نفر اول صعود می‌کنند
  if (thirdPlaceList[0]) thirdPlaceList[0].isAdvancing = true;
  if (thirdPlaceList[1]) thirdPlaceList[1].isAdvancing = true;

  const isBilliards = gameType === 'billiards';

  return (
    <div
      className={`mt-5 rounded-2xl overflow-hidden border shadow-xl backdrop-blur-md transition-all ${
        isBilliards
          ? 'bg-slate-950/70 border-emerald-500/30 text-emerald-100 shadow-emerald-950/30'
          : 'bg-slate-900/70 border-white/10 text-slate-100 shadow-black/30'
      }`}
    >
      {/* Header */}
      <div
        className={`px-4 sm:px-5 py-3.5 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
          isBilliards
            ? 'bg-emerald-950/50 border-emerald-500/20'
            : 'bg-white/[0.04] border-white/10'
        }`}
      >
        <div className="flex items-center gap-2.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.9)]" />
          <h4 className="font-bold text-xs sm:text-sm text-white tracking-wide">
            {isBilliards
              ? '🎱 جدول زنده رده‌بندی نفرات سوم (صعود ۲ نفر برتر به مرحله حذفی)'
              : '⚽ جدول زنده مقایسه تیم‌های رتبه سوم (صعود ۲ تیم برتر به مرحله حذفی)'}
          </h4>
        </div>

        <div className="flex items-center gap-2 text-[11px]">
          <span
            className={`px-2.5 py-0.5 rounded-full font-medium ${
              isBilliards
                ? 'bg-emerald-900/60 text-emerald-300 border border-emerald-500/30'
                : 'bg-white/10 text-sky-300 border border-white/10'
            }`}
          >
            محاسبه آنی و زنده با هر نتیجه
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto scrollbar-none">
        <table className="w-full text-xs text-right whitespace-nowrap">
          <thead>
            <tr
              className={`border-b text-[11px] font-semibold ${
                isBilliards
                  ? 'bg-slate-950/60 text-emerald-300/80 border-emerald-500/20'
                  : 'bg-slate-950/40 text-slate-400 border-white/10'
              }`}
            >
              <th className="py-2.5 px-3 text-center w-10">رتبه</th>
              <th className="py-2.5 px-3">نام بازیکن</th>
              <th className="py-2.5 px-2 text-center">گروه</th>
              <th className="py-2.5 px-2 text-center font-mono">بازی</th>
              <th className="py-2.5 px-2 text-center font-mono text-emerald-400">برد</th>
              <th className="py-2.5 px-2 text-center font-mono text-rose-400">باخت</th>
              <th className="py-2.5 px-2 text-center font-mono">{isBilliards ? 'ف‌ب' : 'گ‌ز'}</th>
              <th className="py-2.5 px-2 text-center font-mono">{isBilliards ? 'ف‌خ' : 'گ‌خ'}</th>
              <th className="py-2.5 px-2 text-center font-mono">تفاضل</th>
              <th className="py-2.5 px-3 text-center font-mono font-black text-amber-300">امتیاز</th>
              <th className="py-2.5 px-3 text-center">وضعیت لحظه‌ای سهمیه</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {thirdPlaceList.map((item, idx) => {
              const cleanName = item.standing.playerName.replace(/\s*\([^)]*\)/g, '').trim();
              const isAdvancing = item.isAdvancing;

              return (
                <tr
                  key={item.playerId}
                  className={`transition-colors ${
                    isAdvancing
                      ? isBilliards
                        ? 'bg-emerald-500/[0.08] hover:bg-emerald-500/[0.14]'
                        : 'bg-emerald-500/10 hover:bg-emerald-500/15'
                      : 'bg-transparent hover:bg-white/[0.03] opacity-75'
                  }`}
                >
                  {/* Rank */}
                  <td className="py-2.5 px-3 text-center">
                    <span
                      className={`inline-flex items-center justify-center w-5 h-5 rounded-md text-[11px] font-mono font-bold ${
                        isAdvancing
                          ? 'bg-emerald-500/25 text-emerald-300 border border-emerald-400/50'
                          : 'bg-rose-500/20 text-rose-300 border border-rose-400/30'
                      }`}
                    >
                      {idx + 1}
                    </span>
                  </td>

                  {/* Player Name */}
                  <td className="py-2.5 px-3">
                    <div className="font-bold text-white flex items-center gap-1.5">
                      <span>{cleanName}</span>
                      {isAdvancing && (
                        <span
                          title="در منطقه صعود به مرحله حذفی"
                          className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block shadow-[0_0_8px_rgba(52,211,153,0.9)] shrink-0"
                        />
                      )}
                    </div>
                  </td>

                  {/* Group */}
                  <td className="py-2.5 px-2 text-center">
                    <span className="font-bold text-xs text-amber-300 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">
                      گروه {item.groupCode}
                    </span>
                  </td>

                  {/* Stats */}
                  <td className="py-2.5 px-2 text-center font-mono tabular-nums text-slate-300">
                    {item.standing.played}
                  </td>
                  <td className="py-2.5 px-2 text-center font-mono tabular-nums text-emerald-400 font-semibold">
                    {item.standing.won}
                  </td>
                  <td className="py-2.5 px-2 text-center font-mono tabular-nums text-rose-400">
                    {item.standing.lost}
                  </td>
                  <td className="py-2.5 px-2 text-center font-mono tabular-nums text-emerald-300">
                    {item.standing.goalsFor}
                  </td>
                  <td className="py-2.5 px-2 text-center font-mono tabular-nums text-slate-400">
                    {item.standing.goalsAgainst}
                  </td>
                  <td
                    className={`py-2.5 px-2 text-center font-mono tabular-nums font-bold ${
                      item.standing.goalDifference > 0
                        ? 'text-emerald-400'
                        : item.standing.goalDifference < 0
                        ? 'text-rose-400'
                        : 'text-slate-400'
                    }`}
                  >
                    {item.standing.goalDifference > 0
                      ? `+${item.standing.goalDifference}`
                      : item.standing.goalDifference}
                  </td>
                  <td className="py-2.5 px-3 text-center font-mono tabular-nums font-black text-amber-300">
                    {item.standing.points}
                  </td>

                  {/* Status Badge */}
                  <td className="py-2.5 px-3 text-center">
                    {isAdvancing ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 shadow-sm">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.9)]" />
                        صعود به یک‌چهارم نهایی
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20">
                        خارج از سهمیه صعود
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer Info */}
      <div
        className={`px-4 py-2 border-t flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px] ${
          isBilliards
            ? 'bg-emerald-950/60 border-emerald-500/20 text-emerald-300/80'
            : 'bg-white/[0.02] border-white/10 text-slate-400'
        }`}
      >
        <span>
          معیار اولویت صعود تیم‌های سوم: ۱. بیشترین امتیاز ← ۲. بهترین تفاضل فریم ← ۳. بیشترین فریم برده
        </span>
        <span className="font-mono text-[10px] text-amber-300/90">
          ۲ تیم سبزپوش به همراه ۶ تیم اول و دوم گروه‌ها به مرحله ۱/۴ نهایی صعود می‌کنند.
        </span>
      </div>
    </div>
  );
};

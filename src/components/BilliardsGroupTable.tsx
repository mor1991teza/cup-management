import React from 'react';
import { Group, GroupStanding, Player } from '../types/tournament';

interface BilliardsGroupTableProps {
  group?: Group;
  standings: GroupStanding[];
  playersMap: Map<string, Player>;
  showQualificationLegend?: boolean;
  advancingPlayerIds?: Set<string>;
  title?: string;
}

export const BilliardsGroupTable: React.FC<BilliardsGroupTableProps> = ({
  group,
  standings,
  playersMap,
  showQualificationLegend = true,
  advancingPlayerIds = new Set(),
  title,
}) => {
  const displayTitle = title || (group ? group.name : 'جدول رده‌بندی مسابقات بیلیارد');

  return (
    <div className="card-stadium rounded-2xl border border-emerald-800/60 overflow-hidden shadow-xl bg-gradient-to-b from-[#062013] to-[#03150c] text-emerald-100">
      {/* Table Header Card Top */}
      <div className="px-5 py-3.5 bg-emerald-950/70 border-b border-emerald-800/60 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          {group && (
            <div className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center font-black text-xs text-emerald-300 font-mono shadow-sm">
              {group.code}
            </div>
          )}
          <h3 className="font-bold text-sm text-white tracking-wide">{displayTitle}</h3>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] text-emerald-300 font-bold bg-emerald-900/60 px-2.5 py-0.5 rounded-full border border-emerald-700/60 flex items-center gap-1.5 shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>جدول رده‌بندی بیلیارد</span>
          </span>
          <span className="text-[11px] text-emerald-400/80 font-mono">
            {standings.length} بازیکن
          </span>
        </div>
      </div>

      {/* Table Body */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs text-right whitespace-nowrap">
          <thead>
            <tr className="bg-[#041a0f]/90 text-emerald-300/80 border-b border-emerald-800/50 font-semibold text-[11px]">
              <th className="py-3 px-3 text-center w-10">#</th>
              <th className="py-3 px-4 text-right">نام بازیکن</th>
              <th className="py-3 px-3 text-center font-mono" title="تعداد بازی‌ها (Played)">بازی</th>
              <th className="py-3 px-3 text-center font-mono text-emerald-400" title="بردها (Wins)">برد</th>
              <th className="py-3 px-3 text-center font-mono text-rose-400" title="باخت‌ها (Losses)">باخت</th>
              <th className="py-3 px-3 text-center font-mono text-emerald-200" title="فریم برده (Frames Won)">فریم برده</th>
              <th className="py-3 px-3 text-center font-mono text-slate-300" title="فریم باخته (Frames Lost)">فریم باخته</th>
              <th className="py-3 px-3 text-center font-mono" title="تفاضل فریم (Frame Difference)">تفاضل فریم</th>
              <th className="py-3 px-4 text-center font-mono font-black text-amber-300 bg-emerald-950/50" title="امتیاز (Points - برد ۳، باخت ۰)">امتیاز</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-emerald-900/40">
            {standings.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-8 text-center text-xs text-emerald-400/60 font-medium">
                  هنوز بازیکنی در این جدول ثبت نشده است.
                </td>
              </tr>
            ) : (
              standings.map((st, idx) => {
                const isQualified = advancingPlayerIds.has(st.playerId) || idx < 2;
                const cleanName = st.playerName.replace(/\s*\([^)]*\)/g, '').trim();

                return (
                  <tr
                    key={st.playerId}
                    className={`transition-colors hover:bg-emerald-900/30 ${
                      isQualified ? 'bg-emerald-950/40' : ''
                    }`}
                  >
                    {/* Rank */}
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`inline-flex items-center justify-center w-6 h-6 rounded-lg text-xs font-mono font-black ${
                          isQualified
                            ? idx === 0
                              ? 'bg-amber-400/20 text-amber-300 border border-amber-400/50 shadow-sm'
                              : idx === 1
                              ? 'bg-emerald-500/25 text-emerald-300 border border-emerald-400/50 shadow-sm'
                              : 'bg-emerald-900/50 text-emerald-300 border border-emerald-700/50'
                            : 'text-emerald-500/50 bg-black/30'
                        }`}
                      >
                        {idx + 1}
                      </span>
                    </td>

                    {/* Player */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="font-bold text-white flex items-center gap-1.5">
                          <span>{cleanName}</span>
                          {isQualified && (
                            <span
                              title="سهمیه صعود به مرحله حذفی بیلیارد"
                              className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block shadow-[0_0_8px_rgba(52,211,153,0.9)]"
                            />
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Games Played */}
                    <td className="py-3 px-3 text-center font-mono tabular-nums text-slate-200">
                      {st.played}
                    </td>

                    {/* Wins */}
                    <td className="py-3 px-3 text-center font-mono tabular-nums text-emerald-400 font-bold">
                      {st.won}
                    </td>

                    {/* Losses */}
                    <td className="py-3 px-3 text-center font-mono tabular-nums text-rose-400 font-semibold">
                      {st.lost}
                    </td>

                    {/* Frames Won (FW) */}
                    <td className="py-3 px-3 text-center font-mono tabular-nums text-emerald-300 font-semibold">
                      {st.goalsFor}
                    </td>

                    {/* Frames Lost (FL) */}
                    <td className="py-3 px-3 text-center font-mono tabular-nums text-slate-400">
                      {st.goalsAgainst}
                    </td>

                    {/* Frame Difference (FD) */}
                    <td
                      className={`py-3 px-3 text-center font-mono tabular-nums font-bold ${
                        st.goalDifference > 0
                          ? 'text-emerald-400'
                          : st.goalDifference < 0
                          ? 'text-rose-400'
                          : 'text-slate-400'
                      }`}
                    >
                      {st.goalDifference > 0 ? `+${st.goalDifference}` : st.goalDifference}
                    </td>

                    {/* Points */}
                    <td className="py-3 px-4 text-center font-mono tabular-nums font-black text-sm text-amber-300 bg-emerald-950/60">
                      {st.points}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Legend Footer */}
      {showQualificationLegend && (
        <div className="px-5 py-2.5 bg-emerald-950/80 border-t border-emerald-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 text-[11px] text-emerald-300/90">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
            <span className="font-medium text-slate-200">
              ۲ نفر اول هر گروه بر اساس امتیاز، سپس تفاضل فریم، به مرحله حذفی صعود می‌کنند.
            </span>
          </div>

          <div className="flex items-center gap-2.5 font-mono text-[10px] text-emerald-400">
            <span>سیستم امتیازدهی: برد ۳ امتیاز • باخت ۰ امتیاز</span>
          </div>
        </div>
      )}
    </div>
  );
};

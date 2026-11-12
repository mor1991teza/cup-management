import React from 'react';
import { Group, GroupStanding, Player } from '../types/tournament';
import { GitBranch } from 'lucide-react';
import { sound } from '../utils/audio';

interface BilliardsGroupTableProps {
  group?: Group;
  standings: GroupStanding[];
  playersMap: Map<string, Player>;
  showQualificationLegend?: boolean;
  advancingPlayerIds?: Set<string>;
  title?: string;
  advancementRule?: 'bestThirds' | 'proportional' | 'manual';
  groupCount?: number;
  onSelectPlayer?: (playerId: string) => void;
}

export const BilliardsGroupTable: React.FC<BilliardsGroupTableProps> = ({
  group,
  standings,
  playersMap,
  showQualificationLegend = true,
  advancingPlayerIds = new Set(),
  title,
  advancementRule = 'bestThirds',
  groupCount,
  onSelectPlayer,
}) => {
  const displayTitle = groupCount === 1 ? 'جدول رده‌بندی لیگ بیلیارد' : (title || (group ? group.name : 'جدول رده‌بندی مسابقات بیلیارد'));

  return (
    <div className="card-stadium rounded-2xl border border-emerald-500/20 overflow-hidden shadow-2xl bg-slate-950/70 text-emerald-100">
      {/* Table Header Card Top */}
      <div className="px-5 py-4 bg-emerald-950/50 border-b border-emerald-500/20 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {group && groupCount !== 1 && (
            <div className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center font-black text-xs text-emerald-300 font-mono shadow-sm">
              {group.code}
            </div>
          )}
          <h3 className="font-bold text-sm text-white tracking-wide">{displayTitle}</h3>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] text-emerald-300 font-bold bg-emerald-900/40 px-3 py-1 rounded-full border border-emerald-500/30 flex items-center gap-1.5 shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>جدول رده‌بندی بیلیارد</span>
          </span>
          <span className="text-[11px] text-emerald-400/80 font-mono">
            {standings.length} بازیکن
          </span>
        </div>
      </div>

      {/* Table Body */}
      <div className="overflow-x-auto scrollbar-none">
        <table className="w-full text-xs text-right whitespace-nowrap">
          <thead>
            <tr className="bg-slate-950/60 text-emerald-300/80 border-b border-emerald-500/20 font-semibold text-[11px]">
              <th className="py-2.5 px-2 text-center w-7 sm:w-8">#</th>
              <th className="py-2.5 px-2.5 sm:px-3 text-right">نام بازیکن</th>
              <th className="py-2.5 px-1.5 sm:px-2 text-center font-mono" title="تعداد بازی‌ها (Played)">بازی</th>
              <th className="py-2.5 px-1.5 sm:px-2 text-center font-mono text-emerald-400" title="بردها (Wins)">برد</th>
              <th className="py-2.5 px-1.5 sm:px-2 text-center font-mono text-rose-400" title="باخت‌ها (Losses)">باخت</th>
              <th className="py-2.5 px-1.5 sm:px-2 text-center font-mono text-emerald-200" title="فریم‌های برده (Frames Won - FW)">ف‌ب</th>
              <th className="py-2.5 px-1.5 sm:px-2 text-center font-mono text-slate-400" title="فریم‌های باخته (Frames Lost - FL)">ف‌خ</th>
              <th className="py-2.5 px-1.5 sm:px-2 text-center font-mono" title="تفاضل فریم (Frame Difference - FD)">تفاضل</th>
              <th className="py-2.5 px-2 sm:px-3 text-center font-mono font-black text-amber-300" title="امتیاز (Points - برد ۳، باخت ۰)">امتیاز</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.06]">
            {standings.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-8 text-center text-xs text-emerald-400/60 font-medium">
                  هنوز بازیکنی در این جدول ثبت نشده است.
                </td>
              </tr>
            ) : (
              standings.map((st, idx) => {
                const isQualified = advancingPlayerIds.size > 0
                  ? advancingPlayerIds.has(st.playerId)
                  : (group?.advanceCount ? idx < group.advanceCount : idx < 2);
                const isBestThird = idx === 2 && isQualified;
                const cleanName = st.playerName.replace(/\s*\([^)]*\)/g, '').trim();

                return (
                  <tr
                    key={st.playerId}
                    className={`transition-colors hover:bg-white/[0.04] ${
                      isQualified ? 'bg-emerald-500/[0.06]' : ''
                    }`}
                  >
                    {/* Rank */}
                    <td className="py-2.5 px-2 text-center">
                      <span
                        className={`inline-flex items-center justify-center w-5 h-5 rounded-md text-[11px] font-mono font-black ${
                          isQualified
                            ? idx === 0
                              ? 'bg-amber-400/20 text-amber-300 border border-amber-400/50 shadow-sm'
                              : idx === 1
                              ? 'bg-emerald-500/25 text-emerald-300 border border-emerald-400/50 shadow-sm'
                              : 'bg-teal-500/25 text-teal-300 border border-teal-400/50 shadow-sm'
                            : 'text-slate-500 bg-white/[0.03]'
                        }`}
                        title={isBestThird ? 'صعود به‌عنوان تیم برتر سوم' : undefined}
                      >
                        {idx + 1}
                      </span>
                    </td>

                    {/* Player */}
                    <td className="py-2.5 px-2.5 sm:px-3">
                      <div className="flex flex-col justify-center">
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              sound.playClick();
                              onSelectPlayer?.(st.playerId);
                            }}
                            className="font-bold text-white flex items-center gap-1.5 truncate max-w-[120px] sm:max-w-[160px] text-right cursor-pointer hover:text-emerald-300 transition-colors group"
                            title="مشاهده فلوچارت مسیر صعود بازیکن"
                          >
                            <span className="truncate group-hover:underline decoration-emerald-400/50 underline-offset-2">{cleanName}</span>
                            <GitBranch className="w-3 h-3 text-slate-500 opacity-0 group-hover:opacity-100 text-emerald-400 transition-opacity shrink-0" />
                            {isQualified && (
                              <span
                                title={isBestThird ? 'سهمیه صعود به مرحله حذفی (تیم سوم برتر)' : 'سهمیه صعود به مرحله حذفی بیلیارد'}
                                className={`w-1.5 h-1.5 rounded-full inline-block shrink-0 ${
                                  isBestThird
                                    ? 'bg-teal-400 shadow-[0_0_8px_rgba(45,212,191,0.9)] animate-pulse'
                                    : 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)]'
                                }`}
                              />
                            )}
                          </button>
                        </div>
                        {playersMap.get(st.playerId)?.uniqueId && (
                          <div className="text-[10px] text-white font-mono truncate">
                            {playersMap.get(st.playerId)?.uniqueId}
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Games Played */}
                    <td className="py-2.5 px-1.5 sm:px-2 text-center font-mono tabular-nums text-slate-200">
                      {st.played}
                    </td>

                    {/* Wins */}
                    <td className="py-2.5 px-1.5 sm:px-2 text-center font-mono tabular-nums text-emerald-400 font-bold">
                      {st.won}
                    </td>

                    {/* Losses */}
                    <td className="py-2.5 px-1.5 sm:px-2 text-center font-mono tabular-nums text-rose-400 font-semibold">
                      {st.lost}
                    </td>

                    {/* Frames Won (FW) */}
                    <td className="py-2.5 px-1.5 sm:px-2 text-center font-mono tabular-nums text-emerald-300 font-semibold">
                      {st.goalsFor}
                    </td>

                    {/* Frames Lost (FL) */}
                    <td className="py-2.5 px-1.5 sm:px-2 text-center font-mono tabular-nums text-slate-400">
                      {st.goalsAgainst}
                    </td>

                    {/* Frame Difference (FD) */}
                    <td
                      className={`py-2.5 px-1.5 sm:px-2 text-center font-mono tabular-nums font-bold ${
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
                    <td className="py-2.5 px-2 sm:px-3 text-center font-mono tabular-nums font-black text-sm text-amber-300">
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
        <div className="px-4 py-2.5 bg-emerald-950/70 border-t border-emerald-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 text-[11px] text-emerald-300/90">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)] shrink-0" />
            <span className="font-medium text-slate-200">
              {groupCount === 1
                ? 'نفر اول و دوم به عنوان قهرمان و نایب‌قهرمان (یا صعودکننده به فینال) معرفی می‌شوند.'
                : groupCount === 3
                ? (advancementRule === 'proportional'
                    ? 'صعود به مرحله حذفی: ۳ نفر از گروه‌های ۵ نفره و ۲ نفر از گروه ۴ نفره (مجموعاً ۸ بازیکن)'
                    : 'صعود به مرحله حذفی: ۲ نفر اول هر گروه + ۲ تیم برتر سوم (مجموعاً ۸ بازیکن)')
                : groupCount === 2
                ? 'صعود به مرحله نیمه‌نهایی: ۲ نفر برتر هر گروه (مجموعاً ۴ بازیکن)'
                : groupCount === 4
                ? 'صعود به مرحله یک‌چهارم نهایی: ۲ نفر برتر هر گروه (مجموعاً ۸ بازیکن بدون احتساب تیم‌های سوم)'
                : '۲ نفر برتر هر گروه به مرحله حذفی صعود می‌کنند.'}
            </span>
          </div>

          <div className="flex items-center gap-2 font-mono text-[10px] text-emerald-400/90">
            <span>ف‌ب: فریم برده • ف‌خ: فریم باخته • برد: ۳ امتیاز</span>
          </div>
        </div>
      )}
    </div>
  );
};

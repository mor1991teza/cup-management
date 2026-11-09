import React from 'react';
import { Group, GroupStanding, Player, GameType } from '../types/tournament';
import { Check, Shield } from 'lucide-react';

interface GroupTableProps {
  group: Group;
  standings: GroupStanding[];
  playersMap: Map<string, Player>;
  showQualificationLegend?: boolean;
  advancingPlayerIds?: Set<string>;
  advancementRule?: 'bestThirds' | 'proportional' | 'manual' | null;
  groupCount?: number;
  gameType?: GameType;
}

export const GroupTable: React.FC<GroupTableProps> = ({
  group,
  standings,
  playersMap,
  showQualificationLegend = true,
  advancingPlayerIds = new Set(),
  advancementRule,
  groupCount,
  gameType = 'pes',
}) => {
  const isBilliards = gameType === 'billiards';

  return (
    <div className="card-stadium rounded-2xl border border-white/10 overflow-hidden shadow-xl">
      {/* Header */}
      <div className="px-5 py-3.5 bg-slate-900/40 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          {groupCount !== 1 && (
            <div className="w-7 h-7 rounded-lg bg-app-primary/20 border border-app-primary/40 flex items-center justify-center font-bold text-xs text-app-primary font-mono shadow-sm">
              {group.code}
            </div>
          )}
          <h3 className="font-bold text-sm text-white">{groupCount === 1 ? 'جدول رده‌بندی لیگ مسابقات' : group.name}</h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-emerald-400 font-medium bg-emerald-950/40 px-2.5 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>{isBilliards ? 'جدول رده‌بندی بیلیارد' : 'جدول زنده'}</span>
          </span>
          <span className="text-[11px] text-slate-400 font-mono">
            {standings.length} بازیکن
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto scrollbar-none">
        <table className="w-full text-xs text-right whitespace-nowrap">
          <thead>
            <tr className="bg-slate-950/40 text-slate-400 border-b border-white/10 font-semibold text-[11px]">
              <th className="py-2.5 px-2 text-center w-7 sm:w-8">#</th>
              <th className="py-2.5 px-2.5 sm:px-3 text-right">بازیکن و تیم</th>
              <th className="py-2.5 px-1.5 sm:px-2 text-center font-mono" title="بازی (Played)">بازی</th>
              <th className="py-2.5 px-1.5 sm:px-2 text-center font-mono text-emerald-400" title="برد (Wins)">برد</th>
              {!isBilliards && (
                <th className="py-2.5 px-1.5 sm:px-2 text-center font-mono text-amber-400" title="مساوی (Drawn)">م</th>
              )}
              <th className="py-2.5 px-1.5 sm:px-2 text-center font-mono text-rose-400" title="باخت (Losses)">باخت</th>
              <th className="py-2.5 px-1.5 sm:px-2 text-center font-mono" title={isBilliards ? 'فریم‌های برده (Frames Won - FW)' : 'گل زده (Goals For)'}>
                {isBilliards ? 'ف‌ب' : 'گ‌ز'}
              </th>
              <th className="py-2.5 px-1.5 sm:px-2 text-center font-mono text-slate-400" title={isBilliards ? 'فریم‌های باخته (Frames Lost - FL)' : 'گل خورده (Goals Against)'}>
                {isBilliards ? 'ف‌خ' : 'گ‌خ'}
              </th>
              <th className="py-2.5 px-1.5 sm:px-2 text-center font-mono" title={isBilliards ? 'تفاضل فریم (Frame Difference - FD)' : 'تفاضل گل (Goal Difference)'}>
                {isBilliards ? 'تفاضل' : 'تفاضل'}
              </th>
              <th className="py-2.5 px-2 sm:px-3 text-center font-mono font-black text-app-primary" title="امتیاز (Points - برد ۳، باخت ۰)">امتیاز</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.06]">
            {standings.map((st, idx) => {
              // استفاده از لیست داینامیک صعود‌کنندگان
              const isQualified = advancingPlayerIds.has(st.playerId); 
              const player = playersMap.get(st.playerId);

              return (
                <tr
                  key={st.playerId}
                  className={`transition-colors hover:bg-white/[0.04] ${
                    isQualified ? 'bg-app-primary/[0.06]' : ''
                  }`}
                >
                  {/* Rank */}
                  <td className="py-2.5 px-2 text-center">
                    <span
                      className={`inline-flex items-center justify-center w-5 h-5 rounded-md text-[11px] font-mono font-bold ${
                        isQualified
                          ? idx === 0
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : idx === 1
                            ? 'bg-app-primary/20 text-app-primary border border-app-primary/40'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : 'text-slate-500'
                      }`}
                    >
                      {idx + 1}
                    </span>
                  </td>

                  {/* Player & Team */}
                  <td className="py-2.5 px-2.5 sm:px-3">
                    <div className="flex items-center gap-1.5">
                      <div className="font-semibold text-white flex items-center gap-1.5 truncate max-w-[100px] sm:max-w-[140px]">
                        <span className="truncate">{isBilliards ? st.playerName.replace(/\s*\([^)]*\)/g, '').trim() : st.playerName}</span>
                        {isQualified && (
                          <span
                            title={isBilliards ? "سهمیه صعود به مرحله حذفی بیلیارد" : "سهمیه صعود به مرحله حذفی"}
                            className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block shadow-[0_0_8px_rgba(52,211,153,0.8)] shrink-0"
                          />
                        )}
                      </div>
                      {!isBilliards && player?.team && (
                        <span className="text-[11px] text-slate-400 truncate max-w-[110px]">
                          ({player.team})
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Stats */}
                  <td className="py-2.5 px-1.5 sm:px-2 text-center font-mono tabular-nums text-slate-200">
                    {st.played}
                  </td>
                  <td className="py-2.5 px-1.5 sm:px-2 text-center font-mono tabular-nums text-emerald-400 font-semibold">
                    {st.won}
                  </td>
                  {!isBilliards && (
                    <td className="py-2.5 px-1.5 sm:px-2 text-center font-mono tabular-nums text-amber-400">
                      {st.drawn}
                    </td>
                  )}
                  <td className="py-2.5 px-1.5 sm:px-2 text-center font-mono tabular-nums text-rose-400">
                    {st.lost}
                  </td>
                  <td className="py-2.5 px-1.5 sm:px-2 text-center font-mono tabular-nums text-slate-200">
                    {st.goalsFor}
                  </td>
                  <td className="py-2.5 px-1.5 sm:px-2 text-center font-mono tabular-nums text-slate-400">
                    {st.goalsAgainst}
                  </td>
                  <td
                    className={`py-2.5 px-1.5 sm:px-2 text-center font-mono tabular-nums font-semibold ${
                      st.goalDifference > 0
                        ? 'text-emerald-400'
                        : st.goalDifference < 0
                        ? 'text-rose-400'
                        : 'text-slate-400'
                    }`}
                  >
                    {st.goalDifference > 0 ? `+${st.goalDifference}` : st.goalDifference}
                  </td>
                  <td className="py-2.5 px-2 sm:px-3 text-center font-mono tabular-nums font-black text-sm text-app-primary">
                    {st.points}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Legend (Dynamic Text) */}
      {showQualificationLegend && (
        <div className="px-4 py-2 bg-app-surface/90 border-t border-app-border flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px] text-app-text-muted">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>
              {groupCount === 1
                ? (group?.advanceCount === 4
                    ? '۴ نفر برتر لیگ به مرحله نیمه‌نهایی صعود می‌کنند (نیمه‌نهایی و فینال).'
                    : group?.advanceCount === 8
                    ? '۸ نفر برتر لیگ به مرحله یک‌چهارم نهایی صعود می‌کنند (یک‌چهارم، نیمه‌نهایی و فینال).'
                    : group?.advanceCount === 16
                    ? '۱۶ نفر برتر لیگ به مرحله یک‌هشتم نهایی صعود می‌کنند (یک‌هشتم، یک‌چهارم، نیمه‌نهایی و فینال).'
                    : 'نفر اول و دوم به عنوان قهرمان و نایب‌قهرمان (یا صعودکننده به فینال) معرفی می‌شوند.')
                : groupCount === 4
                ? 'صعود به مرحله یک‌چهارم نهایی: ۲ نفر برتر هر گروه (مجموعاً ۸ بازیکن بدون احتساب تیم‌های سوم)'
                : groupCount === 3
                ? advancementRule === 'proportional'
                  ? 'صعود به مرحله حذفی: ۳ نفر از گروه‌های ۵ نفره و ۲ نفر از گروه ۴ نفره (مجموعاً ۸ بازیکن)'
                  : 'صعود به مرحله حذفی: ۲ نفر اول هر گروه + ۲ تیم برتر سوم (مجموعاً ۸ بازیکن)'
                : groupCount === 2
                ? 'صعود به مرحله نیمه‌نهایی: ۲ نفر برتر هر گروه (مجموعاً ۴ بازیکن)'
                : isBilliards
                ? '۲ نفر برتر هر گروه بر اساس امتیاز و سپس تفاضل فریم به مرحله حذفی صعود می‌کنند.'
                : 'صعود به مرحله حذفی: ۲ نفر برتر هر گروه'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-app-primary font-medium">
              {isBilliards ? 'محاسبه آنی امتیازات' : 'با ویرایش نتایج، امتیازات آنی محاسبه می‌شود'}
            </span>
            <span className="text-app-border hidden sm:inline">·</span>
            <span>{isBilliards ? 'برد: ۳ / باخت: ۰' : 'برد: ۳ / مساوی: ۱'}</span>
          </div>
        </div>
      )}
    </div>
  );
};
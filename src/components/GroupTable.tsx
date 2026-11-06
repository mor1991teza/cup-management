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
    <div className="card-stadium rounded-xl border border-app-border overflow-hidden shadow-sm bg-app-surface">
      {/* Header */}
      <div className="px-4 py-3 bg-app-surface border-b border-app-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-app-primary/20 border border-app-primary/40 flex items-center justify-center font-bold text-xs text-app-primary font-mono shadow-sm">
            {group.code}
          </div>
          <h3 className="font-bold text-sm text-app-text">{group.name}</h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-emerald-400 font-medium bg-emerald-950/50 px-2 py-0.5 rounded border border-emerald-800/50 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>{isBilliards ? 'جدول رده‌بندی بیلیارد' : 'جدول زنده'}</span>
          </span>
          <span className="text-[11px] text-app-text-muted">
            {standings.length} بازیکن
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs text-right whitespace-nowrap">
          <thead>
            <tr className="bg-app-bg/60 text-app-text-muted border-b border-app-border font-medium">
              <th className="py-2.5 px-3 text-center w-8">#</th>
              <th className="py-2.5 px-3 text-right">بازیکن و تیم</th>
              <th className="py-2.5 px-2 text-center font-mono" title="بازی (Played)">بازی</th>
              <th className="py-2.5 px-2 text-center font-mono text-emerald-400/90" title="برد (Wins)">برد</th>
              {!isBilliards && (
                <th className="py-2.5 px-2 text-center font-mono text-amber-400/90" title="مساوی (Drawn)">م</th>
              )}
              <th className="py-2.5 px-2 text-center font-mono text-rose-400/90" title="باخت (Losses)">باخت</th>
              <th className="py-2.5 px-2 text-center font-mono" title={isBilliards ? 'فریم برده (Frames Won)' : 'گل زده (Goals For)'}>
                {isBilliards ? 'فریم برده' : 'گ‌ز'}
              </th>
              <th className="py-2.5 px-2 text-center font-mono" title={isBilliards ? 'فریم باخته (Frames Lost)' : 'گل خورده (Goals Against)'}>
                {isBilliards ? 'فریم باخته' : 'گ‌خ'}
              </th>
              <th className="py-2.5 px-2 text-center font-mono" title={isBilliards ? 'تفاضل فریم (Frame Difference)' : 'تفاضل گل (Goal Difference)'}>
                {isBilliards ? 'تفاضل فریم' : 'تفاضل'}
              </th>
              <th className="py-2.5 px-3 text-center font-mono font-bold text-app-primary" title="امتیاز (Points - برد ۳، باخت ۰)">امتیاز</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-app-border/40">
            {standings.map((st, idx) => {
              // استفاده از لیست داینامیک صعود‌کنندگان
              const isQualified = advancingPlayerIds.has(st.playerId); 
              const player = playersMap.get(st.playerId);

              return (
                <tr
                  key={st.playerId}
                  className={`transition-colors hover:bg-app-primary/10 ${
                    isQualified ? 'bg-app-primary/10' : ''
                  }`}
                >
                  {/* Rank */}
                  <td className="py-2.5 px-3 text-center">
                    <span
                      className={`inline-flex items-center justify-center w-5 h-5 rounded text-[11px] font-mono font-bold ${
                        isQualified
                          ? idx === 0
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : idx === 1
                            ? 'bg-app-primary/20 text-app-primary border border-app-primary/40'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : 'text-app-text-muted/60'
                      }`}
                    >
                      {idx + 1}
                    </span>
                  </td>

                  {/* Player & Team */}
                  <td className="py-2.5 px-3">
                    <div className="flex items-center gap-2">
                      <div className="font-semibold text-app-text flex items-center gap-1.5">
                        <span>{isBilliards ? st.playerName.replace(/\s*\([^)]*\)/g, '').trim() : st.playerName}</span>
                        {isQualified && (
                          <span
                            title={isBilliards ? "سهمیه صعود به مرحله حذفی بیلیارد" : "سهمیه صعود به مرحله حذفی"}
                            className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block shadow-[0_0_8px_rgba(52,211,153,0.8)]"
                          />
                        )}
                      </div>
                      {!isBilliards && player?.team && (
                        <span className="text-[10px] text-app-text-muted truncate max-w-[120px]">
                          ({player.team})
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Stats */}
                  <td className="py-2.5 px-2 text-center font-mono tabular-nums text-app-text">
                    {st.played}
                  </td>
                  <td className="py-2.5 px-2 text-center font-mono tabular-nums text-emerald-400 font-semibold">
                    {st.won}
                  </td>
                  {!isBilliards && (
                    <td className="py-2.5 px-2 text-center font-mono tabular-nums text-amber-400">
                      {st.drawn}
                    </td>
                  )}
                  <td className="py-2.5 px-2 text-center font-mono tabular-nums text-rose-400">
                    {st.lost}
                  </td>
                  <td className="py-2.5 px-2 text-center font-mono tabular-nums text-app-text">
                    {st.goalsFor}
                  </td>
                  <td className="py-2.5 px-2 text-center font-mono tabular-nums text-app-text-muted">
                    {st.goalsAgainst}
                  </td>
                  <td
                    className={`py-2.5 px-2 text-center font-mono tabular-nums font-semibold ${
                      st.goalDifference > 0
                        ? 'text-emerald-400'
                        : st.goalDifference < 0
                        ? 'text-rose-400'
                        : 'text-app-text-muted'
                    }`}
                  >
                    {st.goalDifference > 0 ? `+${st.goalDifference}` : st.goalDifference}
                  </td>
                  <td className="py-2.5 px-3 text-center font-mono tabular-nums font-bold text-sm text-app-primary bg-app-primary/10">
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
              {isBilliards
                ? '۲ نفر برتر هر گروه بر اساس امتیاز و سپس تفاضل فریم به مرحله حذفی صعود می‌کنند.'
                : groupCount === 4
                ? 'صعود به مرحله یک‌چهارم نهایی: ۲ نفر برتر هر گروه (مجموعاً ۸ بازیکن بدون احتساب تیم‌های سوم)'
                : groupCount === 3
                ? advancementRule === 'proportional'
                  ? 'صعود به مرحله حذفی: ۳ نفر از گروه‌های ۵ نفره و ۲ نفر از گروه ۴ نفره (مجموعاً ۸ بازیکن)'
                  : 'صعود به مرحله حذفی: ۲ نفر اول هر گروه + ۲ تیم برتر سوم (مجموعاً ۸ بازیکن)'
                : groupCount === 2
                ? 'صعود به مرحله نیمه‌نهایی: ۲ نفر برتر هر گروه (مجموعاً ۴ بازیکن)'
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
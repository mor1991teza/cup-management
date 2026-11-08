import React, { useState, useMemo } from 'react';
import {
  Group,
  GroupStanding,
  Match,
  Player,
  TournamentState,
} from '../types/tournament';
import { GroupTable } from './GroupTable';
import { BilliardsGroupTable } from './BilliardsGroupTable';
import { LiveThirdPlaceStandings } from './LiveThirdPlaceStandings';
import { MatchCard } from './MatchCard';
import {
  Trophy,
  Filter,
  CheckCircle,
  Clock,
  ArrowLeft,
  ChevronDown,
  Layers,
  Sparkles,
  Edit,
  AlertCircle,
  Target,
} from 'lucide-react';
import { sound } from '../utils/audio';
import {
  isValidKnockoutCount,
  getNearestPowerOfTwoHint,
  getKnockoutCountErrorMessage,
} from '../utils/tournament';

interface GroupStageViewProps {
  state: TournamentState;
  standingsMap: Record<string, GroupStanding[]>;
  playersMap: Map<string, Player>;
  onSaveScore: (
    matchId: string,
    homeScore: number,
    awayScore: number,
    winnerId?: string | null,
    homePenalties?: number | null,
    awayPenalties?: number | null
  ) => void;
  onResetScore?: (matchId: string) => void;
  onAdvanceToKnockout: () => void;
  canAdvanceToKnockout: boolean;
  onOpenEditGroups: () => void;
}

export const GroupStageView: React.FC<GroupStageViewProps> = ({
  state,
  standingsMap,
  playersMap,
  onSaveScore,
  onResetScore,
  onAdvanceToKnockout,
  canAdvanceToKnockout,
  onOpenEditGroups,
}) => {
  const [selectedGroupFilter, setSelectedGroupFilter] = useState<string>('all');
  const [matchStatusFilter, setMatchStatusFilter] = useState<'all' | 'pending' | 'finished'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const groupMatches = state.matches.filter((m) => m.stage === 'group');
  const finishedGroupMatches = groupMatches.filter((m) => m.isFinished);
  const isAllGroupFinished = groupMatches.length > 0 && finishedGroupMatches.length === groupMatches.length;

  // -------------------------------------------------------------------------
  // 🔴 مجموع کل صعودی‌ها و بررسی توان ۲ بودن 🔴
  // -------------------------------------------------------------------------
  const isThreeGroupsBestThirds = state.groups.length === 3 && (state.advancementRule === 'bestThirds' || !state.advancementRule);

  const totalAdvancing = useMemo(() => {
    if (isThreeGroupsBestThirds) return 8;
    return state.groups.reduce((acc, g) => acc + (g.advanceCount ?? 2), 0);
  }, [state.groups, isThreeGroupsBestThirds]);

  const hasAnyGroupOverflow = useMemo(() => {
    if (isThreeGroupsBestThirds) return false;
    return state.groups.some((g) => (g.advanceCount ?? 2) > g.playerIds.length);
  }, [state.groups, isThreeGroupsBestThirds]);

  const isAdvanceCountValid = isValidKnockoutCount(totalAdvancing) && !hasAnyGroupOverflow;

  // -------------------------------------------------------------------------
  // 🔴 محاسبه داینامیک نفرات صعود‌کننده بر اساس سهمیه اختصاصی هر گروه 🔴
  // -------------------------------------------------------------------------
  const advancingPlayerIds = useMemo(() => {
    const ids = new Set<string>();

    if (isThreeGroupsBestThirds) {
      // صعود ۲ تیم اول هر گروه
      state.groups.forEach((g) => {
        const list = standingsMap[g.id] || [];
        if (list[0]) ids.add(list[0].playerId);
        if (list[1]) ids.add(list[1].playerId);
      });
      // صعود ۲ تیم برتر سوم بر اساس امتیاز و تفاضل گل
      const thirdPlaceList: Array<{ playerId: string; standing: GroupStanding }> = [];
      state.groups.forEach((g) => {
        const list = standingsMap[g.id] || [];
        if (list.length >= 3 && list[2]) {
          thirdPlaceList.push({ playerId: list[2].playerId, standing: list[2] });
        }
      });
      thirdPlaceList.sort((a, b) => {
        if (b.standing.points !== a.standing.points) return b.standing.points - a.standing.points;
        if (b.standing.goalDifference !== a.standing.goalDifference) return b.standing.goalDifference - a.standing.goalDifference;
        if (b.standing.goalsFor !== a.standing.goalsFor) return b.standing.goalsFor - a.standing.goalsFor;
        return a.standing.playerName.localeCompare(b.standing.playerName, 'fa');
      });
      if (thirdPlaceList[0]) ids.add(thirdPlaceList[0].playerId);
      if (thirdPlaceList[1]) ids.add(thirdPlaceList[1].playerId);
      return ids;
    }

    state.groups.forEach((g) => {
      const count = typeof g.advanceCount === 'number' ? g.advanceCount : 2;
      const list = standingsMap[g.id] || [];
      for (let i = 0; i < count; i++) {
        if (list[i]) ids.add(list[i].playerId);
      }
    });
    return ids;
  }, [state.groups, standingsMap, isThreeGroupsBestThirds]);

  // -------------------------------------------------------------------------
  // 🔴 متن توضیح سهمیه صعود 🔴
  // -------------------------------------------------------------------------
  const ruleDescription = useMemo(() => {
    if (isThreeGroupsBestThirds) {
      return 'قانون صعود: سیستم به صورت خودکار ۲ تیم اول هر گروه و ۲ تیم برتر سوم (مجموعاً ۸ تیم) را صعود می‌دهد.';
    }
    const groupSummary = state.groups.map(g => `${g.name}: ${g.advanceCount ?? 2} نفر`).join(' ، ');
    return `قانون صعود: مجموعاً ${totalAdvancing} بازیکن بر اساس سهمیه تعیین‌شده هر گروه (${groupSummary}) به مرحله حذفی صعود می‌کنند.`;
  }, [state.groups, totalAdvancing, isThreeGroupsBestThirds]);

  const displayedGroups =
    selectedGroupFilter === 'all'
      ? state.groups
      : state.groups.filter((g) => g.id === selectedGroupFilter);

  const filteredMatches = groupMatches.filter((m) => {
    if (selectedGroupFilter !== 'all' && m.groupId !== selectedGroupFilter) return false;
    if (matchStatusFilter === 'pending' && m.isFinished) return false;
    if (matchStatusFilter === 'finished' && !m.isFinished) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const homeP = m.homePlayerId ? playersMap.get(m.homePlayerId)?.name.toLowerCase() : '';
      const awayP = m.awayPlayerId ? playersMap.get(m.awayPlayerId)?.name.toLowerCase() : '';
      const homeT = m.homePlayerId ? playersMap.get(m.homePlayerId)?.team?.toLowerCase() : '';
      const awayT = m.awayPlayerId ? playersMap.get(m.awayPlayerId)?.team?.toLowerCase() : '';

      return (
        homeP?.includes(q) ||
        awayP?.includes(q) ||
        homeT?.includes(q) ||
        awayT?.includes(q)
      );
    }

    return true;
  });

  const roundsMap = new Map<number, Match[]>();
  filteredMatches.forEach((m) => {
    const r = m.roundIndex || 1;
    if (!roundsMap.has(r)) {
      roundsMap.set(r, []);
    }
    roundsMap.get(r)!.push(m);
  });
  const sortedRounds = Array.from(roundsMap.keys()).sort((a, b) => a - b);

  return (
    <div className="space-y-8">
      {/* Knockout Advance Callout Banner */}
      <div className={`card-stadium p-5 rounded-2xl border shadow-md ${
        state.gameType === 'billiards'
          ? 'border-emerald-800/80 bg-gradient-to-r from-[#062417] via-[#041a10] to-[#020e08] text-emerald-100'
          : 'border-app-border bg-app-surface text-app-text'
      }`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              {state.gameType === 'billiards' ? (
                <Target className="w-5 h-5 text-emerald-400" />
              ) : (
                <Trophy className="w-5 h-5 text-app-primary" />
              )}
              <h2 className="text-base sm:text-lg font-bold text-white">
                {state.gameType === 'billiards'
                  ? 'تنظیمات و وضعیت مرحله گروهی بیلیارد'
                  : 'وضعیت مرحله گروهی کاپ PES 2021'}
              </h2>
            </div>
            <p className={`text-xs ${state.gameType === 'billiards' ? 'text-emerald-300/80' : 'text-app-text-muted'}`}>
              {isAllGroupFinished
                ? state.gameType === 'billiards'
                  ? 'تمام بازی‌های مرحله گروهی بیلیارد به پایان رسیده است! بازیکنان صعودکننده مشخص شده‌اند.'
                  : 'تمام بازی‌های مرحله گروهی به پایان رسیده است! تیم‌های صعود‌کننده مشخص شده‌اند.'
                : `تاکنون ${finishedGroupMatches.length} مسابقه از مجموع ${groupMatches.length} مسابقه گروهی ثبت شده است.`}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                if (state.gameType !== 'billiards' && !isAdvanceCountValid) {
                  sound.playClick();
                  alert(
                    hasAnyGroupOverflow
                      ? 'تعداد صعودی نمیتواند بیشتر از تعداد بازیکنان گروه باشد.'
                      : getKnockoutCountErrorMessage(totalAdvancing)
                  );
                  return;
                }
                sound.playFanfare();
                onAdvanceToKnockout();
              }}
              disabled={state.gameType === 'billiards' ? !canAdvanceToKnockout : (!canAdvanceToKnockout || !isAdvanceCountValid)}
              title={
                state.gameType !== 'billiards' && !isAdvanceCountValid
                  ? hasAnyGroupOverflow
                    ? 'تعداد صعودی نمیتواند بیشتر از تعداد بازیکنان گروه باشد.'
                    : getKnockoutCountErrorMessage(totalAdvancing)
                  : undefined
              }
              className={`flex items-center gap-2 px-5 py-2.5 text-xs font-bold rounded-xl transition-all shadow-md active:scale-[0.98] ${
                (state.gameType === 'billiards' ? canAdvanceToKnockout : (canAdvanceToKnockout && isAdvanceCountValid))
                  ? state.gameType === 'billiards'
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:brightness-110 text-white cursor-pointer shadow-emerald-950/60 ring-1 ring-emerald-400/40'
                    : 'bg-app-primary hover:bg-app-primary-hover text-white cursor-pointer shadow-md'
                  : 'bg-app-surface text-app-text-muted/50 border border-app-border cursor-not-allowed'
              }`}
            >
              <Sparkles className="w-4 h-4 text-emerald-300" />
              <span>
                {state.gameType === 'billiards' ? 'ورود به مرحله حذفی بیلیارد' : 'ورود به مرحله حذفی (تکمیل گروهی)'}
              </span>
              <ArrowLeft className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* اخطار در صورتی که تعداد کل صعودی‌ها توان ۲ نباشد یا سهمیه از تعداد بازیکنان بیشتر باشد - فقط برای PES */}
        {state.gameType !== 'billiards' && !isAdvanceCountValid && (
          <div className="mt-3 p-3 bg-app-primary/20 border border-app-primary/50 rounded-xl text-xs text-app-text flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-app-primary shrink-0" />
              <span>
                {hasAnyGroupOverflow
                  ? 'تعداد صعودی نمیتواند بیشتر از تعداد بازیکنان گروه باشد.'
                  : getKnockoutCountErrorMessage(totalAdvancing)}
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                sound.playClick();
                onOpenEditGroups();
              }}
              className="px-3 py-1 bg-app-primary hover:bg-app-primary-hover text-white rounded-lg text-xs font-bold shrink-0 cursor-pointer"
            >
              اصلاح سهمیه گروه‌ها
            </button>
          </div>
        )}

        {/* Qualification preview */}
        <div className="mt-4 pt-3 border-t border-app-border flex flex-wrap items-center gap-x-6 gap-y-2 text-xs">
          <span className="text-app-text-muted font-medium">تیم‌های صعود‌کننده تا این لحظه:</span>
          {state.groups.map((g) => {
            const list = standingsMap[g.id] || [];
            const qualifiedInGroup = list.filter(st => advancingPlayerIds.has(st.playerId));
            
            return (
              <div key={g.id} className="flex items-center gap-1.5 text-[11px] text-app-text">
                <span className="font-bold text-app-primary">{g.name}:</span>
                {qualifiedInGroup.length > 0 ? (
                  qualifiedInGroup.map((st, i) => (
                    <React.Fragment key={st.playerId}>
                      <span className={i === 0 ? 'text-emerald-400 font-medium' : 'text-app-primary font-medium'}>
                        {st.playerName}
                      </span>
                      {i < qualifiedInGroup.length - 1 && <span className="text-app-text-muted">،</span>}
                    </React.Fragment>
                  ))
                ) : (
                  <span className="text-app-text-muted">-</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Group Standings Section */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-3">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Layers className="w-4 h-4 text-emerald-400" />
            <span>جدول امتیازات گروه‌ها</span>
          </h2>

          <div className="flex items-center gap-2 flex-wrap">
            {/* دکمه ویرایش تعداد و ترکیب گروه‌ها */}
            <button
              onClick={() => {
                sound.playClick();
                onOpenEditGroups();
              }}
              disabled={finishedGroupMatches.length > 0 || state.status === 'knockout' || state.status === 'finished'}
              title={
                state.status === 'knockout' || state.status === 'finished'
                  ? "پس از شروع مرحله حذفی امکان ویرایش وجود ندارد"
                  : finishedGroupMatches.length > 0 
                  ? "پس از شروع بازی‌ها امکان ویرایش وجود ندارد" 
                  : "ویرایش تعداد و ترکیب گروه‌ها"
              }
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg shadow-sm transition-all ${
                (finishedGroupMatches.length > 0 || state.status === 'knockout' || state.status === 'finished')
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                  : 'text-amber-950 bg-gradient-to-r from-amber-400 to-yellow-300 hover:from-amber-300 hover:to-yellow-200 cursor-pointer'
              }`}
            >
              <Edit className="w-3.5 h-3.5" />
              <span>ویرایش تعداد و ترکیب گروه‌ها</span>
            </button>

            {/* متن راهنمای داینامیک زیر دکمه یا نشانگر وضعیت */}
            {finishedGroupMatches.length === 0 && state.status === 'group' ? (
              <span className="text-[10px] font-bold text-rose-300 bg-rose-950/70 border border-rose-800/60 px-2 py-1 rounded-lg">
                {state.groups.length} گروه (قابل ویرایش)
              </span>
            ) : (
              <span className="text-[10px] text-rose-400 font-medium max-w-[200px] text-center">
                {state.status === 'knockout' || state.status === 'finished'
                  ? 'پس از شروع مرحله حذفی غیرفعال است'
                  : 'پس از شروع بازی‌ها غیرفعال شد'}
              </span>
            )}
            {/* Group Filter Tabs (Segmented controls) */}
            <div className="flex items-center gap-1 p-1 bg-app-surface rounded-lg border border-app-border text-xs">
              <button
                onClick={() => {
                  sound.playClick();
                  setSelectedGroupFilter('all');
                }}
                className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
                  selectedGroupFilter === 'all'
                    ? 'bg-app-primary/20 text-app-primary font-bold border border-app-primary/40 shadow-sm'
                    : 'text-app-text-muted hover:text-app-text'
                }`}
              >
                همه گروه‌ها
              </button>
              {state.groups.map((g) => (
                <button
                  key={g.id}
                  onClick={() => {
                    sound.playClick();
                    setSelectedGroupFilter(g.id);
                  }}
                  className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
                    selectedGroupFilter === g.id
                      ? 'bg-app-primary/20 text-app-primary font-bold border border-app-primary/40 shadow-sm'
                      : 'text-app-text-muted hover:text-app-text'
                  }`}
                >
                  {g.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Grid of Group Tables */}
        <div
          className={`grid gap-6 ${
            displayedGroups.length === 1
              ? 'grid-cols-1'
              : 'grid-cols-1 xl:grid-cols-2'
          }`}
        >
          {displayedGroups.map((group) => (
            state.gameType === 'billiards' ? (
              <BilliardsGroupTable
                key={group.id}
                group={group}
                standings={standingsMap[group.id] || []}
                playersMap={playersMap}
                advancingPlayerIds={advancingPlayerIds}
                advancementRule={state.advancementRule || 'bestThirds'}
                groupCount={state.groups.length}
              />
            ) : (
              <GroupTable
                key={group.id}
                group={group}
                standings={standingsMap[group.id] || []}
                playersMap={playersMap}
                advancingPlayerIds={advancingPlayerIds}
                advancementRule={state.advancementRule}
                groupCount={state.groups.length}
                gameType={state.gameType || 'pes'}
              />
            )
          ))}
        </div>

        {/* جدول زنده مقایسه تیم‌های رتبه سوم در صورت وجود ۳ گروه */}
        {isThreeGroupsBestThirds && (
          <LiveThirdPlaceStandings
            groups={state.groups}
            standingsMap={standingsMap}
            gameType={state.gameType || 'pes'}
          />
        )}

        {/* 🔴 نمایش متن قانون زیر جداول فقط برای PES 🔴 */}
        {state.gameType !== 'billiards' && !isThreeGroupsBestThirds && (
          <div className="mt-4 p-3 bg-app-surface/60 border border-app-border rounded-lg text-center text-xs text-app-text-muted font-medium">
            {ruleDescription}
          </div>
        )}
      </div>

      {/* Match Fixtures Section */}
      <div className="space-y-4 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-app-border pb-3">
          <div>
            <h2 className="text-base font-bold text-app-text flex items-center gap-2">
              <Clock className="w-4 h-4 text-app-primary" />
              <span>برنامه و ثبت نتایج مسابقات هفته</span>
            </h2>
            <p className="text-xs text-app-text-muted mt-0.5">
              نتایج بازی‌ها را وارد کرده و دکمه ثبت نتیجه را بزنید تا جدول امتیازات بلافاصله بروزرسانی شود.
            </p>
          </div>

          {/* Fixture status filters */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1 p-1 bg-app-surface rounded-lg border border-app-border text-xs">
              <button
                onClick={() => {
                  sound.playClick();
                  setMatchStatusFilter('all');
                }}
                className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                  matchStatusFilter === 'all'
                    ? 'bg-app-primary/20 text-app-primary font-bold border border-app-primary/40'
                    : 'text-app-text-muted hover:text-app-text'
                }`}
              >
                همه ({groupMatches.length})
              </button>
              <button
                onClick={() => {
                  sound.playClick();
                  setMatchStatusFilter('pending');
                }}
                className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                  matchStatusFilter === 'pending'
                    ? 'bg-app-primary/20 text-app-primary font-bold border border-app-primary/40'
                    : 'text-app-text-muted hover:text-app-text'
                }`}
              >
                باقیمانده ({groupMatches.length - finishedGroupMatches.length})
              </button>
              <button
                onClick={() => {
                  sound.playClick();
                  setMatchStatusFilter('finished');
                }}
                className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                  matchStatusFilter === 'finished'
                    ? 'bg-app-primary/20 text-app-primary font-bold border border-app-primary/40'
                    : 'text-app-text-muted hover:text-app-text'
                }`}
              >
                انجام شده ({finishedGroupMatches.length})
              </button>
            </div>
          </div>
        </div>

        {/* Fixtures List */}
        {filteredMatches.length === 0 ? (
          <div className="card-stadium p-8 rounded-xl text-center text-xs text-slate-400">
            مسابقه‌ای با فیلتر انتخابی شما یافت نشد.
          </div>
        ) : (
          <div className="space-y-6">
            {sortedRounds.map((roundNum) => {
              const roundMatches = roundsMap.get(roundNum) || [];
              return (
                <div key={roundNum} className="space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-app-primary bg-app-primary/20 px-2.5 py-0.5 rounded border border-app-primary/40 shadow-sm">
                      هفته {roundNum} مسابقات
                    </span>
                    <div className="h-px bg-app-border flex-1" />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    {roundMatches.map((match) => (
                      <MatchCard
                        key={match.id}
                        match={match}
                        playersMap={playersMap}
                        onSaveScore={onSaveScore}
                        onResetScore={onResetScore}
                        isKnockout={false}
                        gameType={state.gameType || 'pes'}
                        billiardsFormat={state.billiardsFormat}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
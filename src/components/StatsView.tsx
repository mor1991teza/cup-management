import React from 'react';
import { Match, Player, TournamentState } from '../types/tournament';
import { Flame, ShieldCheck, Trophy, Swords, Zap } from 'lucide-react';

interface StatsViewProps {
  state: TournamentState;
  playersMap: Map<string, Player>;
}

export const StatsView: React.FC<StatsViewProps> = ({ state, playersMap }) => {
  const {
    statsList,
    topScorers,
    bestDefenses,
    highestScoringMatch,
    totalDraws,
    totalWins,
    totalGoals,
  } = React.useMemo(() => {
    const playerStats = new Map<
      string,
      {
        playerId: string;
        name: string;
        team?: string;
        goalsScored: number;
        goalsConceded: number;
        matchesPlayed: number;
        wins: number;
      }
    >();

    state.players.forEach((p) => {
      playerStats.set(p.id, {
        playerId: p.id,
        name: p.name,
        team: p.team,
        goalsScored: 0,
        goalsConceded: 0,
        matchesPlayed: 0,
        wins: 0,
      });
    });

    let topMatch: { match: Match; totalGoals: number } | null = null;
    let draws = 0;
    let wins = 0;
    let goals = 0;

    for (const m of state.matches) {
      if (!m.isFinished || m.homeScore === null || m.awayScore === null) continue;

      const matchTotal = m.homeScore + m.awayScore;
      goals += matchTotal;

      if (!topMatch || matchTotal > topMatch.totalGoals) {
        topMatch = { match: m, totalGoals: matchTotal };
      }

      if (m.homeScore === m.awayScore) {
        draws++;
      } else {
        wins++;
      }

      if (m.homePlayerId && playerStats.has(m.homePlayerId)) {
        const h = playerStats.get(m.homePlayerId)!;
        h.goalsScored += m.homeScore;
        h.goalsConceded += m.awayScore;
        h.matchesPlayed++;
        if (m.homeScore > m.awayScore) h.wins++;
      }

      if (m.awayPlayerId && playerStats.has(m.awayPlayerId)) {
        const a = playerStats.get(m.awayPlayerId)!;
        a.goalsScored += m.awayScore;
        a.goalsConceded += m.homeScore;
        a.matchesPlayed++;
        if (m.awayScore > m.homeScore) a.wins++;
      }
    }

    const list = Array.from(playerStats.values());
    const scorers = [...list]
      .filter((s) => s.matchesPlayed > 0)
      .sort((a, b) => b.goalsScored - a.goalsScored)
      .slice(0, 5);

    const defenses = [...list]
      .filter((s) => s.matchesPlayed > 0)
      .sort((a, b) => {
        const aAvg = a.goalsConceded / a.matchesPlayed;
        const bAvg = b.goalsConceded / b.matchesPlayed;
        return aAvg - bAvg;
      })
      .slice(0, 5);

    return {
      statsList: list,
      topScorers: scorers,
      bestDefenses: defenses,
      highestScoringMatch: topMatch,
      totalDraws: draws,
      totalWins: wins,
      totalGoals: goals,
    };
  }, [state.players, state.matches]);

  const isBilliards = state.gameType === 'billiards';
  const unitLabel = isBilliards ? 'فریم' : 'گل';

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card-stadium p-5 rounded-2xl border border-white/10">
          <div className="text-[11px] text-slate-400">
            {isBilliards ? 'مجموع فریم‌های برده' : 'مجموع گلهای تورنمنت'}
          </div>
          <div className="text-2xl font-black font-mono tabular-nums text-app-primary mt-1.5">
            {totalGoals}
          </div>
          <div className="text-[10px] text-slate-500 mt-1">
            در {state.matches.filter((m) => m.isFinished).length} مسابقه ثبت شده
          </div>
        </div>

        <div className="card-stadium p-5 rounded-2xl border border-white/10">
          <div className="text-[11px] text-slate-400">
            {isBilliards ? 'میانگین فریم هر مسابقه' : 'میانگین گل هر مسابقه'}
          </div>
          <div className="text-2xl font-black font-mono tabular-nums text-emerald-400 mt-1.5">
            {state.matches.filter((m) => m.isFinished).length > 0
              ? (totalGoals / state.matches.filter((m) => m.isFinished).length).toFixed(2)
              : '0.00'}
          </div>
          <div className="text-[10px] text-slate-500 mt-1">
            {isBilliards ? 'نرخ فریم در هر بازی' : 'نرخ گلزنی در بازی‌ها'}
          </div>
        </div>

        <div className="card-stadium p-5 rounded-2xl border border-white/10">
          <div className="text-[11px] text-slate-400">تعداد بردهای قاطع</div>
          <div className="text-2xl font-black font-mono tabular-nums text-amber-400 mt-1.5">
            {totalWins}
          </div>
          <div className="text-[10px] text-slate-500 mt-1">
            {totalDraws} بازی نیز با تساوی به پایان رسیده
          </div>
        </div>

        <div className="card-stadium p-5 rounded-2xl border border-white/10">
          <div className="text-[11px] text-slate-400">تعداد کل بازیکنان</div>
          <div className="text-2xl font-black font-mono tabular-nums text-white mt-1.5">
            {state.players.length}
          </div>
          <div className="text-[10px] text-slate-500 mt-1">در قالب {state.groups.length} گروه</div>
        </div>
      </div>

      {/* Leaderboard Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Scorers */}
        <div className="card-stadium p-6 rounded-2xl border border-white/10">
          <div className="flex items-center gap-2 border-b border-white/10 pb-3 mb-4">
            <Flame className="w-4 h-4 text-app-primary" />
            <h3 className="text-sm font-bold text-app-text">
              {isBilliards
                ? 'برترین پات‌کنندگان (بیشترین فریم‌های برده)'
                : 'برترین خطوط حمله (آقای گل تورنمنت)'}
            </h3>
          </div>

          {topScorers.length === 0 ? (
            <div className="text-center py-6 text-xs text-app-text-muted">
              هنوز مسابقه‌ای ثبت نشده است.
            </div>
          ) : (
            <div className="space-y-2">
              {topScorers.map((s, idx) => (
                <div
                  key={s.playerId}
                  className="flex items-center justify-between p-2.5 bg-app-bg/60 border border-app-border/80 rounded-lg text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-5 h-5 rounded bg-app-primary/20 border border-app-primary/40 text-center font-mono font-bold text-[11px] text-app-primary flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <div>
                      <div className="font-bold text-app-text">{s.name}</div>
                      {s.team && <div className="text-[10px] text-app-text-muted">{s.team}</div>}
                    </div>
                  </div>
                  <div className="text-left font-mono">
                    <span className="text-base font-bold text-app-primary tabular-nums">
                      {s.goalsScored}
                    </span>
                    <span className="text-[10px] text-app-text-muted mr-1">{unitLabel}</span>
                    <div className="text-[10px] text-app-text-muted">
                      ({(s.goalsScored / s.matchesPlayed).toFixed(1)} در هر بازی)
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Best Defenses */}
        <div className="card-stadium p-5 rounded-xl border border-app-border bg-app-surface">
          <div className="flex items-center gap-2 border-b border-app-border pb-3 mb-3">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-app-text">
              {isBilliards
                ? 'کمترین فریم واگذار شده'
                : 'بهترین خطوط دفاعی (کمترین میانگین گل خورده)'}
            </h3>
          </div>

          {bestDefenses.length === 0 ? (
            <div className="text-center py-6 text-xs text-app-text-muted">
              هنوز مسابقه‌ای ثبت نشده است.
            </div>
          ) : (
            <div className="space-y-2">
              {bestDefenses.map((s, idx) => (
                <div
                  key={s.playerId}
                  className="flex items-center justify-between p-2.5 bg-app-bg/60 border border-app-border/80 rounded-lg text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-5 h-5 rounded bg-app-bg border border-app-border text-center font-mono font-bold text-[11px] text-emerald-400 flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <div>
                      <div className="font-bold text-app-text">{s.name}</div>
                      {s.team && <div className="text-[10px] text-app-text-muted">{s.team}</div>}
                    </div>
                  </div>
                  <div className="text-left font-mono">
                    <span className="text-base font-bold text-emerald-400 tabular-nums">
                      {s.goalsConceded}
                    </span>
                    <span className="text-[10px] text-app-text-muted mr-1">
                      {isBilliards ? 'فریم واگذار شده' : 'گل خورده'}
                    </span>
                    <div className="text-[10px] text-app-text-muted">
                      (میانگین {(s.goalsConceded / s.matchesPlayed).toFixed(1)} در هر بازی)
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Highest Scoring Match Spotlight */}
      {highestScoringMatch && highestScoringMatch.totalGoals > 0 && (
        <div className="card-stadium p-5 rounded-xl border border-app-primary/40 bg-app-surface">
          <div className="flex items-center gap-2 text-xs font-bold text-app-primary mb-2">
            <Zap className="w-4 h-4" />
            <span>
              {isBilliards
                ? 'پرفریم‌ترین و مهیج‌ترین مسابقه تا این لحظه'
                : 'پرگل‌ترین و مهیج‌ترین مسابقه کاپ تا این لحظه'}
            </span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-2">
            <div className="flex items-center gap-3 text-sm">
              <span className="font-bold text-app-text">
                {highestScoringMatch.match.homePlayerId
                  ? playersMap.get(highestScoringMatch.match.homePlayerId)?.name
                  : '-'}
              </span>
              <div className="px-3 py-1 bg-app-bg border border-app-primary/60 rounded-lg font-mono font-extrabold text-app-primary">
                {highestScoringMatch.match.homeScore} : {highestScoringMatch.match.awayScore}
              </div>
              <span className="font-bold text-app-text">
                {highestScoringMatch.match.awayPlayerId
                  ? playersMap.get(highestScoringMatch.match.awayPlayerId)?.name
                  : '-'}
              </span>
            </div>
            <div className="text-xs text-slate-400 font-mono">
              مجموع {highestScoringMatch.totalGoals} گل در این رقابت
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

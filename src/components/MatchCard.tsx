import React, { useState, useEffect, useRef } from 'react';
import { Match, Player, GameType, BilliardsFormat } from '../types/tournament';
import {
  Check,
  Edit3,
  Plus,
  Minus,
  RotateCcw,
  Sparkles,
  Trophy,
  CheckCircle2,
  AlertCircle,
  Crown,
  Flame,
  GitBranch,
} from 'lucide-react';
import { sound } from '../utils/audio';

interface MatchCardProps {
  match: Match;
  playersMap: Map<string, Player>;
  onSaveScore: (
    matchId: string,
    homeScore: number,
    awayScore: number,
    winnerId?: string | null,
    homePenalties?: number | null,
    awayPenalties?: number | null
  ) => void;
  onSaveBo3Game?: (
    matchId: string,
    gameNumber: number,
    homeScore: number,
    awayScore: number
  ) => void;
  onQuickBo3Win?: (matchId: string, winningSide: 'home' | 'away') => void;
  onResetScore?: (matchId: string) => void;
  isKnockout?: boolean;
  gameType?: GameType;
  billiardsFormat?: BilliardsFormat;
  onSelectPlayer?: (playerId: string) => void;
  onSavePlayInGame?: (
    matchId: string,
    gameNumber: number,
    homeScore: number,
    awayScore: number
  ) => void;
  onSwapPlayInSlot?: (matchId: string, targetSlot: 'home' | 'away') => void;
}

export const MatchCard: React.FC<MatchCardProps> = ({
  match,
  playersMap,
  onSaveScore,
  onSaveBo3Game,
  onQuickBo3Win,
  onResetScore,
  isKnockout = false,
  gameType = 'pes',
  billiardsFormat = 'bo3',
  onSelectPlayer,
  onSavePlayInGame,
  onSwapPlayInSlot,
}) => {
  const [homeScoreInput, setHomeScoreInput] = useState<string>(
    match.homeScore !== null ? String(match.homeScore) : ''
  );
  const [awayScoreInput, setAwayScoreInput] = useState<string>(
    match.awayScore !== null ? String(match.awayScore) : ''
  );
  const [homePenInput, setHomePenInput] = useState<string>(
    match.homePenaltyScore !== null && match.homePenaltyScore !== undefined
      ? String(match.homePenaltyScore)
      : ''
  );
  const [awayPenInput, setAwayPenInput] = useState<string>(
    match.awayPenaltyScore !== null && match.awayPenaltyScore !== undefined
      ? String(match.awayPenaltyScore)
      : ''
  );
  const [penaltyWinner, setPenaltyWinner] = useState<string | null>(
    match.winnerId || null
  );

  // If match is finished, start in collapsed mode, but allow opening edit mode
  const [isEditing, setIsEditing] = useState<boolean>(!match.isFinished);
  const [showSavedFeedback, setShowSavedFeedback] = useState<boolean>(false);
  const feedbackTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Synchronize internal inputs if match prop values change from outside
  useEffect(() => {
    setHomeScoreInput(match.homeScore !== null ? String(match.homeScore) : '');
    setAwayScoreInput(match.awayScore !== null ? String(match.awayScore) : '');
    setHomePenInput(
      match.homePenaltyScore !== null && match.homePenaltyScore !== undefined
        ? String(match.homePenaltyScore)
        : ''
    );
    setAwayPenInput(
      match.awayPenaltyScore !== null && match.awayPenaltyScore !== undefined
        ? String(match.awayPenaltyScore)
        : ''
    );
    setPenaltyWinner(match.winnerId || null);
  }, [match.id, match.homeScore, match.awayScore, match.winnerId, match.homePenaltyScore, match.awayPenaltyScore]);

  // Auto-sync penaltyWinner whenever penalty scores are entered
  useEffect(() => {
    const hp = homePenInput !== '' ? parseInt(homePenInput, 10) : null;
    const ap = awayPenInput !== '' ? parseInt(awayPenInput, 10) : null;
    if (hp !== null && !isNaN(hp) && ap !== null && !isNaN(ap) && hp !== ap) {
      const autoWinner = hp > ap ? match.homePlayerId : match.awayPlayerId;
      setPenaltyWinner(autoWinner || null);
    }
  }, [homePenInput, awayPenInput, match.homePlayerId, match.awayPlayerId]);

  const homePlayer = match.homePlayerId ? playersMap.get(match.homePlayerId) : null;
  const awayPlayer = match.awayPlayerId ? playersMap.get(match.awayPlayerId) : null;
  const isBothAssigned = Boolean(match.homePlayerId && match.awayPlayerId);

  const homeScoreNum = homeScoreInput === '' ? null : parseInt(homeScoreInput, 10);
  const awayScoreNum = awayScoreInput === '' ? null : parseInt(awayScoreInput, 10);
  const isTied = homeScoreNum !== null && awayScoreNum !== null && homeScoreNum === awayScoreNum;

  const isBilliards = gameType === 'billiards';
  const unitLabel = isBilliards ? 'فریم' : 'گل';

  // Calculate required target wins for Billiards mode (Race to X)
  const targetWins = (() => {
    if (billiardsFormat === 'single') return 1;
    if (billiardsFormat === 'bo3') return 2;
    if (billiardsFormat === 'bo5') return 3;
    if (match.isBo3) return 2;
    return 2;
  })();

  // Quick Win handler for Billiards mode
  const handleQuickBilliardsWin = (hScore: number, aScore: number) => {
    setHomeScoreInput(String(hScore));
    setAwayScoreInput(String(aScore));
    saveResult(hScore, aScore, { playWhistleSound: true });
    setIsEditing(false);
  };

  // Trigger save and update table
  const saveResult = (
    hScore: number,
    aScore: number,
    options?: { playWhistleSound?: boolean }
  ) => {
    let winner: string | null = null;
    let homePen: number | null = null;
    let awayPen: number | null = null;

    if (isBilliards) {
      if (hScore > aScore) {
        winner = match.homePlayerId;
      } else if (aScore > hScore) {
        winner = match.awayPlayerId;
      }
    } else if (isKnockout) {
      if (hScore > aScore) {
        winner = match.homePlayerId;
      } else if (aScore > hScore) {
        winner = match.awayPlayerId;
      } else {
        const hp = homePenInput !== '' ? parseInt(homePenInput, 10) : null;
        const ap = awayPenInput !== '' ? parseInt(awayPenInput, 10) : null;
        homePen = hp;
        awayPen = ap;

        if (hp !== null && ap !== null && hp !== ap) {
          winner = hp > ap ? match.homePlayerId : match.awayPlayerId;
        } else if (penaltyWinner) {
          winner = penaltyWinner;
        } else {
          winner = match.homePlayerId;
        }
      }
    } else {
      if (hScore > aScore) {
        winner = match.homePlayerId;
      } else if (aScore > hScore) {
        winner = match.awayPlayerId;
      }
    }

    if (options?.playWhistleSound) {
      sound.playWhistle();
    }

    onSaveScore(match.id, hScore, aScore, winner, homePen, awayPen);

    setShowSavedFeedback(true);
    if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
    feedbackTimerRef.current = setTimeout(() => {
      setShowSavedFeedback(false);
    }, 2200);
  };

  // Adjust score with stepper (only updates local state, no auto-save)
  const adjustScore = (target: 'home' | 'away', delta: number) => {
    sound.playClick();

    let newHome = homeScoreNum === null ? 0 : homeScoreNum;
    let newAway = awayScoreNum === null ? 0 : awayScoreNum;

    if (target === 'home') {
      newHome = Math.max(0, newHome + delta);
      setHomeScoreInput(String(newHome));
    } else {
      newAway = Math.max(0, newAway + delta);
      setAwayScoreInput(String(newAway));
    }
  };

  // Handle manual input blur or Enter key
  const handleScoreInputBlur = () => {
    // فقط اگر مسابقه از قبل انجام شده باشد، تغییرات را ذخیره کن
    if (
      match.isFinished &&
      homeScoreNum !== null &&
      !isNaN(homeScoreNum) &&
      awayScoreNum !== null &&
      !isNaN(awayScoreNum)
    ) {
      if (isBilliards) {
        if (homeScoreNum !== awayScoreNum && Math.max(homeScoreNum, awayScoreNum) >= targetWins) {
          saveResult(homeScoreNum, awayScoreNum, { playWhistleSound: false });
        }
      } else {
        saveResult(homeScoreNum, awayScoreNum, { playWhistleSound: false });
      }
    }
  };

  const handleExplicitSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (homeScoreNum === null || isNaN(homeScoreNum) || awayScoreNum === null || isNaN(awayScoreNum)) {
      return;
    }

    if (isBilliards) {
      if (homeScoreNum === awayScoreNum) return;
      if (Math.max(homeScoreNum, awayScoreNum) < targetWins) return;
    } else if (isKnockout && isTied) {
      const hp = homePenInput !== '' ? parseInt(homePenInput, 10) : null;
      const ap = awayPenInput !== '' ? parseInt(awayPenInput, 10) : null;
      const hasPenDecisive = hp !== null && ap !== null && hp !== ap;
      if (!hasPenDecisive && !penaltyWinner) {
        return;
      }
    }

    saveResult(homeScoreNum, awayScoreNum, { playWhistleSound: true });
    setIsEditing(false);
  };

  // Reset match to unplayed
  const handleResetMatch = () => {
    sound.playClick();
    if (onResetScore) {
      onResetScore(match.id);
    }
    setHomeScoreInput('');
    setAwayScoreInput('');
    setHomePenInput('');
    setAwayPenInput('');
    setPenaltyWinner(null);
    setIsEditing(true);
  };

  // Bo3 local state
  const nextGameNum = Math.min(3, (match.games?.length || 0) + 1);
  const [bo3HomeScore, setBo3HomeScore] = useState<string>('0');
  const [bo3AwayScore, setBo3AwayScore] = useState<string>('0');
  const [, setBo3Error] = useState<string | null>(null);

  const bo3HomeScoreNum = bo3HomeScore === '' ? null : parseInt(bo3HomeScore, 10);
  const bo3AwayScoreNum = bo3AwayScore === '' ? null : parseInt(bo3AwayScore, 10);
  const isBo3Tied =
    bo3HomeScoreNum !== null && bo3AwayScoreNum !== null && bo3HomeScoreNum === bo3AwayScoreNum;

  // Play-in 3-Way local state (hoisted to top level to obey Rules of Hooks)
  const playInGame1 = match.games?.[0] || { gameNumber: 1, homeScore: null, awayScore: null, winnerId: null, isFinished: false };
  const playInGame2 = match.games?.[1] || { gameNumber: 2, homeScore: null, awayScore: null, winnerId: null, isFinished: false };
  const [g1Home, setG1Home] = useState<string>(playInGame1.homeScore !== null ? String(playInGame1.homeScore) : '');
  const [g1Away, setG1Away] = useState<string>(playInGame1.awayScore !== null ? String(playInGame1.awayScore) : '');
  const [g2Home, setG2Home] = useState<string>(playInGame2.homeScore !== null ? String(playInGame2.homeScore) : '');
  const [g2Away, setG2Away] = useState<string>(playInGame2.awayScore !== null ? String(playInGame2.awayScore) : '');

  useEffect(() => {
    setG1Home(playInGame1.homeScore !== null ? String(playInGame1.homeScore) : '');
    setG1Away(playInGame1.awayScore !== null ? String(playInGame1.awayScore) : '');
    setG2Home(playInGame2.homeScore !== null ? String(playInGame2.homeScore) : '');
    setG2Away(playInGame2.awayScore !== null ? String(playInGame2.awayScore) : '');
  }, [
    match.id,
    playInGame1.homeScore,
    playInGame1.awayScore,
    playInGame1.isFinished,
    playInGame2.homeScore,
    playInGame2.awayScore,
    playInGame2.isFinished,
  ]);

  // Helper to render competitor slot with clickable progression path and TBD / Fixed stage support
  const renderCompetitorName = (
    player: Player | null | undefined,
    seedLabel: string | undefined,
    side: 'home' | 'away',
    isWinner?: boolean | string | null
  ) => {
    if (player) {
      const displayName = isBilliards
        ? player.name.replace(/\s*\([^)]*\)/g, '').trim()
        : player.name;

      return (
        <button
          type="button"
          onClick={() => {
            sound.playClick();
            onSelectPlayer?.(player.id);
          }}
          className={`${
            side === 'home' ? 'text-right justify-end' : 'text-left justify-start'
          } truncate hover:text-emerald-400 transition-all duration-300 cursor-pointer group flex items-center gap-1.5 w-full animate-fade-in`}
          title={`مشاهده مسیر صعود و سوابق مسابقات ${displayName}`}
        >
          {side === 'away' && (
            <GitBranch className="w-3 h-3 text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
          )}
          <span
            className={`truncate underline-offset-4 group-hover:underline transition-colors ${
              isWinner ? 'text-emerald-400 font-black' : 'text-white'
            }`}
          >
            {displayName}
          </span>
          {side === 'home' && (
            <GitBranch className="w-3 h-3 text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
          )}
        </button>
      );
    }

    // Player not yet assigned (Placeholder / TBD / Winner of Match X)
    const isSemiOrFinal =
      match.knockoutRound === 'semi' ||
      match.knockoutRound === 'final' ||
      match.knockoutRound === 'thirdPlace';

    if (isSemiOrFinal) {
      const fallbackLabel =
        match.knockoutRound === 'final'
          ? (side === 'home' ? 'برنده نیمه‌نهایی ۱' : 'برنده نیمه‌نهایی ۲')
          : match.knockoutRound === 'thirdPlace'
          ? (side === 'home' ? 'بازنده نیمه‌نهایی ۱' : 'بازنده نیمه‌نهایی ۲')
          : (side === 'home' ? 'برنده بازی قبل ۱' : 'برنده بازی قبل ۲');

      return (
        <div
          className={`${
            side === 'home' ? 'text-right justify-end' : 'text-left justify-start'
          } text-amber-300/80 text-xs font-semibold truncate flex items-center gap-1 w-full`}
        >
          {side === 'away' && <Sparkles className="w-3 h-3 text-amber-400/70 shrink-0" />}
          <span className="truncate">{seedLabel || fallbackLabel}</span>
          {side === 'home' && <Sparkles className="w-3 h-3 text-amber-400/70 shrink-0" />}
        </div>
      );
    }

    // Default TBD for redraw rounds (quarter, 16, 32, 64)
    return (
      <div
        className={`${
          side === 'home' ? 'text-right justify-end' : 'text-left justify-start'
        } opacity-60 text-slate-400 font-mono text-xs italic truncate flex items-center gap-1.5 w-full`}
      >
        {side === 'home' && <span className="truncate">{seedLabel || 'TBD • در انتظار قرعه‌کشی'}</span>}
        <span className="w-1.5 h-1.5 rounded-full bg-slate-500 animate-pulse shrink-0" />
        {side === 'away' && <span className="truncate">{seedLabel || 'TBD • در انتظار قرعه‌کشی'}</span>}
      </div>
    );
  };

  // If this match is Best of 3 (Bo3 format - PES only, excluding 3-way Play-in)
  if (match.isBo3 && !match.isPlayIn3Way && !isBilliards) {
    const winnerPlayer = match.winnerId ? playersMap.get(match.winnerId) : null;
    const homeGamesWon = match.homeGamesWon || 0;
    const awayGamesWon = match.awayGamesWon || 0;

    const handleBo3SaveGame = () => {
      if (bo3HomeScoreNum === null || bo3AwayScoreNum === null) return;
      if (bo3HomeScoreNum === bo3AwayScoreNum) {
        setBo3Error('در مسابقات حذفی نتیجه مساوی وجود ندارد. لطفاً برنده را مشخص کنید.');
        return;
      }
      setBo3Error(null);
      if (onSaveBo3Game) {
        onSaveBo3Game(match.id, nextGameNum, bo3HomeScoreNum, bo3AwayScoreNum);
      }
      setBo3HomeScore('0');
      setBo3AwayScore('0');
    };

    const handleQuickWin = (side: 'home' | 'away') => {
      setBo3Error(null);
      if (onQuickBo3Win) {
        onQuickBo3Win(match.id, side);
      }
      setBo3HomeScore('0');
      setBo3AwayScore('0');
    };

    return (
      <div
        className={`card-stadium rounded-2xl p-5 border transition-all text-app-text ${
          match.isFinished
            ? 'border-emerald-500/30 bg-slate-900/60 shadow-lg'
            : 'border-white/10 bg-slate-900/50 shadow-xl'
        }`}
      >
        {/* Header: Stage info + Bo3 badge */}
        <div className="flex items-center justify-between text-xs text-app-text-muted pb-3 mb-3.5 border-b border-white/10">
          <div className="flex items-center gap-2">
            <span className="font-bold text-app-text">
              {match.roundLabel || match.knockoutRoundLabel || 'مرحله حذفی'}
            </span>
            <span className="px-2 py-0.5 rounded-full bg-app-bg border border-app-border text-app-primary font-bold text-[10px]">
              بهترین از ۳ (Bo3)
            </span>
          </div>

          <div className="flex items-center gap-2">
            {match.isFinished ? (
              <span className="text-emerald-400 font-bold text-xs flex items-center gap-1">
                <Check className="w-3.5 h-3.5" />
                <span>پایان سری مسابقه</span>
              </span>
            ) : (
              <span className="text-amber-400 font-bold text-[11px] animate-pulse">
                در جریان (بازی {nextGameNum} از ۳)
              </span>
            )}
          </div>
        </div>

        {/* Competitors & Series Score */}
        <div className="grid grid-cols-12 items-center gap-3 py-2">
          {/* Home Player */}
          <div className="col-span-5 text-right">
            <div className="text-sm font-bold truncate">
              {renderCompetitorName(homePlayer, match.homeSeedLabel, 'home', match.winnerId && match.winnerId === match.homePlayerId)}
            </div>
            {homePlayer?.uniqueId && (
              <div className="text-[11px] text-white font-mono truncate mt-0.5">
                {homePlayer.uniqueId}
              </div>
            )}
            {!isBilliards && homePlayer?.team && (
              <div className="text-[11px] text-slate-400 truncate mt-0.5">
                {homePlayer.team}
              </div>
            )}
          </div>

          {/* Series Score Badge */}
          <div className="col-span-2 flex flex-col items-center justify-center">
            <div className="flex items-center gap-1 text-lg font-mono font-black tabular-nums bg-app-bg px-3 py-1 rounded-xl border border-app-border">
              <span className={homeGamesWon > awayGamesWon ? 'text-emerald-400' : 'text-app-text'}>
                {homeGamesWon}
              </span>
              <span className="text-slate-500">-</span>
              <span className={awayGamesWon > homeGamesWon ? 'text-emerald-400' : 'text-slate-200'}>
                {awayGamesWon}
              </span>
            </div>
            <span className="text-[9px] text-slate-400 mt-1 font-semibold">
              هدف: ۲ برد
            </span>
          </div>

          {/* Away Player */}
          <div className="col-span-5 text-left">
            <div className="text-sm font-bold truncate">
              {renderCompetitorName(awayPlayer, match.awaySeedLabel, 'away', match.winnerId && match.winnerId === match.awayPlayerId)}
            </div>
            {awayPlayer?.uniqueId && (
              <div className="text-[11px] text-white font-mono truncate mt-0.5">
                {awayPlayer.uniqueId}
              </div>
            )}
            {!isBilliards && awayPlayer?.team && (
              <div className="text-[11px] text-slate-400 truncate mt-0.5">
                {awayPlayer.team}
              </div>
            )}
          </div>
        </div>

        {/* Completed Games History */}
        {match.games && match.games.length > 0 && (
          <div className="mt-3 bg-app-bg p-2.5 rounded-xl border border-app-border space-y-1.5 text-xs">
            <span className="text-[10px] text-app-text-muted font-bold block">
              نتایج بازی‌های برگزار شده:
            </span>
            {match.games.map((g) => {
              const gameWinner = g.winnerId ? playersMap.get(g.winnerId) : null;
              return (
                <div
                  key={g.gameNumber}
                  className="flex items-center justify-between py-1 px-2 rounded-lg bg-app-surface border border-app-border"
                >
                  <span className="font-semibold text-app-primary text-xs">
                    بازی {g.gameNumber}
                  </span>
                  <span className="font-mono font-bold text-app-text tabular-nums bg-app-bg px-2.5 py-0.5 rounded border border-app-border">
                    {g.homeScore} - {g.awayScore}
                  </span>
                  <span className="text-emerald-400 text-[11px] font-bold flex items-center gap-1">
                    <Check className="w-3 h-3" />
                    <span>برنده: {gameWinner?.name || 'نامشخص'}</span>
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {/* Current Active Game Form (if series not finished) */}
        {!match.isFinished && isBothAssigned && (
          <div className="mt-3 p-3 bg-[#17060e] rounded-xl border border-rose-900/50 space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-rose-200">
              <span className="flex items-center gap-1.5">
                {nextGameNum === 3 && <Flame className="w-4 h-4 text-amber-400 animate-bounce" />}
                <span>
                  {nextGameNum === 3
                    ? 'بازی ۳ (سرنوشت‌ساز - تعیین‌کننده صعود)'
                    : `ثبت نتیجه بازی ${nextGameNum}`}
                </span>
              </span>
              <span className="text-[11px] text-rose-400">
                بدون تساوی
              </span>
            </div>

            {/* Steppers & Inputs */}
            <div className="flex items-center justify-center gap-3">
              {/* Home Player Stepper */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => {
                    sound.playClick();
                    setBo3HomeScore(String(Math.max(0, (bo3HomeScoreNum || 0) - 1)));
                  }}
                  className="w-7 h-7 rounded-lg bg-rose-950 border border-rose-800 text-rose-200 hover:bg-rose-900 flex items-center justify-center font-bold text-xs cursor-pointer"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <input
                  type="number"
                  min="0"
                  value={bo3HomeScore}
                  onChange={(e) => setBo3HomeScore(e.target.value)}
                  className={`w-12 h-9 text-center font-mono font-black text-base rounded-lg border outline-none ${
                    isBo3Tied
                      ? 'border-rose-500 bg-rose-950/60 text-rose-300'
                      : 'border-slate-700 bg-black/60 text-white focus:border-rose-500'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => {
                    sound.playClick();
                    setBo3HomeScore(String((bo3HomeScoreNum || 0) + 1));
                  }}
                  className="w-7 h-7 rounded-lg bg-rose-950 border border-rose-800 text-rose-200 hover:bg-rose-900 flex items-center justify-center font-bold text-xs cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              <span className="text-slate-500 font-bold">:</span>

              {/* Away Player Stepper */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => {
                    sound.playClick();
                    setBo3AwayScore(String(Math.max(0, (bo3AwayScoreNum || 0) - 1)));
                  }}
                  className="w-7 h-7 rounded-lg bg-rose-950 border border-rose-800 text-rose-200 hover:bg-rose-900 flex items-center justify-center font-bold text-xs cursor-pointer"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <input
                  type="number"
                  min="0"
                  value={bo3AwayScore}
                  onChange={(e) => setBo3AwayScore(e.target.value)}
                  className={`w-12 h-9 text-center font-mono font-black text-base rounded-lg border outline-none ${
                    isBo3Tied
                      ? 'border-rose-500 bg-rose-950/60 text-rose-300'
                      : 'border-slate-700 bg-black/60 text-white focus:border-rose-500'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => {
                    sound.playClick();
                    setBo3AwayScore(String((bo3AwayScoreNum || 0) + 1));
                  }}
                  className="w-7 h-7 rounded-lg bg-rose-950 border border-rose-800 text-rose-200 hover:bg-rose-900 flex items-center justify-center font-bold text-xs cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Error when tied */}
            {isBo3Tied && (
              <div className="p-2 bg-rose-950/90 border border-rose-800 text-rose-300 text-xs rounded-lg flex items-center gap-1.5 animate-pulse font-medium">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>
                  در مسابقات حذفی نتیجه مساوی مجاز نیست! هر بازی الزاماً باید یک برنده داشته باشد.
                </span>
              </div>
            )}

            {/* Save Button */}
            <div className="pt-1">
              <button
                type="button"
                disabled={isBo3Tied || bo3HomeScore === '' || bo3AwayScore === ''}
                onClick={handleBo3SaveGame}
                className={`w-full py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  isBo3Tied || bo3HomeScore === '' || bo3AwayScore === ''
                    ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                    : 'bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white shadow-md shadow-rose-950 cursor-pointer'
                }`}
              >
                <Check className="w-3.5 h-3.5" />
                <span>ثبت نتیجه بازی {nextGameNum}</span>
              </button>
            </div>

            {/* Quick Win Buttons */}
            <div className="pt-2 border-t border-rose-950/60">
              <span className="text-[10px] text-slate-400 font-semibold block mb-1 text-center">
                ثبت سریع پیروزی در بازی {nextGameNum}:
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleQuickWin('home')}
                  className="py-1.5 px-2 bg-[#200912] hover:bg-[#2e0e1a] border border-rose-900/60 text-rose-300 font-semibold text-[11px] rounded-lg transition-colors truncate cursor-pointer"
                  title={`ثبت برد برای ${homePlayer?.name || 'میزبان'}`}
                >
                  + برد {homePlayer?.name || 'میزبان'}
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickWin('away')}
                  className="py-1.5 px-2 bg-[#200912] hover:bg-[#2e0e1a] border border-rose-900/60 text-rose-300 font-semibold text-[11px] rounded-lg transition-colors truncate cursor-pointer"
                  title={`ثبت برد برای ${awayPlayer?.name || 'میهمان'}`}
                >
                  + برد {awayPlayer?.name || 'میهمان'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Finished State Banner */}
        {match.isFinished && (
          <div className="mt-3 p-3 bg-gradient-to-r from-amber-950/70 to-rose-950/70 border border-amber-600/60 rounded-xl flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/50 flex items-center justify-center text-amber-400 shrink-0">
                <Crown className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] text-amber-400 font-bold block">
                  صعودکننده به مرحله بعد:
                </span>
                <span className="text-xs font-black text-white">
                  {winnerPlayer?.name || 'ناشناس'} ({homeGamesWon} - {awayGamesWon})
                </span>
              </div>
            </div>

            {onResetScore && (
              <button
                type="button"
                onClick={() => {
                  sound.playClick();
                  onResetScore(match.id);
                }}
                className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-white px-2 py-1 rounded bg-black/40 hover:bg-black/60 border border-slate-700 transition-colors cursor-pointer"
                title="شروع مجدد سری این مسابقه"
              >
                <RotateCcw className="w-3 h-3" />
                <span>شروع مجدد سری</span>
              </button>
            )}
          </div>
        )}
      </div>
    );
  }

  if (match.isPlayIn3Way) {
    const game1 = playInGame1;
    const game2 = playInGame2;

    const homePlayer = match.homePlayerId ? playersMap.get(match.homePlayerId) : undefined;
    const awayPlayer = match.awayPlayerId ? playersMap.get(match.awayPlayerId) : undefined;
    const waitPlayer = match.waitPlayerId ? playersMap.get(match.waitPlayerId) : undefined;
    const g1Winner = game1.winnerId ? playersMap.get(game1.winnerId) : undefined;
    const finalWinner = match.winnerId ? playersMap.get(match.winnerId) : undefined;

    return (
      <div className="card-stadium rounded-2xl p-5 border border-amber-500/30 bg-gradient-to-b from-slate-900/90 to-slate-950/90 shadow-xl text-app-text space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between gap-2 text-xs pb-3 border-b border-white/10">
          <span className="font-extrabold text-amber-300 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>مسابقه مقدماتی سه‌نفره (Play-in 3-Way)</span>
          </span>
          <div className="flex items-center gap-2 shrink-0">
            {(game1.isFinished || game2.isFinished || match.isFinished) && onResetScore && (
              <button
                type="button"
                onClick={() => {
                  sound.playClick();
                  onResetScore(match.id);
                }}
                className="flex items-center gap-1 text-[11px] text-rose-300 hover:text-white px-2.5 py-1 rounded-lg bg-rose-950/60 hover:bg-rose-800/80 border border-rose-700/60 transition-colors cursor-pointer"
                title="ریست نتیجه مسابقه سه‌نفره"
              >
                <RotateCcw className="w-3 h-3" />
                <span>ریست نتیجه</span>
              </button>
            )}
            <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2.5 py-0.5 rounded-full border border-amber-500/40 font-mono">
              {match.isFinished ? 'تکمیل شده' : 'در جریان'}
            </span>
          </div>
        </div>

        {/* Slot Swapping (Before Game 1 started) */}
        {!game1.isFinished && onSwapPlayInSlot && (
          <div className="p-2.5 bg-slate-950/60 rounded-xl border border-slate-800 text-xs flex items-center justify-between gap-2 flex-wrap">
            <span className="text-slate-400 font-medium">جابجایی اسلات ۳ (منتظر ⭐):</span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => { sound.playClick(); onSwapPlayInSlot(match.id, 'home'); }}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-bold cursor-pointer transition-colors"
                title="جایگزینی اسلات ۳ با اسلات ۱"
              >
                سوییچ با اسلات ۱ ({homePlayer?.name || 'میزبان'})
              </button>
              <button
                type="button"
                onClick={() => { sound.playClick(); onSwapPlayInSlot(match.id, 'away'); }}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-bold cursor-pointer transition-colors"
                title="جایگزینی اسلات ۳ با اسلات ۲"
              >
                سوییچ با اسلات ۲ ({awayPlayer?.name || 'مهمان'})
              </button>
            </div>
          </div>
        )}

        {/* Game 1 Section */}
        <div className="p-3.5 bg-slate-950/80 rounded-xl border border-white/10 space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-slate-300">
            <span>بازی اول: {homePlayer?.name || 'اسلات ۱'} vs {awayPlayer?.name || 'اسلات ۲'}</span>
            {game1.isFinished && (
              <span className="text-emerald-400 text-[11px]">برنده: {g1Winner?.name}</span>
            )}
          </div>

          <div className="flex items-center justify-center gap-3">
            <div className="flex items-center gap-1">
              <span className="text-xs text-white font-medium truncate max-w-[90px]">{homePlayer?.name}</span>
              <input
                type="number"
                min="0"
                value={g1Home}
                onChange={(e) => setG1Home(e.target.value)}
                disabled={game1.isFinished}
                className="w-12 h-9 text-center font-mono font-black text-base rounded-lg border border-slate-700 bg-black/60 text-white outline-none focus:border-amber-400 disabled:opacity-60"
              />
            </div>
            <span className="text-slate-500 font-bold">:</span>
            <div className="flex items-center gap-1">
              <input
                type="number"
                min="0"
                value={g1Away}
                onChange={(e) => setG1Away(e.target.value)}
                disabled={game1.isFinished}
                className="w-12 h-9 text-center font-mono font-black text-base rounded-lg border border-slate-700 bg-black/60 text-white outline-none focus:border-amber-400 disabled:opacity-60"
              />
              <span className="text-xs text-white font-medium truncate max-w-[90px]">{awayPlayer?.name}</span>
            </div>
          </div>

          {!game1.isFinished && (
            <button
              type="button"
              disabled={g1Home === '' || g1Away === '' || Number(g1Home) === Number(g1Away)}
              onClick={() => {
                if (g1Home === '' || g1Away === '' || Number(g1Home) === Number(g1Away)) return;
                sound.playGoalSound();
                onSavePlayInGame?.(match.id, 1, parseInt(g1Home, 10), parseInt(g1Away, 10));
              }}
              className="w-full py-2 bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-bold text-xs rounded-lg cursor-pointer hover:from-amber-400 hover:to-yellow-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ثبت نتیجه بازی اول
            </button>
          )}
        </div>

        {/* Game 2 Section (Play-in Final against Wait Player) */}
        <div className={`p-3.5 rounded-xl border space-y-3 transition-all ${game1.isFinished ? 'bg-slate-950/80 border-amber-500/40' : 'bg-slate-950/40 border-white/5 opacity-50'}`}>
          <div className="flex items-center justify-between text-xs font-bold text-slate-300">
            <span className="flex items-center gap-1.5">
              <span>بازی دوم (فینال مقدماتی): {g1Winner?.name || 'برنده بازی اول'} vs اسلات ۳ (منتظر ⭐ {waitPlayer?.name})</span>
            </span>
            {game2.isFinished && (
              <span className="text-emerald-400 text-[11px]">صعودکننده نهایی: {finalWinner?.name}</span>
            )}
          </div>

          <div className="flex items-center justify-center gap-3">
            <div className="flex items-center gap-1">
              <span className="text-xs text-amber-300 font-medium truncate max-w-[90px]">{g1Winner?.name || 'برنده بازی ۱'}</span>
              <input
                type="number"
                min="0"
                value={g2Home}
                onChange={(e) => setG2Home(e.target.value)}
                disabled={!game1.isFinished || game2.isFinished}
                className="w-12 h-9 text-center font-mono font-black text-base rounded-lg border border-slate-700 bg-black/60 text-white outline-none focus:border-amber-400"
              />
            </div>
            <span className="text-slate-500 font-bold">:</span>
            <div className="flex items-center gap-1">
              <input
                type="number"
                min="0"
                value={g2Away}
                onChange={(e) => setG2Away(e.target.value)}
                disabled={!game1.isFinished || game2.isFinished}
                className="w-12 h-9 text-center font-mono font-black text-base rounded-lg border border-slate-700 bg-black/60 text-white outline-none focus:border-amber-400"
              />
              <span className="text-xs text-amber-400 font-medium truncate max-w-[90px]">⭐ {waitPlayer?.name || 'منتظر'}</span>
            </div>
          </div>

          {game1.isFinished && !game2.isFinished && (
            <button
              type="button"
              disabled={g2Home === '' || g2Away === '' || Number(g2Home) === Number(g2Away)}
              onClick={() => {
                if (g2Home === '' || g2Away === '' || Number(g2Home) === Number(g2Away)) return;
                sound.playGoalSound();
                onSavePlayInGame?.(match.id, 2, parseInt(g2Home, 10), parseInt(g2Away, 10));
              }}
              className="w-full py-2 bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-bold text-xs rounded-lg cursor-pointer hover:from-emerald-400 hover:to-teal-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ثبت نتیجه بازی دوم و تعیین صعودکننده نهایی 🏆
            </button>
          )}

          {!game1.isFinished && (
            <div className="text-center text-[11px] text-slate-500">
              برای فعال‌سازی بازی دوم، ابتدا باید نتیجه بازی اول ثبت شود.
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`card-stadium rounded-2xl p-5 border transition-all text-app-text ${
        match.isFinished
          ? 'border-white/10 bg-slate-900/40'
          : 'border-white/10 bg-slate-900/60 shadow-lg'
      }`}
    >
      {/* Top Meta: Round / Seed / Status */}
      <div className="flex items-center justify-between text-[11px] text-app-text-muted mb-3 pb-2.5 border-b border-white/10">
        <span className="font-medium text-app-text">
          {match.roundLabel || match.knockoutRoundLabel || 'مسابقه'}
        </span>

        <div className="flex items-center gap-2">
          {/* Live updated confirmation feedback */}
          {showSavedFeedback && (
            <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1 animate-pulse bg-emerald-950/80 px-1.5 py-0.5 rounded border border-emerald-800/80">
              <CheckCircle2 className="w-3 h-3" />
              <span>جدول آپدیت شد</span>
            </span>
          )}

          {match.isFinished ? (
            <span className="text-emerald-400 font-semibold flex items-center gap-1">
              <Check className="w-3 h-3" />
              <span>پایان یافته</span>
            </span>
          ) : (
            <span className="text-amber-400 font-medium">در انتظار نتیجه</span>
          )}

          {/* Edit / Collapse Toggle */}
          {match.isFinished && (
            <button
              type="button"
              onClick={() => {
                sound.playClick();
                setIsEditing(!isEditing);
              }}
              className={`flex items-center gap-1 text-[11px] px-2 py-0.5 rounded transition-colors ${
                isEditing
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                  : 'text-slate-400 hover:text-rose-300 hover:bg-slate-800'
              }`}
              title="ویرایش نتیجه این مسابقه"
            >
              <Edit3 className="w-3 h-3" />
              <span>{isEditing ? 'بستن فرم' : 'ویرایش'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Match Competitors & Score Fields */}
      <div className="space-y-3">
        {/* Competitor Row: Home vs Away */}
        <div className="grid grid-cols-12 items-center gap-2">
          {/* Home Player */}
          <div className="col-span-4 text-right truncate">
            <div className="text-xs font-bold truncate">
              {renderCompetitorName(homePlayer, match.homeSeedLabel, 'home', match.winnerId && match.winnerId === match.homePlayerId)}
            </div>
            {homePlayer?.uniqueId && (
              <div className="text-[10px] text-white font-mono truncate">
                {homePlayer.uniqueId}
              </div>
            )}
            {!isBilliards && homePlayer?.team && (
              <div className="text-[10px] text-slate-400 truncate">
                {homePlayer.team}
              </div>
            )}
          </div>

          {/* Score Box */}
          <div className="col-span-4 flex items-center justify-center">
            {!isBilliards && isEditing && isBothAssigned ? (
              <div className="flex items-center gap-1.5">
                {/* Home Player Stepper (Right) */}
                <div className="flex flex-col items-center">
                  <span className="text-[9px] text-app-primary font-semibold mb-0.5 truncate max-w-[65px]" title={homePlayer ? homePlayer.name : 'میزبان'}>
                    {homePlayer ? homePlayer.name : 'میزبان'}
                  </span>
                  <div className="flex items-center gap-0.5">
                    <button
                      type="button"
                      onClick={() => adjustScore('home', -1)}
                      className="w-5 h-7 flex items-center justify-center bg-app-surface hover:bg-app-surface-hover text-app-text rounded text-[10px] border border-app-border active:scale-95 transition-transform cursor-pointer"
                      title={`کاهش ${unitLabel} ${homePlayer ? homePlayer.name : 'میزبان'}`}
                    >
                      <Minus className="w-2.5 h-2.5" />
                    </button>
                    <input
                      type="number"
                      min="0"
                      max="99"
                      value={homeScoreInput}
                      onChange={(e) => setHomeScoreInput(e.target.value)}
                      onBlur={handleScoreInputBlur}
                      onKeyDown={(e) => e.key === 'Enter' && handleScoreInputBlur()}
                      placeholder="0"
                      className="w-8 h-8 text-center bg-app-bg border border-app-border focus:border-app-primary rounded-lg text-app-text font-bold text-sm font-mono tabular-nums outline-none"
                      title={`تعداد ${isBilliards ? 'فریم‌های' : 'گل‌های'} ${homePlayer ? homePlayer.name : 'میزبان'}`}
                    />
                    <button
                      type="button"
                      onClick={() => adjustScore('home', 1)}
                      className="w-5 h-7 flex items-center justify-center bg-app-surface hover:bg-app-surface-hover text-app-text rounded text-[10px] border border-app-border active:scale-95 transition-transform cursor-pointer"
                      title={`افزایش ${unitLabel} ${homePlayer ? homePlayer.name : 'میزبان'}`}
                    >
                      <Plus className="w-2.5 h-2.5" />
                    </button>
                  </div>
                </div>

                <span className="text-app-text-muted font-bold self-end mb-1.5">:</span>

                {/* Away Player Stepper (Left) */}
                <div className="flex flex-col items-center">
                  <span className="text-[9px] text-app-primary font-semibold mb-0.5 truncate max-w-[65px]" title={awayPlayer ? awayPlayer.name : 'میهمان'}>
                    {awayPlayer ? awayPlayer.name : 'میهمان'}
                  </span>
                  <div className="flex items-center gap-0.5">
                    <button
                      type="button"
                      onClick={() => adjustScore('away', -1)}
                      className="w-5 h-7 flex items-center justify-center bg-app-surface hover:bg-app-surface-hover text-app-text rounded text-[10px] border border-app-border active:scale-95 transition-transform cursor-pointer"
                      title={`کاهش ${unitLabel} ${awayPlayer ? awayPlayer.name : 'میهمان'}`}
                    >
                      <Minus className="w-2.5 h-2.5" />
                    </button>
                    <input
                      type="number"
                      min="0"
                      max="99"
                      value={awayScoreInput}
                      onChange={(e) => setAwayScoreInput(e.target.value)}
                      onBlur={handleScoreInputBlur}
                      onKeyDown={(e) => e.key === 'Enter' && handleScoreInputBlur()}
                      placeholder="0"
                      className="w-8 h-8 text-center bg-app-bg border border-app-border focus:border-app-primary rounded-lg text-app-text font-bold text-sm font-mono tabular-nums outline-none"
                      title={`تعداد ${isBilliards ? 'فریم‌های' : 'گل‌های'} ${awayPlayer ? awayPlayer.name : 'میهمان'}`}
                    />
                    <button
                      type="button"
                      onClick={() => adjustScore('away', 1)}
                      className="w-5 h-7 flex items-center justify-center bg-app-surface hover:bg-app-surface-hover text-app-text rounded text-[10px] border border-app-border active:scale-95 transition-transform cursor-pointer"
                      title={`افزایش ${unitLabel} ${awayPlayer ? awayPlayer.name : 'میهمان'}`}
                    >
                      <Plus className="w-2.5 h-2.5" />
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div
                onClick={() => {
                  if (!isBilliards) {
                    sound.playClick();
                    setIsEditing(true);
                  }
                }}
                className={`flex items-center justify-center gap-2 py-1 px-3 bg-app-bg border border-app-border ${
                  !isBilliards ? 'hover:border-app-primary cursor-pointer' : ''
                } rounded-lg transition-colors`}
                title={isBilliards ? 'نتیجه مسابقه' : 'کلیک برای ویرایش نتیجه مسابقه'}
              >
                {/* Score for Right player (Home) */}
                <span className="font-mono text-base font-extrabold tabular-nums text-app-primary" title={homePlayer?.name}>
                  {match.homeScore !== null ? match.homeScore : '-'}
                </span>
                <span className="text-app-text-muted font-bold">:</span>
                {/* Score for Left player (Away) */}
                <span className="font-mono text-base font-extrabold tabular-nums text-app-primary" title={awayPlayer?.name}>
                  {match.awayScore !== null ? match.awayScore : '-'}
                </span>
              </div>
            )}
          </div>

          {/* Away Player */}
          <div className="col-span-4 text-left truncate">
            <div className="text-xs font-bold truncate">
              {renderCompetitorName(awayPlayer, match.awaySeedLabel, 'away', match.winnerId && match.winnerId === match.awayPlayerId)}
            </div>
            {awayPlayer?.uniqueId && (
              <div className="text-[10px] text-white font-mono truncate">
                {awayPlayer.uniqueId}
              </div>
            )}
            {!isBilliards && awayPlayer?.team && (
              <div className="text-[10px] text-slate-400 truncate">
                {awayPlayer.team}
              </div>
            )}
          </div>
        </div>

        {/* Quick Win Shortcuts for Billiards mode */}
        {isBilliards && isBothAssigned && (!match.isFinished || isEditing) && (
          <div className="pt-2.5 border-t border-emerald-900/40 space-y-2">
            <div className="flex items-center justify-between text-[10px] text-emerald-400 font-bold">
              <span className="flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                <span>ثبت سریع نتیجه (Race to {targetWins}):</span>
              </span>
              <span className="text-[9px] text-emerald-300/70 font-mono">
                هدف: {targetWins} برد
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              {targetWins === 1 && (
                <>
                  <button
                    type="button"
                    onClick={() => handleQuickBilliardsWin(1, 0)}
                    className="py-1.5 px-2 bg-emerald-950/90 hover:bg-emerald-800 border border-emerald-600/80 text-emerald-100 text-[11px] font-mono font-black rounded-lg transition-all shadow-md hover:scale-105 active:scale-95 cursor-pointer flex items-center justify-center gap-1"
                    title={`ثبت برد 1 - 0 برای ${homePlayer ? homePlayer.name : 'میزبان'}`}
                  >
                    <Trophy className="w-3 h-3 text-amber-400 shrink-0" />
                    <span>1 - 0</span>
                    <span className="text-[9px] text-emerald-400 font-sans truncate max-w-[50px]">({homePlayer?.name?.split(' ')[0] || 'میزبان'})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickBilliardsWin(0, 1)}
                    className="py-1.5 px-2 bg-emerald-950/90 hover:bg-emerald-800 border border-emerald-600/80 text-emerald-100 text-[11px] font-mono font-black rounded-lg transition-all shadow-md hover:scale-105 active:scale-95 cursor-pointer flex items-center justify-center gap-1"
                    title={`ثبت برد 0 - 1 برای ${awayPlayer ? awayPlayer.name : 'میهمان'}`}
                  >
                    <Trophy className="w-3 h-3 text-amber-400 shrink-0" />
                    <span>0 - 1</span>
                    <span className="text-[9px] text-emerald-400 font-sans truncate max-w-[50px]">({awayPlayer?.name?.split(' ')[0] || 'میهمان'})</span>
                  </button>
                </>
              )}

              {targetWins === 2 && (
                <>
                  <button
                    type="button"
                    onClick={() => handleQuickBilliardsWin(2, 0)}
                    className="py-1.5 px-1.5 bg-emerald-950/90 hover:bg-emerald-800 border border-emerald-600/80 text-emerald-100 text-[11px] font-mono font-black rounded-lg transition-all shadow-md hover:scale-105 active:scale-95 cursor-pointer flex items-center justify-center gap-1"
                    title={`ثبت برد 2 - 0 برای ${homePlayer ? homePlayer.name : 'میزبان'}`}
                  >
                    <Trophy className="w-3 h-3 text-amber-400 shrink-0" />
                    <span>2 - 0</span>
                    <span className="text-[9px] text-emerald-400 font-sans truncate max-w-[45px]">({homePlayer?.name?.split(' ')[0] || 'میزبان'})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickBilliardsWin(2, 1)}
                    className="py-1.5 px-1.5 bg-emerald-950/90 hover:bg-emerald-800 border border-emerald-600/80 text-emerald-100 text-[11px] font-mono font-black rounded-lg transition-all shadow-md hover:scale-105 active:scale-95 cursor-pointer flex items-center justify-center gap-1"
                    title={`ثبت برد 2 - 1 برای ${homePlayer ? homePlayer.name : 'میزبان'}`}
                  >
                    <Trophy className="w-3 h-3 text-amber-400 shrink-0" />
                    <span>2 - 1</span>
                    <span className="text-[9px] text-emerald-400 font-sans truncate max-w-[45px]">({homePlayer?.name?.split(' ')[0] || 'میزبان'})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickBilliardsWin(0, 2)}
                    className="py-1.5 px-1.5 bg-emerald-950/90 hover:bg-emerald-800 border border-emerald-600/80 text-emerald-100 text-[11px] font-mono font-black rounded-lg transition-all shadow-md hover:scale-105 active:scale-95 cursor-pointer flex items-center justify-center gap-1"
                    title={`ثبت برد 0 - 2 برای ${awayPlayer ? awayPlayer.name : 'میهمان'}`}
                  >
                    <Trophy className="w-3 h-3 text-amber-400 shrink-0" />
                    <span>0 - 2</span>
                    <span className="text-[9px] text-emerald-400 font-sans truncate max-w-[45px]">({awayPlayer?.name?.split(' ')[0] || 'میهمان'})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickBilliardsWin(1, 2)}
                    className="py-1.5 px-1.5 bg-emerald-950/90 hover:bg-emerald-800 border border-emerald-600/80 text-emerald-100 text-[11px] font-mono font-black rounded-lg transition-all shadow-md hover:scale-105 active:scale-95 cursor-pointer flex items-center justify-center gap-1"
                    title={`ثبت برد 1 - 2 برای ${awayPlayer ? awayPlayer.name : 'میهمان'}`}
                  >
                    <Trophy className="w-3 h-3 text-amber-400 shrink-0" />
                    <span>1 - 2</span>
                    <span className="text-[9px] text-emerald-400 font-sans truncate max-w-[45px]">({awayPlayer?.name?.split(' ')[0] || 'میهمان'})</span>
                  </button>
                </>
              )}

              {targetWins === 3 && (
                <>
                  <button
                    type="button"
                    onClick={() => handleQuickBilliardsWin(3, 0)}
                    className="py-1.5 px-1 bg-emerald-950/90 hover:bg-emerald-800 border border-emerald-600/80 text-emerald-100 text-[11px] font-mono font-black rounded-lg transition-all shadow-md hover:scale-105 active:scale-95 cursor-pointer flex items-center justify-center gap-0.5"
                    title={`ثبت برد 3 - 0 برای ${homePlayer ? homePlayer.name : 'میزبان'}`}
                  >
                    <Trophy className="w-3 h-3 text-amber-400 shrink-0" />
                    <span>3 - 0</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickBilliardsWin(3, 1)}
                    className="py-1.5 px-1 bg-emerald-950/90 hover:bg-emerald-800 border border-emerald-600/80 text-emerald-100 text-[11px] font-mono font-black rounded-lg transition-all shadow-md hover:scale-105 active:scale-95 cursor-pointer flex items-center justify-center gap-0.5"
                    title={`ثبت برد 3 - 1 برای ${homePlayer ? homePlayer.name : 'میزبان'}`}
                  >
                    <Trophy className="w-3 h-3 text-amber-400 shrink-0" />
                    <span>3 - 1</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickBilliardsWin(3, 2)}
                    className="py-1.5 px-1 bg-emerald-950/90 hover:bg-emerald-800 border border-emerald-600/80 text-emerald-100 text-[11px] font-mono font-black rounded-lg transition-all shadow-md hover:scale-105 active:scale-95 cursor-pointer flex items-center justify-center gap-0.5"
                    title={`ثبت برد 3 - 2 برای ${homePlayer ? homePlayer.name : 'میزبان'}`}
                  >
                    <Trophy className="w-3 h-3 text-amber-400 shrink-0" />
                    <span>3 - 2</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickBilliardsWin(0, 3)}
                    className="py-1.5 px-1 bg-emerald-950/90 hover:bg-emerald-800 border border-emerald-600/80 text-emerald-100 text-[11px] font-mono font-black rounded-lg transition-all shadow-md hover:scale-105 active:scale-95 cursor-pointer flex items-center justify-center gap-0.5"
                    title={`ثبت برد 0 - 3 برای ${awayPlayer ? awayPlayer.name : 'میهمان'}`}
                  >
                    <Trophy className="w-3 h-3 text-amber-400 shrink-0" />
                    <span>0 - 3</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickBilliardsWin(1, 3)}
                    className="py-1.5 px-1 bg-emerald-950/90 hover:bg-emerald-800 border border-emerald-600/80 text-emerald-100 text-[11px] font-mono font-black rounded-lg transition-all shadow-md hover:scale-105 active:scale-95 cursor-pointer flex items-center justify-center gap-0.5"
                    title={`ثبت برد 1 - 3 برای ${awayPlayer ? awayPlayer.name : 'میهمان'}`}
                  >
                    <Trophy className="w-3 h-3 text-amber-400 shrink-0" />
                    <span>1 - 3</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickBilliardsWin(2, 3)}
                    className="py-1.5 px-1 bg-emerald-950/90 hover:bg-emerald-800 border border-emerald-600/80 text-emerald-100 text-[11px] font-mono font-black rounded-lg transition-all shadow-md hover:scale-105 active:scale-95 cursor-pointer flex items-center justify-center gap-0.5"
                    title={`ثبت برد 2 - 3 برای ${awayPlayer ? awayPlayer.name : 'میهمان'}`}
                  >
                    <Trophy className="w-3 h-3 text-amber-400 shrink-0" />
                    <span>2 - 3</span>
                  </button>
                </>
              )}
            </div>

            {match.isFinished && (
              <div className="flex items-center justify-between pt-2 border-t border-emerald-950">
                <button
                  type="button"
                  onClick={handleResetMatch}
                  className="flex items-center gap-1 text-[11px] text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 px-2 py-1 rounded border border-rose-900/60 transition-colors cursor-pointer"
                  title="پاک کردن نتیجه و بازگردانی به بازی انجام‌نشده"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>لغو و پاک کردن نتیجه</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-2.5 py-1 text-[11px] text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                >
                  بستن
                </button>
              </div>
            )}
          </div>
        )}

        {/* Penalty shootout fields (only for PES knockout matches) */}
        {!isBilliards && isKnockout && isEditing && isBothAssigned && isTied && (
          <div className="p-2.5 bg-amber-950/30 border border-amber-800/40 rounded-lg text-xs space-y-2">
            <div className="text-amber-300 font-semibold text-center text-[11px]">
              بازی مساوی شد! لطفاً ضربات پنالتی را وارد کنید:
            </div>
            <div className="flex items-center justify-center gap-3">
              <div className="flex items-center gap-1">
                <span className="text-[10px] text-slate-400">پنالتی {homePlayer ? homePlayer.name : 'میزبان'}:</span>
                <input
                  type="number"
                  min="0"
                  max="30"
                  value={homePenInput}
                  onChange={(e) => setHomePenInput(e.target.value)}
                  placeholder="0"
                  className="w-9 h-7 text-center bg-slate-900 border border-slate-700 rounded text-amber-300 font-mono font-bold text-xs"
                />
              </div>
              <span className="text-slate-500 font-bold">-</span>
              <div className="flex items-center gap-1">
                <span className="text-[10px] text-slate-400">پنالتی {awayPlayer ? awayPlayer.name : 'میهمان'}:</span>
                <input
                  type="number"
                  min="0"
                  max="30"
                  value={awayPenInput}
                  onChange={(e) => setAwayPenInput(e.target.value)}
                  placeholder="0"
                  className="w-9 h-7 text-center bg-slate-900 border border-slate-700 rounded text-amber-300 font-mono font-bold text-xs"
                />
              </div>
            </div>

            {/* If penalty scores are entered and decisive, display the automatically determined winner */}
            {(() => {
              const hp = homePenInput !== '' ? parseInt(homePenInput, 10) : null;
              const ap = awayPenInput !== '' ? parseInt(awayPenInput, 10) : null;
              const hasDecisivePenalties = hp !== null && !isNaN(hp) && ap !== null && !isNaN(ap) && hp !== ap;

              if (hasDecisivePenalties) {
                const penWinnerName = hp > ap ? homePlayer?.name : awayPlayer?.name;
                return (
                  <div className="flex items-center justify-center gap-1.5 py-1 px-3 bg-emerald-950/60 border border-emerald-700/60 rounded-md text-emerald-300 font-bold text-[11px]">
                    <Crown className="w-3.5 h-3.5 text-amber-400" />
                    <span>برنده بر اساس نتیجه پنالتی: {penWinnerName}</span>
                  </div>
                );
              }

              // If penalty scores are not entered or are equal, show manual winner selection
              return (
                <div className="flex items-center justify-center gap-2 pt-1">
                  <span className="text-[10px] text-slate-400">انتخاب برنده نهایی:</span>
                  <button
                    type="button"
                    onClick={() => setPenaltyWinner(match.homePlayerId)}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-colors ${
                      penaltyWinner === match.homePlayerId
                        ? 'bg-amber-500 text-slate-950 border-amber-400'
                        : 'bg-slate-900 text-slate-300 border-slate-700'
                    }`}
                  >
                    {homePlayer?.name}
                  </button>
                  <button
                    type="button"
                    onClick={() => setPenaltyWinner(match.awayPlayerId)}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-colors ${
                      penaltyWinner === match.awayPlayerId
                        ? 'bg-amber-500 text-slate-950 border-amber-400'
                        : 'bg-slate-900 text-slate-300 border-slate-700'
                    }`}
                  >
                    {awayPlayer?.name}
                  </button>
                </div>
              );
            })()}
          </div>
        )}

        {/* Display penalty score if finished with penalties (only for PES) */}
        {!isBilliards && match.isFinished && match.hasPenalties && match.homePenaltyScore !== null && (
          <div className="text-center text-[11px] text-amber-400 font-mono tabular-nums">
            (پنالتی: {homePlayer?.name} {match.homePenaltyScore} - {match.awayPenaltyScore} {awayPlayer?.name})
          </div>
        )}

        {/* Action Buttons: Save & Reset to Unplayed (PES mode only) */}
        {!isBilliards && isEditing && isBothAssigned && (
          <div className="flex items-center justify-between gap-2 pt-3 border-t border-white/10">
            {/* Reset / Clear match score if it was registered */}
            {match.isFinished ? (
              <button
                type="button"
                onClick={handleResetMatch}
                className="btn-secondary-glass flex items-center gap-1.5 text-[11px] text-rose-400 hover:text-rose-300 px-3 py-1.5 rounded-xl transition-all cursor-pointer"
                title="پاک کردن نتیجه و بازگردانی به بازی انجام‌نشده"
              >
                <RotateCcw className="w-3 h-3" />
                <span>لغو و پاک کردن نتیجه</span>
              </button>
            ) : (
              <div className="text-[11px] text-slate-400">
                پس از تنظیم نتیجه، دکمه «ثبت و بروزرسانی جدول» را بزنید
              </div>
            )}

            {/* Save & Update Table Action */}
            <div className="flex items-center gap-2">
              {match.isFinished && (
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="btn-secondary-glass px-3 py-1.5 text-[11px] rounded-xl cursor-pointer"
                >
                  بستن
                </button>
              )}
              <button
                type="button"
                onClick={handleExplicitSave}
                disabled={
                  homeScoreNum === null ||
                  awayScoreNum === null ||
                  (isKnockout &&
                    isTied &&
                    !penaltyWinner &&
                    (homePenInput === '' || awayPenInput === '' || homePenInput === awayPenInput))
                }
                className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl transition-all ${
                  homeScoreNum !== null &&
                  awayScoreNum !== null &&
                  !(
                    isKnockout &&
                    isTied &&
                    !penaltyWinner &&
                    (homePenInput === '' || awayPenInput === '' || homePenInput === awayPenInput)
                  )
                    ? 'btn-primary-glass cursor-pointer'
                    : 'bg-white/5 text-slate-500 cursor-not-allowed border border-white/10'
                }`}
              >
                <Check className="w-3.5 h-3.5" />
                <span>ثبت و بروزرسانی جدول</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
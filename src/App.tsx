/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Capacitor } from '@capacitor/core';
import {
  GroupStanding,
  Match,
  Player,
  TournamentFormat,
  TournamentState,
  GameType,
  BilliardsFormat,
} from './types/tournament';
import {
  calculateGroupStandings,
  distributePlayers,
  generateKnockoutStage,
  generateGroupFixtures,
  generateDirectKnockoutInitialMatches,
  generateNextKnockoutRoundMatches,
  saveBo3GameScore,
  quickRecordBo3GameWin,
  resetBo3Match,
  PRESET_PLAYERS,
  propagateKnockoutResult,
  syncKnockoutSeedsFromStandings,
  syncDownstreamKnockoutMatches,
  isValidKnockoutCount,
  getKnockoutCountErrorMessage,
} from './utils/tournament';
import {
  clearTournamentStorage,
  loadTournamentFromStorage,
  saveTournamentToStorage,
} from './utils/storage';
import { sound } from './utils/audio';
import { validateLicense, saveLicenseSecurely, readLicenseSecurely } from './utils/license'; // <--- ایمپورت‌های جدید
import { trackEvent } from './utils/tracker'; // سیستم ردیابی لایو
import { AdminLogin } from './components/admin/AdminLogin'; // صفحه ورود ادمین
import { AdminDashboard } from './components/admin/AdminDashboard'; // داشبورد ادمین

import { TopHeader } from './components/TopHeader';
import { DashboardStatus } from './components/DashboardStatus';
import { PlayerForm } from './components/PlayerForm';
import { GroupStageView } from './components/GroupStageView';
import { KnockoutFixturesView } from './components/KnockoutFixturesView';
import { BracketView } from './components/BracketView';
import { StatsView } from './components/StatsView';
import { ResetConfirmModal } from './components/ResetConfirmModal';
import { ChampionModal } from './components/ChampionModal';
import { EditGroupsModal } from './components/EditGroupsModal';
import { BlackModeFormatModal } from './components/BlackModeFormatModal';
import { GroupTable } from './components/GroupTable';
import { BilliardsGroupTable } from './components/BilliardsGroupTable';
import { MatchCard } from './components/MatchCard';

import {
  Trophy,
  Users,
  Grid,
  Calendar,
  BarChart3,
  GitBranch,
  ArrowRight,
  Flame,
  CheckCircle2,
  Lock,
  Edit,
  Layers,
  AlertTriangle,
  X,
  Sparkles,
} from 'lucide-react';

const INITIAL_STATE: TournamentState = {
  id: 'pes2021-cup-' + Date.now(),
  title: 'کاپ گروهی PES 2021',
  gameType: 'pes',
  billiardsFormat: 'bo3',
  tournamentFormat: 'group_knockout',
  numberOfGroups: 2,
  status: 'setup',
  players: [],
  groups: [],
  matches: [],
  hasThirdPlaceMatch: true,
  championId: null,
  runnerUpId: null,
  thirdPlaceId: null,
  soundEnabled: true,
  createdAt: Date.now(),
  updatedAt: Date.now(),
  hostLogo: null,
  advancementRule: 'bestThirds',
  currentKnockoutRoundIndex: 1,
};

export default function App() {
  // 🔴 مسیر اختصاصی ادمین جهت رصد لایو (مخفی از دید کاربران عادی)
  const [adminRoute, setAdminRoute] = useState<'none' | 'login' | 'dashboard'>(() => {
    if (typeof window !== 'undefined') {
      const pathname = window.location.pathname;
      if (pathname.includes('/admin-live')) return 'login';
      if (pathname.includes('/admin-dashboard')) {
        const token = localStorage.getItem('tm_admin_token');
        return token ? 'dashboard' : 'login';
      }
    }
    return 'none';
  });

  // ثبت خودکار رویداد باز شدن صفحه (page_view)
  useEffect(() => {
    trackEvent('page_view', {
      path: typeof window !== 'undefined' ? window.location.pathname : '/',
    });
  }, []);

  // 🔴 استیت‌های لایسنس
  const [isLocked, setIsLocked] = useState(true); // پیش‌فرض: قفل
  const [licenseInput, setLicenseInput] = useState('');
  const [licenseError, setLicenseError] = useState('');
  const [licenseType, setLicenseType] = useState<string>('');

  const [state, setState] = useState<TournamentState>(() => {
    const saved = loadTournamentFromStorage();
    if (saved) return saved;
    return INITIAL_STATE;
  });

  const [activeTab, setActiveTab] = useState<
    'main' | 'groups' | 'fixtures' | 'bracket' | 'stats'
  >(() => {
    const saved = loadTournamentFromStorage();
    if (
      saved &&
      (saved.tournamentFormat === 'knockout_single' ||
        saved.tournamentFormat === 'knockout_double' ||
        saved.tournamentFormat === 'knockout_black') &&
      saved.status !== 'setup'
    ) {
      return 'bracket';
    }
    return 'main';
  });

  // اگر مسابقات حذفی مستقیم PES است، اجازه باز ماندن تب داشبورد گروهی داده نشود (اما در بیلیارد تب جدول رده‌بندی همیشه در دسترس است)
  useEffect(() => {
    if (state.gameType === 'billiards') return;
    if (
      (state.tournamentFormat === 'knockout_single' ||
        state.tournamentFormat === 'knockout_double' ||
        state.tournamentFormat === 'knockout_black') &&
      state.status !== 'setup' &&
      (activeTab === 'main' || activeTab === 'groups')
    ) {
      setActiveTab('bracket');
    }
  }, [state.tournamentFormat, state.status, state.gameType, activeTab]);

  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isChampionModalOpen, setIsChampionModalOpen] = useState(false);
  const [isEditGroupsOpen, setIsEditGroupsOpen] = useState(false);
  const [isKnockoutRebuildModalOpen, setIsKnockoutRebuildModalOpen] = useState(false);
  const [isBlackModeModalOpen, setIsBlackModeModalOpen] = useState(false);

  const [resourcesPath, setResourcesPath] = useState<string>('');

  // 🔴 بررسی لایسنس در زمان لود اپلیکیشن (با استفاده از لایه امنیتی جدید)
  useEffect(() => {
    const checkLicense = async () => {
      const savedLicense = await readLicenseSecurely();
      
      if (savedLicense) {
        const result = validateLicense(savedLicense);
        if (result.isValid) {
          setIsLocked(false);
          setLicenseType(result.type || '');
        } else {
          setIsLocked(true);
        }
      } else {
        setIsLocked(true); // اگر لایسنسی وجود ندارد، قفل کن
      }
    };
    
    checkLicense();
  }, []);

  // 🔴 اصلاح خودکار در صورت وجود حالت‌های قدیمی با بیش از ۸ صعودکننده
  useEffect(() => {
    setState((prev) => {
      let needsUpdate = false;
      let newGroups = prev.numberOfGroups;
      let newRule = prev.advancementRule;

      if (prev.numberOfGroups === 8) {
        newGroups = 4;
        needsUpdate = true;
      }

      if (prev.numberOfGroups === 3 && prev.advancementRule === 'proportional' && prev.players.length >= 15) {
        newRule = 'bestThirds';
        needsUpdate = true;
      }

      if (needsUpdate) {
        return {
          ...prev,
          numberOfGroups: newGroups,
          advancementRule: newRule,
          updatedAt: Date.now(),
        };
      }
      return prev;
    });
  }, []);

  // 🔴 فعال‌سازی لایسنس با ذخیره امن
  const handleActivateLicense = async () => {
    const result = validateLicense(licenseInput);
    
    if (!result.isValid) {
      setLicenseError(result.error || 'کد لایسنس نامعتبر است.');
      return;
    }

    await saveLicenseSecurely(licenseInput);
    setIsLocked(false);
    setLicenseType(result.type || '');
    setLicenseError('');
  };

  useEffect(() => {
    if (window.appPaths?.getResources) {
      window.appPaths
        .getResources()
        .then((p: string) => setResourcesPath(p))
        .catch(() => setResourcesPath(''));
    }
  }, []);

  let assetsBase = '';
  
  if (Capacitor.isNativePlatform()) {
    assetsBase = './assets'; 
  } 
  else if (resourcesPath) {
    // 🔴 در ویندوز با asar، مسیر assetsBase نباید به resourcesPath اشاره کند
    // اگر تصاویر با مسیر نسبی لود می‌شوند، این خط را کامنت کنید
    // assetsBase = `${resourcesPath}/app/dist/assets`; 
    assetsBase = './assets'; // مسیر نسبی برای asar
  } 
  else {
    assetsBase = './assets';
  }

  useEffect(() => {
    saveTournamentToStorage(state);
  }, [state]);

  useEffect(() => {
    sound.setEnabled(state.soundEnabled);
  }, [state.soundEnabled]);

  const playersMap = useMemo(() => {
    const map = new Map<string, Player>();
    state.players.forEach((p) => map.set(p.id, p));
    return map;
  }, [state.players]);

  const standingsMap = useMemo(() => {
    const record: Record<string, GroupStanding[]> = {};
    state.groups.forEach((g) => {
      record[g.id] = calculateGroupStandings(
        g.id,
        g.playerIds,
        state.matches,
        playersMap
      );
    });
    return record;
  }, [state.groups, state.matches, playersMap]);

  // جدول رده‌بندی جامع بیلیارد (محاسبه فریم‌های برده، باخته، تفاضل، برد و باخت از تمامی مسابقات)
  const billiardsOverallStandings = useMemo(() => {
    if (state.gameType !== 'billiards') return [];

    const statsMap = new Map<string, GroupStanding>();
    state.players.forEach((p) => {
      statsMap.set(p.id, {
        playerId: p.id,
        playerName: p.name,
        playerTeam: p.team,
        played: 0,
        won: 0,
        drawn: 0,
        lost: 0,
        goalsFor: 0,     // فریم برده (Frames Won)
        goalsAgainst: 0, // فریم باخته (Frames Lost)
        goalDifference: 0, // تفاضل فریم
        points: 0,       // برد ۳، باخت ۰
        rank: 1,
      });
    });

    state.matches.forEach((m) => {
      if (!m.isFinished || m.homeScore === null || m.awayScore === null || !m.homePlayerId || !m.awayPlayerId) {
        return;
      }
      const home = statsMap.get(m.homePlayerId);
      const away = statsMap.get(m.awayPlayerId);
      if (!home || !away) return;

      home.played += 1;
      away.played += 1;
      home.goalsFor += m.homeScore;
      home.goalsAgainst += m.awayScore;
      away.goalsFor += m.awayScore;
      away.goalsAgainst += m.homeScore;

      // تعیین برنده مسابقه بیلیارد (بدون مساوی: برد ۳، باخت ۰)
      const homeWon = m.winnerId ? m.winnerId === m.homePlayerId : m.homeScore > m.awayScore;
      if (homeWon) {
        home.won += 1;
        home.points += 3;
        away.lost += 1;
      } else {
        away.won += 1;
        away.points += 3;
        home.lost += 1;
      }
    });

    const list = Array.from(statsMap.values()).map((s) => ({
      ...s,
      goalDifference: s.goalsFor - s.goalsAgainst,
    }));

    // رتبه‌بندی: امتیاز -> تفاضل فریم -> فریم برده -> نام
    list.sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
      if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
      return a.playerName.localeCompare(b.playerName, 'fa');
    });

    list.forEach((s, idx) => {
      s.rank = idx + 1;
    });

    return list;
  }, [state.gameType, state.players, state.matches]);

  const hasStartedAnyMatch = useMemo(() => {
    return state.matches.some(
      (m) => (m.isFinished || m.homeScore !== null || m.awayScore !== null)
    );
  }, [state.matches]);

  const advancingPlayerIds = useMemo(() => {
    const ids = new Set<string>();
    state.groups.forEach((g) => {
      const count = typeof g.advanceCount === 'number' ? g.advanceCount : 2;
      const list = standingsMap[g.id] || [];
      for (let i = 0; i < count; i++) {
        if (list[i]) ids.add(list[i].playerId);
      }
    });
    return ids;
  }, [state.groups, standingsMap]);

  const ruleDescription = useMemo(() => {
    if (state.groups.length === 0) return '';
    const totalAdvancing = state.groups.reduce((acc, g) => acc + (g.advanceCount ?? 2), 0);
    const groupSummary = state.groups.map(g => `${g.name}: ${g.advanceCount ?? 2} نفر`).join(' ، ');
    return `قانون صعود: مجموعاً ${totalAdvancing} بازیکن بر اساس سهمیه تعیین‌شده هر گروه (${groupSummary}) به مرحله حذفی صعود می‌کنند.`;
  }, [state.groups]);

  const handleAddPlayer = ({ name, team, uniqueId }: { name: string; team?: string; uniqueId?: string }) => {
    const newPlayer: Player = {
      id: `p-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      name,
      team,
      uniqueId,
    };
    trackEvent('player_added', { name, team });
    setState((prev) => ({
      ...prev,
      players: [...prev.players, newPlayer],
      updatedAt: Date.now(),
    }));
  };

  const handleAddBulkPlayers = (rawNames: string[]) => {
    const newPlayers: Player[] = rawNames.map((entry) => {
      const match = entry.match(/^([^(]+)(?:\(([^)]+)\))?$/);
      const name = match ? match[1].trim() : entry.trim();
      const team = match && match[2] ? match[2].trim() : undefined;

      return {
        id: `p-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        name,
        team,
      };
    });

    trackEvent('player_added', { count: newPlayers.length, bulk: true });
    setState((prev) => ({
      ...prev,
      players: [...prev.players, ...newPlayers],
      updatedAt: Date.now(),
    }));
  };

  const handleRemovePlayer = (id: string) => {
    trackEvent('player_removed', { playerId: id });
    setState((prev) => ({
      ...prev,
      players: prev.players.filter((p) => p.id !== id),
      updatedAt: Date.now(),
    }));
  };

  const handleClearAllPlayers = () => {
    trackEvent('player_removed', { clearAll: true });
    setState((prev) => ({
      ...prev,
      players: [],
      updatedAt: Date.now(),
    }));
  };

  const handleLoadPresets = (presetList: Array<{ name: string; team?: string; color?: string }>) => {
    const newPlayers: Player[] = presetList.map((p) => ({
      id: `p-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      name: p.name,
      team: p.team,
      color: p.color,
    }));

    trackEvent('player_added', { count: newPlayers.length, preset: true });
    setState((prev) => ({
      ...prev,
      players: newPlayers,
      updatedAt: Date.now(),
    }));
  };

  const handleSetNumberOfGroups = (num: number) => {
    setState((prev) => ({
      ...prev,
      numberOfGroups: num,
      updatedAt: Date.now(),
    }));
  };

  const handleSetAdvancementRule = (rule: 'bestThirds' | 'proportional' | 'manual' | null) => {
    setState((prev) => ({
      ...prev,
      advancementRule: rule,
      updatedAt: Date.now(),
    }));
  };

  const handleUpdateGroupAdvanceCount = (groupCode: string, count: number) => {
    setState((prev) => {
      const updatedSettings = {
        ...(prev.groupAdvanceSettings || {}),
        [groupCode]: count,
      };

      const updatedGroups = prev.groups.map((g) => {
        if (g.code === groupCode) {
          return { ...g, advanceCount: count };
        }
        return g;
      });

      return {
        ...prev,
        groupAdvanceSettings: updatedSettings,
        groups: updatedGroups,
        updatedAt: Date.now(),
      };
    });
  };

  const handleSetTournamentFormat = (format: TournamentFormat) => {
    if (format === 'group_knockout') {
      trackEvent('mode_group_enter', { format });
    } else {
      trackEvent('mode_knockout_enter', { format });
    }

    setState((prev) => ({
      ...prev,
      tournamentFormat: format,
      title:
        format === 'group_knockout'
          ? (prev.gameType === 'billiards' ? 'تورنمنت بیلیارد (گروهی + حذفی)' : 'کاپ گروهی PES 2021')
          : format === 'knockout_single'
          ? (prev.gameType === 'billiards' ? 'تورنمنت تک‌حذفی بیلیارد' : 'تورنمنت حذفی تک PES 2021')
          : format === 'knockout_black'
          ? (prev.gameType === 'billiards' ? 'تورنمنت حالت بلک بیلیارد' : 'تورنمنت حالت بلک PES 2021')
          : (prev.gameType === 'billiards' ? 'تورنمنت دوحذفی بیلیارد' : 'تورنمنت حذفی دوگانه PES 2021'),
      updatedAt: Date.now(),
    }));
  };

  const handleSetGameType = (gt: GameType) => {
    trackEvent('game_type_selected', { gameType: gt });
    setState((prev) => {
      const isPes = gt === 'pes';
      const defaultTitle = isPes ? 'کاپ گروهی PES 2021' : 'تورنمنت بیلیارد (8-Ball)';
      return {
        ...prev,
        gameType: gt,
        title:
          !prev.title || prev.title.includes('PES') || prev.title.includes('بیلیارد')
            ? defaultTitle
            : prev.title,
        updatedAt: Date.now(),
      };
    });
  };

  const handleSetBilliardsFormat = (bFormat: BilliardsFormat) => {
    trackEvent('billiards_format_selected', { format: bFormat });
    setState((prev) => ({
      ...prev,
      billiardsFormat: bFormat,
      updatedAt: Date.now(),
    }));
  };

  const handleStartKnockoutTournament = () => {
    if (state.players.length < 2) return;
    const isDouble = state.tournamentFormat === 'knockout_double';
    // در حالت بلک (Black Mode)، مرحله اول دقیقاً تک‌حذفی مستقیم است (isDouble = false)
    const { matches, byePlayerIds, totalRounds } = generateDirectKnockoutInitialMatches(
      state.players,
      isDouble
    );

    trackEvent('tournament_started', {
      format: state.tournamentFormat,
      playersCount: state.players.length,
      matchesCount: matches.length,
    });

    setState((prev) => ({
      ...prev,
      status: 'knockout',
      matches,
      byePlayerIds,
      totalKnockoutRounds: totalRounds,
      currentKnockoutRoundIndex: 1,
      blackModeSubsequentFormat: undefined,
      championId: null,
      runnerUpId: null,
      thirdPlaceId: null,
      updatedAt: Date.now(),
    }));

    setActiveTab('bracket');
  };

  const handleAdvanceKnockoutRound = () => {
    // در حالت بلک، اگر مرحله اول به پایان رسیده باشد و هنوز فرمت مراحل بعدی تعیین نشده، مودال باز شود
    if (
      state.tournamentFormat === 'knockout_black' &&
      (state.currentKnockoutRoundIndex || 1) === 1 &&
      !state.blackModeSubsequentFormat
    ) {
      sound.playClick();
      setIsBlackModeModalOpen(true);
      return;
    }

    executeAdvanceKnockoutRound();
  };

  const handleConfirmBlackModeFormat = (chosenFormat: 'single' | 'bo3') => {
    setIsBlackModeModalOpen(false);
    executeAdvanceKnockoutRound(chosenFormat);
  };

  const executeAdvanceKnockoutRound = (chosenFormat?: 'single' | 'bo3') => {
    const isDouble = state.tournamentFormat === 'knockout_double';
    const currentRound = state.currentKnockoutRoundIndex || 1;
    const effectiveFormat = chosenFormat || state.blackModeSubsequentFormat;

    let forceBo3: boolean | undefined = undefined;
    if (state.tournamentFormat === 'knockout_black') {
      forceBo3 = effectiveFormat === 'bo3';
    }

    const result = generateNextKnockoutRoundMatches(
      state.matches,
      state.byePlayerIds || [],
      currentRound,
      state.hasThirdPlaceMatch,
      isDouble,
      forceBo3,
      playersMap
    );

    if (!result) return;

    if (result.isFinal && (result.championId || result.newMatches.length === 0)) {
      trackEvent('tournament_finished', {
        championId: result.championId,
        runnerUpId: result.runnerUpId,
        format: state.tournamentFormat,
      });
      setState((prev) => ({
        ...prev,
        blackModeSubsequentFormat: effectiveFormat || prev.blackModeSubsequentFormat,
        championId: result.championId || prev.championId,
        runnerUpId: result.runnerUpId || prev.runnerUpId,
        thirdPlaceId: result.thirdPlaceId || prev.thirdPlaceId,
        status: 'finished',
        updatedAt: Date.now(),
      }));
      sound.playFanfare();
      setIsChampionModalOpen(true);
      return;
    }

    sound.playWhistle();
    setState((prev) => ({
      ...prev,
      blackModeSubsequentFormat: effectiveFormat || prev.blackModeSubsequentFormat,
      matches: [...prev.matches, ...result.newMatches],
      currentKnockoutRoundIndex: currentRound + 1,
      updatedAt: Date.now(),
    }));
  };

  const handleSaveBo3Game = (
    matchId: string,
    gameNumber: number,
    homeScore: number,
    awayScore: number
  ) => {
    sound.playGoalSound();
    trackEvent('match_result_submitted', { matchId, gameNumber, homeScore, awayScore });
    setState((prev) => {
      const match = prev.matches.find((m) => m.id === matchId);
      if (!match) return prev;

      const oldWinnerId = match.winnerId || null;
      const oldLoserId = match.loserId || null;

      const { updatedMatch, error } = saveBo3GameScore(
        match,
        gameNumber,
        homeScore,
        awayScore
      );
      if (error) {
        return prev;
      }

      let newMatches = prev.matches.map((m) => (m.id === matchId ? updatedMatch : m));

      if (updatedMatch.stage === 'knockout') {
        newMatches = syncDownstreamKnockoutMatches(
          newMatches,
          updatedMatch,
          oldWinnerId,
          oldLoserId
        );
        newMatches = propagateKnockoutResult(
          newMatches,
          matchId,
          updatedMatch.winnerId || null,
          updatedMatch.loserId || null
        );
      }

      const finalMatch = newMatches.find(
        (m) =>
          m.stage === 'knockout' &&
          (m.knockoutRound === 'final' ||
            m.bracketType === 'grand_final' ||
            m.roundLabel?.includes('فینال قهرمانی'))
      );

      let newChampionId = prev.championId;
      let newRunnerUpId = prev.runnerUpId;
      let newThirdPlaceId = prev.thirdPlaceId;
      let newStatus = prev.status;

      if (finalMatch) {
        if (finalMatch.isFinished && finalMatch.winnerId) {
          newChampionId = finalMatch.winnerId;
          newRunnerUpId = finalMatch.loserId || null;
          newStatus = 'finished';
          if (!prev.championId) {
            trackEvent('tournament_finished', { championId: newChampionId, runnerUpId: newRunnerUpId });
            sound.playFanfare();
            setIsChampionModalOpen(true);
          }
        } else {
          newChampionId = null;
          newRunnerUpId = null;
          if (prev.status === 'finished') {
            newStatus = 'knockout';
          }
        }
      }

      const thirdMatch = newMatches.find((m) => m.knockoutRound === 'thirdPlace');
      if (thirdMatch && thirdMatch.isFinished) {
        newThirdPlaceId = thirdMatch.winnerId || null;
      }

      return {
        ...prev,
        matches: newMatches,
        championId: newChampionId,
        runnerUpId: newRunnerUpId,
        thirdPlaceId: newThirdPlaceId,
        status: newStatus,
        updatedAt: Date.now(),
      };
    });
  };

  const handleQuickBo3Win = (matchId: string, winningSide: 'home' | 'away') => {
    sound.playGoalSound();
    trackEvent('match_result_submitted', { matchId, winningSide, quickWin: true });
    setState((prev) => {
      const match = prev.matches.find((m) => m.id === matchId);
      if (!match || match.isFinished) return prev;

      const oldWinnerId = match.winnerId || null;
      const oldLoserId = match.loserId || null;

      const updatedMatch = quickRecordBo3GameWin(match, winningSide);
      let newMatches = prev.matches.map((m) => (m.id === matchId ? updatedMatch : m));

      if (updatedMatch.stage === 'knockout') {
        newMatches = syncDownstreamKnockoutMatches(
          newMatches,
          updatedMatch,
          oldWinnerId,
          oldLoserId
        );
        newMatches = propagateKnockoutResult(
          newMatches,
          matchId,
          updatedMatch.winnerId || null,
          updatedMatch.loserId || null
        );
      }

      const finalMatch = newMatches.find(
        (m) =>
          m.stage === 'knockout' &&
          (m.knockoutRound === 'final' ||
            m.bracketType === 'grand_final' ||
            m.roundLabel?.includes('فینال قهرمانی'))
      );

      let newChampionId = prev.championId;
      let newRunnerUpId = prev.runnerUpId;
      let newThirdPlaceId = prev.thirdPlaceId;
      let newStatus = prev.status;

      if (finalMatch) {
        if (finalMatch.isFinished && finalMatch.winnerId) {
          newChampionId = finalMatch.winnerId;
          newRunnerUpId = finalMatch.loserId || null;
          newStatus = 'finished';
          if (!prev.championId) {
            sound.playFanfare();
            setIsChampionModalOpen(true);
          }
        } else {
          newChampionId = null;
          newRunnerUpId = null;
          if (prev.status === 'finished') {
            newStatus = 'knockout';
          }
        }
      }

      const thirdMatch = newMatches.find((m) => m.knockoutRound === 'thirdPlace');
      if (thirdMatch && thirdMatch.isFinished) {
        newThirdPlaceId = thirdMatch.winnerId || null;
      }

      return {
        ...prev,
        matches: newMatches,
        championId: newChampionId,
        runnerUpId: newRunnerUpId,
        thirdPlaceId: newThirdPlaceId,
        status: newStatus,
        updatedAt: Date.now(),
      };
    });
  };

  const handleResetBo3Match = (matchId: string) => {
    sound.playClick();
    setState((prev) => {
      const match = prev.matches.find((m) => m.id === matchId);
      if (!match) return prev;

      const oldWinnerId = match.winnerId || null;
      const oldLoserId = match.loserId || null;

      const resetMatch = resetBo3Match(match);
      let newMatches = prev.matches.map((m) => (m.id === matchId ? resetMatch : m));

      if (match.stage === 'knockout') {
        newMatches = syncDownstreamKnockoutMatches(
          newMatches,
          resetMatch,
          oldWinnerId,
          oldLoserId
        );
        newMatches = propagateKnockoutResult(
          newMatches,
          matchId,
          null,
          null
        );
      }

      const finalMatch = newMatches.find(
        (m) =>
          m.stage === 'knockout' &&
          (m.knockoutRound === 'final' ||
            m.bracketType === 'grand_final' ||
            m.roundLabel?.includes('فینال قهرمانی'))
      );

      let newChampionId = prev.championId;
      let newRunnerUpId = prev.runnerUpId;
      let newThirdPlaceId = prev.thirdPlaceId;
      let newStatus = prev.status;

      if (finalMatch) {
        if (finalMatch.isFinished && finalMatch.winnerId) {
          newChampionId = finalMatch.winnerId;
          newRunnerUpId = finalMatch.loserId || null;
          newStatus = 'finished';
        } else {
          newChampionId = null;
          newRunnerUpId = null;
          if (prev.status === 'finished') {
            newStatus = 'knockout';
          }
        }
      }

      const thirdMatch = newMatches.find((m) => m.knockoutRound === 'thirdPlace');
      if (thirdMatch && !thirdMatch.isFinished) {
        newThirdPlaceId = null;
      }

      return {
        ...prev,
        matches: newMatches,
        championId: newChampionId,
        runnerUpId: newRunnerUpId,
        thirdPlaceId: newThirdPlaceId,
        status: newStatus,
        updatedAt: Date.now(),
      };
    });
  };

  const handleUpdateHostLogo = (logo: string | null) => {
    setState((prev) => ({
      ...prev,
      hostLogo: logo,
      updatedAt: Date.now(),
    }));
  };

  const handleSwapPlayerGroup = (playerId: string, targetGroupId: string) => {
    trackEvent('groups_shuffled', { action: 'swap', playerId, targetGroupId });
    setState((prev) => {
      const hasPlayedAnyMatch = prev.matches.some(
        (m) => m.stage === 'group' && (m.isFinished || m.homeScore !== null || m.awayScore !== null)
      );
      if (hasPlayedAnyMatch || prev.status === 'knockout' || prev.status === 'finished') {
        return prev;
      }

      const sourceGroup = prev.groups.find((g) => g.playerIds.includes(playerId));
      const targetGroup = prev.groups.find((g) => g.id === targetGroupId);

      if (!sourceGroup || !targetGroup || sourceGroup.id === targetGroupId) return prev;

      const updatedGroups = prev.groups.map((g) => {
        if (g.id === sourceGroup.id) {
          return { ...g, playerIds: g.playerIds.filter((id) => id !== playerId) };
        }
        if (g.id === targetGroup.id) {
          return { ...g, playerIds: [...g.playerIds, playerId] };
        }
        return g;
      });

      const hasKnockoutMatches = prev.matches.some((m) => m.stage === 'knockout');
      
      const newGroupMatches: Match[] = [];
      updatedGroups.forEach((group) => {
        const matches = generateGroupFixtures(group.id, group.playerIds);
        newGroupMatches.push(...matches);
      });

      const updatedMatches = [...prev.matches.filter((m) => m.stage === 'knockout'), ...newGroupMatches];

      return {
        ...prev,
        groups: updatedGroups,
        matches: updatedMatches,
        status: hasKnockoutMatches ? 'group' : prev.status, 
        updatedAt: Date.now(),
      };
    });
  };

  const handleChangeNumberOfGroups = (newCount: number, rule?: 'bestThirds' | 'proportional' | 'manual' | null) => {
    trackEvent('groups_shuffled', { action: 'changeGroupCount', newCount });
    setState((prev) => {
      // غیرفعال‌سازی صعود بیش از ۸ بازیکن (۸ گروه ۱۶ بازیکن صعود می‌دهند)
      if (newCount === 8) {
        return prev;
      }

      const hasPlayedAnyMatch = prev.matches.some(
        (m) => m.stage === 'group' && (m.isFinished || m.homeScore !== null || m.awayScore !== null)
      );
      if (hasPlayedAnyMatch || prev.status === 'knockout' || prev.status === 'finished') {
        return prev;
      }

      if (prev.players.length < newCount * 2) {
        return prev;
      }

      const { groups, groupMatches } = distributePlayers(prev.players, newCount);

      // در ۳ گروه، اگر حالت تناسبی بیش از ۸ صعودکننده تولید کند، خودکار به حالت اول (bestThirds) تبدیل می‌شود
      let finalRule = rule;
      if (newCount === 3) {
        const propCount = groups.reduce((acc, g) => acc + (g.playerIds.length >= 5 ? 3 : 2), 0);
        if (propCount > 8 && (finalRule === 'proportional' || prev.advancementRule === 'proportional')) {
          finalRule = 'bestThirds';
        } else {
          finalRule = finalRule || prev.advancementRule || 'bestThirds';
        }
      }

      return {
        ...prev,
        numberOfGroups: newCount,
        groups,
        matches: groupMatches,
        advancementRule: finalRule || prev.advancementRule,
        updatedAt: Date.now(),
      };
    });
  };

  const handleAddPlayerInModal = ({
    name,
    team,
    targetGroupId,
  }: {
    name: string;
    team?: string;
    targetGroupId?: string;
  }) => {
    setState((prev) => {
      const hasPlayedAnyMatch = prev.matches.some(
        (m) => m.stage === 'group' && (m.isFinished || m.homeScore !== null || m.awayScore !== null)
      );
      if (hasPlayedAnyMatch || prev.status === 'knockout' || prev.status === 'finished') {
        return prev;
      }

      const normalizedNewName = name.trim().replace(/\s+/g, ' ').toLowerCase();
      const isDuplicate = prev.players.some(
        (p) => p.name.trim().replace(/\s+/g, ' ').toLowerCase() === normalizedNewName
      );
      if (isDuplicate) {
        return prev;
      }

      const newPlayer: Player = {
        id: `p-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        name: name.trim(),
        team: team?.trim() || undefined,
      };

      trackEvent('player_added', { name: newPlayer.name, team: newPlayer.team, modal: true });

      let targetId = targetGroupId;
      if (!targetId || !prev.groups.some((g) => g.id === targetId)) {
        const sortedGroups = [...prev.groups].sort(
          (a, b) => a.playerIds.length - b.playerIds.length
        );
        targetId = sortedGroups[0]?.id || prev.groups[0]?.id;
      }

      const updatedGroups = prev.groups.map((g) => {
        if (g.id === targetId) {
          return { ...g, playerIds: [...g.playerIds, newPlayer.id] };
        }
        return g;
      });

      let finalRule = prev.advancementRule;
      if (prev.numberOfGroups === 3) {
        const propCount = updatedGroups.reduce(
          (acc, g) => acc + (g.playerIds.length >= 5 ? 3 : 2),
          0
        );
        if (propCount > 8 && finalRule === 'proportional') {
          finalRule = 'bestThirds';
        }
      }

      const newGroupMatches: Match[] = [];
      updatedGroups.forEach((group) => {
        const matches = generateGroupFixtures(group.id, group.playerIds);
        newGroupMatches.push(...matches);
      });

      const updatedMatches = [
        ...prev.matches.filter((m) => m.stage === 'knockout'),
        ...newGroupMatches,
      ];

      return {
        ...prev,
        players: [...prev.players, newPlayer],
        groups: updatedGroups,
        matches: updatedMatches,
        advancementRule: finalRule,
        updatedAt: Date.now(),
      };
    });
  };

  const handleRemovePlayerInModal = (playerId: string) => {
    trackEvent('player_removed', { playerId, modal: true });
    setState((prev) => {
      const hasPlayedAnyMatch = prev.matches.some(
        (m) => m.stage === 'group' && (m.isFinished || m.homeScore !== null || m.awayScore !== null)
      );
      if (hasPlayedAnyMatch || prev.status === 'knockout' || prev.status === 'finished') {
        return prev;
      }

      if (prev.players.length <= prev.numberOfGroups * 2) {
        return prev;
      }

      const currentGroup = prev.groups.find((g) => g.playerIds.includes(playerId));
      if (!currentGroup || currentGroup.playerIds.length <= 2) {
        return prev;
      }

      const updatedGroups = prev.groups.map((g) => ({
        ...g,
        playerIds: g.playerIds.filter((id) => id !== playerId),
      }));

      const newGroupMatches: Match[] = [];
      updatedGroups.forEach((group) => {
        const matches = generateGroupFixtures(group.id, group.playerIds);
        newGroupMatches.push(...matches);
      });

      const updatedMatches = [
        ...prev.matches.filter((m) => m.stage === 'knockout'),
        ...newGroupMatches,
      ];

      return {
        ...prev,
        players: prev.players.filter((p) => p.id !== playerId),
        groups: updatedGroups,
        matches: updatedMatches,
        updatedAt: Date.now(),
      };
    });
  };

  const handleShuffleGroups = () => {
    trackEvent('groups_shuffled', { action: 'shuffle' });
    setState((prev) => {
      const hasPlayedAnyMatch = prev.matches.some(
        (m) => m.stage === 'group' && (m.isFinished || m.homeScore !== null || m.awayScore !== null)
      );
      if (hasPlayedAnyMatch || prev.status === 'knockout' || prev.status === 'finished') {
        return prev;
      }

      const { groups, groupMatches } = distributePlayers(prev.players, prev.numberOfGroups);

      return {
        ...prev,
        groups,
        matches: groupMatches,
        updatedAt: Date.now(),
      };
    });
  };

  const handleStartTournament = () => {
    trackEvent('tournament_started', {
      format: 'group_knockout',
      playersCount: state.players.length,
      numberOfGroups: state.numberOfGroups,
    });

    const { groups, groupMatches } = distributePlayers(
      state.players,
      state.numberOfGroups,
      state.groupAdvanceSettings
    );

    setState((prev) => ({
      ...prev,
      status: 'group',
      groups,
      matches: groupMatches,
      updatedAt: Date.now(),
    }));

    setActiveTab('main');
  };

  const handleSaveScore = (
    matchId: string,
    homeScore: number,
    awayScore: number,
    winnerId?: string | null,
    homePenalties?: number | null,
    awayPenalties?: number | null
  ) => {
    sound.playGoalSound();
    trackEvent('match_result_submitted', {
      matchId,
      homeScore,
      awayScore,
      winnerId,
      hasPenalties: homePenalties !== null && homePenalties !== undefined,
    });

    setState((prev) => {
      const matchToSave = prev.matches.find((m) => m.id === matchId);
      const oldWinnerId = matchToSave?.winnerId || null;
      const oldLoserId = matchToSave?.loserId || null;

      let updatedMatches = prev.matches.map((m) => {
        if (m.id !== matchId) return m;

        const hasPen = homePenalties !== null && homePenalties !== undefined;
        let finalWinner = winnerId;
        if (!finalWinner) {
          if (homeScore > awayScore) finalWinner = m.homePlayerId;
          else if (awayScore > homeScore) finalWinner = m.awayPlayerId;
        }

        const finalLoser = finalWinner
          ? (finalWinner === m.homePlayerId ? m.awayPlayerId : m.homePlayerId)
          : null;

        return {
          ...m,
          homeScore,
          awayScore,
          isFinished: true,
          hasPenalties: hasPen,
          homePenaltyScore: homePenalties,
          awayPenaltyScore: awayPenalties,
          winnerId: finalWinner,
          loserId: finalLoser,
          updatedAt: Date.now(),
        };
      });

      const currentMatch = updatedMatches.find((m) => m.id === matchId);
      let newChampionId = prev.championId;
      let newRunnerUpId = prev.runnerUpId;
      let newThirdPlaceId = prev.thirdPlaceId;
      let newStatus = prev.status;

      if (currentMatch && currentMatch.stage === 'group') {
        const hasKnockout = updatedMatches.some((m) => m.stage === 'knockout');
        if (hasKnockout) {
          const newStandings: Record<string, GroupStanding[]> = {};
          prev.groups.forEach((g) => {
            newStandings[g.id] = calculateGroupStandings(
              g.id,
              g.playerIds,
              updatedMatches,
              playersMap
            );
          });
          const knockoutOnly = updatedMatches.filter((m) => m.stage === 'knockout');
          const groupOnly = updatedMatches.filter((m) => m.stage === 'group');
          const syncedKnockout = syncKnockoutSeedsFromStandings(
            knockoutOnly,
            prev.groups,
            newStandings,
            prev.advancementRule || 'bestThirds'
          );
          updatedMatches = [...groupOnly, ...syncedKnockout];
        }
      }

      if (currentMatch && currentMatch.stage === 'knockout') {
        const winner = currentMatch.winnerId || null;
        const loser =
          winner === currentMatch.homePlayerId
            ? currentMatch.awayPlayerId
            : currentMatch.homePlayerId;

        updatedMatches = syncDownstreamKnockoutMatches(
          updatedMatches,
          currentMatch,
          oldWinnerId,
          oldLoserId
        );

        updatedMatches = propagateKnockoutResult(
          updatedMatches,
          matchId,
          winner,
          loser
        );

        const finalMatch = updatedMatches.find(
          (m) =>
            m.stage === 'knockout' &&
            (m.knockoutRound === 'final' ||
              m.bracketType === 'grand_final' ||
              m.roundLabel?.includes('فینال قهرمانی'))
        );

        if (finalMatch) {
          if (finalMatch.isFinished && finalMatch.winnerId) {
            newChampionId = finalMatch.winnerId;
            newRunnerUpId =
              finalMatch.loserId ||
              (finalMatch.winnerId === finalMatch.homePlayerId
                ? finalMatch.awayPlayerId
                : finalMatch.homePlayerId);
            newStatus = 'finished';
            if (!prev.championId) {
              trackEvent('tournament_finished', {
                championId: newChampionId,
                runnerUpId: newRunnerUpId,
              });
            }
            setIsChampionModalOpen(true);
          } else {
            newChampionId = null;
            newRunnerUpId = null;
            if (prev.status === 'finished') {
              newStatus = 'knockout';
            }
          }
        }

        const thirdMatch = updatedMatches.find((m) => m.knockoutRound === 'thirdPlace');
        if (thirdMatch && thirdMatch.isFinished) {
          newThirdPlaceId = thirdMatch.winnerId || null;
        }
      }

      return {
        ...prev,
        matches: updatedMatches,
        championId: newChampionId,
        runnerUpId: newRunnerUpId,
        thirdPlaceId: newThirdPlaceId,
        status: newStatus,
        updatedAt: Date.now(),
      };
    });
  };

  const handleResetScore = (matchId: string) => {
    setState((prev) => {
      const matchToReset = prev.matches.find((m) => m.id === matchId);
      if (!matchToReset) return prev;

      const oldWinnerId = matchToReset.winnerId || null;
      const oldLoserId = matchToReset.loserId || null;

      const resetMatch: Match = {
        ...matchToReset,
        homeScore: null,
        awayScore: null,
        isFinished: false,
        hasPenalties: false,
        homePenaltyScore: null,
        awayPenaltyScore: null,
        winnerId: null,
        loserId: null,
        updatedAt: Date.now(),
      };

      let updatedMatches = prev.matches.map((m) => (m.id === matchId ? resetMatch : m));

      if (matchToReset.stage === 'group') {
        const hasKnockout = updatedMatches.some((m) => m.stage === 'knockout');
        if (hasKnockout) {
          const newStandings: Record<string, GroupStanding[]> = {};
          prev.groups.forEach((g) => {
            newStandings[g.id] = calculateGroupStandings(
              g.id,
              g.playerIds,
              updatedMatches,
              playersMap
            );
          });
          const knockoutOnly = updatedMatches.filter((m) => m.stage === 'knockout');
          const groupOnly = updatedMatches.filter((m) => m.stage === 'group');
          const syncedKnockout = syncKnockoutSeedsFromStandings(
            knockoutOnly,
            prev.groups,
            newStandings,
            prev.advancementRule || 'bestThirds'
          );
          updatedMatches = [...groupOnly, ...syncedKnockout];
        }
      }

      let newChampionId = prev.championId;
      let newRunnerUpId = prev.runnerUpId;
      let newThirdPlaceId = prev.thirdPlaceId;
      let newStatus = prev.status;

      if (matchToReset.stage === 'knockout') {
        updatedMatches = syncDownstreamKnockoutMatches(
          updatedMatches,
          resetMatch,
          oldWinnerId,
          oldLoserId
        );

        updatedMatches = propagateKnockoutResult(
          updatedMatches,
          matchId,
          null,
          null
        );

        const finalMatch = updatedMatches.find(
          (m) =>
            m.stage === 'knockout' &&
            (m.knockoutRound === 'final' ||
              m.bracketType === 'grand_final' ||
              m.roundLabel?.includes('فینال قهرمانی'))
        );

        if (finalMatch) {
          if (finalMatch.isFinished && finalMatch.winnerId) {
            newChampionId = finalMatch.winnerId;
            newRunnerUpId = finalMatch.loserId || null;
            newStatus = 'finished';
          } else {
            newChampionId = null;
            newRunnerUpId = null;
            if (prev.status === 'finished') {
              newStatus = 'knockout';
            }
          }
        }

        const thirdMatch = updatedMatches.find((m) => m.knockoutRound === 'thirdPlace');
        if (thirdMatch && !thirdMatch.isFinished) {
          newThirdPlaceId = null;
        }
      }

      return {
        ...prev,
        matches: updatedMatches,
        championId: newChampionId,
        runnerUpId: newRunnerUpId,
        thirdPlaceId: newThirdPlaceId,
        status: newStatus,
        updatedAt: Date.now(),
      };
    });
  };

  const canAdvanceToKnockout = useMemo(() => {
    if (state.groups.length === 0) return false;

    const allGroupMatches = state.matches.filter((m) => m.stage === 'group');
    const allMatchesFinished = allGroupMatches.length > 0 && allGroupMatches.every((m) => m.isFinished);
    
    if (!allMatchesFinished) return false;

    if (state.groups.length === 3 && state.advancementRule === 'bestThirds') {
      // برای ۳ گروه در حالت برترین‌های سوم (۸ تیم صعودکننده)
      return (
        state.groups.every((g) => {
          const list = standingsMap[g.id];
          return list && list.length >= 2;
        }) && state.players.length >= 8
      );
    }

    const totalAdvancing = state.groups.reduce((acc, g) => acc + (g.advanceCount ?? 2), 0);
    if (!isValidKnockoutCount(totalAdvancing)) return false;

    const hasAnyOverflow = state.groups.some((g) => (g.advanceCount ?? 2) > g.playerIds.length);
    if (hasAnyOverflow) return false;

    return state.groups.every((g) => {
      const list = standingsMap[g.id];
      const count = g.advanceCount ?? 2;
      return list && list.length >= count;
    });
  }, [state.groups, state.matches, standingsMap, state.advancementRule, state.players.length]);

  const executeAdvanceToKnockout = () => {
    const knockoutMatches = generateKnockoutStage(
      state.groups,
      standingsMap,
      state.hasThirdPlaceMatch,
      state.advancementRule || 'bestThirds'
    );

    const existingGroupMatches = state.matches.filter((m) => m.stage === 'group');

    setState((prev) => ({
      ...prev,
      status: 'knockout',
      matches: [...existingGroupMatches, ...knockoutMatches],
      updatedAt: Date.now(),
    }));

    setIsKnockoutRebuildModalOpen(false);
    setActiveTab('bracket');
  };

  const handleAdvanceToKnockout = () => {
    const isThreeGroupsBestThirds = state.groups.length === 3 && state.advancementRule === 'bestThirds';

    const hasAnyOverflow = !isThreeGroupsBestThirds && state.groups.some((g) => (g.advanceCount ?? 2) > g.playerIds.length);
    if (hasAnyOverflow) {
      alert('تعداد صعودی نمیتواند بیشتر از تعداد بازیکنان گروه باشد.');
      return;
    }

    const totalAdvancing = isThreeGroupsBestThirds
      ? 8
      : state.groups.reduce((acc, g) => acc + (g.advanceCount ?? 2), 0);

    if (!isValidKnockoutCount(totalAdvancing)) {
      alert(getKnockoutCountErrorMessage(totalAdvancing));
      return;
    }

    if (!canAdvanceToKnockout) return;

    const hasKnockoutMatches = state.matches.some((m) => m.stage === 'knockout');
    if (hasKnockoutMatches) {
      setIsKnockoutRebuildModalOpen(true);
      return;
    }

    executeAdvanceToKnockout();
  };

  const handleToggleSound = () => {
    setState((prev) => ({
      ...prev,
      soundEnabled: !prev.soundEnabled,
    }));
  };

  const handleConfirmReset = () => {
    clearTournamentStorage();
    setState({
      ...INITIAL_STATE,
      id: 'pes2021-cup-' + Date.now(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    setIsResetModalOpen(false);
    setActiveTab('main');
  };

  const handleImportState = (newState: TournamentState) => {
    setState(newState);
  };

  const handleUpdatePlayerAvatar = (playerId: string, avatarUrl: string) => {
    setState((prev) => ({
      ...prev,
      players: prev.players.map((p) =>
        p.id === playerId ? { ...p, avatarUrl } : p
      ),
      updatedAt: Date.now(),
    }));
  };

  const finalMatch = useMemo(() => {
    return (
      state.matches.find(
        (m) => m.stage === 'knockout' && m.knockoutRound === 'final'
      ) || null
    );
  }, [state.matches]);

  const championPlayer = state.championId ? playersMap.get(state.championId) : null;
  const runnerUpPlayer = state.runnerUpId ? playersMap.get(state.runnerUpId) : null;

  // 🔴 رندرهای مسیرهای اختصاصی و مخفی ادمین
  if (adminRoute === 'login') {
    return (
      <AdminLogin
        onLoginSuccess={() => {
          setAdminRoute('dashboard');
          if (typeof window !== 'undefined' && window.history.pushState) {
            window.history.pushState({}, '', '/admin-dashboard');
          }
        }}
      />
    );
  }

  if (adminRoute === 'dashboard') {
    return (
      <AdminDashboard
        onLogout={() => {
          localStorage.removeItem('tm_admin_token');
          setAdminRoute('login');
          if (typeof window !== 'undefined' && window.history.pushState) {
            window.history.pushState({}, '', '/admin-live');
          }
        }}
      />
    );
  }

  // 🔴 صفحه قفل لایسنس (قبل از return اصلی)
  if (isLocked) {
    return (
      <div className="min-h-screen bg-[#080c14] text-slate-100 flex flex-col items-center justify-center p-6 text-center" dir="rtl">
        <div className="bg-slate-900 border border-cyan-500/30 p-8 rounded-3xl shadow-2xl max-w-md w-full relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-3xl" />
          <div className="w-20 h-20 bg-cyan-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-cyan-500/30">
            <Lock className="w-10 h-10 text-cyan-400" />
          </div>
          <h1 className="text-2xl font-black text-white mb-2">فعال‌سازی نسخه</h1>
          <p className="text-sm text-slate-400 mb-6">لطفاً کد لایسنس خود را وارد کنید.</p>
          
          <input
            type="text"
            value={licenseInput}
            onChange={(e) => setLicenseInput(e.target.value)}
            placeholder="DEMO-20261105-A1B2C3D4"
            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-center text-white font-mono mb-3 outline-none focus:border-cyan-400"
            dir="ltr"
          />
          {licenseError && <p className="text-rose-400 text-xs mb-3 font-bold">{licenseError}</p>}
          
          <button
            onClick={handleActivateLicense}
            className="w-full py-3 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl transition-colors"
          >
            فعال‌سازی
          </button>
          
          <div className="mt-6 text-xs text-slate-500">
            برای دریافت لایسنس با <span className="text-cyan-400">8biranian.com</span> تماس بگیرید.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${state.gameType === 'billiards' ? 'bg-[#03150c] text-emerald-100' : 'bg-app-bg text-app-text'} flex flex-col selection:bg-emerald-500/30 selection:text-emerald-100 overflow-x-hidden`}>
      <TopHeader
        state={state}
        onResetClick={() => setIsResetModalOpen(true)}
        onToggleSound={handleToggleSound}
        onImportState={handleImportState}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        assetsBase={assetsBase}
        hostLogo={state.hostLogo}
      />

      {state.status !== 'setup' && (
        <DashboardStatus
          state={state}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onAdvanceToKnockout={handleAdvanceToKnockout}
          canAdvanceToKnockout={canAdvanceToKnockout}
          onOpenCelebrationModal={() => setIsChampionModalOpen(true)}
        />
      )}

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 md:py-8">
        {state.status === 'setup' ? (
          <PlayerForm
            players={state.players}
            onAddPlayer={handleAddPlayer}
            onAddBulkPlayers={handleAddBulkPlayers}
            onRemovePlayer={handleRemovePlayer}
            onClearAllPlayers={handleClearAllPlayers}
            numberOfGroups={state.numberOfGroups}
            onSetNumberOfGroups={handleSetNumberOfGroups}
            advancementRule={state.advancementRule || 'bestThirds'}
            onSetAdvancementRule={handleSetAdvancementRule}
            onStartTournament={handleStartTournament}
            onLoadPresets={handleLoadPresets}
            assetsBase={assetsBase}
            hostLogo={state.hostLogo}
            onUpdateHostLogo={handleUpdateHostLogo}
            tournamentFormat={state.tournamentFormat || 'group_knockout'}
            onSetTournamentFormat={handleSetTournamentFormat}
            onStartKnockoutTournament={handleStartKnockoutTournament}
            groupAdvanceSettings={state.groupAdvanceSettings}
            onUpdateGroupAdvanceCount={handleUpdateGroupAdvanceCount}
            gameType={state.gameType || 'pes'}
            onSetGameType={handleSetGameType}
            billiardsFormat={state.billiardsFormat || 'bo3'}
            onSetBilliardsFormat={handleSetBilliardsFormat}
          />
        ) : (
          <>
            {/* TAB: Main Dashboard Overview */}
            {activeTab === 'main' && (
              <div className="space-y-8">
                {state.gameType === 'billiards' ? (
                  <div className="card-stadium p-6 rounded-2xl border border-emerald-800/80 bg-gradient-to-r from-[#062417] via-[#041a10] to-[#020e08] shadow-2xl relative overflow-hidden text-emerald-100">
                    <div
                      className="absolute inset-y-0 left-0 w-1/3 opacity-25 pointer-events-none bg-cover bg-center hidden lg:block"
                      style={{
                        backgroundImage: `url('https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTqniQoQxzh_5OlE93mckbAehloeipZ-9sLPNj7zTCCJ4O3ushLTLDhIAi5&s=10')`,
                        maskImage: 'linear-gradient(to right, transparent, black 50%, transparent)',
                        WebkitMaskImage: 'linear-gradient(to right, transparent, black 50%, transparent)',
                      }}
                    />
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
                      <div className="flex items-center gap-5">
                        <div className="hidden sm:block w-32 h-20 rounded-xl overflow-hidden border border-emerald-500/50 shadow-lg shrink-0 bg-black/50 group">
                          <img
                            src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTqniQoQxzh_5OlE93mckbAehloeipZ-9sLPNj7zTCCJ4O3ushLTLDhIAi5&s=10"
                            alt="Billiards Championship"
                            className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <div className="text-xs font-semibold tracking-wider text-emerald-400 flex items-center gap-2">
                            <span>
                              {state.status === 'finished'
                                ? 'کاپ بیلیارد به پایان رسید'
                                : state.status === 'knockout'
                                ? 'مراحل حذفی بیلیارد'
                                : 'مرحله گروهی بیلیارد'}
                            </span>
                            <span className="text-emerald-800" aria-hidden="true">·</span>
                            <span className="text-emerald-400/80 font-mono text-[10px]">
                              8-BALL & 9-BALL CHAMPIONSHIP
                            </span>
                          </div>
                          <h2 className="text-xl sm:text-2xl font-black text-white">
                            {state.status === 'finished' && championPlayer
                              ? `تبریک! ${championPlayer.name.replace(/\s*\([^)]*\)/g, '').trim()} قهرمان مسابقات بیلیارد شد!`
                              : state.status === 'knockout'
                              ? 'رقابت‌های جذاب حذفی و فینال بیلیارد در جریان است'
                              : 'جداول مرحله گروهی و مسابقات بیلیارد در جریان است'}
                          </h2>
                          <p className="text-xs text-emerald-300/80 max-w-2xl">
                            {state.status === 'finished'
                              ? 'تمامی بازی‌ها به پایان رسید و قهرمان کاپ بیلیارد مشخص شد.'
                              : state.status === 'knockout'
                              ? 'برای ثبت فریم‌های برده و صعود به دور بعد، به جدول حذفی مراجعه کنید.'
                              : 'فریم‌های برده هر بازی را ثبت کنید تا جدول رده‌بندی بیلیارد به صورت بلادرنگ بروزرسانی شود.'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 flex-wrap shrink-0">
                        {championPlayer && (
                          <button
                            onClick={() => {
                              sound.playFanfare();
                              setIsChampionModalOpen(true);
                            }}
                            className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-amber-950 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 hover:brightness-110 rounded-xl shadow-lg shadow-amber-500/20 border border-amber-300 transition-all cursor-pointer animate-pulse"
                          >
                            <Trophy className="w-4 h-4 text-amber-900" />
                            <span>سکوی افتخار و عکس قهرمانان</span>
                          </button>
                        )}

                        {state.status === 'group' && canAdvanceToKnockout && (
                          <button
                            onClick={() => {
                              sound.playFanfare();
                              handleAdvanceToKnockout();
                            }}
                            className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:brightness-110 rounded-xl shadow-md shadow-emerald-950/60 ring-1 ring-emerald-400/40 transition-all cursor-pointer"
                          >
                            <Sparkles className="w-4 h-4 text-emerald-300" />
                            <span>ورود به مرحله حذفی بیلیارد</span>
                          </button>
                        )}

                        <button
                          onClick={() => setActiveTab('fixtures')}
                          className="flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-emerald-200 bg-[#062417] hover:bg-[#08301f] rounded-xl border border-emerald-800/80 transition-colors cursor-pointer"
                        >
                          <Calendar className="w-4 h-4 text-emerald-400" />
                          <span>مشاهده همه مسابقات</span>
                        </button>

                        <button
                          onClick={() => setActiveTab('bracket')}
                          className="flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-emerald-200 bg-[#062417] hover:bg-[#08301f] rounded-xl border border-emerald-800/80 transition-colors cursor-pointer"
                        >
                          <GitBranch className="w-4 h-4 text-emerald-400" />
                          <span>مراحل حذفی (براکت)</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="card-stadium p-6 rounded-2xl border border-app-border bg-app-surface shadow-xl relative overflow-hidden">
                    {assetsBase && (
                      <div
                        className="absolute inset-y-0 left-0 w-1/3 opacity-20 pointer-events-none bg-cover bg-center hidden lg:block"
                        style={{
                          backgroundImage: `url('./assets/aistudio/i-efootball-pes-2021-season-update-digital_07ad38f0.webp')`,
                          maskImage: 'linear-gradient(to right, transparent, black 50%, transparent)',
                          WebkitMaskImage: 'linear-gradient(to right, transparent, black 50%, transparent)',
                        }}
                      />
                    )}
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
                      <div className="flex items-center gap-5">
                        <div className="hidden sm:block w-32 h-20 rounded-xl overflow-hidden border border-app-primary/40 shadow-lg shrink-0 bg-app-bg group">
                          {assetsBase && (
                            <img
                              src="./assets/aistudio/i-efootball-pes-2021-season-update-digital_07ad38f0.webp"
                              alt="PES 2021 Season Update"
                              className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-300"
                              referrerPolicy="no-referrer"
                            />
                          )}
                        </div>
                        <div className="space-y-1.5">
                          <div className="text-xs font-semibold tracking-wider text-emerald-400 flex items-center gap-2">
                            <span>
                              {state.status === 'finished'
                                ? 'جام به پایان رسید'
                                : state.status === 'knockout'
                                ? 'مرحله حذفی مسابقات'
                                : 'مرحله گروهی مسابقات'}
                            </span>
                            <span className="text-emerald-800" aria-hidden="true">·</span>
                            <span className="text-slate-400 font-mono text-[10px]">
                              PES 2021 ENGINE
                            </span>
                          </div>
                          <h2 className="text-xl sm:text-2xl font-black text-white">
                            {state.status === 'finished' && championPlayer
                              ? `تبریک! ${championPlayer.name} قهرمان این دوره شد!`
                              : state.status === 'knockout'
                              ? 'رقابت‌های مهیج و نفس‌گیر حذفی در جریان است'
                              : 'جداول مرحله گروهی و مسابقات هفته در جریان است'}
                          </h2>
                          <p className="text-xs text-slate-400 max-w-2xl">
                            {state.status === 'finished'
                              ? 'تمامی مسابقات با موفقیت انجام شده و قهرمان تاج‌گذاری شد.'
                              : state.status === 'knockout'
                              ? 'برای مشخص کردن تیم صعود‌کننده به دور بعد، نتایج بازی‌های حذفی را در تب براکت حذفی ثبت کنید.'
                              : 'نتایج بازی‌ها را ثبت کنید تا جدول رده‌بندی به صورت خودکار بروزرسانی شود. پس از اتمام مسابقات گروهی، وارد مرحله حذفی شوید.'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 flex-wrap shrink-0">
                        {championPlayer && (
                          <button
                            onClick={() => {
                              sound.playFanfare();
                              setIsChampionModalOpen(true);
                            }}
                            className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-amber-950 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 hover:brightness-110 rounded-xl shadow-lg shadow-amber-500/20 border border-amber-300 transition-all cursor-pointer animate-pulse"
                          >
                            <Trophy className="w-4 h-4 text-amber-900" />
                            <span>سکوی افتخار و عکس قهرمانان</span>
                          </button>
                        )}

                        {state.status === 'group' && canAdvanceToKnockout && (
                          <button
                            onClick={() => {
                              sound.playFanfare();
                              handleAdvanceToKnockout();
                            }}
                            className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-app-primary hover:bg-app-primary-hover rounded-xl shadow-md transition-all cursor-pointer"
                          >
                            <Trophy className="w-4 h-4" />
                            <span>ورود به مرحله حذفی</span>
                          </button>
                        )}

                        <button
                          onClick={() => setActiveTab('fixtures')}
                          className="flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-app-text bg-app-surface hover:bg-app-surface-hover rounded-xl border border-app-border transition-colors cursor-pointer"
                        >
                          <Calendar className="w-4 h-4 text-app-primary" />
                          <span>مشاهده همه مسابقات</span>
                        </button>

                        <button
                          onClick={() => setActiveTab('bracket')}
                          className="flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-app-text bg-app-surface hover:bg-app-surface-hover rounded-xl border border-app-border transition-colors cursor-pointer"
                        >
                          <GitBranch className="w-4 h-4 text-app-primary" />
                          <span>نمودار درختی (براکت)</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-base text-app-text flex items-center gap-2">
                      <Grid className="w-4 h-4 text-app-primary" />
                      <span>{state.gameType === 'billiards' ? 'جدول رده‌بندی بیلیارد (خلاصه)' : 'جدول رده‌بندی گروه‌ها (خلاصه)'}</span>
                    </h3>
                    <button
                      onClick={() => setActiveTab('groups')}
                      className="text-xs text-app-primary hover:brightness-125 font-medium transition-colors cursor-pointer"
                    >
                      نمای تمام‌صفحه جداول ←
                    </button>
                  </div>

                  {state.gameType === 'billiards' ? (
                    state.groups.length > 0 ? (
                      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                        {state.groups.map((group) => (
                          <BilliardsGroupTable
                            key={group.id}
                            group={group}
                            standings={standingsMap[group.id] || []}
                            playersMap={playersMap}
                            advancingPlayerIds={advancingPlayerIds}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="w-full">
                        <BilliardsGroupTable
                          standings={billiardsOverallStandings}
                          playersMap={playersMap}
                          advancingPlayerIds={advancingPlayerIds}
                          title="جدول رده‌بندی مسابقات بیلیارد"
                        />
                      </div>
                    )
                  ) : (
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                      {state.groups.map((group) => (
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
                      ))}
                    </div>
                  )}

                  {state.gameType !== 'billiards' && (
                    <div className="mt-2 p-3 bg-app-surface/60 border border-app-border rounded-lg text-center text-xs text-app-text-muted font-medium">
                      {ruleDescription}
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-base text-app-text flex items-center gap-2">
                      <Flame className="w-4 h-4 text-amber-400" />
                      <span>آخرین مسابقات و بازی‌های بعدی</span>
                    </h3>
                    <button
                      onClick={() => setActiveTab('fixtures')}
                      className="text-xs text-app-primary hover:brightness-125 font-medium transition-colors cursor-pointer"
                    >
                      مدیریت کامل مسابقات ←
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                    {state.matches.slice(0, 6).map((match) => (
                      <MatchCard
                        key={match.id}
                        match={match}
                        playersMap={playersMap}
                        onSaveScore={handleSaveScore}
                        onResetScore={handleResetScore}
                        isKnockout={match.stage === 'knockout'}
                        gameType={state.gameType || 'pes'}
                        billiardsFormat={state.billiardsFormat}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'groups' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-app-border pb-3 flex-wrap gap-2">
                  <div>
                    <h2 className="text-lg font-bold text-app-text flex items-center gap-2">
                      <Grid className="w-5 h-5 text-app-primary" />
                      <span>
                        {state.gameType === 'billiards' ? 'جدول رده‌بندی بیلیارد' : 'جداول رده‌بندی تمام گروه‌ها'}
                      </span>
                    </h2>
                    {state.gameType === 'billiards' && (
                      <p className="text-xs text-emerald-400/80 mt-1">
                        رده‌بندی زنده بر اساس بازی‌های انجام شده، تعداد بردهای قاطع، فریم‌های برده، تفاضل فریم و امتیازات.
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    {!hasStartedAnyMatch && state.status === 'group' && (
                      <button
                        onClick={() => {
                          sound.playClick();
                          setIsEditGroupsOpen(true);
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg shadow-sm text-white bg-app-primary hover:bg-app-primary-hover transition-all cursor-pointer"
                        title="ویرایش تعداد گروه‌ها و جابجایی دستی بازیکنان"
                      >
                        <Edit className="w-3.5 h-3.5" />
                        <span>ویرایش تعداد و ترکیب گروه‌ها</span>
                      </button>
                    )}

                    {canAdvanceToKnockout && state.status === 'group' && (
                      <button
                        onClick={() => {
                          sound.playFanfare();
                          handleAdvanceToKnockout();
                        }}
                        className="px-4 py-2 bg-app-primary hover:bg-app-primary-hover text-white font-bold text-xs rounded-xl shadow-md cursor-pointer transition-colors"
                      >
                        شروع مرحله حذفی
                      </button>
                    )}
                  </div>
                </div>

                {state.gameType === 'billiards' ? (
                  /* Dedicated Billiards Table Render */
                  state.groups.length > 0 ? (
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                      {state.groups.map((group) => (
                        <BilliardsGroupTable
                          key={group.id}
                          group={group}
                          standings={standingsMap[group.id] || []}
                          playersMap={playersMap}
                          advancingPlayerIds={advancingPlayerIds}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="w-full">
                      <BilliardsGroupTable
                        standings={billiardsOverallStandings}
                        playersMap={playersMap}
                        advancingPlayerIds={advancingPlayerIds}
                        title="جدول رده‌بندی مسابقات بیلیارد"
                      />
                    </div>
                  )
                ) : (
                  /* Standard PES Group Tables */
                  <>
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                      {state.groups.map((group) => (
                        <GroupTable
                          key={group.id}
                          group={group}
                          standings={standingsMap[group.id] || []}
                          playersMap={playersMap}
                          advancingPlayerIds={advancingPlayerIds}
                          advancementRule={state.advancementRule}
                          gameType={state.gameType || 'pes'}
                        />
                      ))}
                    </div>

                    <div className="mt-2 p-3 bg-app-surface/60 border border-app-border rounded-lg text-center text-xs text-app-text-muted font-medium">
                      {ruleDescription}
                    </div>
                  </>
                )}
              </div>
            )}

            {activeTab === 'fixtures' && (
              state.tournamentFormat && state.tournamentFormat !== 'group_knockout' ? (
                <KnockoutFixturesView
                  state={state}
                  playersMap={playersMap}
                  onSaveScore={handleSaveScore}
                  onSaveBo3Game={handleSaveBo3Game}
                  onQuickBo3Win={handleQuickBo3Win}
                  onResetScore={(matchId) => {
                    const m = state.matches.find((x) => x.id === matchId);
                    if (m?.isBo3 || state.tournamentFormat === 'knockout_double') {
                      handleResetBo3Match(matchId);
                    } else {
                      handleResetScore(matchId);
                    }
                  }}
                  onAdvanceKnockoutRound={handleAdvanceKnockoutRound}
                  onOpenCelebrationModal={() => setIsChampionModalOpen(true)}
                />
              ) : (
                <GroupStageView
                  state={state}
                  standingsMap={standingsMap}
                  playersMap={playersMap}
                  onSaveScore={handleSaveScore}
                  onResetScore={handleResetScore}
                  onAdvanceToKnockout={handleAdvanceToKnockout}
                  canAdvanceToKnockout={canAdvanceToKnockout}
                  onOpenEditGroups={() => setIsEditGroupsOpen(true)}
                />
              )
            )}

            {activeTab === 'bracket' && (
              <BracketView
                state={state}
                playersMap={playersMap}
                onSaveScore={handleSaveScore}
                onSaveBo3Game={handleSaveBo3Game}
                onQuickBo3Win={handleQuickBo3Win}
                onResetScore={(matchId) => {
                  const m = state.matches.find((x) => x.id === matchId);
                  if (m?.isBo3 || state.tournamentFormat === 'knockout_double') {
                    handleResetBo3Match(matchId);
                  } else {
                    handleResetScore(matchId);
                  }
                }}
                onAdvanceKnockoutRound={handleAdvanceKnockoutRound}
                onOpenCelebrationModal={() => setIsChampionModalOpen(true)}
              />
            )}

            {activeTab === 'stats' && (
              <StatsView state={state} playersMap={playersMap} />
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-app-border bg-app-surface/90 py-6 mt-12 text-xs text-app-text-muted">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-6">
          
          <div className="flex items-center gap-4">
            {assetsBase && (
            <div className="bg-white p-1.5 rounded-lg shadow-sm"> 
             <img 
                src="./assets/aistudio/logo.png" 
                alt="هشت بهشت ایرانیان" 
                className="h-12 w-auto opacity-80 hover:opacity-100 transition-opacity"
              />
            </div>  
            )}
            <div className="flex flex-col gap-1 text-right">
              <span className="font-semibold text-app-text">
                طراحی و توسعه: مرتضی دهقانی
              </span>
              <div className="flex items-center gap-2 text-[11px] text-app-text-muted">
                <span>شرکت هشت بهشت ایرانیان</span>
                <span className="text-app-border" aria-hidden="true">·</span>
                <a 
                  href="https://8biranian.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-app-primary hover:underline transition-colors"
                >
                  8biranian.com
                </a>
              </div>
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-center gap-2 md:gap-4 text-[11px] text-app-text-muted">
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-app-primary" />
              <span>سامانه هوشمند مدیریت کاپ PES 2021</span>
            </div>
            <span className="hidden md:inline text-app-border" aria-hidden="true">·</span>
            <span>ذخیره‌سازی خودکار در مرورگر</span>
          </div>

        </div>
      </footer>

      <ResetConfirmModal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        onConfirm={handleConfirmReset}
      />

      {/* مودال تایید بازسازی براکت مرحله حذفی */}
      {isKnockoutRebuildModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in" dir="rtl">
          <div className="card-stadium w-full max-w-md rounded-2xl border border-app-border p-6 shadow-2xl relative bg-app-surface text-app-text">
            <button
              onClick={() => {
                sound.playClick();
                setIsKnockoutRebuildModalOpen(false);
              }}
              className="absolute top-4 left-4 text-app-text-muted hover:text-app-text transition-colors"
              title="بستن پنجره"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 text-amber-400 mb-3">
              <div className="w-10 h-10 rounded-xl bg-amber-950/60 border border-amber-800/80 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <h3 className="text-base font-bold text-app-text">بازسازی براکت مرحله حذفی</h3>
                <span className="text-xs text-amber-400">شروع مجدد مرحله حذفی</span>
              </div>
            </div>

            <p className="text-xs text-app-text-muted leading-relaxed my-4">
              مسابقات مرحله حذفی قبلاً آغاز شده است. آیا مطمئن هستید که می‌خواهید براکت حذفی را بر اساس رتبه‌های جدید گروه‌ها از نو بسازید؟ تمام نتایج ثبت‌شده مرحله حذفی پاک خواهند شد.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  sound.playClick();
                  setIsKnockoutRebuildModalOpen(false);
                }}
                className="px-4 py-2 text-xs font-semibold text-app-text-muted hover:text-app-text bg-app-surface hover:bg-app-surface-hover border border-app-border rounded-lg transition-colors cursor-pointer"
              >
                انصراف
              </button>
              <button
                type="button"
                onClick={() => {
                  sound.playWhistle();
                  executeAdvanceToKnockout();
                }}
                className="px-4 py-2 text-xs font-bold text-white bg-app-primary hover:bg-app-primary-hover rounded-lg shadow-md transition-all cursor-pointer"
              >
                بله، بازسازی براکت حذفی
              </button>
            </div>
          </div>
        </div>
      )}

      <ChampionModal
        isOpen={isChampionModalOpen}
        onClose={() => setIsChampionModalOpen(false)}
        champion={championPlayer || null}
        runnerUp={runnerUpPlayer || null}
        finalMatch={finalMatch}
        onUpdatePlayerAvatar={handleUpdatePlayerAvatar}
        assetsBase={assetsBase}
        hostLogo={state.hostLogo}
        gameType={state.gameType || 'pes'}
      />

      <EditGroupsModal
        isOpen={isEditGroupsOpen}
        onClose={() => setIsEditGroupsOpen(false)}
        groups={state.groups}
        playersMap={playersMap}
        numberOfGroups={state.numberOfGroups}
        totalPlayersCount={state.players.length}
        hasStartedAnyMatch={hasStartedAnyMatch || state.status === 'knockout' || state.status === 'finished'}
        advancementRule={state.advancementRule}
        gameType={state.gameType || 'pes'}
        onChangeNumberOfGroups={handleChangeNumberOfGroups}
        onShuffleGroups={handleShuffleGroups}
        onSwapPlayerGroup={handleSwapPlayerGroup}
        onAddPlayer={handleAddPlayerInModal}
        onRemovePlayer={handleRemovePlayerInModal}
        onUpdateGroupAdvanceCount={handleUpdateGroupAdvanceCount}
      />

      {/* مودال انتخاب فرمت مراحل بعد در حالت بلک (Black Mode) */}
      <BlackModeFormatModal
        isOpen={isBlackModeModalOpen}
        onSelectFormat={handleConfirmBlackModeFormat}
        roundNumber={(state.currentKnockoutRoundIndex || 1) + 1}
      />
    </div>
  );
}
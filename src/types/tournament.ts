export type TournamentStage = 'setup' | 'group' | 'knockout' | 'finished';

export type TournamentFormat = 'group_knockout' | 'knockout_single' | 'knockout_double' | 'knockout_black';

export type KnockoutRoundType =
  | 'roundOf64'
  | 'roundOf32'
  | 'roundOf16'
  | 'quarter'
  | 'semi'
  | 'thirdPlace'
  | 'final'
  | 'grandFinal'
  | 'grandFinalReset';

export interface Player {
  id: string;
  name: string;
  team?: string;
  color?: string;
  avatarUrl?: string;
}

export interface Group {
  id: string;
  name: string; // e.g. "گروه A"
  code: string; // "A", "B", etc.
  playerIds: string[];
  advanceCount?: number; // تعداد صعودی اختصاصی این گروه به مرحله حذفی
}

export interface MatchGame {
  gameNumber: number; // 1, 2, 3
  homeScore: number | null;
  awayScore: number | null;
  winnerId: string | null;
  isFinished: boolean;
  extraTime?: boolean;
}

export interface Match {
  id: string;
  stage: 'group' | 'knockout';
  groupId?: string;
  roundIndex?: number; // 1, 2, 3...
  roundLabel?: string; // "هفته ۱" یا "مرحله ۱ (یک‌هشتم)"
  knockoutRound?: KnockoutRoundType;
  knockoutRoundLabel?: string; // "یک‌هشتم نهایی", "یک‌چهارم نهایی", "نیمه‌نهایی", "رده‌بندی", "فینال"
  knockoutMatchIndex?: number;
  nextMatchId?: string;
  nextMatchSlot?: 'home' | 'away';
  nextLoserMatchId?: string; // for semi-final loser going to thirdPlace or losers bracket
  nextLoserMatchSlot?: 'home' | 'away';
  homeSeedLabel?: string; // e.g. "تیم اول گروه A"
  awaySeedLabel?: string; // e.g. "تیم دوم گروه B"
  homePlayerId: string | null;
  awayPlayerId: string | null;
  homeScore: number | null;
  awayScore: number | null;
  isFinished: boolean;
  hasPenalties?: boolean;
  homePenaltyScore?: number | null;
  awayPenaltyScore?: number | null;
  winnerId?: string | null;
  loserId?: string | null;
  updatedAt?: number;

  // Bo3 & Knockout Tournaments support
  isBo3?: boolean;
  games?: MatchGame[];
  homeGamesWon?: number; // 0, 1, 2
  awayGamesWon?: number; // 0, 1, 2
  bracketType?: 'single' | 'winners' | 'losers' | 'grand_final' | 'grand_final_reset';
  isBye?: boolean;
  homeSourceMatchId?: string;
  awaySourceMatchId?: string;
  homeLoserSourceMatchId?: string;
  awayLoserSourceMatchId?: string;
}

export interface GroupStanding {
  playerId: string;
  playerName: string;
  playerTeam?: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
  rank: number;
}

export type GameType = 'pes' | 'billiards';

export type BilliardsFormat = 'single' | 'bo3' | 'bo5';

export interface TournamentState {
  id: string;
  title: string;
  gameType?: GameType;
  billiardsFormat?: BilliardsFormat;
  tournamentFormat?: TournamentFormat; // 'group_knockout' | 'knockout_single' | 'knockout_double'
  numberOfGroups: number; // 2, 3, 4, 8 (used for group_knockout)
  targetPlayerCount?: number; // 2, 4, 8, 16, 32, 64 (used for knockout)
  status: TournamentStage;
  players: Player[];
  groups: Group[];
  matches: Match[];
  hasThirdPlaceMatch: boolean;
  championId: string | null;
  runnerUpId: string | null;
  thirdPlaceId: string | null;
  soundEnabled: boolean;
  createdAt: number;
  updatedAt: number;
  hostLogo: string | null;
  advancementRule?: 'bestThirds' | 'proportional' | 'manual' | null;
  groupAdvanceSettings?: Record<string, number>; // تنظیمات سهمیه صعود هر گروه (کلید: کد گروه مانند A, B, ...)
  currentKnockoutRoundIndex?: number;
  totalKnockoutRounds?: number;
  byePlayerIds?: string[];
  knockoutPoolPlayerIds?: string[];
  blackModeSubsequentFormat?: 'single' | 'bo3';
}
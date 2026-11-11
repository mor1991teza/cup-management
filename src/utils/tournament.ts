import {
  Group,
  GroupStanding,
  KnockoutRoundType,
  Match,
  MatchGame,
  Player,
  TournamentFormat,
  TournamentState,
} from '../types/tournament';

export const GROUP_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

// Persian labels for knockout stages
export const KNOCKOUT_ROUND_LABELS: Record<KnockoutRoundType, string> = {
  roundOf64: 'مرحله ۱/۳۲ نهایی (۶۴ تیم - ۳۲ مسابقه)',
  roundOf32: 'مرحله ۱/۱۶ نهایی (۳۲ تیم - ۱۶ مسابقه)',
  roundOf16: 'یک‌هشتم نهایی (۱۶ تیم - ۸ مسابقه)',
  quarter: 'یک‌چهارم نهایی (۸ تیم - ۴ مسابقه)',
  semi: 'نیمه‌نهایی (۴ تیم - ۲ مسابقه)',
  thirdPlace: 'رده‌بندی (مقام سوم)',
  final: 'فینال قهرمانی (۲ تیم - ۱ مسابقه)',
  grandFinal: 'فینال کل (Grand Final)',
  grandFinalReset: 'فینال نهایی دوم (Reset Match)',
  tiebreaker: 'مسابقه پلی‌آف تساوی‌شکنی',
};

// Preset PES 2021 Star Players for quick testing (up to 64 players)
export const PRESET_PLAYERS: Array<{ name: string; team: string; color: string }> = [
  { name: 'علی', team: 'بارسلونا (مسی)', color: '#004d98' },
  { name: 'رضا', team: 'یوونتوس (رونالدو)', color: '#2b2b2b' },
  { name: 'مهدی', team: 'بایرن مونیخ (لواندوفسکی)', color: '#dc052d' },
  { name: 'امیرحسین', team: 'پاری سن ژرمن (امباپه)', color: '#004170' },
  { name: 'سجاد', team: 'منچستر سیتی (دی‌بروینه)', color: '#6cabdd' },
  { name: 'محمد', team: 'رئال مادرید (بنزما)', color: '#1e3a8a' },
  { name: 'پوریا', team: 'لیورپول (صلاح)', color: '#c8102e' },
  { name: 'حسین', team: 'دورتموند (هالند)', color: '#fde100' },
  { name: 'فرزاد', team: 'منچستر یونایتد (برونو)', color: '#da291c' },
  { name: 'آرش', team: 'چلسی (کانته)', color: '#034694' },
  { name: 'سینا', team: 'اینتر میلان (لوکاکو)', color: '#001489' },
  { name: 'نوید', team: 'میلان (ایبراهیموویچ)', color: '#fb090b' },
  { name: 'عرفان', team: 'اتلتیکو مادرید (سوئارز)', color: '#cb3524' },
  { name: 'دانیال', team: 'آرسنال (اوبامیانگ)', color: '#ef0107' },
  { name: 'کیان', team: 'تاتنهام (سون هیونگ مین)', color: '#132257' },
  { name: 'سامان', team: 'آژاکس (تادیچ)', color: '#d2122e' },
  { name: 'هاتف', team: 'آ اس رم (مخیتاریان)', color: '#8e1f2f' },
  { name: 'مهیار', team: 'پورتو (طارمی)', color: '#002f6c' },
  { name: 'امید', team: 'سویا (راکتیچ)', color: '#ffffff' },
  { name: 'کسری', team: 'لاتزیو (ایموبیله)', color: '#87d8f7' },
  { name: 'مرتضی', team: 'لیون (دپای)', color: '#002f6c' },
  { name: 'نیما', team: 'ناپولی (اینسینیه)', color: '#0080ff' },
  { name: 'اشکان', team: 'لورکوزن (ویرتز)', color: '#e32219' },
  { name: 'بهرام', team: 'لایپزیگ (انکونکو)', color: '#e4002b' },
  { name: 'شایان', team: 'آتالانتا (زاپاتا)', color: '#1f439c' },
  { name: 'میلاد', team: 'بنفیکا (نونو مندز)', color: '#e4002b' },
  { name: 'پیمان', team: 'اسپورتینگ (کواتس)', color: '#008040' },
  { name: 'کامران', team: 'موناکو (بن یدر)', color: '#e4002b' },
  { name: 'بهزاد', team: 'والنسیا (سولر)', color: '#f77f00' },
  { name: 'سعید', team: 'ویارئال (جرارد مورنو)', color: '#f7d000' },
  { name: 'سهراب', team: 'شاختار (مارلوس)', color: '#f95700' },
  { name: 'کیومرث', team: 'زنیت (آزمون)', color: '#00a3e0' },
  { name: 'آبتین', team: 'رئال سوسیداد (اویارزابال)', color: '#0047ab' },
  { name: 'پارسا', team: 'وولوز (خیمنز)', color: '#fdb913' },
  { name: 'بردیا', team: 'لستر سیتی (واردی)', color: '#0053a0' },
  { name: 'مانی', team: 'وستهم (آنتونیو)', color: '#7a263a' },
  { name: 'امیررضا', team: 'اودینزه (دی پائول)', color: '#2b2b2b' },
  { name: 'آرین', team: 'گوانگژو (پائولینیو)', color: '#dc052d' },
  { name: 'فرهاد', team: 'الهلال (گومیس)', color: '#004d98' },
  { name: 'بابک', team: 'الدحیل (المعز علی)', color: '#b91c1c' },
  { name: 'رامین', team: 'السد (کازورلا)', color: '#1e293b' },
  { name: 'فریبرز', team: 'فاینورد (برگویس)', color: '#dc2626' },
  { name: 'شاهین', team: 'پی اس وی (مالن)', color: '#ef4444' },
  { name: 'کیارش', team: 'رنجرز (تاورنیر)', color: '#2563eb' },
  { name: 'شهرام', team: 'سلتیک (ادوارد)', color: '#15803d' },
  { name: 'شهروز', team: 'فنرباغچه (اوزیل)', color: '#1e3a8a' },
  { name: 'یاشار', team: 'گالاتاسرای (فالکائو)', color: '#ea580c' },
  { name: 'وحید', team: 'بشیکتاش (آبوباکار)', color: '#0f172a' },
  { name: 'مازیار', team: 'الغرافه (دیاباته)', color: '#ca8a04' },
  { name: 'افشین', team: 'الشباب (بائنگا)', color: '#1e293b' },
  { name: 'حمید', team: 'شارلوا (قلی‌زاده)', color: '#0f172a' },
  { name: 'آرمین', team: 'اوستنده (رضاییان)', color: '#dc2626' },
  { name: 'مسعود', team: 'کلوب بروژ (فاناکن)', color: '#1d4ed8' },
  { name: 'مهران', team: 'ختافه (کوکوریا)', color: '#1e40af' },
  { name: 'پدرام', team: 'سلتاویگو (آسپاس)', color: '#38bdf8' },
  { name: 'بهنام', team: 'بتیس (فکیر)', color: '#15803d' },
  { name: 'سیاوش', team: 'فیورنتینا (ولاهوویچ)', color: '#7c3aed' },
  { name: 'داریوش', team: 'ساسولو (براردی)', color: '#16a34a' },
  { name: 'کوروش', team: 'سمپدوریا (کواگلیارلا)', color: '#2563eb' },
  { name: 'سروش', team: 'جنوا (پاندف)', color: '#991b1b' },
  { name: 'سپهر', team: 'تورینو (بلوتی)', color: '#881337' },
  { name: 'شروین', team: 'ورونا (باراک)', color: '#1e3a8a' },
  { name: 'روژان', team: 'لیل (دیوید)', color: '#b91c1c' },
  { name: 'رها', team: 'رن (کاماوینگا)', color: '#b91c1c' },
];

/**
 * Fisher-Yates array shuffle
 */
export function shuffleArray<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

// اعداد استاندارد و مجاز برای مرحله حذفی (توان‌های ۲ بدون استراحت)
export const VALID_KNOCKOUT_COUNTS = [2, 4, 8, 16, 32, 64] as const;

export function isValidKnockoutCount(count: number): boolean {
  return VALID_KNOCKOUT_COUNTS.includes(count as any);
}

export function getNearestPowerOfTwoHint(count: number): string {
  if (count <= 2) return '2';
  if (count === 3) return '2 یا 4';
  if (count > 3 && count < 8) return '4 یا 8';
  if (count > 8 && count < 16) return '8 یا 16';
  if (count > 16 && count < 32) return '16 یا 32';
  if (count > 32 && count < 64) return '32 یا 64';
  return '64';
}

export function getKnockoutCountErrorMessage(count: number): string {
  return `مجموع نفرات صعود‌کننده از تمام گروه‌ها باید یکی از اعداد 2، 4، 8، 16، 32 یا 64 باشد. مجموع فعلی شما ${count} نفر است. لطفاً تنظیمات هر گروه را اصلاح کنید.`;
}

/**
 * Helper to retrieve normalized uniqueId for a player
 */
export function getPlayerUniqueId(player?: Player): string {
  if (!player) return '';
  if (player.uniqueId && player.uniqueId.trim()) {
    return player.uniqueId.trim().toLowerCase();
  }
  return player.name.trim().replace(/\s+/g, ' ').toLowerCase();
}

/**
 * Spreads players with matching uniqueIds evenly across array.
 */
export function spreadPlayersByUniqueId(players: Player[]): Player[] {
  if (players.length <= 1) return players;

  const map = new Map<string, Player[]>();
  for (const p of players) {
    const key = getPlayerUniqueId(p);
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(p);
  }

  // Shuffle buckets and items inside each bucket
  const buckets = shuffleArray(Array.from(map.values()).map((b) => shuffleArray(b)));

  const result: Player[] = [];
  let itemsRemaining = true;
  while (itemsRemaining) {
    itemsRemaining = false;
    for (const bucket of buckets) {
      if (bucket.length > 0) {
        result.push(bucket.pop()!);
        itemsRemaining = true;
      }
    }
  }

  return result;
}

/**
 * Swaps paired elements so no pair (items[2i], items[2i+1]) shares the same uniqueId.
 */
export function avoidSelfMatches<T>(
  items: T[],
  getIdFunc: (item: T) => string
): T[] {
  const result = [...items];
  const maxAttempts = 100;
  let attempt = 0;
  let hasSelfMatch = true;

  while (hasSelfMatch && attempt < maxAttempts) {
    hasSelfMatch = false;
    attempt++;

    for (let i = 0; i < result.length - 1; i += 2) {
      const u1 = getIdFunc(result[i]);
      const u2 = getIdFunc(result[i + 1]);

      if (u1 && u2 && u1 === u2) {
        hasSelfMatch = true;
        let swapped = false;

        for (let j = 0; j < result.length; j++) {
          if (j === i || j === i + 1) continue;

          const uJ = getIdFunc(result[j]);
          if (uJ && uJ !== u1) {
            const partnerJ = j % 2 === 0 ? j + 1 : j - 1;
            const uPartnerJ = partnerJ < result.length ? getIdFunc(result[partnerJ]) : '';

            if (!uPartnerJ || uPartnerJ !== u2) {
              const temp = result[i + 1];
              result[i + 1] = result[j];
              result[j] = temp;
              swapped = true;
              break;
            }
          }
        }

        if (!swapped) {
          for (let j = 0; j < result.length; j++) {
            if (j === i || j === i + 1) continue;
            const uJ = getIdFunc(result[j]);
            if (uJ && uJ !== u1) {
              const temp = result[i + 1];
              result[i + 1] = result[j];
              result[j] = temp;
              break;
            }
          }
        }
      }
    }
  }

  return result;
}

/**
 * Distribute players evenly into groups
 */
export function distributePlayers(
  players: Player[],
  numGroups: number,
  advanceSettings?: Record<string, number>
): { groups: Group[]; groupMatches: Match[] } {
  const spread = spreadPlayersByUniqueId(players);
  const groups: Group[] = [];

  for (let i = 0; i < numGroups; i++) {
    const code = GROUP_LETTERS[i] || `${i + 1}`;
    // سهمیه پیش‌فرض هر گروه (۲ نفر به صورت پیش‌فرض)
    const defaultAdvance = 2;
    const advanceCount = advanceSettings?.[code] ?? defaultAdvance;

    groups.push({
      id: `group-${code.toLowerCase()}`,
      name: numGroups === 1 ? 'جدول رده‌بندی لیگ' : `گروه ${code}`,
      code,
      playerIds: [],
      advanceCount,
    });
  }

  // Round-robin distribution
  spread.forEach((player, index) => {
    const groupIdx = index % numGroups;
    groups[groupIdx].playerIds.push(player.id);
  });

  // Generate round-robin matches for each group
  const groupMatches: Match[] = [];
  groups.forEach((group) => {
    const matches = generateGroupFixtures(group.id, group.playerIds);
    groupMatches.push(...matches);
  });

  return { groups, groupMatches };
}

/**
 * Generate round-robin fixtures using circle algorithm (Berger tables)
 */
export function generateGroupFixtures(groupId: string, playerIds: string[]): Match[] {
  const list = [...playerIds];
  // If odd count, add a dummy bye
  const hasBye = list.length % 2 !== 0;
  if (hasBye) {
    list.push('BYE');
  }

  const n = list.length;
  const rounds = n - 1;
  const matchesPerRound = n / 2;
  const matches: Match[] = [];

  for (let round = 0; round < rounds; round++) {
    const roundNumber = round + 1;
    for (let matchIdx = 0; matchIdx < matchesPerRound; matchIdx++) {
      const home = list[matchIdx];
      const away = list[n - 1 - matchIdx];

      // Exclude matches involving the dummy bye
      if (home !== 'BYE' && away !== 'BYE') {
        matches.push({
          id: `match-grp-${groupId}-r${roundNumber}-m${matchIdx}`,
          stage: 'group',
          groupId,
          roundIndex: roundNumber,
          roundLabel: `هفته ${roundNumber}`,
          homePlayerId: round % 2 === 1 ? away : home,
          awayPlayerId: round % 2 === 1 ? home : away,
          homeScore: null,
          awayScore: null,
          isFinished: false,
        });
      }
    }

    // Rotate array, keeping first item fixed
    const fixed = list[0];
    const rest = list.slice(1);
    const last = rest.pop()!;
    rest.unshift(last);
    list.splice(0, list.length, fixed, ...rest);
  }

  return matches;
}

/**
 * Compute standings for a specific group
 */
export function calculateGroupStandings(
  groupId: string,
  playerIds: string[],
  allMatches: Match[],
  playersMap: Map<string, Player>
): GroupStanding[] {
  const groupMatches = allMatches.filter(
    (m) => m.stage === 'group' && m.groupId === groupId && m.isFinished
  );

  const standingsMap = new Map<string, GroupStanding>();

  playerIds.forEach((pid) => {
    const p = playersMap.get(pid);
    standingsMap.set(pid, {
      playerId: pid,
      playerName: p ? p.name : 'بازیکن',
      playerTeam: p?.team,
      played: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      goalDifference: 0,
      points: 0,
      rank: 1,
    });
  });

  groupMatches.forEach((m) => {
    if (m.homeScore === null || m.awayScore === null || !m.homePlayerId || !m.awayPlayerId) return;

    const home = standingsMap.get(m.homePlayerId);
    const away = standingsMap.get(m.awayPlayerId);
    if (!home || !away) return;

    home.played += 1;
    away.played += 1;
    home.goalsFor += m.homeScore;
    home.goalsAgainst += m.awayScore;
    away.goalsFor += m.awayScore;
    away.goalsAgainst += m.homeScore;

    if (m.homeScore > m.awayScore) {
      home.won += 1;
      home.points += 3;
      away.lost += 1;
    } else if (m.homeScore < m.awayScore) {
      away.won += 1;
      away.points += 3;
      home.lost += 1;
    } else {
      home.drawn += 1;
      away.drawn += 1;
      home.points += 1;
      away.points += 1;
    }
  });

  // Calculate GD and sort
  const standings = Array.from(standingsMap.values()).map((s) => ({
    ...s,
    goalDifference: s.goalsFor - s.goalsAgainst,
  }));

  // Tiebreaker: Points -> GD -> Goals For -> Head to Head
  standings.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
    if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;

    // Head-to-Head lookup
    const directMatch = groupMatches.find(
      (m) =>
        (m.homePlayerId === a.playerId && m.awayPlayerId === b.playerId) ||
        (m.homePlayerId === b.playerId && m.awayPlayerId === a.playerId)
    );
    if (directMatch && directMatch.homeScore !== null && directMatch.awayScore !== null) {
      const aScore = directMatch.homePlayerId === a.playerId ? directMatch.homeScore : directMatch.awayScore;
      const bScore = directMatch.homePlayerId === b.playerId ? directMatch.homeScore : directMatch.awayScore;
      if (bScore !== aScore) return bScore - aScore;
    }

    return a.playerName.localeCompare(b.playerName, 'fa');
  });

  // Assign ranks
  standings.forEach((s, idx) => {
    s.rank = idx + 1;
  });

  return standings;
}

/**
 * Generate Knockout Stage Bracket based on group standings
 */
export function generateKnockoutStage(
  groups: Group[],
  standingsMap: Record<string, GroupStanding[]>,
  hasThirdPlaceMatch: boolean = true,
  advancementRule: 'bestThirds' | 'proportional' | 'manual' | null = 'bestThirds'
): Match[] {
  // ۱. جمع‌آوری بازیکنان صعودکننده بر اساس سهمیه اختصاصی هر گروه (advanceCount)
  interface AdvancingSeed {
    playerId: string | null;
    seedLabel: string;
    groupCode: string;
    rank: number;
  }

  const advancingSeeds: AdvancingSeed[] = [];

  if (groups.length === 3 && advancementRule === 'bestThirds') {
    // در حالت ۳ گروه با قانون برترین‌های سوم (حالت ۱): صعود ۲ تیم اول هر گروه + ۲ تیم برتر سوم = ۸ نفر
    const getQualified = (code: string) => {
      const group = groups.find((g) => g.code === code);
      if (!group) return { first: null, second: null, third: null };
      const list = standingsMap[group.id] || [];
      return {
        first: list[0]?.playerId || null,
        second: list[1]?.playerId || null,
        third: list[2]?.playerId || null,
      };
    };
    const grpA = getQualified('A');
    const grpB = getQualified('B');
    const grpC = getQualified('C');
    advancingSeeds.push({ playerId: grpA.first, seedLabel: 'اول گروه A', groupCode: 'A', rank: 1 });
    advancingSeeds.push({ playerId: grpB.first, seedLabel: 'اول گروه B', groupCode: 'B', rank: 1 });
    advancingSeeds.push({ playerId: grpC.first, seedLabel: 'اول گروه C', groupCode: 'C', rank: 1 });
    advancingSeeds.push({ playerId: grpA.second, seedLabel: 'دوم گروه A', groupCode: 'A', rank: 2 });
    advancingSeeds.push({ playerId: grpB.second, seedLabel: 'دوم گروه B', groupCode: 'B', rank: 2 });
    advancingSeeds.push({ playerId: grpC.second, seedLabel: 'دوم گروه C', groupCode: 'C', rank: 2 });

    const thirdPlaceList: Array<{ groupCode: string; playerId: string | null; standing?: GroupStanding }> = [];
    ['A', 'B', 'C'].forEach((code) => {
      const grp = groups.find((g) => g.code === code);
      if (!grp) return;
      const list = standingsMap[grp.id] || [];
      if (list.length >= 3 && list[2]) {
        thirdPlaceList.push({ groupCode: code, playerId: list[2].playerId, standing: list[2] });
      }
    });
    thirdPlaceList.sort((a, b) => {
      if (!a.standing || !b.standing) return 0;
      if (b.standing.points !== a.standing.points) return b.standing.points - a.standing.points;
      if (b.standing.goalDifference !== a.standing.goalDifference) return b.standing.goalDifference - a.standing.goalDifference;
      if (b.standing.goalsFor !== a.standing.goalsFor) return b.standing.goalsFor - a.standing.goalsFor;
      return a.standing.playerName.localeCompare(b.standing.playerName, 'fa');
    });
    if (thirdPlaceList[0]) advancingSeeds.push({ playerId: thirdPlaceList[0].playerId, seedLabel: `تیم ۳م برتر (${thirdPlaceList[0].groupCode})`, groupCode: thirdPlaceList[0].groupCode, rank: 3 });
    if (thirdPlaceList[1]) advancingSeeds.push({ playerId: thirdPlaceList[1].playerId, seedLabel: `تیم ۳م دوم (${thirdPlaceList[1].groupCode})`, groupCode: thirdPlaceList[1].groupCode, rank: 3 });
  } else {
    // جمع‌آوری دقیق بر اساس سهمیه تعیین‌شده هر گروه (g.advanceCount)
    groups.forEach((g) => {
      const count = typeof g.advanceCount === 'number' ? g.advanceCount : 2;
      const list = standingsMap[g.id] || [];
      for (let r = 0; r < count; r++) {
        const st = list[r];
        const rankName = r === 0 ? 'اول' : r === 1 ? 'دوم' : r === 2 ? 'سوم' : `رتبه ${r + 1}`;
        advancingSeeds.push({
          playerId: st?.playerId || null,
          seedLabel: `تیم ${rankName} گروه ${g.code}`,
          groupCode: g.code,
          rank: r + 1,
        });
      }
    });
  }

  const totalAdvancing = advancingSeeds.length;
  // اعتبارسنجی توان ۲ بودن تعداد کل صعودی‌ها: ۲، ۴، ۸، ۱۶، ۳۲ یا ۶۴
  if (!isValidKnockoutCount(totalAdvancing)) {
    return [];
  }

  // ۲. جفت‌سازی بازیکنان در راند اول بدون استراحت (BYE) و حتی‌الامکان جلوگیری از رویارویی هم‌گروهی‌ها در دور اول
  const half = totalAdvancing / 2;
  const sortedSeeds = [...advancingSeeds].sort((a, b) => a.rank - b.rank);
  const pot1 = sortedSeeds.slice(0, half);
  const pot2 = sortedSeeds.slice(half);

  const availablePot2 = [...pot2];
  const pairedPot2: AdvancingSeed[] = [];
  for (let i = 0; i < pot1.length; i++) {
    const p1 = pot1[i];
    let candidateIdx = availablePot2.findIndex((p2) => p2.groupCode !== p1.groupCode);
    if (candidateIdx === -1) candidateIdx = 0;
    pairedPot2.push(availablePot2.splice(candidateIdx, 1)[0]);
  }

  // ۳. ایجاد ساختار کامل درختی براکت حذفی
  const ROUND_TYPES: { count: number; type: KnockoutRoundType; label: string; prefix: string }[] = [
    { count: 64, type: 'roundOf64', label: KNOCKOUT_ROUND_LABELS.roundOf64, prefix: 'r64' },
    { count: 32, type: 'roundOf32', label: KNOCKOUT_ROUND_LABELS.roundOf32, prefix: 'r32' },
    { count: 16, type: 'roundOf16', label: KNOCKOUT_ROUND_LABELS.roundOf16, prefix: 'r16' },
    { count: 8, type: 'quarter', label: KNOCKOUT_ROUND_LABELS.quarter, prefix: 'qf' },
    { count: 4, type: 'semi', label: KNOCKOUT_ROUND_LABELS.semi, prefix: 'semi' },
    { count: 2, type: 'final', label: KNOCKOUT_ROUND_LABELS.final, prefix: 'final' },
  ];

  const startIndex = ROUND_TYPES.findIndex((r) => r.count === totalAdvancing);
  const activeRounds = ROUND_TYPES.slice(startIndex);

  const knockoutMatches: Match[] = [];

  activeRounds.forEach((roundInfo, rIdx) => {
    const isFirstRound = rIdx === 0;
    const isFinalRound = rIdx === activeRounds.length - 1;
    const isSemiRound = roundInfo.type === 'semi';
    const matchesInThisRound = roundInfo.count / 2;
    const nextRoundInfo = !isFinalRound ? activeRounds[rIdx + 1] : null;

    for (let mIdx = 0; mIdx < matchesInThisRound; mIdx++) {
      const matchNumber = mIdx + 1;
      const matchId = isFinalRound
        ? 'ko-final'
        : `ko-${roundInfo.prefix}-${matchNumber}`;

      let nextMatchId: string | undefined = undefined;
      let nextMatchSlot: 'home' | 'away' | undefined = undefined;
      let nextLoserMatchId: string | undefined = undefined;
      let nextLoserMatchSlot: 'home' | 'away' | undefined = undefined;

      if (!isFinalRound && nextRoundInfo) {
        const nextMatchNum = Math.floor(mIdx / 2) + 1;
        nextMatchId = nextRoundInfo.type === 'final'
          ? 'ko-final'
          : `ko-${nextRoundInfo.prefix}-${nextMatchNum}`;
        nextMatchSlot = mIdx % 2 === 0 ? 'home' : 'away';
      }

      if (isSemiRound && hasThirdPlaceMatch) {
        nextLoserMatchId = 'ko-third';
        nextLoserMatchSlot = mIdx === 0 ? 'home' : 'away';
      }

      let homePlayerId: string | null = null;
      let awayPlayerId: string | null = null;
      let homeSeedLabel = 'TBD';
      let awaySeedLabel = 'TBD';

      if (isFirstRound) {
        homePlayerId = pot1[mIdx]?.playerId || null;
        awayPlayerId = pairedPot2[mIdx]?.playerId || null;
        homeSeedLabel = pot1[mIdx]?.seedLabel || 'TBD';
        awaySeedLabel = pairedPot2[mIdx]?.seedLabel || 'TBD';
      } else {
        const prevRound = activeRounds[rIdx - 1];
        const prevMatch1 = mIdx * 2 + 1;
        const prevMatch2 = mIdx * 2 + 2;
        homeSeedLabel = `برنده بازی ${prevMatch1} (${prevRound.label.split(' ')[0]})`;
        awaySeedLabel = `برنده بازی ${prevMatch2} (${prevRound.label.split(' ')[0]})`;
      }

      knockoutMatches.push({
        id: matchId,
        stage: 'knockout',
        roundIndex: rIdx + 1,
        knockoutRound: roundInfo.type,
        knockoutRoundLabel: roundInfo.label,
        knockoutMatchIndex: matchNumber,
        homeSeedLabel,
        awaySeedLabel,
        homePlayerId,
        awayPlayerId,
        homeScore: null,
        awayScore: null,
        isFinished: false,
        nextMatchId,
        nextMatchSlot,
        nextLoserMatchId,
        nextLoserMatchSlot,
      });
    }
  });

  // مسابقه رده‌بندی (مقام سوم) در صورت فعال بودن
  if (hasThirdPlaceMatch && totalAdvancing >= 4) {
    knockoutMatches.push({
      id: 'ko-third',
      stage: 'knockout',
      roundIndex: activeRounds.length,
      knockoutRound: 'thirdPlace',
      knockoutRoundLabel: KNOCKOUT_ROUND_LABELS.thirdPlace,
      knockoutMatchIndex: 1,
      homeSeedLabel: 'بازنده نیمه‌نهایی ۱',
      awaySeedLabel: 'بازنده نیمه‌نهایی ۲',
      homePlayerId: null,
      awayPlayerId: null,
      homeScore: null,
      awayScore: null,
      isFinished: false,
    });
  }

  return knockoutMatches;
}

/**
 * Update next bracket matches when a knockout match finishes or changes
 */
export function propagateKnockoutResult(
  matches: Match[],
  matchId: string,
  winnerId: string | null,
  loserId: string | null
): Match[] {
  const currentMatch = matches.find((m) => m.id === matchId);
  if (!currentMatch) return matches;

  return matches.map((m) => {
    let updated = { ...m };

    // Winner propagation
    if (currentMatch.nextMatchId && m.id === currentMatch.nextMatchId) {
      if (currentMatch.nextMatchSlot === 'home') {
        updated = { ...updated, homePlayerId: winnerId };
      } else if (currentMatch.nextMatchSlot === 'away') {
        updated = { ...updated, awayPlayerId: winnerId };
      }
    }

    // Loser propagation (e.g. for third-place match from semi-finals)
    if (currentMatch.nextLoserMatchId && m.id === currentMatch.nextLoserMatchId) {
      if (currentMatch.nextLoserMatchSlot === 'home') {
        updated = { ...updated, homePlayerId: loserId };
      } else if (currentMatch.nextLoserMatchSlot === 'away') {
        updated = { ...updated, awayPlayerId: loserId };
      }
    }

    return updated;
  });
}

/**
 * Synchronize downstream knockout matches when a match result is edited or reset.
 * Automatically updates advancing players in next rounds and cascades if necessary.
 */
export function syncDownstreamKnockoutMatches(
  matches: Match[],
  updatedMatch: Match,
  oldWinnerId: string | null,
  oldLoserId: string | null
): Match[] {
  const newWinnerId = updatedMatch.winnerId || null;
  const newLoserId = updatedMatch.loserId || (
    newWinnerId && updatedMatch.homePlayerId && updatedMatch.awayPlayerId
      ? (newWinnerId === updatedMatch.homePlayerId ? updatedMatch.awayPlayerId : updatedMatch.homePlayerId)
      : null
  );

  // If winner and loser haven't changed, no downstream sync is needed
  if (oldWinnerId === newWinnerId && oldLoserId === newLoserId) {
    return matches;
  }

  const updatedRoundIndex = updatedMatch.roundIndex || 1;
  const matchId = updatedMatch.id;

  let currentMatches = [...matches];

  const processChange = (
    mId: string,
    rIndex: number,
    prevWinner: string | null,
    nextWinner: string | null,
    prevLoser: string | null,
    nextLoser: string | null
  ) => {
    for (let i = 0; i < currentMatches.length; i++) {
      const target = currentMatches[i];
      if (target.stage !== 'knockout' || (target.roundIndex || 1) <= rIndex) {
        continue;
      }

      let homeChanged = false;
      let awayChanged = false;
      let newHomeId = target.homePlayerId;
      let newAwayId = target.awayPlayerId;

      // 1. Direct connection via homeSourceMatchId / awaySourceMatchId
      if (target.homeSourceMatchId === mId) {
        if (newHomeId !== nextWinner) {
          newHomeId = nextWinner;
          homeChanged = true;
        }
      } else if (prevWinner && target.homePlayerId === prevWinner) {
        if (target.bracketType !== 'losers' || (!target.homeSourceMatchId && !target.homeLoserSourceMatchId)) {
          newHomeId = nextWinner;
          homeChanged = true;
        }
      }

      if (target.awaySourceMatchId === mId) {
        if (newAwayId !== nextWinner) {
          newAwayId = nextWinner;
          awayChanged = true;
        }
      } else if (prevWinner && target.awayPlayerId === prevWinner) {
        if (target.bracketType !== 'losers' || (!target.awaySourceMatchId && !target.awayLoserSourceMatchId)) {
          newAwayId = nextWinner;
          awayChanged = true;
        }
      }

      // 2. Direct connection via Loser Source Match Id (Losers bracket or third-place match)
      if (target.homeLoserSourceMatchId === mId) {
        if (newHomeId !== nextLoser) {
          newHomeId = nextLoser;
          homeChanged = true;
        }
      } else if (prevLoser && target.homePlayerId === prevLoser && (target.bracketType === 'losers' || target.knockoutRound === 'thirdPlace')) {
        newHomeId = nextLoser;
        homeChanged = true;
      }

      if (target.awayLoserSourceMatchId === mId) {
        if (newAwayId !== nextLoser) {
          newAwayId = nextLoser;
          awayChanged = true;
        }
      } else if (prevLoser && target.awayPlayerId === prevLoser && (target.bracketType === 'losers' || target.knockoutRound === 'thirdPlace')) {
        newAwayId = nextLoser;
        awayChanged = true;
      }

      // 3. Legacy nextMatchId / nextLoserMatchId links
      if (target.id === updatedMatch.nextMatchId) {
        if (updatedMatch.nextMatchSlot === 'home' && newHomeId !== nextWinner) {
          newHomeId = nextWinner;
          homeChanged = true;
        } else if (updatedMatch.nextMatchSlot === 'away' && newAwayId !== nextWinner) {
          newAwayId = nextWinner;
          awayChanged = true;
        }
      }
      if (target.id === updatedMatch.nextLoserMatchId) {
        if (updatedMatch.nextLoserMatchSlot === 'home' && newHomeId !== nextLoser) {
          newHomeId = nextLoser;
          homeChanged = true;
        } else if (updatedMatch.nextLoserMatchSlot === 'away' && newAwayId !== nextLoser) {
          newAwayId = nextLoser;
          awayChanged = true;
        }
      }

      if (homeChanged || awayChanged) {
        const wasFinished = target.isFinished;
        const targetOldWinner = target.winnerId || null;
        const targetOldLoser = target.loserId || null;

        const resetTarget: Match = {
          ...target,
          homePlayerId: newHomeId,
          awayPlayerId: newAwayId,
          homeScore: target.isBo3 ? 0 : null,
          awayScore: target.isBo3 ? 0 : null,
          homeGamesWon: target.isBo3 ? 0 : undefined,
          awayGamesWon: target.isBo3 ? 0 : undefined,
          games: target.isBo3 ? [] : undefined,
          isFinished: false,
          winnerId: null,
          loserId: null,
          hasPenalties: false,
          homePenaltyScore: null,
          awayPenaltyScore: null,
          updatedAt: Date.now(),
        };

        currentMatches[i] = resetTarget;

        // Cascade downstream if target was finished
        if (wasFinished && (targetOldWinner || targetOldLoser)) {
          processChange(
            target.id,
            target.roundIndex || 1,
            targetOldWinner,
            null,
            targetOldLoser,
            null
          );
        }
      }
    }
  };

  processChange(
    matchId,
    updatedRoundIndex,
    oldWinnerId,
    newWinnerId,
    oldLoserId,
    newLoserId
  );

  return currentMatches;
}

/**
 * Synchronize initial unplayed knockout match participants if group matches are edited
 */
export function syncKnockoutSeedsFromStandings(
  knockoutMatches: Match[],
  groups: Group[],
  standingsMap: Record<string, GroupStanding[]>,
  advancementRule: 'bestThirds' | 'proportional' | 'manual' | null = 'bestThirds'
): Match[] {
  const getQualified = (code: string) => {
    const group = groups.find((g) => g.code === code);
    if (!group) return { first: null, second: null, third: null };
    const list = standingsMap[group.id] || [];
    return {
      first: list[0]?.playerId || null,
      second: list[1]?.playerId || null,
      third: list[2]?.playerId || null,
    };
  };

  // محاسبه نفرات برتر برای ۳ گروه
  let best3rd_1: { playerId: string | null; groupCode: string } | null = null;
  let best3rd_2: { playerId: string | null; groupCode: string } | null = null;
  let proportionalSeeds: { playerId: string | null; seedLabel: string }[] = [];

  if (groups.length === 3) {
    if (advancementRule === 'bestThirds') {
      const thirdPlaceList: Array<{ groupCode: string; playerId: string | null; standing?: GroupStanding }> = [];
      groups.forEach((grp) => {
        const list = standingsMap[grp.id] || [];
        if (list.length >= 3 && list[2]) {
          thirdPlaceList.push({ groupCode: grp.code, playerId: list[2].playerId, standing: list[2] });
        }
      });

      thirdPlaceList.sort((a, b) => {
        if (!a.standing || !b.standing) return 0;
        if (b.standing.points !== a.standing.points) return b.standing.points - a.standing.points;
        if (b.standing.goalDifference !== a.standing.goalDifference) return b.standing.goalDifference - a.standing.goalDifference;
        if (b.standing.goalsFor !== a.standing.goalsFor) return b.standing.goalsFor - a.standing.goalsFor;
        return a.standing.playerName.localeCompare(b.standing.playerName, 'fa');
      });

      if (thirdPlaceList[0]) best3rd_1 = { playerId: thirdPlaceList[0].playerId, groupCode: thirdPlaceList[0].groupCode };
      if (thirdPlaceList[1]) best3rd_2 = { playerId: thirdPlaceList[1].playerId, groupCode: thirdPlaceList[1].groupCode };
    } else if (advancementRule === 'proportional') {
      groups.forEach((g) => {
        const list = standingsMap[g.id] || [];
        const playerCount = g.playerIds.length;
        const advanceCount = playerCount >= 5 ? 3 : 2;

        for (let i = 0; i < advanceCount; i++) {
          if (list[i]) {
            proportionalSeeds.push({ 
              playerId: list[i].playerId, 
              seedLabel: `نفر ${i + 1} گروه ${g.code}` 
            });
          }
        }
      });
    }
  }

  return knockoutMatches.map((m) => {
    // Only update if match has not been played yet
    if (m.isFinished) return m;

    let updated = { ...m };

    // Check home seed label
    if (m.homeSeedLabel) {
      const match1 = m.homeSeedLabel.match(/اول گروه ([A-H])/);
      const match2 = m.homeSeedLabel.match(/دوم گروه ([A-H])/);
      const match3 = m.homeSeedLabel.match(/نفر (\d) گروه ([A-H])/);
      
      if (match1) {
        const q = getQualified(match1[1]);
        updated.homePlayerId = q.first;
      } else if (match2) {
        const q = getQualified(match2[1]);
        updated.homePlayerId = q.second;
      } else if (match3) {
        const q = getQualified(match3[2]);
        if (match3[1] === '3') updated.homePlayerId = q.third;
      }
    }

    // Check away seed label
    if (m.awaySeedLabel) {
      const match1 = m.awaySeedLabel.match(/اول گروه ([A-H])/);
      const match2 = m.awaySeedLabel.match(/دوم گروه ([A-H])/);
      const match3 = m.awaySeedLabel.match(/نفر (\d) گروه ([A-H])/);

      if (match1) {
        const q = getQualified(match1[1]);
        updated.awayPlayerId = q.first;
      } else if (match2) {
        const q = getQualified(match2[1]);
        updated.awayPlayerId = q.second;
      } else if (match3) {
        const q = getQualified(match3[2]);
        if (match3[1] === '3') updated.awayPlayerId = q.third;
      }
    }

    // برای ۳ گروه، اسلات‌های مخصوص را آپدیت کن
    if (groups.length === 3) {
      if (advancementRule === 'bestThirds') {
        if (m.id === 'ko-qf-2') {
          updated.homePlayerId = best3rd_1?.playerId || null;
          updated.homeSeedLabel = best3rd_1 ? `تیم ۳م برتر (${best3rd_1.groupCode})` : 'بهترین تیم سوم';
        } else if (m.id === 'ko-qf-4') {
          updated.awayPlayerId = best3rd_2?.playerId || null;
          updated.awaySeedLabel = best3rd_2 ? `تیم ۳م دوم (${best3rd_2.groupCode})` : 'دومین تیم سوم برتر';
        }
      } else if (advancementRule === 'proportional') {
        // برای حالت متناسب، چون اسلات‌ها بر اساس برچسب سید تعیین شده‌اند، نیازی به تغییر دستی نیست
        // مگر اینکه بخواهید ترتیب را تغییر دهید. کد بالا بر اساس برچسب کار می‌کند.
      }
    }

    return updated;
  });
}

/**
 * Mathematical helper: calculate powers of 2, BYE counts, and total rounds.
 * Anchors the progression to start from Round of 64 (1/32 نهایی - ۶۴ تیم - ۳۲ مسابقه)
 * whenever player count is 32 or more (or up to 64).
 */
export function calculateKnockoutTree(playerCount: number): {
  nextPowerOfTwo: number;
  numByes: number;
  totalRounds: number;
  matchesInRound1: number;
  playingCount: number;
} {
  const safeCount = Math.max(2, playerCount);

  // اگر تعداد بازیکنان ۳۲ یا بیشتر باشد، جدول از مرحله ۱/۳۲ نهایی (۶۴ تیم) آغاز می‌شود
  let nextPowerOfTwo = 64;
  if (safeCount > 64) {
    nextPowerOfTwo = Math.pow(2, Math.ceil(Math.log2(safeCount)));
  } else if (safeCount >= 32) {
    nextPowerOfTwo = 64;
  } else {
    nextPowerOfTwo = Math.pow(2, Math.ceil(Math.log2(safeCount)));
  }

  const totalRounds = Math.round(Math.log2(nextPowerOfTwo));
  let numByes = 0;
  let matchesInRound1 = nextPowerOfTwo / 2;
  let playingCount = safeCount;

  if (nextPowerOfTwo === 64 && safeCount < 64 && safeCount >= 32) {
    // برای صعود دقیقاً ۳۲ نفر به مرحله ۱/۱۶ نهایی:
    matchesInRound1 = safeCount - 32;
    playingCount = matchesInRound1 * 2;
    numByes = 64 - safeCount;
  } else {
    numByes = nextPowerOfTwo - safeCount;
    matchesInRound1 = (safeCount - numByes) / 2;
    playingCount = safeCount - numByes;
  }

  return { nextPowerOfTwo, numByes, totalRounds, matchesInRound1, playingCount };
}

/**
 * Returns descriptive Persian label for a knockout stage based on remaining teams
 */
export function getKnockoutRoundPersianLabel(teamsCount: number): string {
  if (teamsCount >= 64) return 'مرحله ۱/۳۲ نهایی (۶۴ تیم - ۳۲ مسابقه - صعود ۳۲ نفر)';
  if (teamsCount >= 32) return 'مرحله ۱/۱۶ نهایی (۳۲ تیم - ۱۶ مسابقه - صعود ۱۶ نفر)';
  if (teamsCount >= 16) return 'یک‌هشتم نهایی (۱۶ تیم - ۸ مسابقه - صعود ۸ نفر)';
  if (teamsCount >= 8) return 'یک‌چهارم نهایی (۸ تیم - ۴ مسابقه - صعود ۴ نفر)';
  if (teamsCount >= 4) return 'نیمه‌نهایی (۴ تیم - ۲ مسابقه - صعود ۲ نفر)';
  if (teamsCount === 2) return 'فینال قهرمانی (۲ تیم - ۱ مسابقه - ۱ قهرمان 🏆)';
  return 'مرحله حذفی';
}

/**
 * Generate Round 1 for Direct Knockout (Single or Double Elimination)
 * Shuffles all players with Fisher-Yates, allocates BYEs if not power of 2,
 * and creates initial matches.
 * - In Single Elimination (حذفی تک): isBo3 = false (تک بازی مستقیم - بدون Bo3؛ با اولین باخت بازیکن حذف می‌شود)
 * - In Double Elimination (حذفی دوگانه): isBo3 = true (Best of 3)
 */
export function generateDirectKnockoutInitialMatches(
  players: Player[],
  isDoubleElim: boolean = false
): {
  matches: Match[];
  byePlayerIds: string[];
  totalRounds: number;
} {
  const spread = spreadPlayersByUniqueId(players);
  const { nextPowerOfTwo, numByes, totalRounds, playingCount } = calculateKnockoutTree(players.length);

  // بازیکنانی که استراحت دور اول (BYE) می‌گیرند و مستقیم به دور ۲ می‌روند
  const byePlayerIds = spread.slice(0, numByes).map((p) => p.id);
  const playingPlayers = spread.slice(numByes, numByes + playingCount);

  // 🔴 جلوگیری از برخورد سهم‌های یک فرد با خودش در دور اول
  const adjustedPlayingPlayers = avoidSelfMatches(playingPlayers, (p) => getPlayerUniqueId(p));

  const round1Matches: Match[] = [];
  const roundLabel = getKnockoutRoundPersianLabel(nextPowerOfTwo);

  for (let i = 0; i < adjustedPlayingPlayers.length; i += 2) {
    const p1 = adjustedPlayingPlayers[i];
    const p2 = adjustedPlayingPlayers[i + 1];
    if (!p1 || !p2) break;
    const matchIndex = i / 2 + 1;

    round1Matches.push({
      id: `ko-r1-m${matchIndex}`,
      stage: 'knockout',
      roundIndex: 1,
      roundLabel: `مرحله ۱ (${roundLabel})`,
      knockoutRoundLabel: roundLabel,
      knockoutMatchIndex: matchIndex,
      homePlayerId: p1.id,
      awayPlayerId: p2.id,
      homeScore: isDoubleElim ? 0 : null,
      awayScore: isDoubleElim ? 0 : null,
      homeGamesWon: isDoubleElim ? 0 : undefined,
      awayGamesWon: isDoubleElim ? 0 : undefined,
      isFinished: false,
      isBo3: isDoubleElim, // 🔴 در حذفی تک Bo3 نیست
      games: isDoubleElim ? [] : undefined,
      bracketType: isDoubleElim ? 'winners' : 'single',
    });
  }

  return {
    matches: round1Matches,
    byePlayerIds,
    totalRounds,
  };
}

/**
 * Generate Next Knockout Round with Random Redraw (Fisher-Yates Shuffle)
 * When all matches of current round finish, pools the winners (and any BYEs),
 * randomly shuffles them, and creates matches for the next round.
 */
export function generateNextKnockoutRoundMatches(
  existingMatches: Match[],
  byePlayerIds: string[],
  currentRoundIndex: number,
  hasThirdPlaceMatch: boolean = true,
  isDoubleElim: boolean = false,
  forceBo3?: boolean,
  playersMap?: Map<string, Player>
): {
  newMatches: Match[];
  isFinal: boolean;
  championId: string | null;
  runnerUpId: string | null;
  thirdPlaceId: string | null;
} | null {
  const currentRoundMatches = existingMatches.filter(
    (m) =>
      m.stage === 'knockout' &&
      m.roundIndex === currentRoundIndex &&
      (!m.bracketType || m.bracketType === 'single' || m.bracketType === 'winners')
  );

  // Check if all matches in the current round are finished
  if (currentRoundMatches.length === 0) return null;
  const allFinished = currentRoundMatches.every((m) => m.isFinished && m.winnerId);
  if (!allFinished) return null;

  // Collect winners and their source match IDs
  const advancingPool: Array<{ playerId: string; sourceMatchId?: string }> = [];
  currentRoundMatches.forEach((m) => {
    if (m.winnerId) {
      advancingPool.push({ playerId: m.winnerId, sourceMatchId: m.id });
    }
  });

  // If this was round 1 and there were BYEs, combine them into the pool
  if (currentRoundIndex === 1 && byePlayerIds.length > 0) {
    byePlayerIds.forEach((bId) => {
      advancingPool.push({ playerId: bId, sourceMatchId: undefined });
    });
  }

  // If only 1 player remains, tournament is over
  if (advancingPool.length <= 1) {
    const finalMatch = currentRoundMatches.find(
      (m) => m.knockoutRound === 'final' || m.roundLabel?.includes('فینال')
    );
    const thirdMatch = existingMatches.find((m) => m.knockoutRound === 'thirdPlace');

    return {
      newMatches: [],
      isFinal: true,
      championId: finalMatch?.winnerId || advancingPool[0]?.playerId || null,
      runnerUpId:
        finalMatch?.loserId ||
        (finalMatch?.homePlayerId === finalMatch?.winnerId
          ? finalMatch?.awayPlayerId
          : finalMatch?.homePlayerId) ||
        null,
      thirdPlaceId: thirdMatch?.winnerId || null,
    };
  }

  // Shuffle the pool for pure random draw at each round!
  const shuffledPool = shuffleArray(advancingPool);

  // 🔴 جلوگیری از برخورد سهم‌های یک فرد با خودش در مراحل حذفی بعدی
  const adjustedPool = playersMap
    ? avoidSelfMatches(shuffledPool, (item) => getPlayerUniqueId(playersMap.get(item.playerId)))
    : shuffledPool;

  const nextRoundIndex = currentRoundIndex + 1;
  const newMatches: Match[] = [];
  const matchIsBo3 = forceBo3 !== undefined ? forceBo3 : isDoubleElim;

  if (adjustedPool.length === 2) {
    // FINAL MATCH!
    const roundLabel = 'فینال قهرمانی (۲ تیم - ۱ مسابقه - ۱ قهرمان 🏆)';
    newMatches.push({
      id: `ko-r${nextRoundIndex}-final`,
      stage: 'knockout',
      roundIndex: nextRoundIndex,
      roundLabel: 'فینال قهرمانی',
      knockoutRound: 'final',
      knockoutRoundLabel: roundLabel,
      knockoutMatchIndex: 1,
      homePlayerId: adjustedPool[0].playerId,
      awayPlayerId: adjustedPool[1].playerId,
      homeSourceMatchId: adjustedPool[0].sourceMatchId,
      awaySourceMatchId: adjustedPool[1].sourceMatchId,
      homeScore: matchIsBo3 ? 0 : null,
      awayScore: matchIsBo3 ? 0 : null,
      homeGamesWon: matchIsBo3 ? 0 : undefined,
      awayGamesWon: matchIsBo3 ? 0 : undefined,
      isFinished: false,
      isBo3: matchIsBo3,
      games: matchIsBo3 ? [] : undefined,
      bracketType: isDoubleElim ? 'grand_final' : 'single',
    });

    // Third place match from the semi-final losers if requested
    if (hasThirdPlaceMatch && currentRoundMatches.length === 2) {
      const losers = currentRoundMatches
        .map((m) => ({
          loserId: m.loserId || (m.homePlayerId === m.winnerId ? m.awayPlayerId : m.homePlayerId),
          sourceMatchId: m.id,
        }))
        .filter((l) => Boolean(l.loserId)) as Array<{ loserId: string; sourceMatchId: string }>;
      if (losers.length === 2) {
        newMatches.push({
          id: `ko-r${nextRoundIndex}-third`,
          stage: 'knockout',
          roundIndex: nextRoundIndex,
          roundLabel: 'رده‌بندی (مقام سوم)',
          knockoutRound: 'thirdPlace',
          knockoutRoundLabel: 'رده‌بندی (مقام سوم)',
          knockoutMatchIndex: 2,
          homePlayerId: losers[0].loserId,
          awayPlayerId: losers[1].loserId,
          homeLoserSourceMatchId: losers[0].sourceMatchId,
          awayLoserSourceMatchId: losers[1].sourceMatchId,
          homeScore: matchIsBo3 ? 0 : null,
          awayScore: matchIsBo3 ? 0 : null,
          homeGamesWon: matchIsBo3 ? 0 : undefined,
          awayGamesWon: matchIsBo3 ? 0 : undefined,
          isFinished: false,
          isBo3: matchIsBo3,
          games: matchIsBo3 ? [] : undefined,
          bracketType: 'single',
        });
      }
    }

    return {
      newMatches,
      isFinal: true,
      championId: null,
      runnerUpId: null,
      thirdPlaceId: null,
    };
  }

  // Standard intermediate round (4, 8, 16, 32, 64)
  const roundLabel = getKnockoutRoundPersianLabel(adjustedPool.length);
  let roundType: KnockoutRoundType = 'quarter';
  if (adjustedPool.length >= 64) roundType = 'roundOf64';
  else if (adjustedPool.length >= 32) roundType = 'roundOf32';
  else if (adjustedPool.length >= 16) roundType = 'roundOf16';
  else if (adjustedPool.length === 8) roundType = 'quarter';
  else if (adjustedPool.length === 4) roundType = 'semi';

  for (let i = 0; i < adjustedPool.length; i += 2) {
    const item1 = adjustedPool[i];
    const item2 = adjustedPool[i + 1];
    const matchIndex = i / 2 + 1;

    newMatches.push({
      id: `ko-r${nextRoundIndex}-m${matchIndex}`,
      stage: 'knockout',
      roundIndex: nextRoundIndex,
      roundLabel: `مرحله ${nextRoundIndex} (${roundLabel})`,
      knockoutRound: roundType,
      knockoutRoundLabel: roundLabel,
      knockoutMatchIndex: matchIndex,
      homePlayerId: item1.playerId,
      awayPlayerId: item2.playerId,
      homeSourceMatchId: item1.sourceMatchId,
      awaySourceMatchId: item2.sourceMatchId,
      homeScore: matchIsBo3 ? 0 : null,
      awayScore: matchIsBo3 ? 0 : null,
      homeGamesWon: matchIsBo3 ? 0 : undefined,
      awayGamesWon: matchIsBo3 ? 0 : undefined,
      isFinished: false,
      isBo3: matchIsBo3,
      games: matchIsBo3 ? [] : undefined,
      bracketType: isDoubleElim ? 'winners' : 'single',
    });
  }

  return {
    newMatches,
    isFinal: false,
    championId: null,
    runnerUpId: null,
    thirdPlaceId: null,
  };
}

/**
 * Automatically creates or synchronizes Final and Third-Place matches
 * as soon as both Semi-Final matches have winners.
 * This completely eliminates the need for manual redraw/advance buttons at the semi-final stage.
 */
export function autoAdvanceSemiFinalMatches(
  currentMatches: Match[],
  currentRoundIndex: number,
  isDoubleElim: boolean = false,
  forceBo3?: boolean
): {
  updatedMatches: Match[];
  nextRoundIndex: number;
  advanced: boolean;
} {
  const knockoutMatches = currentMatches.filter((m) => m.stage === 'knockout');
  const currentRoundMatches = knockoutMatches.filter(
    (m) =>
      (m.roundIndex || 1) === currentRoundIndex &&
      (!m.bracketType || m.bracketType === 'single' || m.bracketType === 'winners')
  );

  // A round is a semi-final round if:
  // 1. It has exactly 2 matches
  // 2. Neither match is the final or third-place match
  const isSemiRound =
    currentRoundMatches.length === 2 &&
    currentRoundMatches.every(
      (m) => m.knockoutRound !== 'final' && m.knockoutRound !== 'thirdPlace'
    );

  if (!isSemiRound) {
    return { updatedMatches: currentMatches, nextRoundIndex: currentRoundIndex, advanced: false };
  }

  // Check if both semi-final matches are finished and have winners
  const semi1 = currentRoundMatches[0];
  const semi2 = currentRoundMatches[1];
  const bothFinished =
    Boolean(semi1?.isFinished && semi1?.winnerId) &&
    Boolean(semi2?.isFinished && semi2?.winnerId);

  if (!bothFinished) {
    return { updatedMatches: currentMatches, nextRoundIndex: currentRoundIndex, advanced: false };
  }

  const winner1 = semi1.winnerId!;
  const loser1 =
    semi1.loserId ||
    (semi1.homePlayerId === winner1 ? semi1.awayPlayerId : semi1.homePlayerId)!;

  const winner2 = semi2.winnerId!;
  const loser2 =
    semi2.loserId ||
    (semi2.homePlayerId === winner2 ? semi2.awayPlayerId : semi2.homePlayerId)!;

  const nextRoundIndex = currentRoundIndex + 1;
  const matchIsBo3 = forceBo3 !== undefined ? forceBo3 : isDoubleElim;

  let updatedMatches = [...currentMatches];

  // 1. Check for existing Final match
  const existingFinalIndex = updatedMatches.findIndex(
    (m) =>
      m.stage === 'knockout' &&
      (m.knockoutRound === 'final' ||
        m.id === `ko-r${nextRoundIndex}-final` ||
        m.id === 'ko-final')
  );

  if (existingFinalIndex >= 0) {
    const existing = updatedMatches[existingFinalIndex];
    updatedMatches[existingFinalIndex] = {
      ...existing,
      roundIndex: nextRoundIndex,
      homePlayerId: winner1,
      awayPlayerId: winner2,
      homeSourceMatchId: semi1.id,
      awaySourceMatchId: semi2.id,
      knockoutRound: 'final',
      roundLabel: existing.roundLabel || 'فینال قهرمانی',
      knockoutRoundLabel: 'فینال و رده‌بندی',
    };
  } else {
    updatedMatches.push({
      id: `ko-r${nextRoundIndex}-final`,
      stage: 'knockout',
      roundIndex: nextRoundIndex,
      roundLabel: 'فینال قهرمانی',
      knockoutRound: 'final',
      knockoutRoundLabel: 'فینال و رده‌بندی',
      knockoutMatchIndex: 1,
      homePlayerId: winner1,
      awayPlayerId: winner2,
      homeSourceMatchId: semi1.id,
      awaySourceMatchId: semi2.id,
      homeScore: matchIsBo3 ? 0 : null,
      awayScore: matchIsBo3 ? 0 : null,
      homeGamesWon: matchIsBo3 ? 0 : undefined,
      awayGamesWon: matchIsBo3 ? 0 : undefined,
      isFinished: false,
      isBo3: matchIsBo3,
      games: matchIsBo3 ? [] : undefined,
      bracketType: isDoubleElim ? 'grand_final' : 'single',
    });
  }

  // 2. Check for existing Third-Place match
  const existingThirdIndex = updatedMatches.findIndex(
    (m) =>
      m.stage === 'knockout' &&
      (m.knockoutRound === 'thirdPlace' ||
        m.id === `ko-r${nextRoundIndex}-third` ||
        m.id === 'ko-third')
  );

  if (existingThirdIndex >= 0) {
    const existing = updatedMatches[existingThirdIndex];
    updatedMatches[existingThirdIndex] = {
      ...existing,
      roundIndex: nextRoundIndex,
      homePlayerId: loser1,
      awayPlayerId: loser2,
      homeLoserSourceMatchId: semi1.id,
      awayLoserSourceMatchId: semi2.id,
      knockoutRound: 'thirdPlace',
      roundLabel: existing.roundLabel || 'رده‌بندی (مقام سوم)',
      knockoutRoundLabel: 'فینال و رده‌بندی',
    };
  } else {
    updatedMatches.push({
      id: `ko-r${nextRoundIndex}-third`,
      stage: 'knockout',
      roundIndex: nextRoundIndex,
      roundLabel: 'رده‌بندی (مقام سوم)',
      knockoutRound: 'thirdPlace',
      knockoutRoundLabel: 'فینال و رده‌بندی',
      knockoutMatchIndex: 2,
      homePlayerId: loser1,
      awayPlayerId: loser2,
      homeLoserSourceMatchId: semi1.id,
      awayLoserSourceMatchId: semi2.id,
      homeScore: matchIsBo3 ? 0 : null,
      awayScore: matchIsBo3 ? 0 : null,
      homeGamesWon: matchIsBo3 ? 0 : undefined,
      awayGamesWon: matchIsBo3 ? 0 : undefined,
      isFinished: false,
      isBo3: matchIsBo3,
      games: matchIsBo3 ? [] : undefined,
      bracketType: 'single',
    });
  }

  return {
    updatedMatches,
    nextRoundIndex,
    advanced: true,
  };
}

/**
 * Save result for a game in a Best of 3 match.
 * Enforces: NO DRAWS ALLOWED (تساوی مجاز نیست).
 * When a player reaches 2 game wins, the match is finished.
 */
export function saveBo3GameScore(
  match: Match,
  gameNumber: number,
  homeScore: number,
  awayScore: number
): { updatedMatch: Match; error?: string } {
  if (homeScore === awayScore) {
    return {
      updatedMatch: match,
      error: 'در مسابقات حذفی هیچگونه تساوی وجود ندارد. هر بازی الزاماً باید یک برنده داشته باشد.',
    };
  }

  const gameWinnerId = homeScore > awayScore ? match.homePlayerId : match.awayPlayerId;
  const existingGames = (match.games || []).filter((g) => g.gameNumber !== gameNumber);

  const newGame: MatchGame = {
    gameNumber,
    homeScore,
    awayScore,
    winnerId: gameWinnerId,
    isFinished: true,
  };

  const updatedGames = [...existingGames, newGame].sort((a, b) => a.gameNumber - b.gameNumber);

  const homeGamesWon = updatedGames.filter((g) => g.winnerId === match.homePlayerId).length;
  const awayGamesWon = updatedGames.filter((g) => g.winnerId === match.awayPlayerId).length;

  let isFinished = false;
  let winnerId: string | null = null;
  let loserId: string | null = null;

  if (homeGamesWon >= 2) {
    isFinished = true;
    winnerId = match.homePlayerId;
    loserId = match.awayPlayerId;
  } else if (awayGamesWon >= 2) {
    isFinished = true;
    winnerId = match.awayPlayerId;
    loserId = match.homePlayerId;
  }

  return {
    updatedMatch: {
      ...match,
      games: updatedGames,
      homeGamesWon,
      awayGamesWon,
      homeScore: homeGamesWon,
      awayScore: awayGamesWon,
      isFinished,
      winnerId,
      loserId,
      updatedAt: Date.now(),
    },
  };
}

/**
 * Quick record game win for one side in a Best of 3 series
 */
export function quickRecordBo3GameWin(
  match: Match,
  winningSide: 'home' | 'away'
): Match {
  const currentGames = match.games || [];
  const nextGameNumber = currentGames.length + 1;
  if (nextGameNumber > 3 || match.isFinished) return match;

  const homeScore = winningSide === 'home' ? 1 : 0;
  const awayScore = winningSide === 'away' ? 1 : 0;

  const result = saveBo3GameScore(match, nextGameNumber, homeScore, awayScore);
  return result.updatedMatch;
}

/**
 * Reset a Best of 3 match back to fresh state
 */
export function resetBo3Match(match: Match): Match {
  return {
    ...match,
    games: [],
    homeGamesWon: 0,
    awayGamesWon: 0,
    homeScore: 0,
    awayScore: 0,
    isFinished: false,
    winnerId: null,
    loserId: null,
    updatedAt: Date.now(),
  };
}

/**
 * محاسبه سهمیه صعود هر گروه متناسب با ظرفیت به طوری که مجموع دقیقاً ۸ شود.
 * مثال: گروه‌های با ۶، ۵ و ۴ بازیکن به ترتیب ۳، ۳ و ۲ صعودکننده دریافت می‌کنند.
 */
export function calculateProportionalQuota(
  counts: Record<string, number>,
  codes: string[]
): Record<string, number> {
  const totalPlayers = codes.reduce((sum, c) => sum + (counts[c] || 0), 0);
  if (totalPlayers === 0) {
    return { A: 3, B: 3, C: 2 };
  }

  // سهم اولیه تئوریک هر گروه از ۸ سهمیه
  const items = codes.map((code) => {
    const pCount = counts[code] || 0;
    const rawShare = (pCount / totalPlayers) * 8;
    return {
      code,
      pCount,
      floorShare: Math.min(pCount, Math.floor(rawShare)),
      remainder: rawShare - Math.floor(rawShare),
    };
  });

  const allocation: Record<string, number> = {};
  let currentSum = 0;

  items.forEach((item) => {
    let alloc = Math.max(1, item.floorShare);
    if (alloc > item.pCount) alloc = item.pCount;
    allocation[item.code] = alloc;
    currentSum += alloc;
  });

  // اگر کمتر از ۸ بود، به گروه‌های با بیشترین باقیمانده (و دارای ظرفیت خالی) سهمیه اضافه می‌کنیم
  while (currentSum < 8) {
    const eligible = items
      .filter((item) => allocation[item.code] < item.pCount)
      .sort((a, b) => b.remainder - a.remainder || b.pCount - a.pCount);

    if (eligible.length === 0) break;
    allocation[eligible[0].code] += 1;
    currentSum += 1;
  }

  // اگر بیشتر از ۸ بود، از گروه‌های با کمترین باقیمانده کسر می‌کنیم
  while (currentSum > 8) {
    const eligible = items
      .filter((item) => allocation[item.code] > 1)
      .sort((a, b) => a.remainder - b.remainder || a.pCount - b.pCount);

    if (eligible.length === 0) break;
    allocation[eligible[0].code] -= 1;
    currentSum -= 1;
  }

  return allocation;
}
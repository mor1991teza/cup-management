import React, { useState, useEffect, useMemo } from 'react';
import {
  UserPlus,
  Users,
  Shuffle,
  Trash2,
  Sparkles,
  AlertCircle,
  FileText,
  Shield,
  Layers,
  ImagePlus,
  CheckCircle,
  Grid,
  GitBranch,
  Dices,
  Check,
  ArrowLeft,
  ArrowRight,
  Trophy,
  Swords,
  Gamepad2,
  CircleDot,
  Target,
} from 'lucide-react';
import { Player, TournamentFormat, GameType, BilliardsFormat } from '../types/tournament';
import {
  PRESET_PLAYERS,
  calculateKnockoutTree,
  getKnockoutRoundPersianLabel,
  GROUP_LETTERS,
  isValidKnockoutCount,
  getNearestPowerOfTwoHint,
  getKnockoutCountErrorMessage,
  calculateProportionalQuota,
} from '../utils/tournament';
import { sound } from '../utils/audio';
import { compressAndResizeImage } from '../utils/image';

interface PlayerFormProps {
  players: Player[];
  onAddPlayer: (player: { name: string; team?: string; uniqueId?: string }) => void;
  onAddBulkPlayers: (names: string[]) => void;
  onRemovePlayer: (id: string) => void;
  onClearAllPlayers: () => void;
  numberOfGroups: number;
  onSetNumberOfGroups: (n: number) => void;
  onStartTournament: () => void;
  onLoadPresets: (presetList: Array<{ name: string; team?: string; color?: string }>) => void;
  assetsBase: string;
  hostLogo: string | null;
  onUpdateHostLogo: (logo: string | null) => void;
  advancementRule?: 'bestThirds' | 'proportional' | 'manual' | null;
  onSetAdvancementRule: (rule: 'bestThirds' | 'proportional' | 'manual' | null) => void;
  tournamentFormat: TournamentFormat;
  onSetTournamentFormat: (format: TournamentFormat) => void;
  onStartKnockoutTournament: () => void;
  groupAdvanceSettings?: Record<string, number>;
  onUpdateGroupAdvanceCount?: (groupCode: string, count: number) => void;
  gameType?: GameType;
  onSetGameType?: (gameType: GameType) => void;
  billiardsFormat?: BilliardsFormat;
  onSetBilliardsFormat?: (format: BilliardsFormat) => void;
  targetPlayerCount?: number;
  onSetTargetPlayerCount?: (count: number) => void;
}

export const PlayerForm: React.FC<PlayerFormProps> = ({
  players,
  onAddPlayer,
  onAddBulkPlayers,
  onRemovePlayer,
  onClearAllPlayers,
  numberOfGroups,
  onSetNumberOfGroups,
  advancementRule,
  onSetAdvancementRule,
  onStartTournament,
  onLoadPresets,
  assetsBase,
  hostLogo,
  onUpdateHostLogo,
  tournamentFormat,
  onSetTournamentFormat,
  onStartKnockoutTournament,
  groupAdvanceSettings,
  onUpdateGroupAdvanceCount,
  gameType = 'pes',
  onSetGameType,
  billiardsFormat = 'bo3',
  onSetBilliardsFormat,
  targetPlayerCount = 32,
  onSetTargetPlayerCount,
}) => {
  const [selectedGameType, setSelectedGameType] = useState<GameType>(gameType);
  const [isGameTypeSelected, setIsGameTypeSelected] = useState<boolean>(() => {
    return players.length > 0;
  });
  const [pesImgFailed, setPesImgFailed] = useState(false);
  const [billiardsImgFailed, setBilliardsImgFailed] = useState(false);

  const maxCapacity = targetPlayerCount || 32;
  const isCapacityReached = selectedGameType === 'pes' && players.length >= maxCapacity;
  const remainingSlots = Math.max(0, maxCapacity - players.length);

  useEffect(() => {
    if (gameType) {
      setSelectedGameType(gameType);
    }
  }, [gameType]);

  const handleGameTypeSelect = (gt: GameType) => {
    sound.playClick();
    setSelectedGameType(gt);
    if (onSetGameType) {
      onSetGameType(gt);
    }
    setIsGameTypeSelected(true);
  };

  const [singleName, setSingleName] = useState('');
  const [singleUniqueId, setSingleUniqueId] = useState('');
  const [singleTeam, setSingleTeam] = useState('');
  const [bulkText, setBulkText] = useState('');
  const [isBulkOpen, setIsBulkOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);

  // در حالت ۳ گروه: ۱ = برترین‌های سوم (استاندارد)، ۲ = غیرفعال، ۳ = انتخاب دستی
  // قانون ۱: هیچ حالتی به صورت پیش‌فرض انتخاب نمی‌شود (null)
  const [threeGroupMode, setThreeGroupMode] = useState<1 | 3 | null>(null);

  const teamSuggestions = useMemo(() => {
    if (selectedGameType === 'billiards') {
      return [
        'باشگاه پایتخت',
        'کلاب الماس',
        'باشگاه صبا',
        'کلاب شاهین',
        'باشگاه پارس',
        'کلاب آریا',
      ];
    }
    return [
      'بارسلونا',
      'یوونتوس',
      'بایرن مونیخ',
      'پاری سن ژرمن',
      'منچستر سیتی',
      'رئال مادرید',
      'لیورپول',
      'دورتموند',
    ];
  }, [selectedGameType]);

  // حروف گروه‌های فعال بر اساس تعداد انتخاب شده
  const currentGroupLetters = useMemo(() => {
    return GROUP_LETTERS.slice(0, numberOfGroups);
  }, [numberOfGroups]);

  // مجموع کل نفرات صعود‌کننده از تمام گروه‌ها
  const totalAdvancing = useMemo(() => {
    if (numberOfGroups === 3) {
      if (threeGroupMode === 1) {
        return 8; // عدد ۸ به صورت خودکار برای حالت ۱ (۲ تیم اول هر گروه + ۲ تیم برتر سوم)
      }
      if (threeGroupMode === null) {
        return 0; // بدون انتخاب حالت
      }
      // حالت ۳ (تنظیم دستی)
      return currentGroupLetters.reduce((sum, code) => {
        const count = groupAdvanceSettings?.[code] ?? 2;
        return sum + count;
      }, 0);
    }

    return currentGroupLetters.reduce((sum, code) => {
      const count = groupAdvanceSettings?.[code] ?? 2;
      return sum + count;
    }, 0);
  }, [currentGroupLetters, groupAdvanceSettings, numberOfGroups, threeGroupMode]);

  // محاسبه تعداد بازیکنان هر گروه در توزیع اولیه
  const groupPlayerCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    const base = Math.floor(players.length / numberOfGroups);
    const rem = players.length % numberOfGroups;
    currentGroupLetters.forEach((code, i) => {
      counts[code] = base + (i < rem ? 1 : 0);
    });
    return counts;
  }, [players.length, numberOfGroups, currentGroupLetters]);

  // بررسی عدم تجاوز تعداد صعودی از تعداد کل بازیکنان گروه
  const groupErrors = useMemo(() => {
    const errors: Record<string, string> = {};
    if (numberOfGroups === 3 && threeGroupMode === 1) {
      // در حالت ۱، سیستم خودکار ۲ تیم اول هر گروه را صعود می‌دهد، بنابراین هر گروه باید حداقل ۲ بازیکن داشته باشد
      currentGroupLetters.forEach((code) => {
        const pCount = groupPlayerCounts[code] || 0;
        if (pCount < 2) {
          errors[code] = 'گروه باید حداقل ۲ بازیکن داشته باشد.';
        }
      });
      return errors;
    }

    if (numberOfGroups === 3 && threeGroupMode === null) {
      return errors;
    }

    currentGroupLetters.forEach((code) => {
      const pCount = groupPlayerCounts[code] || 0;
      const count = groupAdvanceSettings?.[code] ?? 2;
      if (count > pCount) {
        errors[code] = 'تعداد صعودی نمیتواند بیشتر از تعداد بازیکنان گروه باشد.';
      }
    });
    return errors;
  }, [currentGroupLetters, groupPlayerCounts, groupAdvanceSettings, numberOfGroups, threeGroupMode]);

  const hasAnyGroupOverflow = Object.keys(groupErrors).length > 0;

  // اعتبارسنجی توان ۲ بودن تعداد صعودی‌ها و معتبر بودن سهمیه تمام گروه‌ها
  const isAdvanceCountValid = useMemo(() => {
    if (numberOfGroups === 3) {
      if (threeGroupMode === 1) {
        return !hasAnyGroupOverflow && players.length >= 8;
      }
      if (threeGroupMode === null) {
        return false;
      }
      return isValidKnockoutCount(totalAdvancing) && !hasAnyGroupOverflow;
    }
    return isValidKnockoutCount(totalAdvancing) && !hasAnyGroupOverflow;
  }, [numberOfGroups, threeGroupMode, hasAnyGroupOverflow, players.length, totalAdvancing]);

  // محاسبه مراحل صعود استاندارد از مرحله ۱/۳۲ نهایی (۶۴ تیم - ۳۲ مسابقه - صعود ۳۲ نفر) تا فینال قهرمانی
  const progressionStages = useMemo(() => {
    return [
      { label: 'مرحله ۱/۳۲ نهایی', teams: 64, matches: 32, advance: 32 },
      { label: 'مرحله ۱/۱۶ نهایی', teams: 32, matches: 16, advance: 16 },
      { label: 'یک‌هشتم نهایی', teams: 16, matches: 8, advance: 8 },
      { label: 'یک‌چهارم نهایی', teams: 8, matches: 4, advance: 4 },
      { label: 'نیمه‌نهایی', teams: 4, matches: 2, advance: 2 },
      { label: 'فینال قهرمانی', teams: 2, matches: 1, advance: 1 },
    ];
  }, []);

  // 🔴 تابع کمکی برای نرمال‌سازی نام‌ها (حذف فاصله‌های اضافی و یکسان‌سازی حروف)
  const normalizeName = (name: string) => {
    return name.trim().replace(/\s+/g, ' ').toLowerCase();
  };

  // محاسبه تعداد سهم‌های هر شناسه یکتا در لیست بازیکنان
  const slotCountsMap = useMemo(() => {
    const map: Record<string, number> = {};
    players.forEach((p) => {
      const uid = p.uniqueId || normalizeName(p.name);
      map[uid] = (map[uid] || 0) + 1;
    });
    return map;
  }, [players]);

  const handleSingleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (isCapacityReached) {
      sound.playClick();
      setErrorMsg(`ظرفیت کاپ تکمیل شده است (سقف مجاز: ${maxCapacity} بازیکن). امکان افزودن بازیکن جدید وجود ندارد.`);
      return;
    }

    const rawTrimmed = singleName.trim();

    if (!rawTrimmed) {
      setErrorMsg('لطفاً نام بازیکن را وارد کنید.');
      return;
    }

    const trimmedName = selectedGameType === 'billiards'
      ? rawTrimmed.replace(/\s*\([^)]*\)/g, '').trim()
      : rawTrimmed;

    if (!trimmedName) {
      setErrorMsg('لطفاً نام بازیکن را به درستی وارد کنید.');
      return;
    }

    let effectiveUniqueId: string | undefined = undefined;
    let finalName = trimmedName;

    if (selectedGameType === 'pes') {
      const rawUid = singleUniqueId.trim();

      if (!rawUid) {
        // شناسه یکتا وارد نشده است؛ اگر نام تکراری بود پیغام خطای نام تکراری داده می‌شود
        const isDuplicate = players.some(
          (p) => normalizeName(p.name) === normalizeName(trimmedName)
        );

        if (isDuplicate) {
          sound.playClick();
          setErrorMsg('نام تکراری است.');
          return;
        }

        effectiveUniqueId = undefined;
      } else {
        effectiveUniqueId = rawUid.toLowerCase();

        // بررسی تعداد سهم‌های قبلی با این شناسه یکتا
        const matchingPlayers = players.filter(
          (p) => (p.uniqueId ? p.uniqueId.toLowerCase() === effectiveUniqueId : normalizeName(p.name) === effectiveUniqueId)
        );

        if (matchingPlayers.length > 0) {
          // اگر شناسه یکتا تکراری باشد، به نام نمایشی پسوند عددی داده می‌شود (مثلاً "علی ۲")
          const baseName = trimmedName.replace(/\s+\d+$/, '').trim();
          finalName = `${baseName} ${matchingPlayers.length + 1}`;
        }
      }
    } else {
      // در بیلیارد بررسی تکراری بودن نام به شکل ساده
      const isDuplicate = players.some(
        (p) => normalizeName(p.name) === normalizeName(trimmedName)
      );

      if (isDuplicate) {
        sound.playClick();
        setErrorMsg('نام تکراری است.');
        return;
      }
    }

    onAddPlayer({
      name: finalName,
      team: selectedGameType === 'billiards' ? undefined : (singleTeam.trim() || undefined),
      uniqueId: effectiveUniqueId,
    });
    
    sound.playClick();
    setSingleName('');
    setSingleTeam('');
    setSingleUniqueId('');
    setErrorMsg(null);
  };

  const handleBulkSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (isCapacityReached) {
      sound.playClick();
      setErrorMsg(`ظرفیت کاپ تکمیل شده است (سقف مجاز: ${maxCapacity} بازیکن). امکان افزودن بازیکن جدید وجود ندارد.`);
      return;
    }

    if (!bulkText.trim()) {
      setErrorMsg('لیست اسامی خالی است.');
      return;
    }

    const rawNames = bulkText
      .split(/[\n,;]+/)
      .map((n) => n.trim())
      .filter((n) => n.length > 0);

    if (rawNames.length === 0) {
      setErrorMsg('هیچ نام معتبری یافت نشد.');
      return;
    }

    // 🔴 فیلتر کردن نام‌های تکراری (هم با لیست فعلی و هم داخل خود لیست وارد شده)
    const existingNames = new Set(players.map((p) => normalizeName(p.name)));
    const uniqueNames: string[] = [];
    let duplicateCount = 0;

    rawNames.forEach((name) => {
      let clean = name.trim();
      if (selectedGameType === 'billiards') {
        clean = clean.replace(/\s*\([^)]*\)/g, '').trim();
      }
      if (!clean) return;

      const normalized = normalizeName(clean);
      if (!existingNames.has(normalized) && !uniqueNames.some(n => normalizeName(n) === normalized)) {
        uniqueNames.push(clean);
        existingNames.add(normalized); // اضافه کردن به مجموعه برای جلوگیری از تکرار در همان لیست
      } else {
        duplicateCount++;
      }
    });

    if (uniqueNames.length === 0) {
      setErrorMsg('تمام اسامی وارد شده تکراری هستند.');
      return;
    }

    // بررسی سقف ظرفیت کاپ در ثبت دسته‌جمعی
    let namesToAdd = uniqueNames;
    let capacityHitNotice = false;

    if (selectedGameType === 'pes' && players.length + uniqueNames.length > maxCapacity) {
      const allowedCount = Math.max(0, maxCapacity - players.length);
      if (allowedCount === 0) {
        sound.playClick();
        setErrorMsg(`ظرفیت کاپ تکمیل است (سقف مجاز: ${maxCapacity} نفر).`);
        return;
      }
      namesToAdd = uniqueNames.slice(0, allowedCount);
      capacityHitNotice = true;
    }

    onAddBulkPlayers(namesToAdd);
    sound.playClick();
    setBulkText('');
    setIsBulkOpen(false);
    
    // اطلاع‌رسانی به کاربر
    if (capacityHitNotice) {
      setErrorMsg(`سقف ظرفیت کاپ ${maxCapacity} نفر است؛ تنها ${namesToAdd.length} بازیکن اول افزوده شدند و ظرفیت تکمیل شد.`);
      setTimeout(() => setErrorMsg(null), 6000);
    } else if (duplicateCount > 0) {
      setErrorMsg(`${duplicateCount} نام تکراری نادیده گرفته شد. ${namesToAdd.length} بازیکن جدید اضافه شد.`);
      setTimeout(() => setErrorMsg(null), 5000);
    } else {
      setErrorMsg(null);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        setIsUploadingLogo(true);
        const compressed = await compressAndResizeImage(file, 400);
        onUpdateHostLogo(compressed);
        sound.playWhistle();
      } catch (error) {
        alert('خطا در بارگذاری تصویر');
      } finally {
        setIsUploadingLogo(false);
        e.target.value = '';
      }
    }
  };

  const minPlayersNeeded = numberOfGroups === 3 && threeGroupMode === 1 ? 8 : numberOfGroups * 2;
  const isThreeGroupsWaitingSelection = numberOfGroups === 3 && threeGroupMode === null;
  const canStart =
    players.length >= minPlayersNeeded &&
    (tournamentFormat !== 'group_knockout' || (isAdvanceCountValid && !isThreeGroupsWaitingSelection));

  // 🔴 گام اول: نمایش فقط صفحه لندینگ انتخاب نوع مسابقه (PES 2021 و بیلیارد)
  if (!isGameTypeSelected) {
    return (
      <div className="max-w-5xl mx-auto space-y-8 py-6 sm:py-10">
        {/* Landing Page Hero Header */}
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-app-primary/10 border border-app-primary/30 text-app-primary text-xs font-bold shadow-inner">
            <Sparkles className="w-4 h-4 text-amber-400 animate-spin" style={{ animationDuration: '4s' }} />
            <span>سامانه مدیریت و قرعه‌کشی هوشمند تورنمنت</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight leading-snug">
            نوع مسابقه مورد نظر خود را انتخاب کنید
          </h1>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            برای شروع، نوع بازی (فوتبال PES 2021 یا بیلیارد) را انتخاب کنید تا فرم ثبت‌نام و جدول‌بندی اختصاصی آن برای شما آماده شود.
          </p>
        </div>

        {/* 🔴 کارت‌های تصویری انتخاب نوع مسابقه */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 pt-2">
          {/* کارت ۱: PES 2021 */}
          <div
            onClick={() => handleGameTypeSelect('pes')}
            className={`group relative h-72 sm:h-80 md:h-96 rounded-3xl overflow-hidden cursor-pointer transition-all duration-500 border-2 select-none ${
              selectedGameType === 'pes'
                ? 'border-app-primary ring-8 ring-app-primary/20 shadow-2xl shadow-app-primary/40 scale-[1.02]'
                : 'border-slate-800/80 hover:border-slate-600 opacity-90 hover:opacity-100 hover:scale-[1.01]'
            }`}
          >
            {/* Background Image / Fallback */}
            {!pesImgFailed ? (
              <img
                src="https://blog.arsangame.com/wp-content/uploads/2020/08/pesmaxresdefault.jpg"
                alt="PES 2021 Tournament"
                onError={() => setPesImgFailed(true)}
                className="absolute inset-0 w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700 ease-out"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-rose-950 via-slate-900 to-slate-950 flex flex-col items-center justify-center p-6 text-center">
                <Gamepad2 className="w-20 h-20 text-rose-500/40 mb-3" />
                <span className="text-2xl font-black text-white">eFootball PES 2021</span>
              </div>
            )}

            {/* Dark Overlay Layer for maximum readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-slate-950/20 group-hover:from-slate-950/85 transition-colors pointer-events-none" />

            {/* Top Badge */}
            <div className="absolute top-5 right-5 z-10">
              <span className="bg-rose-600/90 backdrop-blur-md text-white text-xs font-black px-3.5 py-1.5 rounded-full flex items-center gap-1.5 shadow-lg border border-white/20">
                <Shield className="w-3.5 h-3.5" />
                <span>eFootball</span>
              </span>
            </div>

            {/* Bottom Card Content */}
            <div className="absolute bottom-0 inset-x-0 p-6 sm:p-8 z-10 flex flex-col justify-end space-y-3">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-rose-500/20 text-rose-300 border border-rose-500/40 backdrop-blur-md">
                  <Gamepad2 className="w-5 h-5" />
                </span>
                <h3 className="text-2xl sm:text-3xl font-black text-white tracking-wide drop-shadow-lg">
                  مسابقات PES 2021
                </h3>
              </div>

              <p className="text-xs sm:text-sm text-slate-200 leading-relaxed drop-shadow">
                تورنمنت تخصصی فوتبال مجازی با قابلیت قرعه‌کشی تصادفی گروه‌ها، جدول امتیازات زنده، تفاضل گل و براکت مرحله حذفی.
              </p>

              <div className="pt-2 flex items-center gap-2 text-rose-300 text-xs sm:text-sm font-extrabold group-hover:translate-x-[-6px] transition-transform">
                <span>ورود به ثبت‌نام و شروع کاپ PES</span>
                <ArrowLeft className="w-4 h-4" />
              </div>
            </div>
          </div>

          {/* کارت ۲: بیلیارد */}
          <div
            onClick={() => handleGameTypeSelect('billiards')}
            className={`group relative h-72 sm:h-80 md:h-96 rounded-3xl overflow-hidden cursor-pointer transition-all duration-500 border-2 select-none ${
              selectedGameType === 'billiards'
                ? 'border-app-primary ring-8 ring-app-primary/20 shadow-2xl shadow-app-primary/40 scale-[1.02]'
                : 'border-slate-800/80 hover:border-slate-600 opacity-90 hover:opacity-100 hover:scale-[1.01]'
            }`}
          >
            {/* Background Image / Fallback */}
            {!billiardsImgFailed ? (
              <img
                src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTqniQoQxzh_5OlE93mckbAehloeipZ-9sLPNj7zTCCJ4O3ushLTLDhIAi5&s=10"
                alt="Billiards Tournament"
                onError={() => setBilliardsImgFailed(true)}
                className="absolute inset-0 w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700 ease-out"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-950 via-teal-950 to-slate-950 flex flex-col items-center justify-center p-6 text-center">
                <CircleDot className="w-20 h-20 text-emerald-500/40 mb-3" />
                <span className="text-2xl font-black text-white">مسابقات بیلیارد</span>
              </div>
            )}

            {/* Dark Overlay Layer for maximum readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-slate-950/20 group-hover:from-slate-950/85 transition-colors pointer-events-none" />

            {/* Top Badge */}
            <div className="absolute top-5 right-5 z-10">
              <span className="bg-emerald-600/90 backdrop-blur-md text-white text-xs font-black px-3.5 py-1.5 rounded-full flex items-center gap-1.5 shadow-lg border border-white/20">
                <CircleDot className="w-3.5 h-3.5" />
                <span>8-Ball & 9-Ball</span>
              </span>
            </div>

            {/* Bottom Card Content */}
            <div className="absolute bottom-0 inset-x-0 p-6 sm:p-8 z-10 flex flex-col justify-end space-y-3">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 backdrop-blur-md">
                  <Target className="w-5 h-5" />
                </span>
                <h3 className="text-2xl sm:text-3xl font-black text-white tracking-wide drop-shadow-lg">
                  مسابقات بیلیارد
                </h3>
              </div>

              <p className="text-xs sm:text-sm text-slate-200 leading-relaxed drop-shadow">
                سامانه برگزاری رقابت‌های ایت‌بال و ناین‌بال بیلیارد، قرعه‌کشی دوره‌ای، مسابقات دوحذفی و جدول نهایی.
              </p>

              <div className="pt-2 flex items-center gap-2 text-emerald-300 text-xs sm:text-sm font-extrabold group-hover:translate-x-[-6px] transition-transform">
                <span>ورود به ثبت‌نام و شروع کاپ بیلیارد</span>
                <ArrowLeft className="w-4 h-4" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 🔴 گام دوم: فرم ثبت‌نام و تنظیمات تورنمنت با دکمه بازگشت
  return (
    <div className="space-y-6">
      {/* 🔴 دکمه بازگشت به صفحه انتخاب نوع مسابقه */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-app-surface/90 border border-app-border p-3.5 sm:p-4 rounded-2xl shadow-lg">
        <button
          type="button"
          onClick={() => {
            sound.playClick();
            setIsGameTypeSelected(false);
          }}
          className="flex items-center gap-2.5 px-4 py-2 text-xs sm:text-sm font-bold text-white bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-slate-500 rounded-xl transition-all shadow-sm cursor-pointer group shrink-0"
        >
          <ArrowRight className="w-4 h-4 text-app-primary group-hover:-translate-x-1 transition-transform" />
          <span>بازگشت به انتخاب نوع مسابقه</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 hidden sm:inline-block">نوع مسابقه انتخاب شده:</span>
          <span className={`text-xs font-extrabold px-3 py-1.5 rounded-xl border flex items-center gap-2 ${
            selectedGameType === 'pes'
              ? 'bg-rose-950/60 text-rose-300 border-rose-800/80'
              : 'bg-emerald-950/60 text-emerald-300 border-emerald-800/80'
          }`}>
            {selectedGameType === 'pes' ? (
              <>
                <Shield className="w-4 h-4 text-rose-400" />
                <span>فوتبال PES 2021</span>
              </>
            ) : (
              <>
                <CircleDot className="w-4 h-4 text-emerald-400" />
                <span>بیلیارد (Billiards)</span>
              </>
            )}
          </span>
        </div>
      </div>
      {/* 🔴 بنر و سربرگ اختصاصی (تفکیک بر اساس PES 2021 یا بیلیارد) */}
      {selectedGameType === 'billiards' ? (
        <div className="card-stadium rounded-2xl border border-emerald-900/60 bg-gradient-to-r from-emerald-950/80 via-slate-900 to-slate-950 p-6 lg:p-7 relative overflow-hidden shadow-2xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
            <div className="space-y-2 max-w-xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-bold shadow-inner">
                <CircleDot className="w-4 h-4 text-emerald-400" />
                <span>مسابقات بیلیارد (8-Ball & 9-Ball)</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                ثبت‌نام بازیکنان و مدیریت مسابقات بیلیارد
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                اسامی بازیکنان بیلیارد را وارد نموده و فرمت و گروه‌ها را تنظیم فرمایید.
              </p>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap shrink-0">
              <button
                type="button"
                onClick={() => {
                  sound.playClick();
                  const cleaned = PRESET_PLAYERS.slice(0, 8).map(p => ({
                    ...p,
                    name: p.name.replace(/\s*\([^)]*\)/g, '').trim(),
                    team: undefined,
                  }));
                  onLoadPresets(cleaned);
                }}
                className="flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 rounded-xl transition-all shadow-md shadow-emerald-950/50 cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-emerald-300" />
                <span>۸ بازیکن بیلیارد</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  sound.playClick();
                  const cleaned = PRESET_PLAYERS.slice(0, 16).map(p => ({
                    ...p,
                    name: p.name.replace(/\s*\([^)]*\)/g, '').trim(),
                    team: undefined,
                  }));
                  onLoadPresets(cleaned);
                }}
                className="flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 rounded-xl transition-all shadow-md shadow-emerald-950/50 cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-emerald-300" />
                <span>۱۶ بازیکن بیلیارد</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Grand PES 2021 Season Update Showcase Banner */
        <div className="card-stadium rounded-2xl border border-app-border bg-app-surface p-6 lg:p-7 relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-app-primary/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-10 w-80 h-80 bg-app-primary/5 rounded-full blur-3xl pointer-events-none" />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center relative z-10">
            
            {/* ستون سمت راست: متن‌ها و دکمه‌ها */}
            <div className="lg:col-span-6 space-y-4">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-1 text-[11px] font-mono tracking-wider font-bold bg-app-bg border border-app-border text-app-primary rounded-md">
                  eFootball PES 2021 SEASON UPDATE
                </span>
                <span className="text-app-border" aria-hidden="true">·</span>
                <span className="text-xs text-app-primary font-medium">
                  سیستم برگزاری و قرعه‌کشی تورنمنت
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight leading-tight">
                سامانه هوشمند برگزاری کاپ گروهی و حذفی PES 2021
              </h1>

              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                مدیریت زنده مسابقات، قرعه‌کشی تصادفی متوازن در ۲، ۳، ۴ یا ۸ گروه، جدول امتیازات بلادرنگ با تفکیک برد، مساوی، باخت و تفاضل گل، همراه با نمودار درختی مرحله حذفی تک‌حذفی و ضربات پنالتی.
              </p>

              <div className="flex items-center gap-2.5 pt-1 flex-wrap">
                <button
                  type="button"
                  onClick={() => {
                    sound.playClick();
                    onLoadPresets(PRESET_PLAYERS.slice(0, 64));
                    onSetTournamentFormat('knockout_single');
                  }}
                  className="flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-white bg-gradient-to-r from-rose-600 via-red-600 to-amber-600 hover:brightness-110 rounded-xl transition-all shadow-md shadow-rose-950/60 ring-1 ring-amber-400/40"
                >
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>شروع با ۶۴ بازیکن (۱/۳۲ نهایی کامل)</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    sound.playClick();
                    onLoadPresets(PRESET_PLAYERS.slice(0, 8));
                    onSetNumberOfGroups(2);
                  }}
                  className="flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-white bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 rounded-xl transition-all shadow-md shadow-rose-950/50"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>شروع با ۸ بازیکن (۲ گروه)</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    sound.playClick();
                    onLoadPresets(PRESET_PLAYERS.slice(0, 17));
                    onSetNumberOfGroups(3);
                  }}
                  className="flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-amber-950 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 hover:brightness-110 rounded-xl transition-all shadow-md shadow-amber-950/40 ring-1 ring-amber-400/50"
                >
                  <Sparkles className="w-4 h-4 text-amber-900" />
                  <span>شروع با ۱۷ بازیکن (۳ گروه)</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    sound.playClick();
                    onLoadPresets(PRESET_PLAYERS.slice(0, 16));
                    onSetNumberOfGroups(4);
                  }}
                  className="flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-slate-950 bg-gradient-to-r from-emerald-400 to-green-400 hover:from-emerald-300 hover:to-green-300 rounded-xl transition-all shadow-md shadow-emerald-950/40"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>شروع با ۱۶ بازیکن (۴ گروه)</span>
                </button>
              </div>
            </div>

            {/* ستون سمت چپ: لوگوی میزبان و کاور PES */}
            <div className="lg:col-span-6 flex flex-col sm:flex-row items-center justify-center lg:justify-end gap-4 w-full">
              
              {/* باکس اختصاصی لوگوی میزبان */}
              <label className="relative group w-full sm:w-44 lg:w-52 aspect-square sm:aspect-auto sm:h-52 flex-shrink-0 cursor-pointer">
                <div className="w-full h-full rounded-2xl border-2 border-amber-500/30 bg-slate-900/60 backdrop-blur-md flex flex-col items-center justify-center p-3 shadow-2xl shadow-amber-950/20 hover:border-amber-400/60 transition-all duration-300 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-t from-amber-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  
                  {hostLogo ? (
                    <div className="w-full h-full bg-white rounded-xl p-2 flex flex-col items-center justify-center shadow-inner relative z-10">
                      <img 
                        src={hostLogo} 
                        alt="Host Logo" 
                        className="w-full h-full object-contain"
                      />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white transition-opacity rounded-xl">
                        <ImagePlus className="w-6 h-6 mb-1 text-amber-400" />
                        <span className="text-xs font-bold">تغییر لوگو</span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center text-slate-500 relative z-10">
                      <div className="w-14 h-14 rounded-full bg-slate-800 flex items-center justify-center mb-3 group-hover:bg-amber-950/50 transition-colors">
                        {isUploadingLogo ? (
                          <Sparkles className="w-7 h-7 text-cyan-400 animate-pulse" />
                        ) : (
                          <ImagePlus className="w-7 h-7 text-amber-500/70" />
                        )}
                      </div>
                      <span className="text-xs font-bold text-center text-slate-300">
                        {isUploadingLogo ? 'در حال پردازش...' : 'لوگوی میزبان را آپلود کنید'}
                      </span>
                    </div>
                  )}
                  
                  <div className="absolute bottom-2 right-2 left-2 text-center z-20 pointer-events-none">
                    <span className="text-[9px] font-bold text-amber-400/80 bg-slate-950/80 px-2 py-0.5 rounded-full border border-amber-900/50">
                      HOST SPONSOR
                    </span>
                  </div>
                </div>
                
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={isUploadingLogo}
                  onChange={handleLogoUpload}
                />
                
                {hostLogo && (
                  <button
                    type="button"
                    onClick={(e) => { e.preventDefault(); onUpdateHostLogo(null); }}
                    className="absolute -top-2 -left-2 bg-rose-500 text-white p-1.5 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-30 hover:bg-rose-600"
                    title="حذف لوگو"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </label>

              {/* باکس کاور PES 2021 */}
              <div className="relative group w-full max-w-[320px] sm:max-w-[240px] lg:max-w-[280px] rounded-2xl overflow-hidden border-2 border-rose-500/30 shadow-2xl shadow-rose-950/60 bg-slate-950/80 transition-all hover:border-rose-400/60 hover:shadow-rose-500/20">
                <img
                  src="./assets/aistudio/i-efootball-pes-2021-season-update-digital_07ad38f0.webp"
                  alt="eFootball PES 2021 Season Update"
                  className="w-full h-auto object-cover transform group-hover:scale-105 transition-transform duration-500"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent pointer-events-none" />
                <div className="absolute bottom-3 right-3 left-3 flex items-center justify-between text-[11px] text-white">
                  <span className="font-bold tracking-wide drop-shadow-md flex items-center gap-1.5 text-rose-300">
                    <Shield className="w-3.5 h-3.5 text-rose-400" />
                    <span>PES 2021</span>
                  </span>
                  <span className="bg-slate-950/80 backdrop-blur px-2 py-0.5 rounded text-[9px] font-mono text-rose-300 border border-rose-900/50">
                    EDITION
                  </span>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* Title & Introduction */}
      <div className="card-stadium p-6 rounded-xl border border-rose-950/80">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-rose-950/80 pb-5">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              {selectedGameType === 'billiards' ? (
                <Target className="w-5 h-5 text-emerald-400" />
              ) : (
                <Users className="w-5 h-5 text-rose-400" />
              )}
              <span>
                {selectedGameType === 'billiards'
                  ? 'ثبت‌نام بازیکنان مسابقات بیلیارد'
                  : 'ثبت‌نام بازیکنان و تنظیمات کاپ'}
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              {selectedGameType === 'billiards'
                ? 'اسامی بازیکنان یا کلوپ‌ها را وارد کرده و پس از تکمیل لیست، دکمه شروع مسابقات بیلیارد را بزنید.'
                : 'فرمت مسابقات را انتخاب کنید، اسامی شرکت‌کنندگان را وارد نمایید و دکمه قرعه‌کشی را فشار دهید.'}
            </p>
          </div>
        </div>

        {/* Tournament Format Selector Tabs - Only displayed for PES mode */}
        {selectedGameType === 'pes' && (
          <div className="mt-4 p-1.5 bg-app-bg border border-app-border rounded-2xl">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => {
                  sound.playClick();
                  onSetTournamentFormat('group_knockout');
                }}
                className={`p-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  tournamentFormat === 'group_knockout'
                    ? 'bg-app-primary text-white shadow-lg ring-1 ring-app-primary/50'
                    : 'text-app-text-muted hover:text-app-text hover:bg-app-surface-hover'
                }`}
              >
                <Grid className="w-4 h-4 text-app-primary" />
                <span>کاپ گروهی + حذفی</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  sound.playClick();
                  onSetTournamentFormat('knockout_single');
                }}
                className={`p-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  tournamentFormat === 'knockout_single'
                    ? 'bg-app-primary text-white shadow-lg ring-1 ring-app-primary/50'
                    : 'text-app-text-muted hover:text-app-text hover:bg-app-surface-hover'
                }`}
              >
                <GitBranch className="w-4 h-4 text-app-primary" />
                <span>حذفی تک (Single)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  sound.playClick();
                  onSetTournamentFormat('knockout_double');
                }}
                className={`p-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  tournamentFormat === 'knockout_double'
                    ? 'bg-app-primary text-white shadow-lg ring-1 ring-app-primary/50'
                    : 'text-app-text-muted hover:text-app-text hover:bg-app-surface-hover'
                }`}
              >
                <Layers className="w-4 h-4 text-app-primary" />
                <span>حذفی دوگانه (Bo3)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  sound.playClick();
                  onSetTournamentFormat('knockout_black');
                }}
                className={`p-3 rounded-xl font-bold text-xs sm:text-sm flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer ${
                  tournamentFormat === 'knockout_black'
                    ? 'bg-app-primary text-white shadow-lg ring-1 ring-app-primary/50'
                    : 'text-app-text-muted hover:text-app-text hover:bg-app-surface-hover'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <Swords className="w-4 h-4 text-amber-400" />
                  <span>حالت بلک (Black)</span>
                </div>
                <span className="text-[10px] opacity-85 font-normal">مرحله اول تک‌حذفی + انتخاب فرمت در مراحل بعد</span>
              </button>
            </div>
          </div>
        )}

        {/* PES Participant Capacity Limit Box */}
        {selectedGameType === 'pes' && (
          <div className="mt-4 p-4 bg-app-surface/90 border border-app-border rounded-2xl space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-app-border pb-3">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-app-primary" />
                <span className="text-xs sm:text-sm font-bold text-app-text">
                  تعیین سقف ظرفیت شرکت‌کنندگان کاپ PES:
                </span>
                <span className="text-xs font-mono font-black px-2.5 py-0.5 rounded-full bg-app-bg text-app-primary border border-app-border">
                  {maxCapacity} نفر
                </span>
              </div>

              {/* Live Status indicator */}
              <div className="flex items-center gap-2 text-xs">
                <span className="text-app-text-muted">
                  ثبت‌نام‌شده:
                </span>
                <span className="font-mono font-bold text-app-text">
                  {players.length} از {maxCapacity}
                </span>
                {isCapacityReached ? (
                  <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-rose-950/80 text-rose-300 border border-rose-800/80 animate-pulse">
                    ⛔ ظرفیت تکمیل شد
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-950/60 text-emerald-300 border border-emerald-800/60">
                    {remainingSlots} جایگاه خالی
                  </span>
                )}
              </div>
            </div>

            {/* Capacity Presets and Custom Input */}
            <div className="flex items-center gap-2 flex-wrap text-xs">
              <span className="text-app-text-muted text-[11px] shrink-0">
                انتخاب سریع ظرفیت:
              </span>
              {[8, 16, 24, 32, 48, 64].map((count) => (
                <button
                  key={count}
                  type="button"
                  onClick={() => {
                    sound.playClick();
                    onSetTargetPlayerCount?.(count);
                  }}
                  className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                    maxCapacity === count
                      ? 'bg-app-primary text-white shadow-md ring-1 ring-app-primary/50'
                      : 'bg-app-bg text-app-text-muted hover:text-app-text border border-app-border hover:border-app-border-hover'
                  }`}
                >
                  {count} نفر
                </button>
              ))}

              {/* Custom number input */}
              <div className="flex items-center gap-1.5 mr-auto pt-1 sm:pt-0">
                <span className="text-[11px] text-app-text-muted">سقف دلخواه:</span>
                <input
                  type="number"
                  min="2"
                  max="128"
                  value={maxCapacity}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    if (!isNaN(val) && val >= 2 && val <= 128) {
                      onSetTargetPlayerCount?.(val);
                    }
                  }}
                  className="w-16 h-8 text-center bg-app-bg border border-app-border focus:border-app-primary rounded-lg text-xs font-mono font-bold text-app-text outline-none"
                />
                <span className="text-[11px] text-app-text-muted">نفر</span>
              </div>
            </div>
          </div>
        )}

        {/* Inputs Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
          {/* Left Column: Player Entry */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex items-center gap-2 border-b border-rose-950/80 pb-2">
              <button
                type="button"
                onClick={() => setIsBulkOpen(false)}
                className={`text-xs font-semibold pb-1 border-b-2 transition-colors ${
                  !isBulkOpen
                    ? 'border-rose-400 text-rose-300'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                افزودن بازیکن تکی
              </button>
              <span className="text-rose-950" aria-hidden="true">·</span>
              <button
                type="button"
                onClick={() => setIsBulkOpen(true)}
                className={`text-xs font-semibold pb-1 border-b-2 transition-colors ${
                  isBulkOpen
                    ? 'border-rose-400 text-rose-300'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                ورود دسته‌جمعی اسامی (کاما / خط جدید)
              </button>
            </div>

            {/* Alert when capacity is reached */}
            {isCapacityReached && (
              <div className="p-3 bg-rose-950/60 border border-rose-800/80 rounded-xl text-xs text-rose-200 flex items-center gap-2 animate-pulse">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>
                  ظرفیت کاپ تکمیل شده است ({maxCapacity} از {maxCapacity} نفر). برای افزودن بازیکن، ابتدا سقف ظرفیت را از کادر بالا افزایش دهید یا بازیکنی را حذف نمایید.
                </span>
              </div>
            )}

            {!isBulkOpen ? (
              <form onSubmit={handleSingleSubmit} className="space-y-3">
                {selectedGameType === 'billiards' ? (
                  <div>
                    <label className="block text-xs font-bold text-emerald-300 mb-1">
                      نام بازیکن بیلیارد *
                    </label>
                    <input
                      type="text"
                      value={singleName}
                      onChange={(e) => setSingleName(e.target.value)}
                      placeholder="مثال: آرش"
                      className="w-full bg-[#05180f] border border-emerald-800/80 focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 rounded-lg px-3.5 py-2.5 text-sm text-white placeholder-emerald-700/60 outline-none transition-all"
                    />
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs text-app-text mb-1">نام بازیکن / گیمر *</label>
                        <input
                          type="text"
                          disabled={isCapacityReached}
                          value={singleName}
                          onChange={(e) => setSingleName(e.target.value)}
                          placeholder={isCapacityReached ? `ظرفیت کاپ (${maxCapacity} نفر) تکمیل است` : 'مثال: علیرضا'}
                          className="w-full bg-app-bg border border-app-border focus:border-app-primary focus:ring-1 focus:ring-app-primary rounded-lg px-3 py-2 text-sm text-app-text placeholder-app-text-muted/60 outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-app-text mb-1">
                          شناسه یکتا (شماره تماس یا آیدی)
                        </label>
                        <input
                          type="text"
                          disabled={isCapacityReached}
                          value={singleUniqueId}
                          onChange={(e) => setSingleUniqueId(e.target.value)}
                          placeholder="مثال: 09121234567"
                          className="w-full bg-app-bg border border-app-border focus:border-app-primary focus:ring-1 focus:ring-app-primary rounded-lg px-3 py-2 text-sm text-app-text placeholder-app-text-muted/60 outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-app-text mb-1">
                          نام تیم در PES 2021 (اختیاری)
                        </label>
                        <input
                          type="text"
                          disabled={isCapacityReached}
                          value={singleTeam}
                          onChange={(e) => setSingleTeam(e.target.value)}
                          placeholder="مثال: بارسلونا"
                          className="w-full bg-app-bg border border-app-border focus:border-app-primary focus:ring-1 focus:ring-app-primary rounded-lg px-3 py-2 text-sm text-app-text placeholder-app-text-muted/60 outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap pt-1">
                      <span className="text-[11px] text-app-text-muted">
                        انتخاب سریع تیم:
                      </span>
                      {teamSuggestions.slice(0, 5).map((t) => (
                        <button
                          key={t}
                          type="button"
                          disabled={isCapacityReached}
                          onClick={() => setSingleTeam(t)}
                          className="text-[11px] text-app-text-muted hover:text-app-text hover:bg-app-surface px-2 py-0.5 rounded border border-app-border transition-colors cursor-pointer disabled:opacity-40 disabled:pointer-events-none"
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </>
                )}

                <button
                  type="submit"
                  disabled={isCapacityReached}
                  className={`flex items-center justify-center gap-2 w-full sm:w-auto px-5 py-2 text-xs font-bold rounded-lg border transition-all ${
                    isCapacityReached
                      ? 'bg-slate-800/60 text-slate-500 border-slate-700/50 cursor-not-allowed opacity-50'
                      : selectedGameType === 'billiards'
                      ? 'bg-emerald-950/90 hover:bg-emerald-900 border-emerald-700 text-emerald-200 shadow-sm cursor-pointer'
                      : 'bg-app-surface hover:bg-app-surface-hover text-app-primary border-app-border cursor-pointer'
                  }`}
                  title={isCapacityReached ? `ظرفیت کاپ تکمیل شده است (${maxCapacity} نفر)` : undefined}
                >
                  <UserPlus className="w-4 h-4" />
                  <span>افزودن به لیست شرکت‌کنندگان</span>
                </button>
              </form>
            ) : (
              <form onSubmit={handleBulkSubmit} className="space-y-3">
                <div>
                  <label className="block text-xs text-app-text mb-1">
                    اسامی بازیکنان را با کاما (،) یا با خط جدید وارد کنید:
                  </label>
                  <textarea
                    rows={4}
                    disabled={isCapacityReached}
                    value={bulkText}
                    onChange={(e) => setBulkText(e.target.value)}
                    placeholder={
                      isCapacityReached
                        ? `ظرفیت کاپ (${maxCapacity} نفر) تکمیل است.`
                        : selectedGameType === 'billiards'
                        ? 'مثال:\nآرش\nرضا\nنیما\nامیر\nسهراب\nفرهاد'
                        : 'مثال:\nعلیرضا (بارسلونا)\nرضا (یوونتوس)\nمهدی (بایرن)\nامیر (پی‌اس‌جی)'
                    }
                    className={`w-full border rounded-lg p-3 text-sm outline-none transition-all resize-y disabled:opacity-50 disabled:cursor-not-allowed ${
                      selectedGameType === 'billiards'
                        ? 'bg-[#05180f] border-emerald-800/80 focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 text-white placeholder-emerald-700/60'
                        : 'bg-app-bg border-app-border focus:border-app-primary focus:ring-1 focus:ring-app-primary text-app-text placeholder-app-text-muted/60'
                    }`}
                  />
                  <p className="text-[11px] text-app-text-muted mt-1">
                    {selectedGameType === 'billiards'
                      ? 'در حالت بیلیارد فقط نام بازیکن ثبت می‌شود.'
                      : 'می‌توانید نام تیم را در پرانتز بگذارید تا خودکار تشخیص داده شود.'}
                  </p>
                </div>
                <button
                  type="submit"
                  disabled={isCapacityReached}
                  className={`flex items-center justify-center gap-2 w-full sm:w-auto px-5 py-2 text-xs font-bold rounded-lg border transition-all ${
                    isCapacityReached
                      ? 'bg-slate-800/60 text-slate-500 border-slate-700/50 cursor-not-allowed opacity-50'
                      : selectedGameType === 'billiards'
                      ? 'bg-emerald-950/90 hover:bg-emerald-900 border-emerald-700 text-emerald-200 shadow-sm cursor-pointer'
                      : 'bg-app-surface hover:bg-app-surface-hover text-app-primary border-app-border cursor-pointer'
                  }`}
                  title={isCapacityReached ? `ظرفیت کاپ تکمیل شده است (${maxCapacity} نفر)` : undefined}
                >
                  <FileText className="w-4 h-4" />
                  <span>ثبت اسامی به صورت دسته‌جمعی</span>
                </button>
              </form>
            )}

            {errorMsg && (
              <div className={`flex items-center gap-2 p-2.5 border rounded-lg text-xs ${
                errorMsg.includes('تکراری') || errorMsg.includes('نادیده') 
                  ? 'bg-amber-950/60 border-amber-800/60 text-amber-300' 
                  : 'bg-rose-950/60 border-rose-800/60 text-rose-300'
              }`}>
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}
          </div>

          {/* Right Column: Format Specific Settings */}
          {selectedGameType === 'billiards' ? (
            /* Dedicated Billiards Start Panel */
            <div className="lg:col-span-5 bg-gradient-to-br from-[#062417] via-[#041a10] to-[#020e08] p-5 rounded-2xl border border-emerald-800/80 flex flex-col justify-between space-y-5 text-emerald-100 shadow-2xl">
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-emerald-900/80 pb-3">
                  <div className="flex items-center gap-2 text-white font-black text-sm">
                    <Target className="w-5 h-5 text-emerald-400" />
                    <span>تنظیمات و ساختار مسابقات بیلیارد</span>
                  </div>
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-900/60 text-emerald-300 border border-emerald-700/60">
                    ایت‌بال و ناین‌بال
                  </span>
                </div>

                {/* Billiards Format Mode Selector */}
                <div className="grid grid-cols-2 gap-2 p-1 bg-black/40 border border-emerald-900/60 rounded-xl">
                  <button
                    type="button"
                    onClick={() => {
                      sound.playClick();
                      onSetTournamentFormat('group_knockout');
                    }}
                    className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      tournamentFormat === 'group_knockout'
                        ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/80 ring-1 ring-emerald-400'
                        : 'text-emerald-300/70 hover:text-white hover:bg-emerald-950/40'
                    }`}
                  >
                    <Grid className="w-3.5 h-3.5" />
                    <span>کاپ مرحله گروهی + حذفی</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      sound.playClick();
                      onSetTournamentFormat('knockout_single');
                    }}
                    className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      tournamentFormat !== 'group_knockout'
                        ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/80 ring-1 ring-emerald-400'
                        : 'text-emerald-300/70 hover:text-white hover:bg-emerald-950/40'
                    }`}
                  >
                    <GitBranch className="w-3.5 h-3.5" />
                    <span>حذفی مستقیم</span>
                  </button>
                </div>

                {/* If Group Stage + Knockout in Billiards */}
                {tournamentFormat === 'group_knockout' && (
                  <div className="space-y-3.5">
                    {/* Number of Groups */}
                    <div>
                      <label className="block text-xs font-bold text-white mb-2 flex items-center gap-1.5">
                        <Layers className="w-4 h-4 text-emerald-400" />
                        <span>تعیین تعداد گروه‌های بیلیارد:</span>
                      </label>

                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                        {[1, 2, 3, 4, 8].map((num) => {
                          const isSelected = numberOfGroups === num;
                          return (
                            <button
                              key={num}
                              type="button"
                              onClick={() => {
                                sound.playClick();
                                if (num === 3) {
                                  setThreeGroupMode(null);
                                  onSetAdvancementRule(null);
                                }
                                onSetNumberOfGroups(num);
                              }}
                              className={`p-2.5 rounded-xl border text-center transition-all active:scale-95 cursor-pointer ${
                                isSelected
                                  ? 'bg-emerald-950/90 border-emerald-400 text-white shadow-md ring-2 ring-emerald-500/40'
                                  : 'bg-[#04190f] border-emerald-900/60 text-slate-400 hover:text-slate-200 hover:border-emerald-700'
                              }`}
                            >
                              <div className="text-sm font-black font-mono tabular-nums text-white">
                                {num === 1 ? '۱ جدول (لیگ)' : `${num} گروه`}
                              </div>
                              <div className="text-[10px] text-emerald-400/80 mt-0.5">
                                حداقل {num === 1 ? 2 : num * 2} نفر
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Group Advancement Structure */}
                    <div className="p-3 bg-[#03150c] border border-emerald-900/60 rounded-xl space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                          <Trophy className="w-4 h-4 text-amber-400" />
                          <span>سهمیه صعود به مرحله حذفی:</span>
                        </span>
                        <span className="text-[10px] text-emerald-400/80 font-mono">
                          {numberOfGroups} گروه مسابقه
                        </span>
                      </div>

                      {/* 3 Groups Advancement Modes */}
                      {numberOfGroups === 3 && (
                        <div className="space-y-2 pt-1 border-t border-emerald-900/60">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-slate-200">
                              انتخاب ساختار صعود ۳ گروه:
                            </span>
                            {threeGroupMode === null && (
                              <span className="text-[10px] text-amber-400 font-medium animate-pulse">
                                * انتخاب یکی از حالت‌ها الزامی است
                              </span>
                            )}
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                            {/* Mode 1 */}
                            <button
                              type="button"
                              onClick={() => {
                                sound.playClick();
                                setThreeGroupMode(1);
                                onSetAdvancementRule('bestThirds');
                                currentGroupLetters.forEach((code) => {
                                  onUpdateGroupAdvanceCount?.(code, 2);
                                });
                              }}
                              className={`p-2.5 rounded-xl border text-right transition-all cursor-pointer flex flex-col justify-between gap-1.5 ${
                                threeGroupMode === 1
                                  ? 'bg-emerald-950/90 border-emerald-400 text-white shadow-md ring-1 ring-emerald-400'
                                  : 'bg-[#051c11] border-emerald-900/60 text-slate-300 hover:border-emerald-700'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-[11px] font-bold text-emerald-200">
                                  ۱. برترین‌های سوم
                                </span>
                                <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-900/80 text-emerald-300 font-bold">
                                  استاندارد
                                </span>
                              </div>
                              <p className="text-[9px] text-slate-400 leading-tight">
                                ۲ نفر اول هر گروه + ۲ نفر برتر رتبه سوم (مجموعاً ۸ نفر)
                              </p>
                            </button>

                            {/* Mode 2 */}
                            <button
                              type="button"
                              onClick={() => {
                                sound.playClick();
                                const quota = calculateProportionalQuota(groupPlayerCounts, currentGroupLetters);
                                currentGroupLetters.forEach((code) => {
                                  onUpdateGroupAdvanceCount?.(code, quota[code] ?? 2);
                                });
                                setThreeGroupMode(3);
                                onSetAdvancementRule('manual');
                              }}
                              className="p-2.5 rounded-xl border text-right transition-all cursor-pointer flex flex-col justify-between gap-1.5 bg-[#051c11] border-emerald-900/60 text-slate-300 hover:border-emerald-700"
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-[11px] font-bold text-white">
                                  ۲. متناسب با ظرفیت
                                </span>
                                <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-900/80 text-emerald-300 font-bold">
                                  هوشمند
                                </span>
                              </div>
                              <p className="text-[9px] text-slate-400 leading-tight">
                                توزیع هوشمند سهمیه ۸ صعودی بر اساس ظرفیت هر گروه
                              </p>
                            </button>

                            {/* Mode 3 */}
                            <button
                              type="button"
                              onClick={() => {
                                sound.playClick();
                                setThreeGroupMode(3);
                                onSetAdvancementRule('manual');
                              }}
                              className={`p-2.5 rounded-xl border text-right transition-all cursor-pointer flex flex-col justify-between gap-1.5 ${
                                threeGroupMode === 3
                                  ? 'bg-emerald-950/90 border-emerald-400 text-white shadow-md ring-1 ring-emerald-400'
                                  : 'bg-[#051c11] border-emerald-900/60 text-slate-300 hover:border-emerald-700'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-[11px] font-bold text-white">
                                  ۳. تنظیم دستی
                                </span>
                                <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-950/80 text-amber-300 font-bold">
                                  دستی
                                </span>
                              </div>
                              <p className="text-[9px] text-slate-400 leading-tight">
                                تعیین دستی تعداد صعودی‌ها از فیلدهای زیر
                              </p>
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Quota dropdowns for each group */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                        {currentGroupLetters.map((code) => {
                          const currentCount = numberOfGroups === 3 && threeGroupMode === 1
                            ? 2
                            : (groupAdvanceSettings?.[code] ?? 2);
                          const pCount = groupPlayerCounts[code] || 0;
                          const hasOverflow = !!groupErrors[code];
                          const isFieldDisabled = numberOfGroups === 3 && (threeGroupMode === 1 || threeGroupMode === null);

                          return (
                            <div
                              key={code}
                              className={`border rounded-lg p-2 flex flex-col justify-between gap-1 transition-all ${
                                hasOverflow
                                  ? 'border-rose-600 bg-rose-950/30'
                                  : isFieldDisabled
                                  ? 'border-emerald-950 bg-black/40 opacity-70'
                                  : 'border-emerald-800/60 bg-[#051f13]'
                              }`}
                            >
                              <div className="flex items-center justify-between text-xs font-bold text-white">
                                <span>گروه {code}</span>
                                <span className="text-[10px] text-emerald-400 font-mono">
                                  {pCount} بازیکن
                                </span>
                              </div>

                              <select
                                value={currentCount}
                                disabled={isFieldDisabled}
                                onChange={(e) => {
                                  sound.playClick();
                                  onUpdateGroupAdvanceCount?.(code, parseInt(e.target.value, 10));
                                }}
                                className={`w-full border rounded py-1 px-1.5 text-xs font-mono font-bold outline-none transition-all ${
                                  isFieldDisabled
                                    ? 'bg-black/60 border-emerald-950 text-slate-400 cursor-not-allowed'
                                    : hasOverflow
                                    ? 'bg-rose-950/60 border-rose-500 text-rose-200'
                                    : 'bg-[#03150c] border-emerald-700/80 focus:border-emerald-400 text-emerald-200 cursor-pointer'
                                }`}
                              >
                                {Array.from({ length: Math.max(8, pCount || 1) }, (_, idx) => idx + 1).map((n) => (
                                  <option key={n} value={n}>
                                    {n} نفر صعودی {numberOfGroups === 3 && threeGroupMode === 1 && n === 2 ? '(مستقیم)' : ''}
                                  </option>
                                ))}
                              </select>
                            </div>
                          );
                        })}
                      </div>

                      {/* Advance count validation box */}
                      <div
                        className={`p-2.5 rounded-lg border text-xs font-medium flex items-center justify-between ${
                          numberOfGroups === 3 && threeGroupMode === 1
                            ? 'bg-emerald-950/60 border-emerald-600 text-emerald-200'
                            : isThreeGroupsWaitingSelection
                            ? 'bg-amber-950/60 border-amber-600 text-amber-200'
                            : isAdvanceCountValid
                            ? 'bg-emerald-950/60 border-emerald-600 text-emerald-200'
                            : 'bg-rose-950/60 border-rose-600 text-rose-200'
                        }`}
                      >
                        <div className="flex items-center gap-1.5">
                          {isAdvanceCountValid || (numberOfGroups === 3 && threeGroupMode === 1) ? (
                            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                          ) : (
                            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                          )}
                          <span>
                            {numberOfGroups === 3 && threeGroupMode === 1
                              ? 'مجموع صعودی‌ها: ۸ نفر (معتبر - ۲ تیم اول + ۲ برتر سوم)'
                              : isThreeGroupsWaitingSelection
                              ? 'لطفاً یکی از حالت‌های صعود ۳ گروه را انتخاب کنید.'
                              : isAdvanceCountValid
                              ? `مجموع صعودی‌ها: ${totalAdvancing} نفر (معتبر برای مرحله حذفی)`
                              : hasAnyGroupOverflow
                              ? 'تعداد صعودی نمی‌تواند بیشتر از تعداد بازیکنان گروه باشد.'
                              : `مجموع صعودی‌ها: ${totalAdvancing} نفر (باید ${getNearestPowerOfTwoHint(totalAdvancing)} باشد)`}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Race to X / Frame format selector */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-white flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-emerald-300">
                      <Trophy className="w-4 h-4 text-amber-400" />
                      <span>تعداد برد برای قهرمانی (Race to X):</span>
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">فرمت فریم‌ها</span>
                  </label>

                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        sound.playClick();
                        onSetBilliardsFormat?.('single');
                      }}
                      className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-0.5 ${
                        billiardsFormat === 'single'
                          ? 'bg-emerald-950/90 border-emerald-400 text-white ring-2 ring-emerald-500/40 shadow-lg'
                          : 'bg-[#041a10] border-emerald-900/60 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <span className="text-xs font-bold">تک‌بازی</span>
                      <span className="text-[10px] text-emerald-400/90 font-mono">(Single)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        sound.playClick();
                        onSetBilliardsFormat?.('bo3');
                      }}
                      className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-0.5 ${
                        billiardsFormat === 'bo3'
                          ? 'bg-emerald-950/90 border-emerald-400 text-white ring-2 ring-emerald-500/40 shadow-lg'
                          : 'bg-[#041a10] border-emerald-900/60 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <span className="text-xs font-bold">بهترین از ۳</span>
                      <span className="text-[10px] text-emerald-400/90 font-mono">(Bo3 - ۲ برد)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        sound.playClick();
                        onSetBilliardsFormat?.('bo5');
                      }}
                      className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-0.5 ${
                        billiardsFormat === 'bo5'
                          ? 'bg-emerald-950/90 border-emerald-400 text-white ring-2 ring-emerald-500/40 shadow-lg'
                          : 'bg-[#041a10] border-emerald-900/60 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <span className="text-xs font-bold">بهترین از ۵</span>
                      <span className="text-[10px] text-emerald-400/90 font-mono">(Bo5 - ۳ برد)</span>
                    </button>
                  </div>
                </div>

                {/* Players Count & Info Summary */}
                <div className="p-3 bg-emerald-950/50 rounded-xl border border-emerald-800/60 space-y-1.5 text-xs">
                  <div className="flex justify-between items-center text-slate-200 font-semibold">
                    <span>تعداد بازیکنان ثبت‌شده:</span>
                    <span className="font-mono tabular-nums font-black text-emerald-400 text-sm px-2.5 py-0.5 rounded-md bg-black/40 border border-emerald-800">
                      {players.length} نفر
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-slate-400">
                    <span>حداقل بازیکن مورد نیاز:</span>
                    <span className="font-mono tabular-nums text-slate-300">
                      {tournamentFormat === 'group_knockout' ? `${minPlayersNeeded} نفر` : '۲ نفر'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Billiards Launch CTA */}
              <div className="pt-2">
                {tournamentFormat === 'group_knockout' ? (
                  <button
                    type="button"
                    disabled={!canStart}
                    onClick={() => {
                      if (isThreeGroupsWaitingSelection) {
                        sound.playClick();
                        setErrorMsg('لطفاً ابتدا یکی از حالت‌های صعود ۳ گروه را انتخاب کنید.');
                        return;
                      }
                      if (!isAdvanceCountValid) {
                        sound.playClick();
                        setErrorMsg(
                          hasAnyGroupOverflow
                            ? 'تعداد صعودی نمیتواند بیشتر از تعداد بازیکنان گروه باشد.'
                            : getKnockoutCountErrorMessage(totalAdvancing)
                        );
                        return;
                      }
                      sound.playWhistle();
                      onStartTournament();
                    }}
                    className={`w-full py-4 px-5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2.5 transition-all shadow-xl active:scale-[0.98] ${
                      canStart
                        ? 'bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 hover:brightness-110 text-white cursor-pointer shadow-emerald-950/60 ring-1 ring-emerald-400/40'
                        : 'bg-black/40 text-slate-600 cursor-not-allowed border border-emerald-950'
                    }`}
                  >
                    <Shuffle className="w-4 h-4 text-emerald-300" />
                    <span>قرعه‌کشی و شروع کاپ گروهی بیلیارد</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={players.length < 2}
                    onClick={() => {
                      sound.playWhistle();
                      onStartKnockoutTournament();
                    }}
                    className={`w-full py-4 px-5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2.5 transition-all shadow-xl active:scale-[0.98] ${
                      players.length >= 2
                        ? 'bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 hover:brightness-110 text-white cursor-pointer shadow-emerald-950/60 ring-1 ring-emerald-400/40'
                        : 'bg-black/40 text-slate-600 cursor-not-allowed border border-emerald-950'
                    }`}
                  >
                    <Target className="w-5 h-5 text-emerald-300" />
                    <span>قرعه‌کشی و شروع مسابقات حذفی بیلیارد</span>
                  </button>
                )}

                {tournamentFormat === 'group_knockout' && !canStart && (
                  <p className="text-[11px] text-amber-400/90 text-center mt-2 font-medium">
                    برای شروع کاپ گروهی بیلیارد، حداقل به {minPlayersNeeded - players.length} بازیکن دیگر نیاز است.
                  </p>
                )}

                {tournamentFormat !== 'group_knockout' && players.length < 2 && (
                  <p className="text-[11px] text-amber-400/90 text-center mt-2 font-medium">
                    برای شروع مسابقات حذفی حداقل ۲ بازیکن ثبت‌نام کنید.
                  </p>
                )}
              </div>
            </div>
          ) : tournamentFormat === 'group_knockout' ? (
            /* Group Stage Settings */
            <div className="lg:col-span-5 bg-app-surface p-4 rounded-xl border border-app-border flex flex-col justify-between space-y-4 text-app-text">
              <div>
                <label className="block text-xs font-semibold text-app-text mb-2 flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-app-primary" />
                  <span>تعیین تعداد گروه‌ها</span>
                </label>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {[1, 2, 3, 4, 8].map((num) => {
                    const isSelected = numberOfGroups === num;

                    return (
                      <button
                        key={num}
                        type="button"
                        onClick={() => {
                          sound.playClick();
                          if (num === 3) {
                            setThreeGroupMode(null);
                            onSetAdvancementRule(null);
                          }
                          onSetNumberOfGroups(num);
                        }}
                        className={`p-2.5 rounded-lg border text-center transition-all active:scale-95 cursor-pointer ${
                          isSelected
                            ? 'bg-rose-950/80 border-rose-500 text-white shadow-sm ring-1 ring-rose-500/40'
                            : 'bg-slate-900/40 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                        }`}
                      >
                        <div className="text-base sm:text-lg font-bold font-mono tabular-nums">
                          {num === 1 ? '۱ جدول (لیگ)' : `${num} گروه`}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          حداقل {num === 1 ? 2 : num * 2} بازیکن
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* تعیین ساختار و سهمیه صعود به مرحله حذفی */}
                <div className="mt-3 p-3.5 bg-app-bg border border-app-border rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-app-primary flex items-center gap-1.5">
                      <Trophy className="w-4 h-4 text-amber-400" />
                      <span>تعیین ساختار و سهمیه صعود به مرحله حذفی:</span>
                    </span>
                    <span className="text-[11px] text-app-text-muted">
                      {numberOfGroups} گروه رقابتی
                    </span>
                  </div>

                  {/* ساختار حالت‌ها در ۳ گروه */}
                  {numberOfGroups === 3 && (
                    <div className="space-y-2.5 pt-1 border-t border-rose-950/80">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                          <Sparkles className="w-4 h-4 text-amber-400" />
                          <span>انتخاب حالت صعود برای ۳ گروه:</span>
                        </span>
                        {threeGroupMode === null && (
                          <span className="text-[10px] text-amber-400 font-medium animate-pulse">
                            * انتخاب یکی از حالت‌ها الزامی است
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        {/* حالت ۱ */}
                        <button
                          type="button"
                          onClick={() => {
                            sound.playClick();
                            setThreeGroupMode(1);
                            onSetAdvancementRule('bestThirds');
                            currentGroupLetters.forEach((code) => {
                              onUpdateGroupAdvanceCount?.(code, 2);
                            });
                          }}
                          className={`p-3 rounded-xl border text-right transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                            threeGroupMode === 1
                              ? 'bg-rose-950/90 border-rose-500 text-white shadow-lg ring-1 ring-rose-500 shadow-rose-950/60'
                              : 'bg-[#15060c] border-rose-900/60 text-slate-300 hover:border-rose-800 hover:bg-[#1b0811]'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold flex items-center gap-1.5">
                              <span
                                className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                                  threeGroupMode === 1 ? 'bg-rose-500 text-white' : 'bg-slate-800 text-slate-400'
                                }`}
                              >
                                ۱
                              </span>
                              <span>برترین‌های سوم (استاندارد)</span>
                            </span>
                            <span className="text-[9px] px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-800/80 text-emerald-300 font-bold shrink-0">
                              کاملاً خودکار
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-400 leading-tight">
                            صعود خودکار ۲ تیم اول هر گروه + ۲ تیم برتر سوم (مجموعاً ۸ تیم به ۱/۴ نهایی)
                          </p>
                        </button>

                        {/* حالت ۲: متناسب با ظرفیت (میانبر هوشمند) */}
                        <button
                          type="button"
                          onClick={() => {
                            sound.playClick();
                            const quota = calculateProportionalQuota(groupPlayerCounts, currentGroupLetters);
                            currentGroupLetters.forEach((code) => {
                              onUpdateGroupAdvanceCount?.(code, quota[code] ?? 2);
                            });
                            setThreeGroupMode(3);
                            onSetAdvancementRule('manual');
                          }}
                          className="p-3 rounded-xl border text-right transition-all cursor-pointer flex flex-col justify-between gap-2 bg-[#140b12] border-sky-900/60 text-slate-300 hover:border-sky-500 hover:bg-[#0c1825] group shadow-sm hover:shadow-sky-950/40"
                          title="محاسبه خودکار سهمیه‌ها متناسب با ظرفیت تا مجموع ۸ شود و اعمال در حالت دستی"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold flex items-center gap-1.5 text-white">
                              <span className="w-5 h-5 rounded-full bg-sky-950 border border-sky-700/80 text-sky-300 flex items-center justify-center text-[10px] font-bold group-hover:bg-sky-600 group-hover:text-white transition-colors">
                                ۲
                              </span>
                              <span>متناسب با ظرفیت</span>
                            </span>
                            <span className="text-[9px] px-2 py-0.5 rounded bg-sky-950/80 border border-sky-700/70 text-sky-300 font-bold shrink-0">
                              میانبر هوشمند
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-400 leading-tight group-hover:text-slate-300 transition-colors">
                            توزیع هوشمند سهمیه ۸ صعودی بر اساس ظرفیت هر گروه و اعمال در فیلدهای دستی
                          </p>
                        </button>

                        {/* حالت ۳ */}
                        <button
                          type="button"
                          onClick={() => {
                            sound.playClick();
                            setThreeGroupMode(3);
                            onSetAdvancementRule('manual');
                          }}
                          className={`p-3 rounded-xl border text-right transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                            threeGroupMode === 3
                              ? 'bg-rose-950/90 border-rose-500 text-white shadow-lg ring-1 ring-rose-500 shadow-rose-950/60'
                              : 'bg-[#15060c] border-rose-900/60 text-slate-300 hover:border-rose-800 hover:bg-[#1b0811]'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold flex items-center gap-1.5">
                              <span
                                className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                                  threeGroupMode === 3 ? 'bg-rose-500 text-white' : 'bg-slate-800 text-slate-400'
                                }`}
                              >
                                ۳
                              </span>
                              <span>انتخاب دستی تعداد صعودکننده‌ها</span>
                            </span>
                            <span className="text-[9px] px-2 py-0.5 rounded bg-amber-950/80 border border-amber-800/80 text-amber-300 font-bold shrink-0">
                              فیلدهای باز
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-400 leading-tight">
                            کاربر می‌تواند تعداد صعودی هر گروه را دستی تعیین کند (مجموع باید توان ۲ باشد)
                          </p>
                        </button>
                      </div>

                      {/* متن راهنما برای حالت ۱ */}
                      {threeGroupMode === 1 && (
                        <div className="p-2.5 rounded-lg bg-emerald-950/50 border border-emerald-800/80 text-emerald-200 text-xs flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                          <span className="leading-relaxed">
                            در این حالت، سیستم به صورت خودکار ۲ تیم اول هر گروه و ۲ تیم برتر سوم را صعود میدهد.
                          </span>
                        </div>
                      )}

                      {/* پیام راهنما در صورت عدم انتخاب هیچ حالتی */}
                      {threeGroupMode === null && (
                        <div className="p-2.5 rounded-lg bg-amber-950/40 border border-amber-800/60 text-amber-300 text-xs flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                          <span className="leading-relaxed">
                            هیچ حالتی به صورت پیش‌فرض انتخاب نشده است. لطفاً حالت ۱ (برترین‌های سوم) یا حالت ۲/۳ (تنظیم دستی / میانبر ظرفیت) را انتخاب کنید.
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* فیلدهای تعیین سهمیه صعود هر گروه */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {currentGroupLetters.map((code) => {
                      const currentCount = numberOfGroups === 3 && threeGroupMode === 1
                        ? 2
                        : (groupAdvanceSettings?.[code] ?? 2);
                      const pCount = groupPlayerCounts[code] || 0;
                      const hasOverflow = !!groupErrors[code];
                      const isFieldDisabled = numberOfGroups === 3 && (threeGroupMode === 1 || threeGroupMode === null);

                      return (
                        <div
                          key={code}
                          className={`border rounded-lg p-2.5 flex flex-col justify-between gap-1.5 transition-all ${
                            hasOverflow
                              ? 'border-red-600/80 shadow-md shadow-red-950/30 bg-[#0f0407]'
                              : isFieldDisabled
                              ? 'border-slate-800 bg-[#0c0407] opacity-60'
                              : 'border-rose-900/60 bg-[#0f0407]'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-xs font-bold text-white flex items-center gap-1.5">
                              <span
                                className={`w-5 h-5 rounded text-xs font-mono font-bold flex items-center justify-center border ${
                                  isFieldDisabled
                                    ? 'bg-slate-900 text-slate-400 border-slate-700'
                                    : 'bg-rose-950 text-rose-300 border-rose-800'
                                }`}
                              >
                                {code}
                              </span>
                              <span>گروه {code}</span>
                            </span>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#1e0a12] text-rose-300 border border-rose-900/60 font-semibold shrink-0">
                              {pCount} بازیکن
                            </span>
                          </div>

                          <div>
                            <label className="block text-[10px] text-slate-400 mb-1">
                              {numberOfGroups === 3 && threeGroupMode === 1
                                ? 'سهمیه مستقیم صعود:'
                                : 'تعداد صعودی از این گروه:'}
                            </label>
                            <select
                              value={currentCount}
                              disabled={isFieldDisabled}
                              onChange={(e) => {
                                sound.playClick();
                                onUpdateGroupAdvanceCount?.(code, parseInt(e.target.value, 10));
                              }}
                              className={`w-full border rounded-md py-1.5 px-2 text-xs font-mono font-bold outline-none transition-all ${
                                isFieldDisabled
                                  ? 'bg-slate-900/80 border-slate-700/60 text-slate-400 cursor-not-allowed'
                                  : hasOverflow
                                  ? 'bg-red-950/20 border-red-500 focus:border-red-500 text-red-200 cursor-pointer'
                                  : 'bg-[#1b0811] border-rose-800/80 focus:border-rose-500 text-white cursor-pointer'
                              }`}
                            >
                              {Array.from({ length: Math.max(8, pCount || 1) }, (_, idx) => idx + 1).map((n) => (
                                <option key={n} value={n}>
                                  {n} نفر {numberOfGroups === 3 && threeGroupMode === 1 && n === 2 ? '(مستقیم)' : ''}
                                </option>
                              ))}
                            </select>

                            {numberOfGroups === 3 && threeGroupMode === 1 && (
                              <p className="text-[9px] text-emerald-400/90 mt-1 leading-tight">
                                ۲ تیم اول صعود مستقیم دارند.
                              </p>
                            )}

                            {hasOverflow && (
                              <p className="text-[10px] text-red-400 font-medium mt-1 leading-tight flex items-center gap-1">
                                <AlertCircle className="w-3 h-3 shrink-0" />
                                <span>{groupErrors[code]}</span>
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* پیش‌نمایش زنده در پایین صفحه تنظیمات گروه‌ها */}
                  <div
                    className={`p-3 rounded-lg border text-xs font-medium transition-all flex flex-col gap-1.5 ${
                      numberOfGroups === 3 && threeGroupMode === 1
                        ? 'bg-emerald-950/40 border-emerald-700/60 text-emerald-300'
                        : isThreeGroupsWaitingSelection
                        ? 'bg-amber-950/40 border-amber-700/60 text-amber-300'
                        : isAdvanceCountValid
                        ? 'bg-emerald-950/40 border-emerald-700/60 text-emerald-300'
                        : 'bg-rose-950/50 border-rose-600/80 text-rose-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 font-bold">
                        {numberOfGroups === 3 && threeGroupMode === 1 ? (
                          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                        ) : isThreeGroupsWaitingSelection ? (
                          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                        ) : isAdvanceCountValid ? (
                          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                        )}
                        <span>
                          {numberOfGroups === 3 && threeGroupMode === 1
                            ? 'مجموع صعودی‌ها: ۸ نفر (معتبر است - ۲ تیم اول هر گروه + ۲ تیم برتر سوم)'
                            : isThreeGroupsWaitingSelection
                            ? 'مجموع صعودی‌ها: تعیین‌نشده (لطفاً یکی از حالت‌های ۱ یا ۳ را انتخاب کنید)'
                            : isAdvanceCountValid
                            ? `مجموع صعودی‌ها: ${totalAdvancing} نفر (معتبر است)`
                            : hasAnyGroupOverflow
                            ? `مجموع صعودی‌ها: ${totalAdvancing} نفر (معتبر نیست - خطا در سهمیه گروه‌ها)`
                            : `مجموع صعودی‌ها: ${totalAdvancing} نفر (معتبر نیست - باید ${getNearestPowerOfTwoHint(totalAdvancing)} باشد)`}
                        </span>
                      </div>
                      <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-black/40 border border-white/10">
                        {numberOfGroups === 3 && threeGroupMode === 1
                          ? 'استاندارد حذفی (۸ تیم)'
                          : isThreeGroupsWaitingSelection
                          ? 'منتظر انتخاب حالت'
                          : isAdvanceCountValid
                          ? 'استاندارد حذفی'
                          : 'غیرمجاز'}
                      </span>
                    </div>

                    {numberOfGroups === 3 && threeGroupMode === 1 ? (
                      <p className="text-[11px] text-emerald-300 leading-relaxed border-t border-emerald-900/60 pt-1.5 font-normal">
                        در این حالت، سیستم به صورت خودکار ۲ تیم اول هر گروه و ۲ تیم برتر سوم را صعود میدهد.
                      </p>
                    ) : isThreeGroupsWaitingSelection ? (
                      <p className="text-[11px] text-amber-300 leading-relaxed border-t border-amber-900/60 pt-1.5 font-normal">
                        هیچ حالتی به صورت پیش‌فرض انتخاب نشده است. لطفاً حالت ۱ (برترین‌های سوم) یا حالت ۳ (تنظیم دستی) را انتخاب کنید.
                      </p>
                    ) : !isAdvanceCountValid ? (
                      <p className="text-[11px] text-rose-300 leading-relaxed border-t border-rose-900/60 pt-1.5 font-normal">
                        {hasAnyGroupOverflow
                          ? 'تعداد صعودی نمیتواند بیشتر از تعداد بازیکنان گروه باشد.'
                          : getKnockoutCountErrorMessage(totalAdvancing)}
                      </p>
                    ) : null}
                  </div>
                </div>

                <div className="mt-3 p-3 bg-[#0d0407]/80 rounded-lg border border-rose-950/80 text-xs space-y-1.5">
                  <div className="flex justify-between text-slate-300">
                    <span>تعداد بازیکنان ثبت‌شده:</span>
                    <span className="font-mono tabular-nums font-bold text-rose-400">
                      {players.length} نفر
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>حداقل بازیکن مورد نیاز:</span>
                    <span className="font-mono tabular-nums">
                      {minPlayersNeeded} نفر ({numberOfGroups === 3 && threeGroupMode === 1 ? '۸ تیم صعودکننده' : `${numberOfGroups} گروه × ۲`})
                    </span>
                  </div>
                  {players.length > 0 && (
                    <div className="flex justify-between text-slate-400">
                      <span>توزیع در گروه‌ها:</span>
                      <span className="font-mono tabular-nums text-rose-300 font-semibold">
                        ~{(players.length / numberOfGroups).toFixed(1)} بازیکن در هر گروه
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Launch Group Tournament CTA */}
              <div className="pt-2">
                <button
                  type="button"
                  disabled={!canStart}
                  onClick={() => {
                    if (isThreeGroupsWaitingSelection) {
                      sound.playClick();
                      setErrorMsg('لطفاً ابتدا یکی از حالت‌های صعود ۳ گروه (حالت ۱ یا ۳) را انتخاب کنید.');
                      return;
                    }
                    if (!isAdvanceCountValid) {
                      sound.playClick();
                      setErrorMsg(
                        hasAnyGroupOverflow
                          ? 'تعداد صعودی نمیتواند بیشتر از تعداد بازیکنان گروه باشد.'
                          : getKnockoutCountErrorMessage(totalAdvancing)
                      );
                      return;
                    }
                    sound.playWhistle();
                    onStartTournament();
                  }}
                  className={`w-full py-4 px-5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2.5 transition-all shadow-xl active:scale-[0.98] ${
                    canStart
                      ? 'bg-app-primary hover:bg-app-primary-hover text-white cursor-pointer shadow-lg'
                      : 'bg-app-surface text-app-text-muted/50 cursor-not-allowed border border-app-border'
                  }`}
                >
                  <Shuffle className="w-4 h-4" />
                  <span>قرعه‌کشی و شروع رسمی کاپ گروهی PES 2021</span>
                </button>

                {isThreeGroupsWaitingSelection ? (
                  <p className="text-[11px] text-amber-400/90 text-center mt-1.5 font-medium">
                    برای شروع کاپ، لطفاً یکی از حالت‌های صعود ۳ گروه (حالت ۱ یا ۳) را انتخاب کنید.
                  </p>
                ) : !isAdvanceCountValid ? (
                  <p className="text-[11px] text-rose-400 text-center mt-1.5 font-medium leading-relaxed">
                    {hasAnyGroupOverflow
                      ? 'تعداد صعودی نمیتواند بیشتر از تعداد بازیکنان گروه باشد.'
                      : getKnockoutCountErrorMessage(totalAdvancing)}
                  </p>
                ) : !canStart ? (
                  <p className="text-[11px] text-amber-400/90 text-center mt-1.5">
                    برای شروع کاپ با {numberOfGroups} گروه، حداقل به {minPlayersNeeded - players.length} بازیکن دیگر نیاز است.
                  </p>
                ) : null}
              </div>
            </div>
          ) : (
            /* Knockout Stage Settings (Single or Double Elimination) */
            <div className="lg:col-span-5 bg-app-surface p-4 rounded-xl border border-app-border flex flex-col justify-between space-y-4 text-app-text">
              <div>
                <label className="block text-xs font-semibold text-app-text mb-2 flex items-center gap-1.5">
                  <GitBranch className="w-4 h-4 text-app-primary" />
                  <span>
                    {tournamentFormat === 'knockout_single'
                      ? 'تنظیمات مسابقات حذفی تک (تک‌بازی مستقیم - شروع از ۱/۳۲ نهایی)'
                      : tournamentFormat === 'knockout_black'
                      ? 'تنظیمات حالت بلک (مرحله ۱ تک‌حذفی + انتخاب فرمت در مراحل بعد)'
                      : 'تنظیمات مسابقات حذفی دوگانه (Double Elimination - Bo3)'}
                  </span>
                </label>

                {/* Dynamic Knockout Progression Roadmap (64 -> 32 -> 16 -> 8 -> 4 -> Final) */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      <span>مسیر صعود مرحله‌به‌مرحله (شروع از مرحله ۱/۳۲ نهایی):</span>
                    </span>
                    <span className="text-[11px] font-mono text-rose-400 font-bold">
                      {players.length} بازیکن ثبت‌شده
                    </span>
                  </div>

                  <div className="bg-[#0b0305]/90 p-3 rounded-xl border border-rose-950 space-y-2">
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 scrollbar-thin">
                      {progressionStages.map((stg, idx) => (
                        <React.Fragment key={stg.teams}>
                          <div className="flex flex-col items-center p-2 rounded-lg bg-[#18070e] border border-rose-900/60 min-w-[125px] shrink-0 text-center">
                            <span className="text-[11px] font-bold text-white">
                              {stg.label}
                            </span>
                            <span className="text-[10px] text-rose-400 font-mono font-semibold mt-0.5">
                              {stg.teams} تیم ({stg.matches} مسابقه)
                            </span>
                            <span className="text-[9px] text-slate-400">
                              صعود {stg.advance} نفر به دور بعد
                            </span>
                          </div>
                          {idx < progressionStages.length - 1 && (
                            <ArrowLeft className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                          )}
                        </React.Fragment>
                      ))}
                      <ArrowLeft className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <div className="flex flex-col items-center p-2 rounded-lg bg-gradient-to-br from-amber-500/20 to-yellow-500/10 border border-amber-500/40 min-w-[95px] shrink-0 text-center">
                        <Trophy className="w-4 h-4 text-amber-400 mb-0.5" />
                        <span className="text-[11px] font-bold text-amber-300">
                          قهرمان جام PES
                        </span>
                      </div>
                    </div>

                    <div className="text-[10px] text-slate-300 bg-black/50 p-2 rounded-lg border border-slate-800 leading-relaxed">
                      ⚡ <strong>مسیر صعود:</strong> مسابقات از مرحله ۱/۳۲ نهایی (۶۴ تیم / ۳۲ مسابقه) آغاز می‌شود؛ ۳۲ برنده به ۱/۱۶ نهایی صعود می‌کنند و پس از هر مرحله اسامی صعودکنندگان با قرعه‌کشی تصادفی (Fisher-Yates) جفت می‌شوند تا فینال.
                    </div>
                  </div>
                </div>

                {/* Tournament Format Info Box */}
                <div className="mt-4 p-3 bg-[#17060e] rounded-xl border border-rose-900/60 space-y-2 text-xs">
                  <div className="flex items-center gap-2 text-rose-300 font-bold">
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                    <span>
                      {tournamentFormat === 'knockout_single'
                        ? 'فرمت مسابقات: تک‌بازی حذفی مستقیم (بدون Bo3)'
                        : tournamentFormat === 'knockout_black'
                        ? 'فرمت مسابقات: حالت بلک (مرحله اول تک‌حذفی + انتخاب فرمت در مراحل بعد)'
                        : 'فرمت مسابقات: حذفی دوگانه بهترین از سه (Double Elimination - Bo3)'}
                    </span>
                  </div>

                  <ul className="text-slate-300 space-y-1.5 leading-relaxed text-[11px]">
                    {tournamentFormat === 'knockout_single' ? (
                      <>
                        <li className="flex items-start gap-1.5">
                          <span className="text-rose-400 font-bold">•</span>
                          <span>
                            <strong>حذف با اولین باخت:</strong> هر بازیکن با اولین باخت در مسابقه بلافاصله از تورنمنت حذف می‌شود و برنده مستقیم به مرحله بعد صعود می‌کند (دیگر سری Bo3 وجود ندارد).
                          </span>
                        </li>
                        <li className="flex items-start gap-1.5">
                          <span className="text-rose-400 font-bold">•</span>
                          <span>
                            <strong>ممنوعیت قطعی نتیجه تساوی:</strong> هیچ مسابقه‌ای نمی‌تواند مساوی تمام شود. در صورت تساوی در وقت اصلی، ضربات پنالتی حتماً برنده را مشخص می‌کند.
                          </span>
                        </li>
                        <li className="flex items-start gap-1.5">
                          <span className="text-rose-400 font-bold">•</span>
                          <span>
                            <strong>قرعه‌کشی رندوم در پایان هر مرحله:</strong> چینش بازی‌ها از پیش ثابت نیست؛ پس از اتمام مسابقات هر دور، برندگان در استخر قرعه‌کشی به صورت تصادفی دو‌به‌دو جفت می‌شوند.
                          </span>
                        </li>
                      </>
                    ) : tournamentFormat === 'knockout_black' ? (
                      <>
                        <li className="flex items-start gap-1.5">
                          <span className="text-amber-400 font-bold">•</span>
                          <span>
                            <strong>مرحله اول کاملاً تک‌حذفی:</strong> تمام مسابقات دور اول بین کلیه بازیکنان ثبت‌نام شده به صورت تک‌بازی مستقیم و بدون Bo3 برگزار می‌شوند و بازنده بلافاصله حذف می‌گردد.
                          </span>
                        </li>
                        <li className="flex items-start gap-1.5">
                          <span className="text-amber-400 font-bold">•</span>
                          <span>
                            <strong>انتخاب فرمت هوشمند در پایان مرحله ۱:</strong> پس از ثبت نتایج مرحله اول، وقتی دکمه قرعه‌کشی مرحله بعد را می‌زنید، یک مودال اختصاصی نمایش داده می‌شود تا تعیین کنید مراحل بعد تک‌بازی باشند یا Bo3.
                          </span>
                        </li>
                        <li className="flex items-start gap-1.5">
                          <span className="text-amber-400 font-bold">•</span>
                          <span>
                            <strong>ادامه پایدار تا فینال:</strong> فرمتی که در مودال انتخاب می‌کنید برای تمام مراحل باقیمانده تا تعیین قهرمان نهایی اعمال خواهد شد.
                          </span>
                        </li>
                      </>
                    ) : (
                      <>
                        <li className="flex items-start gap-1.5">
                          <span className="text-rose-400 font-bold">•</span>
                          <span>
                            <strong>فرمت Bo3:</strong> هر مسابقه تا رسیدن یکی از بازیکنان به ۲ برد (2-0 یا 2-1) ادامه می‌یابد.
                          </span>
                        </li>
                        <li className="flex items-start gap-1.5">
                          <span className="text-rose-400 font-bold">•</span>
                          <span>
                            <strong>حذف با دو باخت:</strong> بازیکنان با باخت اول به جدول بازندگان (Losers Bracket) منتقل شده و با باخت دوم حذف می‌شوند.
                          </span>
                        </li>
                      </>
                    )}
                  </ul>
                </div>

                {/* Quick 64 Player Preset Loader within Knockout Panel */}
                {players.length < 64 && (
                  <div className="flex items-center justify-between gap-2 p-2.5 bg-gradient-to-r from-amber-950/40 to-rose-950/40 rounded-xl border border-amber-800/40">
                    <div className="text-[11px] text-amber-200">
                      💡 تمایل دارید جدول کامل ۶۴ نفره (۳۲ مسابقه در ۱/۳۲) را بلافاصله تست کنید؟
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        sound.playClick();
                        onLoadPresets(PRESET_PLAYERS.slice(0, 64));
                      }}
                      className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-lg shrink-0 transition-colors cursor-pointer"
                    >
                      تکمیل به ۶۴ بازیکن
                    </button>
                  </div>
                )}

                {/* Status summary box */}
                <div className="mt-3 p-3 bg-[#0d0407]/90 rounded-lg border border-rose-950/80 text-xs space-y-1.5">
                  <div className="flex justify-between text-slate-300">
                    <span>تعداد بازیکنان ثبت‌شده:</span>
                    <span className="font-mono tabular-nums font-bold text-rose-400">
                      {players.length} نفر
                    </span>
                  </div>
                  {players.length >= 2 && (
                    <>
                      <div className="flex justify-between text-slate-400">
                        <span>ساختار براکت و مراحل:</span>
                        <span className="font-mono tabular-nums text-slate-200">
                          {calculateKnockoutTree(players.length).nextPowerOfTwo} تیمی ({calculateKnockoutTree(players.length).totalRounds} مرحله تا فینال)
                        </span>
                      </div>
                      {calculateKnockoutTree(players.length).numByes > 0 && (
                        <div className="text-[11px] text-amber-300 bg-amber-950/40 p-2 rounded border border-amber-800/60 leading-relaxed">
                          💡 <strong>استراحت دور اول (BYE):</strong> با توجه به ثبت‌نام {players.length} بازیکن، به قید قرعه <strong>{calculateKnockoutTree(players.length).numByes} بازیکن</strong> در دور اول استراحت دارند و مستقیم به مرحله ۱/۱۶ نهایی صعود می‌کنند تا جدول متوازن گردد.
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Launch Tournament CTA */}
              <div className="pt-2">
                <button
                  type="button"
                  disabled={players.length < 2}
                  onClick={() => {
                    sound.playWhistle();
                    onStartKnockoutTournament();
                  }}
                  className={`w-full py-4 px-5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2.5 transition-all shadow-xl active:scale-[0.98] ${
                    players.length >= 2
                      ? 'bg-app-primary hover:bg-app-primary-hover text-white cursor-pointer shadow-lg'
                      : 'bg-app-surface text-app-text-muted/50 cursor-not-allowed border border-app-border'
                  }`}
                >
                  <Shuffle className="w-4 h-4" />
                  <span>
                    {tournamentFormat === 'knockout_single'
                      ? 'قرعه‌کشی رندوم و شروع مسابقات حذفی تک (شروع از ۱/۳۲ نهایی)'
                      : tournamentFormat === 'knockout_black'
                      ? 'قرعه‌کشی رندوم و شروع مسابقات حالت بلک (Black Mode)'
                      : 'قرعه‌کشی رندوم و شروع مسابقات حذفی دوگانه (Bo3)'}
                  </span>
                </button>

                {players.length < 2 && (
                  <p className="text-[11px] text-amber-400/90 text-center mt-1.5">
                    برای شروع مسابقات حذفی حداقل ۲ بازیکن با فرم بالا ثبت‌نام کنید.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Registered Players List */}
      <div className="card-stadium p-5 rounded-xl border border-app-border bg-app-surface text-app-text">
        <div className="flex items-center justify-between border-b border-app-border pb-3 mb-4">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-app-text">
              لیست شرکت‌کنندگان ثبت شده
            </h3>
            <span className="text-xs text-slate-500 font-mono tabular-nums">
              ({players.length} نفر)
            </span>
          </div>

          <div className="flex items-center gap-2">
            {players.length === 0 && (
              <button
                type="button"
                onClick={() => {
                  sound.playClick();
                  onLoadPresets(PRESET_PLAYERS.slice(0, Math.min(16, maxCapacity)));
                }}
                className="flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 bg-amber-950/40 hover:bg-amber-950/70 border border-amber-800/60 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>بارگذاری نمونه بازیکنان ({Math.min(16, maxCapacity)} بازیکن)</span>
              </button>
            )}

            {players.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  sound.playClick();
                  onClearAllPlayers();
                }}
                className="flex items-center gap-1 text-xs text-rose-400 hover:text-rose-300 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>پاکسازی کل لیست</span>
              </button>
            )}
          </div>
        </div>

        {players.length === 0 ? (
          <div className="text-center py-8 text-slate-500 text-xs">
            هنوز بازیکنی به تورنمنت اضافه نشده است. می‌توانید با فرم بالا نام‌ها را وارد کنید یا روی بارگذاری نمونه بازیکنان کلیک کنید.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
            {players.map((p, idx) => {
              const displayName = selectedGameType === 'billiards'
                ? p.name.replace(/\s*\([^)]*\)/g, '').trim()
                : p.name;
              const displayTeam = selectedGameType === 'billiards' ? null : p.team;
              const uid = p.uniqueId || normalizeName(p.name);
              const totalSlots = slotCountsMap[uid] || 1;
              const isMultiEntry = selectedGameType === 'pes' && totalSlots > 1;

              return (
                <div
                  key={p.id}
                  className={`flex items-center justify-between p-2.5 rounded-lg group transition-all text-app-text ${
                    selectedGameType === 'billiards'
                      ? 'bg-[#051a10] border border-emerald-900/60 hover:border-emerald-500/60'
                      : isMultiEntry
                      ? 'bg-amber-950/20 border border-amber-500/50 hover:border-amber-400'
                      : 'bg-app-bg border border-app-border hover:border-app-primary/60'
                  }`}
                >
                  <div className="flex items-center gap-2.5 overflow-hidden">
                    <div className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0 text-xs font-mono font-bold ${
                      selectedGameType === 'billiards'
                        ? 'bg-emerald-900/40 border border-emerald-700/60 text-emerald-300'
                        : isMultiEntry
                        ? 'bg-amber-950 border border-amber-700/80 text-amber-300'
                        : 'bg-app-surface border border-app-border text-app-primary'
                    }`}>
                      {idx + 1}
                    </div>
                    <div className="truncate">
                      <div className="flex items-center gap-1.5 truncate">
                        <span className="text-xs font-bold text-app-text truncate">
                          {displayName}
                        </span>
                        {isMultiEntry && (
                          <span
                            className="px-1.5 py-0.5 rounded-full text-[10px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/50 flex items-center gap-1 shrink-0"
                            title={`این شخص دارای ${totalSlots} سهم در تورنمنت است`}
                          >
                            <Users className="w-3 h-3 text-amber-400" />
                            {totalSlots} سهم
                          </span>
                        )}
                      </div>
                      {p.uniqueId && (
                        <div className="text-[10px] text-white font-mono truncate">
                          {p.uniqueId}
                        </div>
                      )}
                      {displayTeam && (
                        <div className="text-[10px] text-slate-400 truncate">
                          {displayTeam}
                        </div>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      sound.playClick();
                      onRemovePlayer(p.id);
                    }}
                    title="حذف بازیکن"
                    className="opacity-60 hover:opacity-100 text-rose-400 hover:bg-rose-950/50 p-1.5 rounded transition-all shrink-0 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
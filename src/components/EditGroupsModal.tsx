import React, { useState } from 'react';
import { Group, Player, GameType } from '../types/tournament';
import {
  X,
  ArrowLeftRight,
  Users,
  Layers,
  Dices,
  Lock,
  Check,
  CheckCircle,
  AlertCircle,
  HelpCircle,
  UserPlus,
  Plus,
  Trash2,
  Trophy,
} from 'lucide-react';
import { sound } from '../utils/audio';
import {
  isValidKnockoutCount,
  getNearestPowerOfTwoHint,
  getKnockoutCountErrorMessage,
} from '../utils/tournament';

interface EditGroupsModalProps {
  isOpen: boolean;
  onClose: () => void;
  groups: Group[];
  playersMap: Map<string, Player>;
  numberOfGroups: number;
  totalPlayersCount: number;
  hasStartedAnyMatch: boolean;
  advancementRule?: 'bestThirds' | 'proportional' | 'manual' | null;
  gameType?: GameType;
  onChangeNumberOfGroups: (newCount: number, rule?: 'bestThirds' | 'proportional' | 'manual' | null) => void;
  onShuffleGroups: () => void;
  onSwapPlayerGroup: (playerId: string, targetGroupId: string) => void;
  onAddPlayer: (player: { name: string; team?: string; targetGroupId?: string }) => void;
  onRemovePlayer: (playerId: string) => void;
  onUpdateGroupAdvanceCount?: (groupCode: string, count: number) => void;
}

const SUPPORTED_GROUP_COUNTS = [2, 3, 4, 8];

export const EditGroupsModal: React.FC<EditGroupsModalProps> = ({
  isOpen,
  onClose,
  groups,
  playersMap,
  numberOfGroups,
  totalPlayersCount,
  hasStartedAnyMatch,
  advancementRule = 'bestThirds',
  gameType = 'pes',
  onChangeNumberOfGroups,
  onShuffleGroups,
  onSwapPlayerGroup,
  onAddPlayer,
  onRemovePlayer,
  onUpdateGroupAdvanceCount,
}) => {
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [newPlayerTeam, setNewPlayerTeam] = useState('');
  const [targetGroupSelect, setTargetGroupSelect] = useState('auto');

  // مجموع کل صعودی‌ها از تمام گروه‌ها
  const totalAdvancing = React.useMemo(() => {
    return groups.reduce((acc, g) => acc + (g.advanceCount ?? 2), 0);
  }, [groups]);

  // بررسی عدم تجاوز تعداد صعودی از تعداد کل بازیکنان گروه
  const hasAnyGroupOverflow = React.useMemo(() => {
    return groups.some((g) => (g.advanceCount ?? 2) > g.playerIds.length);
  }, [groups]);

  // اعتبارسنجی توان ۲ بودن تعداد صعودی‌ها (2، 4، 8، 16، 32 یا 64) و عدم تجاوز از بازیکنان
  const isAdvanceCountValid = isValidKnockoutCount(totalAdvancing) && !hasAnyGroupOverflow;

  // بررسی تکراری نبودن نام بازیکن جدید
  const isNameDuplicate = React.useMemo(() => {
    const trimmed = newPlayerName.trim().replace(/\s+/g, ' ').toLowerCase();
    if (!trimmed) return false;
    return Array.from(playersMap.values()).some(
      (p) => p.name.trim().replace(/\s+/g, ' ').toLowerCase() === trimmed
    );
  }, [newPlayerName, playersMap]);

  // محاسبه تعداد صعودکنندگان بر اساس حالت تناسبی در ۳ گروه
  const proportionalAdvanceCount = React.useMemo(() => {
    return groups.reduce((acc, g) => {
      return acc + (g.playerIds.length >= 5 ? 3 : 2);
    }, 0);
  }, [groups]);

  const isProportionalExceeding8 = proportionalAdvanceCount > 8;

  React.useEffect(() => {
    if (isOpen && isProportionalExceeding8 && advancementRule === 'proportional') {
      onChangeNumberOfGroups(3, 'bestThirds');
    }
  }, [isOpen, isProportionalExceeding8, advancementRule, onChangeNumberOfGroups]);

  React.useEffect(() => {
    if (!isOpen) {
      setSelectedPlayerId(null);
      setFeedback(null);
      setNewPlayerName('');
      setNewPlayerTeam('');
      setTargetGroupSelect('auto');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const showFeedback = (text: string, type: 'success' | 'error' = 'success') => {
    setFeedback({ text, type });
    setTimeout(() => {
      setFeedback(null);
    }, 4000);
  };

  const isBilliards = gameType === 'billiards';

  const handleAddNewPlayer = (e: React.FormEvent) => {
    e.preventDefault();
    if (hasStartedAnyMatch) return;
    const rawTrimmed = newPlayerName.trim();
    const trimmed = isBilliards ? rawTrimmed.replace(/\s*\([^)]*\)/g, '').trim() : rawTrimmed;
    if (!trimmed) {
      sound.playClick();
      showFeedback('لطفاً نام بازیکن را وارد کنید.', 'error');
      return;
    }

    if (isNameDuplicate) {
      sound.playClick();
      showFeedback(`خطا: نام «${trimmed}» تکراری است. بازیکنی با این نام از قبل در تورنمنت حضور دارد.`, 'error');
      return;
    }

    sound.playWhistle();
    onAddPlayer({
      name: trimmed,
      team: isBilliards ? undefined : (newPlayerTeam.trim() || undefined),
      targetGroupId: targetGroupSelect === 'auto' ? undefined : targetGroupSelect,
    });

    const targetGroup = groups.find((g) => g.id === targetGroupSelect);
    const destName = targetGroup ? targetGroup.name : 'متوازن‌ترین گروه';
    showFeedback(`بازیکن «${trimmed}» با موفقیت به ${destName} افزوده شد و مسابقات بازتولید گردید.`, 'success');
    setNewPlayerName('');
    setNewPlayerTeam('');
  };

  const handleRemovePlayer = (pid: string) => {
    if (hasStartedAnyMatch) return;

    if (totalPlayersCount <= numberOfGroups * 2) {
      sound.playClick();
      showFeedback(`امکان حذف وجود ندارد؛ برای برگزاری ${numberOfGroups} گروه حداقل ${numberOfGroups * 2} بازیکن نیاز است.`, 'error');
      return;
    }

    const currentGroup = groups.find((g) => g.playerIds.includes(pid));
    if (!currentGroup || currentGroup.playerIds.length <= 2) {
      sound.playClick();
      showFeedback('امکان حذف وجود ندارد؛ هر گروه باید حداقل ۲ بازیکن داشته باشد.', 'error');
      return;
    }

    const player = playersMap.get(pid);
    sound.playWhistle();
    onRemovePlayer(pid);
    if (selectedPlayerId === pid) {
      setSelectedPlayerId(null);
    }
    showFeedback(`بازیکن «${player?.name || 'ناشناس'}» حذف شد و جدول مسابقات بازتولید گردید.`, 'success');
  };

  const handleGroupClick = (groupId: string) => {
    if (hasStartedAnyMatch) return;
    if (!selectedPlayerId) return;

    // Check if player is already in this group
    const currentGroup = groups.find((g) => g.playerIds.includes(selectedPlayerId));
    if (currentGroup?.id === groupId) {
      setSelectedPlayerId(null);
      return;
    }

    sound.playClick();
    onSwapPlayerGroup(selectedPlayerId, groupId);
    const player = playersMap.get(selectedPlayerId);
    const targetGroup = groups.find((g) => g.id === groupId);
    showFeedback(`بازیکن «${player?.name || 'ناشناس'}» به ${targetGroup?.name || 'گروه جدید'} منتقل شد.`);
    setSelectedPlayerId(null);
  };

  const handleSelectGroupCount = (count: number) => {
    if (hasStartedAnyMatch) return;
    if (count === numberOfGroups) return;
    if (totalPlayersCount < count * 2) return;

    sound.playWhistle();
    onChangeNumberOfGroups(count, count === 3 ? advancementRule : undefined);
    setSelectedPlayerId(null);
    showFeedback(`تعداد گروه‌ها به ${count} گروه تغییر یافت و بازی‌ها بازتولید شدند.`);
  };

  const handleRuleChange = (rule: 'bestThirds' | 'proportional') => {
    if (hasStartedAnyMatch) return;
    sound.playClick();
    onChangeNumberOfGroups(3, rule);
    showFeedback('قانون صعود مرحله گروهی بروزرسانی شد.');
  };

  const handleShuffle = () => {
    if (hasStartedAnyMatch) return;
    sound.playWhistle();
    onShuffleGroups();
    setSelectedPlayerId(null);
    showFeedback('قرعه‌کشی مجدد انجام شد و بازیکنان تصادفی پخش شدند.');
  };

  const selectedPlayer = selectedPlayerId ? playersMap.get(selectedPlayerId) : null;
  const selectedPlayerGroup = selectedPlayerId
    ? groups.find((g) => g.playerIds.includes(selectedPlayerId))
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="card-stadium w-full max-w-5xl rounded-2xl border border-app-border bg-app-surface text-app-text shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-app-border bg-app-surface">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-app-primary/20 border border-app-primary/40 flex items-center justify-center text-app-primary shrink-0">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-bold text-app-text">
                  ویرایش تعداد و ترکیب گروه‌ها
                </h2>
                {!hasStartedAnyMatch ? (
                  <span className="text-[10px] sm:text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-800/60 text-emerald-300">
                    قابل ویرایش (بازی‌ها هنوز شروع نشده)
                  </span>
                ) : (
                  <span className="text-[10px] sm:text-xs font-semibold px-2 py-0.5 rounded-full bg-rose-950/80 border border-rose-800/60 text-rose-300 flex items-center gap-1">
                    <Lock className="w-3 h-3" />
                    قفل شده (بازی‌ها آغاز شده است)
                  </span>
                )}
              </div>
              <p className="text-xs text-app-text-muted mt-0.5">
                تغییر تعداد گروه‌ها یا جابجایی دستی بازیکنان پیش از شروع اولین مسابقه
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              if (!isAdvanceCountValid) {
                sound.playClick();
                showFeedback('برای بستن پنجره ابتدا خطاهای بالا را برطرف کنید', 'error');
                return;
              }
              sound.playClick();
              onClose();
            }}
            disabled={!isAdvanceCountValid}
            aria-disabled={!isAdvanceCountValid}
            className={`p-1.5 border rounded-lg transition-colors ${
              !isAdvanceCountValid
                ? 'opacity-40 cursor-not-allowed text-app-text-muted bg-app-bg border-app-border'
                : 'text-app-text-muted hover:text-app-text bg-app-surface hover:bg-app-surface-hover border-app-border cursor-pointer'
            }`}
            title={!isAdvanceCountValid ? 'برای بستن یا تایید، ابتدا خطاهای بالا را برطرف کنید' : 'بستن پنجره'}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feedback alert toast */}
        {feedback && (
          <div
            className={`border-b text-xs px-4 py-2.5 text-center flex items-center justify-center gap-2 animate-fade-in font-medium ${
              feedback.type === 'error'
                ? 'bg-rose-950/90 border-rose-800/80 text-rose-200'
                : 'bg-emerald-950/90 border-emerald-800/80 text-emerald-200'
            }`}
          >
            {feedback.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            ) : (
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            )}
            <span>{feedback.text}</span>
          </div>
        )}

        {/* Scrollable Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-5">
          
          {/* Section 1: Number of Groups Selector */}
          <div className="bg-[#16060c] p-4 rounded-xl border border-rose-950/80 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-rose-950/50 pb-2.5">
              <div className="flex items-center gap-2 text-sm font-bold text-white">
                <Layers className="w-4 h-4 text-rose-400" />
                <span>تعیین تعداد گروه‌ها</span>
                <span className="text-xs text-rose-300 font-normal">
                  (در حال حاضر: {numberOfGroups} گروه)
                </span>
              </div>

              {!hasStartedAnyMatch && (
                <button
                  type="button"
                  onClick={handleShuffle}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-rose-200 bg-rose-950/80 hover:bg-rose-900/90 border border-rose-800/60 rounded-lg transition-colors cursor-pointer self-start sm:self-auto shadow-sm"
                  title="پخش مجدد بازیکنان به صورت تصادفی در گروه‌ها"
                >
                  <Dices className="w-3.5 h-3.5 text-rose-400" />
                  <span>قرعه‌کشی و پخش مجدد</span>
                </button>
              )}
            </div>

            {hasStartedAnyMatch ? (
              <div className="p-3 rounded-lg bg-rose-950/30 border border-rose-900/50 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>
                  مسابقات مرحله گروهی آغاز شده و حداقل نتیجه یک مسابقه ثبت شده است. برای تغییر تعداد یا ساختار گروه‌ها، ابتدا باید تورنمنت را ریست کنید.
                </span>
              </div>
            ) : (
              <>
                <p className="text-xs text-slate-400">
                  با تغییر تعداد گروه‌ها، بازیکنان فعلی ({totalPlayersCount} نفر) مجدداً بین گروه‌های جدید تقسیم شده و برنامه مسابقات هفته بازتولید می‌شود:
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {SUPPORTED_GROUP_COUNTS.map((count) => {
                    const isSelected = numberOfGroups === count;
                    const minPlayers = count * 2;
                    const isAllowed = totalPlayersCount >= minPlayers;

                    return (
                      <button
                        key={count}
                        type="button"
                        disabled={!isAllowed}
                        onClick={() => handleSelectGroupCount(count)}
                        className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center justify-center ${
                          isSelected
                            ? 'bg-rose-950/90 border-rose-500 text-white shadow-lg ring-1 ring-rose-500/50'
                            : isAllowed
                            ? 'bg-[#1a0810]/70 border-rose-950 hover:border-rose-700/70 text-slate-300 hover:text-white cursor-pointer'
                            : 'bg-slate-900/30 border-slate-900 text-slate-600 cursor-not-allowed opacity-60'
                        }`}
                      >
                        <div className="text-base sm:text-lg font-black font-mono">
                          {count} گروه
                        </div>
                        <div className="text-[10px] mt-0.5">
                          {isSelected ? (
                            <span className="text-rose-300 font-bold">انتخاب شده ✓</span>
                          ) : isAllowed ? (
                            <span className="text-slate-400">حداقل {minPlayers} بازیکن</span>
                          ) : (
                            <span className="text-rose-400">نیاز به {minPlayers} بازیکن</span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Advancement Rule Options if 3 Groups */}
                {numberOfGroups === 3 && (
                  <div className="mt-3 p-3 bg-[#1c0811] border border-rose-950 rounded-xl space-y-2 text-xs">
                    <div className="font-bold text-rose-300 flex items-center gap-1.5">
                      <HelpCircle className="w-3.5 h-3.5" />
                      <span>قانون تعیین تیم‌های صعود‌کننده در فرمت ۳ گروه:</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-1">
                      <label className="flex items-start gap-2 p-2 rounded-lg bg-[#14050a] border border-rose-950/60 cursor-pointer hover:border-rose-800">
                        <input
                          type="radio"
                          name="advancementRule"
                          checked={advancementRule === 'bestThirds'}
                          onChange={() => handleRuleChange('bestThirds')}
                          className="mt-0.5 accent-rose-500"
                        />
                        <div>
                          <div className="font-bold text-slate-200">حالت ۱: برترین‌های سوم (استاندارد)</div>
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            ۲ تیم اول هر گروه + ۲ تیم برتر از میان رده‌های سوم (مجموعاً ۸ تیم در ۱/۴ نهایی)
                          </div>
                        </div>
                      </label>

                      <label className={`flex items-start gap-2 p-2 rounded-lg bg-[#14050a] border border-rose-950/60 ${isProportionalExceeding8 ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer hover:border-rose-800'}`}>
                        <input
                          type="radio"
                          name="advancementRule"
                          checked={advancementRule === 'proportional'}
                          onChange={() => !isProportionalExceeding8 && handleRuleChange('proportional')}
                          disabled={isProportionalExceeding8}
                          className="mt-0.5 accent-rose-500"
                        />
                        <div>
                          <div className="font-bold text-slate-200">حالت ۲: متناسب با ظرفیت گروه‌ها</div>
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            گروه‌های ۵ یا ۶ نفره ۳ صعود، و گروه‌های ۴ نفره ۲ صعود مستقیم
                          </div>
                          {isProportionalExceeding8 && (
                            <div className="text-[10px] text-rose-400 mt-1 font-bold">
                              غیرفعال (باعث صعود {proportionalAdvanceCount} بازیکن &gt; ۸ نفر می‌شود)
                            </div>
                          )}
                        </div>
                      </label>
                    </div>
                  </div>
                )}

                {/* Information if 4 Groups */}
                {numberOfGroups === 4 && (
                  <div className="mt-3 p-3 bg-[#1c0811] border border-rose-950 rounded-xl space-y-1.5 text-xs">
                    <div className="font-bold text-rose-300 flex items-center gap-1.5">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                      <span>قانون صعود در فرمت ۴ گروه (دقیقاً ۸ بازیکن):</span>
                    </div>
                    <p className="text-slate-300 leading-relaxed">
                      ۲ نفر برتر هر گروه (A، B، C و D) مستقیماً به مرحله یک‌چهارم نهایی صعود می‌کنند (۴ گروه × ۲ = ۸ بازیکن). در تورنمنت ۴ گروهی، تیم‌های سوم صعود نخواهند کرد.
                    </p>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Section 2: Add New Player */}
          {!hasStartedAnyMatch && (
            <div className={`p-3.5 sm:p-4 rounded-xl space-y-3 border ${
              isBilliards
                ? 'bg-[#051a10] border-emerald-900/80'
                : 'bg-[#15060c] border-rose-950/90'
            }`}>
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-white">
                  <UserPlus className={`w-4 h-4 ${isBilliards ? 'text-emerald-400' : 'text-rose-400'}`} />
                  <span>{isBilliards ? 'افزودن بازیکن جدید به تورنمنت بیلیارد' : 'افزودن بازیکن جدید به تورنمنت'}</span>
                </div>
                <span className="text-[11px] text-slate-400">
                  تعداد فعلی: <span className={`font-mono font-bold ${isBilliards ? 'text-emerald-300' : 'text-rose-300'}`}>{totalPlayersCount}</span> بازیکن
                </span>
              </div>

              <form onSubmit={handleAddNewPlayer} className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-end">
                <div className={isBilliards ? 'sm:col-span-6' : 'sm:col-span-4'}>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[11px] text-slate-300">
                      {isBilliards ? 'نام بازیکن بیلیارد *' : 'نام بازیکن / گیمر *'}
                    </label>
                    {isNameDuplicate && (
                      <span className="text-[10px] text-rose-400 font-bold flex items-center gap-1 animate-pulse">
                        <AlertCircle className="w-3 h-3" />
                        نام تکراری است
                      </span>
                    )}
                  </div>
                  <input
                    type="text"
                    value={newPlayerName}
                    onChange={(e) => setNewPlayerName(e.target.value)}
                    placeholder={isBilliards ? 'مثال: آرش' : 'مثال: سامان'}
                    className={`w-full border rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 outline-none transition-all ${
                      isBilliards
                        ? 'bg-[#03150c] border-emerald-800/80 focus:border-emerald-400'
                        : 'bg-[#0d0407] border-slate-700 focus:border-rose-500'
                    } ${
                      isNameDuplicate
                        ? 'border-rose-500 focus:ring-1 focus:ring-rose-500 bg-rose-950/20 text-rose-200'
                        : ''
                    }`}
                  />
                </div>

                {!isBilliards && (
                  <div className="sm:col-span-3">
                    <label className="block text-[11px] text-slate-300 mb-1">نام تیم در PES 2021 (اختیاری)</label>
                    <input
                      type="text"
                      value={newPlayerTeam}
                      onChange={(e) => setNewPlayerTeam(e.target.value)}
                      placeholder="مثال: یوونتوس"
                      className="w-full bg-[#0d0407] border border-slate-700 focus:border-rose-500 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 outline-none transition-all"
                    />
                  </div>
                )}

                <div className={isBilliards ? 'sm:col-span-4' : 'sm:col-span-3'}>
                  <label className="block text-[11px] text-slate-300 mb-1">گروه مقصد</label>
                  <select
                    value={targetGroupSelect}
                    onChange={(e) => setTargetGroupSelect(e.target.value)}
                    className={`w-full border rounded-lg px-2.5 py-2 text-xs text-slate-200 outline-none cursor-pointer ${
                      isBilliards
                        ? 'bg-[#03150c] border-emerald-800/80 focus:border-emerald-400'
                        : 'bg-[#0d0407] border-slate-700 focus:border-rose-500'
                    }`}
                  >
                    <option value="auto">تخصیص خودکار (متوازن‌ترین گروه)</option>
                    {groups.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name} ({g.playerIds.length} بازیکن)
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <button
                    type="submit"
                    disabled={isNameDuplicate || !newPlayerName.trim()}
                    className={`w-full py-2 px-3 text-white font-bold text-xs rounded-lg transition-all shadow-md flex items-center justify-center gap-1.5 ${
                      isNameDuplicate || !newPlayerName.trim()
                        ? 'bg-slate-850 text-slate-500 border border-slate-800 cursor-not-allowed opacity-50 shadow-none'
                        : isBilliards
                        ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:brightness-110 shadow-emerald-950/50 cursor-pointer'
                        : 'bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 shadow-rose-950/50 cursor-pointer'
                    }`}
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>افزودن</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Section 3: Manual Player Swapping & Removal Between Groups */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-rose-950/60 pb-2.5">
              <div className="flex items-center gap-2 text-sm font-bold text-white">
                <Users className="w-4 h-4 text-rose-400" />
                <span>ترکیب و جابجایی دستی بازیکنان در گروه‌ها</span>
              </div>

              {selectedPlayer && (
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-emerald-300 font-bold bg-emerald-950/80 px-2.5 py-1 rounded-lg border border-emerald-800/60">
                    انتخاب شده برای جابجایی: {isBilliards ? selectedPlayer.name.replace(/\s*\([^)]*\)/g, '').trim() : selectedPlayer.name} ({selectedPlayerGroup?.name})
                  </span>
                  <button
                    type="button"
                    onClick={() => setSelectedPlayerId(null)}
                    className="text-slate-400 hover:text-white text-xs underline cursor-pointer"
                  >
                    انصراف
                  </button>
                </div>
              )}
            </div>

            {!hasStartedAnyMatch ? (
              <div className="text-xs text-slate-400 bg-[#16060a] border border-rose-950/50 p-2.5 rounded-lg flex items-center justify-between flex-wrap gap-2">
                <span>
                  💡 <span className="font-bold text-slate-300">راهنما:</span> برای انتقال بازیکن روی کارت او کلیک کرده سپس روی گروه مقصد بزنید. برای حذف بازیکن، از آیکون سطل زباله روی نام هر بازیکن استفاده کنید.
                </span>
                {selectedPlayerId && (
                  <span className="text-emerald-300 font-bold animate-pulse">
                    👈 حالا روی گروه مقصد کلیک کنید
                  </span>
                )}
              </div>
            ) : null}

            {/* Groups Grid */}
            <div
              className={`grid gap-4 ${
                groups.length === 2
                  ? 'grid-cols-1 md:grid-cols-2'
                  : groups.length === 3
                  ? 'grid-cols-1 md:grid-cols-3'
                  : groups.length === 4
                  ? 'grid-cols-1 md:grid-cols-2 xl:grid-cols-4'
                  : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
              }`}
            >
              {groups.map((group) => {
                const isTargetGroupForSelected =
                  selectedPlayerId && selectedPlayerGroup?.id !== group.id;

                return (
                  <div
                    key={group.id}
                    onClick={() => handleGroupClick(group.id)}
                    className={`border rounded-xl p-3.5 transition-all flex flex-col justify-between ${
                      hasStartedAnyMatch
                        ? 'border-app-border/80 bg-app-surface/50'
                        : isTargetGroupForSelected
                        ? 'border-emerald-500/80 bg-emerald-950/20 hover:bg-emerald-950/40 cursor-pointer shadow-lg shadow-emerald-950/30 ring-1 ring-emerald-500/50'
                        : 'border-app-border bg-app-surface'
                    }`}
                  >
                    <div>
                      {/* Group Header */}
                      <div className="flex items-center justify-between border-b border-app-border pb-2 mb-2.5">
                        <div className="flex items-center gap-1.5 font-bold text-app-text text-sm">
                          <span className="w-5 h-5 rounded bg-app-primary/20 border border-app-primary/40 text-app-primary flex items-center justify-center text-xs font-mono">
                            {group.code}
                          </span>
                          <span>{group.name}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[11px] font-mono text-slate-400 bg-black/40 px-2 py-0.5 rounded-full border border-rose-950">
                            {group.playerIds.length} بازیکن
                          </span>
                          {!hasStartedAnyMatch && (
                            <button
                              type="button"
                              title={`افزودن مستقیم بازیکن به ${group.name}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                setTargetGroupSelect(group.id);
                                showFeedback(`گروه مقصد فرم بالا روی «${group.name}» تنظیم شد.`);
                              }}
                              className="text-slate-400 hover:text-rose-300 p-0.5 rounded hover:bg-rose-950/60 transition-colors"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Transfer Prompt banner inside group when selected */}
                      {isTargetGroupForSelected && (
                        <div className="mb-2 py-1 px-2 rounded bg-emerald-900/40 border border-emerald-500/40 text-emerald-300 text-[11px] font-bold text-center flex items-center justify-center gap-1">
                          <ArrowLeftRight className="w-3 h-3" />
                          <span>انتقال به این گروه</span>
                        </div>
                      )}

                      {/* Players list */}
                      <div className="space-y-1.5">
                        {group.playerIds.map((pid) => {
                          const player = playersMap.get(pid);
                          const isSelected = selectedPlayerId === pid;
                          const rawPlayerName = player?.name || 'ناشناس';
                          const playerName = isBilliards
                            ? rawPlayerName.replace(/\s*\([^)]*\)/g, '').trim()
                            : rawPlayerName;

                          return (
                            <div
                              key={pid}
                              onClick={(e) => {
                                if (hasStartedAnyMatch) return;
                                e.stopPropagation();
                                sound.playClick();
                                setSelectedPlayerId(isSelected ? null : pid);
                              }}
                              className={`group/player relative p-2 rounded-lg text-xs flex items-center justify-between transition-all ${
                                hasStartedAnyMatch
                                  ? 'bg-[#1a0810]/40 text-slate-400 border border-transparent'
                                  : isSelected
                                  ? 'bg-emerald-500/20 text-emerald-200 border border-emerald-500/80 shadow-sm cursor-pointer'
                                  : isBilliards
                                  ? 'bg-[#051a10] text-slate-200 hover:bg-[#072416] hover:text-white border border-emerald-900/60 cursor-pointer'
                                  : 'bg-[#18070e] text-slate-200 hover:bg-[#240a15] hover:text-white border border-rose-950/60 cursor-pointer'
                              }`}
                            >
                              <div className="truncate min-w-0 pr-1">
                                <span className="font-bold">{playerName}</span>
                                {!isBilliards && player?.team && (
                                  <span className="text-[10px] text-slate-400 block truncate">
                                    {player.team}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-1 shrink-0">
                                {isSelected ? (
                                  <ArrowLeftRight className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                                ) : null}
                                {!hasStartedAnyMatch && (
                                  <button
                                    type="button"
                                    title={`حذف بازیکن «${playerName}»`}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleRemovePlayer(pid);
                                    }}
                                    className="opacity-70 sm:opacity-0 sm:group-hover/player:opacity-100 p-1 text-slate-400 hover:text-rose-400 hover:bg-rose-950/80 rounded transition-all cursor-pointer"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}

                        {group.playerIds.length === 0 && (
                          <div className="text-center text-xs text-slate-500 py-4 border border-dashed border-rose-950/60 rounded-lg">
                            (بدون بازیکن)
                          </div>
                        )}
                      </div>

                      {/* تنظیم اختصاصی سهمیه صعود از این گروه */}
                      <div
                        className="mt-3 pt-2.5 border-t border-rose-950/70 space-y-1.5"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <label className="text-[11px] text-slate-300 font-medium flex items-center gap-1.5">
                            <span>تعداد صعودی از این گروه:</span>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-black/40 text-rose-300 border border-rose-950 font-bold">
                              {group.playerIds.length} بازیکن
                            </span>
                          </label>
                          <select
                            value={group.advanceCount ?? 2}
                            disabled={hasStartedAnyMatch}
                            onChange={(e) => {
                              sound.playClick();
                              onUpdateGroupAdvanceCount?.(group.code, parseInt(e.target.value, 10));
                            }}
                            className={`bg-[#19070f] border rounded px-2.5 py-1 text-xs font-mono font-bold text-white outline-none cursor-pointer transition-all ${
                              (group.advanceCount ?? 2) > group.playerIds.length
                                ? 'border-red-500 bg-red-950/30 text-red-200'
                                : 'border-rose-850 focus:border-rose-500'
                            }`}
                          >
                            {Array.from({ length: Math.max(8, group.playerIds.length || 1) }, (_, idx) => idx + 1).map((n) => (
                              <option key={n} value={n}>
                                {n} نفر
                              </option>
                            ))}
                          </select>
                        </div>

                        {(group.advanceCount ?? 2) > group.playerIds.length && (
                          <p className="text-[10px] text-red-400 font-medium leading-tight flex items-center gap-1">
                            <AlertCircle className="w-3 h-3 shrink-0" />
                            <span>تعداد صعودی نمیتواند بیشتر از تعداد بازیکنان گروه باشد.</span>
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* پیش‌نمایش زنده در پایین صفحه تنظیمات گروه‌ها */}
            <div
              className={`p-3.5 rounded-xl border text-xs font-medium transition-all flex flex-col gap-1.5 ${
                isAdvanceCountValid
                  ? 'bg-emerald-950/40 border-emerald-700/60 text-emerald-300'
                  : 'bg-rose-950/50 border-rose-600/80 text-rose-200'
              }`}
            >
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2 font-bold">
                  {isAdvanceCountValid ? (
                    <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  )}
                  <span>
                    {isAdvanceCountValid
                      ? `مجموع صعودی‌ها: ${totalAdvancing} نفر (معتبر است)`
                      : hasAnyGroupOverflow
                      ? `مجموع صعودی‌ها: ${totalAdvancing} نفر (معتبر نیست - خطا در سهمیه گروه‌ها)`
                      : `مجموع صعودی‌ها: ${totalAdvancing} نفر (معتبر نیست - باید ${getNearestPowerOfTwoHint(totalAdvancing)} باشد)`}
                  </span>
                </div>
                <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-black/40 border border-white/10">
                  {isAdvanceCountValid ? 'استاندارد صعود توان ۲' : 'نیازمند اصلاح'}
                </span>
              </div>

              {!isAdvanceCountValid && (
                <p className="text-[11px] text-rose-300 leading-relaxed border-t border-rose-900/60 pt-1.5 font-normal">
                  {hasAnyGroupOverflow
                    ? 'تعداد صعودی نمیتواند بیشتر از تعداد بازیکنان گروه باشد.'
                    : getKnockoutCountErrorMessage(totalAdvancing)}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-app-border bg-app-surface flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-app-text">
          <div className="text-xs text-app-text-muted">
            مجموع: <span className="font-bold text-app-text">{totalPlayersCount}</span> بازیکن در قالب{' '}
            <span className="font-bold text-app-primary">{groups.length}</span> گروه
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {!isAdvanceCountValid && (
              <span className="text-[11px] text-amber-300 font-medium bg-amber-950/60 border border-amber-800/60 px-3 py-1.5 rounded-lg flex items-center justify-center gap-1.5 text-center">
                <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                برای بستن یا تایید، ابتدا خطاهای بالا را برطرف کنید
              </span>
            )}

            <div className="flex items-center gap-2 justify-end">
              <button
                type="button"
                disabled={!isAdvanceCountValid}
                onClick={() => {
                  if (!isAdvanceCountValid) {
                    sound.playClick();
                    showFeedback('برای بستن ابتدا خطاهای بالا را برطرف کنید.', 'error');
                    return;
                  }
                  sound.playClick();
                  onClose();
                }}
                title={!isAdvanceCountValid ? 'برای بستن یا تایید، ابتدا خطاهای بالا را برطرف کنید' : 'بستن پنجره'}
                className={`px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isAdvanceCountValid
                    ? 'bg-app-surface hover:bg-app-surface-hover text-app-text-muted hover:text-app-text border border-app-border cursor-pointer'
                    : 'bg-app-bg text-app-text-muted/50 border border-app-border cursor-not-allowed opacity-50'
                }`}
              >
                بستن
              </button>

              <button
                type="button"
                disabled={!isAdvanceCountValid}
                onClick={() => {
                  if (!isAdvanceCountValid) {
                    sound.playClick();
                    showFeedback('خطا: ابتدا خطاهای سهمیه صعودی گروه‌ها را برطرف کنید.', 'error');
                    return;
                  }
                  sound.playClick();
                  onClose();
                }}
                title={!isAdvanceCountValid ? 'برای بستن یا تایید، ابتدا خطاهای بالا را برطرف کنید' : 'تایید تغییرات'}
                className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md ${
                  isAdvanceCountValid
                    ? 'bg-app-primary hover:bg-app-primary-hover text-white cursor-pointer shadow-md'
                    : 'bg-app-surface text-app-text-muted/50 border border-app-border cursor-not-allowed opacity-50 shadow-none'
                }`}
              >
                تایید تغییرات
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
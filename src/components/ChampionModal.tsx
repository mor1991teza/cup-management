import React, { useState, useEffect, useRef } from 'react';
import {
  Crown,
  Trophy,
  X,
  Sparkles,
  Star,
  Camera,
  Upload,
  Award,
  CheckCircle,
  Image as ImageIcon,
  User,
  Download,
  Share2,
  Eye,
  Loader2,
} from 'lucide-react';
import { Match, Player, GameType } from '../types/tournament';
import { triggerConfetti } from '../utils/confetti';
import { sound } from '../utils/audio';
import { compressAndResizeImage, AVATAR_PRESETS, resolveAvatarUrl } from '../utils/image';
import { StoryCard } from './StoryCard';
import { exportElementAsStory } from '../utils/storyExport';

// 🔴 ایمپورت پلاگین دوربین
import { Camera as CapCamera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';

interface ChampionModalProps {
  isOpen: boolean;
  onClose: () => void;
  champion: Player | null;
  runnerUp: Player | null;
  finalMatch?: Match | null;
  onUpdatePlayerAvatar: (playerId: string, avatarUrl: string) => void;
  assetsBase: string;
  hostLogo?: string | null;
  gameType?: GameType;
}

export const ChampionModal: React.FC<ChampionModalProps> = ({
  isOpen,
  onClose,
  champion,
  runnerUp,
  finalMatch,
  onUpdatePlayerAvatar,
  assetsBase,
  hostLogo,
  gameType = 'pes',
}) => {
  const [activePhotoUploadFor, setActivePhotoUploadFor] = useState<'champion' | 'runnerUp' | null>(null);
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [isExportingStory, setIsExportingStory] = useState(false);
  const [showStoryPreview, setShowStoryPreview] = useState(false);
  const [storySuccessMessage, setStorySuccessMessage] = useState<string | null>(null);

  const championFileInputRef = useRef<HTMLInputElement>(null);
  const runnerUpFileInputRef = useRef<HTMLInputElement>(null);
  const storyCardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && champion) {
      triggerConfetti();
      sound.playFanfare();
    }
  }, [isOpen, champion]);

  if (!isOpen || !champion) return null;

  // 🔴 تابع جدید برای استفاده از دوربین یا گالری در موبایل
  const handlePickImage = async (target: 'champion' | 'runnerUp') => {
    // اگر در موبایل (Capacitor) هستیم، از پلاگین دوربین استفاده کن
    if (Capacitor.isNativePlatform()) {
      try {
        setIsProcessingImage(true);
        const image = await CapCamera.getPhoto({
          quality: 90,
          allowEditing: true,
          resultType: CameraResultType.Base64,
          source: CameraSource.Prompt, // باز کردن منوی انتخاب دوربین یا گالری
          promptLabelHeader: 'انتخاب تصویر',
          promptLabelPhoto: 'انتخاب از گالری',
          promptLabelPicture: 'گرفتن عکس با دوربین',
        });

        if (image.base64String) {
          const base64Data = `data:image/${image.format};base64,${image.base64String}`;
          // فشرده‌سازی تصویر برای ذخیره‌سازی بهینه
          const response = await fetch(base64Data);
          const blob = await response.blob();
          const file = new File([blob], 'avatar.' + image.format, { type: blob.type });
          
          const compressedDataUrl = await compressAndResizeImage(file, 360);
          const playerId = target === 'champion' ? champion.id : runnerUp?.id;
          
          if (playerId) {
            onUpdatePlayerAvatar(playerId, compressedDataUrl);
            sound.playWhistle();
          }
        }
      } catch (error) {
        // اگر کاربر دکمه لغو را زد، خطا نشان نده
        console.log('User cancelled camera or gallery', error);
      } finally {
        setIsProcessingImage(false);
      }
    } else {
      // اگر در ویندوز (Electron) یا مرورگر هستیم، همان روش انتخاب فایل قبلی
      if (target === 'champion') {
        championFileInputRef.current?.click();
      } else {
        runnerUpFileInputRef.current?.click();
      }
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, target: 'champion' | 'runnerUp') => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsProcessingImage(true);
      const compressedDataUrl = await compressAndResizeImage(file, 360);
      const playerId = target === 'champion' ? champion.id : runnerUp?.id;
      if (playerId) {
        onUpdatePlayerAvatar(playerId, compressedDataUrl);
        sound.playWhistle();
      }
    } catch (err) {
      console.error('Error processing image:', err);
    } finally {
      setIsProcessingImage(false);
      setActivePhotoUploadFor(null);
      e.target.value = '';
    }
  };

  const handleSelectPreset = (target: 'champion' | 'runnerUp', presetUrl: string) => {
    const playerId = target === 'champion' ? champion.id : runnerUp?.id;
    if (playerId) {
      onUpdatePlayerAvatar(playerId, presetUrl);
      sound.playClick();
      setActivePhotoUploadFor(null);
    }
  };

  const handleDownloadStory = async () => {
    if (!storyCardRef.current || !champion) return;
    setIsExportingStory(true);
    setStorySuccessMessage(null);
    sound.playClick();

    try {
      const sanitizedName = champion.name.trim().replace(/\s+/g, '-');
      const fileName = `pes2021-champion-${sanitizedName}-story.png`;
      const res = await exportElementAsStory(storyCardRef.current, fileName);
      if (res.success) {
        sound.playFanfare();
        setStorySuccessMessage(
          res.shared
            ? 'تصویر استوری با موفقیت به اشتراک گذاشته شد!'
            : 'تصویر استوری با ابعاد استاندارد ۹:۱۶ دانلود شد!'
        );
        setTimeout(() => setStorySuccessMessage(null), 5000);
      } else {
        setStorySuccessMessage('خطا در تولید تصویر استوری. لطفاً دوباره تلاش کنید.');
      }
    } catch (err) {
      console.error('Story export error:', err);
      setStorySuccessMessage('خطا در دانلود تصویر استوری.');
    } finally {
      setIsExportingStory(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/90 backdrop-blur-md overflow-y-auto overflow-x-hidden animate-fade-in">
      <div className="card-stadium w-full max-w-2xl rounded-3xl border-2 border-amber-500/80 p-6 sm:p-8 shadow-2xl relative text-center overflow-hidden bg-gradient-to-b from-[#181308] via-[#0d131f] to-[#080c14] my-auto">
        {/* Glow & Stadium Floodlights */}
        <div className="absolute -top-32 -left-32 w-80 h-80 bg-amber-500/25 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-80 h-80 bg-cyan-500/25 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={() => {
            sound.playClick();
            onClose();
          }}
          className="absolute top-4 left-4 text-slate-400 hover:text-white bg-slate-900/80 hover:bg-slate-800 p-2 rounded-full border border-slate-800 transition-colors z-20 cursor-pointer"
          title="بستن پنجره"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Top Header Kicker */}
        <div className="flex items-center justify-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider mb-2">
          <Star className="w-4 h-4 fill-current text-amber-400" />
          <span>مراسم اختتامیه و اهدای مدال‌های کاپ PES 2021</span>
          <Star className="w-4 h-4 fill-current text-amber-400" />
        </div>

        <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight mb-6">
          سکوی افتخار و تبریک به قهرمانان
        </h2>

        {/* Final Match Score Badge (if available) */}
        {finalMatch && finalMatch.homeScore !== null && finalMatch.awayScore !== null && (
          <div className="inline-flex items-center gap-3 px-4 py-1.5 mb-6 rounded-full bg-slate-900/90 border border-slate-700/80 text-xs text-slate-300 shadow-md">
            <span className="text-slate-400">نتیجه دیدار فینال:</span>
            <span className="font-mono font-bold text-rose-300 text-sm">
              {finalMatch.homeScore} - {finalMatch.awayScore}
            </span>
            {gameType !== 'billiards' && finalMatch.hasPenalties && finalMatch.homePenaltyScore !== null && (
              <span className="text-amber-400 font-mono text-[11px]">
                (پنالتی: {finalMatch.homePenaltyScore} - {finalMatch.awayPenaltyScore})
              </span>
            )}
          </div>
        )}

        {/* Modern 3D Dual Podium: 1st & 2nd Place Showcases */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6 my-2 items-end">
          {/* Rank 1: Gold Champion (نفر اول - طلایی) */}
          <div className="card-stadium rounded-2xl p-5 border-2 border-amber-500/70 bg-gradient-to-b from-amber-950/40 via-slate-900/90 to-slate-950 shadow-xl relative order-1 sm:order-2 flex flex-col items-center">
            {/* Top Crown */}
            <div className="w-10 h-10 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center -mt-9 mb-2 shadow-lg shadow-amber-500/30">
              <Crown className="w-6 h-6 text-amber-400 animate-bounce" />
            </div>

            {/* Champion Photo Frame */}
            <div className="relative group mb-3">
              <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full p-1 bg-gradient-to-tr from-amber-500 via-yellow-300 to-amber-600 shadow-2xl shadow-amber-500/50">
                <div className="w-full h-full rounded-full overflow-hidden bg-slate-950 border-2 border-slate-900 flex items-center justify-center relative">
                  {champion.avatarUrl ? (
                    <img
                      src={resolveAvatarUrl(champion.avatarUrl, assetsBase)}
                      alt={champion.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900 text-slate-400">
                      <User className="w-12 h-12 text-amber-400/80 mb-1" />
                      <span className="text-[10px] text-amber-300 font-bold">بدون تصویر</span>
                    </div>
                  )}

                  {/* Camera overlay hover button */}
                  <button
                    type="button"
                    onClick={() => handlePickImage('champion')}
                    className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white transition-opacity cursor-pointer"
                    title="تغییر عکس قهرمان"
                  >
                    <Camera className="w-6 h-6 text-amber-400" />
                    <span className="text-[10px] mt-1 font-bold">تغییر عکس</span>
                  </button>
                </div>
              </div>

              {/* Gold Medal Badge */}
              <div className="absolute -bottom-2 right-1/2 translate-x-1/2 bg-amber-500 text-slate-950 font-black text-[11px] px-3 py-0.5 rounded-full shadow-md flex items-center gap-1 whitespace-nowrap">
                <Trophy className="w-3 h-3 text-slate-950" />
                <span>مقام اول (طلا)</span>
              </div>
            </div>

            {/* Champion Info */}
            <h3 className="text-xl sm:text-2xl font-black text-amber-300 mt-2 truncate max-w-full">
              {champion.name}
            </h3>
            {champion.team && (
              <p className="text-xs text-slate-300 font-semibold mt-0.5">
                تیم: {champion.team}
              </p>
            )}

            {/* Photo Action Buttons */}
            <div className="flex items-center gap-2 mt-4 flex-wrap justify-center">
              <button
                type="button"
                onClick={() => handlePickImage('champion')}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-lg text-xs font-bold transition-colors cursor-pointer"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>{champion.avatarUrl ? 'تغییر عکس قهرمان' : 'آپلود عکس قهرمان'}</span>
              </button>
              <button
                type="button"
                onClick={() => setActivePhotoUploadFor(activePhotoUploadFor === 'champion' ? null : 'champion')}
                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 text-xs transition-colors cursor-pointer"
                title="انتخاب از آیکون‌ها و ستاره‌های آماده"
              >
                <ImageIcon className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Hidden file input for Champion (Fallback for Desktop) */}
            <input
              ref={championFileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleFileChange(e, 'champion')}
            />
          </div>

          {/* Rank 2: Silver Runner-Up (نفر دوم - نقره‌ای) */}
          <div className="card-stadium rounded-2xl p-5 border border-slate-700 bg-gradient-to-b from-slate-800/40 via-slate-900/90 to-slate-950 shadow-lg relative order-2 sm:order-1 flex flex-col items-center">
            {/* Top Medal */}
            <div className="w-8 h-8 rounded-full bg-slate-700/60 border border-slate-500/50 flex items-center justify-center -mt-7 mb-2 shadow-md">
              <Award className="w-5 h-5 text-slate-300" />
            </div>

            {/* Runner-Up Photo Frame */}
            <div className="relative group mb-3">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full p-1 bg-gradient-to-tr from-slate-400 via-slate-200 to-slate-500 shadow-xl shadow-slate-500/30">
                <div className="w-full h-full rounded-full overflow-hidden bg-slate-950 border-2 border-slate-900 flex items-center justify-center relative">
                  {runnerUp?.avatarUrl ? (
                    <img
                      src={resolveAvatarUrl(runnerUp.avatarUrl, assetsBase)}
                      alt={runnerUp.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900 text-slate-400">
                      <User className="w-10 h-10 text-slate-400 mb-1" />
                      <span className="text-[10px] text-slate-400 font-bold">بدون تصویر</span>
                    </div>
                  )}

                  {/* Camera overlay hover button */}
                  {runnerUp && (
                    <button
                      type="button"
                      onClick={() => handlePickImage('runnerUp')}
                      className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white transition-opacity cursor-pointer"
                      title="تغییر عکس نایب‌قهرمان"
                    >
                      <Camera className="w-5 h-5 text-slate-300" />
                      <span className="text-[10px] mt-1 font-bold">تغییر عکس</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Silver Medal Badge */}
              <div className="absolute -bottom-2 right-1/2 translate-x-1/2 bg-slate-300 text-slate-950 font-black text-[11px] px-3 py-0.5 rounded-full shadow-md flex items-center gap-1 whitespace-nowrap">
                <Award className="w-3 h-3 text-slate-950" />
                <span>مقام دوم (نقره)</span>
              </div>
            </div>

            {/* Runner-Up Info */}
            <h3 className="text-lg sm:text-xl font-bold text-slate-100 mt-2 truncate max-w-full">
              {runnerUp ? runnerUp.name : 'در انتظار تعیین'}
            </h3>
            {runnerUp?.team && (
              <p className="text-xs text-slate-400 font-medium mt-0.5">
                تیم: {runnerUp.team}
              </p>
            )}

            {/* Photo Action Buttons */}
            {runnerUp && (
              <div className="flex items-center gap-2 mt-4 flex-wrap justify-center">
                <button
                  type="button"
                  onClick={() => handlePickImage('runnerUp')}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                >
                  <Camera className="w-3.5 h-3.5 text-slate-300" />
                  <span>{runnerUp.avatarUrl ? 'تغییر عکس نایب‌قهرمان' : 'آپلود عکس نایب‌قهرمان'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActivePhotoUploadFor(activePhotoUploadFor === 'runnerUp' ? null : 'runnerUp')}
                  className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 text-xs transition-colors cursor-pointer"
                  title="انتخاب از آیکون‌ها و ستاره‌های آماده"
                >
                  <ImageIcon className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Hidden file input for Runner-Up (Fallback for Desktop) */}
            <input
              ref={runnerUpFileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleFileChange(e, 'runnerUp')}
            />
          </div>
        </div>

        {/* Preset Selector Dropdown / Drawer */}
        {activePhotoUploadFor && (
          <div className="card-stadium p-4 rounded-2xl border border-app-primary/40 bg-app-surface my-4 text-right animate-fade-in">
            <div className="flex items-center justify-between border-b border-app-border pb-2 mb-3">
              <span className="text-xs font-bold text-app-primary flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-app-primary" />
                <span>
                  انتخاب آیکون و تصویر پیش‌فرض برای{' '}
                  {activePhotoUploadFor === 'champion' ? champion.name : runnerUp?.name}:
                </span>
              </span>
              <button
                type="button"
                onClick={() => setActivePhotoUploadFor(null)}
                className="text-app-text-muted hover:text-app-text text-xs cursor-pointer"
              >
                بستن
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {AVATAR_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handleSelectPreset(activePhotoUploadFor, preset.avatarUrl)}
                  className="flex items-center gap-2 p-2 bg-app-bg hover:bg-app-surface border border-app-border hover:border-app-primary rounded-xl transition-all text-right group cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 border border-app-border">
                    <img
                      src={resolveAvatarUrl(preset.avatarUrl, assetsBase)}
                      alt={preset.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <span className="text-[11px] font-semibold text-app-text-muted group-hover:text-app-primary truncate">
                    {preset.name}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {isProcessingImage && (
          <div className="py-2 text-xs text-app-primary font-semibold animate-pulse">
            در حال پردازش و بهینه‌سازی تصویر...
          </div>
        )}

        {/* Story Generation & Share Section */}
        <div className="card-stadium mt-5 p-4 sm:p-5 rounded-2xl border border-amber-500/40 bg-gradient-to-r from-amber-950/30 via-slate-900 to-rose-950/30 text-right shadow-lg">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>دانلود و اشتراک‌گذاری استوری (Instagram & WhatsApp Story)</span>
              </div>
              <p className="text-xs text-slate-300 mt-1">
                خروجی باکیفیت و استاندارد عمودی ۹:۱۶ با تصویر نفرات اول و دوم و مدال‌ها جهت انتشار در استوری.
              </p>
            </div>

            <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
              <button
                type="button"
                onClick={() => setShowStoryPreview(!showStoryPreview)}
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition-colors cursor-pointer"
              >
                <Eye className="w-4 h-4 text-rose-400" />
                <span>{showStoryPreview ? 'بستن پیش‌نمایش' : 'پیش‌نمایش استوری'}</span>
              </button>

              <button
                type="button"
                disabled={isExportingStory}
                onClick={handleDownloadStory}
                className="flex items-center gap-2 px-5 py-2.5 text-xs font-black text-slate-950 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 hover:brightness-110 rounded-xl shadow-lg shadow-amber-500/25 transition-all cursor-pointer disabled:opacity-50"
              >
                {isExportingStory ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                    <span>در حال ساخت استوری...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 text-slate-950" />
                    <span>دانلود استوری (۹:۱۶)</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Success Feedback Banner */}
          {storySuccessMessage && (
            <div className="mt-3 py-2 px-4 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-xs font-bold flex items-center justify-center gap-2 animate-fade-in">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              <span>{storySuccessMessage}</span>
            </div>
          )}

          {/* Interactive Story Preview Container (Optional Drawer) */}
          {showStoryPreview && (
            <div className="mt-4 pt-4 border-t border-slate-800/80 flex flex-col items-center animate-fade-in w-full">
              <div className="text-xs text-slate-400 mb-2">پیش‌نمایش طرح استوری (نسبت ۹:۱۶):</div>
              
              {/* کانتینر با ارتفاع مشخص و اسکرول عمودی */}
              <div className="w-full flex justify-center overflow-y-auto" style={{ maxHeight: '600px' }}>
                <div className="origin-top scale-[0.55] sm:scale-[0.65] md:scale-[0.75] transition-transform" style={{ minHeight: '450px' }}>
                  <StoryCard
                    champion={champion}
                    runnerUp={runnerUp}
                    finalMatch={finalMatch}
                    assetsBase={assetsBase}
                    hostLogo={hostLogo}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-center gap-3 mt-6 pt-4 border-t border-slate-800/80 flex-wrap">
          <button
            type="button"
            onClick={() => {
              triggerConfetti();
              sound.playFanfare();
            }}
            className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold text-amber-950 bg-gradient-to-r from-amber-400 to-yellow-300 hover:from-amber-300 hover:to-yellow-200 rounded-xl transition-all shadow-md shadow-amber-950/40 cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>نورافشانی و تشویق مجدد</span>
          </button>

          <button
            type="button"
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="px-5 py-2.5 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
          >
            مشاهده جدول و ادامه مسابقات
          </button>
        </div>

        {/* برندینگ و Trademark */}
        <div className="mt-6 flex flex-col items-center justify-center gap-3 border-t border-slate-800/50 pt-4">
          {assetsBase && (
            <div className="bg-white p-2 rounded-xl shadow-md">
              <img 
                src={`${assetsBase}/aistudio/logo.png`} 
                alt="هشت بهشت ایرانیان" 
                className="h-12 w-auto object-contain"
              />
            </div>
          )}
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-1.5 sm:gap-3 text-[10px] text-slate-500">
            <span>طراحی و توسعه: مرتضی دهقانی</span>
            <span className="hidden sm:inline" aria-hidden="true">·</span>
            <span>شرکت هشت بهشت ایرانیان</span>
            <span className="hidden sm:inline" aria-hidden="true">·</span>
            <a 
              href="https://8biranian.com" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-rose-400 hover:text-rose-300 transition-colors font-medium"
            >
              8biranian.com
            </a>
          </div>
        </div>
      </div>

      {/* Off-screen StoryCard for high resolution 2x export */}
      <div className="fixed -left-[9999px] top-0 pointer-events-none opacity-100 z-[-100]">
        <StoryCard
          ref={storyCardRef}
          champion={champion}
          runnerUp={runnerUp}
          finalMatch={finalMatch}
          assetsBase={assetsBase}
          hostLogo={hostLogo}
        />
      </div>
    </div>
  );
};
import React, { useState } from 'react';
import {
  Trophy,
  Volume2,
  VolumeX,
  RotateCcw,
  Download,
  Upload,
  Layers,
} from 'lucide-react';
import { TournamentStage, TournamentState } from '../types/tournament';
import { sound } from '../utils/audio';
import { exportTournamentBackup } from '../utils/storage';
import { ThemeSelectorDropdown } from './ThemeSelectorDropdown';

interface TopHeaderProps {
  state: TournamentState;
  onResetClick: () => void;
  onToggleSound: () => void;
  onImportState: (newState: TournamentState) => void;
  activeTab: 'main' | 'groups' | 'fixtures' | 'bracket' | 'stats';
  setActiveTab: (tab: 'main' | 'groups' | 'fixtures' | 'bracket' | 'stats') => void;
  assetsBase: string;
  hostLogo?: string | null;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  state,
  onResetClick,
  onToggleSound,
  onImportState,
  activeTab,
  setActiveTab,
  assetsBase,
  hostLogo,
}) => {
  const [fileError, setFileError] = useState<string | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.status && Array.isArray(parsed.players) && Array.isArray(parsed.groups)) {
          onImportState(parsed);
          sound.playWhistle();
          setFileError(null);
        } else {
          setFileError('فرمت فایل نامعتبر است.');
        }
      } catch {
        setFileError('خطا در خواندن فایل.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const getStagePersianTitle = (st: TournamentStage) => {
    switch (st) {
      case 'setup':
        return 'مرحله ثبت‌نام و قرعه‌کشی';
      case 'group':
        return 'مرحله گروهی در جریان';
      case 'knockout':
        return 'مرحله حذفی در جریان';
      case 'finished':
        return 'پایان تورنمنت و تاج‌گذاری';
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-slate-950/75 backdrop-blur-xl border-b border-white/[0.08] shadow-lg shadow-black/20">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 h-16 flex items-center justify-between gap-2 sm:gap-4">
        {/* Zone 1: Wordmark & Brand with Mobile-First Responsiveness */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1 lg:flex-initial">
          {/* Host Logo */}
          {hostLogo && (
            <div className="bg-white/95 p-1 rounded-xl shadow-sm hidden md:block shrink-0">
              <img 
                src={hostLogo} 
                alt="لوگوی میزبان" 
                className="h-6 sm:h-7 w-auto object-contain" 
              />
            </div>
          )}

          {/* Emblem / Badge */}
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl overflow-hidden border border-white/10 shadow-sm shrink-0 bg-slate-900 group">
            {state.gameType === 'billiards' ? (
              <img
                src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTqniQoQxzh_5OlE93mckbAehloeipZ-9sLPNj7zTCCJ4O3ushLTLDhIAi5&s=10"
                alt="Billiards Tournament"
                className="w-full h-full object-cover transform group-hover:scale-110 transition-transform"
                referrerPolicy="no-referrer"
              />
            ) : assetsBase ? (
              <img
                src="./assets/aistudio/i-efootball-pes-2021-season-update-digital_07ad38f0.webp"
                alt="PES 2021 Season Update"
                className="w-full h-full object-cover transform group-hover:scale-110 transition-transform"
                referrerPolicy="no-referrer"
              />
            ) : null}
          </div>
          
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <h1 className="text-xs min-[380px]:text-sm sm:text-base md:text-lg font-extrabold tracking-tight text-white truncate leading-tight">
                {state.title || (state.gameType === 'billiards' ? 'کاپ مسابقات بیلیارد' : 'کاپ مسابقات PES 2021')}
              </h1>
              <span className="hidden min-[480px]:inline-block px-2 py-0.5 text-[9px] sm:text-[10px] font-mono tracking-wider bg-white/5 border border-white/10 text-app-primary rounded-md shrink-0">
                {state.gameType === 'billiards' ? '8-BALL / 9-BALL' : 'SEASON 2021'}
              </span>
            </div>
            {/* Micro subtitle for mobile context */}
            <div className="text-[10px] text-app-primary/90 sm:hidden truncate font-medium">
              {getStagePersianTitle(state.status)}
            </div>
          </div>
        </div>

        {/* Zone 2: Navigation Links (Single-line controls) */}
        <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-slate-400">
          {state.status === 'setup' ? (
            <span className="text-app-primary font-semibold text-xs whitespace-nowrap">
              در حال تنظیم بازیکنان و گروه‌ها
            </span>
          ) : (
            <>
              {(state.tournamentFormat === 'group_knockout' || state.gameType === 'billiards') && (
                <>
                  <button
                    onClick={() => {
                      sound.playClick();
                      setActiveTab('main');
                    }}
                    className={`transition-colors whitespace-nowrap pb-1 cursor-pointer ${
                      activeTab === 'main'
                        ? 'text-app-primary font-bold border-b-2 border-app-primary'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    نمای کلی
                  </button>
                  <button
                    onClick={() => {
                      sound.playClick();
                      setActiveTab('groups');
                    }}
                    className={`transition-colors whitespace-nowrap pb-1 cursor-pointer ${
                      activeTab === 'groups'
                        ? 'text-app-primary font-bold border-b-2 border-app-primary'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {state.gameType === 'billiards' ? 'جدول رده‌بندی' : 'جدول گروه‌ها'}
                  </button>
                </>
              )}
              <button
                onClick={() => {
                  sound.playClick();
                  setActiveTab('bracket');
                }}
                className={`transition-colors whitespace-nowrap pb-1 cursor-pointer ${
                  activeTab === 'bracket'
                    ? 'text-app-primary font-bold border-b-2 border-app-primary'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {state.gameType === 'billiards'
                  ? 'مراحل حذفی'
                  : state.tournamentFormat === 'knockout_single'
                  ? 'براکت حذفی تک'
                  : state.tournamentFormat === 'knockout_double'
                  ? 'براکت حذفی دوگانه (Bo3)'
                  : state.tournamentFormat === 'knockout_black'
                  ? 'براکت حالت بلک'
                  : 'براکت حذفی'}
              </button>
              <button
                onClick={() => {
                  sound.playClick();
                  setActiveTab('fixtures');
                }}
                className={`transition-colors whitespace-nowrap pb-1 cursor-pointer ${
                  activeTab === 'fixtures'
                    ? 'text-app-primary font-bold border-b-2 border-app-primary'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {state.gameType === 'billiards' ? 'برنامه مسابقات' : 'برنامه و مسابقات'}
              </button>
              <button
                onClick={() => {
                  sound.playClick();
                  setActiveTab('stats');
                }}
                className={`transition-colors whitespace-nowrap pb-1 cursor-pointer ${
                  activeTab === 'stats'
                    ? 'text-app-primary font-bold border-b-2 border-app-primary'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {state.gameType === 'billiards' ? 'آمار مسابقات' : 'آمار و رکوردها'}
              </button>
            </>
          )}
        </nav>

        {/* Zone 3: Primary Actions & Utilities */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          {/* Theme Selector Dropdown */}
          <ThemeSelectorDropdown />

          {/* Sound Toggle */}
          <button
            onClick={() => {
              onToggleSound();
              sound.playClick();
            }}
            title={state.soundEnabled ? 'قطع افکت‌های صوتی' : 'وصل افکت‌های صوتی'}
            aria-label="تغییر وضعیت صدا"
            className="btn-secondary-glass p-2 rounded-xl transition-all shrink-0 cursor-pointer"
          >
            {state.soundEnabled ? (
              <Volume2 className="w-4 h-4 text-app-primary" />
            ) : (
              <VolumeX className="w-4 h-4 text-slate-500" />
            )}
          </button>

          {/* Export JSON backup */}
          {state.players.length > 0 && (
            <button
              onClick={async () => {
                sound.playClick();
                await exportTournamentBackup(state);
              }}
              title="خروجی و دانلود بکاپ تورنمنت"
              aria-label="دانلود بکاپ"
              className="btn-secondary-glass p-2 rounded-xl transition-all inline-flex shrink-0 cursor-pointer"
            >
              <Download className="w-4 h-4" />
            </button>
          )}

          {/* Import JSON */}
          <label
            title="بارگذاری فایل بکاپ تورنمنت"
            aria-label="بارگذاری بکاپ"
            className="btn-secondary-glass p-2 rounded-xl transition-all cursor-pointer inline-flex shrink-0"
          >
            <Upload className="w-4 h-4" />
            <input
              type="file"
              accept=".json"
              className="hidden"
              onChange={handleFileUpload}
            />
          </label>

          {/* Reset Tournament */}
          <button
            onClick={() => {
              sound.playClick();
              onResetClick();
            }}
            title="ریست کاپ و شروع مجدد"
            className="btn-secondary-glass flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl text-rose-300 hover:text-white border-rose-500/20 hover:border-rose-500/40 transition-all whitespace-nowrap shrink-0 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 text-rose-400 shrink-0" />
            <span className="hidden sm:inline">ریست کاپ</span>
            <span className="sm:hidden text-[11px]">ریست</span>
          </button>
        </div>
      </div>

      {fileError && (
        <div className="bg-app-primary/20 border-b border-app-primary text-app-primary text-xs px-4 py-2 text-center">
          {fileError}
        </div>
      )}
    </header>
  );
};
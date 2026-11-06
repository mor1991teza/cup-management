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
    <header className="sticky top-0 z-40 bg-app-surface/95 backdrop-blur border-b border-app-border shadow-md shadow-black/40">
      <div className="max-w-7xl mx-auto px-2.5 sm:px-6 h-16 flex items-center justify-between gap-2 sm:gap-4">
        {/* Zone 1: Wordmark & Brand with Mobile-First Responsiveness */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1 lg:flex-initial">
          {/* Host Logo */}
          {hostLogo && (
            <div className="bg-white/95 p-1 rounded-lg shadow-sm hidden md:block shrink-0">
              <img 
                src={hostLogo} 
                alt="لوگوی میزبان" 
                className="h-6 sm:h-7 w-auto object-contain" 
              />
            </div>
          )}

          {/* Emblem / Badge */}
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg overflow-hidden border border-app-primary/50 shadow-sm shrink-0 bg-app-bg group">
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
              <h1 className="text-xs min-[380px]:text-sm sm:text-base md:text-lg font-extrabold tracking-tight text-app-text truncate leading-tight">
                {state.title || (state.gameType === 'billiards' ? 'کاپ مسابقات بیلیارد' : 'کاپ مسابقات PES 2021')}
              </h1>
              <span className="hidden min-[480px]:inline-block px-1.5 py-0.5 text-[9px] sm:text-[10px] font-mono tracking-wider bg-app-bg border border-app-border text-app-primary rounded shrink-0">
                {state.gameType === 'billiards' ? '8-BALL / 9-BALL' : 'SEASON 2021'}
              </span>
            </div>
            {/* Micro subtitle for mobile context */}
            <div className="text-[10px] text-app-primary/80 sm:hidden truncate font-medium">
              {getStagePersianTitle(state.status)}
            </div>
          </div>
        </div>

        {/* Zone 2: Navigation Links (Single-line controls) */}
        <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-app-text-muted">
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
                        : 'text-app-text-muted hover:text-app-text'
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
                        : 'text-app-text-muted hover:text-app-text'
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
                    : 'text-app-text-muted hover:text-app-text'
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
                    : 'text-app-text-muted hover:text-app-text'
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
                    : 'text-app-text-muted hover:text-app-text'
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
            className="p-1.5 sm:p-2 text-app-text-muted hover:text-app-text hover:bg-app-surface-hover rounded-lg transition-colors shrink-0"
          >
            {state.soundEnabled ? (
              <Volume2 className="w-4 h-4 text-app-primary" />
            ) : (
              <VolumeX className="w-4 h-4 text-app-text-muted/60" />
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
              className="p-1.5 sm:p-2 text-app-text-muted hover:text-app-text hover:bg-app-surface-hover rounded-lg transition-colors inline-flex shrink-0"
            >
              <Download className="w-4 h-4" />
            </button>
          )}

          {/* Import JSON */}
          <label
            title="بارگذاری فایل بکاپ تورنمنت"
            aria-label="بارگذاری بکاپ"
            className="p-1.5 sm:p-2 text-app-text-muted hover:text-app-text hover:bg-app-surface-hover rounded-lg transition-colors cursor-pointer inline-flex shrink-0"
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
            className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 text-xs font-semibold text-app-text hover:brightness-125 bg-app-surface hover:bg-app-surface-hover border border-app-border rounded-lg transition-colors whitespace-nowrap shrink-0 shadow-sm cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 text-app-primary shrink-0" />
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
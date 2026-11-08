import React, { useState, useEffect, useRef } from 'react';
import { Palette, Check } from 'lucide-react';
import { sound } from '../utils/audio';

export type ThemeId = 'theme-classic' | 'theme-neon' | 'theme-gold' | 'theme-emerald';

interface ThemeOption {
  id: ThemeId;
  name: string;
  colorClass: string;
}

const THEMES: ThemeOption[] = [
  { id: 'theme-classic', name: 'Classic eSports', colorClass: 'bg-rose-700' },
  { id: 'theme-neon', name: 'Neon Cyberpunk', colorClass: 'bg-cyan-500' },
  { id: 'theme-gold', name: 'Royal Gold', colorClass: 'bg-amber-500' },
  { id: 'theme-emerald', name: 'Emerald Pro', colorClass: 'bg-emerald-500' },
];

export const ThemeSelectorDropdown: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentTheme, setCurrentTheme] = useState<ThemeId>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('pes_tournament_theme') as ThemeId;
      if (saved && ['theme-classic', 'theme-neon', 'theme-gold', 'theme-emerald'].includes(saved)) {
        return saved;
      }
    }
    return 'theme-classic';
  });

  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Apply theme class to both html (documentElement) and body
    const root = document.documentElement;
    const body = document.body;
    const themeClasses: ThemeId[] = ['theme-classic', 'theme-neon', 'theme-gold', 'theme-emerald'];
    
    themeClasses.forEach((cls) => {
      root.classList.remove(cls);
      body.classList.remove(cls);
    });

    root.classList.add(currentTheme);
    body.classList.add(currentTheme);
    localStorage.setItem('pes_tournament_theme', currentTheme);
  }, [currentTheme]);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectTheme = (id: ThemeId) => {
    sound.playClick();
    setCurrentTheme(id);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => {
          sound.playClick();
          setIsOpen(!isOpen);
        }}
        title="انتخاب تم رنگی"
        aria-label="انتخاب تم رنگی"
        className="btn-secondary-glass flex items-center gap-2 px-3 py-1.5 text-xs font-bold rounded-xl cursor-pointer"
      >
        <Palette className="w-4 h-4 text-app-primary shrink-0" />
        <span className="hidden sm:inline">انتخاب تم</span>
      </button>

      {isOpen && (
        <div className="glass-modal absolute left-0 mt-2.5 w-56 rounded-2xl border border-white/10 p-2 z-50 shadow-2xl animate-fade-in text-white" dir="rtl">
          <div className="px-3 py-2 text-[11px] font-bold text-slate-400 border-b border-white/10 mb-1.5">
            انتخاب تم رنگی اپلیکیشن
          </div>
          <div className="space-y-1">
            {THEMES.map((theme) => {
              const isSelected = currentTheme === theme.id;
              return (
                <button
                  key={theme.id}
                  onClick={() => handleSelectTheme(theme.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-xl transition-all cursor-pointer active:scale-[0.98] ${
                    isSelected
                      ? 'bg-app-primary/20 text-white font-bold border border-app-primary/40 shadow-sm'
                      : 'text-slate-300 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className={`w-3.5 h-3.5 rounded-full shrink-0 shadow-sm ${theme.colorClass}`} />
                    <span>{theme.name}</span>
                  </div>
                  {isSelected && <Check className="w-3.5 h-3.5 text-app-primary" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

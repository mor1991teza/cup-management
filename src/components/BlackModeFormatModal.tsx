import React, { useState } from 'react';
import { Swords, Zap, Layers, CheckCircle2 } from 'lucide-react';
import { sound } from '../utils/audio';

interface BlackModeFormatModalProps {
  isOpen: boolean;
  onSelectFormat: (format: 'single' | 'bo3') => void;
  roundNumber?: number;
}

export const BlackModeFormatModal: React.FC<BlackModeFormatModalProps> = ({
  isOpen,
  onSelectFormat,
  roundNumber = 2,
}) => {
  const [selectedFormat, setSelectedFormat] = useState<'single' | 'bo3'>('single');

  if (!isOpen) return null;

  const handleConfirm = () => {
    sound.playWhistle();
    onSelectFormat(selectedFormat);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in" dir="rtl">
      <div className="card-stadium w-full max-w-lg rounded-3xl border-2 border-app-primary/60 bg-app-surface text-app-text p-6 sm:p-7 shadow-2xl relative overflow-hidden">
        {/* Decorative Top Radial Glow */}
        <div className="absolute top-0 right-1/2 translate-x-1/2 w-72 h-32 bg-app-primary/15 blur-3xl pointer-events-none rounded-full" />

        {/* Header */}
        <div className="flex items-center gap-3.5 mb-5 relative">
          <div className="w-12 h-12 rounded-2xl bg-app-primary/20 border border-app-primary/50 flex items-center justify-center text-app-primary shrink-0 shadow-inner">
            <Swords className="w-6 h-6 text-app-primary" />
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-app-primary/20 border border-app-primary/40 text-[11px] font-bold text-app-primary mb-1">
              <Zap className="w-3 h-3" />
              <span>حالت بلک (Black Mode)</span>
            </div>
            <h3 className="text-base sm:text-lg font-black text-app-text">
              مرحله بعد را چگونه برگزار کنیم؟
            </h3>
            <p className="text-xs text-app-text-muted mt-0.5">
              مرحله اول با موفقیت پایان یافت. لطفاً فرمت برگزاری مسابقات از مرحله {roundNumber} تا فینال را مشخص کنید:
            </p>
          </div>
        </div>

        {/* Options Grid */}
        <div className="space-y-3 relative mb-6">
          {/* Option 1: Single Game */}
          <button
            type="button"
            onClick={() => {
              sound.playClick();
              setSelectedFormat('single');
            }}
            className={`w-full text-right p-4 rounded-2xl border-2 transition-all cursor-pointer relative flex items-start gap-3.5 ${
              selectedFormat === 'single'
                ? 'border-app-primary bg-app-primary/10 shadow-lg shadow-app-primary/10 ring-1 ring-app-primary/40'
                : 'border-app-border bg-app-bg/60 hover:bg-app-bg hover:border-app-border/80'
            }`}
          >
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                selectedFormat === 'single'
                  ? 'bg-app-primary text-white shadow-md'
                  : 'bg-app-surface text-app-text-muted border border-app-border'
              }`}
            >
              <Zap className="w-5 h-5" />
            </div>

            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-sm text-app-text flex items-center gap-2">
                  <span>گزینه ۱: تک‌بازی (تک‌حذفی مستقیم)</span>
                  {selectedFormat === 'single' && (
                    <span className="text-[10px] bg-app-primary text-white px-2 py-0.5 rounded-full font-bold">
                      انتخاب شده
                    </span>
                  )}
                </h4>
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    selectedFormat === 'single'
                      ? 'border-app-primary bg-app-primary text-white'
                      : 'border-app-border'
                  }`}
                >
                  {selectedFormat === 'single' && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                </div>
              </div>
              <p className="text-xs text-app-text-muted mt-1 leading-relaxed">
                تمام مسابقات مراحل بعد به صورت تک‌بازی برگزار می‌شوند. بازنده بلافاصله حذف می‌شود و در صورت تساوی، ضربات پنالتی تعیین‌کننده صعود است.
              </p>
              <span className="inline-block mt-2 text-[10px] font-semibold text-app-primary bg-app-primary/15 px-2.5 py-0.5 rounded-md">
                ⚡ سرعت بالا • هیجان حذفی لحظه‌ای
              </span>
            </div>
          </button>

          {/* Option 2: Best of 3 */}
          <button
            type="button"
            onClick={() => {
              sound.playClick();
              setSelectedFormat('bo3');
            }}
            className={`w-full text-right p-4 rounded-2xl border-2 transition-all cursor-pointer relative flex items-start gap-3.5 ${
              selectedFormat === 'bo3'
                ? 'border-app-primary bg-app-primary/10 shadow-lg shadow-app-primary/10 ring-1 ring-app-primary/40'
                : 'border-app-border bg-app-bg/60 hover:bg-app-bg hover:border-app-border/80'
            }`}
          >
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                selectedFormat === 'bo3'
                  ? 'bg-app-primary text-white shadow-md'
                  : 'bg-app-surface text-app-text-muted border border-app-border'
              }`}
            >
              <Layers className="w-5 h-5" />
            </div>

            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-sm text-app-text flex items-center gap-2">
                  <span>گزینه ۲: بهترین از سه بازی (Bo3)</span>
                  {selectedFormat === 'bo3' && (
                    <span className="text-[10px] bg-app-primary text-white px-2 py-0.5 rounded-full font-bold">
                      انتخاب شده
                    </span>
                  )}
                </h4>
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    selectedFormat === 'bo3'
                      ? 'border-app-primary bg-app-primary text-white'
                      : 'border-app-border'
                  }`}
                >
                  {selectedFormat === 'bo3' && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                </div>
              </div>
              <p className="text-xs text-app-text-muted mt-1 leading-relaxed">
                هر مسابقه تا ۲ برد (از حداکثر ۳ بازی) ادامه می‌یابد. بازیکنی که زودتر به ۲ برد برسد صعود کرده و بازنده حذف می‌شود.
              </p>
              <span className="inline-block mt-2 text-[10px] font-semibold text-emerald-400 bg-emerald-950/40 border border-emerald-800/60 px-2.5 py-0.5 rounded-md">
                🏆 رقابت حرفه‌ای • عادلانه با شانس جبران
              </span>
            </div>
          </button>
        </div>

        {/* Footer info & CTA */}
        <div className="pt-2 border-t border-app-border">
          <p className="text-[11px] text-app-text-muted mb-3 text-center">
            💡 این فرمت برای تمام مراحل باقیمانده (تا رسیدن به فینال قهرمانی) اعمال خواهد شد.
          </p>

          <button
            type="button"
            onClick={handleConfirm}
            className="w-full py-3 px-4 bg-app-primary hover:bg-app-primary-hover text-white font-bold text-sm rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Swords className="w-4 h-4" />
            <span>
              تأیید فرمت و قرعه‌کشی مرحله {roundNumber} (
              {selectedFormat === 'bo3' ? 'بهترین از ۳ بازی' : 'تک‌بازی مستقیم'})
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

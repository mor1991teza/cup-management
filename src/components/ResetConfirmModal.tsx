import React from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { sound } from '../utils/audio';

interface ResetConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const ResetConfirmModal: React.FC<ResetConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in" dir="rtl">
      <div className="glass-modal w-full max-w-md rounded-3xl border border-white/10 p-7 sm:p-8 shadow-2xl relative">
        <button
          onClick={() => {
            sound.playClick();
            onClose();
          }}
          className="absolute top-5 left-5 text-slate-400 hover:text-white transition-colors cursor-pointer p-1 rounded-lg hover:bg-white/10"
          title="بستن پنجره"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3.5 text-rose-400 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center shrink-0 shadow-inner">
            <AlertTriangle className="w-6 h-6 text-rose-400" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">ریست کامل تورنمنت</h3>
            <span className="text-xs text-rose-400/90 font-medium">حذف تمامی اطلاعات و شروع مجدد</span>
          </div>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed my-5">
          آیا مطمئن هستید که می‌خواهید تمام نتایج مسابقات، گروه‌بندی‌ها، اسامی بازیکنان و براکت مرحله حذفی را پاک کنید؟ این عملیات غیرقابل بازگشت خواهد بود.
        </p>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
          <button
            type="button"
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="btn-secondary-glass px-5 py-2.5 text-xs font-semibold rounded-xl cursor-pointer"
          >
            انصراف
          </button>
          <button
            type="button"
            onClick={() => {
              sound.playClick();
              onConfirm();
            }}
            className="btn-primary-glass px-5 py-2.5 text-xs font-bold rounded-xl cursor-pointer bg-rose-600 hover:bg-rose-500"
          >
            بله، مطمئنم
          </button>
        </div>
      </div>
    </div>
  );
};

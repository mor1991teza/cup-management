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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="card-stadium w-full max-w-md rounded-2xl border border-app-border bg-app-surface text-app-text p-6 shadow-2xl relative">
        <button
          onClick={() => {
            sound.playClick();
            onClose();
          }}
          className="absolute top-4 left-4 text-app-text-muted hover:text-app-text transition-colors cursor-pointer"
          title="بستن پنجره"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 text-app-primary mb-3">
          <div className="w-10 h-10 rounded-xl bg-app-primary/20 border border-app-primary/40 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5 text-app-primary" />
          </div>
          <div>
            <h3 className="text-base font-bold text-app-text">ریست کامل تورنمنت</h3>
            <span className="text-xs text-app-primary">حذف تمامی اطلاعات و شروع مجدد</span>
          </div>
        </div>

        <p className="text-xs text-app-text-muted leading-relaxed my-4">
          آیا مطمئن هستید که می‌خواهید تمام نتایج مسابقات، گروه‌بندی‌ها، اسامی بازیکنان و براکت مرحله حذفی را پاک کنید؟ این عملیات قابل بازگشت نخواهد بود.
        </p>

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="px-4 py-2 text-xs font-semibold text-app-text-muted hover:text-app-text bg-app-surface hover:bg-app-surface-hover border border-app-border rounded-lg transition-colors cursor-pointer"
          >
            انصراف
          </button>
          <button
            type="button"
            onClick={() => {
              sound.playClick();
              onConfirm();
            }}
            className="px-4 py-2 text-xs font-bold text-white bg-app-primary hover:bg-app-primary-hover rounded-lg shadow-md transition-colors cursor-pointer"
          >
            بله، ریست کامل شود
          </button>
        </div>
      </div>
    </div>
  );
};

import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import type { TournamentState } from '../types/tournament';


const STORAGE_KEY = 'pes2021_group_cup_state_v2';

export function saveTournamentToStorage(state: TournamentState): void {
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }
  } catch (error) {
    console.error('Failed to save tournament to localStorage:', error);
  }
}

export function loadTournamentFromStorage(): TournamentState | null {
  try {
    if (typeof window !== 'undefined') {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        return JSON.parse(data) as TournamentState;
      }
    }
  } catch (error) {
    console.error('Failed to load tournament from localStorage:', error);
  }
  return null;
}

export function clearTournamentStorage(): void {
  try {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch (error) {
    console.error('Failed to clear tournament storage:', error);
  }
}

export async function exportTournamentBackup(state: TournamentState) {
  const dataStr = JSON.stringify(state, null, 2);
  const fileName = `pes2021-cup-backup-${new Date().toISOString().split('T')[0]}.json`;

  // ۱. بررسی اینکه آیا در گوشی (اندروید) هستیم یا خیر
  if (Capacitor.isNativePlatform()) {
    try {
      // ۱. ذخیره در پوشه Cache (برای اینکه در همه برنامه‌ها قابل کپی باشد)
      const result = await Filesystem.writeFile({
        path: fileName,
        data: dataStr,
        directory: Directory.Cache, // <--- تغییر به Cache
        encoding: Encoding.UTF8,
      });

      // ۲. باز کردن منوی اشتراک‌گذاری
      await Share.share({
        title: 'بکاپ کاپ PES 2021',
        text: 'فایل بکاپ مسابقات',
        url: result.uri,
        dialogTitle: 'ذخیره یا ارسال فایل بکاپ',
      });

    } catch (error: any) {
      // اگر کاربر روی Cancel زد، خطا نشان نده
      if (error.message && error.message.includes('cancel')) {
        console.log('User cancelled share');
      } else {
        console.error('Error sharing file:', error);
        alert('خطا در ایجاد فایل بکاپ.');
      }
    }
    return;
  }


  // کدهای ویندوز و مرورگر (بدون تغییر)
  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

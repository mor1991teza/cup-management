import { Capacitor } from '@capacitor/core';
import { SecureStorage } from '@aparajita/capacitor-secure-storage';

export const SECRET_KEY = "HASHT_BEHESHT_IRANIAN_2026_PES";

export function validateLicense(licenseKey: string): { isValid: boolean; expiryDate?: number; type?: string; error?: string } {
  const parts = licenseKey.trim().split('-');
  if (parts.length !== 3) return { isValid: false, error: 'فرمت کد نامعتبر است.' };

  const [type, dateStr, sig] = parts;
  if (type !== 'DEMO' && type !== 'FULL') return { isValid: false, error: 'نوع لایسنس نامعتبر است.' };

  // بررسی امضا
  const raw = `${dateStr}-${type}-${SECRET_KEY}`;
  let hash = 0;
  for (let i = 0; i < raw.length; i++) {
    const char = raw.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  const expectedSig = Math.abs(hash).toString(16).toUpperCase().padStart(8, '0');

  if (sig !== expectedSig) return { isValid: false, error: 'کد لایسنس دستکاری شده است.' };

  // تبدیل تاریخ به میلی‌ثانیه
  const year = parseInt(dateStr.substring(0, 4), 10);
  const month = parseInt(dateStr.substring(4, 6), 10) - 1;
  const day = parseInt(dateStr.substring(6, 8), 10);
  const expiryDate = new Date(year, month, day, 23, 59, 59).getTime();

  if (Date.now() > expiryDate) {
    return { isValid: false, expiryDate, type, error: 'مهلت استفاده از این کد به پایان رسیده است.' };
  }

  return { isValid: true, expiryDate, type };
}

// 🔴 تابع ذخیره امن لایسنس
export async function saveLicenseSecurely(licenseKey: string) {
  if (Capacitor.isNativePlatform()) {
    // در موبایل، از حافظه امن بومی (Keystore) استفاده می‌کنیم
    try {
      await SecureStorage.set('app_license_key', licenseKey);
    } catch (error) {
      console.error('Error saving to SecureStorage:', error);
      // در صورت خطا، به localStorage برمی‌گردیم (Fallback)
      localStorage.setItem('app_license_key', licenseKey);
    }
  } else if ((window as any).appPaths?.saveLicenseToDisk) {
    // در ویندوز، از IPC برای ذخیره در فایل مخفی استفاده می‌کنیم
    const result = validateLicense(licenseKey);
    if (result.isValid) {
      await (window as any).appPaths.saveLicenseToDisk({
        licenseKey,
        expiryDate: result.expiryDate,
        type: result.type
      });
    }
    // همچنان در localStorage هم ذخیره می‌کنیم (برای سازگاری)
    localStorage.setItem('app_license_key', licenseKey);
  } else {
    // در مرورگر (تست لوکال)
    localStorage.setItem('app_license_key', licenseKey);
  }
}

// 🔴 تابع خواندن امن لایسنس
export async function readLicenseSecurely(): Promise<string | null> {
  if (Capacitor.isNativePlatform()) {
    // در موبایل، از حافظه امن بومی می‌خوانیم
    try {
      const result = await SecureStorage.get('app_license_key');
      // 🔴 تغییر اصلی: بررسی اینکه مقدار برگشتی از نوع string باشد
      if (result && typeof result === 'string') {
        return result;
      }
    } catch (error) {
      console.error('Error reading from SecureStorage:', error);
    }
    // اگر در SecureStorage نبود، از localStorage می‌خوانیم
    return localStorage.getItem('app_license_key');
  } else if ((window as any).appPaths?.readLicenseFromDisk) {
    const diskData = await (window as any).appPaths.readLicenseFromDisk();
    if (diskData && diskData.licenseKey) {
      return diskData.licenseKey;
    }
    return localStorage.getItem('app_license_key');
  }
  return localStorage.getItem('app_license_key');
}
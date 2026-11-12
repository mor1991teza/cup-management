import { Capacitor } from '@capacitor/core';
import { SecureStorage } from '@aparajita/capacitor-secure-storage';

export async function verifyLicenseApi(licenseKey: string): Promise<{ valid: boolean; token?: string; type?: string; clientName?: string; error?: string }> {
  try {
    const res = await fetch('/api/verify-license', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ licenseKey: licenseKey.trim() }),
    });
    const data = await res.json();
    return data;
  } catch (err) {
    console.error('License verification request failed:', err);
    return { valid: false, error: 'خطا در ارتباط با سرور بررسی لایسنس.' };
  }
}

export async function saveLicenseTokenSecurely(token: string) {
  if (Capacitor.isNativePlatform()) {
    try {
      await SecureStorage.set('app_license_token', token);
    } catch (error) {
      console.error('Error saving token to SecureStorage:', error);
      localStorage.setItem('app_license_token', token);
    }
  } else {
    localStorage.setItem('app_license_token', token);
  }
}

export async function readLicenseTokenSecurely(): Promise<string | null> {
  if (Capacitor.isNativePlatform()) {
    try {
      const result = await SecureStorage.get('app_license_token');
      if (result && typeof result === 'string') {
        return result;
      }
    } catch (error) {
      console.error('Error reading token from SecureStorage:', error);
    }
    return localStorage.getItem('app_license_token');
  }
  return localStorage.getItem('app_license_token');
}
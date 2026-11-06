import { toPng } from 'html-to-image';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

/**
 * Downloads a DOM element as an image file.
 * Also attempts native share (via Capacitor) on mobile devices.
 */
export async function exportElementAsStory(
  element: HTMLElement,
  fileName: string = 'pes2021-champion-story.png'
): Promise<{ success: boolean; shared?: boolean; error?: string }> {
  try {
    // ۱. تولید تصویر با کیفیت بالا (PixelRatio 2)
const dataUrl = await toPng(element, {
  quality: 1, // کیفیت بالا
  pixelRatio: 2,
  cacheBust: true,
  backgroundColor: '#080c14',
  skipFonts: false, // 🔴 فونت‌ها را نادیده نگیر
  fontEmbedCSS: '', // 🔴 فونت را از style داخل کارت می‌خواند
});

    // ۲. اگر در محیط موبایل (Capacitor) هستیم
    if (Capacitor.isNativePlatform()) {
      // جدا کردن بخش Base64 از Data URL
      const base64Data = dataUrl.split(',')[1];
      
      // ذخیره فایل در پوشه Cache گوشی
      const result = await Filesystem.writeFile({
        path: fileName,
        data: base64Data,
        directory: Directory.Cache,
      });

      // باز کردن منوی اشتراک‌گذاری سیستم‌عامل برای ذخیره در گالری یا ارسال
      await Share.share({
        title: 'کاپ قهرمانی PES 2021',
        text: 'سکوی قهرمانی و نتایج مسابقات کاپ PES 2021',
        url: result.uri,
        dialogTitle: 'ذخیره تصویر در گالری یا ارسال',
      });

      return { success: true, shared: true };
    } 
    
    // ۳. اگر در ویندوز (Electron) یا مرورگر دسکتاپ هستیم
    else {
      const link = document.createElement('a');
      link.download = fileName;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      return { success: true, shared: false };
    }
  } catch (err: any) {
    // 🔴 تغییر اصلی: اگر کاربر دکمه لغو (Cancel) را در منوی اشتراک‌گذاری زد، خطا نشان نده
    if (err.message && err.message.toLowerCase().includes('cancel')) {
      console.log('User cancelled the share dialog');
      return { success: true, shared: false };
    }
    
    console.error('Failed to export story image:', err);
    return { 
      success: false, 
      error: err?.message || 'خطا در ساخت یا ذخیره تصویر استوری' 
    };
  }
}
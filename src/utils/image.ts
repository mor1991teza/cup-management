/**
 * Image processing and avatar presets utility
 * Zero external network dependencies
 */

export function compressAndResizeImage(file: File, maxSize: number = 320): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const width = img.width;
        const height = img.height;

        // Crop to square from center
        const minDim = Math.min(width, height);
        const startX = (width - minDim) / 2;
        const startY = (height - minDim) / 2;

        canvas.width = maxSize;
        canvas.height = maxSize;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }

        ctx.drawImage(img, startX, startY, minDim, minDim, 0, 0, maxSize, maxSize);
        resolve(canvas.toDataURL('image/jpeg', 0.85));
      };
      img.onerror = () => reject(new Error('خطا در بارگذاری تصویر'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('خطا در خواندن فایل'));
    reader.readAsDataURL(file);
  });
}

/**
 * ساخت مسیر کامل آواتار از مسیر نسبی
 * @param avatarUrl مسیر نسبی یا data URL
 * @param assetsBase مسیر پایه assets (مثلاً file:///.../app/dist/assets)
 */
export function resolveAvatarUrl(avatarUrl: string | undefined, assetsBase: string): string {
  if (!avatarUrl) return '';
  // data URL یا مسیر absolute (file://, http://, https://) - بدون تغییر
  if (
    avatarUrl.startsWith('data:') ||
    avatarUrl.startsWith('file://') ||
    avatarUrl.startsWith('http://') ||
    avatarUrl.startsWith('https://')
  ) {
    return avatarUrl;
  }
  // مسیر نسبی - با assetsBase ترکیب شود
  if (!assetsBase) return '';
  return `${assetsBase}${avatarUrl.startsWith('/') ? '' : '/'}${avatarUrl}`;
}

// Preset avatars using authentic local asset and stylized vector graphics
export const AVATAR_PRESETS: Array<{ id: string; name: string; avatarUrl: string; color: string }> = [
  {
    id: 'preset-pes-messi',
    name: 'ستاره رسمی PES 2021 (مسی)',
    avatarUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="100" height="100" fill="%23004d98"/></svg>',
    color: '#004d98',
  },
  {
    id: 'preset-gold-10',
    name: 'شماره ۱۰ طلایی',
    avatarUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><rect width="200" height="200" fill="%230f172a"/><circle cx="100" cy="100" r="85" fill="%23d97706"/><circle cx="100" cy="100" r="75" fill="%230f172a"/><text x="100" y="115" font-family="sans-serif" font-weight="900" font-size="52" fill="%23fbbf24" text-anchor="middle">10</text><text x="100" y="145" font-family="sans-serif" font-weight="bold" font-size="14" fill="%23fef08a" text-anchor="middle">CAPTAIN</text></svg>',
    color: '#d97706',
  },
  {
    id: 'preset-striker-7',
    name: 'مهاجم شماره ۷',
    avatarUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><rect width="200" height="200" fill="%23090d16"/><circle cx="100" cy="100" r="85" fill="%2306b6d4"/><circle cx="100" cy="100" r="75" fill="%23090d16"/><text x="100" y="115" font-family="sans-serif" font-weight="900" font-size="54" fill="%2322d3ee" text-anchor="middle">7</text><text x="100" y="145" font-family="sans-serif" font-weight="bold" font-size="14" fill="%23a5f3fc" text-anchor="middle">STRIKER</text></svg>',
    color: '#06b6d4',
  },
  {
    id: 'preset-playmaker-9',
    name: 'گلزن شماره ۹',
    avatarUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><rect width="200" height="200" fill="%230f172a"/><circle cx="100" cy="100" r="85" fill="%2310b981"/><circle cx="100" cy="100" r="75" fill="%230f172a"/><text x="100" y="115" font-family="sans-serif" font-weight="900" font-size="54" fill="%2334d399" text-anchor="middle">9</text><text x="100" y="145" font-family="sans-serif" font-weight="bold" font-size="14" fill="%23a7f3d0" text-anchor="middle">FORWARD</text></svg>',
    color: '#10b981',
  },
  {
    id: 'preset-legend-8',
    name: 'هافبک شماره ۸',
    avatarUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><rect width="200" height="200" fill="%23090d16"/><circle cx="100" cy="100" r="85" fill="%238b5cf6"/><circle cx="100" cy="100" r="75" fill="%23090d16"/><text x="100" y="115" font-family="sans-serif" font-weight="900" font-size="54" fill="%23a78bfa" text-anchor="middle">8</text><text x="100" y="145" font-family="sans-serif" font-weight="bold" font-size="14" fill="%23ddd6fe" text-anchor="middle">LEGEND</text></svg>',
    color: '#8b5cf6',
  },
];

// آیکون‌ها و تصاویر پیش‌فرض اختصاصی بیلیارد (پاکت بیلیارد، ایت‌بال، ناین‌بال و کیوبال)
export const BILLIARDS_AVATAR_PRESETS: Array<{ id: string; name: string; avatarUrl: string; color: string }> = [
  {
    id: 'preset-billiards-8ball',
    name: 'توپ ۸ مشکی (8-Ball)',
    avatarUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><rect width="200" height="200" fill="%23061f14"/><circle cx="100" cy="100" r="85" fill="%230f172a"/><circle cx="92" cy="92" r="78" fill="%23020617"/><circle cx="100" cy="100" r="38" fill="%23ffffff"/><text x="100" y="117" font-family="sans-serif" font-weight="900" font-size="48" fill="%23000000" text-anchor="middle">8</text><text x="100" y="172" font-family="sans-serif" font-weight="bold" font-size="13" fill="%2334d399" text-anchor="middle">8-BALL</text></svg>',
    color: '#10b981',
  },
  {
    id: 'preset-billiards-9ball',
    name: 'توپ ۹ ناین‌بال (9-Ball)',
    avatarUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><rect width="200" height="200" fill="%23061f14"/><circle cx="100" cy="100" r="85" fill="%23f8fafc"/><rect x="15" y="52" width="170" height="96" fill="%23eab308"/><circle cx="100" cy="100" r="36" fill="%23ffffff"/><text x="100" y="116" font-family="sans-serif" font-weight="900" font-size="46" fill="%23000000" text-anchor="middle">9</text><line x1="82" y1="123" x2="118" y2="123" stroke="%23000000" stroke-width="4"/><text x="100" y="175" font-family="sans-serif" font-weight="bold" font-size="13" fill="%23fde047" text-anchor="middle">9-BALL</text></svg>',
    color: '#eab308',
  },
  {
    id: 'preset-billiards-cueball',
    name: 'کیوبال مسابقاتی (Cue Ball)',
    avatarUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><rect width="200" height="200" fill="%23061f14"/><circle cx="100" cy="100" r="85" fill="%23f8fafc"/><circle cx="100" cy="45" r="7" fill="%23ef4444"/><circle cx="100" cy="155" r="7" fill="%23ef4444"/><circle cx="45" cy="100" r="7" fill="%23ef4444"/><circle cx="155" cy="100" r="7" fill="%23ef4444"/><circle cx="65" cy="65" r="6" fill="%23ef4444"/><circle cx="135" cy="135" r="6" fill="%23ef4444"/><text x="100" y="106" font-family="sans-serif" font-weight="900" font-size="16" fill="%23475569" text-anchor="middle">CUE</text><text x="100" y="126" font-family="sans-serif" font-weight="bold" font-size="11" fill="%2394a3b8" text-anchor="middle">PRO CUP</text></svg>',
    color: '#f8fafc',
  },
  {
    id: 'preset-billiards-1ball',
    name: 'توپ ۱ زرد (Solid 1)',
    avatarUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><rect width="200" height="200" fill="%23061f14"/><circle cx="100" cy="100" r="85" fill="%23eab308"/><circle cx="100" cy="100" r="38" fill="%23ffffff"/><text x="100" y="117" font-family="sans-serif" font-weight="900" font-size="48" fill="%23000000" text-anchor="middle">1</text><text x="100" y="172" font-family="sans-serif" font-weight="bold" font-size="13" fill="%23fde047" text-anchor="middle">SOLID</text></svg>',
    color: '#ca8a04',
  },
  {
    id: 'preset-billiards-master',
    name: 'مستر بریک و پاکت',
    avatarUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><rect width="200" height="200" fill="%23042014"/><circle cx="100" cy="100" r="85" fill="%23064e3b" stroke="%2310b981" stroke-width="5"/><polygon points="100,52 142,126 58,126" fill="none" stroke="%23fbbf24" stroke-width="4"/><circle cx="100" cy="72" r="8" fill="%23ef4444"/><circle cx="92" cy="90" r="8" fill="%23eab308"/><circle cx="108" cy="90" r="8" fill="%233b82f6"/><circle cx="84" cy="108" r="8" fill="%238b5cf6"/><circle cx="100" cy="108" r="8" fill="%23000000"/><circle cx="116" cy="108" r="8" fill="%23f97316"/><text x="100" y="162" font-family="sans-serif" font-weight="900" font-size="14" fill="%23a7f3d0" text-anchor="middle">MASTER</text></svg>',
    color: '#059669',
  },
];

export const getAvatarPresets = (gameType?: string) => {
  return gameType === 'billiards' ? BILLIARDS_AVATAR_PRESETS : AVATAR_PRESETS;
};
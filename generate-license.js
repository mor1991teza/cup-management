// generate-license.js
const SECRET_KEY = "HASHT_BEHESHT_IRANIAN_2026_PES"; // این کلید مخفی است

function generateSignature(dateStr, type) {
  const raw = `${dateStr}-${type}-${SECRET_KEY}`;
  let hash = 0;
  for (let i = 0; i < raw.length; i++) {
    const char = raw.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16).toUpperCase().padStart(8, '0');
}

function generateLicense(dateStr, type = 'DEMO') {
  return `${type}-${dateStr}-${generateSignature(dateStr, type)}`;
}

// 🔴 تنظیم تاریخ انقضا (اینجا ۷ روز بعد از امروز)
const oneWeekLater = new Date();
oneWeekLater.setDate(oneWeekLater.getDate() + 7);
const dateStr = `${oneWeekLater.getFullYear()}${String(oneWeekLater.getMonth() + 1).padStart(2, '0')}${String(oneWeekLater.getDate()).padStart(2, '0')}`;

console.log("-----------------------------------------");
console.log("تاریخ انقضای لایسنس:", oneWeekLater.toLocaleDateString('fa-IR'));
console.log("کد لایسنس شما (این را کپی کنید):");
console.log(generateLicense(dateStr, 'DEMO'));
console.log("-----------------------------------------");
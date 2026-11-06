#!/usr/bin/env node
/**
 * @file hash-password.js
 * اسکریپت تولید هش رمز عبور برای ادمین سامانه رصد لایو
 * استفاده:
 *   node hash-password.js "mySecurePassword123"
 */

import crypto from 'crypto';

const password = process.argv[2];

if (!password) {
  console.log('\n❌ لطفاً یک رمز عبور به عنوان ورودی وارد کنید.');
  console.log('مثال:');
  console.log('  node hash-password.js "mySecurePassword123"\n');
  process.exit(1);
}

// تولید یک نمک تصادفی ۱۶ بایتی
const salt = crypto.randomBytes(16).toString('hex');

// محاسبه هش امن با استفاده از PBKDF2 و الگوریتم sha512
const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');

const combinedHash = `${salt}:${hash}`;

console.log('\n======================================================');
console.log('✅ هش رمز عبور با موفقیت ایجاد شد:');
console.log('------------------------------------------------------');
console.log(combinedHash);
console.log('------------------------------------------------------');
console.log('این مقدار را در فایل .env مقابل ADMIN_PASSWORD_HASH قرار دهید:');
console.log(`ADMIN_PASSWORD_HASH=${combinedHash}`);
console.log('======================================================\n');

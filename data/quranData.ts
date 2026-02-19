export interface Surah {
  number: number;
  name: string;
  englishName: string;
  verses: number;
  page: number;
  type: 'meccan' | 'medinan';
}

export const quranData: Surah[] = [
  { number: 1, name: "الفاتحة", englishName: "Al-Fatiha", verses: 7, page: 1, type: "meccan" },
  { number: 2, name: "البقرة", englishName: "Al-Baqarah", verses: 286, page: 2, type: "medinan" },
  { number: 3, name: "آل عمران", englishName: "Aal-E-Imran", verses: 200, page: 50, type: "medinan" },
  { number: 4, name: "النساء", englishName: "An-Nisa", verses: 176, page: 77, type: "medinan" },
  { number: 5, name: "المائدة", englishName: "Al-Ma'idah", verses: 120, page: 106, type: "medinan" },
  { number: 6, name: "الأنعام", englishName: "Al-An'am", verses: 165, page: 128, type: "meccan" },
  { number: 7, name: "الأعراف", englishName: "Al-A'raf", verses: 206, page: 151, type: "meccan" },
  { number: 8, name: "الأنفال", englishName: "Al-Anfal", verses: 75, page: 177, type: "medinan" },
  { number: 9, name: "التوبة", englishName: "At-Tawbah", verses: 129, page: 187, type: "medinan" },
  { number: 10, name: "يونس", englishName: "Yunus", verses: 109, page: 208, type: "meccan" },
  { number: 11, name: "هود", englishName: "Hud", verses: 123, page: 221, type: "meccan" },
  { number: 12, name: "يوسف", englishName: "Yusuf", verses: 111, page: 235, type: "meccan" },
  { number: 13, name: "الرعد", englishName: "Ar-Ra'd", verses: 43, page: 249, type: "medinan" },
  { number: 14, name: "إبراهيم", englishName: "Ibrahim", verses: 52, page: 255, type: "meccan" },
  { number: 15, name: "الحجر", englishName: "Al-Hijr", verses: 99, page: 262, type: "meccan" },
  { number: 16, name: "النحل", englishName: "An-Nahl", verses: 128, page: 267, type: "meccan" },
  { number: 17, name: "الإسراء", englishName: "Al-Isra", verses: 111, page: 282, type: "meccan" },
  { number: 18, name: "الكهف", englishName: "Al-Kahf", verses: 110, page: 293, type: "meccan" },
  { number: 19, name: "مريم", englishName: "Maryam", verses: 98, page: 305, type: "meccan" },
  { number: 20, name: "طه", englishName: "Ta-Ha", verses: 135, page: 312, type: "meccan" },
  { number: 21, name: "الأنبياء", englishName: "Al-Anbiya", verses: 112, page: 322, type: "meccan" },
  { number: 22, name: "الحج", englishName: "Al-Hajj", verses: 78, page: 332, type: "medinan" },
  { number: 23, name: "المؤمنون", englishName: "Al-Mu'minun", verses: 118, page: 342, type: "meccan" },
  { number: 24, name: "النور", englishName: "An-Nur", verses: 64, page: 350, type: "medinan" },
  { number: 25, name: "الفرقان", englishName: "Al-Furqan", verses: 77, page: 359, type: "meccan" },
  { number: 26, name: "الشعراء", englishName: "Ash-Shu'ara", verses: 227, page: 367, type: "meccan" },
  { number: 27, name: "النمل", englishName: "An-Naml", verses: 93, page: 377, type: "meccan" },
  { number: 28, name: "القصص", englishName: "Al-Qasas", verses: 88, page: 385, type: "meccan" },
  { number: 29, name: "العنكبوت", englishName: "Al-Ankabut", verses: 69, page: 396, type: "meccan" },
  { number: 30, name: "الروم", englishName: "Ar-Rum", verses: 60, page: 404, type: "meccan" },
  { number: 31, name: "لقمان", englishName: "Luqman", verses: 34, page: 411, type: "meccan" },
  { number: 32, name: "السجدة", englishName: "As-Sajdah", verses: 30, page: 415, type: "meccan" },
  { number: 33, name: "الأحزاب", englishName: "Al-Ahzab", verses: 73, page: 418, type: "medinan" },
  { number: 34, name: "سبأ", englishName: "Saba", verses: 54, page: 428, type: "meccan" },
  { number: 35, name: "فاطر", englishName: "Fatir", verses: 45, page: 434, type: "meccan" },
  { number: 36, name: "يس", englishName: "Ya-Sin", verses: 83, page: 440, type: "meccan" },
  { number: 37, name: "الصافات", englishName: "As-Saffat", verses: 182, page: 446, type: "meccan" },
  { number: 38, name: "ص", englishName: "Sad", verses: 88, page: 453, type: "meccan" },
  { number: 39, name: "الزمر", englishName: "Az-Zumar", verses: 75, page: 458, type: "meccan" },
  { number: 40, name: "غافر", englishName: "Ghafir", verses: 85, page: 467, type: "meccan" },
  { number: 41, name: "فصلت", englishName: "Fussilat", verses: 54, page: 477, type: "meccan" },
  { number: 42, name: "الشورى", englishName: "Ash-Shura", verses: 53, page: 483, type: "meccan" },
  { number: 43, name: "الزخرف", englishName: "Az-Zukhruf", verses: 89, page: 489, type: "meccan" },
  { number: 44, name: "الدخان", englishName: "Ad-Dukhan", verses: 59, page: 496, type: "meccan" },
  { number: 45, name: "الجاثية", englishName: "Al-Jathiyah", verses: 37, page: 499, type: "meccan" },
  { number: 46, name: "الأحقاف", englishName: "Al-Ahqaf", verses: 35, page: 502, type: "meccan" },
  { number: 47, name: "محمد", englishName: "Muhammad", verses: 38, page: 507, type: "medinan" },
  { number: 48, name: "الفتح", englishName: "Al-Fath", verses: 29, page: 511, type: "medinan" },
  { number: 49, name: "الحجرات", englishName: "Al-Hujurat", verses: 18, page: 515, type: "medinan" },
  { number: 50, name: "ق", englishName: "Qaf", verses: 45, page: 518, type: "meccan" },
  { number: 51, name: "الذاريات", englishName: "Adh-Dhariyat", verses: 60, page: 520, type: "meccan" },
  { number: 52, name: "الطور", englishName: "At-Tur", verses: 49, page: 523, type: "meccan" },
  { number: 53, name: "النجم", englishName: "An-Najm", verses: 62, page: 526, type: "meccan" },
  { number: 54, name: "القمر", englishName: "Al-Qamar", verses: 55, page: 528, type: "meccan" },
  { number: 55, name: "الرحمن", englishName: "Ar-Rahman", verses: 78, page: 531, type: "medinan" },
  { number: 56, name: "الواقعة", englishName: "Al-Waqi'ah", verses: 96, page: 534, type: "meccan" },
  { number: 57, name: "الحديد", englishName: "Al-Hadid", verses: 29, page: 537, type: "medinan" },
  { number: 58, name: "المجادلة", englishName: "Al-Mujadilah", verses: 22, page: 542, type: "medinan" },
  { number: 59, name: "الحشر", englishName: "Al-Hashr", verses: 24, page: 545, type: "medinan" },
  { number: 60, name: "الممتحنة", englishName: "Al-Mumtahanah", verses: 13, page: 549, type: "medinan" },
  { number: 61, name: "الصف", englishName: "As-Saff", verses: 14, page: 551, type: "medinan" },
  { number: 62, name: "الجمعة", englishName: "Al-Jumu'ah", verses: 11, page: 553, type: "medinan" },
  { number: 63, name: "المنافقون", englishName: "Al-Munafiqun", verses: 11, page: 554, type: "medinan" },
  { number: 64, name: "التغابن", englishName: "At-Taghabun", verses: 18, page: 556, type: "medinan" },
  { number: 65, name: "الطلاق", englishName: "At-Talaq", verses: 12, page: 558, type: "medinan" },
  { number: 66, name: "التحريم", englishName: "At-Tahrim", verses: 12, page: 560, type: "medinan" },
  { number: 67, name: "الملك", englishName: "Al-Mulk", verses: 30, page: 562, type: "meccan" },
  { number: 68, name: "القلم", englishName: "Al-Qalam", verses: 52, page: 564, type: "meccan" },
  { number: 69, name: "الحاقة", englishName: "Al-Haqqah", verses: 52, page: 566, type: "meccan" },
  { number: 70, name: "المعارج", englishName: "Al-Ma'arij", verses: 44, page: 568, type: "meccan" },
  { number: 71, name: "نوح", englishName: "Nuh", verses: 28, page: 570, type: "meccan" },
  { number: 72, name: "الجن", englishName: "Al-Jinn", verses: 28, page: 572, type: "meccan" },
  { number: 73, name: "المزمل", englishName: "Al-Muzzammil", verses: 20, page: 574, type: "meccan" },
  { number: 74, name: "المدثر", englishName: "Al-Muddaththir", verses: 56, page: 575, type: "meccan" },
  { number: 75, name: "القيامة", englishName: "Al-Qiyamah", verses: 40, page: 577, type: "meccan" },
  { number: 76, name: "الإنسان", englishName: "Al-Insan", verses: 31, page: 578, type: "medinan" },
  { number: 77, name: "المرسلات", englishName: "Al-Mursalat", verses: 50, page: 580, type: "meccan" },
  { number: 78, name: "النبأ", englishName: "An-Naba", verses: 40, page: 582, type: "meccan" },
  { number: 79, name: "النازعات", englishName: "An-Nazi'at", verses: 46, page: 583, type: "meccan" },
  { number: 80, name: "عبس", englishName: "Abasa", verses: 42, page: 585, type: "meccan" },
  { number: 81, name: "التكوير", englishName: "At-Takwir", verses: 29, page: 586, type: "meccan" },
  { number: 82, name: "الانفطار", englishName: "Al-Infitar", verses: 19, page: 587, type: "meccan" },
  { number: 83, name: "المطففين", englishName: "Al-Mutaffifin", verses: 36, page: 587, type: "meccan" },
  { number: 84, name: "الانشقاق", englishName: "Al-Inshiqaq", verses: 25, page: 589, type: "meccan" },
  { number: 85, name: "البروج", englishName: "Al-Buruj", verses: 22, page: 590, type: "meccan" },
  { number: 86, name: "الطارق", englishName: "At-Tariq", verses: 17, page: 591, type: "meccan" },
  { number: 87, name: "الأعلى", englishName: "Al-A'la", verses: 19, page: 591, type: "meccan" },
  { number: 88, name: "الغاشية", englishName: "Al-Ghashiyah", verses: 26, page: 592, type: "meccan" },
  { number: 89, name: "الفجر", englishName: "Al-Fajr", verses: 30, page: 593, type: "meccan" },
  { number: 90, name: "البلد", englishName: "Al-Balad", verses: 20, page: 594, type: "meccan" },
  { number: 91, name: "الشمس", englishName: "Ash-Shams", verses: 15, page: 595, type: "meccan" },
  { number: 92, name: "الليل", englishName: "Al-Layl", verses: 21, page: 595, type: "meccan" },
  { number: 93, name: "الضحى", englishName: "Ad-Duha", verses: 11, page: 596, type: "meccan" },
  { number: 94, name: "الشرح", englishName: "Ash-Sharh", verses: 8, page: 596, type: "meccan" },
  { number: 95, name: "التين", englishName: "At-Tin", verses: 8, page: 597, type: "meccan" },
  { number: 96, name: "العلق", englishName: "Al-Alaq", verses: 19, page: 597, type: "meccan" },
  { number: 97, name: "القدر", englishName: "Al-Qadr", verses: 5, page: 598, type: "meccan" },
  { number: 98, name: "البينة", englishName: "Al-Bayyinah", verses: 8, page: 598, type: "medinan" },
  { number: 99, name: "الزلزلة", englishName: "Az-Zalzalah", verses: 8, page: 599, type: "medinan" },
  { number: 100, name: "العاديات", englishName: "Al-Adiyat", verses: 11, page: 599, type: "meccan" },
  { number: 101, name: "القارعة", englishName: "Al-Qari'ah", verses: 11, page: 600, type: "meccan" },
  { number: 102, name: "التكاثر", englishName: "At-Takathur", verses: 8, page: 600, type: "meccan" },
  { number: 103, name: "العصر", englishName: "Al-Asr", verses: 3, page: 601, type: "meccan" },
  { number: 104, name: "الهمزة", englishName: "Al-Humazah", verses: 9, page: 601, type: "meccan" },
  { number: 105, name: "الفيل", englishName: "Al-Fil", verses: 5, page: 601, type: "meccan" },
  { number: 106, name: "قريش", englishName: "Quraysh", verses: 4, page: 602, type: "meccan" },
  { number: 107, name: "الماعون", englishName: "Al-Ma'un", verses: 7, page: 602, type: "meccan" },
  { number: 108, name: "الكوثر", englishName: "Al-Kawthar", verses: 3, page: 602, type: "meccan" },
  { number: 109, name: "الكافرون", englishName: "Al-Kafirun", verses: 6, page: 603, type: "meccan" },
  { number: 110, name: "النصر", englishName: "An-Nasr", verses: 3, page: 603, type: "medinan" },
  { number: 111, name: "المسد", englishName: "Al-Masad", verses: 5, page: 603, type: "meccan" },
  { number: 112, name: "الإخلاص", englishName: "Al-Ikhlas", verses: 4, page: 604, type: "meccan" },
  { number: 113, name: "الفلق", englishName: "Al-Falaq", verses: 5, page: 604, type: "meccan" },
  { number: 114, name: "الناس", englishName: "An-Nas", verses: 6, page: 604, type: "meccan" },
];

export const TOTAL_PAGES = 604;

export const getSurahByPage = (page: number): Surah | undefined => {
  for (let i = quranData.length - 1; i >= 0; i--) {
    if (quranData[i].page <= page) {
      return quranData[i];
    }
  }
  return quranData[0];
};

export const juzPages: { juz: number; startPage: number }[] = [
  { juz: 1, startPage: 1 },
  { juz: 2, startPage: 22 },
  { juz: 3, startPage: 42 },
  { juz: 4, startPage: 62 },
  { juz: 5, startPage: 82 },
  { juz: 6, startPage: 102 },
  { juz: 7, startPage: 122 },
  { juz: 8, startPage: 142 },
  { juz: 9, startPage: 162 },
  { juz: 10, startPage: 182 },
  { juz: 11, startPage: 202 },
  { juz: 12, startPage: 222 },
  { juz: 13, startPage: 242 },
  { juz: 14, startPage: 262 },
  { juz: 15, startPage: 282 },
  { juz: 16, startPage: 302 },
  { juz: 17, startPage: 322 },
  { juz: 18, startPage: 342 },
  { juz: 19, startPage: 362 },
  { juz: 20, startPage: 382 },
  { juz: 21, startPage: 402 },
  { juz: 22, startPage: 422 },
  { juz: 23, startPage: 442 },
  { juz: 24, startPage: 462 },
  { juz: 25, startPage: 482 },
  { juz: 26, startPage: 502 },
  { juz: 27, startPage: 522 },
  { juz: 28, startPage: 542 },
  { juz: 29, startPage: 562 },
  { juz: 30, startPage: 582 },
];

export const getJuzByPage = (page: number): number => {
  for (let i = juzPages.length - 1; i >= 0; i--) {
    if (page >= juzPages[i].startPage) {
      return juzPages[i].juz;
    }
  }
  return 1;
};

export const getHizbByPage = (page: number) => {
  const juz = getJuzByPage(page);
  const juzStartPage = juzPages.find(j => j.juz === juz)?.startPage || 1;
  const relativePage = page - juzStartPage;

  // متوسط صفحات الجزء ≈ 20
  const hizb = relativePage < 10 ? 1 : 2;

  return {
    juz,
    hizb,               // 1 أو 2
    globalHizb: (juz - 1) * 2 + hizb // رقم الحزب في المصحف كامل
  };
};

export const getRubByPage = (page: number) => {
  const juz = getJuzByPage(page);
  const juzStartPage = juzPages.find(j => j.juz === juz)?.startPage || 1;
  const relativePage = page - juzStartPage;

  // 4 أرباع لكل جزء
  const rub = Math.min(4, Math.floor(relativePage / 5) + 1);

  return {
    juz,
    rub,                // 1 → 4
    globalRub: (juz - 1) * 4 + rub
  };
};

// المنازل (7 منازل) - تحزيب القرآن
export const getManzilByPage = (page: number) => {
  if (page <= 105) return 1;
  if (page <= 207) return 2;
  if (page <= 281) return 3;
  if (page <= 366) return 4;
  if (page <= 445) return 5;
  if (page <= 517) return 6;
  return 7;
};
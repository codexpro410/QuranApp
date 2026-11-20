/**
 * أنماط عرض صفحة المصحف.
 *
 * الأنماط النهارية تُطبَّق كطبقة لون شفافة فوق صورة الصفحة الأصلية (البيضاء):
 *   لون الخلفية الناتج = أبيض × (1 - opacity) + overlayColor × opacity
 * وقد اخترنا overlayColor/opacity بحيث تعطي خلفية بالدرجة المطلوبة (bg) مع إبقاء النص داكناً وواضحاً.
 * النمط الليلي يستخدم صوراً مُحوّلة مسبقاً (assets/mushaf_dark) بسكربت tools/make_night_pages.py.
 */
export type PageColorMode = 'paper' | 'sepia' | 'mint' | 'night';

export interface PageStyle {
  id: PageColorMode;
  label: string;
  hint: string;
  /** خلفية الشاشة خلف الصفحة (تطابق لون ورق الصفحة) */
  screenBg: string;
  /** ألوان معاينة الخيار في الإعدادات */
  swatchBg: string;
  swatchText: string;
  swatchBorder: string;
  /** طبقة اللون فوق الصورة (للأنماط النهارية) */
  overlayColor?: string;
  overlayOpacity?: number;
  /** يستخدم صور الوضع الليلي */
  useNightImages: boolean;
}

export const PAGE_STYLES: PageStyle[] = [
  {
    id: 'paper',
    label: 'ورقي',
    hint: 'لون ورق المصحف الدافئ — الافتراضي',
    screenBg: '#F7EED9',
    swatchBg: '#F7EED9',
    swatchText: '#3A2A10',
    swatchBorder: '#D9C79A',
    overlayColor: '#D3A12C',
    overlayOpacity: 0.18,
    useNightImages: false,
  },
  {
    id: 'sepia', // المعرّف يبقى 'sepia' للحفاظ على اختيار المستخدمين المحفوظ
    label: 'كريمي فاتح',
    hint: 'أصفر كريمي فاتح #FEFDEB — قريب من المصحف المطبوع',
    screenBg: '#FEFDEB',
    swatchBg: '#FEFDEB',
    swatchText: '#2B2A18',
    swatchBorder: '#E3DFA8',
    // أبيض×0.9 + #F5EB37×0.1 = #FEFDEB تماماً
    overlayColor: '#F5EB37',
    overlayOpacity: 0.1,
    useNightImages: false,
  },
  {
    id: 'mint',
    label: 'أخضر ناعم',
    hint: 'يقلل الوهج ويريح العين في القراءة الطويلة نهاراً',
    screenBg: '#E2EEE0',
    swatchBg: '#E2EEE0',
    swatchText: '#1F3320',
    swatchBorder: '#A9C7A5',
    overlayColor: '#8BBB83',
    overlayOpacity: 0.25,
    useNightImages: false,
  },
  {
    id: 'night',
    label: 'ليلي للقراءة',
    hint: 'نص أبيض على خلفية سوداء — للقراءة في الظلام',
    screenBg: '#000000',
    swatchBg: '#000000',
    swatchText: '#FFFFFF',
    swatchBorder: '#3A3A3A',
    useNightImages: true,
  },
];

export const DEFAULT_PAGE_STYLE: PageColorMode = 'paper';

export const getPageStyle = (id: PageColorMode): PageStyle =>
  PAGE_STYLES.find(s => s.id === id) ?? PAGE_STYLES[0];

/** تحويل القيم القديمة المحفوظة (white/paper/dark) إلى الأنماط الجديدة */
export const migratePageStyle = (value: string | null): PageColorMode => {
  switch (value) {
    case 'sepia':
    case 'mint':
    case 'night':
      return value;
    case 'dark':
      return 'night';
    default:
      return DEFAULT_PAGE_STYLE; // white / paper القديمين → ورقي
  }
};

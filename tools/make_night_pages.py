#!/usr/bin/env python3
"""
تحويل صور صفحات المصحف (نص أسود على ورق أبيض) إلى نسخة ليلية مريحة للقراءة:
نص أبيض على خلفية سوداء (مثل المصاحف الرقمية الداكنة)، بدون ألوان، مع تباين واضح.

الخطوات (مبنية على سكربتك):
  1) عكس الإضاءة في فضاء LAB (الخلفية البيضاء ← سوداء، والنص الأسود ← فاتح)
  2) تقليل التشبع (الزخارف تصبح رمادية) — KEEP_COLOR = 0.0 أبيض وأسود تماماً
  3) CLAHE لتحسين التباين
  4) تحويل الإضاءة إلى لونين فقط: خلفية سوداء ← نص أبيض (الإعداد الافتراضي)،
     مع "أرضية" تضمن أن الخلفية سوداء تماماً بلا تشويش.
     لو وجدته ساطعاً: غيّر TEXT_RGB إلى (235,235,235) أو أضف --soft

الاستخدام:
  python tools/make_night_pages.py --src assets/mushaf --dst assets/mushaf_dark
  python tools/make_night_pages.py --src assets/mushaf --dst assets/mushaf_dark --only 1 2 604   # صفحات محددة
  python tools/make_night_pages.py --src assets/mushaf --dst assets/mushaf_dark --soft           # أبيض مطفأ (#E6E6E6) بدل الأبيض الصرف
  python tools/make_night_pages.py --src assets/mushaf --dst /tmp/preview --only 2 --compare       # صورة قبل/بعد

المتطلبات:  pip install opencv-python numpy
"""
import argparse
import os
import sys
from concurrent.futures import ProcessPoolExecutor

import cv2
import numpy as np

# ─── الإعدادات ───────────────────────────────────────────────
KEEP_COLOR = 0.0                  # 0.0 = أبيض وأسود تماماً، 0.2 = لمسة باهتة جداً من لون الزخارف الأصلي
CLAHE_CLIP = 2.0                  # قوة CLAHE (سكربتك الأصلي 3.0؛ هنا أخف لتجنب خشونة الحواف)
BLACK_FLOOR = 0.06                # أي قيمة تحت هذه النسبة تصبح أسود تماماً (تنظيف خلفية الصفحة)
CLAHE_GRID = (8, 8)
BG_RGB = (0, 0, 0)                # لون الخلفية: أسود صرف (يوفر بطارية شاشات OLED)
TEXT_RGB = (255, 255, 255)        # لون النص: أبيض
SOFT_TEXT_RGB = (230, 230, 230)   # يُستخدم مع --soft
GAMMA = 0.85                      # <1 يقوّي النص ويسمّك الخطوط الدقيقة قليلاً
WEBP_QUALITY = 92
# ─────────────────────────────────────────────────────────────


def to_night(bgr: np.ndarray) -> np.ndarray:
    lab = cv2.cvtColor(bgr, cv2.COLOR_BGR2LAB)
    l, a, b = cv2.split(lab)

    # 1) عكس الإضاءة
    l = 255 - l

    # 2) تقليل التشبع: a/b مركزهما 128 في OpenCV
    a = np.clip(128 + (a.astype(np.float32) - 128) * KEEP_COLOR, 0, 255).astype(np.uint8)
    b = np.clip(128 + (b.astype(np.float32) - 128) * KEEP_COLOR, 0, 255).astype(np.uint8)

    # 3) تحسين التباين
    l = cv2.createCLAHE(clipLimit=CLAHE_CLIP, tileGridSize=CLAHE_GRID).apply(l)

    # 4) تحويل الإضاءة إلى تدرج بين لون الخلفية ولون النص
    t = l.astype(np.float32) / 255.0
    t = np.clip((t - BLACK_FLOOR) / (1.0 - BLACK_FLOOR), 0.0, 1.0)
    t = np.power(t, GAMMA)[..., None]                                     # H×W×1
    bg = np.array(BG_RGB[::-1], dtype=np.float32)                         # BGR
    fg = np.array(TEXT_RGB[::-1], dtype=np.float32)
    mono = bg + (fg - bg) * t

    if KEEP_COLOR > 0:
        # نُرجع جزءاً من لون الزخارف (قنوات a/b المعكوسة) فوق الصورة الأحادية
        mono_lab = cv2.cvtColor(np.clip(mono, 0, 255).astype(np.uint8), cv2.COLOR_BGR2LAB)
        ml, _, _ = cv2.split(mono_lab)
        mono = cv2.cvtColor(cv2.merge((ml, a, b)), cv2.COLOR_LAB2BGR).astype(np.float32)

    return np.clip(mono, 0, 255).astype(np.uint8)


def process(job):
    src, dst, compare = job
    img = cv2.imread(src, cv2.IMREAD_COLOR)
    if img is None:
        return f"فشل قراءة {src}"
    out = to_night(img)
    if compare:
        out = np.hstack([img, out])
    cv2.imwrite(dst, out, [cv2.IMWRITE_WEBP_QUALITY, WEBP_QUALITY])
    return None


def main():
    ap = argparse.ArgumentParser(description="تحويل صفحات المصحف إلى النمط الليلي")
    ap.add_argument("--src", required=True, help="مجلد الصور الأصلية (001.webp … 604.webp)")
    ap.add_argument("--dst", required=True, help="مجلد المخرجات")
    ap.add_argument("--only", nargs="*", type=int, help="أرقام صفحات محددة فقط")
    ap.add_argument("--compare", action="store_true", help="يحفظ الأصل بجانب الليلي للمعاينة")
    ap.add_argument("--soft", action="store_true", help="نص أبيض مطفأ (#E6E6E6) بدل الأبيض الصرف")
    ap.add_argument("--workers", type=int, default=max(1, (os.cpu_count() or 2) - 1))
    args = ap.parse_args()

    global TEXT_RGB
    if args.soft:
        TEXT_RGB = SOFT_TEXT_RGB
    os.makedirs(args.dst, exist_ok=True)
    pages = args.only or range(1, 605)
    jobs = []
    missing = 0
    for p in pages:
        name = f"{p:03d}.webp"
        src = os.path.join(args.src, name)
        if not os.path.isfile(src):
            missing += 1
            continue
        jobs.append((src, os.path.join(args.dst, name), args.compare))

    if missing:
        print(f"تنبيه: {missing} صفحة غير موجودة في {args.src} وتم تخطيها")
    errors = 0
    with ProcessPoolExecutor(max_workers=args.workers) as ex:
        for i, err in enumerate(ex.map(process, jobs), 1):
            if err:
                errors += 1
                print(err)
            if i % 50 == 0 or i == len(jobs):
                print(f"{i}/{len(jobs)}")
    print(f"تم. الصفحات: {len(jobs) - errors}، الأخطاء: {errors}")
    return 1 if errors else 0


if __name__ == "__main__":
    sys.exit(main())

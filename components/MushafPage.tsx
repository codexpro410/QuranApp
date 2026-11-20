import { Image } from 'expo-image';
import React, { memo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { getPageStyle, type PageColorMode } from '@/constants/pageStyles';
import { getMushafImage, getNightImage } from '@/data/mushafAssets';

type Props = {
  page: number;
  slotWidth: number;
  slotHeight: number;
  imageWidth: number;
  imageHeight: number;
  top?: number;
  pageMode: PageColorMode;
  onPress: () => void;
};

/**
 * طبقة لون النمط النهاري فوق الصورة.
 * إن لم تتوفر صور الوضع الليلي المُحوّلة، نعكس الصورة لحظياً (أبيض↔أسود) ثم نُزيل الألوان،
 * فتظهر الصفحة بنص أبيض على خلفية سوداء حتى قبل تشغيل سكربت التحويل.
 * (المنتج النهائي الأفضل جودة هو صور assets/mushaf_dark.)
 */
export function PageTint({ pageMode, nightMissing = false }: { pageMode: PageColorMode; nightMissing?: boolean }) {
  const style = getPageStyle(pageMode);
  if (style.useNightImages) {
    if (!nightMissing) return null;
    return (
      <>
        <View pointerEvents="none" style={[styles.overlay, styles.invert]} />
        <View pointerEvents="none" style={[styles.overlay, styles.desaturate]} />
      </>
    );
  }
  if (!style.overlayColor) return null;
  return (
    <View
      pointerEvents="none"
      style={[styles.overlay, { backgroundColor: style.overlayColor, opacity: style.overlayOpacity }]}
    />
  );
}

function MushafPage({ page, slotWidth, slotHeight, imageWidth, imageHeight, top = 0, pageMode, onPress }: Props) {
  const style = getPageStyle(pageMode);
  const night = style.useNightImages ? getNightImage(page) : undefined;
  const source = night ?? getMushafImage(page);
  if (!source) return null;

  return (
    <Pressable
      onPress={onPress}
      style={{
        width: slotWidth,
        height: slotHeight,
        alignItems: 'center',
        justifyContent: top > 0 ? 'flex-start' : 'center',
        paddingTop: top,
      }}
    >
      <View style={{ width: imageWidth, height: imageHeight, isolation: 'isolate' }}>
        <Image
          source={source}
          style={{ width: imageWidth, height: imageHeight }}
          contentFit="fill"
          cachePolicy="memory-disk"
          transition={0}
        />
        <PageTint pageMode={pageMode} nightMissing={style.useNightImages && !night} />
      </View>
    </Pressable>
  );
}

// لا تُعاد معالجة الصفحة إلا إذا تغيرت خصائصها فعلاً (مهم جداً لسلاسة التقليب)
export default memo(MushafPage);

const styles = StyleSheet.create({
  overlay: { ...StyleSheet.absoluteFillObject },
  invert: { backgroundColor: '#FFFFFF', mixBlendMode: 'difference' },
  desaturate: { backgroundColor: '#808080', mixBlendMode: 'saturation' },
});

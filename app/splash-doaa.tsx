import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useRef } from 'react';
import {
    Animated,
    Dimensions,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');

const DOAA_LINES = [
  'اللَّهُمَّ اغْفِرْ لِي وَلِوَالِدَيَّ',
  'وَارْحَمْهُمَا كَمَا رَبَّيَانِي صَغِيرًا',
  'اللَّهُمَّ أَدْخِلْنِي وَإِيَّاهُمَا الْجَنَّةَ',
  'بِغَيْرِ حِسَابٍ وَلَا سَابِقَةِ عَذَابٍ',
];

type Props = {
  /** عند بدء التطبيق: يُستدعى تلقائياً بعد انتهاء الشاشة */
  onComplete?: () => void;
  /** عند فتحها من «المزيد»: يُستدعى عند الضغط على آمين أو زر الإغلاق (ولا تُغلق تلقائياً) */
  onClose?: () => void;
};

/**
 * كان الخطأ: هذا المكوّن مسجّل كمسار (route) في expo-router فيُستدعى بدون أي props،
 * فبعد 3.5 ثانية ينفذ onComplete() وهو undefined ← "onComplete is not a function".
 */
export function DoaaSplash({ onComplete, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const stars = useMemo(
    () => [...Array(30)].map(() => ({
      top: Math.random() * height,
      left: Math.random() * width,
      size: Math.random() * 3 + 1,
      opacity: Math.random() * 0.5 + 0.3,
    })),
    []
  );
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const lineAnims = useRef(DOAA_LINES.map(() => new Animated.Value(0))).current;
  const amenAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();

    lineAnims.forEach((anim, index) => {
      Animated.timing(anim, {
        toValue: 1,
        duration: 600,
        delay: 800 + (index * 400),
        useNativeDriver: true,
      }).start();
    });

    Animated.timing(amenAnim, {
      toValue: 1,
      duration: 800,
      delay: 800 + (DOAA_LINES.length * 400) + 200,
      useNativeDriver: true,
    }).start();

    // شاشة البداية فقط تُغلق تلقائياً؛ شاشة الدعاء تنتظر المستخدم ليقرأ ويضغط آمين
    if (!onComplete) return;
    const timer = setTimeout(onComplete, 3500);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <View style={splashStyles.container}>
      <LinearGradient
        colors={['#0a1628', '#132743', '#1a365d']}
        style={splashStyles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={splashStyles.starsContainer}>
          {stars.map((s, i) => (
            <View
              key={i}
              style={[
                splashStyles.star,
                { top: s.top, left: s.left, width: s.size, height: s.size, opacity: s.opacity },
              ]}
            />
          ))}
        </View>

        <Animated.View
          style={[
            splashStyles.content,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <View style={splashStyles.iconContainer}>
            <Text style={splashStyles.quranIcon}>📖</Text>
          </View>

          <Text style={splashStyles.bismillah}>
            بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
          </Text>

          <View style={splashStyles.decorativeLine} />

          <View style={splashStyles.doaaContainer}>
            {DOAA_LINES.map((line, index) => (
              <Animated.Text
                key={index}
                style={[
                  splashStyles.doaaLine,
                  {
                    opacity: lineAnims[index],
                    transform: [
                      {
                        translateY: lineAnims[index].interpolate({
                          inputRange: [0, 1],
                          outputRange: [20, 0],
                        }),
                      },
                    ],
                  },
                ]}
              >
                {line}
              </Animated.Text>
            ))}
          </View>

          <Animated.View
            style={[
              splashStyles.amenContainer,
              {
                opacity: amenAnim,
                transform: [
                  {
                    scale: amenAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.5, 1],
                    }),
                  },
                ],
              },
            ]}
          >
            {onClose ? (
              <TouchableOpacity onPress={onClose} activeOpacity={0.7}>
                <Text style={splashStyles.amen}>آمين</Text>
              </TouchableOpacity>
            ) : (
              <Text style={splashStyles.amen}>آمين</Text>
            )}
          </Animated.View>
        </Animated.View>

        {onClose && (
          <TouchableOpacity
            style={[splashStyles.closeBtn, { top: insets.top + 12 }]}
            onPress={onClose}
            hitSlop={12}
          >
            <Text style={splashStyles.closeText}>✕</Text>
          </TouchableOpacity>
        )}

        <View style={splashStyles.footer}>
          <View style={splashStyles.crescentContainer}>
            <Text style={splashStyles.crescent}>☪</Text>
          </View>
        </View>
      </LinearGradient>
    </View>
  );
}

const splashStyles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  starsContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  star: {
    position: 'absolute',
    backgroundColor: '#fff',
    borderRadius: 10,
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(212, 175, 55, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 2,
    borderColor: 'rgba(212, 175, 55, 0.3)',
  },
  quranIcon: {
    fontSize: 40,
  },
  bismillah: {
    fontSize: 22,
    color: '#D4AF37',
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 16,
  },
  decorativeLine: {
    width: 60,
    height: 2,
    backgroundColor: '#D4AF37',
    borderRadius: 1,
    marginBottom: 32,
    opacity: 0.6,
  },
  doaaContainer: {
    alignItems: 'center',
    gap: 12,
  },
  doaaLine: {
    fontSize: 24,
    color: '#f0f0f0',
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 42,
  },
  amenContainer: {
    marginTop: 32,
    paddingHorizontal: 40,
    paddingVertical: 12,
    backgroundColor: 'rgba(212, 175, 55, 0.15)',
    borderRadius: 30,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.4)',
  },
  amen: {
    fontSize: 28,
    color: '#D4AF37',
    fontWeight: '700',
  },
  closeBtn: {
    position: 'absolute',
    left: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  closeText: { color: '#f0f0f0', fontSize: 16 },
  footer: {
    position: 'absolute',
    bottom: 60,
  },
  crescentContainer: {
    opacity: 0.4,
  },
  crescent: {
    fontSize: 30,
    color: '#D4AF37',
  },
});
// الشاشة كمسار (من «المزيد»): ترجع للخلف عند الضغط على آمين
export default function DoaaScreen() {
  const router = useRouter();
  return (
    <DoaaSplash
      onClose={() => (router.canGoBack() ? router.back() : router.replace('/'))}
    />
  );
}

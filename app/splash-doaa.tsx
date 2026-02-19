import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

const DOAA_LINES = [
  'اللَّهُمَّ اغْفِرْ لِي وَلِوَالِدَيَّ',
  'وَارْحَمْهُمَا كَمَا رَبَّيَانِي صَغِيرًا',
  'اللَّهُمَّ أَدْخِلْنِي وَإِيَّاهُمَا الْجَنَّةَ',
  'بِغَيْرِ حِسَابٍ وَلَا سَابِقَةِ عَذَابٍ',
];

export default function DoaaSplash({ onComplete }: { onComplete: () => void }) {
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

    const timer = setTimeout(() => {
      onComplete();
    }, 5500);

    return () => clearTimeout(timer);
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
          {[...Array(30)].map((_, i) => (
            <View
              key={i}
              style={[
                splashStyles.star,
                {
                  top: Math.random() * height,
                  left: Math.random() * width,
                  width: Math.random() * 3 + 1,
                  height: Math.random() * 3 + 1,
                  opacity: Math.random() * 0.5 + 0.3,
                },
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
            <Text style={splashStyles.amen}>آمين</Text>
          </Animated.View>
        </Animated.View>

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
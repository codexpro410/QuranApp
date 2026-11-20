import Constants from 'expo-constants';
import { Platform } from 'react-native';

type NotificationsModule = typeof import('expo-notifications');

// expo-notifications لا يعمل داخل Expo Go على أندرويد (SDK 53+) ولا على الويب،
// لذلك نحمّله عند الحاجة فقط ونتجاوزه بهدوء في هذه الحالات.
const supported =
  Platform.OS !== 'web' && !(Constants.appOwnership === 'expo' && Platform.OS === 'android');

let modulePromise: Promise<NotificationsModule | null> | null = null;

export function getNotifications(): Promise<NotificationsModule | null> {
  if (!supported) return Promise.resolve(null);
  if (!modulePromise) {
    modulePromise = import('expo-notifications')
      .then(async (N) => {
        N.setNotificationHandler({
          handleNotification: async () => ({
            shouldPlaySound: true,
            shouldSetBadge: false,
            shouldShowBanner: true,
            shouldShowList: true,
          }),
        });
        if (Platform.OS === 'android') {
          await N.setNotificationChannelAsync('default', {
            name: 'التنبيهات',
            importance: N.AndroidImportance.MAX,
          }).catch(() => {});
        }
        return N;
      })
      .catch((e) => {
        console.log('Notifications not available:', e);
        return null;
      });
  }
  return modulePromise;
}

export async function ensureNotificationPermission(): Promise<boolean> {
  const N = await getNotifications();
  if (!N) return false;
  try {
    const existing = await N.getPermissionsAsync();
    if (existing.status === 'granted') return true;
    const req = await N.requestPermissionsAsync();
    return req.status === 'granted';
  } catch (e) {
    console.log('Notification permission error:', e);
    return false;
  }
}

/** يلغي فقط الإشعارات التي يبدأ معرّفها بالبادئة المعطاة (دون المساس ببقية إشعارات التطبيق). */
export async function cancelScheduledByPrefix(prefix: string): Promise<void> {
  const N = await getNotifications();
  if (!N) return;
  try {
    const all = await N.getAllScheduledNotificationsAsync();
    await Promise.all(
      all
        .filter((n) => n.identifier.startsWith(prefix))
        .map((n) => N.cancelScheduledNotificationAsync(n.identifier).catch(() => {}))
    );
  } catch (e) {
    console.log('cancelScheduledByPrefix error:', e);
  }
}

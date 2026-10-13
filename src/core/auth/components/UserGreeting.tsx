import { useEffect, useState } from 'react';
import { View } from 'react-native';

import { Text } from '@/components/ui/text';

import { useAuthTranslation } from '../i18n';
import { useAuth } from './use.auth';
import { UserAvatar } from './UserAvatar';

type GreetingSlot = 'night' | 'morning' | 'noon' | 'afternoon' | 'evening' | 'late';

/** Tageszeit-Abschnitt einer Stunde (0–23) – wie greeting.utils.ts der Web-App. */
const getGreetingSlot = (hour: number): GreetingSlot => {
  if (hour < 5) return 'night';
  if (hour < 11) return 'morning';
  if (hour < 14) return 'noon';
  if (hour < 18) return 'afternoon';
  if (hour < 22) return 'evening';
  return 'late';
};

/** Gleiche Variante den ganzen Tag/Abschnitt – wechselt von Tag zu Tag. */
const pickVariant = (date: Date, slot: GreetingSlot, count: number) => {
  const day = Math.floor(date.getTime() / 86_400_000);
  const seed = [...slot].reduce((sum, char) => sum + char.charCodeAt(0), day);
  return count > 0 ? seed % count : 0;
};

const toDate = (value: unknown): Date | null => {
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  if (typeof value === 'number' || typeof value === 'string') {
    const date = new Date(typeof value === 'string' && /^\d+$/.test(value) ? Number(value) : value);
    return Number.isNaN(date.getTime()) ? null : date;
  }
  return null;
};

const formatRelativeTime = (date: Date, now: Date, locale: string) => {
  const seconds = Math.round((date.getTime() - now.getTime()) / 1000);
  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ['year', 31_536_000],
    ['month', 2_592_000],
    ['week', 604_800],
    ['day', 86_400],
    ['hour', 3_600],
    ['minute', 60],
  ];
  try {
    const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
    for (const [unit, size] of units) {
      if (Math.abs(seconds) >= size) return rtf.format(Math.round(seconds / size), unit);
    }
    return rtf.format(0, 'minute');
  } catch {
    return date.toLocaleString(locale);
  }
};

/** Aktuelle Zeit, jede Minute aktualisiert. */
const useNow = () => {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(timer);
  }, []);
  return now;
};

interface IProps {
  children?: React.ReactNode;
}

/** Begrüßung des angemeldeten Benutzers (vereinfachte Fassung von UserGreeting der Web-App). */
export const UserGreeting = ({ children }: IProps) => {
  const { t, list, language } = useAuthTranslation();
  const { userMeta } = useAuth();
  const now = useNow();

  const slot = getGreetingSlot(now.getHours());
  const variants = list(`greeting.slots.${slot}`);
  const hello = variants[pickVariant(now, slot, variants.length)] ?? t('greeting.guest.fallbackTitle');
  const name = userMeta?.alias?.trim() || userMeta?.email?.split('@')[0] || '';
  const lastLogin = toDate(userMeta?.lastLogin);

  return (
    <View className="gap-6">
      <View className="flex-row items-center gap-4">
        <UserAvatar name={name} avatarUrl={userMeta?.avatarUrl} size={56} />
        <View className="flex-1 gap-0.5">
          <Text className="text-[26px] font-extrabold leading-8 tracking-tight text-foreground">
            {name ? `${hello}, ${name}` : hello}
          </Text>
          {lastLogin && (
            <Text className="text-sm text-muted-foreground">
              {t('greeting.lastLogin', { time: formatRelativeTime(lastLogin, now, language) })}
            </Text>
          )}
        </View>
      </View>
      <Text className="text-[15px] leading-5 text-muted-foreground">{t(`greeting.subline.${slot}`)}</Text>
      {children}
    </View>
  );
};

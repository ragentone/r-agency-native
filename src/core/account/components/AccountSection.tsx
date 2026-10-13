import type { ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { useThemeColors } from '@/core/theme/colors';
import { AppIcon, type AppIconName } from '@/core/ui/AppIcon';
import { cn } from '@/lib/utils';

interface IProps {
  icon: AppIconName;
  title: string;
  description?: string;
  /** Rote Darstellung für unwiderrufliche Aktionen (Löschen). */
  destructive?: boolean;
  open: boolean;
  onToggle: () => void;
  last?: boolean;
  children: ReactNode;
}

/** Einstellungs-Zeile in einer Gruppen-Karte: Icon, Titel, Beschreibung, klappt auf (Web: Accordion). */
export const AccountSection = ({ icon, title, description, destructive, open, onToggle, last, children }: IProps) => {
  const colors = useThemeColors();
  const iconColor = destructive ? colors.destructive : open ? colors.background : colors.foreground;

  return (
    <View className={cn(!last && 'border-b border-border/50', open && 'bg-foreground/[0.02]')}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        onPress={onToggle}
        className="flex-row items-center gap-3.5 px-4 py-3.5 active:bg-foreground/5"
      >
        <View
          className={cn(
            'h-10 w-10 items-center justify-center rounded-xl',
            destructive ? 'bg-destructive/10' : open ? 'bg-foreground' : 'bg-foreground/5'
          )}
        >
          <AppIcon name={icon} size={18} color={iconColor} />
        </View>
        <View className="flex-1">
          <Text
            numberOfLines={1}
            className={cn('text-[15px] font-semibold leading-5', destructive ? 'text-destructive' : 'text-foreground')}
          >
            {title}
          </Text>
          {description && <Text className="mt-0.5 text-xs leading-4 text-muted-foreground">{description}</Text>}
        </View>
        <AppIcon name={open ? 'chevronUp' : 'chevronDown'} size={16} color={colors.muted} />
      </Pressable>
      {open && (
        <Animated.View entering={FadeIn.duration(200)}>
          <View className="px-4 pb-6 pt-2">{children}</View>
        </Animated.View>
      )}
    </View>
  );
};

/** Überschrift einer Gruppe. */
export const AccountGroupLabel = ({ children, danger }: { children: ReactNode; danger?: boolean }) => (
  <Text
    accessibilityRole="header"
    className={cn(
      'px-1 pb-2 text-[11px] font-semibold uppercase tracking-wider',
      danger ? 'text-destructive/80' : 'text-muted-foreground'
    )}
  >
    {children}
  </Text>
);

/** Gruppen-Karte mit Rahmen. */
export const AccountGroupCard = ({ children, danger }: { children: ReactNode; danger?: boolean }) => (
  <View
    className={cn(
      'overflow-hidden rounded-2xl border bg-background',
      danger ? 'border-destructive/25' : 'border-border/50'
    )}
  >
    {children}
  </View>
);

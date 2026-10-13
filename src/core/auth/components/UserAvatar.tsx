import { Image } from 'expo-image';
import { useState } from 'react';
import { Text, View } from 'react-native';

import { cn } from '@/lib/utils';

interface IProps {
  name?: string | null;
  avatarUrl?: string | null;
  size?: number;
  className?: string;
}

/** Avatar mit Initialen als Fallback (Web: shadcn Avatar). */
export const UserAvatar = ({ name, avatarUrl, size = 40, className }: IProps) => {
  const [failed, setFailed] = useState(false);
  const initials = (name || 'U').slice(0, 2).toUpperCase();

  return (
    <View
      className={cn('items-center justify-center overflow-hidden rounded-full bg-muted', className)}
      style={{ width: size, height: size }}
    >
      {avatarUrl && !failed ? (
        <Image
          source={{ uri: avatarUrl }}
          style={{ width: size, height: size }}
          contentFit="cover"
          onError={() => setFailed(true)}
          accessibilityIgnoresInvertColors
        />
      ) : (
        <Text
          className="font-semibold text-foreground"
          style={{ fontSize: Math.max(11, Math.round(size * 0.32)) }}
        >
          {initials}
        </Text>
      )}
    </View>
  );
};

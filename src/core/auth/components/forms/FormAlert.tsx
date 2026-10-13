import { Text, View } from 'react-native';

import { useThemeColors } from '@/core/theme/colors';
import { AppIcon } from '@/core/ui/AppIcon';
import { cn } from '@/lib/utils';

interface IProps {
  message?: string | null;
  variant?: 'destructive' | 'success';
  className?: string;
}

/** Hinweisbox über dem Formular (Web: shadcn Alert). */
export const FormAlert = ({ message, variant = 'destructive', className }: IProps) => {
  const colors = useThemeColors();
  if (!message) return null;
  const success = variant === 'success';
  return (
    <View
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
      className={cn(
        'flex-row items-start gap-3 rounded-xl border p-3.5',
        success ? 'border-foreground/15 bg-muted/60' : 'border-destructive/30 bg-destructive/5',
        className
      )}
    >
      <View className="mt-0.5">
        <AppIcon
          name={success ? 'checkCircle' : 'alert'}
          size={16}
          color={success ? colors.success : colors.destructive}
        />
      </View>
      <Text className={cn('flex-1 text-sm leading-5', success ? 'text-foreground' : 'text-destructive')}>
        {message}
      </Text>
    </View>
  );
};

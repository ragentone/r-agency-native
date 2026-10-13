import { ActivityIndicator } from 'react-native';

import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { useThemeColors } from '@/core/theme/colors';
import { cn } from '@/lib/utils';

interface IProps {
  label: string;
  pendingLabel: string;
  pending: boolean;
  disabled?: boolean;
  onPress(): void;
  className?: string;
}

export const SubmitButton = ({ label, pendingLabel, pending, disabled, onPress, className }: IProps) => {
  const colors = useThemeColors();
  return (
    <Button
      onPress={onPress}
      disabled={disabled ?? pending}
      accessibilityState={{ busy: pending }}
      className={cn('h-12 w-full rounded-full', className)}
    >
      {pending && <ActivityIndicator size="small" color={colors.primaryForeground} />}
      <Text className="text-[15px] font-bold">{pending ? pendingLabel : label}</Text>
    </Button>
  );
};

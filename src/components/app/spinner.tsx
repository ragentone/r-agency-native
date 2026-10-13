import { LoaderCircleIcon } from 'lucide-react-native';
import { View } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { cn } from '@/lib/utils';

/**
 * Lade-Indikator aus dem Reusables-`Icon` (wie in den Reusables-Beispielen: Loader + animate-spin).
 * Erbt die Textfarbe (z. B. innerhalb eines Buttons) über TextClassContext.
 */
export const Spinner = ({ className, size = 16 }: { className?: string; size?: number }) => (
  <View className="pointer-events-none animate-spin">
    <Icon as={LoaderCircleIcon} size={size} className={cn(className)} />
  </View>
);

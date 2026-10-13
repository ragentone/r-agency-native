import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { useThemeColors } from '@/core/theme/colors';
import { AppIcon } from '@/core/ui/AppIcon';
import { cn } from '@/lib/utils';

import { useAuthTranslation } from '../i18n';
import { useAuth } from './use.auth';

/** Abmelden-Knopf – öffnet den Bestätigungsdialog. */
export const AuthLogoutTrigger = ({ className }: { className?: string }) => {
  const { t } = useAuthTranslation();
  const colors = useThemeColors();
  const { preLogout, isLoggingOut, authorized } = useAuth();
  if (!authorized) return null;
  return (
    <Button variant="outline" onPress={preLogout} disabled={isLoggingOut} className={cn('rounded-full', className)}>
      <AppIcon name="logout" size={16} color={colors.foreground} />
      <Text>{t('logout.trigger')}</Text>
    </Button>
  );
};

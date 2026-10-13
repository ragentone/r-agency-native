import { LogOutIcon } from 'lucide-react-native';

import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';

import { useAuthTranslation } from '../i18n';
import { useAuth } from './use.auth';

/** Abmelden-Knopf – öffnet den Bestätigungsdialog. */
export const AuthLogoutTrigger = ({ className }: { className?: string }) => {
  const { t } = useAuthTranslation();
  const { preLogout, isLoggingOut, authorized } = useAuth();
  if (!authorized) return null;
  return (
    <Button variant="outline" onPress={preLogout} disabled={isLoggingOut} className={cn('rounded-full', className)}>
      <Icon as={LogOutIcon} size={16} />
      <Text>{t('logout.trigger')}</Text>
    </Button>
  );
};

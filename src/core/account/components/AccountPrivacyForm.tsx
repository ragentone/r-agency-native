import { EyeIcon, GlobeIcon, type LucideIcon, MailIcon, SearchIcon } from 'lucide-react-native';
import { useState } from 'react';
import { View } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Text } from '@/components/ui/text';
import { FormAlert } from '@/core/auth/components/forms/FormAlert';
import { SubmitButton } from '@/core/auth/components/forms/SubmitButton';
import { toErrorMessage, useAuthTranslation } from '@/core/auth/i18n';
import { cn } from '@/lib/utils';

import { useAccountTranslation } from '../i18n';
import type { IUserAccount, IUserSettings } from '../types';
import { useAccount } from '../use.account';

interface IProps {
  account: IUserAccount;
  onSuccess?: () => void;
}

const ITEMS: { field: keyof IUserSettings; icon: LucideIcon }[] = [
  { field: 'public', icon: GlobeIcon },
  { field: 'searchable', icon: SearchIcon },
  { field: 'showEmail', icon: MailIcon },
  { field: 'showFullName', icon: EyeIcon },
];

/** Privatsphäre & Sichtbarkeit (Reusables `Switch` + `Label`). */
export const AccountPrivacyForm = ({ account, onSuccess }: IProps) => {
  const { t } = useAccountTranslation();
  const auth = useAuthTranslation();
  const { updateSettings } = useAccount(false);
  const [settings, setSettings] = useState<IUserSettings>({
    public: account.settings?.public ?? true,
    searchable: account.settings?.searchable ?? true,
    showEmail: account.settings?.showEmail ?? false,
    showFullName: account.settings?.showFullName ?? true,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const set = (field: keyof IUserSettings, value: boolean) => setSettings(prev => ({ ...prev, [field]: value }));

  const submit = async () => {
    setError(null);
    setSuccess(null);
    setSubmitting(true);
    try {
      const ok = await updateSettings(settings, account.id);
      if (!ok) throw new Error(t('messages.updateError'));
      setSuccess(t('messages.updateSuccess'));
      onSuccess?.();
    } catch (err) {
      setError(toErrorMessage(err, auth.t, auth.has, '') || t('messages.updateError'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View className="gap-4">
      <FormAlert message={error} />
      <FormAlert message={success} variant="success" />
      <View className="-mx-4">
        {ITEMS.map((item, index) => {
          const id = `account-${item.field}`;
          return (
            <View key={item.field}>
              {index > 0 && <Separator />}
              <View className={cn('flex-row items-center gap-3 px-4 py-3', submitting && 'opacity-60')}>
                <Icon as={item.icon} size={20} />
                <View className="flex-1">
                  <Label nativeID={id} onPress={() => set(item.field, !settings[item.field])} disabled={submitting}>
                    {t(`form.${item.field}`)}
                  </Label>
                  <Text variant="muted" className="mt-1 text-xs">
                    {t(`form.${item.field}Desc`)}
                  </Text>
                </View>
                <Switch
                  aria-labelledby={id}
                  checked={settings[item.field]}
                  onCheckedChange={value => set(item.field, value)}
                  disabled={submitting}
                />
              </View>
            </View>
          );
        })}
      </View>
      <SubmitButton label={t('form.submit')} pendingLabel={t('form.submitting')} pending={submitting} onPress={submit} />
    </View>
  );
};

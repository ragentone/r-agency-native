import { useState } from 'react';
import { Pressable, Switch, Text, View } from 'react-native';

import { FormAlert } from '@/core/auth/components/forms/FormAlert';
import { SubmitButton } from '@/core/auth/components/forms/SubmitButton';
import { toErrorMessage, useAuthTranslation } from '@/core/auth/i18n';
import { useThemeColors } from '@/core/theme/colors';
import { AppIcon, type AppIconName } from '@/core/ui/AppIcon';

import { useAccountTranslation } from '../i18n';
import type { IUserAccount, IUserSettings } from '../types';
import { useAccount } from '../use.account';

interface IProps {
  account: IUserAccount;
  onSuccess?: () => void;
}

const ITEMS: { field: keyof IUserSettings; icon: AppIconName }[] = [
  { field: 'public', icon: 'globe' },
  { field: 'searchable', icon: 'search' },
  { field: 'showEmail', icon: 'mail' },
  { field: 'showFullName', icon: 'eye' },
];

/** Privatsphäre & Sichtbarkeit (Web: AccountPrivacyForm + AccountPrivacyFields). */
export const AccountPrivacyForm = ({ account, onSuccess }: IProps) => {
  const { t } = useAccountTranslation();
  const auth = useAuthTranslation();
  const colors = useThemeColors();
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

  const toggle = (field: keyof IUserSettings, value?: boolean) =>
    setSettings(prev => ({ ...prev, [field]: value ?? !prev[field] }));

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
      <View className="-mx-4 border-y border-border/50">
        {ITEMS.map((item, index) => (
          <Pressable
            key={item.field}
            accessibilityRole="switch"
            accessibilityState={{ checked: settings[item.field], disabled: submitting }}
            disabled={submitting}
            onPress={() => toggle(item.field)}
            className={`flex-row items-center gap-3 px-4 py-3 active:bg-foreground/5 ${
              index > 0 ? 'border-t border-border/50' : ''
            } ${submitting ? 'opacity-60' : ''}`}
          >
            <AppIcon name={item.icon} size={20} color={colors.foreground} />
            <View className="flex-1">
              <Text className="text-[15px] font-medium text-foreground">{t(`form.${item.field}`)}</Text>
              <Text className="text-xs leading-4 text-muted-foreground">{t(`form.${item.field}Desc`)}</Text>
            </View>
            <Switch
              value={settings[item.field]}
              onValueChange={value => toggle(item.field, value)}
              disabled={submitting}
              trackColor={{ true: colors.foreground, false: colors.border }}
              thumbColor={colors.background}
              ios_backgroundColor={colors.border}
            />
          </Pressable>
        ))}
      </View>
      <SubmitButton label={t('form.submit')} pendingLabel={t('form.submitting')} pending={submitting} onPress={submit} />
    </View>
  );
};

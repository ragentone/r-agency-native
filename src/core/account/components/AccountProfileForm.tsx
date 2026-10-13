import { AtSignIcon, CalendarIcon, MailIcon, UserRoundIcon } from 'lucide-react-native';
import { useMemo, useRef, useState } from 'react';
import { type TextInput, View } from 'react-native';

import { FormAlert } from '@/core/auth/components/forms/FormAlert';
import { FormField } from '@/core/auth/components/forms/FormField';
import { SubmitButton } from '@/core/auth/components/forms/SubmitButton';
import { useForm } from '@/core/auth/components/forms/use.form';
import { toErrorMessage, useAuthTranslation } from '@/core/auth/i18n';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';

import { useAccountTranslation } from '../i18n';
import type { IUserAccount } from '../types';
import { useAccount } from '../use.account';
import {
  ACCOUNT_DESCRIPTION_MAX_LENGTH,
  hasRichFormatting,
  htmlToText,
  textToHtml,
  validateProfile,
} from '../validation';

interface IProps {
  account: IUserAccount;
  onSuccess?: () => void;
}

const GENDERS = ['male', 'female', 'unknown'] as const;
const GENDER_LABEL: Record<(typeof GENDERS)[number], string> = {
  male: 'form.genderMale',
  female: 'form.genderFemale',
  unknown: 'form.genderUnknown',
};

/** Profil & Daten (Web: AccountProfileForm + AccountPersonalFields + AccountBioField). */
export const AccountProfileForm = ({ account, onSuccess }: IProps) => {
  const { t } = useAccountTranslation();
  // Backend-Fehlercodes (z. B. user_alias_in_use) stehen in den Auth-Übersetzungen.
  const auth = useAuthTranslation();
  const { updateAccount, aliasTaken } = useAccount(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const firstnameRef = useRef<TextInput>(null);
  const lastnameRef = useRef<TextInput>(null);
  const birthdayRef = useRef<TextInput>(null);

  const originalHtml = account.description?.html ?? '';
  const originalText = useMemo(() => htmlToText(originalHtml), [originalHtml]);
  const richFormatting = hasRichFormatting(originalHtml);

  const form = useForm(
    {
      alias: account.alias ?? '',
      firstname: account.details?.firstname ?? '',
      lastname: account.details?.lastname ?? '',
      gender: account.gender ?? 'unknown',
      birthday: account.birthday ? account.birthday.slice(0, 10) : '',
      description: originalText,
    },
    values => validateProfile(values, t)
  );

  const checkAlias = async () => {
    if (form.errors.alias) return;
    if (await aliasTaken(form.values.alias, account.alias)) {
      form.setFieldError('alias', t('validation.aliasExists'));
    }
  };

  const submit = async () => {
    setError(null);
    setSuccess(null);
    if (!form.touchAll() || form.submitting) return;
    form.setSubmitting(true);
    try {
      if (await aliasTaken(form.values.alias, account.alias)) {
        form.setFieldError('alias', t('validation.aliasExists'));
        return;
      }
      const description = form.values.description;
      const success = await updateAccount({
        id: account.id,
        alias: form.values.alias.trim(),
        gender: form.values.gender,
        birthday: form.values.birthday.trim() || undefined,
        details: {
          firstname: form.values.firstname.trim() || undefined,
          lastname: form.values.lastname.trim() || undefined,
        },
        // Unveränderter Text → Original-HTML behalten (Formatierungen aus der Web-Version).
        description: { html: description === originalText ? originalHtml : textToHtml(description) },
      });
      if (!success) throw new Error(t('messages.updateError'));
      setSuccess(t('messages.updateSuccess'));
      onSuccess?.();
    } catch (err) {
      setError(toErrorMessage(err, auth.t, auth.has, '') || t('messages.updateError'));
    } finally {
      form.setSubmitting(false);
    }
  };

  const aliasField = form.field('alias');
  const descriptionLength = form.values.description.length;

  return (
    <View className="gap-4">
      <FormAlert message={error} />
      <FormAlert message={success} variant="success" />

      <FormField
        label={t('form.alias')}
        placeholder={t('form.aliasPlaceholder')}
        icon={AtSignIcon}
        autoComplete="username"
        maxLength={32}
        returnKeyType="next"
        onSubmitEditing={() => firstnameRef.current?.focus()}
        editable={!form.submitting}
        {...aliasField}
        onBlur={() => {
          aliasField.onBlur();
          void checkAlias();
        }}
      />
      <FormField label={t('form.email')} icon={MailIcon} defaultValue={account.email} editable={false} />
      <FormField
        ref={firstnameRef}
        label={t('form.firstname')}
        placeholder={t('form.firstnamePlaceholder')}
        icon={UserRoundIcon}
        autoCapitalize="words"
        autoComplete="given-name"
        returnKeyType="next"
        onSubmitEditing={() => lastnameRef.current?.focus()}
        editable={!form.submitting}
        {...form.field('firstname')}
      />
      <FormField
        ref={lastnameRef}
        label={t('form.lastname')}
        placeholder={t('form.lastnamePlaceholder')}
        icon={UserRoundIcon}
        autoComplete="family-name"
        returnKeyType="next"
        onSubmitEditing={() => birthdayRef.current?.focus()}
        editable={!form.submitting}
        {...form.field('lastname')}
      />

      <View className="gap-2">
        <Label nativeID="account-gender">{t('form.gender')}</Label>
        <RadioGroup
          aria-labelledby="account-gender"
          value={form.values.gender}
          onValueChange={value => form.setValue('gender', value)}
          disabled={form.submitting}
          className="gap-3"
        >
          {GENDERS.map(gender => (
            <View key={gender} className="flex-row items-center gap-3">
              <RadioGroupItem value={gender} aria-labelledby={`gender-${gender}`} />
              <Label nativeID={`gender-${gender}`} onPress={() => form.setValue('gender', gender)}>
                {t(GENDER_LABEL[gender])}
              </Label>
            </View>
          ))}
        </RadioGroup>
      </View>

      <View className="gap-1.5">
        <FormField
          ref={birthdayRef}
          label={t('form.birthday')}
          placeholder={t('form.birthdayPlaceholder')}
          icon={CalendarIcon}
          keyboardType="numbers-and-punctuation"
          maxLength={10}
          editable={!form.submitting}
          {...form.field('birthday')}
        />
        <Text variant="muted" className="text-xs">
          {t('native.birthdayHint')}
        </Text>
      </View>

      <View className="gap-1.5">
        <FormField
          label={t('form.description')}
          placeholder={t('form.descriptionPlaceholder')}
          textarea
          autoCapitalize="sentences"
          autoCorrect
          editable={!form.submitting}
          {...form.field('description')}
        />
        <Text
          className={cn(
            'self-end text-xs',
            descriptionLength > ACCOUNT_DESCRIPTION_MAX_LENGTH ? 'text-destructive' : 'text-muted-foreground'
          )}
        >
          {t('native.characters', { count: descriptionLength, max: ACCOUNT_DESCRIPTION_MAX_LENGTH })}
        </Text>
        {richFormatting && (
          <Text variant="muted" className="text-xs">
            {t('native.descriptionFormatted')}
          </Text>
        )}
      </View>

      <SubmitButton label={t('form.submit')} pendingLabel={t('form.submitting')} pending={form.submitting} onPress={submit} />
    </View>
  );
};

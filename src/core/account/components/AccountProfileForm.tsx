import { useMemo, useRef, useState } from 'react';
import { Pressable, Text, type TextInput, View } from 'react-native';

import { FormAlert } from '@/core/auth/components/forms/FormAlert';
import { FormField } from '@/core/auth/components/forms/FormField';
import { SubmitButton } from '@/core/auth/components/forms/SubmitButton';
import { useForm } from '@/core/auth/components/forms/use.form';
import { toErrorMessage, useAuthTranslation } from '@/core/auth/i18n';
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
        icon="at"
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
      <FormField label={t('form.email')} icon="mail" defaultValue={account.email} editable={false} />
      <FormField
        ref={firstnameRef}
        label={t('form.firstname')}
        placeholder={t('form.firstnamePlaceholder')}
        icon="user"
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
        icon="user"
        autoComplete="family-name"
        returnKeyType="next"
        onSubmitEditing={() => birthdayRef.current?.focus()}
        editable={!form.submitting}
        {...form.field('lastname')}
      />

      <View className="gap-2">
        <Text className="text-sm font-medium text-foreground">{t('form.gender')}</Text>
        <View accessibilityRole="radiogroup" className="flex-row flex-wrap gap-2">
          {GENDERS.map(gender => {
            const selected = form.values.gender === gender;
            return (
              <Pressable
                key={gender}
                accessibilityRole="radio"
                accessibilityState={{ selected, disabled: form.submitting }}
                disabled={form.submitting}
                onPress={() => form.setValue('gender', gender)}
                className={cn(
                  'h-10 justify-center rounded-full border px-4',
                  selected ? 'border-foreground bg-foreground' : 'border-border bg-background active:bg-foreground/5'
                )}
              >
                <Text className={cn('text-sm font-medium', selected ? 'text-background' : 'text-foreground')}>
                  {t(GENDER_LABEL[gender])}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View className="gap-1.5">
        <FormField
          ref={birthdayRef}
          label={t('form.birthday')}
          placeholder={t('form.birthdayPlaceholder')}
          icon="calendar"
          keyboardType="numbers-and-punctuation"
          maxLength={10}
          editable={!form.submitting}
          {...form.field('birthday')}
        />
        <Text className="text-xs text-muted-foreground">{t('native.birthdayHint')}</Text>
      </View>

      <View className="gap-1.5">
        <FormField
          label={t('form.description')}
          placeholder={t('form.descriptionPlaceholder')}
          multiline
          textAlignVertical="top"
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
        {richFormatting && <Text className="text-xs leading-4 text-muted-foreground">{t('native.descriptionFormatted')}</Text>}
      </View>

      <SubmitButton label={t('form.submit')} pendingLabel={t('form.submitting')} pending={form.submitting} onPress={submit} />
    </View>
  );
};

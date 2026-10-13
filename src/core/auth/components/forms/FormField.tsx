import { forwardRef, useState } from 'react';
import { Pressable, Text, TextInput, type TextInputProps, View } from 'react-native';

import { useThemeColors } from '@/core/theme/colors';
import { AppIcon, type AppIconName } from '@/core/ui/AppIcon';
import { cn } from '@/lib/utils';

import { useAuthTranslation } from '../../i18n';

interface IProps extends Omit<TextInputProps, 'className'> {
  label: string;
  error?: string;
  icon?: AppIconName;
  /** Passwortfeld mit Anzeigen/Ausblenden-Schalter. */
  password?: boolean;
  className?: string;
}

/** Eingabefeld mit Label, Icon und Fehlermeldung (Web: shadcn Field + Input). */
export const FormField = forwardRef<TextInput, IProps>(
  ({ label, error, icon, password, className, editable = true, ...inputProps }, ref) => {
    const colors = useThemeColors();
    const { t } = useAuthTranslation();
    const [visible, setVisible] = useState(false);
    const [focused, setFocused] = useState(false);
    const invalid = Boolean(error);

    return (
      <View className={cn('gap-2', className)}>
        <Text className={cn('text-sm font-medium', invalid ? 'text-destructive' : 'text-foreground')}>
          {label}
        </Text>
        <View className="relative justify-center">
          {icon && (
            <View pointerEvents="none" className="absolute left-3.5 z-10">
              <AppIcon name={icon} size={16} color={colors.muted} />
            </View>
          )}
          <TextInput
            ref={ref}
            {...inputProps}
            accessibilityLabel={label}
            accessibilityHint={error}
            editable={editable}
            placeholderTextColor={colors.muted}
            secureTextEntry={password && !visible}
            autoCapitalize="none"
            autoCorrect={false}
            onFocus={event => {
              setFocused(true);
              inputProps.onFocus?.(event);
            }}
            onBlur={event => {
              setFocused(false);
              inputProps.onBlur?.(event);
            }}
            className={cn(
              'h-12 rounded-xl border bg-background text-base text-foreground',
              icon ? 'pl-10' : 'pl-3.5',
              password ? 'pr-12' : 'pr-3.5',
              invalid ? 'border-destructive' : focused ? 'border-foreground/40' : 'border-input',
              !editable && 'opacity-50'
            )}
          />
          {password && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={visible ? t('form.hidePassword') : t('form.showPassword')}
              hitSlop={8}
              onPress={() => setVisible(prev => !prev)}
              className="absolute right-1 h-10 w-10 items-center justify-center rounded-lg"
            >
              <AppIcon name={visible ? 'eyeOff' : 'eye'} size={18} color={colors.muted} />
            </Pressable>
          )}
        </View>
        {invalid && <Text className="text-sm text-destructive">{error}</Text>}
      </View>
    );
  }
);
FormField.displayName = 'FormField';

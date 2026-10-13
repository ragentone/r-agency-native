import { EyeIcon, EyeOffIcon, type LucideIcon } from 'lucide-react-native';
import { forwardRef, useId, useState } from 'react';
import { type TextInput, type TextInputProps, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Text } from '@/components/ui/text';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

import { useAuthTranslation } from '../../i18n';

interface IProps extends Omit<TextInputProps, 'className'> {
  label: string;
  error?: string;
  icon?: LucideIcon;
  /** Passwortfeld mit Anzeigen/Ausblenden-Schalter. */
  password?: boolean;
  /** Mehrzeilig (Reusables `Textarea`). */
  textarea?: boolean;
  className?: string;
}

/** Formularfeld aus Reusables: `Label` + `Input`/`Textarea` + Icon + Fehlermeldung. */
export const FormField = forwardRef<TextInput, IProps>(
  ({ label, error, icon, password, textarea, className, editable = true, ...inputProps }, ref) => {
    const { t } = useAuthTranslation();
    const [visible, setVisible] = useState(false);
    const id = useId();
    const invalid = Boolean(error);
    const Field = textarea ? Textarea : Input;

    return (
      <View className={cn('gap-2', className)}>
        <Label nativeID={id} className={cn(invalid && 'text-destructive')}>
          {label}
        </Label>
        <View className="relative justify-center">
          {icon && !textarea && (
            <View pointerEvents="none" className="absolute left-3.5 z-10">
              <Icon as={icon} size={16} className="text-muted-foreground" />
            </View>
          )}
          <Field
            ref={ref}
            {...inputProps}
            aria-labelledby={id}
            aria-invalid={invalid}
            accessibilityHint={error}
            editable={editable}
            secureTextEntry={password && !visible}
            autoCapitalize={inputProps.autoCapitalize ?? 'none'}
            autoCorrect={inputProps.autoCorrect ?? false}
            className={cn(
              textarea ? 'min-h-[140px] rounded-xl py-3' : 'h-12 rounded-xl sm:h-12',
              icon && !textarea && 'pl-10',
              password && 'pr-12',
              invalid && 'border-destructive'
            )}
          />
          {password && (
            <Button
              variant="ghost"
              size="icon"
              accessibilityLabel={visible ? t('form.hidePassword') : t('form.showPassword')}
              onPress={() => setVisible(prev => !prev)}
              className="absolute right-1 rounded-lg"
            >
              <Icon as={visible ? EyeOffIcon : EyeIcon} size={18} className="text-muted-foreground" />
            </Button>
          )}
        </View>
        {invalid && <Text className="text-sm text-destructive">{error}</Text>}
      </View>
    );
  }
);
FormField.displayName = 'FormField';

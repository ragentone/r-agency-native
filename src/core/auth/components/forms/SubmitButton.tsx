import { Spinner } from '@/components/app/spinner';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';

interface IProps {
  label: string;
  pendingLabel: string;
  pending: boolean;
  disabled?: boolean;
  onPress(): void;
  className?: string;
}

/** Absenden-Button mit Ladezustand (Reusables `Button`). */
export const SubmitButton = ({ label, pendingLabel, pending, disabled, onPress, className }: IProps) => (
  <Button
    onPress={onPress}
    disabled={disabled ?? pending}
    accessibilityState={{ busy: pending }}
    className={cn('h-12 w-full rounded-full sm:h-12', className)}
  >
    {pending && <Spinner />}
    <Text className="font-bold">{pending ? pendingLabel : label}</Text>
  </Button>
);

import { CircleAlertIcon, CircleCheckIcon } from 'lucide-react-native';

import { Alert, AlertDescription } from '@/components/ui/alert';

interface IProps {
  message?: string | null;
  variant?: 'destructive' | 'success';
  className?: string;
}

/** Hinweis über dem Formular (Reusables `Alert`). */
export const FormAlert = ({ message, variant = 'destructive', className }: IProps) => {
  if (!message) return null;
  const success = variant === 'success';
  return (
    <Alert
      icon={success ? CircleCheckIcon : CircleAlertIcon}
      variant={success ? 'default' : 'destructive'}
      iconClassName={success ? 'text-green-600 dark:text-green-500' : undefined}
      className={className}
    >
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  );
};

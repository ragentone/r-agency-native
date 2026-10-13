import { CheckIcon } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';

import { Spinner } from '@/components/app/spinner';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Icon } from '@/components/ui/icon';

import { useAuthTranslation } from '../i18n';
import { UserAvatar } from './UserAvatar';

interface IProps {
  active: boolean;
  name?: string;
  avatarUrl?: string | null;
  signedOut: boolean;
}

type Phase = 'hidden' | 'leaving' | 'goodbye';

/** Mindestens so lange sichtbar, damit schnelle Logouts nicht flackern. */
const MIN_VISIBLE_MS = 900;
const GOODBYE_MS = 1250;

/**
 * Status beim Abmelden: "Wird abgemeldet …" → "Bis bald, Name!" → ausblenden.
 * Als Reusables `AlertDialog` ohne Buttons (nicht wegklickbar).
 */
export const AuthLogoutOverlay = ({ active, name, avatarUrl, signedOut }: IProps) => {
  const { t } = useAuthTranslation();
  const [phase, setPhase] = useState<Phase>('hidden');
  const [snapshot, setSnapshot] = useState<{ name?: string; avatarUrl?: string | null }>({});
  const shownAt = useRef(0);

  // Beim Start Name/Avatar merken – nach dem Logout sind sie weg.
  if (active && phase === 'hidden') {
    setSnapshot({ name, avatarUrl });
    setPhase('leaving');
  }

  useEffect(() => {
    if (phase === 'leaving' && shownAt.current === 0) shownAt.current = Date.now();
    if (active || phase !== 'leaving') return;
    const wait = Math.max(0, MIN_VISIBLE_MS - (Date.now() - shownAt.current));
    const next = setTimeout(() => {
      if (signedOut) setPhase('goodbye');
      else {
        shownAt.current = 0;
        setPhase('hidden');
      }
    }, wait);
    return () => clearTimeout(next);
  }, [active, phase, signedOut]);

  useEffect(() => {
    if (phase !== 'goodbye') return;
    const hide = setTimeout(() => {
      shownAt.current = 0;
      setPhase('hidden');
    }, GOODBYE_MS);
    return () => clearTimeout(hide);
  }, [phase]);

  const goodbye = phase === 'goodbye';
  const displayName = snapshot.name;

  return (
    <AlertDialog open={phase !== 'hidden'}>
      <AlertDialogContent className="w-[90vw] max-w-xs items-center gap-5 py-8">
        <View className="h-24 w-24 items-center justify-center">
          <UserAvatar name={displayName} avatarUrl={snapshot.avatarUrl} size={72} />
          <View className="absolute bottom-1 right-1 h-7 w-7 items-center justify-center rounded-full bg-foreground">
            {goodbye ? (
              <Icon as={CheckIcon} size={14} className="text-background" />
            ) : (
              <Spinner size={14} className="text-background" />
            )}
          </View>
        </View>
        <AlertDialogHeader className="items-center">
          <AlertDialogTitle className="text-center">
            {goodbye
              ? displayName
                ? t('logout.goodbyeName', { name: displayName })
                : t('logout.goodbye')
              : t('logout.loggingOut')}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-center">
            {goodbye ? t('logout.goodbyeHint') : t('logout.overlayHint')}
          </AlertDialogDescription>
        </AlertDialogHeader>
      </AlertDialogContent>
    </AlertDialog>
  );
};

import type { LucideIcon } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { View } from 'react-native';

import { AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Card } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';

interface IProps {
  value: string;
  icon: LucideIcon;
  title: string;
  description?: string;
  /** Rote Darstellung für unwiderrufliche Aktionen (Löschen). */
  destructive?: boolean;
  last?: boolean;
  children: ReactNode;
}

/** Einstellungs-Zeile in einer Gruppen-Karte (Reusables `AccordionItem`). Muss in einem `Accordion` liegen. */
export const AccountSection = ({ value, icon, title, description, destructive, last, children }: IProps) => (
  <AccordionItem value={value} className={cn(last && 'border-b-0')}>
    <AccordionTrigger className="items-center gap-3.5 px-4 py-3.5">
      <View className="flex-1 flex-row items-center gap-3.5">
        <View
          className={cn(
            'h-10 w-10 items-center justify-center rounded-xl',
            destructive ? 'bg-destructive/10' : 'bg-foreground/5'
          )}
        >
          <Icon as={icon} size={18} className={destructive ? 'text-destructive' : 'text-foreground'} />
        </View>
        <View className="flex-1">
          <Text numberOfLines={1} className={cn('text-[15px] font-semibold', destructive && 'text-destructive')}>
            {title}
          </Text>
          {description && (
            <Text variant="muted" className="mt-0.5 text-xs">
              {description}
            </Text>
          )}
        </View>
      </View>
    </AccordionTrigger>
    <AccordionContent className="px-4 pb-6 pt-2">{children}</AccordionContent>
  </AccordionItem>
);

/** Überschrift einer Gruppe. */
export const AccountGroupLabel = ({ children, danger }: { children: ReactNode; danger?: boolean }) => (
  <Text
    role="heading"
    className={cn('px-1 pb-2 text-[11px] font-semibold uppercase tracking-wider', danger ? 'text-destructive/80' : 'text-muted-foreground')}
  >
    {children}
  </Text>
);

/** Gruppen-Karte (Reusables `Card`). */
export const AccountGroupCard = ({ children, danger }: { children: ReactNode; danger?: boolean }) => (
  <Card className={cn('gap-0 overflow-hidden rounded-2xl py-0 shadow-none', danger && 'border-destructive/25')}>
    {children}
  </Card>
);

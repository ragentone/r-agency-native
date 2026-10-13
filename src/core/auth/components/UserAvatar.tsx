import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';

interface IProps {
  name?: string | null;
  avatarUrl?: string | null;
  size?: number;
  className?: string;
}

/** Avatar mit Initialen als Fallback (Reusables `Avatar`). */
export const UserAvatar = ({ name, avatarUrl, size = 40, className }: IProps) => {
  const initials = (name || 'U').slice(0, 2).toUpperCase();
  return (
    <Avatar alt={name || 'Avatar'} className={cn(className)} style={{ width: size, height: size }}>
      {avatarUrl ? <AvatarImage source={{ uri: avatarUrl }} /> : null}
      <AvatarFallback>
        <Text className="font-semibold" style={{ fontSize: Math.max(11, Math.round(size * 0.32)) }}>
          {initials}
        </Text>
      </AvatarFallback>
    </Avatar>
  );
};

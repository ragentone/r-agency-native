import { Link } from 'expo-router';
import { ShieldIcon, UserRoundIcon } from 'lucide-react-native';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { AuthLogoutTrigger, RoleGate, UserGreeting } from '@/core/auth';
import { useMeshState } from '@/core/mesh';

export default function Index() {
  const { status } = useMeshState();
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerClassName="px-5"
      contentContainerStyle={{ paddingTop: insets.top + 32, paddingBottom: insets.bottom + 32 }}
    >
      <View className="w-full max-w-[440px] gap-6 self-center">
        <UserGreeting />
        <View className="flex-row flex-wrap gap-2">
          <Badge variant="outline">
            <Text>Mesh: {status}</Text>
          </Badge>
          <RoleGate roles="admin:user">
            <Badge variant="secondary" className="flex-row items-center gap-1">
              <Icon as={ShieldIcon} size={12} />
              <Text>Admin</Text>
            </Badge>
          </RoleGate>
        </View>
        <Link href="/account" asChild>
          <Button className="h-12 rounded-full sm:h-12">
            <Icon as={UserRoundIcon} size={16} />
            <Text className="font-bold">Mein Konto</Text>
          </Button>
        </Link>
        <AuthLogoutTrigger className="h-12 sm:h-12" />
      </View>
    </ScrollView>
  );
}

import { Link } from 'expo-router';
import { ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { Text as UIText } from '@/components/ui/text';
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
        <RoleGate roles="admin:user">
          <Text className="text-sm text-muted-foreground">Admin</Text>
        </RoleGate>
        <Text className="text-xs text-muted-foreground">Mesh: {status}</Text>
        <Link href="/account" asChild>
          <Button className="h-12 rounded-full">
            <UIText className="font-bold">Mein Konto</UIText>
          </Button>
        </Link>
        <AuthLogoutTrigger className="h-12" />
      </View>
    </ScrollView>
  );
}

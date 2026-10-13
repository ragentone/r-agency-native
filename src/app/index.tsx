import { View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { useMeshState } from '@/core/mesh';

export default function Index() {
  const { status } = useMeshState();

  return (
    <View className="flex-1 items-center justify-center gap-4 bg-background">
      <Text className="text-2xl font-semibold">Hello World</Text>
      <Text className="text-muted-foreground">Mesh: {status}</Text>
      <Button>
        <Text>Tailwind läuft</Text>
      </Button>
    </View>
  );
}

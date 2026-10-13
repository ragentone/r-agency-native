import '../global.css';

import { Stack } from 'expo-router';

import { authTokenStore, AuthProvider, useAuth } from '@/core/auth';
import { MeshProvider } from '@/core/mesh';

/**
 * Geschützte Navigation: angemeldet → App-Screens, sonst → Login.
 * Wechselt `authorized` (Login/Logout), leitet expo-router automatisch um.
 */
function RootNavigator() {
  const { authorized } = useAuth();

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={authorized}>
        <Stack.Screen name="index" />
      </Stack.Protected>
      <Stack.Protected guard={!authorized}>
        <Stack.Screen name="login" />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <MeshProvider getAuthToken={authTokenStore.getToken}>
      <AuthProvider>
        <RootNavigator />
      </AuthProvider>
    </MeshProvider>
  );
}

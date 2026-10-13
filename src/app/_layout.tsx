import '../global.css';

import { Stack } from 'expo-router';

import { authTokenStore, AuthProvider, completeGoogleAuthPopup, useAuth } from '@/core/auth';
import { MeshProvider } from '@/core/mesh';

// Web: läuft diese Seite im Google-Login-Popup, Ergebnis an das Hauptfenster geben.
completeGoogleAuthPopup();

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

import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from '../src/context/AuthContext';
import { NotificationProvider } from '../src/context/NotificationContext';
import { RefreshProvider } from '../src/context/RefreshContext';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <RefreshProvider>
        <AuthProvider>
          <NotificationProvider>
            <Stack screenOptions={{ headerShown: false }} />
          </NotificationProvider>
        </AuthProvider>
      </RefreshProvider>
    </SafeAreaProvider>
  );
}

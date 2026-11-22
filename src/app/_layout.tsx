import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState, type ReactNode } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { useAuthBootstrap } from '@/hooks/useAuthBootstrap';
import { colors } from '@/theme';

export { ErrorBoundary } from 'expo-router';

SplashScreen.preventAutoHideAsync();

function AuthBootstrap({ children }: { children: ReactNode }) {
  useAuthBootstrap();
  return <>{children}</>;
}

export default function RootLayout() {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            retry: 1,
          },
        },
      }),
  );

  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <AuthBootstrap>
          <StatusBar style="dark" />
          <Stack
            screenOptions={{
              headerStyle: { backgroundColor: colors.header },
              headerTintColor: colors.text,
              headerTitleStyle: { fontWeight: '600' },
              contentStyle: { backgroundColor: colors.background },
            }}
          >
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="welcome" options={{ headerShown: false }} />
            <Stack.Screen name="auth/connected" options={{ headerShown: false }} />
            <Stack.Screen
              name="onboarding/index"
              options={{ title: 'Ankieta', headerBackTitle: 'Wróć' }}
            />
            <Stack.Screen name="(main)" options={{ headerShown: false }} />
          </Stack>
        </AuthBootstrap>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}

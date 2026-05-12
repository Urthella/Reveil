import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './src/navigation/AppNavigator';
import OfflineBanner from './src/components/OfflineBanner';
import { AuthProvider, useAuth, registerTokenProvider } from './src/services/auth';
import { initLocale } from './src/services/i18n';
import { initDensity } from './src/services/density';
import { initSentry } from './src/services/sentry';
import { prefs } from './src/services/preferences';
import { setupNotificationDeepLinking } from './src/services/notifications';
import { colors } from './src/theme';

function TokenBridge({ children }: { children: React.ReactNode }) {
  const { getToken } = useAuth();
  useEffect(() => {
    registerTokenProvider(getToken);
  }, [getToken]);
  return <>{children}</>;
}

export default function App() {
  const [ready, setReady] = useState(false);
  const [hasOnboarded, setHasOnboarded] = useState(false);

  useEffect(() => {
    initSentry();
    (async () => {
      await Promise.all([initLocale(), initDensity()]);
      setHasOnboarded(await prefs.hasOnboarded());
      setReady(true);
    })();
    return setupNotificationDeepLinking();
  }, []);

  if (!ready) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <AuthProvider>
        <TokenBridge>
          <OfflineBanner />
          <AppNavigator initialRoute={hasOnboarded ? 'Login' : 'Onboarding'} />
        </TokenBridge>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

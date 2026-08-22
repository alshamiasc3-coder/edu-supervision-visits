import React, { useEffect } from 'react';
import {
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query';

import {
  GestureHandlerRootView,
} from 'react-native-gesture-handler';

import {
  KeyboardProvider,
} from 'react-native-keyboard-controller';

import {
  SafeAreaProvider,
} from 'react-native-safe-area-context';

import {
  ErrorBoundary,
} from '@/components/ErrorBoundary';

import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from '@expo-google-fonts/inter';

import { Feather } from '@expo/vector-icons';
import {
  Stack,
  useRouter,
  useSegments,
} from 'expo-router';

import * as SplashScreen from 'expo-splash-screen';

import { StoreProvider } from '@/context/AppContext';
import {
  AuthProvider,
  useAuth,
} from '@/context/AuthContext';

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

/**
 * مسؤول عن حماية مسارات التطبيق
 *
 * إذا كان المستخدم غير مسجل:
 *     → /login
 *
 * إذا كان المستخدم مسجل وحاول فتح /login:
 *     → /(tabs)
 */
function AuthGuard() {
  const router = useRouter();
  const segments = useSegments();

  const {
    ready,
    isAuthenticated,
  } = useAuth();

  useEffect(() => {
    // لا نقوم بأي توجيه قبل انتهاء تحميل حالة الحساب
    if (!ready) {
      return;
    }

    const firstSegment = segments[0];

    // هل المستخدم داخل صفحة تسجيل الدخول؟
    const isLoginScreen = firstSegment === 'login';

    // المستخدم غير مسجل الدخول
    if (!isAuthenticated && !isLoginScreen) {
      router.replace('/login');
      return;
    }

    // المستخدم مسجل الدخول ويحاول فتح تسجيل الدخول
    if (isAuthenticated && isLoginScreen) {
      router.replace('/(tabs)');
      return;
    }
  }, [
    ready,
    isAuthenticated,
    segments,
    router,
  ]);

  return null;
}

export default function RootLayout() {
  const [
    fontsLoaded,
    fontError,
  ] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Feather: Feather.font,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [
    fontsLoaded,
    fontError,
  ]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <StoreProvider>

            <AuthProvider>

              {/* حماية وتنظيم مسارات التطبيق */}
              <AuthGuard />

              <GestureHandlerRootView
                style={{ flex: 1 }}
              >
                <KeyboardProvider>

                  <Stack
                    screenOptions={{
                      headerShown: false,
                    }}
                  />

                </KeyboardProvider>
              </GestureHandlerRootView>

            </AuthProvider>

          </StoreProvider>
        </QueryClientProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}

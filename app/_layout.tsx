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


/*
 * منع إخفاء شاشة البداية
 * حتى يتم تحميل الخطوط ونظام الحسابات.
 */
SplashScreen.preventAutoHideAsync();


/*
 * React Query Client
 */
const queryClient = new QueryClient();


/*
 * حارس المصادقة
 *
 * مسؤول عن تحديد الصفحة التي يجب أن يراها المستخدم.
 */
function AuthGuard() {
  const router = useRouter();
  const segments = useSegments();

  const {
    ready,
    isAuthenticated,
  } = useAuth();


  useEffect(() => {
    /*
     * لا نقرر مسار المستخدم
     * قبل انتهاء تحميل حالة الحساب.
     */
    if (!ready) {
      return;
    }


    /*
     * أول جزء من المسار الحالي.
     *
     * مثال:
     *
     * /login
     * → login
     *
     * /
     * → قد يكون فارغًا أو جزءًا من المسار الحالي
     */
    const firstSegment = segments[0];


    /*
     * هل المستخدم داخل صفحة تسجيل الدخول؟
     */
    const isLoginScreen =
      firstSegment === 'login';


    /*
     * المستخدم غير مسجل الدخول
     *
     * وإذا كان يحاول الوصول إلى أي صفحة
     * غير صفحة تسجيل الدخول،
     * نرسله إلى /login.
     */
    if (
      !isAuthenticated &&
      !isLoginScreen
    ) {
      router.replace('/login');
      return;
    }


    /*
     * المستخدم مسجل الدخول
     *
     * لكنه يحاول فتح /login.
     *
     * نرسله مباشرة إلى الصفحة الرئيسية.
     */
    if (
      isAuthenticated &&
      isLoginScreen
    ) {
      router.replace('/');
      return;
    }

  }, [
    ready,
    isAuthenticated,
    segments,
    router,
  ]);


  /*
   * AuthGuard لا يعرض واجهة.
   * وظيفته فقط التحكم في التنقل.
   */
  return null;
}


/*
 * Root Layout
 */
export default function RootLayout() {

  /*
   * تحميل الخطوط.
   */
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


  /*
   * إخفاء Splash Screen
   * بعد تحميل الخطوط.
   */
  useEffect(() => {

    if (
      fontsLoaded ||
      fontError
    ) {
      SplashScreen.hideAsync();
    }

  }, [
    fontsLoaded,
    fontError,
  ]);


  /*
   * انتظار تحميل الخطوط.
   */
  if (
    !fontsLoaded &&
    !fontError
  ) {
    return null;
  }


  return (
    <SafeAreaProvider>

      <ErrorBoundary>

        <QueryClientProvider
          client={queryClient}
        >

          <StoreProvider>

            <AuthProvider>

              {/*
               * نظام حماية المسارات
               */}
              <AuthGuard />


              <GestureHandlerRootView
                style={{
                  flex: 1,
                }}
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

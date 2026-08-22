import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';

export default function LoginScreen() {
  const router = useRouter();

  const {
    login,
    ready,
    isAuthenticated,
  } = useAuth();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  /*
   * إذا كان المستخدم مسجل الدخول أصلًا،
   * لا نعرض شاشة تسجيل الدخول.
   * ننقله مباشرة إلى التطبيق الرئيسي.
   */
  useEffect(() => {
    if (ready && isAuthenticated) {
      router.replace('/');
    }
  }, [ready, isAuthenticated, router]);

  /*
   * تنفيذ تسجيل الدخول
   */
  const handleLogin = async () => {
    const cleanUsername = username.trim();

    if (!cleanUsername || !password) {
      Alert.alert(
        'بيانات ناقصة',
        'يرجى إدخال اسم المستخدم وكلمة المرور.'
      );
      return;
    }

    setLoading(true);

    try {
      const success = await login({
        username: cleanUsername,
        password,
      });

      if (!success) {
        Alert.alert(
          'فشل تسجيل الدخول',
          'اسم المستخدم أو كلمة المرور غير صحيحة.'
        );
        return;
      }

      /*
       * بعد نجاح تسجيل الدخول:
       * نذهب مباشرة إلى التطبيق.
       */
      router.replace('/');
    } catch (error) {
      console.error('Login error:', error);

      Alert.alert(
        'خطأ',
        'حدث خطأ أثناء تسجيل الدخول.'
      );
    } finally {
      setLoading(false);
    }
  };

  /*
   * انتظار تحميل حالة الحساب
   */
  if (!ready) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" />

        <Text style={styles.loadingText}>
          جاري تحميل نظام الحسابات...
        </Text>
      </SafeAreaView>
    );
  }

  /*
   * إذا كان المستخدم مسجلًا بالفعل،
   * ننتظر AuthGuard / useEffect
   * لتنفيذ الانتقال.
   */
  if (isAuthenticated) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" />

        <Text style={styles.loadingText}>
          جاري فتح التطبيق...
        </Text>
      </SafeAreaView>
    );
  }

  /*
   * شاشة تسجيل الدخول
   */
  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboard}
        behavior={
          Platform.OS === 'ios'
            ? 'padding'
            : undefined
        }
      >
        <View style={styles.card}>

          <Text style={styles.logo}>
            إشراف تربوي
          </Text>

          <Text style={styles.title}>
            تسجيل الدخول
          </Text>

          <Text style={styles.subtitle}>
            نظام إدارة الإشراف والمتابعة المدرسية
          </Text>

          <View style={styles.form}>

            <Text style={styles.label}>
              اسم المستخدم
            </Text>

            <TextInput
              value={username}
              onChangeText={setUsername}
              placeholder="أدخل اسم المستخدم"
              placeholderTextColor="#999"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!loading}
              style={styles.input}
              textAlign="right"
            />

            <Text style={styles.label}>
              كلمة المرور
            </Text>

            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="أدخل كلمة المرور"
              placeholderTextColor="#999"
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              editable={!loading}
              style={styles.input}
              textAlign="right"
              onSubmitEditing={handleLogin}
            />

            <Pressable
              style={[
                styles.button,
                loading && styles.buttonDisabled,
              ]}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator
                  color="#ffffff"
                />
              ) : (
                <Text style={styles.buttonText}>
                  دخول
                </Text>
              )}
            </Pressable>

          </View>

          <View style={styles.demoBox}>

            <Text style={styles.demoTitle}>
              حسابات الاختبار
            </Text>

            <Text style={styles.demoText}>
              admin / admin123
            </Text>

            <Text style={styles.demoText}>
              supervisor / supervisor123
            </Text>

            <Text style={styles.demoHint}>
              هذه الحسابات للتطوير والاختبار فقط.
            </Text>

          </View>

        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f6f8',
  },

  keyboard: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },

  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f4f6f8',
  },

  loadingText: {
    marginTop: 12,
    fontSize: 15,
    color: '#555',
  },

  card: {
    width: '100%',
    maxWidth: 460,
    alignSelf: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 24,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: {
      width: 0,
      height: 4,
    },
  },

  logo: {
    textAlign: 'center',
    fontSize: 26,
    fontWeight: '800',
    color: '#1f4e79',
    marginBottom: 8,
  },

  title: {
    textAlign: 'center',
    fontSize: 24,
    fontWeight: '700',
    color: '#222',
    marginBottom: 8,
  },

  subtitle: {
    textAlign: 'center',
    fontSize: 14,
    color: '#777',
    marginBottom: 24,
    lineHeight: 22,
  },

  form: {
    gap: 10,
  },

  label: {
    textAlign: 'right',
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginTop: 4,
  },

  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#d7dce1',
    borderRadius: 10,
    paddingHorizontal: 14,
    backgroundColor: '#fafafa',
    fontSize: 16,
    color: '#222',
  },

  button: {
    height: 50,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1f4e79',
    marginTop: 12,
  },

  buttonDisabled: {
    opacity: 0.65,
  },

  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },

  demoBox: {
    marginTop: 24,
    padding: 14,
    borderRadius: 10,
    backgroundColor: '#f1f5f9',
  },

  demoTitle: {
    textAlign: 'right',
    fontWeight: '700',
    color: '#333',
    marginBottom: 6,
  },

  demoText: {
    textAlign: 'right',
    fontSize: 13,
    color: '#555',
    marginTop: 3,
  },

  demoHint: {
    textAlign: 'right',
    fontSize: 11,
    color: '#888',
    marginTop: 8,
  },
});

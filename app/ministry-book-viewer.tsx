import React from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';

export default function MinistryBookViewer() {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ uri?: string; name?: string }>();
  const uri = Array.isArray(params.uri) ? params.uri[0] : params.uri;
  const name = Array.isArray(params.name) ? params.name[0] : params.name;

  return (
    <View style={[styles.page, { backgroundColor: c.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 8, borderBottomColor: c.border }]}>
        <Pressable onPress={() => router.back()} style={[styles.back, { backgroundColor: c.card, borderColor: c.border }]}>
          <Feather name="arrow-right" size={22} color={c.foreground} />
        </Pressable>
        <View style={styles.headerText}>
          <Text style={[styles.title, { color: c.foreground }]} numberOfLines={1}>عرض الكتاب الوزاري</Text>
          <Text style={[styles.sub, { color: c.mutedForeground }]} numberOfLines={1}>{name || 'ملف PDF'}</Text>
        </View>
        <View style={{ width: 42 }} />
      </View>

      {uri ? (
        <WebView
          source={{ uri }}
          style={styles.webview}
          originWhitelist={['*']}
          startInLoadingState
          allowsFullscreenVideo
          javaScriptEnabled
          domStorageEnabled
        />
      ) : (
        <View style={styles.empty}>
          <Feather name="file-x" size={42} color={c.mutedForeground} />
          <Text style={[styles.emptyText, { color: c.foreground }]}>لم يتم العثور على ملف PDF.</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  header: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingBottom: 10,
    borderBottomWidth: 1,
  },
  back: { width: 42, height: 42, borderRadius: 13, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  headerText: { flex: 1, alignItems: 'center', paddingHorizontal: 10 },
  title: { fontFamily: 'Inter_700Bold', fontSize: 16 },
  sub: { fontFamily: 'Inter_400Regular', fontSize: 10, marginTop: 2 },
  webview: { flex: 1, backgroundColor: '#FFFFFF' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  emptyText: { fontFamily: 'Inter_600SemiBold', fontSize: 14 },
});

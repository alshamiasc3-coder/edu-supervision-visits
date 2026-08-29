import React, { useState } from 'react';
import { Image, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';

import { useColors } from '@/hooks/useColors';

type Props = {
  photos?: string[];
  emptyText?: string;
  onRemove?: (uri: string) => void;
};

/**
 * Gallery for visit records. It accepts the new multi-photo format
 * while remaining easy to use with the legacy single photo field.
 */
export function VisitPhotoGallery({ photos = [], emptyText = 'لا توجد صور مرفقة', onRemove }: Props) {
  const c = useColors();
  const [selected, setSelected] = useState<string | null>(null);

  if (!photos.length) {
    return (
      <View style={[styles.empty, { backgroundColor: c.secondary, borderColor: c.border }]}>
        <Feather name="image" size={20} color={c.mutedForeground} />
        <Text style={[styles.emptyText, { color: c.mutedForeground }]}>{emptyText}</Text>
      </View>
    );
  }

  return (
    <>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {photos.map((uri, index) => (
          <View key={`${uri}-${index}`} style={styles.item}>
            <Pressable onPress={() => setSelected(uri)} accessibilityLabel={`معاينة الصورة ${index + 1}`}>
              <Image source={{ uri }} style={styles.thumb} />
              <View style={[styles.zoomBadge, { backgroundColor: c.card }]}>
                <Feather name="maximize-2" size={13} color={c.primary} />
              </View>
            </Pressable>
            {onRemove ? (
              <Pressable onPress={() => onRemove(uri)} style={[styles.remove, { backgroundColor: c.card, borderColor: c.border }]}>
                <Feather name="trash-2" size={14} color={c.destructive} />
              </Pressable>
            ) : null}
          </View>
        ))}
      </ScrollView>

      <Modal visible={Boolean(selected)} transparent animationType="fade" onRequestClose={() => setSelected(null)}>
        <Pressable style={styles.modal} onPress={() => setSelected(null)}>
          {selected ? <Image source={{ uri: selected }} style={styles.full} resizeMode="contain" /> : null}
          <View style={styles.close}><Feather name="x" size={22} color="#FFFFFF" /></View>
        </Pressable>
      </Modal>
    </>
  );
}

export function normalizeVisitPhotos(photoUri?: string, photoUris?: string[]) {
  const values = [...(photoUris ?? []), ...(photoUri ? [photoUri] : [])];
  return Array.from(new Set(values.filter(Boolean)));
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 10, paddingVertical: 4 },
  item: { position: 'relative' },
  thumb: { width: 104, height: 104, borderRadius: 15, backgroundColor: '#EEF2F4' },
  zoomBadge: { position: 'absolute', left: 7, bottom: 7, width: 28, height: 28, borderRadius: 9, alignItems: 'center', justifyContent: 'center', opacity: 0.94 },
  remove: { position: 'absolute', right: -4, top: -4, width: 28, height: 28, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  empty: { minHeight: 70, borderWidth: 1, borderRadius: 15, flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: 8 },
  emptyText: { fontFamily: 'Inter_500Medium', fontSize: 11 },
  modal: { flex: 1, backgroundColor: 'rgba(0,0,0,0.94)', alignItems: 'center', justifyContent: 'center' },
  full: { width: '100%', height: '80%' },
  close: { position: 'absolute', top: 55, right: 22, width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
});

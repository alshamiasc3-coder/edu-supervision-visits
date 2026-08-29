import React, { useMemo, useState } from 'react';
import { Alert, Image, Linking, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useColors } from '@/hooks/useColors';
import { MinistryBook, MinistryBookCategory, ministryBookCategories, useStore } from '@/context/AppContext';

type Attachments = { imageUri?: string; pdfUri?: string; pdfName?: string };
const parseAttachments = (value?: string): Attachments => {
  if (!value) return {};
  try { const parsed = JSON.parse(value); if (parsed && typeof parsed === 'object') return parsed; } catch {}
  return { imageUri: value };
};
const encodeAttachments = (a: Attachments) => JSON.stringify(a);

export default function MinistryBooks() {
  const c = useColors();
  const { ministryBooks, addMinistryBook, updateMinistryBook, deleteMinistryBook } = useStore();
  const [showForm, setShowForm] = useState(false);
  const [editingBook, setEditingBook] = useState<MinistryBook | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<MinistryBookCategory | 'الكل'>('الكل');
  const [search, setSearch] = useState('');
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [bookNumber, setBookNumber] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [category, setCategory] = useState<MinistryBookCategory>('تعليمات');
  const [imageUri, setImageUri] = useState('');
  const [pdfUri, setPdfUri] = useState('');
  const [pdfName, setPdfName] = useState('');
  const [notes, setNotes] = useState('');

  const filteredBooks = useMemo(() => {
    const q = search.trim().toLowerCase();
    return ministryBooks.filter(book => {
      const cat = selectedCategory === 'الكل' || book.category === selectedCategory;
      const text = [book.title, book.bookNumber, book.category, book.notes ?? ''].join(' ').toLowerCase();
      return cat && (!q || text.includes(q));
    });
  }, [ministryBooks, selectedCategory, search]);

  const resetForm = () => {
    setEditingBook(null); setTitle(''); setBookNumber(''); setDate(new Date().toISOString().slice(0, 10));
    setCategory('تعليمات'); setImageUri(''); setPdfUri(''); setPdfName(''); setNotes('');
  };
  const openAddForm = () => { resetForm(); setShowForm(true); };
  const openEditForm = (book: MinistryBook) => {
    const a = parseAttachments(book.imageUri);
    setEditingBook(book); setTitle(book.title); setBookNumber(book.bookNumber); setDate(book.date); setCategory(book.category);
    setImageUri(a.imageUri ?? ''); setPdfUri(a.pdfUri ?? ''); setPdfName(a.pdfName ?? ''); setNotes(book.notes ?? ''); setShowForm(true);
  };
  const closeForm = () => { setShowForm(false); setEditingBook(null); };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: false, quality: 0.9 });
      if (!result.canceled && result.assets?.[0]?.uri) setImageUri(result.assets[0].uri);
    } catch { Alert.alert('خطأ', 'تعذر اختيار الصورة.'); }
  };
  const takePhoto = async () => {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) { Alert.alert('صلاحية مطلوبة', 'اسمح للتطبيق باستخدام الكاميرا أولاً.'); return; }
      const result = await ImagePicker.launchCameraAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: false, quality: 0.9 });
      if (!result.canceled && result.assets?.[0]?.uri) setImageUri(result.assets[0].uri);
    } catch { Alert.alert('خطأ', 'تعذر التقاط الصورة.'); }
  };
  const chooseImageSource = () => {
    if (Platform.OS === 'web') { pickImage(); return; }
    Alert.alert('صورة الكتاب', 'اختر المصدر', [{ text: 'المعرض', onPress: pickImage }, { text: 'الكاميرا', onPress: takePhoto }, { text: 'إلغاء', style: 'cancel' }]);
  };
  const pickPdf = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: 'application/pdf', copyToCacheDirectory: true, multiple: false });
      if (!result.canceled && result.assets?.[0]?.uri) { setPdfUri(result.assets[0].uri); setPdfName(result.assets[0].name || 'ملف PDF'); }
    } catch (error) { console.error(error); Alert.alert('خطأ', 'تعذر اختيار ملف PDF.'); }
  };
  const openAttachment = async (uri: string) => {
    try {
      if (Platform.OS === 'web') { window.open(uri, '_blank', 'noopener,noreferrer'); return; }
      await Linking.openURL(uri);
    } catch { Alert.alert('تعذر فتح المرفق', 'لا يمكن فتح هذا الملف من الجهاز الحالي.'); }
  };

  const saveBook = () => {
    if (!title.trim()) return Alert.alert('تنبيه', 'اكتب عنواناً مختصراً للكتاب.');
    if (!bookNumber.trim()) return Alert.alert('تنبيه', 'اكتب رقم الكتاب الوزاري.');
    if (!date.trim()) return Alert.alert('تنبيه', 'أدخل تاريخ الكتاب.');
    if (!imageUri && !pdfUri) return Alert.alert('تنبيه', 'أضف صورة أو ملف PDF واحداً على الأقل.');
    const data = { title: title.trim(), bookNumber: bookNumber.trim(), date: date.trim(), category, imageUri: encodeAttachments({ imageUri: imageUri || undefined, pdfUri: pdfUri || undefined, pdfName: pdfName || undefined }), notes: notes.trim(), createdAt: editingBook?.createdAt ?? new Date().toISOString() };
    try {
      if (editingBook) updateMinistryBook(editingBook.id, data); else addMinistryBook(data);
      closeForm(); Alert.alert('تم الحفظ', editingBook ? 'تم تحديث بيانات الكتاب بنجاح.' : 'تم حفظ الكتاب الوزاري بنجاح.');
    } catch (error) { console.error(error); Alert.alert('خطأ', 'تعذر حفظ الكتاب.'); }
  };
  const confirmDelete = (book: MinistryBook) => Alert.alert('حذف الكتاب', `هل تريد حذف الكتاب "${book.title}"؟`, [{ text: 'إلغاء', style: 'cancel' }, { text: 'حذف', style: 'destructive', onPress: () => deleteMinistryBook(book.id) }]);
  const categoryBg = (item: MinistryBookCategory) => item === 'عاجلة' ? '#FDE7E7' : item === 'هامة' ? '#FFF1D6' : item === 'امتحانات' ? '#E5F1FF' : item === 'نقل' ? '#EEE8FF' : item === 'تعليمات' ? '#E3F4F0' : c.secondary;

  return <View style={[styles.container, { backgroundColor: c.background }]}>
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={[styles.headerBtn, { backgroundColor: c.card, borderColor: c.border }]}><Feather name="arrow-right" size={22} color={c.foreground} /></Pressable>
        <View style={styles.headerCenter}><Text style={[styles.eyebrow, { color: c.primary }]}>وزارة التربية والتعليم</Text><Text style={[styles.headerTitle, { color: c.foreground }]}>الكتب الوزارية</Text><Text style={[styles.headerSub, { color: c.mutedForeground }]}>حفظ الكتب والتعليمات الواردة</Text></View>
        <Pressable onPress={openAddForm} style={[styles.addBtn, { backgroundColor: c.primary }]}><Feather name="plus" size={23} color="#fff" /></Pressable>
      </View>
      <View style={[styles.info, { backgroundColor: c.navy }]}><View style={[styles.infoIcon, { backgroundColor: c.accent }]}><Feather name="file-text" size={25} color={c.navy} /></View><View style={{ flex: 1 }}><Text style={styles.infoTitle}>أرشيف الكتب الوزارية</Text><Text style={styles.infoText}>احفظ الكتب والتعليمات الواردة كصورة أو PDF، مع تصنيفها لسهولة الرجوع إليها لاحقاً.</Text></View></View>
      <Pressable onPress={openAddForm} style={[styles.quickAdd, { backgroundColor: c.primary }]}><Feather name="plus-circle" size={21} color="#fff" /><Text style={styles.quickText}>إضافة كتاب وزاري</Text></Pressable>
      <View style={[styles.search, { backgroundColor: c.card, borderColor: c.border }]}><Feather name="search" size={19} color={c.mutedForeground} /><TextInput value={search} onChangeText={setSearch} placeholder="ابحث برقم الكتاب أو العنوان..." placeholderTextColor={c.mutedForeground} style={[styles.searchInput, { color: c.foreground }]} /></View>
      <Text style={[styles.section, { color: c.foreground }]}>تصنيف الكتاب</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>{['الكل', ...ministryBookCategories].map(item => <Pressable key={item} onPress={() => setSelectedCategory(item as any)} style={[styles.chip, { backgroundColor: selectedCategory === item ? c.primary : c.card, borderColor: selectedCategory === item ? c.primary : c.border }]}><Text style={{ color: selectedCategory === item ? '#fff' : c.foreground, fontFamily: 'Inter_600SemiBold', fontSize: 12 }}>{item}</Text></Pressable>)}</ScrollView>
      <View style={styles.countRow}><Text style={[styles.section, { color: c.foreground, marginTop: 0 }]}>الأرشيف</Text><Text style={{ color: c.mutedForeground, fontFamily: 'Inter_500Medium', fontSize: 11 }}>عدد الكتب: {filteredBooks.length}</Text></View>
      {filteredBooks.length === 0 ? <View style={[styles.empty, { backgroundColor: c.card, borderColor: c.border }]}><Feather name="archive" size={34} color={c.primary} /><Text style={[styles.emptyTitle, { color: c.foreground }]}>لا توجد كتب وزارية</Text><Text style={{ color: c.mutedForeground, fontFamily: 'Inter_400Regular', fontSize: 11 }}>ابدأ بحفظ أول كتاب أو تعليمات.</Text></View> : filteredBooks.map(book => {
        const a = parseAttachments(book.imageUri);
        return <View key={book.id} style={[styles.card, { backgroundColor: c.card, borderColor: c.border }]}>
          <View style={styles.thumb}>{a.imageUri ? <Pressable onPress={() => setPreviewImage(a.imageUri!)}><Image source={{ uri: a.imageUri }} style={styles.image} resizeMode="cover" /></Pressable> : <Feather name="file-text" size={34} color={c.primary} />}</View>
          <View style={{ flex: 1, minWidth: 0 }}><View style={styles.titleRow}><Text style={[styles.bookTitle, { color: c.foreground }]} numberOfLines={2}>{book.title}</Text><View style={[styles.badge, { backgroundColor: categoryBg(book.category) }]}><Text style={{ color: c.primary, fontFamily: 'Inter_600SemiBold', fontSize: 9 }}>{book.category}</Text></View></View><Text style={[styles.meta, { color: c.mutedForeground }]}>رقم الكتاب: {book.bookNumber}</Text><Text style={[styles.meta, { color: c.mutedForeground }]}>تاريخ الكتاب: {book.date}</Text>{book.notes ? <Text style={[styles.notes, { color: c.mutedForeground }]} numberOfLines={2}>{book.notes}</Text> : null}<View style={styles.actions}>{a.imageUri ? <Pressable onPress={() => setPreviewImage(a.imageUri!)} style={[styles.action, { backgroundColor: c.secondary }]}><Feather name="image" size={15} color={c.primary} /><Text style={{ color: c.primary, fontFamily: 'Inter_600SemiBold', fontSize: 10 }}>عرض الصورة</Text></Pressable> : null}{a.pdfUri ? <Pressable onPress={() => openAttachment(a.pdfUri!)} style={[styles.action, { backgroundColor: '#EAF3FF' }]}><Feather name="file" size={15} color="#2878B8" /><Text style={{ color: '#2878B8', fontFamily: 'Inter_600SemiBold', fontSize: 10 }}>فتح PDF</Text></Pressable> : null}<Pressable onPress={() => openEditForm(book)} style={[styles.action, { backgroundColor: c.secondary }]}><Feather name="edit-2" size={15} color={c.primary} /><Text style={{ color: c.primary, fontFamily: 'Inter_600SemiBold', fontSize: 10 }}>تعديل</Text></Pressable><Pressable onPress={() => confirmDelete(book)} style={[styles.action, { backgroundColor: '#FDE7E7' }]}><Feather name="trash-2" size={15} color="#C62828" /><Text style={{ color: '#C62828', fontFamily: 'Inter_600SemiBold', fontSize: 10 }}>حذف</Text></Pressable></View>{a.pdfName ? <Text style={{ color: c.mutedForeground, fontFamily: 'Inter_400Regular', fontSize: 9, textAlign: 'right', marginTop: 4 }} numberOfLines={1}>📄 {a.pdfName}</Text> : null}</View>
        </View>;
      })}
      <View style={{ height: 45 }} />
    </ScrollView>

    <Modal visible={showForm} animationType="slide" transparent onRequestClose={closeForm}>
      <View style={styles.overlay}><View style={[styles.modal, { backgroundColor: c.background }]}>
        <View style={styles.modalHeader}><Pressable onPress={closeForm}><Feather name="x" size={25} color={c.foreground} /></Pressable><Text style={[styles.modalTitle, { color: c.foreground }]}>{editingBook ? 'تعديل الكتاب' : 'إضافة كتاب وزاري'}</Text><View style={{ width: 25 }} /></View>
        <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <Text style={[styles.label, { color: c.foreground }]}>مرفقات الكتاب</Text>
          <View style={styles.attachmentRow}>
            <Pressable onPress={chooseImageSource} style={[styles.attachBtn, { backgroundColor: c.secondary, borderColor: c.border }]}><Feather name="camera" size={19} color={c.primary} /><Text style={{ color: c.primary, fontFamily: 'Inter_600SemiBold', fontSize: 11 }}>إضافة صورة</Text></Pressable>
            <Pressable onPress={pickPdf} style={[styles.attachBtn, { backgroundColor: '#EAF3FF', borderColor: '#C9DFF3' }]}><Feather name="file" size={19} color="#2878B8" /><Text style={{ color: '#2878B8', fontFamily: 'Inter_600SemiBold', fontSize: 11 }}>إضافة PDF</Text></Pressable>
          </View>
          {imageUri ? <View style={[styles.filePill, { backgroundColor: c.card, borderColor: c.border }]}><Image source={{ uri: imageUri }} style={styles.smallImage} /><Text style={{ flex: 1, textAlign: 'right', color: c.foreground, fontFamily: 'Inter_500Medium', fontSize: 10 }}>تمت إضافة صورة الكتاب</Text><Pressable onPress={() => setImageUri('')}><Feather name="x-circle" size={18} color="#C62828" /></Pressable></View> : null}
          {pdfUri ? <View style={[styles.filePill, { backgroundColor: c.card, borderColor: c.border }]}><View style={styles.pdfIcon}><Feather name="file-text" size={20} color="#2878B8" /></View><Text style={{ flex: 1, textAlign: 'right', color: c.foreground, fontFamily: 'Inter_500Medium', fontSize: 10 }} numberOfLines={1}>{pdfName || 'ملف PDF'}</Text><Pressable onPress={() => setPdfUri('')}><Feather name="x-circle" size={18} color="#C62828" /></Pressable></View> : null}
          <Text style={[styles.label, { color: c.foreground }]}>عنوان مختصر للكتاب</Text><TextInput value={title} onChangeText={setTitle} placeholder="مثال: تعليمات الامتحانات النهائية" placeholderTextColor={c.mutedForeground} style={[styles.input, { color: c.foreground, backgroundColor: c.card, borderColor: c.border }]} />
          <Text style={[styles.label, { color: c.foreground }]}>رقم الكتاب الوزاري</Text><TextInput value={bookNumber} onChangeText={setBookNumber} placeholder="مثال: 12345 / 2026" placeholderTextColor={c.mutedForeground} style={[styles.input, { color: c.foreground, backgroundColor: c.card, borderColor: c.border }]} />
          <Text style={[styles.label, { color: c.foreground }]}>تاريخ الكتاب</Text><TextInput value={date} onChangeText={setDate} placeholder="YYYY-MM-DD" placeholderTextColor={c.mutedForeground} style={[styles.input, { color: c.foreground, backgroundColor: c.card, borderColor: c.border }]} />
          <Text style={[styles.label, { color: c.foreground }]}>تصنيف الكتاب</Text><View style={styles.formCats}>{ministryBookCategories.map(item => <Pressable key={item} onPress={() => setCategory(item)} style={[styles.chip, { backgroundColor: category === item ? c.primary : c.card, borderColor: category === item ? c.primary : c.border }]}><Text style={{ color: category === item ? '#fff' : c.foreground, fontFamily: 'Inter_600SemiBold', fontSize: 11 }}>{item}</Text></Pressable>)}</View>
          <Text style={[styles.label, { color: c.foreground }]}>ملاحظات</Text><TextInput value={notes} onChangeText={setNotes} placeholder="أضف أي ملاحظة تحتاجها..." placeholderTextColor={c.mutedForeground} multiline textAlignVertical="top" style={[styles.notesInput, { color: c.foreground, backgroundColor: c.card, borderColor: c.border }]} />
          <Pressable onPress={saveBook} style={[styles.save, { backgroundColor: c.primary }]}><Feather name="save" size={19} color="#fff" /><Text style={styles.saveText}>{editingBook ? 'حفظ التعديلات' : 'حفظ الكتاب'}</Text></Pressable>
          <Pressable onPress={closeForm} style={[styles.cancel, { borderColor: c.border }]}><Text style={{ color: c.foreground, fontFamily: 'Inter_600SemiBold' }}>إلغاء</Text></Pressable><View style={{ height: 35 }} />
        </ScrollView>
      </View></View>
    </Modal>

    <Modal visible={!!previewImage} animationType="fade" transparent onRequestClose={() => setPreviewImage(null)}><View style={styles.preview}><Pressable onPress={() => setPreviewImage(null)} style={styles.closePreview}><Feather name="x" size={25} color="#fff" /></Pressable>{previewImage ? <Image source={{ uri: previewImage }} style={styles.fullImage} resizeMode="contain" /> : null}</View></Modal>
  </View>;
}

const styles = StyleSheet.create({
  container: { flex: 1 }, content: { padding: 16 },
  header: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', marginBottom: 15 },
  headerCenter: { flex: 1, alignItems: 'center' }, headerBtn: { width: 44, height: 44, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center' }, addBtn: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  eyebrow: { fontSize: 11, fontFamily: 'Inter_600SemiBold' }, headerTitle: { fontSize: 21, fontFamily: 'Inter_700Bold', marginTop: 2 }, headerSub: { fontSize: 10, fontFamily: 'Inter_400Regular', marginTop: 2 },
  info: { borderRadius: 20, padding: 16, flexDirection: 'row-reverse', alignItems: 'center', gap: 12, marginBottom: 12 }, infoIcon: { width: 53, height: 53, borderRadius: 17, alignItems: 'center', justifyContent: 'center' }, infoTitle: { color: '#fff', fontSize: 16, fontFamily: 'Inter_700Bold', textAlign: 'right', marginBottom: 4 }, infoText: { color: '#B7D9D4', fontSize: 11, lineHeight: 18, fontFamily: 'Inter_400Regular', textAlign: 'right' },
  quickAdd: { minHeight: 53, borderRadius: 16, flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 14 }, quickText: { color: '#fff', fontSize: 13, fontFamily: 'Inter_700Bold' },
  search: { minHeight: 49, borderRadius: 15, borderWidth: 1, paddingHorizontal: 13, flexDirection: 'row-reverse', alignItems: 'center', gap: 9 }, searchInput: { flex: 1, fontFamily: 'Inter_400Regular', fontSize: 12, textAlign: 'right', paddingVertical: 9 }, section: { fontSize: 15, fontFamily: 'Inter_700Bold', textAlign: 'right', marginTop: 18, marginBottom: 9 }, row: { gap: 7 }, chip: { paddingHorizontal: 12, paddingVertical: 9, borderRadius: 12, borderWidth: 1 }, countRow: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginTop: 13, marginBottom: 10 },
  card: { borderRadius: 18, borderWidth: 1, padding: 11, flexDirection: 'row-reverse', gap: 12, marginBottom: 10, minHeight: 150 }, thumb: { width: 105, height: 135, borderRadius: 13, overflow: 'hidden', backgroundColor: '#EEF5F4', alignItems: 'center', justifyContent: 'center' }, image: { width: '100%', height: '100%' }, titleRow: { flexDirection: 'row-reverse', alignItems: 'flex-start', gap: 7 }, bookTitle: { flex: 1, fontSize: 14, lineHeight: 20, fontFamily: 'Inter_700Bold', textAlign: 'right' }, badge: { borderRadius: 8, paddingHorizontal: 7, paddingVertical: 5 }, meta: { fontSize: 10, fontFamily: 'Inter_400Regular', textAlign: 'right', marginTop: 7 }, notes: { fontSize: 10, lineHeight: 16, fontFamily: 'Inter_400Regular', textAlign: 'right', marginTop: 5 }, actions: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 6, marginTop: 9 }, action: { borderRadius: 9, paddingHorizontal: 8, paddingVertical: 7, flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: 5 },
  empty: { borderRadius: 20, borderWidth: 1, padding: 30, alignItems: 'center', gap: 8 }, emptyTitle: { fontSize: 16, fontFamily: 'Inter_700Bold' },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,.45)', justifyContent: 'flex-end' }, modal: { maxHeight: '94%', borderTopLeftRadius: 25, borderTopRightRadius: 25, paddingHorizontal: 17, paddingTop: 15 }, modalHeader: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }, modalTitle: { fontSize: 18, fontFamily: 'Inter_700Bold' }, label: { fontSize: 12, fontFamily: 'Inter_600SemiBold', textAlign: 'right', marginTop: 14, marginBottom: 7 }, input: { minHeight: 48, borderRadius: 13, borderWidth: 1, paddingHorizontal: 12, fontFamily: 'Inter_400Regular', fontSize: 12, textAlign: 'right' }, notesInput: { minHeight: 105, borderRadius: 13, borderWidth: 1, padding: 12, fontFamily: 'Inter_400Regular', fontSize: 12, textAlign: 'right' }, attachmentRow: { flexDirection: 'row-reverse', gap: 8 }, attachBtn: { flex: 1, minHeight: 52, borderRadius: 13, borderWidth: 1, flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: 7 }, filePill: { minHeight: 58, borderRadius: 13, borderWidth: 1, padding: 7, marginTop: 8, flexDirection: 'row-reverse', alignItems: 'center', gap: 8 }, smallImage: { width: 44, height: 44, borderRadius: 8 }, pdfIcon: { width: 44, height: 44, borderRadius: 8, backgroundColor: '#EAF3FF', alignItems: 'center', justifyContent: 'center' }, formCats: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 7 }, save: { minHeight: 51, borderRadius: 14, marginTop: 20, flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: 8 }, saveText: { color: '#fff', fontSize: 14, fontFamily: 'Inter_700Bold' }, cancel: { minHeight: 48, borderRadius: 14, borderWidth: 1, marginTop: 9, alignItems: 'center', justifyContent: 'center' },
  preview: { flex: 1, backgroundColor: 'rgba(0,0,0,.94)', alignItems: 'center', justifyContent: 'center', padding: 15 }, closePreview: { position: 'absolute', top: Platform.OS === 'web' ? 20 : 55, right: 20, width: 45, height: 45, borderRadius: 14, backgroundColor: 'rgba(255,255,255,.15)', alignItems: 'center', justifyContent: 'center', zIndex: 5 }, fullImage: { width: '100%', height: '82%' }
});
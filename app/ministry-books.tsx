import React, { useMemo, useState } from 'react';
import { Alert, Image, Linking, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { File, Paths } from 'expo-file-system';
import * as FileSystemLegacy from 'expo-file-system/legacy';
import * as IntentLauncher from 'expo-intent-launcher';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useColors } from '@/hooks/useColors';
import { MinistryBook, MinistryBookCategory, ministryBookCategories, useStore } from '@/context/AppContext';
import { ZoomableImage } from '@/components/ZoomableImage';

type Preview = { type: 'image' | 'pdf'; uri: string; name?: string } | null;

export default function MinistryBooks() {
  const c = useColors();
  const { ministryBooks, addMinistryBook, updateMinistryBook, deleteMinistryBook } = useStore();
  const [showForm, setShowForm] = useState(false);
  const [editingBook, setEditingBook] = useState<MinistryBook | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<MinistryBookCategory | 'الكل'>('الكل');
  const [search, setSearch] = useState('');
  const [preview, setPreview] = useState<Preview>(null);
  const [title, setTitle] = useState('');
  const [bookNumber, setBookNumber] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [category, setCategory] = useState<MinistryBookCategory>('تعليمات');
  const [imageUri, setImageUri] = useState('');
  const [pdfUri, setPdfUri] = useState('');
  const [pdfName, setPdfName] = useState('');
  const [pdfMimeType, setPdfMimeType] = useState('application/pdf');
  const [notes, setNotes] = useState('');

  const filteredBooks = useMemo(() => {
    const q = search.trim().toLowerCase();
    return ministryBooks.filter((book) => {
      const categoryMatch = selectedCategory === 'الكل' || book.category === selectedCategory;
      const searchMatch = !q || book.title.toLowerCase().includes(q) || (book.bookNumber ?? '').toLowerCase().includes(q) || book.category.toLowerCase().includes(q) || (book.notes ?? '').toLowerCase().includes(q) || (book.pdfName ?? '').toLowerCase().includes(q);
      return categoryMatch && searchMatch;
    });
  }, [ministryBooks, selectedCategory, search]);

  const resetForm = () => {
    setTitle(''); setBookNumber(''); setDate(new Date().toISOString().slice(0, 10));
    setCategory('تعليمات'); setImageUri(''); setPdfUri(''); setPdfName(''); setPdfMimeType('application/pdf'); setNotes('');
  };

  const openAddForm = () => { setEditingBook(null); resetForm(); setShowForm(true); };
  const openEditForm = (book: MinistryBook) => {
    setEditingBook(book); setTitle(book.title); setBookNumber(book.bookNumber ?? ''); setDate(book.date); setCategory(book.category);
    setImageUri(book.imageUri || ''); setPdfUri(book.pdfUri || ''); setPdfName(book.pdfName || ''); setPdfMimeType(book.pdfMimeType || 'application/pdf'); setNotes(book.notes || ''); setShowForm(true);
  };
  const closeForm = () => { setShowForm(false); setEditingBook(null); };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: false, quality: 0.9 });
      if (!result.canceled && result.assets?.[0]?.uri) { setImageUri(result.assets[0].uri); setPdfUri(''); setPdfName(''); }
    } catch { Alert.alert('خطأ', 'تعذر اختيار صورة الكتاب.'); }
  };

  const takePhoto = async () => {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) { Alert.alert('صلاحية مطلوبة', 'يجب السماح للتطبيق باستخدام الكاميرا.'); return; }
      const result = await ImagePicker.launchCameraAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: false, quality: 0.9 });
      if (!result.canceled && result.assets?.[0]?.uri) { setImageUri(result.assets[0].uri); setPdfUri(''); setPdfName(''); }
    } catch { Alert.alert('خطأ', 'تعذر التقاط صورة الكتاب.'); }
  };

  const chooseImageSource = () => {
    if (Platform.OS === 'web') { pickImage(); return; }
    Alert.alert('صورة الكتاب', 'اختر المصدر', [{ text: 'المعرض', onPress: pickImage }, { text: 'الكاميرا', onPress: takePhoto }, { text: 'إلغاء', style: 'cancel' }]);
  };

  const pickPdf = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: 'application/pdf', copyToCacheDirectory: true, base64: Platform.OS === 'web' });
      if (result.canceled || !result.assets?.[0]) return;
      const asset = result.assets[0];
      let uri = asset.uri;
      if (Platform.OS === 'web' && asset.base64) {
        uri = `data:${asset.mimeType || 'application/pdf'};base64,${asset.base64}`;
      } else if (Platform.OS !== 'web') {
        try {
          const source = new File(asset.uri);
          const safeName = `${Date.now()}-${(asset.name || 'ministry-book.pdf').replace(/[^a-zA-Z0-9._-]/g, '_')}`;
          const destination = new File(Paths.document, safeName);
          source.copy(destination);
          uri = destination.uri;
        } catch (copyError) {
          console.warn('تعذر نسخ PDF إلى التخزين الدائم، سيتم الاحتفاظ بالمرجع المؤقت.', copyError);
        }
      }
      setPdfUri(uri); setPdfName(asset.name || 'كتاب وزاري.pdf'); setPdfMimeType(asset.mimeType || 'application/pdf'); setImageUri('');
    } catch (error) { console.error(error); Alert.alert('خطأ', 'تعذر اختيار ملف PDF.'); }
  };

  const removeAttachment = () => {
    Alert.alert('حذف المرفق', 'هل تريد إزالة المرفق من النموذج؟', [
      { text: 'إلغاء', style: 'cancel' },
      { text: 'حذف', style: 'destructive', onPress: () => { setImageUri(''); setPdfUri(''); setPdfName(''); } },
    ]);
  };

  const saveBook = () => {
    if (!title.trim()) { Alert.alert('تنبيه', 'اكتب عنواناً مختصراً للكتاب.'); return; }
    if (!date.trim()) { Alert.alert('تنبيه', 'أدخل تاريخ الكتاب.'); return; }
    if (!imageUri && !pdfUri) { Alert.alert('تنبيه', 'أضف صورة الكتاب أو ملف PDF أولاً.'); return; }
    const data = { title: title.trim(), bookNumber: bookNumber.trim(), date: date.trim(), category, imageUri, pdfUri: pdfUri || undefined, pdfName: pdfName || undefined, pdfMimeType: pdfMimeType || undefined, notes: notes.trim(), createdAt: editingBook?.createdAt ?? new Date().toISOString() };
    try {
      if (editingBook) updateMinistryBook(editingBook.id, data); else addMinistryBook(data);
      closeForm(); Alert.alert('تم الحفظ', editingBook ? 'تم تحديث بيانات الكتاب بنجاح.' : 'تم حفظ الكتاب الوزاري بنجاح.');
    } catch (error) { console.error(error); Alert.alert('خطأ', 'تعذر حفظ الكتاب. حاول مرة أخرى.'); }
  };

  const openPreview = (book: MinistryBook) => {
    if (book.imageUri) setPreview({ type: 'image', uri: book.imageUri });
    else if (book.pdfUri) setPreview({ type: 'pdf', uri: book.pdfUri, name: book.pdfName });
  };

  const openPdf = async (uri: string) => {
    try {
      if (Platform.OS === 'android') {
        const contentUri = uri.startsWith('content://') ? uri : await FileSystemLegacy.getContentUriAsync(uri);
        await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
          data: contentUri,
          type: 'application/pdf',
          flags: 1,
        });
        return;
      }
      await Linking.openURL(uri);
    } catch (error) {
      console.error('تعذر فتح PDF', error);
      Alert.alert('تعذر فتح الملف', 'لا يمكن فتح ملف PDF على هذا الجهاز حالياً.');
    }
  };

  const getCategoryBackground = (item: MinistryBookCategory) => {
    if (item === 'عاجلة') return '#FDE7E7';
    if (item === 'هامة') return '#FFF1D6';
    if (item === 'امتحانات') return '#E5F1FF';
    if (item === 'نقل') return '#EEE8FF';
    if (item === 'تعليمات') return '#E3F4F0';
    return c.secondary;
  };

  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={[styles.headerButton, { backgroundColor: c.card, borderColor: c.border }]}><Feather name="arrow-right" size={21} color={c.foreground} /></Pressable>
          <View style={styles.headerCenter}><Text style={[styles.eyebrow, { color: c.primary }]}>وزارة التربية والتعليم</Text><Text style={[styles.headerTitle, { color: c.foreground }]}>الكتب الوزارية</Text><Text style={[styles.headerSub, { color: c.mutedForeground }]}>حفظ الكتب والتعليمات الواردة</Text></View>
          <Pressable onPress={openAddForm} style={[styles.addButton, { backgroundColor: c.primary }]}><Feather name="plus" size={22} color="#FFFFFF" /></Pressable>
        </View>

        <View style={[styles.infoCard, { backgroundColor: c.navy }]}>
          <View style={[styles.infoIcon, { backgroundColor: c.accent }]}><Feather name="file-text" size={25} color={c.navy} /></View>
          <View style={{ flex: 1 }}><Text style={styles.infoTitle}>أرشيف الكتب الوزارية</Text><Text style={styles.infoText}>احفظ الكتب والتعليمات كصور أو ملفات PDF داخل التطبيق مع تصنيفها لتسهيل الرجوع إليها لاحقاً.</Text></View>
        </View>

        <Pressable onPress={openAddForm} style={[styles.quickAddButton, { backgroundColor: c.primary }]}><Feather name="plus-circle" size={21} color="#FFFFFF" /><Text style={styles.quickAddText}>إضافة كتاب وزاري</Text></Pressable>

        <View style={[styles.searchBox, { backgroundColor: c.card, borderColor: c.border }]}><Feather name="search" size={19} color={c.mutedForeground} /><TextInput value={search} onChangeText={setSearch} placeholder="ابحث برقم الكتاب أو العنوان..." placeholderTextColor={c.mutedForeground} style={[styles.searchInput, { color: c.foreground }]} /></View>
        <Text style={[styles.sectionTitle, { color: c.foreground }]}>تصنيف الكتاب</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categories}>
          <CategoryButton label="الكل" selected={selectedCategory === 'الكل'} onPress={() => setSelectedCategory('الكل')} c={c} />
          {ministryBookCategories.map(item => <CategoryButton key={item} label={item} selected={selectedCategory === item} onPress={() => setSelectedCategory(item)} c={c} />)}
        </ScrollView>
        <View style={styles.countRow}><Text style={[styles.sectionTitle, { color: c.foreground, marginTop: 0, marginBottom: 0 }]}>الأرشيف</Text><Text style={[styles.countText, { color: c.mutedForeground }]}>عدد الكتب: {filteredBooks.length}</Text></View>

        {filteredBooks.length === 0 ? <EmptyState c={c} onPress={openAddForm} /> : filteredBooks.map(book => <BookCard key={book.id} book={book} c={c} categoryBackground={getCategoryBackground(book.category)} onAttachmentPress={() => openPreview(book)} onPdfPress={() => book.pdfUri && openPdf(book.pdfUri)} onEdit={() => openEditForm(book)} onDelete={() => Alert.alert('حذف الكتاب', `هل تريد حذف الكتاب "${book.title}"؟`, [{ text: 'إلغاء', style: 'cancel' }, { text: 'حذف', style: 'destructive', onPress: () => deleteMinistryBook(book.id) }])} />)}
        <View style={{ height: 50 }} />
      </ScrollView>

      <Modal visible={showForm} animationType="slide" transparent onRequestClose={closeForm}>
        <View style={styles.modalOverlay}><View style={[styles.modal, { backgroundColor: c.background }]}>
          <View style={styles.modalHeader}><Pressable onPress={closeForm}><Feather name="x" size={25} color={c.foreground} /></Pressable><Text style={[styles.modalTitle, { color: c.foreground }]}>{editingBook ? 'تعديل الكتاب' : 'إضافة كتاب وزاري'}</Text><View style={{ width: 25 }} /></View>
          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <Text style={[styles.label, { color: c.foreground }]}>مرفق الكتاب</Text>
            {imageUri ? <View style={[styles.imagePicker, { backgroundColor: c.card, borderColor: c.border }]}><Image source={{ uri: imageUri }} style={styles.previewImage} resizeMode="contain" /></View> : pdfUri ? <View style={[styles.pdfBox, { backgroundColor: c.secondary, borderColor: c.border }]}><Feather name="file-text" size={35} color={c.primary} /><Text style={[styles.pdfTitle, { color: c.foreground }]} numberOfLines={2}>{pdfName || 'ملف PDF'}</Text><Text style={[styles.pdfSub, { color: c.mutedForeground }]}>تم إرفاق ملف PDF</Text></View> : <Pressable onPress={chooseImageSource} style={[styles.imagePicker, { backgroundColor: c.card, borderColor: c.border }]}><View style={[styles.uploadIcon, { backgroundColor: c.secondary }]}><Feather name="camera" size={28} color={c.primary} /></View><Text style={[styles.uploadTitle, { color: c.foreground }]}>اختر صورة الكتاب</Text><Text style={[styles.uploadSub, { color: c.mutedForeground }]}>أو أضف ملف PDF</Text></Pressable>}
            <View style={styles.attachmentActions}>
              <Pressable onPress={chooseImageSource} style={[styles.changeImageButton, { borderColor: c.border }]}><Feather name="image" size={16} color={c.primary} /><Text style={{ color: c.primary, fontFamily: 'Inter_600SemiBold' }}>صورة</Text></Pressable>
              <Pressable onPress={pickPdf} style={[styles.changeImageButton, { borderColor: c.border }]}><Feather name="file-text" size={16} color={c.primary} /><Text style={{ color: c.primary, fontFamily: 'Inter_600SemiBold' }}>PDF</Text></Pressable>
              {(imageUri || pdfUri) ? <Pressable onPress={removeAttachment} style={styles.removeImageButton}><Feather name="trash-2" size={15} color="#C62828" /><Text style={styles.removeImageText}>حذف</Text></Pressable> : null}
            </View>

            <Text style={[styles.label, { color: c.foreground }]}>عنوان مختصر للكتاب</Text><TextInput value={title} onChangeText={setTitle} placeholder="مثال: تعليمات الامتحانات النهائية" placeholderTextColor={c.mutedForeground} style={[styles.input, { color: c.foreground, backgroundColor: c.card, borderColor: c.border }]} />
            <Text style={[styles.label, { color: c.foreground }]}>رقم الكتاب الوزاري (اختياري)</Text><TextInput value={bookNumber} onChangeText={setBookNumber} placeholder="مثال: 12345 / 2026" placeholderTextColor={c.mutedForeground} style={[styles.input, { color: c.foreground, backgroundColor: c.card, borderColor: c.border }]} />
            <Text style={[styles.label, { color: c.foreground }]}>تاريخ الكتاب</Text><TextInput value={date} onChangeText={setDate} placeholder="YYYY-MM-DD" placeholderTextColor={c.mutedForeground} style={[styles.input, { color: c.foreground, backgroundColor: c.card, borderColor: c.border }]} />
            <Text style={[styles.label, { color: c.foreground }]}>تصنيف الكتاب</Text><View style={styles.formCategories}>{ministryBookCategories.map(item => <Pressable key={item} onPress={() => setCategory(item)} style={[styles.formCategory, { backgroundColor: category === item ? c.primary : c.card, borderColor: category === item ? c.primary : c.border }]}><Text style={{ color: category === item ? '#FFFFFF' : c.foreground, fontFamily: 'Inter_600SemiBold', fontSize: 12 }}>{item}</Text></Pressable>)}</View>
            <Text style={[styles.label, { color: c.foreground }]}>ملاحظات</Text><TextInput value={notes} onChangeText={setNotes} placeholder="أضف أي ملاحظة تحتاجها..." placeholderTextColor={c.mutedForeground} multiline textAlignVertical="top" style={[styles.notesInput, { color: c.foreground, backgroundColor: c.card, borderColor: c.border }]} />
            <Pressable onPress={saveBook} style={[styles.saveButton, { backgroundColor: c.primary }]}><Feather name="save" size={19} color="#FFFFFF" /><Text style={styles.saveText}>{editingBook ? 'حفظ التعديلات' : 'حفظ الكتاب'}</Text></Pressable>
            <Pressable onPress={closeForm} style={[styles.cancelButton, { borderColor: c.border }]}><Text style={{ color: c.foreground, fontFamily: 'Inter_600SemiBold' }}>إلغاء</Text></Pressable><View style={{ height: 40 }} />
          </ScrollView>
        </View></View>
      </Modal>

      <Modal visible={!!preview} animationType="fade" transparent onRequestClose={() => setPreview(null)}>
        <View style={styles.previewOverlay}>
          <Pressable style={styles.previewClose} onPress={() => setPreview(null)}><Feather name="x" size={25} color="#FFFFFF" /></Pressable>
          {preview?.type === 'image' ? <View style={styles.previewContainer}><ZoomableImage uri={preview.uri} /></View> : preview ? <View style={styles.pdfPreviewBox}><Feather name="file-text" size={60} color="#FFFFFF" /><Text style={styles.pdfPreviewTitle}>{preview.name || 'ملف PDF'}</Text><Pressable onPress={() => openPdf(preview.uri)} style={styles.openPdfButton}><Feather name="external-link" size={18} color="#FFFFFF" /><Text style={styles.previewBottomText}>فتح ملف PDF</Text></Pressable></View> : null}
          <Pressable onPress={() => setPreview(null)} style={styles.previewBottomButton}><Feather name="x-circle" size={18} color="#FFFFFF" /><Text style={styles.previewBottomText}>إغلاق</Text></Pressable>
        </View>
      </Modal>
    </View>
  );
}

function CategoryButton({ label, selected, onPress, c }: any) { return <Pressable onPress={onPress} style={[styles.categoryButton, { backgroundColor: selected ? c.primary : c.card, borderColor: selected ? c.primary : c.border }]}><Text style={{ color: selected ? '#FFFFFF' : c.foreground, fontFamily: 'Inter_600SemiBold', fontSize: 12 }}>{label}</Text></Pressable>; }

function BookCard({ book, c, categoryBackground, onAttachmentPress, onPdfPress, onEdit, onDelete }: any) {
  return <View style={[styles.bookCard, { backgroundColor: c.card, borderColor: c.border }]}>
    <Pressable onPress={onAttachmentPress} style={styles.bookImageContainer}>
      {book.imageUri ? <><Image source={{ uri: book.imageUri }} style={styles.bookImage} resizeMode="cover" /><View style={styles.imageZoomIcon}><Feather name="maximize-2" size={13} color="#FFFFFF" /></View></> : <View style={[styles.pdfThumb, { backgroundColor: c.secondary }]}><Feather name="file-text" size={31} color={c.primary} /><Text style={[styles.pdfThumbText, { color: c.primary }]}>PDF</Text></View>}
    </Pressable>
    <View style={styles.bookInfo}><View style={styles.bookTopRow}><View style={[styles.categoryBadge, { backgroundColor: categoryBackground }]}><Text style={[styles.categoryText, { color: c.primary }]}>{book.category}</Text></View><Text style={[styles.bookTitle, { color: c.foreground }]} numberOfLines={2}>{book.title}</Text></View>
      {book.bookNumber ? <Text style={[styles.bookNumber, { color: c.mutedForeground }]}>رقم الكتاب: {book.bookNumber}</Text> : null}<Text style={[styles.bookDate, { color: c.mutedForeground }]}>تاريخ الكتاب: {book.date}</Text>
      {book.pdfName ? <Pressable onPress={onPdfPress}><Text style={[styles.pdfLink, { color: c.primary }]} numberOfLines={1}>📄 {book.pdfName}</Text></Pressable> : null}
      {book.notes ? <Text style={[styles.bookNotes, { color: c.mutedForeground }]} numberOfLines={3}>{book.notes}</Text> : null}
      <View style={styles.bookActions}><Pressable onPress={onDelete} style={[styles.actionButton, { backgroundColor: '#FDE7E7' }]}><Feather name="trash-2" size={16} color="#C62828" /><Text style={{ color: '#C62828', fontFamily: 'Inter_600SemiBold', fontSize: 11 }}>حذف</Text></Pressable><Pressable onPress={onEdit} style={[styles.actionButton, { backgroundColor: c.secondary }]}><Feather name="edit-2" size={16} color={c.primary} /><Text style={{ color: c.primary, fontFamily: 'Inter_600SemiBold', fontSize: 11 }}>تعديل</Text></Pressable><Pressable onPress={onAttachmentPress} style={[styles.actionButton, { backgroundColor: c.secondary }]}><Feather name={book.pdfUri && !book.imageUri ? 'file-text' : 'image'} size={16} color={c.primary} /><Text style={{ color: c.primary, fontFamily: 'Inter_600SemiBold', fontSize: 11 }}>{book.pdfUri && !book.imageUri ? 'PDF' : 'عرض'}</Text></Pressable></View>
    </View>
  </View>;
}

function EmptyState({ c, onPress }: any) { return <View style={[styles.empty, { backgroundColor: c.card, borderColor: c.border }]}><View style={[styles.emptyIcon, { backgroundColor: c.secondary }]}><Feather name="archive" size={31} color={c.primary} /></View><Text style={[styles.emptyTitle, { color: c.foreground }]}>لا توجد كتب وزارية</Text><Text style={[styles.emptyText, { color: c.mutedForeground }]}>ابدأ بحفظ أول كتاب أو تعليمات تصلك من الوزارة.</Text><Pressable onPress={onPress} style={[styles.emptyButton, { backgroundColor: c.primary }]}><Feather name="plus" size={18} color="#FFFFFF" /><Text style={{ color: '#FFFFFF', fontFamily: 'Inter_600SemiBold' }}>إضافة كتاب</Text></Pressable></View>; }

const styles = StyleSheet.create({
  container:{flex:1}, content:{paddingHorizontal:16,paddingTop:18}, header:{flexDirection:'row-reverse',alignItems:'center',justifyContent:'space-between',marginBottom:16}, headerCenter:{flex:1,alignItems:'center'}, headerButton:{width:44,height:44,borderRadius:14,borderWidth:1,alignItems:'center',justifyContent:'center'}, addButton:{width:44,height:44,borderRadius:14,alignItems:'center',justifyContent:'center'}, eyebrow:{fontSize:11,fontFamily:'Inter_600SemiBold',textAlign:'center'}, headerTitle:{fontSize:21,fontFamily:'Inter_700Bold',textAlign:'center',marginTop:3}, headerSub:{fontSize:10,fontFamily:'Inter_400Regular',textAlign:'center',marginTop:3}, infoCard:{borderRadius:20,padding:17,flexDirection:'row-reverse',alignItems:'center',gap:13,marginBottom:12}, infoIcon:{width:53,height:53,borderRadius:17,alignItems:'center',justifyContent:'center'}, infoTitle:{color:'#FFFFFF',fontSize:16,fontFamily:'Inter_700Bold',textAlign:'right',marginBottom:5}, infoText:{color:'#B7D9D4',fontSize:11,lineHeight:18,fontFamily:'Inter_400Regular',textAlign:'right'}, quickAddButton:{minHeight:53,borderRadius:16,flexDirection:'row-reverse',alignItems:'center',justifyContent:'center',gap:8,marginBottom:14}, quickAddText:{color:'#FFFFFF',fontSize:13,fontFamily:'Inter_700Bold'}, searchBox:{minHeight:49,borderRadius:15,borderWidth:1,paddingHorizontal:13,flexDirection:'row-reverse',alignItems:'center',gap:9}, searchInput:{flex:1,fontFamily:'Inter_400Regular',fontSize:12,textAlign:'right',paddingVertical:9}, sectionTitle:{fontSize:15,fontFamily:'Inter_700Bold',textAlign:'right',marginTop:19,marginBottom:9}, categories:{gap:7,paddingBottom:2}, categoryButton:{paddingHorizontal:13,paddingVertical:9,borderRadius:12,borderWidth:1}, countRow:{flexDirection:'row-reverse',justifyContent:'space-between',alignItems:'center',marginTop:12,marginBottom:10}, countText:{fontSize:11,fontFamily:'Inter_500Medium'}, bookCard:{borderRadius:18,borderWidth:1,padding:11,flexDirection:'row-reverse',gap:12,marginBottom:10,minHeight:150}, bookImageContainer:{width:112,height:142,borderRadius:13,overflow:'hidden',position:'relative',backgroundColor:'#EEF5F4'}, bookImage:{width:'100%',height:'100%'}, pdfThumb:{width:'100%',height:'100%',alignItems:'center',justifyContent:'center'}, pdfThumbText:{fontFamily:'Inter_700Bold',fontSize:13,marginTop:5}, imageZoomIcon:{position:'absolute',left:7,bottom:7,width:27,height:27,borderRadius:9,backgroundColor:'rgba(0,0,0,0.55)',alignItems:'center',justifyContent:'center'}, bookInfo:{flex:1,minWidth:0}, bookTopRow:{flexDirection:'row-reverse',alignItems:'flex-start',gap:7}, bookTitle:{flex:1,fontSize:14,lineHeight:20,fontFamily:'Inter_700Bold',textAlign:'right'}, categoryBadge:{borderRadius:8,paddingHorizontal:7,paddingVertical:5}, categoryText:{fontSize:9,fontFamily:'Inter_600SemiBold'}, bookNumber:{fontSize:10,fontFamily:'Inter_500Medium',textAlign:'right',marginTop:8}, bookDate:{fontSize:10,fontFamily:'Inter_400Regular',textAlign:'right',marginTop:8}, pdfLink:{fontSize:10,fontFamily:'Inter_600SemiBold',textAlign:'right',marginTop:6}, bookNotes:{fontSize:10,lineHeight:16,fontFamily:'Inter_400Regular',textAlign:'right',marginTop:5}, bookActions:{flexDirection:'row-reverse',justifyContent:'flex-start',flexWrap:'wrap',gap:7,marginTop:9}, actionButton:{minWidth:60,borderRadius:9,paddingHorizontal:8,paddingVertical:7,flexDirection:'row-reverse',alignItems:'center',justifyContent:'center',gap:5}, empty:{borderRadius:20,borderWidth:1,padding:30,alignItems:'center',justifyContent:'center',marginTop:7}, emptyIcon:{width:65,height:65,borderRadius:21,alignItems:'center',justifyContent:'center'}, emptyTitle:{fontSize:16,fontFamily:'Inter_700Bold',marginTop:13}, emptyText:{fontSize:11,fontFamily:'Inter_400Regular',textAlign:'center',lineHeight:18,marginTop:5}, emptyButton:{marginTop:16,borderRadius:12,paddingHorizontal:17,paddingVertical:10,flexDirection:'row-reverse',alignItems:'center',gap:6}, modalOverlay:{flex:1,backgroundColor:'rgba(0,0,0,0.45)',justifyContent:'flex-end'}, modal:{maxHeight:'94%',borderTopLeftRadius:25,borderTopRightRadius:25,paddingHorizontal:17,paddingTop:15}, modalHeader:{flexDirection:'row-reverse',alignItems:'center',justifyContent:'space-between',marginBottom:10}, modalTitle:{fontSize:18,fontFamily:'Inter_700Bold'}, label:{fontSize:12,fontFamily:'Inter_600SemiBold',textAlign:'right',marginTop:14,marginBottom:7}, input:{minHeight:48,borderRadius:13,borderWidth:1,paddingHorizontal:12,fontFamily:'Inter_400Regular',fontSize:12,textAlign:'right'}, notesInput:{minHeight:105,borderRadius:13,borderWidth:1,paddingHorizontal:12,paddingTop:12,fontFamily:'Inter_400Regular',fontSize:12,textAlign:'right'}, imagePicker:{height:190,borderRadius:17,borderWidth:1,borderStyle:'dashed',alignItems:'center',justifyContent:'center',overflow:'hidden'}, previewImage:{width:'100%',height:'100%'}, uploadIcon:{width:60,height:60,borderRadius:20,alignItems:'center',justifyContent:'center'}, uploadTitle:{fontSize:13,fontFamily:'Inter_700Bold',marginTop:10}, uploadSub:{fontSize:10,fontFamily:'Inter_400Regular',marginTop:4}, attachmentActions:{flexDirection:'row-reverse',alignItems:'center',gap:7,marginTop:7}, changeImageButton:{borderWidth:1,borderRadius:9,paddingHorizontal:10,paddingVertical:7,flexDirection:'row-reverse',alignItems:'center',gap:5}, removeImageButton:{borderWidth:1,borderColor:'#F2B8B8',backgroundColor:'#FDE7E7',borderRadius:9,paddingHorizontal:10,paddingVertical:7,flexDirection:'row-reverse',alignItems:'center',gap:5}, removeImageText:{color:'#C62828',fontFamily:'Inter_600SemiBold',fontSize:11}, pdfBox:{height:190,borderRadius:17,borderWidth:1,borderStyle:'dashed',alignItems:'center',justifyContent:'center',padding:20}, pdfTitle:{fontSize:14,fontFamily:'Inter_700Bold',textAlign:'center',marginTop:10}, pdfSub:{fontSize:10,fontFamily:'Inter_400Regular',marginTop:5}, formCategories:{flexDirection:'row-reverse',flexWrap:'wrap',gap:7}, formCategory:{borderRadius:10,borderWidth:1,paddingHorizontal:11,paddingVertical:9}, saveButton:{minHeight:51,borderRadius:14,marginTop:20,flexDirection:'row-reverse',alignItems:'center',justifyContent:'center',gap:8}, saveText:{color:'#FFFFFF',fontSize:14,fontFamily:'Inter_700Bold'}, cancelButton:{minHeight:48,borderRadius:14,borderWidth:1,marginTop:9,alignItems:'center',justifyContent:'center'}, previewOverlay:{flex:1,backgroundColor:'rgba(0,0,0,0.94)',alignItems:'center',justifyContent:'center',paddingHorizontal:15}, previewClose:{position:'absolute',top:Platform.OS==='web'?25:55,right:20,width:45,height:45,borderRadius:14,backgroundColor:'rgba(255,255,255,0.15)',alignItems:'center',justifyContent:'center',zIndex:10}, previewContainer:{width:'100%',height:'72%',alignItems:'center',justifyContent:'center'}, fullPreviewImage:{width:'92%',height:'92%'}, previewBottomButton:{position:'absolute',bottom:Platform.OS==='web'?25:45,minWidth:110,minHeight:44,borderRadius:13,paddingHorizontal:17,flexDirection:'row-reverse',alignItems:'center',justifyContent:'center',gap:7,backgroundColor:'rgba(255,255,255,0.15)'}, previewBottomText:{color:'#FFFFFF',fontFamily:'Inter_600SemiBold',fontSize:13}, pdfPreviewBox:{alignItems:'center',justifyContent:'center',padding:30}, pdfPreviewTitle:{color:'#FFFFFF',fontFamily:'Inter_700Bold',fontSize:16,textAlign:'center',marginTop:15,maxWidth:320}, openPdfButton:{marginTop:20,minHeight:48,borderRadius:13,paddingHorizontal:18,flexDirection:'row-reverse',alignItems:'center',justifyContent:'center',gap:8,backgroundColor:'rgba(255,255,255,0.15)'}
});

import React, { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useStore } from '@/context/AppContext';
import { KeyboardAwareScrollViewCompat } from '@/components/KeyboardAwareScrollViewCompat';

const MONTHS = ['كانون الثاني','شباط','آذار','نيسان','أيار','حزيران','تموز','آب','أيلول','تشرين الأول','تشرين الثاني','كانون الأول'];
type Status = 'planned' | 'in_progress' | 'completed';
type Suggestion = { schoolId: string; title: string; notes: string; reason: string };

export default function MonthlyPlanScreen() {
  const router = useRouter();
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const year = now.getFullYear();
  const { schools, visits, tasks, addTask, updateTask, deleteTask } = useStore();
  const [showAdd, setShowAdd] = useState(false);
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [date, setDate] = useState(`${year}-${String(selectedMonth + 1).padStart(2,'0')}-20`);
  const [schoolId, setSchoolId] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const monthKey = `${year}-${String(selectedMonth + 1).padStart(2,'0')}`;
  const monthTasks = useMemo(() => tasks.filter(t => t.date?.startsWith(monthKey)), [tasks, monthKey]);
  const completed = monthTasks.filter(t => (t.planStatus || (t.done ? 'completed' : 'planned')) === 'completed').length;
  const inProgress = monthTasks.filter(t => (t.planStatus || (t.done ? 'completed' : 'planned')) === 'in_progress').length;
  const percentage = monthTasks.length ? Math.round(completed / monthTasks.length * 100) : 0;

  const changeStatus = (id: string) => {
    const task = tasks.find(t => t.id === id); if (!task) return;
    const current = task.planStatus || (task.done ? 'completed' : 'planned');
    const next: Status = current === 'planned' ? 'in_progress' : current === 'in_progress' ? 'completed' : 'planned';
    updateTask(id, { ...task, planStatus: next, done: next === 'completed' });
  };

  const addPlanItem = () => {
    if (!title.trim() || !schoolId || !date.trim()) {
      Alert.alert('بيانات ناقصة', 'أدخل عنوان المهمة والمدرسة والتاريخ المستهدف.'); return;
    }
    addTask({ title: title.trim(), schoolId, time: '', priority: 'medium', notes: notes.trim(), done: false, date: date.trim(), planStatus: 'planned' });
    setTitle(''); setNotes(''); setSchoolId(''); setShowAdd(false);
  };

  const useSuggestion = (s: Suggestion) => {
    setSchoolId(s.schoolId || ''); setTitle(s.title); setNotes(s.notes); setDate(`${monthKey}-20`); setShowAdd(true); setShowSuggestions(false);
  };

  const suggestMonthlyPlan = async () => {
    const base = process.env.EXPO_PUBLIC_API_URL;
    if (!base) { setAiError('عنوان خدمة الذكاء الاصطناعي غير مهيأ.'); return; }
    setAiLoading(true); setAiError('');
    try {
      const previousTasks = tasks.filter(t => t.date && t.date < `${monthKey}-01`);
      const currentTasks = tasks.filter(t => t.date?.startsWith(monthKey));
      const response = await fetch(`${base}/api/ai/monthly-plan`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ month: MONTHS[selectedMonth], year: String(year), schools, visits, previousTasks, currentTasks })
      });
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.error || 'تعذر الحصول على اقتراحات الخطة.');
      const next = Array.isArray(data.suggestions) ? data.suggestions : [];
      setSuggestions(next); setShowSuggestions(true);
      if (!next.length) setAiError('لم يجد المساعد أعمالًا إضافية مناسبة وفق البيانات المتاحة.');
    } catch (e: any) { setAiError(e?.message || 'حدث خطأ أثناء الاتصال بالمساعد الذكي.'); }
    finally { setAiLoading(false); }
  };

  return <View style={styles.container}>
    <View style={styles.header}>
      <Pressable style={styles.iconButton} onPress={() => router.back()}><Feather name="arrow-right" size={22} color="#1f4e79" /></Pressable>
      <View style={styles.headerText}><Text style={styles.headerTitle}>الخطة الشهرية</Text><Text style={styles.headerSub}>تنظيم ومتابعة الأعمال الشهرية</Text></View>
      <View style={styles.headerIcon}><Feather name="calendar" size={22} color="#fff" /></View>
    </View>

    <KeyboardAwareScrollViewCompat style={{ flex: 1 }} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>الشهر المستهدف</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.months}>
          {MONTHS.map((m,i) => <Pressable key={m} onPress={() => { setSelectedMonth(i); setDate(`${year}-${String(i+1).padStart(2,'0')}-20`); }} style={[styles.month, i===selectedMonth && styles.monthSelected]}><Text style={[styles.monthText, i===selectedMonth && styles.monthTextSelected]}>{m}</Text></Pressable>)}
        </ScrollView>
        <Text style={styles.selected}>خطة شهر {MONTHS[selectedMonth]} {year}</Text>
      </View>

      <View style={styles.stats}>
        <Stat label="إجمالي الأعمال" value={monthTasks.length} icon="list" />
        <Stat label="قيد التنفيذ" value={inProgress} icon="clock" />
        <Stat label="مكتملة" value={completed} icon="check-circle" />
      </View>
      <View style={styles.card}><View style={styles.row}><Text style={styles.progressValue}>{percentage}%</Text><Text style={styles.sectionTitle}>نسبة تنفيذ الخطة</Text></View><View style={styles.progress}><View style={[styles.progressFill,{width:`${percentage}%`}]} /></View><Text style={styles.hint}>يتم احتساب النسبة بناءً على الأعمال المكتملة لهذا الشهر.</Text></View>

      <Pressable style={[styles.aiButton, aiLoading && { opacity: .65 }]} onPress={suggestMonthlyPlan} disabled={aiLoading}><Feather name="cpu" size={20} color="#fff" /><Text style={styles.aiText}>{aiLoading ? 'جارٍ إعداد الاقتراحات...' : 'المساعد الذكي للخطة'}</Text></Pressable>
      <Text style={styles.aiHint}>يقترح أعمالًا مناسبة للشهر بالاعتماد على سجل المدارس والزيارات والأعمال السابقة، والمشرف يختار ما يعتمد.</Text>
      {aiError ? <View style={styles.error}><Text style={styles.errorText}>{aiError}</Text></View> : null}

      {showSuggestions && <View style={styles.suggestionBox}>
        <View style={styles.row}><Text style={styles.sectionTitle}>اقتراحات المساعد الذكي</Text><Pressable onPress={() => setShowSuggestions(false)}><Feather name="x" size={20} color="#718096" /></Pressable></View>
        <Text style={styles.review}>هذه اقتراحات غير معتمدة. راجعها وعدّلها قبل إضافتها إلى الخطة.</Text>
        {suggestions.map((s,i) => <View key={`${s.schoolId}-${i}`} style={styles.suggestion}><Text style={styles.suggestionTitle}>{s.title}</Text><Text style={styles.suggestionNotes}>{s.notes}</Text><Text style={styles.reason}>سبب الاقتراح: {s.reason}</Text><Pressable style={styles.useButton} onPress={() => useSuggestion(s)}><Feather name="edit-3" size={16} color="#fff" /><Text style={styles.useText}>استخدام هذا الاقتراح وتعديله</Text></Pressable></View>)}
      </View>}

      <Pressable style={styles.addButton} onPress={() => setShowAdd(v=>!v)}><Feather name={showAdd ? 'x':'plus'} size={20} color="#fff" /><Text style={styles.addText}>{showAdd ? 'إلغاء إضافة مهمة' : 'إضافة مهمة إلى الخطة'}</Text></Pressable>
      {showAdd && <View style={styles.card}>
        <Text style={styles.sectionTitle}>إضافة عمل جديد</Text>
        <Text style={styles.label}>المدرسة</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.months}>{schools.map(s => <Pressable key={s.id} onPress={()=>setSchoolId(s.id)} style={[styles.schoolChip, schoolId===s.id && styles.schoolSelected]}><Text style={[styles.schoolText, schoolId===s.id && {color:'#fff'}]}>{s.name}</Text></Pressable>)}</ScrollView>
        <Text style={styles.label}>عنوان المهمة</Text><TextInput value={title} onChangeText={setTitle} style={styles.input} textAlign="right" placeholder="مثال: زيارة مدرسة..." />
        <Text style={styles.label}>تفاصيل العمل</Text><TextInput value={notes} onChangeText={setNotes} style={[styles.input,styles.textArea]} textAlign="right" multiline placeholder="اكتب تفاصيل العمل أو الهدف منه..." />
        <Text style={styles.label}>التاريخ المستهدف</Text><TextInput value={date} onChangeText={setDate} style={styles.input} textAlign="right" placeholder="2026-08-20" />
        <Pressable style={styles.saveButton} onPress={addPlanItem}><Feather name="save" size={18} color="#fff" /><Text style={styles.saveText}>حفظ المهمة</Text></Pressable>
      </View>}

      <View style={styles.row}><View><Text style={styles.listTitle}>أعمال الخطة</Text><Text style={styles.hint}>{monthTasks.length} أعمال مسجلة لهذا الشهر</Text></View><Feather name="clipboard" size={23} color="#1f4e79" /></View>
      {monthTasks.map(task => { const status: Status = task.planStatus || (task.done?'completed':'planned'); return <View key={task.id} style={styles.item}><View style={styles.row}><View style={{flex:1}}><Text style={styles.itemTitle}>{task.title}</Text><Text style={styles.itemNotes}>{task.notes}</Text>{task.schoolId ? <Text style={styles.schoolName}>المدرسة: {schools.find(s=>s.id===task.schoolId)?.name || 'غير محددة'}</Text> : null}</View><Feather name={status==='completed'?'check-circle':status==='in_progress'?'clock':'calendar'} size={22} color="#1f4e79" /></View><View style={styles.row}><Pressable style={[styles.statusButton,status==='completed'&&styles.done,status==='in_progress'&&styles.running]} onPress={()=>changeStatus(task.id)}><Text style={styles.statusText}>{status==='completed'?'مكتملة':status==='in_progress'?'قيد التنفيذ':'مخططة'}</Text></Pressable><Pressable onPress={()=>Alert.alert('حذف المهمة','هل أنت متأكد من حذفها؟',[{text:'إلغاء',style:'cancel'},{text:'حذف',style:'destructive',onPress:()=>deleteTask(task.id)}])}><Feather name="trash-2" size={18} color="#c53030" /></Pressable></View></View>})}
    </KeyboardAwareScrollViewCompat>
  </View>;
}
function Stat({label,value,icon}:{label:string,value:number,icon:any}){return <View style={styles.stat}><Feather name={icon} size={20} color="#1f4e79"/><Text style={styles.statNumber}>{value}</Text><Text style={styles.statLabel}>{label}</Text></View>}
const styles=StyleSheet.create({container:{flex:1,backgroundColor:'#f4f6f8'},header:{flexDirection:'row-reverse',alignItems:'center',padding:15,backgroundColor:'#fff',borderBottomWidth:1,borderBottomColor:'#e5e7eb'},iconButton:{width:42,height:42,borderRadius:12,backgroundColor:'#eef4f8',alignItems:'center',justifyContent:'center'},headerText:{flex:1,alignItems:'flex-end',marginHorizontal:12},headerTitle:{fontSize:21,fontWeight:'800',color:'#1f4e79'},headerSub:{fontSize:12,color:'#777',marginTop:3},headerIcon:{width:42,height:42,borderRadius:12,backgroundColor:'#1f4e79',alignItems:'center',justifyContent:'center'},content:{padding:16,paddingBottom:50},card:{backgroundColor:'#fff',borderRadius:16,padding:16,marginBottom:14},sectionTitle:{fontSize:16,fontWeight:'700',color:'#222',textAlign:'right'},months:{flexDirection:'row-reverse',gap:8,paddingVertical:10},month:{paddingHorizontal:14,paddingVertical:9,borderRadius:10,backgroundColor:'#f1f5f9'},monthSelected:{backgroundColor:'#1f4e79'},monthText:{fontSize:12,color:'#555',fontWeight:'600'},monthTextSelected:{color:'#fff'},selected:{textAlign:'right',marginTop:4,color:'#1f4e79',fontWeight:'700'},stats:{flexDirection:'row-reverse',gap:10,marginBottom:14},stat:{flex:1,backgroundColor:'#fff',borderRadius:14,padding:14,alignItems:'center'},statNumber:{fontSize:22,fontWeight:'800',marginTop:4},statLabel:{fontSize:10,color:'#777',marginTop:3,textAlign:'center'},row:{flexDirection:'row-reverse',alignItems:'center',justifyContent:'space-between',gap:10},progressValue:{fontSize:18,fontWeight:'800',color:'#1f4e79'},progress:{height:10,borderRadius:10,backgroundColor:'#e5e7eb',overflow:'hidden',marginTop:10},progressFill:{height:'100%',backgroundColor:'#1f4e79'},hint:{fontSize:11,color:'#888',textAlign:'right',marginTop:7},aiButton:{height:50,borderRadius:12,backgroundColor:'#1f4e79',alignItems:'center',justifyContent:'center',flexDirection:'row',gap:8},aiText:{color:'#fff',fontWeight:'800',fontSize:15},aiHint:{fontSize:11,color:'#6b7280',textAlign:'right',lineHeight:18,margin:7},error:{backgroundColor:'#fff5f5',borderRadius:10,padding:10,marginBottom:10},errorText:{color:'#c53030',textAlign:'right',fontSize:11},suggestionBox:{backgroundColor:'#eef4f8',borderRadius:15,padding:14,marginBottom:12},review:{fontSize:11,color:'#5f6b75',textAlign:'right',lineHeight:18,marginVertical:7},suggestion:{backgroundColor:'#fff',borderRadius:12,padding:12,marginTop:8},suggestionTitle:{fontSize:14,fontWeight:'800',color:'#1f4e79',textAlign:'right'},suggestionNotes:{fontSize:12,color:'#444',lineHeight:19,textAlign:'right',marginTop:5},reason:{fontSize:10,color:'#777',lineHeight:17,textAlign:'right',marginTop:5},useButton:{backgroundColor:'#2f855a',borderRadius:9,height:38,alignItems:'center',justifyContent:'center',flexDirection:'row-reverse',gap:6,marginTop:10},useText:{color:'#fff',fontSize:11,fontWeight:'700'},addButton:{height:50,borderRadius:12,backgroundColor:'#1f4e79',alignItems:'center',justifyContent:'center',flexDirection:'row',gap:8,marginBottom:14},addText:{color:'#fff',fontWeight:'700'},label:{fontSize:12,fontWeight:'700',textAlign:'right',marginTop:9,marginBottom:6,color:'#444'},schoolChip:{borderWidth:1,borderColor:'#d1d5db',borderRadius:11,paddingHorizontal:11,paddingVertical:9},schoolSelected:{backgroundColor:'#1f4e79',borderColor:'#1f4e79'},schoolText:{fontSize:10,color:'#333'},input:{height:48,borderWidth:1,borderColor:'#d7dce1',borderRadius:10,backgroundColor:'#fafafa',paddingHorizontal:12,fontSize:13,color:'#222'},textArea:{height:90,paddingTop:12,textAlignVertical:'top'},saveButton:{height:48,borderRadius:10,backgroundColor:'#2f855a',alignItems:'center',justifyContent:'center',flexDirection:'row',gap:7,marginTop:15},saveText:{color:'#fff',fontWeight:'700'},listTitle:{fontSize:18,fontWeight:'800',textAlign:'right',color:'#222'},item:{backgroundColor:'#fff',borderRadius:15,padding:15,marginTop:10},itemTitle:{fontSize:15,fontWeight:'800',textAlign:'right',color:'#222'},itemNotes:{fontSize:12,color:'#666',textAlign:'right',lineHeight:18,marginTop:4},schoolName:{fontSize:10,color:'#1f4e79',textAlign:'right',marginTop:5},statusButton:{minWidth:95,height:34,borderRadius:9,backgroundColor:'#718096',alignItems:'center',justifyContent:'center',paddingHorizontal:10},running:{backgroundColor:'#b7791f'},done:{backgroundColor:'#2f855a'},statusText:{color:'#fff',fontSize:11,fontWeight:'700'}});

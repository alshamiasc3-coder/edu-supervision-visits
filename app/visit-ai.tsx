import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Feather } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { useStore } from '@/context/AppContext';

const AI_URL = 'https://edu-supervision-ai-worker.alshamiasc3.workers.dev';
const asString = (v?: string | string[] | null) => Array.isArray(v) ? v[0] ?? '' : v?.toString() ?? '';
type Options = { actionsOptions: string[]; recommendationsOptions: string[]; followUpOptions: string[] };
type SavedDraft = { visitType: string; actions: string; recommendations: string; followUp: string; options: Options };

export default function VisitAI() {
  const c = useColors(); const insets = useSafeAreaInsets(); const { visits } = useStore();
  const params = useLocalSearchParams<{ visitId?: string; schoolId?: string; schoolName?: string; visitType?: string; type?: string; date?: string }>();
  const schoolId = asString(params.schoolId); const schoolName = asString(params.schoolName) || 'المدرسة';
  const visitId = asString(params.visitId); const date = asString(params.date);
  const draftKey = useMemo(() => `edu-supervision-ai-draft:${visitId || schoolId || schoolName}:${date}`, [visitId, schoolId, schoolName, date]);
  const [visitType, setVisitType] = useState(asString(params.visitType || params.type));
  const [actions, setActions] = useState(''); const [recommendations, setRecommendations] = useState(''); const [followUp, setFollowUp] = useState('');
  const [options, setOptions] = useState<Options>({ actionsOptions: [], recommendationsOptions: [], followUpOptions: [] });
  const [loading, setLoading] = useState(false); const [message, setMessage] = useState(''); const [error, setError] = useState(false); const [draftLoaded, setDraftLoaded] = useState(false);
  const previousVisits = useMemo(() => visits.filter(v => v.schoolId === schoolId && v.id !== visitId).sort((a,b) => b.date.localeCompare(a.date)).slice(0,8), [visits, schoolId, visitId]);

  useEffect(() => {
    let active = true;
    const loadDraft = async () => {
      try {
        const raw = await AsyncStorage.getItem(draftKey);
        if (active && raw) {
          const saved = JSON.parse(raw) as Partial<SavedDraft>;
          if (typeof saved.visitType === 'string') setVisitType(saved.visitType);
          if (typeof saved.actions === 'string') setActions(saved.actions);
          if (typeof saved.recommendations === 'string') setRecommendations(saved.recommendations);
          if (typeof saved.followUp === 'string') setFollowUp(saved.followUp);
          if (saved.options) setOptions({
            actionsOptions: Array.isArray(saved.options.actionsOptions) ? saved.options.actionsOptions : [],
            recommendationsOptions: Array.isArray(saved.options.recommendationsOptions) ? saved.options.recommendationsOptions : [],
            followUpOptions: Array.isArray(saved.options.followUpOptions) ? saved.options.followUpOptions : [],
          });
        }
      } catch (e) { console.warn('تعذر استعادة مسودة المساعد الذكي', e); }
      finally { if (active) setDraftLoaded(true); }
    };
    loadDraft();
    return () => { active = false; };
  }, [draftKey]);

  useEffect(() => {
    if (!draftLoaded) return;
    const draft: SavedDraft = { visitType, actions, recommendations, followUp, options };
    AsyncStorage.setItem(draftKey, JSON.stringify(draft)).catch(e => console.warn('تعذر حفظ مسودة المساعد الذكي', e));
  }, [draftLoaded, draftKey, visitType, actions, recommendations, followUp, options]);

  const createSuggestions = async () => {
    if (!visitType.trim()) { setMessage('اكتب نوع الزيارة أولًا.'); setError(true); return; }
    if (!actions.trim()) { setMessage('اكتب الإجراءات التي اتخذتها فعليًا أولًا، ثم سيقترح المساعد صيغًا مهنية لها والتوصيات والمتابعة.'); setError(true); return; }
    try {
      setLoading(true); setMessage(''); setError(false);
      const response = await fetch(`${AI_URL}/api/ai/visit-draft`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ schoolName, visitType:visitType.trim(), actions:actions.trim(), recommendations:recommendations.trim(), followUp:followUp.trim(), previousVisits:previousVisits.map(v=>({date:v.date,type:v.type,actions:v.actions,recommendations:(v as any).recommendations,followUp:(v as any).followUp})) }) });
      const data = await response.json(); if (!response.ok || !data?.ok) throw new Error(data?.error || 'تعذر إنشاء الاقتراحات.');
      const r = data.result || {}; const next: Options = { actionsOptions:Array.isArray(r.actionsOptions)?r.actionsOptions.filter(Boolean).slice(0,4):[], recommendationsOptions:Array.isArray(r.recommendationsOptions)?r.recommendationsOptions.filter(Boolean).slice(0,4):[], followUpOptions:Array.isArray(r.followUpOptions)?r.followUpOptions.filter(Boolean).slice(0,4):[] };
      setOptions(next); if(next.actionsOptions[0]) setActions(next.actionsOptions[0]); if(next.recommendationsOptions[0]) setRecommendations(next.recommendationsOptions[0]); if(next.followUpOptions[0]) setFollowUp(next.followUpOptions[0]);
      setMessage('ظهرت عدة صيغ. اختر ما يناسبك ثم عدّل النص قبل الاعتماد.');
    } catch(e:any) { console.error(e); setMessage(e?.message || 'تعذر الاتصال بالمساعد الذكي.'); setError(true); } finally { setLoading(false); }
  };
  const approve = () => { if(!actions.trim()){setMessage('الإجراءات الفعلية مطلوبة قبل الاعتماد.');setError(true);return;} router.replace({pathname:'/visit-form',params:{visitId,schoolId,date,type:visitType.trim(),visitType:visitType.trim(),aiActions:actions.trim(),aiRecommendations:recommendations.trim(),aiFollowUp:followUp.trim()}}); };
  const optionList = (title:string, values:string[], selected:string, setter:(v:string)=>void) => values.length ? <View style={[styles.optionsCard,{backgroundColor:c.card,borderColor:c.border}]}><Text style={[styles.sectionTitle,{color:c.foreground}]}>{title}</Text><Text style={[styles.helper,{color:c.mutedForeground}]}>اضغط على الصيغة المناسبة، ويمكنك تعديلها بعد الاختيار.</Text>{values.map((value,index)=><Pressable key={`${title}-${index}`} onPress={()=>setter(value)} style={[styles.option,{backgroundColor:selected===value?c.secondary:c.background,borderColor:selected===value?c.primary:c.border}]}><View style={[styles.optionBadge,{backgroundColor:selected===value?c.primary:c.secondary}]}><Text style={[styles.optionBadgeText,{color:selected===value?c.primaryForeground:c.primary}]}>{index+1}</Text></View><Text style={[styles.optionText,{color:c.foreground}]}>{value}</Text></Pressable>)}</View> : null;

  return <View style={[styles.page,{backgroundColor:c.background}]}><View style={[styles.header,{paddingTop:insets.top+10,borderBottomColor:c.border}]}><Pressable onPress={()=>router.back()} style={styles.back}><Feather name="arrow-right" size={23} color={c.foreground}/></Pressable><View style={styles.headerText}><Text style={[styles.title,{color:c.foreground}]}>المساعد الذكي للزيارة</Text><Text style={[styles.subtitle,{color:c.mutedForeground}]}>اقتراحات متعددة يختار منها المشرف</Text></View><View style={[styles.iconBox,{backgroundColor:c.secondary}]}><Feather name="cpu" size={22} color={c.primary}/></View></View>
  <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{padding:15,paddingBottom:insets.bottom+35}}>
    <View style={[styles.infoCard,{backgroundColor:c.card,borderColor:c.border}]}><Text style={[styles.infoLabel,{color:c.mutedForeground}]}>المدرسة</Text><Text style={[styles.infoValue,{color:c.foreground}]}>{schoolName}</Text><Text style={[styles.historyHint,{color:c.mutedForeground}]}>الزيارات السابقة المتاحة للسياق المهني: {previousVisits.length}</Text></View>
    <View style={[styles.notice,{backgroundColor:c.secondary}]}><Feather name="info" size={19} color={c.primary}/><Text style={[styles.noticeText,{color:c.secondaryForeground}]}>الصورة ليست مطلوبة لاستخدام المساعد. اكتب ما اتخذته فعليًا أولًا؛ المساعد لا يخترع إجراءات، بل يساعدك على تحسين صياغتها ويقترح عدة خيارات للتوصيات والمتابعة. يمكنك إرفاق صورة السجل لاحقًا من صفحة الزيارة للتوثيق.</Text></View>
    <View style={[styles.card,{backgroundColor:c.card,borderColor:c.border}]}><Text style={[styles.sectionTitle,{color:c.foreground}]}>نوع الزيارة</Text><TextInput value={visitType} onChangeText={setVisitType} placeholder="اكتب نوع الزيارة..." placeholderTextColor={c.mutedForeground} style={[styles.input,{color:c.foreground,borderColor:c.border,backgroundColor:c.background}]} textAlign="right"/></View>
    <View style={[styles.card,{backgroundColor:c.card,borderColor:c.border}]}><Text style={[styles.sectionTitle,{color:c.foreground}]}>الإجراءات المتخذة فعليًا</Text><Text style={[styles.helper,{color:c.mutedForeground}]}>اكتب ما قمت به فعلًا، حتى لو كان مختصرًا. لا يضيف المساعد إجراءً لم تذكره.</Text><TextInput value={actions} onChangeText={setActions} placeholder="مثال: تمت مراجعة سجل الخطة ومناقشة آلية تنفيذها..." placeholderTextColor={c.mutedForeground} style={[styles.textArea,{color:c.foreground,borderColor:c.border,backgroundColor:c.background}]} multiline textAlign="right" textAlignVertical="top"/></View>
    {optionList('خيارات صياغة الإجراءات',options.actionsOptions,actions,setActions)}
    <View style={[styles.card,{backgroundColor:c.card,borderColor:c.border}]}><Text style={[styles.sectionTitle,{color:c.foreground}]}>التوصيات</Text><Text style={[styles.helper,{color:c.mutedForeground}]}>يمكن تركها فارغة ليقترح المساعد عدة توصيات مهنية قابلة للاختيار والتعديل.</Text><TextInput value={recommendations} onChangeText={setRecommendations} placeholder="اكتب توصية أو اتركها للمقترحات..." placeholderTextColor={c.mutedForeground} style={[styles.textArea,{color:c.foreground,borderColor:c.border,backgroundColor:c.background}]} multiline textAlign="right" textAlignVertical="top"/></View>
    {optionList('خيارات التوصيات',options.recommendationsOptions,recommendations,setRecommendations)}
    <View style={[styles.card,{backgroundColor:c.card,borderColor:c.border}]}><Text style={[styles.sectionTitle,{color:c.foreground}]}>المتابعة</Text><Text style={[styles.helper,{color:c.mutedForeground}]}>يمكن تركها فارغة ليقترح المساعد عدة صيغ للمتابعة.</Text><TextInput value={followUp} onChangeText={setFollowUp} placeholder="اكتب متابعة أو اتركها للمقترحات..." placeholderTextColor={c.mutedForeground} style={[styles.textArea,{color:c.foreground,borderColor:c.border,backgroundColor:c.background}]} multiline textAlign="right" textAlignVertical="top"/></View>
    {optionList('خيارات المتابعة',options.followUpOptions,followUp,setFollowUp)}
    {message?<View style={[styles.message,{backgroundColor:error?c.destructive:c.secondary}]}><Feather name={error?'alert-circle':'check-circle'} size={17} color={error?'#FFF':c.primary}/><Text style={[styles.messageText,{color:error?'#FFF':c.foreground}]}>{message}</Text></View>:null}
    <Pressable onPress={createSuggestions} disabled={loading} style={[styles.analyze,{backgroundColor:c.navy,opacity:loading?.7:1}]}>{loading?<ActivityIndicator color="#FFF"/>:<Feather name="zap" size={20} color={c.accent}/>}<Text style={styles.analyzeText}>{loading?'جاري إعداد عدة اقتراحات...':'إنشاء اقتراحات متعددة'}</Text></Pressable>
    <Pressable onPress={approve} style={[styles.approve,{backgroundColor:c.primary}]}><Feather name="check" size={20} color={c.primaryForeground}/><Text style={[styles.approveText,{color:c.primaryForeground}]}>اعتماد الاختيارات ونقلها إلى الزيارة</Text></Pressable>
  </ScrollView></View>;
}
const styles=StyleSheet.create({page:{flex:1},header:{flexDirection:'row-reverse',alignItems:'center',justifyContent:'space-between',paddingHorizontal:14,paddingBottom:14,borderBottomWidth:1},back:{width:36,height:36,alignItems:'center',justifyContent:'center'},headerText:{flex:1,alignItems:'flex-end'},title:{fontFamily:'Inter_700Bold',fontSize:20,textAlign:'right'},subtitle:{fontFamily:'Inter_400Regular',fontSize:10,marginTop:3,textAlign:'right'},iconBox:{width:46,height:46,borderRadius:14,alignItems:'center',justifyContent:'center'},infoCard:{borderWidth:1,borderRadius:17,padding:14,marginBottom:12},infoLabel:{fontFamily:'Inter_500Medium',fontSize:10,textAlign:'right'},infoValue:{fontFamily:'Inter_700Bold',fontSize:13,textAlign:'right',marginTop:5},historyHint:{fontFamily:'Inter_400Regular',fontSize:10,textAlign:'right',marginTop:8},notice:{borderRadius:15,padding:13,flexDirection:'row-reverse',alignItems:'flex-start',gap:9,marginBottom:12},noticeText:{flex:1,fontFamily:'Inter_500Medium',fontSize:11,lineHeight:19,textAlign:'right'},card:{borderWidth:1,borderRadius:17,padding:14,marginBottom:12},sectionTitle:{fontFamily:'Inter_700Bold',fontSize:15,textAlign:'right'},helper:{fontFamily:'Inter_400Regular',fontSize:10,lineHeight:18,textAlign:'right',marginTop:6},input:{minHeight:48,borderWidth:1,borderRadius:13,paddingHorizontal:12,paddingVertical:10,marginTop:12,fontFamily:'Inter_500Medium',fontSize:12},textArea:{minHeight:90,borderWidth:1,borderRadius:13,paddingHorizontal:12,paddingVertical:12,marginTop:10,fontFamily:'Inter_500Medium',fontSize:12,lineHeight:21},optionsCard:{borderWidth:1,borderRadius:17,padding:14,marginBottom:12},option:{borderWidth:1,borderRadius:13,padding:10,marginTop:9,flexDirection:'row-reverse',alignItems:'flex-start',gap:9},optionBadge:{width:27,height:27,borderRadius:9,alignItems:'center',justifyContent:'center'},optionBadgeText:{fontFamily:'Inter_700Bold',fontSize:11},optionText:{flex:1,fontFamily:'Inter_500Medium',fontSize:11,lineHeight:20,textAlign:'right'},message:{borderRadius:13,padding:11,flexDirection:'row-reverse',alignItems:'flex-start',gap:7,marginBottom:12},messageText:{flex:1,fontFamily:'Inter_500Medium',fontSize:10,lineHeight:18},analyze:{minHeight:52,borderRadius:15,alignItems:'center',justifyContent:'center',flexDirection:'row-reverse',gap:8},analyzeText:{color:'#FFF',fontFamily:'Inter_700Bold',fontSize:12},approve:{minHeight:52,borderRadius:15,alignItems:'center',justifyContent:'center',flexDirection:'row-reverse',gap:8,marginTop:10},approveText:{fontFamily:'Inter_700Bold',fontSize:12}});
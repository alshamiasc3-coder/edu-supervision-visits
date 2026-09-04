import React, { useState } from 'react';
import { Image, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { Feather } from '@expo/vector-icons';

type Props = { uri: string };
const AnimatedImage = Animated.createAnimatedComponent(Image);

export function ZoomableImage({ uri }: Props) {
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translationX = useSharedValue(0);
  const translationY = useSharedValue(0);
  const startX = useSharedValue(0);
  const startY = useSharedValue(0);
  const [zoomText, setZoomText] = useState(100);

  const updateZoomText = (value: number) => setZoomText(Math.round(value * 100));

  const pinch = Gesture.Pinch()
    .onStart(() => { savedScale.value = scale.value; })
    .onUpdate((event) => { scale.value = Math.min(5, Math.max(1, savedScale.value * event.scale)); })
    .onEnd(() => {
      if (scale.value <= 1.01) { scale.value = 1; translationX.value = 0; translationY.value = 0; }
      runOnJS(updateZoomText)(scale.value);
    });

  const pan = Gesture.Pan()
    .maxPointers(1)
    .minDistance(1)
    .onStart(() => { startX.value = translationX.value; startY.value = translationY.value; })
    .onUpdate((event) => {
      if (scale.value > 1.01) {
        translationX.value = startX.value + event.translationX;
        translationY.value = startY.value + event.translationY;
      }
    });

  const gesture = Gesture.Simultaneous(pinch, pan);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ translateX: translationX.value }, { translateY: translationY.value }, { scale: scale.value }] }));

  const changeZoom = (delta: number) => {
    const next = Math.max(1, Math.min(5, Number((scale.value + delta).toFixed(2))));
    scale.value = next;
    if (next === 1) { translationX.value = 0; translationY.value = 0; }
    setZoomText(Math.round(next * 100));
  };

  const reset = () => { scale.value = 1; savedScale.value = 1; translationX.value = 0; translationY.value = 0; setZoomText(100); };

  return (
    <GestureHandlerRootView style={styles.root}>
      <GestureDetector gesture={gesture}>
        <View collapsable={false} style={[styles.imageArea, Platform.OS === 'web' ? styles.webTouchArea : undefined]}>
          <AnimatedImage source={{ uri }} resizeMode="contain" style={[styles.image, animatedStyle]} />
        </View>
      </GestureDetector>
      <View pointerEvents="none" style={styles.hint}><Feather name="move" size={14} color="#FFFFFF" /><Text style={styles.hintText}>قرّب إصبعين للتكبير • اسحب بإصبع واحد للتحريك</Text></View>
      <View style={[styles.controls, { bottom: Platform.OS === 'web' ? 0 : 20 }]}>
        <Pressable onPress={() => changeZoom(0.25)} style={styles.button}><Feather name="plus" size={22} color="#FFFFFF" /></Pressable>
        <Text style={styles.zoomText}>{zoomText}%</Text>
        <Pressable onPress={() => changeZoom(-0.25)} style={styles.button}><Feather name="minus" size={22} color="#FFFFFF" /></Pressable>
        <Pressable onPress={reset} style={styles.resetButton}><Text style={styles.resetText}>إعادة</Text></Pressable>
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root:{width:'100%',height:'100%',alignItems:'center',justifyContent:'center'},
  imageArea:{width:'100%',height:'100%',alignItems:'center',justifyContent:'center',overflow:'hidden'},
  webTouchArea:{touchAction:'none' as any,userSelect:'none' as any},
  image:{width:'92%',height:'92%'},
  hint:{position:'absolute',top:18,alignSelf:'center',flexDirection:'row-reverse',alignItems:'center',gap:6,paddingHorizontal:12,paddingVertical:8,borderRadius:12,backgroundColor:'rgba(255,255,255,0.12)'},
  hintText:{color:'#FFFFFF',fontFamily:'Inter_400Regular',fontSize:10},
  controls:{position:'absolute',flexDirection:'row',alignItems:'center',gap:10},
  button:{width:43,height:43,borderRadius:13,backgroundColor:'rgba(255,255,255,0.15)',alignItems:'center',justifyContent:'center'},
  resetButton:{height:43,borderRadius:13,paddingHorizontal:13,backgroundColor:'rgba(255,255,255,0.15)',alignItems:'center',justifyContent:'center'},
  zoomText:{color:'#FFFFFF',fontFamily:'Inter_700Bold',fontSize:13,minWidth:52,textAlign:'center'},
  resetText:{color:'#FFFFFF',fontFamily:'Inter_600SemiBold',fontSize:13},
});
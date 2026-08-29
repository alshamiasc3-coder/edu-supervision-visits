from pathlib import Path
import re


def replace_once(path: str, old: str, new: str):
    p = Path(path)
    text = p.read_text(encoding='utf-8')
    if old not in text:
        raise RuntimeError(f'Pattern not found in {path}: {old[:120]!r}')
    p.write_text(text.replace(old, new, 1), encoding='utf-8')


# Preserve legacy single-photo data and add multiple visit photos.
replace_once(
    'context/AppContext.tsx',
    '  photoUri?: string;\n};',
    '  photoUri?: string;\n  photoUris?: string[];\n};',
)
replace_once(
    'context/AppContext.tsx',
    '                photoUri:\n                  visit.photoUri\n                    ? String(\n                        visit.photoUri\n                      )\n                    : undefined,',
    '                photoUri:\n                  visit.photoUri\n                    ? String(\n                        visit.photoUri\n                      )\n                    : undefined,\n\n                photoUris:\n                  Array.isArray(visit.photoUris)\n                    ? visit.photoUris.map((item: any) => String(item))\n                    : visit.photoUri\n                      ? [String(visit.photoUri)]\n                      : [],',
)

# Keyboard-safe visit entry and multiple record photos.
replace_once(
    'app/visit-form.tsx',
    '  Image,\n  Pressable,',
    '  Image,\n  KeyboardAvoidingView,\n  Platform,\n  Pressable,',
)
replace_once(
    'app/visit-form.tsx',
    '''  const [\n    photoUri,\n    setPhotoUri,\n  ] = useState<\n    string | undefined\n  >(undefined);''',
    '''  const [photoUri, setPhotoUri] = useState<string | undefined>(undefined);\n\n  const [photoUris, setPhotoUris] = useState<string[]>([]);''',
)
replace_once(
    'app/visit-form.tsx',
    '''    setPhotoUri(\n      existingVisit.photoUri\n    );''',
    '''    setPhotoUri(existingVisit.photoUri);\n    setPhotoUris(\n      Array.isArray((existingVisit as any).photoUris)\n        ? (existingVisit as any).photoUris\n        : existingVisit.photoUri\n          ? [existingVisit.photoUri]\n          : []\n    );''',
)
replace_once(
    'app/visit-form.tsx',
    '''          setPhotoUri(\n            result.assets[0].uri\n          );\n\n          clearMessage();''',
    '''          const uri = result.assets[0].uri;\n          setPhotoUri(uri);\n          setPhotoUris((current) =>\n            current.includes(uri) ? current : [...current, uri]\n          );\n\n          clearMessage();''',
)
replace_once(
    'app/visit-form.tsx',
    '''          photoUri:\n            photoUri,''',
    '''          photoUri:\n            photoUris[0] || photoUri,\n\n          photoUris:''',
)
# The replacement above intentionally leaves the value expression on the next line.
replace_once(
    'app/visit-form.tsx',
    '''          photoUris:\n\n          status:''',
    '''          photoUris:\n            photoUris,\n\n          status:''',
)

# Keep the form above the Android keyboard.
replace_once(
    'app/visit-form.tsx',
    '''      <ScrollView\n        showsVerticalScrollIndicator={false}''',
    '''      <KeyboardAvoidingView\n        style={{ flex: 1 }}\n        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}\n      >\n        <ScrollView\n        showsVerticalScrollIndicator={false}''',
)
replace_once(
    'app/visit-form.tsx',
    '''      </ScrollView>\n    </View>\n  );''',
    '''        </ScrollView>\n      </KeyboardAvoidingView>\n    </View>\n  );''',
)

# Make the latest-visit card open its details directly.
replace_once(
    'app/visit-form.tsx',
    '''          <View\n            style={[\n              styles.previousVisitCard,''',
    '''          <Pressable\n            onPress={() =>\n              latestVisit &&\n              router.push({\n                pathname: '/visit-details',\n                params: { visitId: String(latestVisit.id) },\n              })\n            }\n            disabled={!latestVisit}\n            style={[\n              styles.previousVisitCard,''',
)
replace_once(
    'app/visit-form.tsx',
    '''            )}\n          </View>\n        ) : null}\n\n        {/* نوع الزيارة */}''',
    '''            )}\n          </Pressable>\n        ) : null}\n\n        {/* نوع الزيارة */}''',
)

# Replace the old single-photo preview with a multi-photo strip.
p = Path('app/visit-form.tsx')
s = p.read_text(encoding='utf-8')
pattern = re.compile(
    r"        /\* الصورة \*/\n\n        \{photoUri \? \(.*?        \) : null\}\n\n        /\* الرسالة \*/",
    re.S,
)
gallery = '''        {/* الصور المرفقة */}\n\n        {photoUris.length > 0 ? (\n          <View>\n            <Text style={[styles.label, { color: c.foreground }]}>صور سجل الزيارة ({photoUris.length})</Text>\n            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 4 }}>\n              {photoUris.map((uri, index) => (\n                <Pressable\n                  key={`${uri}-${index}`}\n                  onPress={() =>\n                    router.push({\n                      pathname: '/image-viewer',\n                      params: { uri, title: `صورة السجل ${index + 1}` },\n                    })\n                  }\n                  style={styles.photoThumbWrap}\n                >\n                  <Image source={{ uri }} style={styles.photoThumb} resizeMode="cover" />\n                  <View style={styles.photoIndex}>\n                    <Text style={styles.photoIndexText}>{index + 1}</Text>\n                  </View>\n                </Pressable>\n              ))}\n            </ScrollView>\n            <Pressable\n              onPress={takePhoto}\n              style={[styles.addPhotoButton, { backgroundColor: c.secondary, borderColor: c.border }]}\n            >\n              <Feather name="camera" size={18} color={c.primary} />\n              <Text style={[styles.addPhotoText, { color: c.primary }]}>إضافة صورة أخرى</Text>\n            </Pressable>\n          </View>\n        ) : null}\n\n        {/* الرسالة */}'''
if not pattern.search(s):
    raise RuntimeError('single photo block not found')
s = pattern.sub(gallery, s, count=1)
style_anchor = "    camera: {"
style_insert = '''    photoThumbWrap: { width: 92, height: 118, borderRadius: 12, overflow: 'hidden', position: 'relative', borderWidth: 1, borderColor: '#D6E9F0' },\n    photoThumb: { width: '100%', height: '100%' },\n    photoIndex: { position: 'absolute', left: 5, bottom: 5, minWidth: 24, height: 24, borderRadius: 8, backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center' },\n    photoIndexText: { color: '#FFFFFF', fontFamily: 'Inter_700Bold', fontSize: 10 },\n    addPhotoButton: { marginTop: 8, minHeight: 44, borderRadius: 12, borderWidth: 1, flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: 7 },\n    addPhotoText: { fontFamily: 'Inter_600SemiBold', fontSize: 12 },\n\n    camera: {'''
if style_anchor not in s:
    raise RuntimeError('camera style anchor not found')
s = s.replace(style_anchor, style_insert, 1)
p.write_text(s, encoding='utf-8')

print('v3 patch prepared successfully')

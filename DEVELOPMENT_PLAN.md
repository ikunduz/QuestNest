# QuestNest - Geliştirme Planı

> **Bu dosya bir AI agent tarafından okunmak ve uygulanmak üzere hazırlanmıştır.**
> Tarih: 2026-01-01
> 
> **Uygulama Adı**: QuestNest
> **Tagline**: "Where Little Heroes Grow"
> **Varsayılan Dil**: İngilizce (i18n ile çoklu dil: Türkçe öncelikli)

---

## PROJE DURUMU

**QuestNest** bir Expo/React Native çocuk görev takip uygulamasıdır. Şu an **sadece yerel (tek cihaz)** olarak çalışıyor. Hedef: **Supabase ile çoklu cihaz senkronizasyonu** eklemek.

---

## KRİTİK SORUNLAR (ÖNCELİKLİ)

### 1. GÜVENLİK AÇIĞI
- `App.tsx` satır 125-138: Rol değiştirme hiçbir koruma olmadan yapılabiliyor
- Çocuklar ebeveyn moduna geçebiliyor
- **ÇÖZÜM**: PIN sistemi ekle

### 2. TAILWIND RENK BUGU
- `constants.tsx`: `bg-rose-500` gibi Tailwind class'ları React Native'de çalışmıyor
- `ParentDashboard.tsx` ve `ChildDashboard.tsx`'de hatalı renk dönüşümü var
- **ÇÖZÜM**: HEX renklere dönüştür:
```tsx
// constants.tsx - DEĞİŞTİR
care: { color: '#f43f5e' },    // bg-rose-500 yerine
study: { color: '#3b82f6' },   // bg-blue-500 yerine
clean: { color: '#10b981' },   // bg-emerald-500 yerine
magic: { color: '#f59e0b' },   // bg-amber-500 yerine
```

### 3. HARDCODED DEĞERLER
- `App.tsx` satır 19: `name: 'Kuzey'` hardcoded
- **ÇÖZÜM**: Dinamik kullanıcı sistemi

---

## MİMARİ DEĞİŞİKLİK

```
MEVCUT (YANLIŞ)              HEDEF (DOĞRU)
┌──────────┐                 ┌────────────────────┐
│ Cihaz 1  │ Bağlantı yok   │   SUPABASE CLOUD   │
│AsyncStore│                 │  • Realtime DB     │
└──────────┘                 │  • Authentication  │
                             │  • Edge Functions  │
┌──────────┐                 └─────────┬──────────┘
│ Cihaz 2  │ Bağlantı yok       ┌─────┴─────┐
│AsyncStore│                 ┌──┴──┐   ┌──┴──┐   ┌──┴──┐
└──────────┘                 │Çocuk│◄─►│Baba │◄─►│Anne │
                             └─────┘   └─────┘   └─────┘
```

---

## SUPABASE KURULUMU

### 1. Hesap Oluştur
- https://supabase.com → Sign Up (ücretsiz)
- Yeni proje oluştur

### 2. Veritabanı Tabloları (SQL Editor'da çalıştır)

```sql
-- 1. Aileler tablosu
CREATE TABLE families (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  family_code TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Kullanıcılar tablosu
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID REFERENCES families(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  role TEXT CHECK (role IN ('parent', 'child')) NOT NULL,
  parent_type TEXT CHECK (parent_type IN ('mom', 'dad', null)),
  pin_hash TEXT,
  hero_class TEXT CHECK (hero_class IN ('knight', 'mage', 'ranger')),
  xp INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  streak INTEGER DEFAULT 0,
  avatar_url TEXT,
  push_token TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Görevler tablosu
CREATE TABLE quests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID REFERENCES families(id) ON DELETE CASCADE,
  assigned_to UUID REFERENCES users(id),
  title TEXT NOT NULL,
  description TEXT,
  xp_reward INTEGER DEFAULT 25,
  category TEXT CHECK (category IN ('care', 'study', 'clean', 'magic')),
  status TEXT CHECK (status IN ('active', 'pending_approval', 'completed')) DEFAULT 'active',
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- 4. Ödüller tablosu
CREATE TABLE rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID REFERENCES families(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  cost INTEGER NOT NULL,
  type TEXT CHECK (type IN ('real', 'digital')) DEFAULT 'real',
  icon TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Ödül talepleri
CREATE TABLE reward_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reward_id UUID REFERENCES rewards(id),
  claimed_by UUID REFERENCES users(id),
  status TEXT CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Row Level Security
ALTER TABLE families ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE quests ENABLE ROW LEVEL SECURITY;
ALTER TABLE rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE reward_claims ENABLE ROW LEVEL SECURITY;
```

### 3. API Anahtarlarını Al
- Project Settings → API → `anon` public key ve `URL` al
- `.env.local` dosyasına ekle:
```env
EXPO_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJxxxxxxxxx
```

---

## OLUŞTURULMASI GEREKEN YENİ DOSYALAR

### services/supabaseClient.ts
```typescript
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
```

### services/familyService.ts
```typescript
import { supabase } from './supabaseClient';

// Aile kodu üret (ISIM-XXXX formatında)
export const generateFamilyCode = (childName: string): string => {
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${childName.toUpperCase()}-${random}`;
};

// Aile oluştur
export const createFamily = async (familyName: string, childName: string) => {
  const familyCode = generateFamilyCode(childName);
  
  const { data: family, error } = await supabase
    .from('families')
    .insert({ name: familyName, family_code: familyCode })
    .select()
    .single();
    
  if (error) throw error;
  return { family, familyCode };
};

// Aile koduna göre bul
export const findFamilyByCode = async (code: string) => {
  const { data, error } = await supabase
    .from('families')
    .select('*')
    .eq('family_code', code.toUpperCase())
    .single();
    
  if (error) throw error;
  return data;
};
```

### services/questService.ts
```typescript
import { supabase } from './supabaseClient';

// Görevleri dinle (realtime)
export const subscribeToQuests = (familyId: string, callback: (quests: any[]) => void) => {
  return supabase
    .channel('quests')
    .on('postgres_changes', 
      { event: '*', schema: 'public', table: 'quests', filter: `family_id=eq.${familyId}` },
      (payload) => {
        // Yeni veri geldiğinde tüm görevleri çek
        fetchQuests(familyId).then(callback);
      }
    )
    .subscribe();
};

// Görevleri çek
export const fetchQuests = async (familyId: string) => {
  const { data, error } = await supabase
    .from('quests')
    .select('*')
    .eq('family_id', familyId)
    .order('created_at', { ascending: false });
    
  if (error) throw error;
  return data;
};

// Görev ekle
export const addQuest = async (quest: any) => {
  const { data, error } = await supabase
    .from('quests')
    .insert(quest)
    .select()
    .single();
    
  if (error) throw error;
  return data;
};

// Görev durumunu güncelle
export const updateQuestStatus = async (questId: string, status: string) => {
  const { error } = await supabase
    .from('quests')
    .update({ status, completed_at: status === 'completed' ? new Date().toISOString() : null })
    .eq('id', questId);
    
  if (error) throw error;
};
```

### views/WelcomeScreen.tsx
```typescript
// İlk açılış ekranı
// "Aile Oluştur" ve "Aileye Katıl" butonları
// Aile oluşturma: ebeveyn adı, çocuk adı, 4 haneli PIN
// Aileye katılma: aile kodu girişi
```

### views/PinEntryScreen.tsx
```typescript
// Ebeveyn moduna geçiş için PIN ekranı
// 4 haneli sayısal keypad
// 3 yanlış denemede kilitle
```

---

## MEVCUT DOSYA DEĞİŞİKLİKLERİ

### constants.tsx
```diff
- color: 'bg-rose-500',
+ color: '#f43f5e',

- color: 'bg-blue-500',
+ color: '#3b82f6',

- color: 'bg-emerald-500',
+ color: '#10b981',

- color: 'bg-amber-500',
+ color: '#f59e0b',
```

### App.tsx
1. AsyncStorage yerine Supabase kullan
2. Rol değiştirmede PIN kontrolü ekle
3. React Navigation ekle
4. Realtime subscription ekle

### ParentDashboard.tsx
1. Çocuk seçimi dropdown ekle
2. Ödül yönetimi ekle

---

## KURULACAK PAKETLER

```bash
npm install @supabase/supabase-js @react-navigation/native @react-navigation/native-stack react-native-screens react-native-safe-area-context expo-notifications expo-device expo-image-picker expo-crypto
```

---

## TEST PROSEDÜRLERI

### Test 1: Aile Oluşturma
1. Uygulamayı aç → "Aile Oluştur"
2. Aile adı gir → PIN belirle
3. Çocuk ekle
4. Aile kodu görünmeli

### Test 2: Senkronizasyon
1. Baba telefonunda görev ekle
2. 10 saniye içinde çocuk tabletinde görünmeli

### Test 3: PIN Güvenliği
1. Çocuk modundan ebeveyn moduna geç
2. PIN ekranı açılmalı
3. Yanlış PIN → Hata mesajı

---

## YENİ ÖZELLİK: AİLE NOTLARI (Family Notes) 🎙️

### Konsept
Çocuklar aileye sesli veya yazılı not bırakabilir. WhatsApp'tan farklı olarak bu, uygulama temasına uygun, sıcak bir aile içi iletişim.

### Veritabanı Tablosu
```sql
CREATE TABLE family_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID REFERENCES families(id) ON DELETE CASCADE,
  from_user UUID REFERENCES users(id),
  to_user UUID REFERENCES users(id), -- NULL = herkese
  note_type TEXT CHECK (note_type IN ('text', 'voice')) NOT NULL,
  content TEXT, -- Yazılı not için
  audio_url TEXT, -- Sesli not için (Supabase Storage)
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Yeni Dosyalar
- `views/FamilyNotesScreen.tsx` - Not listesi
- `components/VoiceRecorder.tsx` - Ses kaydedici
- `components/NoteCard.tsx` - Not kartı
- `services/notesService.ts` - Not CRUD

### Gerekli Paketler
```bash
npm install expo-av  # Ses kayıt/oynatma
```

### Özellikler
- 🎙️ Sesli not kaydet (max 30 saniye)
- ✍️ Yazılı not bırak
- 👨‍👩‍👧 Herkese veya belirli kişiye gönder
- 🔔 Yeni not bildirimi
- ❤️ Ebeveynden "Aferin" gibi ön tanımlı notlar

---

## DOSYA YAPISI (HEDEF)

```
/QuestNest
├── App.tsx                    (MODIFY - navigation, supabase)
├── constants.tsx              (MODIFY - HEX colors)
├── types.ts                   (MODIFY - new types)
├── /services
│   ├── geminiService.ts       (KEEP)
│   ├── supabaseClient.ts      (NEW)
│   ├── familyService.ts       (NEW)
│   ├── questService.ts        (NEW)
│   ├── notesService.ts        (NEW) ⬅️ Aile Notları
│   └── notificationService.ts (NEW)
├── /views
│   ├── ChildDashboard.tsx     (MODIFY)
│   ├── ParentDashboard.tsx    (MODIFY)
│   ├── TreasureRoom.tsx       (MODIFY)
│   ├── FamilyNotesScreen.tsx  (NEW) ⬅️ Aile Notları
│   ├── WelcomeScreen.tsx      (NEW)
│   ├── PinEntryScreen.tsx     (NEW)
│   ├── FamilySetupScreen.tsx  (NEW)
│   ├── JoinFamilyScreen.tsx   (NEW)
│   └── SettingsScreen.tsx     (NEW)
├── /components
│   ├── GameButton.tsx         (KEEP)
│   ├── XPBar.tsx              (KEEP)
│   ├── VoiceRecorder.tsx      (NEW) ⬅️ Ses Kaydedici
│   └── NoteCard.tsx           (NEW) ⬅️ Not Kartı
└── /i18n                       (NEW) ⬅️ Çoklu Dil
    ├── en.json
    └── tr.json
```

---

## SUPABASE ÜCRETSİZ PLAN LİMİTLERİ

| Özellik | Limit | Bu Uygulama İçin |
|---------|-------|------------------|
| Veritabanı | 500 MB | ✅ Yeterli (~5 MB) |
| Aktif Kullanıcı | 50,000/ay | ✅ Yeterli (3-5) |
| Realtime | 200 bağlantı | ✅ Yeterli |
| API | Sınırsız | ✅ |
| İnaktivite | 1 hafta sonra duraklama | ⚠️ Günlük kullanımda sorun yok |

---

## ÖNCELIK SIRASI

1. **ÖNCE**: `constants.tsx` renk düzeltmesi (5 dk)
2. **SONRA**: Supabase hesap & proje oluştur
3. **SONRA**: `supabaseClient.ts` dosyası
4. **SONRA**: Servis dosyaları
5. **SONRA**: Yeni ekranlar
6. **EN SON**: App.tsx değişiklikleri ve navigation

---

## NOTLAR

- Mevcut AsyncStorage verileri göç ettirilmeli (migration)
- Push notifications için Expo project ID gerekli
- iOS için ayrı Apple Developer hesabı gerekli (opsiyonel)

---

## UI TASARIM REHBERİ

### Renk Paleti
```
Ana Arkaplan:     #0f172a (koyu lacivert)
Kart Arkaplan:    #1e293b (slate-800)
Border:           #334155 (slate-700)
Altın Vurgu:      #fbbf24 (amber-400)
Mor Vurgu:        #818cf8 (indigo-400)
Ebeveyn Modu:     #6366f1 (indigo-500)
Başarı Yeşili:    #10b981 (emerald-500)
Hata Kırmızısı:   #f43f5e (rose-500)
```

### Tipografi
- Başlıklar: Bold, UPPERCASE, letterSpacing: 1
- Alt başlıklar: 10px, uppercase, #64748b
- Ana metin: 14-16px, #f1f5f9

### Görev Kategorisi Renkleri
```
care (bakım):   #f43f5e (pembe-kırmızı) + Heart ikonu
study (ders):   #3b82f6 (mavi) + BookOpen ikonu
clean (temizlik): #10b981 (yeşil) + Trash2 ikonu
magic (özel):   #f59e0b (turuncu) + Sparkles ikonu
```

---

## ÇOCUK ANA SAYFASI (ChildDashboard) - DETAYLI UI

### Ekran Yapısı (yukarıdan aşağıya)

#### 1. KAHRAMAN STATS KARTI
```
┌────────────────────────────────────────────────────────┐
│  ┌────────┐                                            │
│  │ AVATAR │  Kuzey                                     │
│  │ (64x64)│  ┌─────────────────┐                      │
│  │ altın  │  │ Işık Muhafızı   │  Seviye 5            │
│  │ border │  └─────────────────┘                      │
│  └────────┘                                            │
│                                                        │
│  SEVİYE 5                              85 / 100 XP    │
│  ████████████████████░░░░░░░░░░░░░░░░  (progress bar) │
└────────────────────────────────────────────────────────┘
```
- Avatar: 64x64, borderRadius: 16, border: 2px altın (#fbbf24)
- İsim: fontSize: 24, color: #fff, fontWeight: bold
- Sınıf rozeti: backgroundColor: rgba(251, 191, 36, 0.1), padding: 8px
- XP Bar: height: 16, borderRadius: 8, track: #1e293b, fill: #fbbf24

#### 2. BİLGENİN ÖĞÜDÜ (AI Wisdom Kartı)
```
┌────────────────────────────────────────────────────────┐
│ ◀ mor sol border (4px)                                │
│                                                        │
│   BİLGENİN ÖĞÜDÜ                                      │
│   "Görevlerini tamamlayan kahraman, zaferle taçlanır!"│
│                                                        │
└────────────────────────────────────────────────────────┘
```
- backgroundColor: #1e1b4b (çok koyu mor)
- borderLeftWidth: 4, borderLeftColor: #818cf8
- Başlık: fontSize: 10, color: #818cf8, fontWeight: bold
- İçerik: fontSize: 14, fontStyle: italic, color: #f1f5f9

#### 3. AKTİF GÖREVLER LİSTESİ
```
⚔️ AKTİF GÖREVLER

┌────────────────────────────────────────────────────────┐
│  ┌──────┐                                          ▶  │
│  │ 💗  │  Diş Fırçalama Ritüeli         +20 XP       │
│  │(ikon)│                                             │
│  └──────┘                                             │
└────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────┐
│  ┌──────┐                                          ▶  │
│  │ ✨   │  Oda Toplama Büyüsü            +50 XP       │
│  │(ikon)│                                             │
│  └──────┘                                             │
└────────────────────────────────────────────────────────┘
```
- Kart: backgroundColor: #1e293b, borderRadius: 24, padding: 16
- İkon kutusu: 48x48, borderRadius: 12, backgroundColor: #334155
- Görev başlığı: fontSize: 18, color: #fff, fontWeight: bold
- XP rozeti: fontSize: 12, color: #fbbf24, fontWeight: bold

#### 4. BOTTOM NAVIGATION BAR
```
┌────────────────────────────────────────────────────────┐
│                                                        │
│   ⚔️         🎁         💬         ⚙️                │
│ Maceracı   Hazine     Notlar     Ayarlar             │
│ (aktif)                                               │
│                                                        │
└────────────────────────────────────────────────────────┘
```
- height: 80, backgroundColor: #0f172a
- borderTopWidth: 4, borderTopColor: rgba(120, 53, 15, 0.3)
- borderTopLeftRadius: 24, borderTopRightRadius: 24
- Aktif ikon: color: #fbbf24
- Pasif ikon: color: #64748b
- Tab isimleri: fontSize: 10, fontWeight: bold, textTransform: uppercase

### Animasyonlar (Önerilen)
1. **Görev Tamamlama**: Konfeti patlaması (react-native-confetti-cannon)
2. **XP Kazanma**: XP bar'ında parıltı efekti
3. **Seviye Atlama**: Büyük kutlama animasyonu
4. **Lütuf Alma**: Ekran ortasında parlayan ⚡ ikonu

---

## AVATAR SİSTEMİ

### Konsept
Kullanıcılar **hazır avatar seçebilir** VEYA **kendi fotoğrafını çekebilir**. RPG temasına uygun, eğlenceli bir deneyim.

### Avatar Seçim Ekranı UI
```
┌─────────────────────────────────────────┐
│         KAHRAMAN PORTRESİ               │
│                                         │
│    ┌─────────────┐  ┌─────────────┐    │
│    │     📸      │  │     🎭      │    │
│    │  FOTOĞRAF   │  │   AVATAR    │    │
│    │     ÇEK     │  │     SEÇ     │    │
│    └─────────────┘  └─────────────┘    │
│                                         │
│    ────── AVATAR GALERİSİ ──────       │
│                                         │
│    ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐      │
│    │🧙│ │🛡️│ │🏹│ │👸│ │🤴│      │
│    └───┘ └───┘ └───┘ └───┘ └───┘      │
│    Büyücü Şövalye Okçu Prenses Prens   │
│                                         │
└─────────────────────────────────────────┘
```

### Çocuk Avatarları
| ID | Emoji | İsim | Açıklama |
|----|-------|------|----------|
| knight | 🛡️ | Şövalye | Kılıç ve kalkan |
| mage | 🧙 | Büyücü | Sihirli asa |
| ranger | 🏹 | Okçu | Yay ve ok |
| princess | 👸 | Prenses | Taç |
| prince | 🤴 | Prens | Taç |
| ninja | 🥷 | Ninja | Gizli savaşçı |
| dragon | 🐉 | Ejderha | Ateş saçan |
| unicorn | 🦄 | Unicorn | Büyülü at |

### Ebeveyn Avatarları
| ID | Emoji | İsim (Anne) | İsim (Baba) |
|----|-------|-------------|-------------|
| king_queen | 👑 | Kraliçe | Kral |
| wizard | 🧙‍♀️/🧙‍♂️ | Bilge Kadın | Bilge Adam |
| guardian | 🦸‍♀️/🦸‍♂️ | Koruyucu | Koruyucu |
| photo | 📸 | Fotoğraf | Fotoğraf |

### Veritabanı Güncellemesi
```sql
-- users tablosuna avatar_type alanı ekle
ALTER TABLE users ADD COLUMN avatar_type TEXT CHECK (avatar_type IN ('preset', 'photo')) DEFAULT 'preset';
ALTER TABLE users ADD COLUMN avatar_preset TEXT; -- 'knight', 'mage', vb.
-- avatar_url zaten var (fotoğraf için)
```

### Yeni Dosyalar
- `components/AvatarSelector.tsx` - Avatar seçim komponenti
- `components/AvatarDisplay.tsx` - Avatar gösterim komponenti
- `constants/avatars.ts` - Avatar listesi ve metadata

### constants/avatars.ts
```typescript
export const CHILD_AVATARS = [
  { id: 'knight', emoji: '🛡️', label: { en: 'Knight', tr: 'Şövalye' } },
  { id: 'mage', emoji: '🧙', label: { en: 'Mage', tr: 'Büyücü' } },
  { id: 'ranger', emoji: '🏹', label: { en: 'Ranger', tr: 'Okçu' } },
  { id: 'princess', emoji: '👸', label: { en: 'Princess', tr: 'Prenses' } },
  { id: 'prince', emoji: '🤴', label: { en: 'Prince', tr: 'Prens' } },
  { id: 'ninja', emoji: '🥷', label: { en: 'Ninja', tr: 'Ninja' } },
  { id: 'dragon', emoji: '🐉', label: { en: 'Dragon', tr: 'Ejderha' } },
  { id: 'unicorn', emoji: '🦄', label: { en: 'Unicorn', tr: 'Unicorn' } },
];

export const PARENT_AVATARS = {
  mom: [
    { id: 'queen', emoji: '👑', label: { en: 'Queen', tr: 'Kraliçe' } },
    { id: 'wizard_f', emoji: '🧙‍♀️', label: { en: 'Wise Woman', tr: 'Bilge Kadın' } },
    { id: 'guardian_f', emoji: '🦸‍♀️', label: { en: 'Guardian', tr: 'Koruyucu' } },
  ],
  dad: [
    { id: 'king', emoji: '👑', label: { en: 'King', tr: 'Kral' } },
    { id: 'wizard_m', emoji: '🧙‍♂️', label: { en: 'Wise Man', tr: 'Bilge Adam' } },
    { id: 'guardian_m', emoji: '🦸‍♂️', label: { en: 'Guardian', tr: 'Koruyucu' } },
  ],
};
```

### Avatar Gösterimi
```tsx
// AvatarDisplay.tsx kullanımı
<AvatarDisplay 
  type={user.avatar_type}      // 'preset' veya 'photo'
  preset={user.avatar_preset}  // 'knight', 'mage', vb.
  photoUrl={user.avatar_url}   // Fotoğraf URL'i
  size={64}
  borderColor="#fbbf24"
/>
```

### Ses Efektleri (Önerilen)
- Görev tamamlama: "ding" sesi
- XP kazanma: "coin" sesi
- Seviye atlama: "fanfare" sesi
- Buton tıklama: yumuşak "pop" sesi

---

## i18n ÇOKLU DİL YAPISI

### i18n/en.json (Varsayılan - İngilizce)
```json
{
  "app": {
    "name": "QuestNest",
    "tagline": "Where Little Heroes Grow"
  },
  "tabs": {
    "quests": "Quests",
    "treasure": "Treasure",
    "notes": "Notes",
    "settings": "Settings"
  },
  "child": {
    "level": "Level",
    "wisdom": "Wisdom of the Sage",
    "activeQuests": "Active Quests",
    "victory": "Victory!",
    "reportQuest": "Report Quest"
  },
  "parent": {
    "dashboard": "Sage Command",
    "queenControl": "Queen's Control",
    "kingControl": "King's Control",
    "addQuest": "New Quest",
    "approve": "Approve",
    "sendBlessing": "Send Blessing"
  },
  "categories": {
    "care": "Self Care",
    "study": "Study",
    "clean": "Cleaning",
    "magic": "Special Quest"
  }
}
```

### i18n/tr.json (Türkçe)
```json
{
  "app": {
    "name": "QuestNest",
    "tagline": "Küçük Kahramanların Büyüdüğü Yer"
  },
  "tabs": {
    "quests": "Görevler",
    "treasure": "Hazine",
    "notes": "Notlar",
    "settings": "Ayarlar"
  },
  "child": {
    "level": "Seviye",
    "wisdom": "Bilgenin Öğüdü",
    "activeQuests": "Aktif Görevler",
    "victory": "Zafer!",
    "reportQuest": "Görevi Bildir"
  },
  "parent": {
    "dashboard": "Bilge Kumandası",
    "queenControl": "Kraliçe Denetimi",
    "kingControl": "Kral Denetimi",
    "addQuest": "Yeni Emir",
    "approve": "Onayla",
    "sendBlessing": "Lütuf Gönder"
  },
  "categories": {
    "care": "Kişisel Bakım",
    "study": "Bilgelik Yolu",
    "clean": "Krallık Temizliği",
    "magic": "Özel Görev"
  }
}
```

### i18n Kurulum
```bash
npm install i18n-js expo-localization
```

### i18n/index.ts
```typescript
import { I18n } from 'i18n-js';
import * as Localization from 'expo-localization';
import en from './en.json';
import tr from './tr.json';

const i18n = new I18n({ en, tr });
i18n.locale = Localization.locale.split('-')[0]; // 'tr-TR' -> 'tr'
i18n.enableFallback = true;
i18n.defaultLocale = 'en';

export default i18n;
```

### Kullanım Örneği
```tsx
import i18n from '../i18n';

// Component içinde
<Text>{i18n.t('child.activeQuests')}</Text>
// Çıktı (TR): "Aktif Görevler"
// Çıktı (EN): "Active Quests"
```

---

## 🐉 SİHİRLİ YARATIK (Magical Companion) SİSTEMİ

### Konsept
Çocuğun kendi büyüttüğü, beslediği ve geliştirdiği bir sihirli yaratık. Görevler tamamlandıkça yaratık büyür ve evrilir. **Günlük mekanikler** ile bağlılık sağlanır.

### Yaratık Evrimi (5 Aşama)
```
🥚 Yumurta → 🐣 Yavru → 🐲 Genç → 🐉 Yetişkin → 👑 Efsanevi

Gün 1-3      Gün 4-10    Gün 11-20   Gün 21-40    Gün 40+
(3 görev)    (15 görev)  (30 görev)  (60 görev)   (100 görev)
```

---

## 🎨 TEMA SEÇİM SİSTEMİ (Kız & Erkek)

### Konsept
İlk açılışta çocuk kendi temasını seçer. Tema seçimi tüm uygulama görünümünü, yaratıkları ve yapıyı değiştirir.

### Tema Seçim Ekranı
```
┌─────────────────────────────────────────────────────────┐
│             ✨ KRALLIĞINI SEÇ! ✨                       │
│                                                         │
│   ┌─────────────┐       ┌─────────────┐                │
│   │     ⚔️      │       │     🧚      │                │
│   │   KAHRAMAN  │       │    PERİ     │                │
│   │  Şövalyeler │       │   Periler   │                │
│   │  Ejderhalar │       │  Kelebekler │                │
│   └─────────────┘       └─────────────┘                │
│                                                         │
│   ┌─────────────┐       ┌─────────────┐                │
│   │     🦄      │       │     🌊      │                │
│   │   BÜYÜLÜ    │       │   DENİZ     │                │
│   │  Unicornlar │       │  Deniz Kızı │                │
│   │  Anka Kuşu  │       │   Yunuslar  │                │
│   └─────────────┘       └─────────────┘                │
└─────────────────────────────────────────────────────────┘
```

### Tema Özellikleri
| Tema | Hedef | Yaratıklar | Yapı | Para | Renk Paleti |
|------|-------|------------|------|------|-------------|
| ⚔️ Kahraman | Erkek | Ejderha, Kurt | 🏰 Kale | 💰 Altın | Lacivert, Altın |
| 🧚 Peri | Kız | Peri, Kelebek, Kedi | 🌸 Bahçe | 💎 Kristal | Pembe, Mor |
| 🦄 Büyülü | Herkes | Unicorn, Anka | 🌳 Sihirli Orman | ⭐ Yıldız | Turkuaz, Mor |
| 🌊 Deniz | Herkes | Deniz Kızı, Yunus | 🐚 Sualtı Sarayı | 🐚 İnci | Mavi, Turkuaz |

### Tema Bazlı Görünüm Değişiklikleri

#### ⚔️ Kahraman Teması (Varsayılan)
- Arkaplan: #0f172a (Koyu lacivert)
- Vurgu: #fbbf24 (Altın)
- Yapı: Kale
- İkonlar: Kılıç, Kalkan, Taht

#### 🧚 Peri Teması
- Arkaplan: #1a1625 (Koyu mor)
- Vurgu: #f472b6 (Pembe)
- Yapı: Peri Bahçesi
- İkonlar: Çiçek, Kelebek, Yıldız

#### 🦄 Büyülü Teması
- Arkaplan: #0f1729 (Koyu mavi-mor)
- Vurgu: #a78bfa (Açık mor)
- Yapı: Sihirli Orman
- İkonlar: Gökkuşağı, Yıldız, Ay

#### 🌊 Deniz Teması
- Arkaplan: #0a1628 (Koyu deniz mavisi)
- Vurgu: #22d3ee (Turkuaz)
- Yapı: Sualtı Sarayı
- İkonlar: Deniz kabuğu, Dalga, Balık

---

## 🐾 GENİŞLETİLMİŞ YARATIK LİSTESİ

### Tüm Yaratıklar (Tema Bazlı)

#### ⚔️ Kahraman Yaratıkları
| Yaratık | Emoji | Evrim | Bonus |
|---------|-------|-------|-------|
| Ejderha | 🐉 | 🥚→🐣→🐲→🐉→👑🐉 | Temizlik +25% |
| Kurt | � | 🥚→🐕→🐺→❄️�→🌙� | Özel +25% |
| Anka Kuşu | 🔥 | 🥚→🐦→🦅→🔥🦅→🌟🦅 | Ders +25% |

#### 🧚 Peri Yaratıkları
| Yaratık | Emoji | Evrim | Bonus |
|---------|-------|-------|-------|
| Peri | 🧚 | ✨→🧚‍♀️→🧚→✨🧚→�🧚 | Bakım +25% |
| Kelebek | � | �→🦋→🌈🦋→✨🦋→👑� | Temizlik +25% |
| Sihirli Kedi | 🐱 | 🐱→😺→🐈→✨🐈→👑🐈 | Özel +25% |

#### � Büyülü Yaratıkları
| Yaratık | Emoji | Evrim | Bonus |
|---------|-------|-------|-------|
| Unicorn | 🦄 | 🥚→🐴→🦄→✨🦄→🌈🦄 | Bakım +25% |
| Anka | � | 🥚→🐦→🦅→🔥🦅→🌟🦅 | Ders +25% |
| Büyülü Baykuş | 🦉 | 🥚→🐣→🦉→✨🦉→👑🦉 | Ders +30% |

#### 🌊 Deniz Yaratıkları
| Yaratık | Emoji | Evrim | Bonus |
|---------|-------|-------|-------|
| Deniz Kızı | �‍♀️ | 🐚→🧜‍♀️→✨🧜‍♀️→👑�‍♀️ | Bakım +25% |
| Yunus | 🐬 | 🐟→🐬→✨🐬→🌊🐬→👑🐬 | Özel +25% |
| Deniz Atı | 🌊 | 🥚→🐴→�🐴→✨🐴→👑🐴 | Temizlik +25% |

---

## 👗 AVATAR KIYAFET SİSTEMİ (Dress-Up)

### Konsept
Avatarlar için kıyafet ve aksesuar satın alma/değiştirme sistemi. Özellikle kız çocuklarına hitap eder ama herkes kullanabilir.

### Kıyafet Dolabı UI
```
┌─────────────────────────────────────────────────────────┐
│              👗 KIYAFET DOLABI                          │
│                                                         │
│   ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐  │
│   │   👗    │  │   👑    │  │   👠    │  │   💍    │  │
│   │ ELBİSE  │  │   TAÇ   │  │AYAKKABI │  │AKSESUAR │  │
│   └─────────┘  └─────────┘  └─────────┘  └─────────┘  │
│                                                         │
│   ────── ELBİSELER ──────                              │
│                                                         │
│   ┌───┐  ┌───┐  ┌───┐  ┌───┐  ┌───┐                  │
│   │👗│  │👘│  │�│  │🎽│  │🔒│                  │
│   │100│  │150│  │200│  │50 │  │???│                  │
│   └───┘  └───┘  └───┘  └───┘  └───┘                  │
│                                                         │
│   🌟 YENİ! Prenses Elbisesi - 250 💎                   │
└─────────────────────────────────────────────────────────┘
```

### Kıyafet Kategorileri
| Kategori | Örnekler | Fiyat Aralığı |
|----------|----------|---------------|
| 👗 Elbise | Prenses, Savaşçı, Günlük | 100-300 |
| 👑 Başlık | Taç, Şapka, Kask | 50-200 |
| 👠 Ayakkabı | Bot, Topuklu, Pati | 50-150 |
| 💍 Aksesuar | Kolye, Bileklik, Kanatlar | 30-100 |
| ✨ Efekt | Parıltı, Işık halkası | 200-500 |

### Veritabanı
```sql
-- Kullanıcı temaları
ALTER TABLE users ADD COLUMN theme TEXT DEFAULT 'hero' 
  CHECK (theme IN ('hero', 'fairy', 'magical', 'ocean'));

-- Kıyafetler
CREATE TABLE user_outfits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  category TEXT CHECK (category IN ('dress', 'headwear', 'shoes', 'accessory', 'effect')),
  item_id TEXT NOT NULL,
  is_equipped BOOLEAN DEFAULT FALSE,
  purchased_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 🌸 PERİ BAHÇESİ (Kale Alternatifi)

### Kale vs Bahçe Karşılaştırması
| Özellik | 🏰 Kale | 🌸 Peri Bahçesi |
|---------|---------|-----------------|
| Yapı birimi | Oda | Alan/Köşe |
| İnşaat terimi | 🔨 İnşaat | 🌱 Yetiştirme |
| Para birimi | 💰 Altın | 💎 Kristal |
| Eşyalar | Mobilya, Silah | Çiçek, Fidan, Kelebek |
| Yükseltme | Oda aç | Bahçe genişlet |

### Bahçe Alanları
| Alan | Maliyet | Bekleme | Bonus |
|------|---------|---------|-------|
| 🌷 Çiçek Bahçesi | Ücretsiz | - | Başlangıç |
| 🏡 Ağaç Ev | 100 💎 | 1 saat | +5% XP |
| � Kelebek Köşesi | 250 💎 | 2 saat | Yaratık +Mutluluk |
| 🍄 Mantar Evi | 500 � | 4 saat | Günlük hediye+ |
| 🌈 Gökkuşağı Köprüsü | 750 � | 6 saat | Tüm bonuslar +3% |
| ⭐ Yıldız Havuzu | 1000 � | 12 saat | Nadir eşya şansı+ |
| 🌙 Ay Bahçesi | 1500 💎 | 24 saat | Gece bonusu |
| 👑 Kraliçe Tahtı | 2500 💎 | 48 saat | Tüm bonuslar +5% |

### Bahçe Eşyaları
| Kategori | Örnekler | Fiyat Aralığı |
|----------|----------|---------------|
| 🌸 Çiçekler | Gül, Papatya, Orkide | 30-100 💎 |
| 🌳 Ağaçlar | Kiraz, Söğüt, Sihirli | 100-300 💎 |
| 🦋 Canlılar | Kelebek, Uğur böceği | 50-150 💎 |
| ✨ Dekor | Peri ışıkları, Kristal | 100-400 💎 |
| 🧚 Heykeller | Peri, Unicorn heykeli | 200-500 � |

---

### Günlük Mekanikler

#### 1. Günlük Bakım Döngüsü
```
┌─────────────────────────────────────────────────────────┐
│              🐉 ZÜMRÜT (Ejderha)                        │
│              Seviye 5 • Genç                            │
│                                                         │
│   💚💚💚💚🤍  Mutluluk (80%)                           │
│   🍖🍖🍖🤍🤍  Tokluk (60%)                             │
│   💤💤💤💤🤍  Enerji (80%)                             │
│                                                         │
│   ┌───────────┐  ┌───────────┐  ┌───────────┐         │
│   │  🍖       │  │   🎮      │  │   💬      │         │
│   │  BESLE    │  │  OYNA     │  │  KONUŞ    │         │
│   │ (Hazır!)  │  │ (2 saat)  │  │ (Hazır!)  │         │
│   └───────────┘  └───────────┘  └───────────┘         │
│                                                         │
│   🎁 GÜNLÜK HEDİYE: 4 saat sonra açılacak              │
│   ████████████░░░░░░                                   │
└─────────────────────────────────────────────────────────┘
```

#### 2. Bekleme Süreleri (Timer System)
| Aksiyon | Bekleme | Ödül |
|---------|---------|------|
| Besle | Her 4 saat | +10 Mutluluk |
| Oyna | Her 2 saat | +5 Enerji, Yaratık XP |
| Konuş | Her 1 saat | AI bilgelik mesajı |
| Günlük Hediye | 24 saat | Rastgele ödül kutusu |

#### 3. Günlük Hediye Kutusu
```
┌─────────────────────────────────────────┐
│      🎁 GÜNLÜK HEDİYE HAZIR!           │
│                                         │
│      ┌─────────────────────┐           │
│      │    ✨ 🎁 ✨         │           │
│      │                     │           │
│      │    DOKUN VE AÇ      │           │
│      └─────────────────────┘           │
│                                         │
│      🔥 5 gün seri = MEGA HEDİYE!      │
└─────────────────────────────────────────┘
```

**Hediye İçerikleri:**
- 🪙 10-50 Altın
- ✨ Yaratık dekorasyonu
- 🍖 Özel yemek
- 🎨 Kale eşyası
- 💎 Nadir item (düşük şans)

### Yaratık Yetenekleri
Her yaratık türü görev kategorisine bonus verir:
| Yaratık | Bonus Kategori | Etki |
|---------|---------------|------|
| Ejderha | 🧹 Temizlik | +25% XP |
| Anka | 📚 Ders | +25% XP |
| Unicorn | 💗 Bakım | +25% XP |
| Kurt | ✨ Özel | +25% XP |

### Veritabanı
```sql
CREATE TABLE creatures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  creature_type TEXT CHECK (creature_type IN ('dragon', 'phoenix', 'unicorn', 'wolf')),
  name TEXT NOT NULL,
  stage INTEGER DEFAULT 1, -- 1-5 evrim aşaması
  xp INTEGER DEFAULT 0,
  happiness INTEGER DEFAULT 100,
  hunger INTEGER DEFAULT 100,
  energy INTEGER DEFAULT 100,
  last_fed_at TIMESTAMPTZ,
  last_played_at TIMESTAMPTZ,
  last_talked_at TIMESTAMPTZ,
  daily_gift_available_at TIMESTAMPTZ,
  streak_days INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 🏰 BENİM KALEM (My Castle) SİSTEMİ

### Konsept
Çocuğun kendi kalesini inşa ettiği, dekore ettiği ve geliştirdiği bir alan. XP ile altın kazanır, altınla eşya satın alır. **Günlük yeni eşyalar** ve **inşaat bekleme süreleri** ile bağlılık sağlanır.

### Kale Yapısı
```
┌─────────────────────────────────────────────────────────┐
│           🏰 KUZEY'İN KALESİ                            │
│           Seviye 3 • 5/10 Oda Açık                      │
│                                                         │
│   ┌─────────────────────────────────────────────┐      │
│   │  🏠 Ana Salon    │  🛏️ Yatak Odası  │ 🔒   │      │
│   │  ⬜⬜🪑🛋️      │  🛏️⬜⬜🧸        │ ???  │      │
│   ├─────────────────────────────────────────────┤      │
│   │  📚 Kütüphane   │  🔒 Kilitli      │ 🔒   │      │
│   │  📚📚🪔⬜      │  (500 Altın)     │ ???  │      │
│   └─────────────────────────────────────────────┘      │
│                                                         │
│   💰 1,250 Altın    🔨 İnşaat: Mutfak (3 saat kaldı)   │
│                                                         │
│   [🛒 DÜKKAN]  [🎨 DEKORE ET]  [🔨 İNŞAAT]             │
└─────────────────────────────────────────────────────────┘
```

### Oda Türleri ve Açma Maliyetleri
| Oda | Maliyet | Bekleme | Bonus |
|-----|---------|---------|-------|
| Ana Salon | Ücretsiz | - | Başlangıç |
| Yatak Odası | 100 Altın | 1 saat | +5% XP |
| Kütüphane | 250 Altın | 2 saat | +10% Ders XP |
| Mutfak | 500 Altın | 4 saat | Yaratık +Mutluluk |
| Bahçe | 750 Altın | 6 saat | Günlük hediye şansı+ |
| Hazine Odası | 1000 Altın | 12 saat | Altın bonusu |
| Kule | 1500 Altın | 24 saat | Yaratık evrimi hızlanır |
| Taht Odası | 2500 Altın | 48 saat | Tüm bonuslar +5% |

### Günlük Dükkan
```
┌─────────────────────────────────────────────────────────┐
│              🛒 GÜNLÜK DÜKKAN                           │
│              ⏰ Yenileniyor: 18:42:33                   │
│                                                         │
│   ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐  │
│   │ 🛋️     │  │ 🪴      │  │ 🖼️     │  │ 🏆      │  │
│   │ Kanepe  │  │ Saksı   │  │ Tablo   │  │ Kupa    │  │
│   │ 150 💰  │  │ 50 💰   │  │ 200 💰  │  │ 🌟NADİR │  │
│   │         │  │         │  │         │  │ 500 💰  │  │
│   └─────────┘  └─────────┘  └─────────┘  └─────────┘  │
│                                                         │
│   ✨ NADİR EŞYA! Sadece bugün!                         │
└─────────────────────────────────────────────────────────┘
```

**Dükkan Mekanikleri:**
- Her 24 saatte 4 yeni eşya
- 1 tane **NADİR** eşya (sadece o gün!)
- Kaçırırsan gider!
- FOMO (Fear of Missing Out) etkisi

### Eşya Kategorileri
| Kategori | Örnekler | Fiyat Aralığı |
|----------|----------|---------------|
| Mobilya | 🛋️🪑🛏️🧸 | 50-300 Altın |
| Dekorasyon | 🪴🖼️🕯️🏆 | 30-200 Altın |
| Zemin | Halı, Parke | 100-400 Altın |
| Duvar | Duvar kağıdı, boya | 100-400 Altın |
| Özel | 🎄🎃🎅 (mevsimsel) | 500+ Altın |

### İnşaat Bekleme Sistemi
```
┌─────────────────────────────────────────┐
│       🔨 İNŞAAT DEVAM EDİYOR           │
│                                         │
│       🏗️ MUTFAK                        │
│                                         │
│       ██████████████░░░░░░ 75%         │
│       ⏰ 2 saat 34 dakika kaldı        │
│                                         │
│       [⚡ HIZLANDIR (50 Altın)]        │
└─────────────────────────────────────────┘
```

- İnşaat bitmeden oda kullanılamaz
- "Hızlandır" butonu (Altın ile)
- Bildirim: "İnşaat tamamlandı!"

### Altın Ekonomisi
| Kaynak | Miktar |
|--------|--------|
| Görev tamamlama | 5-20 Altın (XP'nin %20'si) |
| Günlük hediye | 10-50 Altın |
| 7 gün seri | 100 Altın bonus |
| Seviye atlama | Seviye × 25 Altın |
| Başarı rozeti | 50-200 Altın |

### Veritabanı
```sql
-- Kaleler
CREATE TABLE castles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name TEXT DEFAULT 'Benim Kalem',
  level INTEGER DEFAULT 1,
  gold INTEGER DEFAULT 100,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Odalar
CREATE TABLE castle_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  castle_id UUID REFERENCES castles(id) ON DELETE CASCADE,
  room_type TEXT NOT NULL,
  is_unlocked BOOLEAN DEFAULT FALSE,
  unlock_started_at TIMESTAMPTZ,
  unlock_completed_at TIMESTAMPTZ,
  position_x INTEGER,
  position_y INTEGER
);

-- Eşyalar
CREATE TABLE castle_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID REFERENCES castle_rooms(id) ON DELETE CASCADE,
  item_type TEXT NOT NULL,
  item_id TEXT NOT NULL,
  position_x INTEGER,
  position_y INTEGER,
  purchased_at TIMESTAMPTZ DEFAULT NOW()
);

-- Günlük dükkan
CREATE TABLE daily_shop (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  items JSONB NOT NULL, -- [{item_id, price, is_rare}]
  expires_at TIMESTAMPTZ NOT NULL
);
```

---

## GÜNLÜK BAĞLILIK SİSTEMİ (Daily Engagement)

### Günlük Seri (Streak)
```
┌─────────────────────────────────────────────────────────┐
│              🔥 GÜNLÜK SERİ: 12 GÜN                     │
│                                                         │
│   Pzt  Sal  Çar  Per  Cum  Cmt  Paz                    │
│   ✅   ✅   ✅   ✅   ✅   ✅   ✅                       │
│   ✅   ✅   ✅   ✅   ✅   🔲   🔲                       │
│                        BUGÜN                            │
│                                                         │
│   🎁 7 Gün = 100 Altın  ✅ ALINDI                      │
│   🎁 14 Gün = 250 Altın + Nadir Eşya  (2 gün kaldı)   │
│   🎁 30 Gün = 500 Altın + Efsanevi Eşya               │
└─────────────────────────────────────────────────────────┘
```

### Seri Ödülleri
| Gün | Ödül |
|-----|------|
| 3 | 25 Altın |
| 7 | 100 Altın + Yaratık yemi |
| 14 | 250 Altın + Nadir eşya |
| 21 | 400 Altın + Özel avatar |
| 30 | 500 Altın + Efsanevi eşya |

### Bildirimler
- "🐉 Zümrüt seni özlüyor! Beslemek için gel."
- "🎁 Günlük hediyen hazır!"
- "🏗️ Mutfak inşaatı tamamlandı!"
- "🛒 Bugünkü nadir eşyayı kaçırma!"
- "🔥 Serin 12 gün! Devam et!"

---

## YENİ DOSYALAR

### views/
- `CreatureScreen.tsx` - Yaratık bakım ekranı
- `CastleScreen.tsx` - Kale görünümü
- `ShopScreen.tsx` - Günlük dükkan
- `RoomEditorScreen.tsx` - Oda dekorasyon

### components/
- `Creature.tsx` - Yaratık komponenti (animasyonlu)
- `TimerButton.tsx` - Geri sayım butonlu aksiyon
- `DailyGift.tsx` - Günlük hediye kutusu
- `RoomGrid.tsx` - Oda içi eşya yerleştirme
- `StreakBanner.tsx` - Seri göstergesi

### services/
- `creatureService.ts` - Yaratık CRUD + timer logic
- `castleService.ts` - Kale CRUD
- `shopService.ts` - Günlük dükkan yenileme
- `streakService.ts` - Seri takibi

# 🏰 QuestNest - Nasıl Çalışır?

Bu belge, QuestNest uygulamasının nasıl çalıştığını adım adım açıklar.

---

## 🎮 Temel Kavramlar

| Kavram | Açıklama |
|--------|----------|
| **Aile** | Uygulamadaki en üst birim. Bir aile kodu ile tanımlanır. |
| **Ebeveyn** | Görev oluşturan, onaylayan ve ödül yöneten kişi. PIN ile korunur. |
| **Çocuk** | Görevleri yapan, XP (altın) kazanan "kahraman". |
| **PIN** | 4 haneli şifre. Sadece ebeveynler bilir. |
| **Aile Kodu** | Örn: `MEHMET-X7K2`. Aileye katılmak için kullanılır. |

---

## 📱 Kurulum Akışı

### Senaryo 1: İlk Kişi (Aile Kurucu)

```
Uygulama Yükle → "Yeni Aile Kur" → 
   1. Aile Adı (örn: Yılmaz Ailesi)
   2. İlk Çocuk Adı (örn: Mehmet)
   3. PIN Oluştur (örn: 1234)
→ Aile Kodu verilir (örn: MEHMET-X7K2)
→ Çocuk paneli açılır
```

### Senaryo 2: Anne Katılıyor (Ebeveyn)

```
Uygulama Yükle → "Aileye Katıl" → 
   Kod Gir (MEHMET-X7K2) → 
   "Sen kimsin?" → "EBEVEYNİM" →
   PIN Gir (1234) → Doğru ise →
   Adını Gir (Anne) →
→ Ebeveyn paneli açılır
```

### Senaryo 3: İkinci Çocuk Katılıyor

```
Uygulama Yükle → "Aileye Katıl" → 
   Kod Gir (MEHMET-X7K2) → 
   "Sen kimsin?" → "ÇOCUĞUM" →
   Kahraman Adı Gir (Zeynep) →
→ Çocuk paneli açılır
```

---

## 👨‍👩‍👧‍👦 Örnek Aile Yapısı

| Kişi | Cihaz | Rol | Nasıl Katıldı? |
|------|-------|-----|----------------|
| Baba | Telefon | Ebeveyn | "Yeni Aile Kur" |
| Anne | Telefon | Ebeveyn | Kod + PIN |
| Mehmet | Tablet | Çocuk | İlk kurulumda |
| Zeynep | Tablet | Çocuk | Kod + İsim |

---

## 🎯 Günlük Kullanım

### Ebeveyn Paneli
- ⚔️ **Görev Ekle** - Çocuklara görev ata
- ✅ **Onayla** - Tamamlanan görevleri onayla
- 🎁 **Ödül Yönet** - Kazanılabilir ödüller ekle
- 💰 **Bonus Altın** - Ekstra XP ver
- 📊 **İstatistik** - Haftalık özet gör

### Çocuk Paneli
- 📋 **Görevleri Gör** - Atanan görevleri listele
- ✅ **Tamamla** - Görevi bitirince "Tamamladım" de
- 🏪 **Hazine Odası** - XP ile ödül satın al
- 🏰 **Kale Oyunu** - XP ile bina inşa et
- 🐾 **Yaratık** - XP ile evcil hayvan besle

---

## 🔐 Güvenlik

- Ebeveyn paneline geçiş PIN gerektirir
- Çocuklar PIN'i bilmez
- Her aile izole bir birimdir
- Veriler Supabase'de güvenli saklanır

---

## 📲 Cihaz Değişikliği

Yeni cihaza geçerken:
1. Uygulamayı yükle
2. "Aileye Katıl" seç
3. Aile kodunu gir
4. Rolünü seç (Ebeveyn/Çocuk)
5. Devam et

**Veriler bulutta saklandığı için tüm ilerleme korunur!**

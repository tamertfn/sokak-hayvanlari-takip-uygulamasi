# Sokak Hayvanları Takip Uygulaması

Bu proje, sokak hayvanlarının takibi ve yönetimi için geliştirilmiş bir mobil uygulamadır.

## Aciklamalar
Hocam kaynak kodlarini npx expo start ile calistirmaniz durumunda uygulama calismayacaktir cunku api keylerini vs gizledim. Repoda bulunan apk kaynak kodlarinin bir iki commit sonrasi yani sonraki surume ait ancak o surumde api keyler her yerde oldugu icin onu repoya yukleyemiyorum. Sadece ufak ui gelistirmeleri yaptigim icin de gerek yok diye dusundum.

Anlatim videomu izleyebileceginiz ve apkda sorun olmasi durumunda apkyi indirebileceginiz googledrive linki: https://drive.google.com/drive/folders/1wLLc8-TFfUpxc00L1q0-FwoX8B2mS40I

Bildirim sistemini yetistiremedim. (Normelde kullanicinin son login yaptigi yeri merkez kabul eden 5km capli dairedeki hayvanlarda guncelleme oldugunda veya favorilerdeki hayvanlardan birinde guncelleme oldugunda bildirim gidecekti)

## Özellikler

### Giriş ve Kayıt Ekranları /app/login.tsx, /app/register.tsx
- Kullanıcı girişi (email/şifre) (Firebase Auth)
- Yeni kullanıcı kaydı
- Şifremi unuttum özelliği
- Güvenli kimlik doğrulama sistemi

### Patilerim Ekranı /app/(tabs)/patilerim.tsx
- Kullanıcının eklediği sokak hayvanlarının listesi
- Her hayvan için detaylı bilgi görüntüleme ve CRUD islemleri
- Sağlık durumu takibi (Sağlıklı, Hasta, Yaralı)
- Yemek durumu takibi
- Notlar ekleme ve düzenleme
- Favori hayvanları işaretleme
- Yorum sistemi
- Fotoğraf yükleme ve görüntüleme

### Harita Ekranı /app/(tabs)/index.tsx
- Tüm sokak hayvanlarının konumlarını harita üzerinde görüntüleme
- Filtreleme özellikleri (Sağlık durumu)
- Hayvan detaylarını görüntüleme
- Favori işaretleme
- Yorum yapma
- Sokak hayvanina tikladiginda detay sayfasi goruntuleme
- Yeni pati ekleme /app/(tabs)/yeni-pati.tsx

### Profilim Ekranı /app/(tabs)/profilim
- Kullanıcı profil bilgilerini görüntüleme ve düzenleme
- Favori hayvanların listesi
- Favori hayvanların detaylarını görüntüleme

### Pati Karti Detay Ekranlari
- Diğer kullanıcıların ekledigi patileri görüntüleme (sadece map uzerinde) /app/user-patiler/[userId].tsx
- Hayvan detaylarını görüntüleme
- Yorum yapma
- Favori işaretleme

### Teknik Detaylar
- Firebase Firestore veritabanı entegrasyonu
- Gerçek zamanlı veri senkronizasyonu
- Kullanıcı kimlik doğrulama sistemi
- Modern ve kullanıcı dostu arayüz
- Responsive tasarım

### Proje Yapısı
- `/app`: Ana uygulama ekranları ve navigasyon
  - `/(tabs)`: Tab navigasyonu altındaki ekranlar
    - `index.tsx`: Harita ekranı
    - `patilerim.tsx`: Patilerim listesi
    - `profilim.tsx`: Kullanıcı profili
    - `yeni-pati.tsx`: Yeni pati ekleme
  - `/login.tsx`: Giriş ekranı
  - `/register.tsx`: Kayıt ekranı
  - `/user-patiler/[userId].tsx`: Kullanıcı patileri detay sayfası

- `/src`: Yardımcı kodlar ve servisler
  - `/config`: Yapılandırma dosyaları
    - `firebase.ts`: Firebase bağlantı ve yapılandırma ayarları
    - `cloudinary.js`: Cloudinary resim yükleme servisi yapılandırması
  - `/hooks`: Özel React hooks
    - `useAuth.ts`: Firebase Authentication işlemleri için özel hook
  - `/services`: Harici servis entegrasyonları
    - `animalService.ts`: Hayvan verilerinin CRUD işlemleri için servis
  - `/types`: TypeScript tip tanımlamaları
    - `animal.ts`: Hayvan veri modeli ve ilgili tipler
    - `env.d.ts`: Ortam değişkenleri için tip tanımlamaları
  - `/utils`: Yardımcı fonksiyonlar
    - `imageUpload.tsx`: Resim yükleme işlemleri için yardımcı fonksiyonlar

- `/assets`: Statik dosyalar (resimler, fontlar vb.)

### Veri Yapısı
```typescript
type Pati = {
  id: string;
  name: string | null;
  healthStatus: string;
  imageUrl: string;
  createdAt: any;
  userId: string;
  hasFood: boolean;
  notes: string | null;
  location: {
    latitude: number;
    longitude: number;
  };
};

type Comment = {
  id: string;
  patiId: string;
  userId: string;
  text: string;
  createdAt: any;
};

type FavoritePati = {
  id: string;
  name: string | null;
  healthStatus: string;
  imageUrl: string;
  location: {
    latitude: number;
    longitude: number;
  };
  hasFood: boolean;
  notes: string | null;
  userId?: string;
};
```

### Kullanılan APIlar
- Firebase (Firestore, Authentication)
- Cloudinary (Resim yukleme servisi icin)
- Google Maps API

## Geliştirme Süreci

Proje geliştirme sürecinde aşağıdaki adımlar izlenmiştir:

1. Proje yapısının oluşturulması
2. Firebase entegrasyonu
3. Kullanıcı arayüzü tasarımı
4. Veri modeli oluşturma
5. CRUD işlemlerinin implementasyonu
6. Gerçek zamanlı veri senkronizasyonu
7. Kullanıcı deneyimi iyileştirmeleri

## Güvenlik ve Hata Yönetimi

- Firebase güvenlik kuralları ile veri erişim kontrolü
- Kullanıcı kimlik doğrulama sistemi
- Hata yakalama ve kullanıcı bildirimleri
- Veri doğrulama kontrolleri


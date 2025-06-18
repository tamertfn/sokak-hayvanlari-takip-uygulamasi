<a name="_toc192790687"></a>Sokak Hayvanlarını Takip Etme Uygulaması 
Proje Planı
=====================================================================

<https://github.com/tamertfn/sokak-hayvanlari-takip-uygulamasi>

# <a name="_toc192790688"></a>İçindekiler
[Sokak Hayvanlarını Takip Etme Uygulaması  Proje Planı	1](#_toc192790687)

[İçindekiler	1](#_toc192790688)

[1. Proje Tanımı	2](#_toc192790689)

[2. Teknolojiler	2](#_toc192790690)

[3. Özellikler	2](#_toc192790691)

[3.1 Kullanıcı Kayıt & Giriş Sistemi	2](#_toc192790692)

[3.2 Harita Üzerinde Hayvanları Gösterme	2](#_toc192790693)

[3.3 Hayvan Kayıt Sistemi	2](#_toc192790694)

[3.4 Hayvan Detayları	3](#_toc192790695)

[3.5 Bildirim Sistemi	3](#_toc192790696)

[3.6 Filtreleme ve Arama	3](#_toc192790697)

[3.7 Favorilere Ekleme	3](#_toc192790698)

[4. Teknik Gereksinimler	3](#_toc192790699)

[4.1 Frontend	3](#_toc192790700)

[4.2 Backend	4](#_toc192790701)

[5. Geliştirme Süreci	4](#_toc192790702)

[5.1 Planlama ve Hazırlık	4](#_toc192790703)

[5.2 Uygulama Geliştirme Aşamaları	4](#_toc192790704)






# <a name="_toc192790689"></a>1. Proje Tanımı
Sokak hayvanlarını takip etme uygulaması, kullanıcıların harita üzerinde hayvanları işaretleyerek konumlarını, durumlarını ve görsellerini paylaşmalarını sağlar. Hayvanlarla ilgili bilgilerin kaydedildiği bir veritabanı kullanılacaktır.
# <a name="_toc192790690"></a>2. Teknolojiler
- **React Native** (Expo CLI)
- **Firebase Firestore** (Veritabanı)
- **Firebase Storage** (Görsel yükleme)
- **React Native Maps** (Harita entegrasyonu)
- **Geolocation API** (Konum verisi almak için)
- **Redux veya Context API** (Durum yönetimi için)
- **React Navigation** (Sayfa yönlendirmeleri için)

**Not:** Bu sayfada belirtilen teknolojiler ve API'ler, proje gereksinimlerine ve gelişim sürecine göre değişebilir. Her API ve teknoloji için detaylı bir analiz yapılmamış olup, proje ilerledikçe ihtiyaçlara göre değerlendirilecektir. Ücretlendirme konusunda sıkıntı yaşatanlar için ücretsiz alternatifleri kullanılması sağlanacaktır.
# <a name="_toc192790691"></a>3. Özellikler
## <a name="_toc192790692"></a>3.1 Kullanıcı Kayıt & Giriş Sistemi
- Firebase Authentication kullanılarak e-posta & şifre ile giriş.
- Google veya Facebook ile giriş yapma.
- Kullanıcı profil sayfası.
## <a name="_toc192790693"></a>3.2 Harita Üzerinde Hayvanları Gösterme
- Google Maps veya OpenStreetMap entegrasyonu.
- Harita üzerinde konum tabanlı hayvan işaretleme.
- Kullanıcının bulunduğu konumu haritada gösterme.
- Hayvan simgelerinin farklı durumları temsil etmesi (sağlıklı, hasta, yaralı vb.).
## <a name="_toc192790694"></a>3.3 Hayvan Kayıt Sistemi
- Yeni hayvan ekleme formu: 
  - Hayvanın adı (isteğe bağlı).
  - Fotoğraf yükleme.
  - Konum bilgisi.
  - Sağlık durumu seçimi.
  - Açıklama alanı.
- Kullanıcılar ekledikleri hayvanları düzenleyebilir.
## <a name="_toc192790695"></a>3.4 Hayvan Detayları
- Hayvana tıklandığında açılan detay sayfası: 
  - Fotoğraf galerisi.
  - Ekleyen kullanıcı bilgisi.
  - Güncel sağlık durumu.
  - Kullanıcıların yorum ekleyebilmesi.
## <a name="_toc192790696"></a>3.5 Bildirim Sistemi
- Kullanıcılara belirli bölgelerdeki yeni eklenen hayvanlarla ilgili bildirim gönderme.
- Hayvanın sağlık durumu değiştiğinde ilgililere bildirim gönderme.
## <a name="_toc192790697"></a>3.6 Filtreleme ve Arama
- Konuma göre yakınlardaki hayvanları listeleme.
- Sağlık durumuna göre filtreleme.
- Belirli bir kullanıcı tarafından eklenen hayvanları listeleme.
## <a name="_toc192790698"></a>3.7 Favorilere Ekleme
- Kullanıcıların ilgilendiği hayvanları favorilere ekleyebilmesi.
- Favoriler listesinin kullanıcı profilinde saklanması.
# <a name="_toc192790699"></a>4. Teknik Gereksinimler
## <a name="_toc192790700"></a>4.1 Frontend
- React Native (Expo CLI ile geliştirme)
- React Native Paper veya Shadcn/UI gibi UI bileşenleri
- Redux Toolkit veya Context API (Durum yönetimi)
- Axios (API çağrıları için)
- Firebase SDK (Kimlik doğrulama, veritabanı ve depolama için)
- React Native Maps (Harita kullanımı)
- React Navigation (Sayfa geçişleri için)
## <a name="_toc192790701"></a>4.2 Backend
- Firebase Firestore (NoSQL veritabanı)
- Firebase Storage (Fotoğraf yükleme)
- Firebase Functions (Bildirimler ve diğer işlemler için)
# <a name="_toc192790702"></a>5. Geliştirme Süreci
## <a name="_toc192790703"></a>5.1 Planlama ve Hazırlık
- Gereksinimlerin belirlenmesi ve ön araştırma yapılması.
- Kullanıcı akışlarının ve wireframe’lerin hazırlanması.
- Firebase ve Expo projelerinin oluşturulması.
## <a name="_toc192790704"></a>5.2 Uygulama Geliştirme Aşamaları
**Aşama 1: Temel Yapı ve Kimlik Doğrulama**

- Expo CLI ile proje oluşturma.
- Firebase Authentication entegrasyonu.
- Giriş, kayıt ve profil sayfalarının hazırlanması.

**Aşama 2: Harita ve Konum İşlemleri**

- React Native Maps kurulumu ve Google Maps API entegrasyonu.
- Kullanıcının konumunu alma ve harita üzerinde gösterme.
- Kullanıcının konumunu izin mekanizması ile alma.

**Aşama 3: Hayvan Kayıt ve Listeleme**

- Firestore veritabanında koleksiyon yapısının oluşturulması.
- Yeni hayvan ekleme formunun oluşturulması.
- Eklenen hayvanların harita üzerinde gösterilmesi.

**Aşama 4: Hayvan Detay ve Güncelleme**

- Hayvan detay sayfasının hazırlanması.
- Kullanıcının kendi eklediği hayvanları düzenleyebilmesi.

**Aşama 5: Filtreleme ve Arama Özellikleri**

- Sağlık durumu, konum ve kullanıcıya göre filtreleme işlemleri.

**Aşama 6: Bildirim ve Favori Sistemi**

- Firebase Cloud Messaging ile bildirim entegrasyonu.
- Favorilere ekleme ve listeleme işlemleri.

`	`2


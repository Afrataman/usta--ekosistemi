# 01 — MVP Kapsamı ve Roller

**Sürüm:** 0.1
**Durum:** Taslak

## 1. Kapsam yaklaşımı

MVP'nin amacı bütün vizyonu küçültülmüş biçimde yapmak değildir. Amaç, ilerideki katmanların
dayanacağı üyelik, ürün doğrulama, puan, ödül, bayi ve denetim çekirdeğini güvenilir kılmaktır.

### Neden kapsamı kesin ayırıyoruz?

“İlk sürüm” açık tanımlanmazsa eğitim, müşteri eşleştirme veya garanti gibi cazip özellikler
çekirdek güvenilirlik çalışmalarının önüne geçebilir. Kapsam dışı listesi bu riski azaltır.

## 2. MVP kapsamına dahil

### Usta

- Telefon numarası ve 6 haneli tek kullanımlık SMS koduyla kayıt/giriş
- Asgari profil oluşturma ve güncelleme
- Kamera ile ürün QR kodu okutma
- Ürün kodunu elle girme
- Puan özeti ve puan hareketleri
- Bronz, Gümüş ve Altın seviye gösterimi
- Ödül kataloğu ve ödül ayrıntısı
- Dijital ödül veya bayi kuponu oluşturma
- Kupon durumu ve geçmişi
- Uygulama içi kampanya bildirimleri
- Destek talebi oluşturma ve durumunu izleme
- Kendi üyelik QR kodunu görüntüleme

### Bayi

- Bayi çalışanı girişi
- Ustanın üyelik QR kodunu okutma veya kimliğini yetkili yöntemle bulma
- Uygun satışı ustayla eşleştirme
- Kupon doğrulama
- Ödül teslimini onaylama
- Yetki ve zaman sınırları içinde iade başlatma
- Şüpheli işlem bildirme
- Kendi işlemlerini ve durumlarını görüntüleme

### Yönetim ve operasyon

- Usta, bayi, şube ve bayi çalışanı yönetimi
- Ürün ve ürün kodu partisi oluşturma/yükleme
- Puan ve seviye kurallarını yönetme
- Kampanya taslağı, onayı, zamanlaması ve yayını
- Ödül kataloğu ve stok/uygunluk yönetimi
- Kupon ve teslimat takibi
- İade ve puan geri alma takibi
- Şüpheli işlem kuyruğu ve inceleme kararı
- Temel raporlar ve dışa aktarma
- İşlem ve yönetici değişikliği geçmişi
- Destek taleplerini yanıtlama

## 3. MVP kapsamı dışında

- Eğitim videosu, sınav ve sertifika
- Onaylı Usta başvurusu ve belge doğrulama
- Müşteri hesabı ve müşteri talebi
- Usta–müşteri eşleştirme
- Teklif, randevu ve iş takibi
- Uygulama fotoğrafları ve kalite kontrol listeleri
- Dijital garanti belgesi ve garanti talebi
- ERP/B2B/CRM ile tam çift yönlü entegrasyon
- Yapay zekâ ile kişisel kampanya önerileri
- Uygulama mağazalarına özel yerel mobil uygulama
- Puanın nakde çevrilmesi veya banka hesabına aktarılması
- Ustalar arasında puan transferi

Kapsam dışındaki başlıklar veri modelinde geleceği engellemeyecek ölçüde düşünülür; ancak
MVP ekranı, API'si ve operasyon süreci olarak geliştirilmez.

## 4. Roller

| Rol | Temel yetki | Kritik sınır |
|---|---|---|
| Usta | Kendi profil, kod, puan, ödül ve talepleri | Başka ustanın verisini göremez. |
| Bayi çalışanı | Kendi şubesindeki satış, kupon ve teslim işlemleri | Puan kuralı veya kullanıcı bakiyesi değiştiremez. |
| Bayi yöneticisi | Şube çalışanları ve şube raporları | Başka bayinin ayrıntılı verisini göremez. |
| Destek görevlisi | Talep ve sınırlı kullanıcı görünümü | Puanı doğrudan düzenleyemez; düzeltme talebi açar. |
| Operasyon görevlisi | İade, teslimat ve inceleme süreçleri | Kampanya yayınlayamaz. |
| Risk inceleme görevlisi | Şüpheli işlemleri inceleme ve karar | Kendi oluşturduğu işlemi tek başına aklayamaz. |
| Kampanya yöneticisi | Kural ve kampanya taslağı | Yüksek etkili kampanyada ikinci onay gerekir. |
| Katalog yöneticisi | Ödül, stok ve uygunluk | Geçmiş kupon şartlarını değiştiremez. |
| Denetçi | Kayıt ve raporlara salt okunur erişim | İşlem oluşturamaz veya değiştiremez. |
| Sistem yöneticisi | Teknik yapılandırma ve rol atama | İş gerekçesi olmadan puan hareketi oluşturamaz. |

## 5. Yetkilendirme ilkeleri

- Varsayılan erişim reddedilir; yalnızca açıkça verilen yetki kullanılabilir.
- Yetki rol ve gerekiyorsa bayi/şube kapsamıyla birlikte değerlendirilir.
- Kritik işlemlerde yeniden kimlik doğrulama veya ikinci onay istenebilir.
- Yönetici ekranında bir kaydın görünmesi, o kaydı değiştirme yetkisi olduğu anlamına gelmez.
- Rol değişikliği anında etkili olur ve denetim kaydı üretir.
- Ayrılan bayi çalışanının erişimi oturum süresi beklenmeden kapatılabilir.

## 6. Asgari usta profili

MVP'de yalnızca hizmet için gerekli bilgiler zorunlu tutulmalıdır:

- Telefon numarası
- Ad ve soyad
- İl
- İlçe
- Açık rıza/aydınlatma ve iletişim tercihleri için ayrı kayıtlar
- Hesap durumu ve oluşturulma tarihi

Meslek dalı, doğum tarihi, vergi bilgisi veya ayrıntılı adres ancak açık iş gerekçesi ve
onayla eklenir. Az veri toplamak hem kayıt sürtünmesini hem de veri koruma riskini azaltır.

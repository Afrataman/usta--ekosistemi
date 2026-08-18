# 05 — Kavramsal Veri Modeli

**Sürüm:** 0.1
**Durum:** Taslak

Bu model henüz fiziksel SQL şeması değildir. İş kavramlarını, sınırlarını ve ilişkilerini
tanımlar. Teknoloji seçildikten sonra tablo ve indeks ayrıntıları hazırlanacaktır.

## 1. Modül sınırları

Modüler monolit içinde önerilen iş modülleri:

1. Kimlik ve Erişim
2. Usta
3. Bayi
4. Ürün ve Kod
5. Satış ve İade
6. Puan Defteri
7. Kampanya ve Seviye
8. Ödül ve Kupon
9. Risk ve İnceleme
10. Bildirim
11. Destek
12. Denetim ve Raporlama

### Neden modül sınırı kullanıyoruz?

Tek uygulama olarak dağıtılsa bile her modül kendi kurallarından sorumlu olur. Örneğin kampanya
modülü puan bakiyesini doğrudan değiştiremez; puan defterinden hareket oluşturmasını ister.
Bu düzen ileride yalnızca gerçekten gerekli modülün servise ayrılmasını kolaylaştırır.

## 2. Kimlik ve erişim

### `users`

- Sistem içi değişmez kullanıcı kimliği
- Telefon numarasının standart ve benzersiz gösterimi
- Hesap durumu
- Oluşturulma/güncellenme zamanları

Telefon numarası iş ilişkilerinin ana anahtarı yapılmaz. Numara değişebilir; diğer tablolar
değişmez kullanıcı kimliğine bağlanır.

### `otp_challenges`

- Kullanıcı/telefon, amaç, güvenli kod doğrulama verisi
- Oluşma ve sona erme zamanı
- Deneme ve gönderim sayıları
- Kullanıldı/iptal durumu

### `sessions`

- Kullanıcı, cihaz/oturum tanımlayıcısı
- Oluşma, son kullanım, sona erme ve iptal zamanı
- Risk için gereken sınırlı teknik bağlam

### `roles`, `permissions`, `user_role_assignments`

- Rol ve izin sözlüğü
- Kullanıcıya rol, kapsam (ör. bayi/şube) ve geçerlilik tarihi ataması
- Atayan yönetici ve gerekçe

### `legal_text_versions`, `user_consents`

- Metin türü, sürüm, yayın tarihi ve içerik özeti
- Kullanıcı, karar (kabul/ret/geri çekme), zaman, kanal ve metin sürümü

## 3. Usta ve bayi

### `craftsman_profiles`

- Kullanıcı kimliği, ad, soyad, il, ilçe
- Profil durumu
- Gelecekteki Onaylı Usta statüsünden ayrı MVP kulüp durumu

### `dealers`, `dealer_branches`

- Bayi tüzel/iş kimliği ve durumu
- Şube, adres/bölge ve operasyon durumu

### `dealer_staff`

- Kullanıcı, bayi, şube ve çalışan durumu
- Başlangıç/bitiş tarihleri

## 4. Ürün ve kod

### `products`

- Ürün kimliği, SKU, ad, grup ve durum
- Kampanya eşleştirmesinde kullanılacak sınıflandırmalar

### `product_code_batches`

- Parti, ürün, üretim/yükleme kaynağı
- Oluşturulma, etkinleşme ve durdurma tarihleri
- Kod sayısı ve bütünlük özeti

### `product_codes`

- Kodun açık değerini gereksiz yere saklamayan güvenli arama/doğrulama değeri
- Parti, durum, etkinlik penceresi
- Kullanım ve risk durumu

Kod üzerinde başarılı kullanım için veritabanı düzeyinde benzersiz kısıt bulunmalıdır.

### `code_claims`

- Kod, usta, istek kaynağı (QR/elle), işlem anahtarı
- Sonuç, zaman, ürün ve varsa satış/bayi ilişkisi
- Risk vakası ve puan hareketi referansı

Başarısız denemeler sınırlı saklama ve erişim politikasıyla tutulur; risk analizi için gereklidir.

## 5. Satış ve iade

### `sales`

- Bayi/şube, dış veya iç satış referansı, zaman
- Durum, kaynak ve belge referansı

### `sale_items`

- Satış, ürün, miktar ve gerekiyorsa kod ilişkileri

### `craftsman_sale_links`

- Satış/kalem, usta, eşleştiren aktör, yöntem ve durum
- İtiraz/iptal ilişkisi

### `returns`, `return_items`

- Orijinal satış/kalem, miktar, neden, kaynak ve zaman
- Onay durumu
- İlgili ters puan hareketleri

Aynı miktarın birden fazla iade edilmesini önleyen toplam ve benzersizlik kuralları gerekir.

## 6. Puan ve kampanya

### `point_ledger_entries`

- Usta, tür, miktar, bakiye bölümü ve durum
- Kaynak türü/kimliği
- Kampanya ve kural sürümü
- Ters çevrilen hareket
- İşlem anahtarı, zaman ve aktör/gerekçe

Kayıt güncellenerek miktarı değiştirilmez. Durum geçişi de sınırlı olmalı; mali etki yeni hareketle
ifade edilmelidir.

### `campaigns`, `campaign_versions`

- Kampanya kimliği, iş adı ve sahibi
- Sürümlenmiş koşullar, tarihler, hedefler, bütçe ve yaşam döngüsü
- Onaylayanlar ve yayın bilgisi

### `point_rule_versions`

- Temel veya kampanya kuralı
- Koşul tanımı, hesaplama sonucu, öncelik ve birleşebilirlik
- Etkinlik ve sürüm bilgisi

### `level_definitions`, `craftsman_level_periods`

- Seviye eşikleri, dönem ve avantaj sürümü
- Ustanın dönemsel seviyesi, nitelikli faaliyet ve hesaplama zamanı

## 7. Ödül ve kupon

### `rewards`, `reward_versions`

- Tür, ad, sağlayıcı, puan bedeli
- Uygunluk, geçerlilik, teslim yöntemi ve koşullar
- Sürüm ve yayın durumu

### `reward_inventory`

- Merkezi veya bayi bazlı stok kapsamı
- Mevcut, rezerve ve güvenlik stoku
- Dış sağlayıcı stok referansı

### `reward_orders`

- Usta, ödül sürümü, puan maliyeti ve durum
- İşlem anahtarı ve puan rezervasyon/harcama hareketleri

### `coupons`

- Ödül siparişi, güvenli kupon değeri/referansı
- Durum, kapsam, oluşturma ve son kullanım zamanı
- Hassas kodun şifreli veya sağlayıcıda tutulma biçimi

### `coupon_redemptions`

- Kupon, bayi/şube, çalışan, doğrulama ve teslim zamanı
- Benzersiz teslim işlem numarası

Kupon başına başarılı kullanım benzersiz olmalıdır.

## 8. Risk, destek ve iletişim

### `risk_events`, `risk_cases`, `risk_case_links`

- Sinyal türü, puan, önem ve algılama zamanı
- İnceleme durumu, atanan görevli, karar ve gerekçe
- Kullanıcı, bayi, kod, satış, cihaz veya kupon ilişkileri

### `support_tickets`, `support_messages`

- Talep sahibi, kategori, durum, öncelik ve hedef süre
- İlişkili işlem referansları
- Mesaj aktörü, içerik ve zaman

### `notifications`, `notification_deliveries`

- Şablon/sürüm, kullanıcı, kanal, veri ve durum
- Sağlayıcı denemeleri, teslim ve hata zamanı

## 9. Denetim ve güvenilir teslim

### `audit_logs`

- Aktör, eylem, hedef kayıt, zaman ve gerekçe
- İzin verilen ölçüde önceki/yeni değer özeti
- Oturum ve ilişkilendirme numarası

### `outbox_messages`

- Veritabanı işlemiyle birlikte kaydedilen olay
- Hedef, içerik sürümü, deneme ve teslim durumu

Outbox, puan veritabanına yazıldığı hâlde bildirimin veya dış kupon talebinin kaybolmasını
önler. Arka plan çalışanı başarısız mesajı güvenle tekrar işler.

## 10. Genel veri kuralları

- Tüm zamanlar veritabanında UTC; kullanıcıya Europe/Istanbul bağlamında gösterilir.
- İş kayıtlarında rastgele ve tahmin edilemeyen kimlikler tercih edilir.
- Para benzeri maliyetler kayan nokta ile tutulmaz; para birimi ve en küçük birim kullanılır.
- Puan tam sayı olmalıdır; kesir gerekiyorsa iş kuralı önceden tanımlanır.
- Kişisel veri raporlarda varsayılan olarak maskelenir.
- Silme gereken kişisel veri ile saklanması gereken işlem/denetim kaydı ayrıştırılır.
- Dış sistem referansları kaynak adıyla birlikte benzersizleştirilir.
- Kritik kayıtlarda oluşturma/güncelleme zamanı ve sürüm/iyimser kilit alanı bulunur.

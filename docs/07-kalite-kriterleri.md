# 07 — Kalite, Kabul ve Yayın Kriterleri

**Sürüm:** 0.1
**Durum:** Taslak

## 1. İşlevsel olmayan gereksinim yaklaşımı

“Hızlı”, “güvenli” ve “kolay” tek başına test edilemez. Bu belge bunları ölçülebilir hedeflere
dönüştürür. Kesin sayılar pilot hacmi ve altyapı bütçesi belirlendiğinde onaylanacaktır.

## 2. Kullanılabilirlik ve erişilebilirlik

- Usta ana işlemleri küçük ekran ve tek elle kullanıma uygun olmalıdır.
- QR başarısızlığında elle kod girişi en fazla bir eylem uzakta olmalıdır.
- Metin, renk tek başına kullanılmadan durum anlatmalıdır.
- Form alanları açık etiket, hata açıklaması ve klavye türü taşımalıdır.
- Dokunma alanları mobil kullanıma uygun olmalıdır.
- Kamera izni reddedildiğinde kullanıcı çıkmaza girmemelidir.
- Temel akışlar klavye ve ekran okuyucuyla doğrulanmalıdır.
- Hukuki metinler mobilde okunabilir ve daha sonra erişilebilir olmalıdır.

Hedef erişilebilirlik seviyesi teknoloji kararıyla birlikte WCAG sürümü ve seviyesi olarak
bağlayıcılaştırılacaktır.

## 3. Performans hedefleri

Pilot için başlangıç hedefleri; gerçek kullanıcı izleme sonuçlarına göre ayarlanacaktır:

- Ana sayfa, normal mobil bağlantıda anlamlı içeriği hızla göstermelidir.
- Kod doğrulama iç servis sonucu, dış servis beklemiyorsa çoğu istekte 2 saniyenin altında olmalıdır.
- Kupon doğrulama bayi sırasında beklemeyi artırmayacak hızda olmalıdır.
- Uzun raporlar kullanıcı isteğini bloklamamalı; arka planda hazırlanmalıdır.
- Liste API'lerinde sayfalama ve azami kayıt sınırı zorunlu olmalıdır.
- SMS ve dış sağlayıcı süre aşımı/yeniden deneme sınırları tanımlanmalıdır.

Kesin SLO yüzdeleri ve eşikleri K-016 pilot hacmi belirlendikten sonra yük testiyle sabitlenir.

## 4. Kullanılabilirlik ve dayanıklılık

- Puan ve kupon yazma işlemleri bakım dışı normal zamanda yüksek erişilebilir olmalıdır.
- Dış SMS/kupon sağlayıcısı kesintisi çekirdek veri bütünlüğünü bozmamalıdır.
- Tekrar denemeler üstel gecikme ve üst sınırla yapılmalıdır.
- Başarısız arka plan işleri görünür operasyon kuyruğuna düşmelidir.
- Veritabanı yedeği, saklama süresi, RPO ve RTO iş etkisi analizinden sonra onaylanmalıdır.
- Kritik sağlayıcılar için devre kesici ve kontrollü başarısızlık davranışı tasarlanmalıdır.

### Kavramlar

- **RPO:** Bir felakette kabul edilebilecek azami veri kaybı süresi.
- **RTO:** Hizmetin kabul edilebilir sürede yeniden açılma hedefi.
- **SLO:** Hizmetin ölçülebilir kalite hedefi.

Bu değerleri teknoloji ekibi tek başına seçmez; işin kabul edebileceği kayıp ve kesinti belirler.

## 5. Zayıf bağlantı/PWA kabul kriterleri

- Yarım kalan kod talebi uygulama yeniden açıldığında anlaşılır durumda görünür.
- Aynı talep yeniden gönderildiğinde çift puan oluşmaz.
- Çevrimdışı bakiye gösteriliyorsa son güncellenme zamanı bulunur.
- Çevrimdışı kupon teslimi başarılı gösterilemez.
- Yerel kuyruk hassas veriyi en aza indirir ve makul süre sonunda temizler.
- Uygulama güncellemesi açık işlemi bozmaz; service worker sürüm geçişi test edilir.
- Kullanıcı eski bir PWA sürümünde kalırsa uyumsuz API işlemi güvenle reddedilir/yükseltme ister.

## 6. Gözlemlenebilirlik

Her kritik işlem ortak ilişkilendirme numarasıyla izlenebilmelidir:

- İstek süresi ve sonucu
- Kod doğrulama sonucu (açık kod olmadan)
- Puan hareketi
- Kampanya/kural sürümü
- Dış sağlayıcı denemeleri
- Kupon oluşturma ve teslim
- İade ve risk vakası

Teknik metrik, yapılandırılmış log ve alarm bulunmalıdır. Alarm yalnızca hata sayısına değil,
örneğin SMS başarı oranı, bekleyen kupon kuyruğu ve olağan dışı puan hacmine de bakmalıdır.

## 7. Test katmanları

### Birim testleri

- Puan hesaplama ve kampanya çakışması
- Seviye hesaplama
- Durum geçişleri
- Kod/kupon biçim ve bütünlük kontrolleri

### Entegrasyon testleri

- Veritabanı benzersizlik ve eşzamanlılık
- Puan + kod kullanımı atomikliği
- Ödül + puan rezervasyonu
- İade + ters hareket
- Outbox ve tekrar deneme

### Sözleşme testleri

- SMS, kupon sağlayıcısı ve gelecekteki ERP adaptörleri
- Sağlayıcı hata, zaman aşımı ve tekrarlı yanıt senaryoları

### Uçtan uca testler

- Usta kayıt → kod → puan → ödül
- Bayi eşleştirme → kupon doğrulama → teslim
- İade → puan geri alma → kullanıcı bildirimi
- Risk inceleme → serbest bırakma/reddetme
- Kampanya yayınlama → doğru tarihte doğru puan

### Güvenlik ve yük testleri

- OTP brute force ve SMS flood
- Yetki sınırı ve başka kullanıcının kaydına erişim
- Aynı kod/kuponun eşzamanlı kullanımı
- Kampanya başlangıç/bitiş anında yoğunluk
- Rapor dışa aktarma ve büyük yük sınırları

## 8. Özellik bazlı örnek kabul kriterleri

### SMS girişi

- Geçerli numaraya kod gönderilebilir.
- Kod yalnızca geçerlilik süresinde ve bir kez kullanılabilir.
- Yanlış deneme ve yeniden gönderim limitleri uygulanır.
- Kod hiçbir uygulama logunda açık görünmez.

### Ürün kodu

- QR ve elle giriş aynı kod için aynı sonucu verir.
- Aynı kod iki eşzamanlı istekte yalnızca bir kazanım üretir.
- Kullanılmış kod yeni puan üretmez ve güvenli açıklama gösterir.
- İşlem kullanılan kural sürümüne kadar izlenebilir.

### Kampanya

- Yetkili yönetici kod değişikliği olmadan tarihli çarpan kuralı oluşturabilir.
- Yayından önce çakışma ve örnek sonuç gösterilir.
- Onaysız yüksek etkili kampanya aktifleşmez.
- Kampanya bitince yeni işlem bonus almaz; eski işlemin kaydı değişmez.

### Ödül/kupon

- Yetersiz puanda ödül oluşturulmaz.
- Çift dokunma tek harcama ve tek kupon oluşturur.
- Kupon doğrulama kuponu tüketmez.
- Aynı kupon yalnızca bir başarılı teslim kaydı oluşturur.

### İade

- İade orijinal satış ve puan hareketine bağlıdır.
- Kısmi iade yalnızca ilgili miktarın puanını etkiler.
- Aynı miktar iki kez iade edilemez.
- Orijinal hareket silinmez; ters hareket görünür.

## 9. MVP tamamlanma tanımı

Bir özellik yalnızca ekranı açıldığında tamamlanmış sayılmaz. Aşağıdakilerin tamamı gerekir:

- Onaylı gereksinim ve kabul kriteri
- Yetki ve hata durumlarının uygulanması
- Birim/entegrasyon testleri ve gerekli uçtan uca test
- Güvenlik ve kişisel veri incelemesi
- Log, metrik ve operasyon uyarısı
- Kullanıcı/destek metni
- Veri geçişi veya geri alma yöntemi
- Ürün sahibi ve QA kabulü
- İlgili dokümantasyon güncellemesi

## 10. Pilot yayın kapıları

- Tüm P0 açık kararlar kapanmış olmalı.
- Pilot kapsamı, ürün/bayi/usta sayıları ve destek ekibi hazır olmalı.
- Kritik ve yüksek güvenlik bulguları kapatılmış olmalı.
- Puan ekonomisi mali işler, hukuk ve pazarlama tarafından onaylanmış olmalı.
- SMS ve ödül sağlayıcıları için hata senaryoları test edilmiş olmalı.
- Yedek geri yükleme ve olay müdahale tatbikatı tamamlanmış olmalı.
- İzleme panelleri ve alarm sorumluları belirlenmiş olmalı.
- Kademeli yayın, özellik kapatma ve geri alma planı hazır olmalı.
- Kullanıcı destek ve itiraz süreçleri çalışır olmalı.

## 11. Pilot sonrası değerlendirme

Pilot sonunda yalnızca kullanım sayısına bakılmaz. Şunlar birlikte değerlendirilir:

- Kullanıcı değeri ve ilk ödüle erişim
- Bayi katılımı
- İşlem doğruluğu ve destek yükü
- Sahtecilik/yanlış pozitif dengesi
- Puan ve ödül bütçesi
- Sistem performansı ve operasyon maliyeti
- Onaylı Usta aşamasına geçmek için veri kalitesi

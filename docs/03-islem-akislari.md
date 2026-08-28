# 03 — İşlem Akışları

**Sürüm:** 0.1
**Durum:** Taslak

## 1. Akış tasarım ilkeleri

- Her dış istek benzersiz bir **işlem anahtarı** taşımalıdır.
- Aynı işlem tekrar gönderilirse ikinci sonuç üretmek yerine ilk sonuca dönülmelidir.
- Kullanıcıya başarılı mesajı ancak kalıcı kayıt tamamlandıktan sonra gösterilmelidir.
- Puan, kupon ve iade işlemleri birbirine referans veren yeni hareketlerle kaydedilmelidir.
- Dış servis gecikmesi ana işlemi belirsiz bırakmamalıdır; bekleyen durum kullanılmalıdır.

### Neden işlem anahtarı kullanıyoruz?

Telefon bağlantısı kesildiğinde kullanıcı aynı düğmeye tekrar basabilir. Benzersiz anahtar,
iki istek gelse bile yalnızca bir puan veya kupon işlemi oluşmasını sağlar. Bu özelliğe
teknik olarak “idempotency” denir.

## 2. Telefonla kayıt ve giriş

### Ön koşullar

- Telefon numarası desteklenen biçimdedir.
- Numara/cihaz/IP hız sınırını aşmamıştır.

### Ana akış

1. Kullanıcı telefon numarasını girer.
2. Sistem numarayı standart biçime dönüştürür ve hız sınırını kontrol eder.
3. Rastgele 6 haneli, kısa ömürlü ve tek kullanımlık doğrulama kodu oluşturulur.
4. Kodun kendisi açık biçimde saklanmaz; güvenli doğrulama verisi ve süre kaydedilir.
5. SMS sağlayıcısına gönderim yapılır.
6. Kullanıcı kodu girer.
7. Sistem süreyi, deneme sayısını ve kodu doğrular.
8. Yeni kullanıcıysa profil akışına; mevcut kullanıcıysa ana sayfaya yönlendirilir.
9. Oturum ve güvenlik kaydı oluşturulur.

### Alternatif/hata akışları

- SMS gecikirse kullanıcı sayaç sonunda tekrar isteyebilir; eski kod politikaya göre iptal edilir.
- Çok sayıda yanlış denemede doğrulama geçici olarak kilitlenir.
- Sağlayıcı yanıt vermezse “gönderildi” denmez; güvenli tekrar veya sağlayıcı geçişi uygulanır.
- Telefon başka hesapla çakışırsa hesaplar otomatik birleştirilmez; destek süreci açılır.

## 3. Ürün kodu doğrulama ve puan kazanma

QR ve elle giriş yalnızca kodun alınma biçimidir; aşağıdaki aynı sunucu akışını kullanır.

### Ana akış

1. Usta kodu tarar veya yazar.
2. İstemci biçim kontrolü yapar ve işlem anahtarıyla isteği gönderir.
3. Sistem oturum, hesap durumu ve hız sınırını kontrol eder.
4. Kod güvenli biçimde aranır; ürün ve parti durumu doğrulanır.
5. Kodun daha önce başarılı işlemde kullanılıp kullanılmadığı kontrol edilir.
6. Gerekliyse satış/bayi eşleşmesi doğrulanır.
7. Geçerli tarihteki kampanya ve puan kuralı sürümü seçilir.
8. Risk sinyalleri değerlendirilir.
9. Düşük riskte kod atomik olarak kullanılmış işaretlenir ve puan hareketi oluşturulur.
10. Yüksek/belirsiz riskte kod ve talep “incelemede” durumuna alınır; puan bekleyen olur.
11. Kullanıcı ürün, kural, kazanım ve yeni toplamı görür.

### Sonuç durumları

- `KAZANILDI`: Puan kullanılabilir.
- `INCELEMEDE`: Puan henüz harcanamaz.
- `DAHA_ONCE_KULLANILMIS`: Yeni puan oluşturulmaz.
- `GECERSIZ_KOD`: Kod bulunamadı veya bütünlük kontrolünden geçmedi.
- `AKTIF_DEGIL`: Parti henüz etkin değil, durdurulmuş veya geri çağrılmış.
- `UYGUN_DEGIL`: Ürün/kullanıcı/bölge/kampanya şartı sağlanmadı.
- `IADE_EDILMIS`: İade edilmiş satışa ait kod.

### Yarış koşulu

İki kişi aynı kodu aynı anda gönderirse veritabanı düzeyindeki benzersizlik ve kilitleme
sayesinde yalnızca biri başarılı olur. Ekran kontrolü tek başına yeterli kabul edilmez.

## 4. Bayide satış–usta eşleştirme

1. Bayi çalışanı şube kapsamıyla giriş yapar.
2. Ustanın kısa ömürlü üyelik QR'ını okutur.
3. Sistem minimum kimlik teyidini gösterir.
4. Çalışan satış referansı, ürün ve miktarı girer veya yetkili kaynaktan seçer.
5. Sistem aynı satışın daha önce eşleştirilip eşleştirilmediğini kontrol eder.
6. Çalışan özeti onaylar.
7. Eşleştirme kaydı oluşturulur ve ustaya bildirim gönderilir.
8. Puan için eşleştirme zorunluysa ilgili kazanım süreci tetiklenir; değilse kanıt olarak bağlanır.

Satışın hangi ustaya ait olduğu konusunda itiraz varsa çalışan mevcut eşleşmeyi sessizce
değiştiremez; iptal/inceleme süreci başlatılır.

## 5. Ödül veya kupon oluşturma

1. Usta ödül ayrıntısını açar.
2. Sistem anlık uygunluk, stok, puan ve hesap/risk durumunu kontrol eder.
3. Kullanıcı koşulları ve harcanacak puanı onaylar.
4. İşlem anahtarıyla ödül talebi oluşturulur.
5. Puan, tek işlem içinde harcama hareketiyle düşürülür veya rezerv edilir.
6. Dijital sağlayıcı gerekiyorsa talep güvenilir kuyruğa yazılır.
7. Başarılı üretimde kupon yalnızca güvenli görüntüleme biçiminde kullanıcıya sunulur.
8. Sağlayıcı gecikirse durum `HAZIRLANIYOR` olur; tekrar tıklama yeni harcama oluşturmaz.
9. Kesin hata durumunda rezervasyon çözülür veya ters puan hareketi oluşturulur.

## 6. Bayi kupon doğrulama ve teslim

Doğrulama ile kullanım aynı işlem değildir:

1. Bayi kuponu okutur; sistem yalnızca geçerlilik ve kapsam bilgisini döndürür.
2. Çalışan ödülü fiziksel olarak hazırlar ve usta bilgisini teyit eder.
3. Çalışan “teslim ettim” onayı verir.
4. Sistem kuponu atomik biçimde `KULLANILDI` yapar ve teslim kaydı oluşturur.
5. İkinci kullanım girişimi reddedilir.
6. Usta ve bayi işlem numarasını görür.

Bu ayrım, yalnızca fiyat/ürün kontrolü yapmak isteyen çalışanın kuponu yanlışlıkla tüketmesini
önler.

## 7. İade ve puan geri alma

1. Bayi/entegrasyon orijinal satış veya kazanım işlemini bulur.
2. İade edilen miktar, neden, zaman ve kaynak kaydedilir.
3. Sistem daha önce yapılan iadeleri ve azami iade miktarını kontrol eder.
4. Puan etkisi, orijinal kural sürümüne göre hesaplanır.
5. Orijinal hareket değiştirilmez; ona referans veren negatif ters hareket oluşturulur.
6. Kullanılabilir bakiye yeterliyse puan düşer.
7. Bakiye yetersizse açık karar K-005'teki politika uygulanır.
8. İlgili kupon/ödül kullanılmamışsa iptal olasılığı değerlendirilir.
9. İşlem risk kontrolüne ve kullanıcı bildirimine gönderilir.

### Neden eski hareketi silmiyoruz?

Silmek, geçmişte bakiyenin neden farklı göründüğünü açıklamayı imkânsızlaştırır. Ters hareket,
hem muhasebe benzeri iz bırakır hem de hatalı iadenin tekrar tersine çevrilmesine imkân verir.

## 8. Kampanya oluşturma ve yayınlama

1. Yetkili kişi kampanya taslağı oluşturur.
2. Ürün, hedef kitle, bölge/bayi, tarih, kazanım formülü ve bütçe sınırı tanımlar.
3. Sistem tarih ve kural çakışmalarını gösterir.
4. Yönetici örnek işlemler üzerinde sonuç önizlemesi yapar.
5. Yüksek etkili kampanya ikinci yetkili tarafından onaylanır.
6. Kampanya zamanlanır; başlangıçta sürüm değişmeden etkinleşir.
7. Her puan işlemi kullandığı kampanya/kural sürümünü kaydeder.
8. Erken durdurma yeni işlemleri etkiler; geçmiş kazanımlar otomatik silinmez.

Örnek: “Belirli ürün ağustosta iki kat puan versin” kuralı ürün, tarih aralığı, çarpan,
uygun kitle ve üst limit alanlarıyla panelden tanımlanır; kod yayını gerekmez.

## 9. Şüpheli işlem incelemesi

1. Bir kural veya kullanıcı/bayi bildirimi risk vakası oluşturur.
2. Vaka ilişkili hesap, cihaz, kod, bayi, satış ve kuponları bağlar.
3. Risk görevlisi yalnızca görev için gereken veriyi görür.
4. Karar: serbest bırak, ek bilgi iste, işlemi reddet, hesabı geçici kısıtla veya üst incelemeye gönder.
5. Karar gerekçesi ve kullanılan kanıt kaydedilir.
6. Puan etkisi gerekiyorsa ayrı ve referanslı hareket oluşturulur.
7. Kullanıcıya paylaşılabilir düzeyde sonuç ve itiraz yolu bildirilir.

## 10. Zayıf internet ve tekrar deneme

- Kamera okuması cihazda yapılabilir; kodun geçerlilik kararı çevrimdışı verilmez.
- Gönderilemeyen talep şifreli yerel kuyrukta sınırlı süre tutulabilir.
- Kullanıcı “gönderilmedi”, “gönderiliyor”, “sunucuda alındı” durumlarını ayırt edebilir.
- Bağlantı gelince aynı işlem anahtarıyla yeniden gönderilir.
- Kupon kullanımı ve ödül teslimi MVP'de kesin sunucu onayı olmadan tamamlanmaz.
- Çevrimdışı ekranda eski bakiye gösterilirse son güncellenme zamanı açıkça belirtilir.

## 11. Destek talebi

1. Kullanıcı kategori ve mümkünse ilişkili işlem seçer.
2. Açıklama güvenli uzunluk ve içerik kontrolünden geçer.
3. Talep numarası ve hedeflenen süreç gösterilir.
4. Operasyon rol ve veri minimizasyonuna uygun bağlamı görür.
5. Her durum ve yanıt değişikliği zaman damgasıyla kaydedilir.
6. Talep kapanırken çözüm kodu seçilir; kullanıcı yeniden açma/itiraz yolunu görür.

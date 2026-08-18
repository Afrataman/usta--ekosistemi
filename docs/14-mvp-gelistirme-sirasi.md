# 14 — MVP Geliştirme Sırası

**Sürüm:** 0.1
**Durum:** Taslak

Bu belge takvim veya iş gücü tahmini değildir. Gereksinimleri güvenli geliştirme sırasına koyar,
hangi işin hangisine bağlı olduğunu ve her aşamanın ne zaman tamamlanmış sayılacağını açıklar.

## Neden önce geliştirme sırası?

Ekranları birbirinden bağımsız yapmak hızlı görünür; ancak puan defteri hazır değilken ödül ekranı,
yetkilendirme hazır değilken yönetici paneli geliştirmek sonradan yeniden çalışma üretir. Aşağıdaki
sıra önce güven ve veri bütünlüğünü, sonra kullanıcı özelliklerini kurar.

## Genel bağımlılık zinciri

```text
Kararlar ve pilot girdileri
        ↓
Temel altyapı + kimlik + yetki
        ↓
Ürün ve tek kullanımlık kod
        ↓
Puan defteri + kural motoru
        ↓
Ödül + kupon + bayi teslimi
        ↓
İade + risk + destek
        ↓
Yönetim + raporlama + pilot hazırlığı
```

Bazı işler paralel yürüyebilir; ancak bağımlı modülün sözleşmesi kesinleşmeden üretim uygulaması
başlatılmamalıdır.

## E0 — Karar ve pilot hazırlığı

### Amaç

Yazılımın cevaplamaması gereken ticari ve hukuki kararları kapatmak.

### İşler

- K-001–K-008 için ilgili ekip onaylarını toplamak.
- K-009–K-016 için gerçek pilot verilerini toplamak.
- Pilot bölge, bayi, ürün ve yaklaşık kod sayısını belirlemek.
- Puan bütçesi ve ilk ödül kataloğunu onaylamak.
- Hukuki metinlerin hazırlanma sorumlularını ve tarihini belirlemek.
- Destek ve risk karar sahiplerini atamak.

### Çıkış ölçütü

- Tüm P0 kararlar onaylı veya kontrollü geçici karara sahip.
- Pilot formundaki kritik alanlar doldurulmuş.
- Belirsiz kalan konu için sorumlu, tarih ve yayın engeli belirlenmiş.

## E1 — Proje temeli, güvenlik ve kalite kapıları

### Amaç

Sonraki her modülün kullanacağı güvenli geliştirme ve yayın temelini kurmak.

### İşler

- Modüler monolit proje iskeleti ve modül bağımlılık kuralları.
- Ortam yapılandırması ve gizli anahtar yönetimi.
- Veritabanı migration düzeni.
- Yapılandırılmış log, ilişkilendirme numarası ve hata yönetimi.
- GitHub Actions: biçim, derleme, test, bağımlılık ve sır taraması.
- Yerel geliştirme ve test ortamı.
- Sağlık kontrolü, yedek ve geri yükleme yaklaşımı.
- Temel güvenlik başlıkları ve hız sınırı altyapısı.

### İlgili gereksinimler

`AUD-001`, `AUD-002`, `OPS-001`, `OPS-002`

### Çıkış ölçütü

- Boş uygulama güvenli biçimde derlenip test ortamına alınabiliyor.
- Başarısız kontrol varken PR birleştirilemiyor.
- Bir örnek istek log ve metrikte aynı işlem numarasıyla izlenebiliyor.
- Gizli anahtar kaynak kodda bulunmuyor.

## E2 — Kimlik, profil, izin ve yetki

### Amaç

Usta ve çalışanların güvenli giriş yapması; her rolün yalnızca kendi verisine erişmesi.

### İşler

- Telefon numarası standartlaştırma.
- OTP oluşturma, güvenli saklama, süre ve tek kullanım.
- SMS sağlayıcı adaptörü ve sahte sağlayıcıyla test.
- Oturum oluşturma, yenileme ve iptal.
- Usta asgari profil akışı.
- Hukuki metin sürümü ve ayrı kullanıcı kararları.
- Rol, izin ve bayi/şube kapsamı.
- Telefon değiştirme ve hesap kurtarma taslağı.
- Yönetici/bayi için daha güçlü kimlik doğrulama hazırlığı.

### İlgili gereksinimler

`USTA-AUTH-001`, `USTA-AUTH-002`, `USTA-AUTH-003`, `USTA-PROF-001`,
`USTA-PROF-002`, `USTA-PROF-003`

### Çıkış ölçütü

- Yeni usta SMS ile kayıt olup profilini tamamlayabiliyor.
- Kod tekrar kullanılamıyor ve açık biçimde loglanmıyor.
- Bayi çalışanı başka şubenin verisine erişemiyor.
- Hukuki metin sürümü ve ayrı tercihler kanıtlanabiliyor.

## E3 — Ürün, kod partisi ve satış bağlantısı

### Amaç

Her ürün kodunu güvenli, tek kullanımlık ve partiye kadar izlenebilir yapmak.

### İşler

- Ürün ve ürün grubu yönetimi.
- Kod partisi üretme/yükleme ve ön doğrulama.
- Güvenli kod oluşturma ve arama temsili.
- Parti etkinleştirme, durdurma ve geri çağırma.
- QR okuma ve elle giriş için ortak doğrulama API'si.
- Kod talebi durumları ve kullanıcı açıklamaları.
- Bayi, şube, çalışan ve satış modeli.
- Usta üyelik QR'ı ve satış eşleştirme.
- Aynı kod/satış için veritabanı benzersizlik kuralları.

### İlgili gereksinimler

`USTA-CODE-001`–`USTA-CODE-005`, `DEAL-SALE-001`–`DEAL-SALE-003`

### Çıkış ölçütü

- QR ve elle giriş aynı kod için aynı sonucu üretiyor.
- Eşzamanlı iki talepte yalnızca bir başarılı kullanım oluşuyor.
- Kullanılan kod ürün, parti, usta ve varsa satışa kadar izlenebiliyor.
- Başka şube adına satış eşleştirilemiyor.

## E4 — Puan defteri

### Amaç

Her puan değişikliğini açıklanabilir, ters çevrilebilir ve yarış koşullarına dayanıklı kaydetmek.

### İşler

- Ekleme mantıklı puan hareketleri.
- Kullanılabilir, bekleyen ve rezerveli bölümler.
- Kaynak işlem ve ters hareket bağlantısı.
- Tekrar önleme anahtarı.
- Bakiye hesaplama ve mutabakat kontrolü.
- Usta cüzdanı ve hareket ayrıntısı.
- Yetkili düzeltme süreci ve denetim kaydı.

### İlgili gereksinimler

`PTS-LEDG-001`, `PTS-LEDG-002`, `PTS-LEDG-003`

### Çıkış ölçütü

- Bakiye hareketlerden yeniden hesaplandığında aynı sonuç çıkıyor.
- Aynı kaynak işlem ikinci puan hareketi oluşturmuyor.
- Hiçbir görevli geçmiş hareket miktarını sessizce değiştiremiyor.
- Kullanıcı her hareketin nedenini ve işlem numarasını görebiliyor.

## E5 — Puan kuralı, kampanya ve seviye

### Amaç

Puan ve kampanya davranışını kod yayını olmadan, sürümlü ve bütçe kontrollü yönetmek.

### İşler

- Temel ürün puanı sürümleri.
- Kitle, ürün, bayi/bölge ve tarih koşulları.
- Sabit bonus ve çarpan sonuçları.
- Birleşebilirlik, öncelik ve üst limitler.
- Taslak, önizleme, onay, zamanlama ve durdurma.
- Kural çakışma ve örnek işlem simülasyonu.
- Nitelikli faaliyet ve seviye dönemleri.
- Seviye ekranı ve avantaj sürümü.

### İlgili gereksinimler

`PTS-RULE-001`–`PTS-RULE-005`, `PTS-LVL-001`, `PTS-LVL-002`

### Çıkış ölçütü

- Yetkili yönetici “bu ürün ağustosta iki kat puan” kuralını kod değişmeden oluşturabiliyor.
- Aktif kural yerinde değiştirilemiyor; yeni sürüm oluşuyor.
- Aynı girdiler ve sürüm aynı puanı üretiyor.
- Harcanan ödül seviyesi düşürmüyor.

## E6 — Ödül, kupon ve güvenilir dış teslim

### Amaç

Puanı tek seferde, güvenli ve izlenebilir ödüle dönüştürmek.

### İşler

- Sürümlü ödül kataloğu ve uygunluk.
- Dijital/bayi ödülü ayrımı.
- Puan rezervasyonu ve ödül siparişi.
- Dış sağlayıcı adaptörü ve outbox kuyruğu.
- Kupon oluşturma, maskeleme ve güvenli saklama.
- Bayi kupon doğrulama.
- Doğrulama ile teslim onayının ayrılması.
- Tek başarılı kupon kullanımı.
- Sağlayıcı hatasında rezervasyon çözme/telafi.

### İlgili gereksinimler

`RWD-CAT-001`, `RWD-ORD-001`, `RWD-ORD-002`, `RWD-CPN-001`–`RWD-CPN-004`,
`OPS-001`

### Çıkış ölçütü

- Çift tıklama tek harcama ve tek kupon üretiyor.
- Kuponu kontrol etmek kuponu tüketmiyor.
- İki bayi aynı kuponu eşzamanlı teslim edemiyor.
- Dış sağlayıcı kesintisi puanı kaybettirmiyor.

## E7 — İade ve puan geri alma

### Amaç

Geçerli ticari iadeyi geçmişi silmeden doğru puan etkisine dönüştürmek.

### İşler

- Satış ve kısmi iade bağlantısı.
- Toplam iade miktarı kontrolü.
- Orijinal kural sürümüne göre ters puan hareketi.
- Puan açığı ve ödül kısıtlama davranışı.
- İade bildirimi, kullanıcı açıklaması ve itiraz.
- Geç iade metriği ve risk sinyali.

### İlgili gereksinimler

`RET-001`, `RET-002`, `RET-003`

### Çıkış ölçütü

- Kısmi iade yalnızca ilgili miktarı etkiliyor.
- Aynı miktar iki kez iade edilemiyor.
- Orijinal puan hareketi silinmiyor.
- Harcanmış puan sonrası açık doğru ve anlaşılır gösteriliyor.

## E8 — Risk, destek ve bildirim

### Amaç

Şüpheli işlemleri kullanıcıyı gereksiz cezalandırmadan incelemek ve sorunları izlenebilir çözmek.

### İşler

- Kesin ret ve olasılıksal risk kurallarının ayrılması.
- Risk olayı, vaka ve ilişkili kayıt ağı.
- Bekleyen puan ve insan incelemesi.
- Karar, gerekçe, kanıt ve itiraz yolu.
- Destek talebi, kategori, öncelik ve hedef süre.
- Destek görevlisi yetki sınırları.
- Uygulama içi işlem ve kampanya bildirimleri.
- Hassas veriyi sızdırmayan bildirim bağlantıları.

### İlgili gereksinimler

`RISK-001`, `RISK-002`, `RISK-003`, `SUP-001`, `SUP-002`, `OPS-003`

### Çıkış ölçütü

- Kesin olmayan sinyal hesabı otomatik kalıcı kapatmıyor.
- Risk görevlisi kararını gerekçesiz tamamlayamıyor.
- Destek görevlisi puanı doğrudan değiştiremiyor.
- Kullanıcı işlem numarasıyla itiraz edebiliyor.

## E9 — Yönetim, raporlama ve çevrimdışı dayanıklılık

### Amaç

Operasyonun sistemi kod değişmeden yönetmesi ve zayıf bağlantıda çift işlem oluşmaması.

### İşler

- Usta, bayi, çalışan, ürün ve kod yönetimi.
- Kampanya, ödül ve kupon operasyon ekranları.
- İade ve risk kuyruğu.
- Maskeli, yetkili raporlar ve dışa aktarma denetimi.
- Usta PWA önbellek ve son güncellenme davranışı.
- Güvenli yerel tekrar kuyruğu.
- Service worker sürüm geçişi.
- Yönetici işlem geçmişi.

### İlgili gereksinimler

`OFF-001`, `OFF-002`, `OFF-003`, `AUD-001`, `AUD-002`, `OPS-002`

### Çıkış ölçütü

- İnternet kesilip gelen istek çift puan üretmiyor.
- Eski bakiye güncellik zamanıyla gösteriliyor.
- Sunucu onayı olmadan kupon teslim edilmiş görünmüyor.
- Rapor başka bayi veya yetkisiz kişisel veri göstermiyor.

## E10 — Pilot yayın hazırlığı

### Amaç

Teknik olarak çalışan sistemi kontrollü gerçek kullanıcı pilotuna hazır hâle getirmek.

### İşler

- Pilot ürün kodu partisi ve kontrollü test kodları.
- Bayi çalışanı eğitimi ve kısa kullanım rehberi.
- Usta kapalı beta daveti.
- Destek karar ağaçları ve eskalasyon listesi.
- Güvenlik, yük, yarış koşulu ve geri yükleme testleri.
- İzleme panelleri ve alarm sahipleri.
- Puan/ödül bütçe alarmı.
- Özellik kapatma ve geri alma planı.
- Hukuk ve pilot yayın kontrol listesi.

### Çıkış ölçütü

`07-kalite-kriterleri.md` ve `13-pilot-veri-toplama-formu.md` içindeki kritik yayın kapılarının
tamamı kanıtla `Evet` durumundadır.

## Paralel yürütülebilecek işler

- Hukuki metinler, E1–E3 teknik hazırlıkla paralel hazırlanabilir; E2 kabulü ve pilot öncesi gerekir.
- Görsel tasarım, ekran envanteri onaylandıktan sonra E1 ile paralel ilerleyebilir.
- Kod baskı/etiket pilotu, E3 yazılım geliştirmesiyle paralel test edilebilir.
- Ödül sağlayıcı görüşmeleri E4 sırasında başlayabilir; E6 başlamadan sözleşme kesinleşmelidir.
- Bayi eğitimi taslağı E7–E9 sırasında hazırlanabilir.

## Henüz yapılmaması gerekenler

- Mikroservislere bölmek,
- Yerel mobil uygulama geliştirmek,
- Onaylı Usta ve müşteri eşleştirme kodlamak,
- Dijital garanti geliştirmek,
- Gerçek veri olmadan seviye ve puan eşiklerini sabitlemek,
- Hukuk onayı olmadan kayıt ekranı metinlerini üretime almak,
- Test ve izleme olmadan pilot kullanıcı açmak.

## Tahmin ne zaman yapılır?

Takvim ve ekip tahmini şu bilgilerden sonra hazırlanmalıdır:

- Teknoloji mimarisi onaylı,
- Pilot formunun kritik alanları dolu,
- SMS ve ödül sağlayıcısı biliniyor,
- Kod üretim yöntemi seçilmiş,
- Tasarım derinliği ve entegrasyon sınırı net,
- Geliştirme ve test ekibi kapasitesi biliniyor.

Bu koşullar oluşmadan verilen tarih, plan değil temennidir.

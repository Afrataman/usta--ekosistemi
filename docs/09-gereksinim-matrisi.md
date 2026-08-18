# 09 — MVP Gereksinim Matrisi

**Sürüm:** 0.1
**Durum:** Taslak

Bu matris ayrıntılı belgelerin yerine geçmez. Her bağlayıcı MVP gereksinimine sabit bir kimlik
verir ve nerede tasarlanıp nasıl doğrulanacağını gösterir.

## Öncelikler

- **Zorunlu:** Pilotun güvenli ve anlamlı çalışması için gereklidir.
- **Gerekli:** MVP kapsamında bulunur; yayın planında sıralanabilir.
- **Tercihli:** Zaman/bütçe uygunsa MVP içinde, aksi hâlde kontrollü biçimde ertelenebilir.

## 1. Kimlik ve profil

| Kimlik | Öncelik | Gereksinim | Ekran/Akış | Doğrulama özeti |
|---|---|---|---|---|
| USTA-AUTH-001 | Zorunlu | Usta, telefon ve 6 haneli SMS koduyla kayıt/giriş yapabilmelidir. | U-01, U-02; Akış 2 | Geçerli, yanlış, süresi dolmuş ve tekrar kullanılan kod testleri |
| USTA-AUTH-002 | Zorunlu | SMS gönderim ve doğrulama denemeleri telefon, cihaz ve ağ bağlamında sınırlandırılmalıdır. | U-01, U-02; Güvenlik 2 | Hız sınırı ve maliyet saldırısı testi |
| USTA-AUTH-003 | Zorunlu | OTP açık metin olarak veri tabanında, logda veya destek ekranında bulunmamalıdır. | Güvenlik 2 | Log/veri taraması |
| USTA-PROF-001 | Zorunlu | Yeni usta ad, soyad, il ve ilçe ile asgari profil oluşturabilmelidir. | U-03 | Zorunlu alan ve doğrulama testleri |
| USTA-PROF-002 | Zorunlu | Aydınlatma, açık rıza ve ticari ileti tercihleri amaç ve sürüm bazında ayrı kaydedilmelidir. | U-03, U-16 | Metin sürümü, ret ve geri çekme testleri |
| USTA-PROF-003 | Gerekli | Telefon değişikliği ek doğrulama ve güvenlik bildirimi gerektirmelidir. | U-16 | Hesap ele geçirme senaryosu |

## 2. Ürün kodu ve satış

| Kimlik | Öncelik | Gereksinim | Ekran/Akış | Doğrulama özeti |
|---|---|---|---|---|
| USTA-CODE-001 | Zorunlu | Usta ürün kodunu kamera ile okutabilmelidir. | U-05; Akış 3 | Kamera izin ve başarılı okuma testi |
| USTA-CODE-002 | Zorunlu | Usta aynı ürün kodunu elle girebilmelidir. | U-06; Akış 3 | QR ve elle giriş eşdeğerlik testi |
| USTA-CODE-003 | Zorunlu | Bir ürün kodu en fazla bir başarılı puan kazanımı üretmelidir. | U-07; Akış 3 | Eşzamanlı çift kullanım testi |
| USTA-CODE-004 | Zorunlu | Sonuç; başarılı, incelemede, kullanılmış, geçersiz, aktif değil, uygun değil ve iade edilmiş durumlarını ayırmalıdır. | U-07 | Her durum için API/UI testi |
| USTA-CODE-005 | Zorunlu | Kod doğrulama kullanılan ürün, parti, satış ve kural sürümüne kadar izlenebilmelidir. | Y-04, Y-13 | Denetim izi testi |
| DEAL-SALE-001 | Zorunlu | Yetkili bayi çalışanı ustanın üyelik QR'ını doğrulayabilmelidir. | B-03; Akış 4 | Süresi geçmiş/kopyalanmış QR testi |
| DEAL-SALE-002 | Zorunlu | Yetkili bayi çalışanı satışı ustayla yalnızca kendi şube kapsamında eşleştirebilmelidir. | B-04; Akış 4 | Şubeler arası yetki testi |
| DEAL-SALE-003 | Zorunlu | Aynı satış veya satış kalemi mükerrer eşleştirmeye karşı korunmalıdır. | B-04 | Tekrar ve yarış koşulu testi |

## 3. Puan, kampanya ve seviye

| Kimlik | Öncelik | Gereksinim | Ekran/Akış | Doğrulama özeti |
|---|---|---|---|---|
| PTS-LEDG-001 | Zorunlu | Puan bakiyesi silinmeyen, referanslı hareketlerden hesaplanmalıdır. | U-08, U-09; Puan 2 | Bakiye yeniden hesaplama testi |
| PTS-LEDG-002 | Zorunlu | Kullanılabilir, bekleyen ve rezerveli puanlar ayrılmalıdır. | U-08 | Durum geçiş testleri |
| PTS-LEDG-003 | Zorunlu | İnsan kaynaklı düzeltme aktör, gerekçe ve ters kayıt ilişkisi taşımalıdır. | Y-02, Y-13 | Yetki ve denetim testi |
| PTS-RULE-001 | Zorunlu | Puan sunucuda ve değişmez kural sürümüne göre hesaplanmalıdır. | Akış 3; Puan 3 | Aynı girdi/aynı sonuç testi |
| PTS-RULE-002 | Zorunlu | Yetkili yönetici ürün, kitle, bölge/bayi ve tarih koşullu sabit/çarpan kampanyası tanımlayabilmelidir. | Y-05, Y-06; Akış 8 | Ağustos iki kat puan senaryosu |
| PTS-RULE-003 | Zorunlu | Sistem kampanya çakışmasını, birleşebilirliği, önceliği ve limitleri uygulamalıdır. | Y-05; Puan 5 | Çakışma matrisi testleri |
| PTS-RULE-004 | Zorunlu | Aktif kural yerinde değiştirilmemeli; değişiklik yeni sürüm oluşturmalıdır. | Y-05, Y-13 | Geçmiş işlem değişmezliği testi |
| PTS-RULE-005 | Zorunlu | Yüksek etkili kampanya ikinci yetkili onayı gerektirmelidir. | Y-06 | Görevler ayrılığı testi |
| PTS-LVL-001 | Gerekli | Usta Bronz, Gümüş veya Altın seviyesini ve sonraki eşiği görebilmelidir. | U-04, U-10 | Dönem/eşik sınır testleri |
| PTS-LVL-002 | Zorunlu | Ödül harcamak seviye ölçüsünü düşürmemelidir. | Puan 7 | Harcama sonrası seviye testi |

## 4. Ödül ve kupon

| Kimlik | Öncelik | Gereksinim | Ekran/Akış | Doğrulama özeti |
|---|---|---|---|---|
| RWD-CAT-001 | Zorunlu | Usta yalnızca kendisi için geçerli ödülleri puan bedeli ve koşullarıyla görebilmelidir. | U-11, U-12 | Bölge/seviye/stok testleri |
| RWD-ORD-001 | Zorunlu | Ödül talebi puan harcaması veya rezervasyonuyla güvenilir biçimde bağlanmalıdır. | U-12; Akış 5 | Sağlayıcı hata ve tekrar testi |
| RWD-ORD-002 | Zorunlu | Aynı talebin tekrarı ikinci puan harcaması veya kupon üretmemelidir. | U-12; Akış 5 | Çift tıklama/eşzamanlılık testi |
| RWD-CPN-001 | Zorunlu | Kupon tek kullanımlık, süreli ve bayi/kanal kapsamlı olabilmelidir. | U-13, B-05 | Kapsam ve süre testleri |
| RWD-CPN-002 | Zorunlu | Kupon doğrulamak kuponu tüketmemeli; teslim ayrı onaylanmalıdır. | B-05, B-06; Akış 6 | Doğrula/teslim durum testi |
| RWD-CPN-003 | Zorunlu | Aynı kupon yalnızca bir başarılı teslim oluşturmalıdır. | B-06 | Eşzamanlı çift teslim testi |
| RWD-CPN-004 | Zorunlu | Hassas kupon değeri listelerde, loglarda ve PWA önbelleğinde açık bulunmamalıdır. | U-13; Güvenlik 7-8 | Veri sızıntısı taraması |

## 5. İade, risk ve destek

| Kimlik | Öncelik | Gereksinim | Ekran/Akış | Doğrulama özeti |
|---|---|---|---|---|
| RET-001 | Zorunlu | İade orijinal satış/kalem ve puan hareketine bağlanmalıdır. | B-07, Y-09; Akış 7 | Tam ve kısmi iade testi |
| RET-002 | Zorunlu | İadenin puan etkisi orijinal kural sürümüne göre ters hareketle kaydedilmelidir. | U-09; Akış 7 | Kural değişikliği sonrası iade testi |
| RET-003 | Zorunlu | Toplam iade miktarı orijinal satış miktarını aşmamalıdır. | B-07 | Tekrarlı/kısmi iade testi |
| RISK-001 | Zorunlu | Şüpheli işlem sinyalleri kullanıcı, bayi, kod, satış ve kupon ilişkileriyle vaka oluşturabilmelidir. | Y-10; Akış 9 | Çoklu sinyal ilişkilendirme testi |
| RISK-002 | Zorunlu | İnceleme kararı aktör, gerekçe, kanıt ve puan etkisiyle kaydedilmelidir. | Y-10, Y-13 | Denetim ve yetki testi |
| RISK-003 | Gerekli | Usta, paylaşılabilir ölçüde karar bilgisi ve itiraz yolu görebilmelidir. | U-07, U-15 | Kısıtlı hesap/itiraz testi |
| SUP-001 | Gerekli | Usta ilişkili işlemle destek talebi oluşturup durum ve yanıt geçmişini izleyebilmelidir. | U-15; Akış 11 | Talep yaşam döngüsü testi |
| SUP-002 | Gerekli | Destek görevlisi puanı doğrudan değiştirememeli, yetkili düzeltme sürecine yönlendirmelidir. | Y-11, Y-02 | Yetki testi |

## 6. Çevrimdışı, denetim ve operasyon

| Kimlik | Öncelik | Gereksinim | Ekran/Akış | Doğrulama özeti |
|---|---|---|---|---|
| OFF-001 | Zorunlu | Bağlantı kesintisinde yeniden gönderilen aynı talep çift işlem üretmemelidir. | Akış 10 | Ağ kesme/yeniden gönderme testi |
| OFF-002 | Zorunlu | Eski bakiye gösterildiğinde son güncellenme zamanı görünmelidir. | U-04, U-08 | Çevrimdışı UI testi |
| OFF-003 | Zorunlu | Kesin sunucu onayı olmadan kupon kullanımı veya ödül teslimi başarılı gösterilmemelidir. | B-06; Akış 10 | Sunucu kesintisi testi |
| AUD-001 | Zorunlu | Kritik kullanıcı ve yönetici işlemleri aktör, zaman, hedef, eylem ve gerekçeyle kaydedilmelidir. | Y-13; Güvenlik 10 | Denetim kapsam testi |
| AUD-002 | Zorunlu | Raporlar rol/kapsam kontrolü ve varsayılan kişisel veri maskelemesi uygulamalıdır. | Y-12 | Yetki ve maskeleme testi |
| OPS-001 | Zorunlu | Başarısız dış servis işleri kaybolmamalı; izlenebilir yeniden deneme kuyruğuna girmelidir. | Veri modeli 9 | Outbox/yeniden başlatma testi |
| OPS-002 | Zorunlu | Kritik akışlar ortak işlem numarasıyla uçtan uca izlenebilmelidir. | Kalite 6 | Log/metric ilişkilendirme testi |
| OPS-003 | Gerekli | Usta, bayi ve yöneticilere hedefli uygulama içi bildirim gönderilebilmelidir. | U-14, Y-06 | Hedefleme ve güvenli bağlantı testi |

## 7. İzlenebilirlik kullanım kuralı

Kodlama başladığında:

- İş kartı en az bir gereksinim kimliği taşımalıdır.
- API veya veri modeli değişikliği ilgili kimlikleri belirtmelidir.
- Otomatik test adı veya etiketi gereksinim kimliğine bağlanmalıdır.
- Gereksinim değişirse etkilenen ekran, akış, veri ve testler birlikte gözden geçirilmelidir.
- Kapsamdan çıkarılan gereksinim silinmez; karar kaydıyla ertelenmiş olarak işaretlenir.

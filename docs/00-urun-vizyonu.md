# 00 — Ürün Vizyonu

**Sürüm:** 0.1
**Durum:** Taslak
**Son güncelleme:** 18 Ağustos 2026

## 1. Ürün tanımı

Tek hesap altyapısı altında aşamalı olarak büyüyen üç katman kurulacaktır:

1. **Usta Kulübü:** Kolay katılım, ürün kodu doğrulama, puan ve ödül.
2. **Onaylı Usta Ağı:** Belge, eğitim ve kalite şartlarını sağlayan ustaların müşterilerle buluşması.
3. **Dijital Garanti:** Yalnızca uygun ürün, usta ve iş türlerinde doğrulanabilir uygulama garantisi.

MVP yalnızca Usta Kulübü'nün güvenilir işlem çekirdeğini, bayi bağlantısını ve yönetim
araçlarını kapsar. Diğer iki katman daha sonra aynı kimlik ve işlem altyapısı üzerinde büyür.

### Neden bu sıra?

Usta Ağı ve Dijital Garanti; doğrulanmış kimlik, güvenilir işlem geçmişi, eğitim ve kalite
verisi ister. Usta Kulübü önce bu güven temelini ve düzenli kullanıcı ilişkisini oluşturur.

## 2. Ürün vaadi

> Usta, satın aldığı veya uyguladığı uygun ürünleri kolayca doğrular; anlaşılır puan kazanır
> ve ödülünü hızlıca alır. Bayi, satış ve teslimat süreçlerine güvenle katılır. Marka ise
> tüm hareketleri denetlenebilir kurallarla yönetir.

## 3. Değişmez ürün ilkeleri

1. Puan gerçek para veya çekilebilir nakit bakiye gibi gösterilmez.
2. Kullanıcı, puanla ulaşabileceği ödül değerini anlaşılır biçimde görür.
3. Her ürün kodu en fazla bir başarılı kazanım işlemine kaynak olur.
4. QR okunamazsa aynı kod elle girilebilir; iki yöntem aynı doğrulama sürecini kullanır.
5. İade edilen işlemin puanı iz bırakacak şekilde geri alınabilir.
6. Puan bakiyesi doğrudan değiştirilmez; hareketlerden hesaplanır.
7. Kampanya kuralları kod yayını olmadan, yetkili yönetici tarafından tanımlanabilir.
8. Kural değişiklikleri geriye dönük olarak sessizce uygulanmaz.
9. Dijital ödüller mümkün olan en kısa sürede teslim edilir.
10. Zayıf bağlantı işlemi kaybettirmez veya iki kez gerçekleştirmez.
11. Hassas yönetici işlemleri kim, ne zaman, neden yaptı bilgisiyle kaydedilir.
12. Bayinin sisteme katılması ölçülebilir bir faydaya dayanır.

## 4. MVP hedefleri

- Ustanın telefonla hızlı ve güvenli biçimde üye olabilmesi.
- Ürün kodunun tek seferlik ve izlenebilir şekilde doğrulanması.
- Kazanılan, harcanan, bekleyen ve geri alınan puanların açıklanabilmesi.
- Dijital ödül veya bayi kuponunun güvenle oluşturulup teslim edilebilmesi.
- Bayi satış eşleştirme ve ödül teslim süreçlerinin denetlenebilmesi.
- Kampanyaların yazılım değişikliği olmadan yönetilebilmesi.
- Şüpheli işlemlerin otomatik işaretlenip insan incelemesine sunulabilmesi.

## 5. Başarı ölçütleri

Pilot başlamadan hedef değerleri ürün sahibi belirleyecektir. Ölçülecek asgari göstergeler:

| Gösterge | Neden ölçülür? |
|---|---|
| SMS doğrulama başarı oranı | Katılımın ilk engelini gösterir. |
| Kayıttan ilk geçerli koda kadar geçen süre | Ustanın değeri ne kadar çabuk gördüğünü gösterir. |
| İlk ödüle ulaşma süresi | Ödül ekonomisinin erişilebilirliğini gösterir. |
| QR/elle kod başarı ve hata oranları | Paket ve kamera deneyimindeki sorunları gösterir. |
| Kupon oluşturma–teslim tamamlama oranı | Ödül sözünün gerçekten tutulduğunu gösterir. |
| İtiraz ve destek talebi oranı | Kural anlaşılabilirliğini ve operasyon kalitesini gösterir. |
| Şüpheli işlem oranı ve doğrulanmış suistimal oranı | Risk motorunun etkinliğini gösterir. |
| Aktif bayi oranı | Bayi değer önerisinin çalışıp çalışmadığını gösterir. |
| 30/90 günlük usta geri dönüş oranı | Programın kalıcı değerini gösterir. |

## 6. Puanın kullanıcıya gösterimi

Önerilen ana sunum:

> **10.000 puan**
> Bu puanla alabileceğiniz ödüllerin değeri: **500 TL'ye kadar**

“TL karşılığı”, “nakit bakiye”, “hesabınızdaki para” veya “çekilebilir tutar” ifadeleri
kullanılmaz. Değer ifadesi, o anda erişilebilir ödül kataloğuna ve geçerli koşullara dayanır.

## 7. Aşamalar

### Aşama 1 — Usta Kulübü MVP

Bu pakette tanımlanan kapsam.

### Aşama 2 — Eğitim ve Onaylı Usta

Eğitim videoları, sınavlar, belge kontrolü, sertifika ve başvuru değerlendirmesi.

### Aşama 3 — Müşteri ve iş yönetimi

Talep, eşleştirme, teklif, iş takibi, fotoğraf ve kontrol listeleri.

### Aşama 4 — Kontrollü Dijital Garanti

Uygun ürün + onaylı usta + tamamlanmış kontrol listesi + kanıtlar temelinde garanti.

### Aşama 5 — Entegrasyon ve kişiselleştirme

ERP/B2B, CRM, gelişmiş analitik ve ustaya özel kampanya önerileri.

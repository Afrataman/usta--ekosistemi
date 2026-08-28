# 08 — Açık Kararlar

**Sürüm:** 0.1
**Durum:** Taslak

Bu belge hata veya eksiklik listesi değildir. Kodlamadan önce ilgili iş sahibinin karar vermesi
gereken konuları görünür kılar. Her karar kapatılırken karar sahibi, tarih, gerekçe ve etkilenen
belgeler yazılmalıdır.

K-001–K-008 için değerlendirme ve başlangıç önerileri
[11-p0-karar-onerileri.md](11-p0-karar-onerileri.md) belgesinde hazırlanmıştır. Bu öneriler
yetkili karar sahipleri onaylayana kadar bağlayıcı değildir.

**18 Ağustos 2026 ürün sahibi değerlendirmesi:** K-001–K-008 önerileri ürün yönü olarak
prensipte kabul edilmiştir. İlgili üretim, hukuk, mali işler, satış ve operasyon onayları
tamamlanmadan kararlar tamamen kapatılmış sayılmaz. K-009–K-016 için başlangıç önerileri
[12-p1-pilot-karar-onerileri.md](12-p1-pilot-karar-onerileri.md) belgesinde hazırlanmıştır.

## Karar öncelikleri

- **P0:** Karar olmadan güvenli MVP tasarlanamaz.
- **P1:** Geliştirme başlamadan kararlaştırılmalıdır.
- **P2:** Pilot hazırlığına kadar kararlaştırılabilir.

| No | Öncelik | Açık karar | Karar sahibi | Neden gerekli? |
|---|---|---|---|---|
| K-001 | P0 | Ürün kodu pakete üretimde mi basılır, sonradan etiket mi uygulanır? | Üretim + ürün | Kod sızıntısı ve operasyon modelini belirler. |
| K-002 | P0 | Kodu hak eden kişi satın alan usta mı, uygulayan usta mı? | Ürün + hukuk | Sahiplik ihtilafının ana kuralıdır. |
| K-003 | P0 | Bayi eşleştirmesi puan için zorunlu mu, destekleyici kanıt mı? | Satış + ürün | Ustanın bağımsız kod giriş akışını belirler. |
| K-004 | P0 | İade, kod kullanımından sonra hangi kaynaktan ve ne kadar sürede bildirilir? | Mali işler + operasyon | Puan geri alma güvenilirliğini belirler. |
| K-005 | P0 | Harcanmış puan iade edilirse eksi bakiye, hesap kısıtı veya mali telafi politikası nedir? | Mali işler + hukuk | Borç ve kullanıcı itirazı doğurabilir. |
| K-006 | P0 | Puanların geçerlilik süresi olacak mı? | Pazarlama + hukuk | Kullanıcı gösterimi ve muhasebesel yükümlülüğü etkiler. |
| K-007 | P0 | Puan–ödül değerini kim ve hangi sıklıkta değiştirebilir? | Yönetim + mali işler | Güven ve bütçe kontrolü için gereklidir. |
| K-008 | P0 | SMS, ticari ileti ve KVKK metinlerinin onaylı sürümleri nelerdir? | Hukuk | Kayıt akışının yayın ön koşuludur. |
| K-009 | P1 | Bronz/Gümüş/Altın eşikleri ve avantajları nedir? | Pazarlama | Seviye ekranı ve hesaplamayı belirler. |
| K-010 | P1 | İlk ödüle hedeflenen süre ve en düşük ödül maliyeti nedir? | Pazarlama + mali işler | Ödül ekonomisinin erişilebilirliğini belirler. |
| K-011 | P1 | Bayinin somut faydası nedir? | Satış | Aktif bayi katılımı olmadan akış çalışmaz. |
| K-012 | P1 | Kupon yalnızca seçilen bayide mi, tüm uygun bayilerde mi geçerli? | Satış + operasyon | Kupon veri ve doğrulama modelini etkiler. |
| K-013 | P1 | Fiziksel ödül stoku merkezi mi, bayi bazlı mı tutulacak? | Operasyon | Rezervasyon ve teslimat sorumluluğunu belirler. |
| K-014 | P1 | Destek için hedef yanıt ve çözüm süreleri nedir? | Operasyon | Kullanıcı beklentisi ve raporlamayı belirler. |
| K-015 | P1 | Hangi risk sinyalleri otomatik engel, hangileri yalnızca inceleme üretir? | Risk + hukuk | Yanlış engellemelerin etkisini kontrol eder. |
| K-016 | P1 | Pilot il, bayi, ürün grubu ve kullanıcı hedefi nedir? | Yönetim + satış | Kapasite ve yayın planını belirler. |
| K-017 | P2 | Bildirim kanalları yalnızca uygulama içi mi, SMS de kullanılacak mı? | Pazarlama + hukuk | Maliyet ve izin yönetimini etkiler. |
| K-018 | P2 | Rapor dışa aktarmada kişisel veriyi kimler görebilir? | Veri + hukuk | Veri sızıntısı riskini azaltır. |

## Karar kaydı şablonu

Bir karar kapatılırken aşağıdaki biçim kullanılacaktır:

```text
Karar No:
Durum: Onaylandı / Ertelendi / Reddedildi
Karar:
Gerekçe:
Karar sahibi:
Onaylayanlar:
Tarih:
Etkilenen belgeler:
Yeniden değerlendirme koşulu:
```

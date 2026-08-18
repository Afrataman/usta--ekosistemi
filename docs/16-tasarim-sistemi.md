# 16 — Usta Kulübü Tasarım Sistemi

**Sürüm:** 0.1
**Durum:** Onaylı görsel yönü kodlanabilir kurallara dönüştüren taslak

Bu belge, onaylanan mobil konseptin geliştiricinin tahminine bırakılmadan tutarlı biçimde
uygulanmasını sağlar. Görseli piksel piksel kopyalamak yerine tekrar kullanılabilir kurallar ve
bileşenler tanımlar.

## 1. Tasarım karakteri

Usta Kulübü arayüzü:

- Güvenilir ve profesyonel,
- Teknik fakat karmaşık olmayan,
- Koyu lacivert temelli,
- Mavi ana eylem ve turkuaz başarı vurgulu,
- Ödüllerde kontrollü amber kullanan,
- Küçük telefonda tek elle kullanılabilen

bir deneyim olmalıdır.

Arayüz banka veya kripto uygulamasına benzememelidir. Puan kartları güçlü görünebilir; ancak
“bakiye”, “para”, “nakit”, “çek” ve cüzdandan para çekme çağrışımı kullanılmaz.

## 2. Renk değişkenleri

Başlangıç tasarım tokenları:

| Token | Değer | Kullanım |
|---|---|---|
| `--color-bg` | `#061522` | Ana uygulama zemini |
| `--color-bg-elevated` | `#0B2032` | Kart ve yükseltilmiş alan |
| `--color-surface` | `#102A3F` | Form, liste ve ikincil yüzey |
| `--color-border` | `#24445C` | İnce sınır ve ayırıcı |
| `--color-primary` | `#176BFF` | Ana düğme, seçili sekme |
| `--color-primary-hover` | `#0F5CE6` | Fare/klavye etkileşimi |
| `--color-accent` | `#20D6B2` | Başarı, ilerleme, kazanılan puan |
| `--color-reward` | `#F5A623` | Ödül ve seviye vurgusu |
| `--color-danger` | `#F05252` | Hata, geri alınan puan |
| `--color-warning` | `#F6B73C` | Bekleyen ve zayıf bağlantı |
| `--color-text` | `#F7FAFC` | Ana metin |
| `--color-text-muted` | `#A9BAC8` | İkincil açıklama |
| `--color-disabled` | `#607486` | Devre dışı içerik |

### Renk kullanım kuralı

- Bir ekranda tek baskın ana eylem mavi olmalıdır.
- Turkuaz sürekli dekor değil, başarı ve doğrulanmış durum içindir.
- Amber ödül ve seviye dışında kullanılmamalıdır.
- Kırmızı yalnızca hata veya gerçek negatif hareket içindir.
- Durum yalnızca renkle anlatılmaz; ikon ve metin birlikte kullanılır.

## 3. Tipografi

İlk uygulamada hızlı ve tutarlı yükleme için sistem yazı tipi yığını önerilir:

```css
font-family: Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif;
```

| Stil | Boyut | Satır yüksekliği | Ağırlık | Kullanım |
|---|---:|---:|---:|---|
| Büyük sayı | 36 px | 42 px | 700 | Toplam puan |
| Sayfa başlığı | 24 px | 32 px | 700 | Ekran adı |
| Kart başlığı | 18 px | 26 px | 600 | Seviye, ödül, bölüm |
| Gövde | 16 px | 24 px | 400 | Ana açıklamalar |
| Küçük gövde | 14 px | 20 px | 400 | Tarih, durum, yardımcı metin |
| Etiket | 12 px | 16 px | 600 | Rozet ve kısa durum |

Puan sayılarında binlik ayırıcı Türkçe gösterime uygun olmalıdır: `10.000 puan`.

## 4. Boşluk ve yerleşim

4 piksel tabanlı ölçek:

```text
4, 8, 12, 16, 20, 24, 32, 40, 48
```

- Telefon kenar boşluğu: en az 16 px.
- Ana bölümler arası: 24 px.
- Kart iç boşluğu: 16–20 px.
- Aynı gruptaki öğeler: 8–12 px.
- Alt gezinme yüksekliği: güvenli alan hariç 64 px.
- Ana içerik alt gezinmenin altında kalmamalıdır.
- Desteklenen başlangıç genişliği: 360–430 px.

## 5. Köşe, gölge ve yüzey

- Büyük bilgi kartı: 16 px köşe.
- Standart kart: 12 px köşe.
- Düğme ve giriş: 12 px köşe.
- Küçük rozet: 999 px tam kapsül.
- Kart sınırı: 1 px `--color-border`.
- Gölge yalnızca katman ayrımı gerektiğinde kullanılmalıdır.
- Cam/bulanıklık etkisi sınırlıdır; metin kontrastını düşürmemelidir.
- Neon parlama ana metin veya form çevresinde kullanılmaz.

## 6. Ana bileşenler

### Puan özet kartı

İçerik sırası:

1. `10.000 puan`
2. `Bu puanla alabileceğiniz ödüllerin değeri: 500 TL'ye kadar`
3. Gerekirse bekleyen puan bağlantısı

Kart içinde `TL bakiye`, para simgesi veya çekme butonu bulunmaz.

### Seviye kartı

- Mevcut seviye adı,
- Seviye simgesi,
- İlerleme çubuğu,
- Sonraki seviyeye kalan nitelikli puan,
- Seviye ayrıntısına bağlantı.

İlerleme cüzdan bakiyesinden değil, nitelikli faaliyet ölçüsünden hesaplanır.

### Ana QR düğmesi

- Tam genişlik,
- En az 52 px yükseklik,
- QR ikonu + `QR Okut`,
- Ana sayfadaki tek baskın mavi eylem.

`Kodu Elle Gir` hemen altında ikincil çerçeveli düğme olarak bulunur.

### Hızlı işlem kartı

- En fazla dört eylem,
- İkon + kısa etiket,
- Minimum 44 × 44 px dokunma alanı,
- Kullanılmayan veya MVP dışı eylem gösterilmez.

### Puan hareketi satırı

- İşlem açıklaması,
- Tarih/saat,
- İşaretli puan değeri,
- Ayrıntı ekranına geçiş.

Pozitif hareket turkuaz `+250`; negatif hareket kırmızı `−50` gösterilir. Geçersiz kod denemesi
puan hareketi olarak gösterilmez.

### Ödül kartı

- Markasız veya izinli ürün görseli,
- Ödül adı,
- Puan bedeli,
- Teslim türü/etiketi,
- `İncele` veya uygun durumda `Ödülü Al`.

Stok, bölge veya seviye uygun değilse neden açıklanır; yalnızca düğme grileştirilmez.

### Durum rozeti

Standart durumlar:

- `Başarılı`
- `Beklemede`
- `İncelemede`
- `Kullanıldı`
- `Süresi Doldu`
- `İptal`

Her rozet metin, ikon ve renk birleşimiyle gösterilir.

## 7. Alt gezinme

Usta PWA için beş alan:

1. Ana Sayfa
2. Cüzdan
3. Ortada QR işlemi
4. Ödüller
5. Profil

QR düğmesi görsel olarak öne çıkar; fakat ekran okuyucuda sırası ve etiketi anlaşılır olmalıdır.
Aktif sekme ikon + metin rengiyle belirtilir.

## 8. QR ekranı

- Kamera alanı ilk ekranda görünür.
- İzin istemeden önce neden kamera gerektiği açıklanır.
- Çerçeve kod konumlandırmayı kolaylaştırır.
- `Kodu Elle Gir` her zaman görünürdür.
- Her kodun bir kez kullanılabileceği yazılır.
- Zayıf bağlantı, bekleyen ve tekrar deneme durumları ayrılır.
- Sunucu doğrulaması gelmeden başarılı puan mesajı gösterilmez.

## 9. Form ve hata davranışı

- Etiket alanın üzerinde kalır; yalnızca placeholder kullanılmaz.
- Hata ilgili alanın altında açık Türkçeyle gösterilir.
- Kullanıcının yazdığı geçerli alanlar genel hatada silinmez.
- Yükleniyor sırasında çift dokunma engellenir.
- Teknik hata kodu ana mesaj yapılmaz; işlem numarası destek için ayrıca sunulur.
- Çevrimdışı veya zaman aşımı, geçersiz ürün kodu gibi gösterilmez.

## 10. Erişilebilirlik

- Normal metinde hedef kontrast en az WCAG AA olmalıdır.
- Dokunma hedefi en az 44 × 44 px.
- Metin %200 büyütüldüğünde temel işlem kaybolmamalıdır.
- Ekran okuyucu QR, puan yönü ve durumları doğru okumalıdır.
- Animasyon azaltma tercihi desteklenmelidir.
- Başarı/hata yalnızca ses, renk veya animasyonla anlatılmaz.
- Ürün görsellerinin açıklayıcı alternatif metni bulunmalıdır.

## 11. Hareket ve geri bildirim

- Düğme basma geri bildirimi: 100–150 ms.
- Kart geçişleri: 180–240 ms.
- Puan kazanım animasyonu kısa ve atlanabilir.
- Sürekli parlayan veya dikkat dağıtan neon animasyon kullanılmaz.
- `prefers-reduced-motion` tercihinde hareket azaltılır.

## 12. Tasarım tokenlarının kod yapısı

Frontend başladığında tokenlar tek kaynakta tutulmalıdır:

```text
src/design/tokens.css
src/design/components/
src/design/icons/
src/design/motion.css
```

Ekran bileşenleri renk veya boşluk değerini doğrudan yazmamalı; token kullanmalıdır. Böylece marka
renkleri geldiğinde bütün ekranlar tek değişiklikle güncellenebilir.

## 13. İlk kodlanacak ekranlar

1. Ana sayfa iskeleti,
2. QR/kod giriş ekranı,
3. Kod sonucu durumları,
4. Puan cüzdanı ve hareket ayrıntısı,
5. Ödül kataloğu ve ödül ayrıntısı,
6. SMS giriş ve profil,
7. Kupon ayrıntısı,
8. Destek.

Önce yalnızca görsel prototip hazırlanır; gerçek puan ve kupon işlemleri backend kuralları hazır
olmadan sahte biçimde başarılı gösterilmez.

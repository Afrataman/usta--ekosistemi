# Usta Ekosistemi

Bu depo, **Usta Kulübü**, ileride eklenecek **Onaylı Usta Ağı** ve seçili işler için
**Dijital Garanti** sisteminin ürün ve teknik belgelerini içerir.

Şu anki aşama kodlama değil, **MVP gereksinimlerini kesinleştirme** aşamasıdır.

## Neden önce belge hazırlıyoruz?

Puan, kupon, iade ve bayi işlemleri birbirini etkileyen finansal değere sahip işlemlerdir.
Kurallar kodlamadan önce netleşmezse aynı işlem farklı ekranlarda farklı yorumlanabilir,
sonradan yapılan düzeltmeler veri kaybına veya kullanıcı güveninin zedelenmesine yol açabilir.

Bu paket şu sorulara cevap vermeyi amaçlar:

- Kim, hangi işlemi yapabilir?
- Her ekran ne gösterir ve hangi durumda hata verir?
- Puan nasıl kazanılır, harcanır ve geri alınır?
- Sahte veya tekrarlı işlemler nasıl önlenir?
- İnternet kesilirse işlem nasıl güvenle devam eder?
- Hangi özellikler ilk sürümde özellikle yapılmayacaktır?
- Bir özelliğin tamamlandığını nasıl doğrularız?

## Belge haritası

| Belge | İçerik | Kim onaylamalı? |
|---|---|---|
| [00-urun-vizyonu.md](docs/00-urun-vizyonu.md) | Vizyon, hedefler, ilkeler ve başarı ölçütleri | Ürün sahibi, yönetim |
| [01-mvp-kapsami-ve-roller.md](docs/01-mvp-kapsami-ve-roller.md) | MVP sınırları, roller ve yetki ilkeleri | Ürün, operasyon, hukuk |
| [02-ekran-envanteri.md](docs/02-ekran-envanteri.md) | Usta, bayi ve yönetici ekranları | Ürün, tasarım, operasyon |
| [03-islem-akislari.md](docs/03-islem-akislari.md) | Temel işlem akışları ve hata durumları | Ürün, yazılım, operasyon |
| [04-puan-kampanya-odul.md](docs/04-puan-kampanya-odul.md) | Puan defteri, kampanya motoru, ödül ve kupon kuralları | Pazarlama, mali işler, hukuk |
| [05-veri-modeli.md](docs/05-veri-modeli.md) | Kavramsal tablolar, ilişkiler ve veri kuralları | Yazılım, veri, güvenlik |
| [06-guvenlik-sahtecilik-uyum.md](docs/06-guvenlik-sahtecilik-uyum.md) | Güvenlik, sahtecilik, KVKK ve denetim | Güvenlik, hukuk, operasyon |
| [07-kalite-kriterleri.md](docs/07-kalite-kriterleri.md) | Performans, çevrimdışı davranış, kabul ve yayın kriterleri | Yazılım, QA, ürün |
| [08-acik-kararlar.md](docs/08-acik-kararlar.md) | İş birimlerinin cevaplaması gereken açık sorular | İlgili karar sahipleri |
| [09-gereksinim-matrisi.md](docs/09-gereksinim-matrisi.md) | Numaralı MVP gereksinimleri ve doğrulama bağlantıları | Ürün, yazılım, QA |
| [10-github-calisma-akisi.md](docs/10-github-calisma-akisi.md) | Dal, commit, PR, inceleme ve yayın süreci | Ürün, yazılım, QA |
| [11-p0-karar-onerileri.md](docs/11-p0-karar-onerileri.md) | MVP'yi etkileyen sekiz kritik karar için öneri ve gerekçeler | Karar sahipleri |

## Belge durumları

- **Taslak:** Tartışmaya açıktır.
- **İncelemede:** İlgili ekiplerden görüş beklenir.
- **Onaylı:** Kodlama ve test için bağlayıcıdır.
- **Değiştirildi:** Yeni sürümle yer değiştirmiştir; geçmiş kayıt korunur.

Belgeler şu anda **v0.1 / Taslak** durumundadır. Açık kararlar kapanmadan teknoloji seçimi
bağlayıcı hâle gelmez ve üretim kodlaması başlamaz.

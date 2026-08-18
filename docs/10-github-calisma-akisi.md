# 10 — GitHub Çalışma Akışı

**Sürüm:** 0.1
**Durum:** Taslak

Git yalnızca kod yedekleme aracı değildir. Hangi kararın ne zaman, neden ve kim tarafından
değiştirildiğini görünür kılar. GitHub ise bu değişikliklerin incelenmesi, test edilmesi ve
onaylanması için ortak çalışma alanıdır.

## 1. Mevcut durum — 18 Ağustos 2026

- Yerel Git deposu mevcut.
- Geçerli dal: `master`.
- Henüz ilk commit oluşturulmamış.
- `origin` adlı GitHub uzak deposu bağlı değil.
- `README.md` ve `docs/` henüz Git tarafından izlenmiyor.

Bu nedenle doğrudan `push` yapılamaz. Önce depo sahipliği, görünürlük ve GitHub adresi
belirlenmelidir.

## 2. Önerilen depo politikası

### Ana dal

GitHub deposu oluşturulduğunda ana dal adı `main` olmalıdır. Yereldeki boş `master` dalı ilk
commit öncesinde veya hemen sonrasında `main` olarak yeniden adlandırılır.

### Çalışma dalları

Her anlamlı değişiklik ayrı kısa ömürlü dalda yapılır:

```text
agent/mvp-requirements
agent/architecture-baseline
agent/auth-otp
agent/product-code-claim
agent/points-ledger
fix/coupon-double-redemption
```

Yapay zekâ aracılığıyla oluşturulan dallar varsayılan olarak `agent/` öneki kullanır. İnsan ekip için
`feature/`, `fix/`, `docs/` gibi ek kurallar daha sonra kararlaştırılabilir.

### Neden doğrudan `main` üzerinde çalışmıyoruz?

Çalışma dalı, değişikliği yayınlanmış/kararlı içerikten ayırır. Pull request üzerinde fark,
test ve yorum görülür; hata varsa ana dal bozulmadan düzeltilebilir.

## 3. İlk GitHub kurulum sırası

Bu adımlar kullanıcı onayıyla uygulanacaktır:

1. GitHub'da boş depo oluşturulur; önerilen ad: `usta-ekosistemi`.
2. Depo görünürlüğü seçilir. Ticari ürün belgeleri nedeniyle başlangıçta **private** önerilir.
3. Yerel ana dal `main` olarak adlandırılır.
4. GitHub adresi `origin` olarak eklenir.
5. Belgeler bir çalışma dalında ilk commit olarak hazırlanır.
6. Dal GitHub'a gönderilir.
7. Taslak pull request açılır.
8. Belgeler ürün, hukuk, mali işler, pazarlama ve operasyon tarafından incelenir.
9. P0 kararları kapatılıp gerekli düzeltmeler aynı PR'a eklenir.
10. Kontroller geçince PR `main` dalına birleştirilir.

GitHub deposu web arayüzünde README veya `.gitignore` ile ayrıca başlatılmamalıdır; yerelde
bunlar zaten vardır. İki ayrı ilk geçmiş oluşturmak gereksiz birleştirme sorunu yaratabilir.

## 4. Commit politikası

Her commit tek anlaşılır amacı taşımalıdır. Örnekler:

```text
docs: add MVP product vision and scope
docs: define points and campaign rules
docs: record P0 business decisions
feat(points): add append-only ledger entries
test(coupons): cover concurrent redemption
fix(returns): prevent duplicate partial return
```

### İyi commit neden önemlidir?

- Hatanın hangi değişiklikte geldiği bulunabilir.
- Yalnızca problemli commit güvenle geri alınabilir.
- Pull request incelemesi anlaşılır olur.
- Karar geçmişi ürün belgesiyle birlikte korunur.

Üretilmiş dosyalar, sırlar, `.env`, yerel IDE ayarları ve gereksiz bağımlılık klasörleri commit
edilmez. Commit öncesi her zaman `git status` ve fark kontrol edilir.

## 5. Pull request politikası

Her PR şu bilgileri içermelidir:

- Amaç ve iş gerekçesi
- Kapsama dahil/değil maddeleri
- İlgili gereksinim kimlikleri (`PTS-LEDG-001` gibi)
- Değişen ekran, akış ve veri yapıları
- Uygulanan testler ve sonuçları
- Güvenlik/KVKK etkisi
- Veri geçişi ve geri alma planı
- Ekran değişikliyse mobil ekran görüntüsü
- Açık riskler ve insan kararı gereken noktalar

### PR boyutu

Bir PR tek inceleme konusuna odaklanmalıdır. “Bütün MVP” tek PR yapılmaz. Kimlik, ürün kodu,
puan defteri ve ödül gibi modüller ayrı ama sıralı PR'larla geliştirilir.

## 6. İnceleme ve onay

Önerilen asgari inceleme:

| Değişiklik | Gerekli inceleme |
|---|---|
| Ürün kapsamı/ekran/akış | Ürün sahibi |
| Puan, ödül, iade | Ürün + mali işler + hukuk |
| KVKK/izin/veri saklama | Hukuk + güvenlik |
| Kampanya kuralı | Pazarlama + mali işler |
| Yetki/risk sistemi | Güvenlik + operasyon |
| Veritabanı/API | Teknik inceleme |
| Kullanıcı arayüzü | Ürün/tasarım + erişilebilirlik kontrolü |

Kodu yazan kişi mümkünse kendi PR'ının tek onaylayanı olmamalıdır. Yapay zekâ incelemesi
yardımcı kanıttır; sorumlu insan onayının yerine geçmez.

## 7. Dal koruma kuralları

İlk GitHub deposu bağlandıktan sonra `main` için önerilen kurallar:

- Doğrudan push kapalı
- Pull request zorunlu
- En az bir insan onayı
- Eski onayların yeni commit sonrasında geçersizleşmesi
- Çözümlenmemiş yorum varken birleştirmeyi engelleme
- Zorunlu otomatik test ve güvenlik kontrolleri
- Dalın güncel olma şartı
- Zorla push ve dal silmenin engellenmesi
- Yöneticilerin de kurallara tabi olması

Hukuk/mali etkili dosyalar için daha sonra `CODEOWNERS` ile özel onay sahipleri tanımlanabilir.

## 8. GitHub Issues ve proje takibi

Her iş kartı şunları taşımalıdır:

- Gereksinim kimliği
- Kullanıcı değeri
- Kabul kriterleri
- Bağımlılıklar
- Risk ve kapsam dışı notu
- Sorumlu ve hedef aşama

Önerilen etiketler:

```text
area:auth
area:products
area:points
area:campaigns
area:rewards
area:dealer
area:risk
area:admin
type:feature
type:bug
type:security
type:decision
priority:p0
priority:p1
status:blocked
```

Açık kararlar da Issue olarak açılabilir; ancak kesin sonuç ilgili belgeye işlenmeden yalnızca
Issue yorumu bağlayıcı karar sayılmaz.

## 9. GitHub Actions planı

Teknoloji seçildikten sonra her PR'da en az:

1. Biçim/lint kontrolü
2. Derleme
3. Birim testleri
4. Entegrasyon testleri
5. Bağımlılık ve bilinen güvenlik açığı taraması
6. Kaynak kodda gizli anahtar taraması
7. Gerekliyse PWA üretim derlemesi
8. Veritabanı şema/migration doğrulaması

çalıştırılır. Başarısız zorunlu kontrol varken PR birleştirilmez.

## 10. Sürüm ve yayın yönetimi

- MVP öncesi sürümler `0.x` olarak etiketlenebilir.
- Pilot adayı: örneğin `v0.1.0-rc.1`.
- Pilot yayını: örneğin `v0.1.0`.
- Her sürümde değişiklik özeti, bilinen sorunlar ve geri alma yöntemi bulunur.
- Veritabanı değişiklikleri geriye uyumluluk ve geri dönüş açısından incelenir.
- Üretime yayın yalnızca GitHub etiketiyle değil, onaylı yayın kontrol listesiyle yapılır.

## 11. Yapay zekâ araçlarıyla güvenli çalışma

- Aynı çalışma dalında iki ajan eşzamanlı dosya değiştirmez.
- Codex ana uygulayıcıdır; diğer araçlar ayrı dal/worktree veya salt okunur inceleme kullanır.
- Gemini/Antigravity ve OpenCode bulguları PR yorumu veya inceleme raporu olarak değerlendirilir.
- Gizli anahtarlar, gerçek telefonlar, müşteri verileri ve üretim kodları model istemlerine konmaz.
- Ajanın yaptığı değişiklik commit öncesi insan tarafından fark ve test sonuçlarıyla incelenir.
- Otomatik üretilen commit mesajı yapılan işi doğru anlatmıyorsa düzeltilir.

## 12. Bu depo için sıradaki GitHub adımları

1. GitHub kullanıcı/organizasyon sahibi belirlenmeli.
2. `usta-ekosistemi` için private depo oluşturulmalı.
3. Depo URL'si yerel `origin` olarak bağlanmalı.
4. İlk belge dalı `agent/mvp-requirements` oluşturulmalı.
5. Dosyalar incelenip ilk commit hazırlanmalı.
6. Push ve taslak PR için kullanıcıdan açık onay alınmalı.
7. PR açıklamasına 47 gereksinim ve P0 açık karar kapsamı bağlanmalı.

# 02 — Ekran Envanteri

**Sürüm:** 0.1
**Durum:** Taslak

Bu belge görsel tasarım değildir. Her ekranın amacı, temel içeriği, ana eylemleri ve hata/boş
durumlarını tanımlar. Görsel tasarım daha sonra bu sözleşmeye göre hazırlanacaktır.

## 1. Ortak ekran durumları

Her veri ekranı şu durumları açıkça tasarlamalıdır:

- **Yükleniyor:** İşlemin devam ettiği anlaşılır.
- **Boş:** Veri yokluğu hata gibi gösterilmez; kullanıcıya sonraki adım anlatılır.
- **Hata:** Teknik kod yerine anlaşılır mesaj ve güvenli tekrar deneme sunulur.
- **Çevrimdışı:** Son bilginin zamanı ve hangi işlemlerin yapılamayacağı belirtilir.
- **Yetkisiz:** Kullanıcı girişe veya uygun ekrana yönlendirilir.
- **Kısıtlı hesap:** Nedenin paylaşılabildiği ölçüde durum ve itiraz yolu gösterilir.

### Neden bu durumları baştan tanımlıyoruz?

Bir uygulama yalnızca başarılı işlemlerden oluşmaz. Zayıf internet, boş katalog veya süresi
dolmuş kupon düşünülmezse gerçek kullanıcı deneyimi tasarımdan tamamen farklı olur.

## 2. Usta PWA ekranları

### U-01 — Telefonla giriş

- Ülke kodu ve telefon numarası
- Aydınlatma metni bağlantısı
- “SMS kodu gönder” eylemi
- Geçersiz numara ve hız sınırı mesajları

### U-02 — SMS doğrulama

- 6 haneli kod girişi
- Maskelenmiş telefon numarası
- Kodun kalan süresi
- Yeniden gönderme sayacı
- Yanlış, süresi dolmuş veya çok fazla denenmiş kod durumları

### U-03 — İlk profil

- Ad, soyad, il ve ilçe
- Zorunlu hukuki onaylar ile isteğe bağlı ticari ileti izinlerinin ayrı sunumu
- Kaydet ve devam et

### U-04 — Ana sayfa

- Toplam kullanılabilir puan
- “Bu puanla alabileceğiniz ödüllerin değeri … kadar” açıklaması
- Seviye ve sonraki seviyeye ilerleme
- QR okut / kod gir ana eylemi
- Yaklaşan puan süresi varsa uyarı
- Aktif kampanyalar ve son hareketler

### U-05 — QR okutma

- Kamera izni açıklaması
- Tarama çerçevesi ve ışık önerisi
- Başarısız okumada elle giriş bağlantısı
- Aynı kodun art arda gönderilmesini önleyen işlem durumu

### U-06 — Kodu elle girme

- Kod biçimine uygun giriş alanı
- Karakter gruplama ve okunabilirlik
- Göndermeden önce yerel biçim kontrolü
- Kodun nerede bulunduğunu gösteren yardım

### U-07 — Kod sonucu

- Başarılıysa ürün, kazanılan puan, kampanya ve yeni toplam
- İncelemedeyse bekleme nedeni ve tahmini süreç hakkında genel bilgi
- Kullanılmış, geçersiz, uygun olmayan veya iade edilmiş kod için ayrı mesaj
- Destek talebi oluşturma bağlantısı

### U-08 — Puan cüzdanı

- Kullanılabilir, bekleyen ve varsa geri alınmış puan özeti
- Puanın para olmadığı açıklaması
- Ödül kataloğuna geçiş
- Filtrelenebilir hareket listesi

### U-09 — Puan hareketi ayrıntısı

- İşlem türü, tarih, puan, durum ve açıklama
- İlgili ürün/kampanya/ödül referansı
- İade veya düzeltme bağlantısı
- Destek için paylaşılabilir işlem numarası

### U-10 — Seviye

- Mevcut seviye
- Seviyenin sağladığı geçerli avantajlar
- Sonraki seviye ölçütleri
- Değerlendirme dönemi ve düşme/yenilenme kuralı

### U-11 — Ödül kataloğu

- Kullanıcının puanına ve bölgesine uygun ödüller
- Dijital/bayi teslimi ayrımı
- Puan bedeli, stok ve geçerlilik
- Ulaşılamayan ödül için eksik puan bilgisi

### U-12 — Ödül ayrıntısı ve onay

- Tam koşullar ve teslim yöntemi
- Harcanacak puan
- İptal/iade kuralı
- Bayi seçimi gerekiyorsa uygun bayi
- Çift dokunmaya karşı tek bir oluşturma işlemi

### U-13 — Kupon/ödül ayrıntısı

- Kupon QR/kodu, maskeli metin ve durum
- Son kullanım tarihi
- Geçerli bayi/kanal ve kullanım koşulları
- Kullanıldıysa bayi ve zaman
- Sorun bildir bağlantısı

### U-14 — Bildirimler

- Kampanya, ödül, işlem ve sistem bildirimleri
- Okundu/okunmadı durumu
- Bildirimin ilgili ekrana güvenli bağlantısı

### U-15 — Destek

- Kategori, açıklama ve ilişkili işlem seçimi
- Talep numarası ve durum
- Yanıt geçmişi
- Hassas veri paylaşmama uyarısı

### U-16 — Profil ve ayarlar

- Profil bilgileri
- İzin ve iletişim tercihleri
- Telefon değişikliği süreci
- Aktif oturumları kapatma
- Hesap/veri talepleri için yönlendirme
- Çıkış

### U-17 — Üyelik QR'ı

- Kısa ömürlü veya güvenli üyelik QR'ı
- Ad ve maskelenmiş üye numarası
- Ekran görüntüsünün kötüye kullanımını azaltan yenilenme bilgisi

## 3. Bayi ekranları

### B-01 — Bayi çalışanı girişi

- Kurumsal olarak onaylanmış kimlik doğrulama yöntemi
- Şube bilgisi
- Şifre/kod deneme sınırları ve destek yolu

### B-02 — Bayi ana sayfası

- Satış eşleştir, kupon doğrula, iade ve şüpheli işlem ana eylemleri
- Günlük işlem özeti
- Bekleyen veya başarısız işlemler

### B-03 — Usta QR okutma

- Üyelik QR tarama
- Bulunan ustanın minimum kimlik teyidi
- Süresi geçmiş veya kopyalanmış QR durumu

### B-04 — Satış eşleştirme

- Usta, ürün, miktar, tarih ve satış belgesi referansı
- Mükerrer satış uyarısı
- Gönderim özeti ve onay

### B-05 — Kupon doğrulama

- Kupon QR/kod girişi
- Ödül, geçerlilik, doğru bayi ve kullanılabilirlik sonucu
- Doğrulama ile teslim onayının ayrı adımlar olması

### B-06 — Ödül teslim onayı

- Ödül ve usta özeti
- Teslim eden çalışan
- Nihai onay ve benzersiz teslim işlem numarası
- Başarılı işlemin geri bildirim ekranı

### B-07 — İade

- Orijinal satış/işlem bulma
- İade edilen ürün/miktar ve neden
- Beklenen puan etkisi önizlemesi
- Yetki aşılırsa yönetici onayına gönderme

### B-08 — Şüpheli işlem bildirimi

- İlgili usta, kod, kupon veya satış seçimi
- Standart nedenler ve açıklama
- Bildirimin gizlilik ve kötüye kullanım uyarısı

### B-09 — İşlem geçmişi

- Şube kapsamlı satış, kupon, teslim ve iade listesi
- Durum/tarih/çalışan filtreleri
- İşlem ayrıntısı ve destek bağlantısı

## 4. Yönetim paneli ekranları

### Y-01 — Gösterge paneli

- Temel ürün metrikleri, operasyon uyarıları ve risk kuyruğu
- Verinin güncellik zamanı
- Rol bazlı kart görünürlüğü

### Y-02 — Usta yönetimi

- Arama, filtre, profil, hesap durumu ve işlem özeti
- Kısıtlama/yeniden açma için gerekçe ve yetki kontrolü
- Puanı doğrudan değiştirmeyen düzeltme hareketi süreci

### Y-03 — Bayi/şube/çalışan yönetimi

- Hiyerarşi, durum, yetkiler ve çalışan erişimi
- Şube değişikliği ve erişim iptali geçmişi

### Y-04 — Ürün ve kod partileri

- Ürün, SKU, kod partisi, üretim/yükleme kaynağı
- Yükleme ön doğrulaması, hata raporu ve etkinleştirme
- Parti bazında iptal veya risk işaretleme

### Y-05 — Puan kuralı yönetimi

- Koşullar, puan sonucu, tarih aralığı ve kapsam
- Çakışma testi ve örnek hesaplama
- Taslak, onaylı, zamanlanmış, aktif, sona ermiş durumları
- Sürüm ve değişiklik karşılaştırması

### Y-06 — Kampanya yönetimi

- Hedef kitle, ürün, bölge, bayi, tarih ve bütçe sınırı
- Puan kuralı bağlantısı
- Önizleme, ikinci onay, yayınlama ve durdurma

### Y-07 — Ödül kataloğu

- Ödül türü, sağlayıcı, puan bedeli, geçerlilik ve stok
- Bölge/seviye uygunluğu
- Yayın geçmişi

### Y-08 — Kupon ve teslimat

- Durum, bayi, usta, ödül ve tarih filtreleri
- Süresi dolan, iptal edilen ve kullanılan kupon ayrımı
- Yetkili operasyon eylemleri

### Y-09 — İade yönetimi

- Orijinal işlem, iade kanıtı, puan ve ödül etkisi
- Bekleyen insan kararı gereken durumlar

### Y-10 — Şüpheli işlem kuyruğu

- Risk sinyalleri ve öncelik
- İlişkili işlem ağı
- İncele, ek bilgi iste, serbest bırak, kısıtla seçenekleri
- Her karar için gerekçe

### Y-11 — Destek yönetimi

- Atama, öncelik, durum, hedef süre ve yanıt geçmişi
- Kullanıcı/işlem bağlamına sınırlı erişim

### Y-12 — Raporlar

- Önceden tanımlı güvenli raporlar
- Kişisel veri maskeleme
- Dışa aktarma yetkisi ve indirme denetim kaydı

### Y-13 — İşlem ve denetim geçmişi

- Kullanıcı işlemleri ve yönetici değişiklikleri için ayrı görünüm
- Aktör, zaman, neden, önceki/yeni değer ve ilişki numaraları
- Değiştirilemez ve dışa aktarılabilir kayıt

### Y-14 — Sistem yapılandırması

- SMS sağlayıcısı gibi gizli olmayan çalışma ayarlarının durumu
- Özellik bayrakları ve operasyon limitleri
- Gizli anahtarların ekranda hiçbir zaman açık gösterilmemesi

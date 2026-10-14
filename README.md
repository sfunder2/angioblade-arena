# AngioBlade Arena v1.6 — İki oyunculu oda sistemi

## Durum

Çevrim içi oda sunucusu medera-akademi projesinde etkinleştirilmiştir. HTML dosyasındaki sunucu bağlantısı yapılandırılmıştır. Tek oyunculu modlar, kombo ve kupa özellikleri de kullanılabilir.

## Kullanım

1. Her iki oyuncu aynı güncel HTML dosyasını tarayıcıda açar ve dil seçer.
2. Çevrim içi · 2 oyuncu düğmesine basılır.
3. İlk oyuncu adını yazar ve Oda aç düğmesine basar.
4. İkinci oyuncu adını ve 6 karakterli oda kodunu yazar, Katıl düğmesine basar.
5. İki oyuncu Hazırım dediğinde ortak 5 saniyelik geri sayım başlar.
6. Karşılaşma 50 saniye sürer. Hedef dizisi iki oyuncu için aynıdır; her hedef 8 saniye erişilebilir kalır.
7. İki oyuncu birbirinin skorunu yaklaşık 500 ms aralıklarla alır. Kazanan sunucunun doğruladığı skorlarla belirlenir. Son vuruşları almak için 3 saniyelik sonuç doğrulama süresi bulunur.

Çevrim içi maçta duraklatma yoktur. Odadan ayrılan oyuncu karşılaşmayı kaybeder. Bağlantı kesilmesi görünür şekilde belirtilir; süre devam eder. Sayfa yenilendiğinde aynı sekmedeki oda oturumuna geri dönme seçeneği bulunur.

## Kurulum için hazırlanmış kod

- `backend/multiplayer.sql`: `angio_duel_rooms` tablosu ve iki sunucu işlevi. Oda üyeliği rastgele oyuncu anahtarının SHA-256 özetiyle kontrol edilir. Eş zamanlı işlemler satır kilidiyle korunur. RLS açıktır; anon/authenticated rollerinin tabloya ve işlevlere erişimi kapalıdır. İşlevler SECURITY INVOKER kullanır ve yalnızca service_role tarafından çağrılabilir.
- `backend/index.ts`: Supabase Edge Function `angio-duel`. Oyuncu oturumları işlevin kendi oda anahtarlarıyla doğrulanır. Yönetici anahtarı yalnızca sunucu ortamından okunur; HTML dosyasına eklenmez.
- `index.html`: mevcut oyun ve yeni oda istemcisi. `angioblade-duel-api` meta etiketinin boş değeri sunucu etkinleştirildikten sonra doğru işlev URL'siyle doldurulur.

Kullanıcının 13 Ekim 2026 tarihli onayıyla oyun tablosu ve sunucu işlevi medera-akademi projesinde kurulmuştur. Kurulum yalnızca angio_duel_rooms, angio_duel_action ve angio_duel_score bileşenlerini ekler; mevcut uygulama tablolarını değiştirmez.

## Puan doğrulaması

İstemci bir toplam puan göndermek yerine kesilen hedef kimliğini ve maç içindeki zamanını gönderir. Sunucu hedefin o maçta bulunmasını, zaman penceresini, sıralamayı ve tekrar gönderilen vuruşları kontrol ederek temel puanı, komboyu ve sinerjiyi yeniden hesaplar. Konum/hareket doğrulaması bu sürümde yoktur; tam rekabetçi hile önleme sistemi değildir.

## Testler

`node tests/duel-test.cjs` gerçek Edge Function işleyicisini ve iki ayrı oyun istemcisini sahte veritabanı hizmetiyle çalıştırır. Oda katılımı, üçüncü oyuncu engeli, ortak geri sayım/hedef dizisi, canlı skor, oturum anahtarları, tekrar vuruş ve ayrılma sonucu kontrol edilir.

`node tests/combo-test.cjs` tek oyunculu akışları, komboları, kupaları ve yoğun sahne sınırlarını kontrol eder.

Bu testler gerçek Supabase kurulumunu, gerçek iki telefonu veya görsel tarayıcı denetimini kapsamaz. Sunucu kurulduktan sonra gerçek uçtan uca doğrulama yapılmalıdır.

## Gerçek sunucu doğrulaması — 13 Ekim 2026

Yayımlanan Supabase işlevinde oda oluşturma/katılma, üçüncü oyuncu engeli, ortak başlangıç ve hedef planı, iki oyuncunun skorlarının aktarılması, aynı vuruşun tekrar puan kazandırmaması, geçersiz oyuncu anahtarı ve ayrılma sonucunda kazananın belirlenmesi testleri geçti. Veritabanındaki RLS ve yalnızca sunucuya verilen erişim izinleri doğrulandı. Gerçek telefonlarda görsel denetim henüz yapılmadı.


## v1.4 — Oyuncu merkezi ve ligler

- Bronz: 0 LP; Gümüş: 90 LP; Altın: 240 LP; Elmas: 480 LP.
- Sunucunun onayladığı galibiyet +30 LP, beraberlik +10 LP kazandırır. Mağlubiyet puan düşürmez. Maç sonucu bir kez uygulanır.
- Lig kimliği tarayıcıda saklanan rastgele bir oyuncu anahtarına bağlıdır. Kullanıcı adı kimlik veya parola değildir. Aynı profil kendi kendisiyle maç yapamaz.
- Günlük görevler İstanbul saatine göre gece yarısında yenilenir: 10 kombo → 40 kristal; 5 sinerji → 60 kristal; 50 hedef → 80 kristal. Ödül elle alınır, aynı görevden ikinci kez alınamaz.
- Kupa vitrini seçimi oyuncu adının yanında gösterilir ve oda katılımcılarına iletilir.
- Bıçak ve iz için ayrı kozmetik seçimleri vardır. İyon Buzu ilk kupayla, Plazma Moru kombo kupasıyla, Güneş Altını 100 hedef kupasıyla, Aurora şampiyon kupasıyla açılır. Aurora alternatif olarak 160 günlük kristalle açılabilir. Görünümler fizik veya puan avantajı vermez.
- Maç sonu karşılaştırması skor, yakalanan hedef sayısı/oranı, en iyi kombo ve sinerji sayısını sunucunun verileriyle gösterir.
- Yeni arayüz: Oyna, Günlük Görevler, Kupa Vitrini, Koleksiyon; lig kartı, kristal cüzdanı, oyuncu adı ve rekorlar.

Ligler sunucuda tutulur. Günlük görevler, kupalar ve kozmetikler bu tarayıcıda saklanır. Tarayıcı verileri silinirse anonim lig anahtarına ve yerel ilerlemeye erişim kaybedilir. Bu sürümde kullanıcı hesabıyla cihazlar arası kurtarma yoktur.

`backend/league_profiles_v2.sql`, ilk oda şemasından sonra uygulanır. Mevcut medera-akademi kurulumunda iki şema da uygulanmıştır; tekrar çalıştırmayın. Yeni profil tablosu RLS ile kapalıdır ve yalnızca sunucu rolü erişebilir. Yeni işlevler SECURITY INVOKER kullanır.

Gerçek sunucuda profil kalıcılığı, kupa/kozmetik bilgisi, kendisiyle maç yapmanın engellenmesi, maç istatistikleri, +30 LP, mağlubiyet sayısı ve sonuç tekrarında puan verilmemesi testleri geçti. Yerel testler görev ödülleri, gün değişimi, kozmetik kilitleri/satın alma/seçimi, kupa vitrini, lig eşikleri ve tüm yeni menü bölümlerini de doğrular. Telefonlarda görsel ve dokunmatik doğrulama henüz yapılmadı.

## v1.5 — Geliştirilmiş grafikler

- Yüksek çözünürlüklü, önbelleğe alınan molekül dokuları: katmanlı küre gölgelendirmesi, molekül bağları, küçük yüzey desenleri, ışık yansımaları ve ayrı hedef etiketleri.
- Organik hücre duvarı dokuları, arka kapiller dallar, renkli kenar aydınlatması ve atmosfer parçacıkları.
- Kesilen molekül parçalarında gerçek doku kullanımı; kısa ışık darbeleri ve sınırlı sayıda kesim halkası.
- Üç görsel kalite düzeyi: Hafif, Standart, Sinematik. Ayarlardaki kalite düğmesi sırayla bu düzeyleri seçer.
- Doku önbelleği, efekt sayı sınırları ve uzun süren karelerde azaltılan atmosfer ayrıntısı. Görsel sistem oyun rastgele sayı üreticisini kullanmaz; hedef planı, skor, kombo ve lig kuralları değişmez.
- Eski leke çizimindeki tanımsız y koordinatı ve eksik Canvas restore çağrısı düzeltildi.

Yerel oyun/oda/görev testleri geçti. Native Canvas ile gerçek çizim üretimi ve tüm kalite düzeylerinde animasyonlu çizim kontrolü yapıldı. Android/iOS tarayıcılarında dokunmatik ve kare hızı denetimi henüz yapılmadı.


## v1.6 — Karakter gelişimi ve yetenek ağacı

Kalıcı XP, 1–30 oyuncu seviyesi ve üç dalda dokuz yetenek eklenmiştir. İlk seviyede bir puan vardır; her yeni seviyede bir yetenek puanı kazanılır. Önceki sağ-panel kesimleri ve sinerji geçmişi ilk yüklemede temel XP'ye dönüştürülür. Oyuncu XP/seviyesi lig puanından ayrıdır.

XP kaynakları: başarılı kesim 8 XP, sinerji ek 15 XP, geçilen aşama 40 XP, tamamlanan klasik oturum 60 XP, tamamlanan beş aşamalı meydan okuma 150 XP. Günlük görevler kristal ödülünün iki katı XP kazandırır. Sunucunun doğruladığı maçta en az bir kesim yapan oyuncuya galibiyet 80, beraberlik 40, mağlubiyet 20 XP verilir; aynı maç tekrar ödüllendirilmez.

- Moleküler Ustalık: kesim XP'si +%10, sinerji başına +5 XP, tüm XP kaynaklarına +%10.
- Eğitim Desteği: hedef etiketleri; tek oyunculu kombo penceresi 2,4 saniye; tek oyunculu her aşamaya +5 saniye.
- Görsel Ustalık: Prizma bıçak/iz görünümü, ikinci kesim halkası, kombo dönüm noktalarında ek parıltılar.

Düğümler seviye, önceki yetenek ve yeterli puan gerektirir. Yetenekler oyunlar arasında ücretsiz yeniden dağıtılır. Bir oturumun yetenekleri başlangıçta sabitlenir. Eğitim destekleri çevrim içi düelloda devre dışıdır: her oyuncu için süre 50 saniye, kombo penceresi 2 saniye ve sunucu skor/lig kuralları aynıdır. Kozmetikler çevrim içi kullanılabilir.

XP ve yetenekler tarayıcıda saklanır; bu sürümde hesapla cihazlar arası XP senkronizasyonu yoktur.

## Yerel çalıştırma ve test

`index.html` dosyası tarayıcıda açılabilir. Alternatif statik sunucu:

```sh
python3 -m http.server 8080
```

Ardından `http://localhost:8080` adresini açın. Çevrim içi mod için internet gerekir. `backend/` sunucu şemasını ve Edge Function kodunu içerir; yönetici anahtarları yalnızca sunucu ortamından okunur. Ön yüz URL'si gizli anahtar değildir.

Node.js 24 veya üzeri ile temel testler ek paket kurmadan çalışır:

```sh
npm test
```

`tests/progression-test.cjs` seviye sınırları, düğüm ön koşulları ve maliyetleri, XP çarpanları, ücretsiz dağıtım, tek oyunculu süreler, değişmez oturum yetenekleri, çevrim içi denge, Prizma görünümü, XP kaydı ve tek maç ödülünü doğrular. Diğer testler oyun/görev/kupa/kozmetik ve iki istemcili oda akışlarını doğrular. Gerçek telefonlarda görsel ve dokunmatik test yapılmadı.

## v1.7 — Ad ve lider tablosu
İlk girişte takma ad istenir; seçilen ad bu tarayıcıda hatırlanır. Lider tablosunda adların herkese açık olduğu giriş ekranında belirtilir. Klasik ve meydan okuma için oyuncu başına en iyi skor, düello için sunucunun doğruladığı LP gösterilir. İlk 100 oyuncu listelenir. Tek oyunculu skorlar cihaz beyanıdır ve antrenman yetenekleri sonucu etkileyebilir. İnternet yoksa skor sırada tutulur ve sonraki girişte yeniden gönderilir. Profil anahtarları lider tablosuna dahil edilmez. `backend/leaderboard_v3.sql` mevcut oda/profil şemalarından sonra uygulanır.

# AngioBlade Arena v4.0 — RPG ve Güçlü Kesim Tepkisi

- Ana menü → **Kahraman ve ekipman**: üç sınıf, sınıfa özel tek beceri, bıçak geliştirme, rün, drone, nadir yadigâr ve unvanlar.
- **Keşif ve antrenman**: ödülsüz deneme alanı, üç aşamalık güç seçimli keşif, risk sözleşmesi ve AB4 koduyla arkadaş meydan okuması.
- 55 ms görsel esneme, belirgin kesik yüzeyi, hedef ağırlığına uygun parçalar, katmanlı sesler, zırh çatlama ve final darbeleri. Saatler durmaz.
- Sunucu tarafında takım rolleri ve doğrulanmış kesimlerle dolan ortak enerji/onarım dalgası. Yarış kuralları eşit kalır.
- Ayrıntılı 30 maddelik kapsam: [RPG_RELEASE.md](RPG_RELEASE.md). Backend: v5 ardından `backend/rpg_team_v6.sql`.
- RPG kayıtları mevcut büyüme kaydına eklenir; eski ilerleme ve bulut kayıt sistemi korunur.

# AngioBlade Arena v3.0 — Vuruş Hissi ve Birlikte Oyun

## v3.0 Paketi

- Kesim düzlemi parmağın yönünü izler. Kesilen parçalar 35 ms görsel beklemeden sonra ayrılır; oyun saati ve diğer hedefler durmaz. Hafif kamera tepkisi ve destekli telefon titreşimi Ayarlar’dan kapatılabilir; azaltılmış harekette devre dışıdır. Ses tamponu yeniden kullanılır ve sesler sınırlandırılır.
- Hedef avı, 30 saniye dayanma, sağlıklı hücre kesmeme ve hedefler arasında 180 ms’den fazla ara verilmeyen kaydırmada beş hedef kesme kuralları. 25 temel aşama korunur.
- Beş final düşmanı: kalkan 6 saniyelik döngünün ilk saniyesinde kapalıdır; 1–4 saniye arası çekirdek açıktır. Vuruş aralığı 650 ms. Saldırılar 7 saniyelik döngüde bildirilir; çekirdeğe vurarak o döngünün saldırısı engellenebilir. Bölgeye göre hücre, öncelikli hedef ve bütünlük saldırıları vardır.
- Bölge finalini geçip o bölgede 10/15 yıldız kazanıldığında bir gizli aşama açılır. Beş gizli aşama ayrı yıldız kaydı tutar ve buz, elektrik, yıldız tozu, fırtına ve nova görünümlerini açar. İlk başarı +120 XP verir.
- Arkadaşlarla oyna → Takım: 2–4 kişi, 50 saniye, tek ortak hedef listesi. İlk doğrulanan oyuncu hedefi alır; mükerrer kesimler sayılmaz. Hedeflerin %65’i kesilmeli ve bütünlük sıfırın üstünde kalmalıdır. Kaçan hedef 2 bütünlük kaybettirir. Takım oyununda lig puanı verilmez. Katkı veren oyuncular başarılı maçta bir kez 100 XP kazanır. Yarış modu 2–16 kişidir.
- Diğer → Hesabım: e-posta olmadan rastgele 256 bit kurtarma anahtarıyla isteğe bağlı bulut hesabı. Anahtarın yalnızca SHA-256 özeti veritabanında tutulur. Anahtarı bilen hesaba erişebilir; e-posta ile sıfırlama yoktur. Anahtarı güvenli saklamak gerekir.
- Bulut kayıt; XP, yetenekler/düzenler, temel ve gizli aşamalar, kupalar, görünümler, kristaller, günlük görevler ve lig profil anahtarını kapsar. Hesap anahtarı ve cihaz ayarları buluta kopyalanmaz. Değişiklikler oyun sırasında en erken 15 saniyede, menüde 1,5 saniyede kaydedilir. Sürüm uyuşmazlığında otomatik üzerine yazılmaz; kullanıcı bulut kaydını yükleyebilir veya bu cihazdakini seçebilir. Yükleme öncesi yerel yedek alınır.
- Diğer → Ayarlar: ana ekrana yükleme açıklaması ve çevrim dışı hazırlık durumu. İlk açılışta internet gerekir. PWA uygulama kabuğu, CSS ve simgeleri önbelleğe alır; tek oyunculu modlar sonra çevrim dışı kullanılabilir. Odalar, bulut kayıt ve sıralama internet ister. Hesap POST istekleri ve uzak API yanıtları önbelleğe alınmaz.

### Yerel kontroller

`npm ci`, `npm run build`, `npm test`. Derlenmiş `assets/app.css` depoya dahildir; ziyaretçinin Tailwind CDN’e erişmesi gerekmez. `tests/plus-db-test.sql` ve `tests/arena-db-test.sql` işlemleri geri alarak canlı şemayı sınar. `backend/cloud_coop_v5.sql` v5 şemasının kaynak kopyasıdır. Edge Function v5 dağıtılmıştır.

## v2.2 Mobil arayüz

- Üç büyük oyun seçeneği; dört ana sekme. Günlük görev, koleksiyon, kupa ve sıralama Diğer sekmesindedir.
- 700 piksel ve altında tek geniş oyun alanı. Sağ panel oyun mantığı korunur; ekrandaki dokunuşlar kaydırılmış Canvas koordinatlarına eşlenir.
- İlk tek oyunculu oyundan önce üç adımlı anlatım. Nasıl oynanır düğmesiyle tekrar açılır; arena geri sayımı anlatımla kesilmez.
- Büyük dokunma hedefleri, kısa metinler, açılır yetenek dalları ve oyuncu ayrıntıları.
- Kombo kutlamaları, moleküler parçacıklar ve menüde kaydırma animasyonu. Hareket azaltma tercihi desteklenir.
- tests/mobile-preview.html: gerçek 320, 390, 430 piksel iframe görünümü ile manuel kontrol.

## v2.1 Grafik paketi

- Beş bölgeye özel renkler, önceden çizilen damar dokuları ve harita kartları.
- Bölge finallerinde sonraki dalgadan 2,5 saniye önce geri sayım; dalga başlangıç kartları.
- Sağlıklı hücreler altıgen ve artı işaretli; öncelikli hedefler elmas çerçeveli, ünlemli ve kalan süre halkalıdır. Kesim alanları aynı kalır.
- Kombo ile güçlenen sınırlı ışın/parıltı efektleri, solan bıçak izleri. Hafif ayarda daha az efekt, azaltılmış hareket tercihinde sabit atmosfer ve kısa kesim parıltısı.
- Kampanya kalkanı ve zaman alanı için ayrı görsel göstergeler.

## v2.0 Yetenek paketi

- Beş renkli dalda 30 yetenek; seviyeye ve ön koşullara bağlı açılış, üç üst uzmanlıktan yalnızca biri.
- Üç kayıtlı yetenek düzeni; oyun dışında kaydetme, kuşanma ve ücretsiz puan dağıtma. Kayıtlar bu tarayıcıda tutulur.
- Kampanyada başarılı kesimlerden enerji; zaman alanı ve sağlıklı hücreleri koruyan kalkan. Yavaşlatma görev süresini veya hedefin son kullanma süresini uzatmaz.
- Yeni puan ve savunma yardımları çevrim içi maçlarda kapalıdır; görsel yetenekler görünümü değiştirebilir.
- Renkli dal kartları, ön koşullar, uzmanlık etiketleri ve enerji göstergesi.

## Durum

Çevrim içi oda sunucusu medera-akademi projesinde etkinleştirilmiştir. HTML dosyasındaki sunucu bağlantısı yapılandırılmıştır. Tek oyunculu modlar, kombo ve kupa özellikleri de kullanılabilir.

## Kullanım

1. Oyunu aç, dilini ve takma adını seç.
2. Hemen oyna ile hızlı oyuna gir; ilk oyunda kısa anlatımı takip et.
3. Serüven’den 25 ana aşamayı oyna. Bölge finali ve 10 yıldız, bir gizli yol açar.
4. Arkadaşlarla oyna’da Yarış (2–16) veya Takım (2–4) seç; oda aç ya da altı karakterli kodla katıl.
5. Herkes Hazırım dediğinde oda sahibi maçı başlatır. Ortak geri sayımın ardından 50 saniye oynanır.
6. Diğer → Hesabım bölümünden isteğe bağlı bulut hesabı aç. Başka cihazda kurtarma anahtarıyla giriş yap; anahtarı gizli ve güvenli sakla.
7. Diğer → Ayarlar bölümünden vuruş tepkisini ayarla, çevrim dışı hazırlık durumunu gör ve ana ekrana ekle.

Çevrim içi maçta duraklatma yoktur. Bağlantı kesilirse süre devam eder. Tek oyunculu ilerleme cihazda korunur; bulut bağlantısı varsa değişiklikler sıraya alınır.

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

## v1.8 — 16 kişilik arena
Yeni odalara 2–16 oyuncu katılabilir. Herkes Hazırım der; oda sahibi Maçı başlat düğmesine basar. Ortak geri sayım 5 saniye, maç 50 saniyedir. Üç ve daha fazla oyuncuda skorlar yaklaşık saniyede bir yenilenir. Bekleme ekranında ayrılan kişinin yeri yeniden kullanılabilir; oda sahibi ayrılırsa sahiplik en küçük aktif oyuncu numarasına aktarılır. Başlamış maça yeni oyuncu alınmaz. Maç sırasında ayrılan oyuncu birincilikten çıkarılır; kalanlar devam eder. Son bir oyuncu kalırsa hükmen kazanır. Birincilik +30 LP; zirveyi paylaşanlar +10 LP; diğerleri mağlubiyet alır. XP yalnızca en az bir hedef kesen oyuncuya verilir.

`backend/arena_rooms_v4.sql` yeni tablolar ve RLS/servis erişimli oda işlevini ekler; eski iki oyunculu tabloları değiştirmez. Yeni istemci `arenaVersion: 2` gönderir. Önceki istemciler eski düello işlevini kullanabilir. `tests/arena-db-test.sql` gerçek Postgres oda işlevini geçici bir transaction içinde doğrular ve tüm test verisini rollback eder. On altı gerçek telefonda eş zamanlı performans denemesi yapılmadı.

## v1.9 — 25 aşamalı serüven
Serüven sekmesi: beş bölgede 25 aşama, 5/10/15/20/25. aşamalarda bölge finali. Her görev öncesi hedef sayısı, yakalama oranı, kombo, sinerji, öncelikli hedef ve minimum bütünlük koşulları gösterilir. Görev yalnızca sağ panelden değerlendirilir; klasik eğitim karşılaştırması ve 16 kişilik arena korunur.

Yeşil + hücrelerini kesmek 14 bütünlük hasarı verir, komboyu sıfırlar ve puan kazandırmaz. Altın ! öncelikli hedefler 4 saniyede, diğerleri 6 saniyede kaybolur. Kaçırılan öncelikli hedef 7; diğer hedef 3 hasar verir. Başarılı kesim 0,8 bütünlük iyileştirir. Bütünlük koşulu yalnızca son değerle değil oturumdaki en düşük değerle değerlendirilir. Finaller üç dalga, 25. final beş dalgadır; hız her dalgada artar.

Görevi bitirmek bir yıldız verir; sağlıklı hücre kesmeden en az %90 bütünlük ikinci yıldızı, en az %90 yakalama ve daha yüksek kombo üçüncü yıldızı verir. İlk tamamlama 80 XP; final 200 XP + 100 kristal verir. Her final bölge kupası ve bıçak/iz paleti açar; 25. aşama Damar Koruyucusu unvanını açar. Tekrar oynama yıldız ve rekoru iyileştirebilir; ilk-tamamlama ödülünü tekrar vermez. Kaydetme bu tarayıcının localStorage alanındadır, cihazlar arası senkronizasyon yoktur. Mevcut beş aşamalı hızlı meydan okuma da kullanılabilir.

`tests/campaign-test.cjs` gerçek oyun döngüsünde tüm 25 aşamayı ideal kesim stratejisiyle tamamlar; final dalgaları, ön koşullar, korunan hücre ve öncelikli hedef cezaları, başarısızlık sonrası ilerleme korunması, yıldızlar, yerel kayıt ve tek seferlik ödülleri doğrular.

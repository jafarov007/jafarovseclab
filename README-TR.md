# JafarovSecLab

## Genel Bakış
JafarovSecLab, kapsamlı ve pratik odaklı bir güvenlik araştırması ve sızma testi platformudur. Birçok farklı zafiyet kategorisi (IDOR, XSS, SSRF, SQLi vb.) ve her birinin altında çeşitli senaryolar barındırır. Bu senaryoları işleyerek zafiyetlerin gerçek dünyada hangi örneklerle karşınıza çıkabileceğini öğrenebilir, farklı programlama dillerinde (Node.js, Python, PHP, Go, Java, GraphQL) nasıl sömürüldüğünü ve nasıl önlendiğini pratik yapabilirsiniz.

## Özellikler
- **Gerçek Dünya Senaryoları:** Basit CTF soruları yerine, gerçek iş mantığı ve mimari hataları yansıtan uygulamalar.
- **Beyaz Kutu ve Siyah Kutu Testleri:** İsterseniz doğrudan web arayüzü üzerinden uygulamayı istismar edebilir veya her senaryoya entegre edilmiş Kod İnceleme (`/code`) özelliği ile önce arka uç (backend) kodunu okuyarak saldırınızı planlayabilirsiniz.
- **Mikroservis Mimarisi:** Her senaryo, kendine ait özel web arayüzü ve iş mantığı ile izole bir uygulama olarak çalışır.

## Kurulum
Laboratuvarın tamamı Docker ve Docker Compose kullanılarak yönetilir.

1. Repoyu klonlayın:
   ```bash
   git clone https://github.com/jafarov/jafarovseclab.git
   cd jafarovseclab
   ```
2. Ana paneli (dashboard) başlatın:
   ```bash
   docker compose up -d --build
   ```
3. Panele erişin:
   Tarayıcınızı açın ve `http://localhost:8777` adresine gidin.

4. Ortamı durdurma (Terminal):
   Laboratuvarı web arayüzü yerine doğrudan terminal üzerinden durdurmak veya tamamen kaldırmak isterseniz şu komutları kullanabilirsiniz:
   ```bash
   docker compose down      # Konteynerleri durdurur ve siler
   docker compose down -v   # Konteynerleri durdurur ve veritabanı hacimlerini (kalıcı verileri) de tamamen siler
   ```

## Kullanım ve Kaynak Yönetimi
JafarovSecLab panelinde (Port 8777) mevcut zafiyet kategorilerini (örneğin IDOR & Broken Access Control) görebilirsiniz.

- **Lab Başlatma:** Üzerinde çalışmak istediğiniz zafiyet kategorisindeki "Start Lab" butonuna basarak ilgili senaryoların arka planda ayağa kalkmasını sağlayın.
- **Hazır Hesaplar:** Panelde her senaryo için kullanabileceğiniz hazır e-posta adresleri (Kullanıcı A ve Kullanıcı B) verilmiştir. Tüm hesapların şifresi varsayılan olarak `password123` şeklinde ayarlanmıştır.

### Önemli: RAM ve Disk Tüketimini Azaltma
Her zafiyet kategorisi, içinde birden fazla izole konteyner barındırır. Tüm laboratuvarları aynı anda ayağa kaldırmak bilgisayarınızın RAM ve disk kaynaklarını hızla tüketecektir.

- Bir zafiyet (örneğin IDOR) üzerinde çalışmayı bitirip yeni bir zafiyete (örneğin XSS veya SQL Injection) geçmeden önce, paneldeki **"Tear Down Lab"** butonuna tıklayarak bitirdiğiniz laboratuvarı mutlaka silin.
- Bu işlem verileri ve konteynerleri temizleyerek kaynak tüketimini düşürecek ve sisteminizin rahat çalışmasını sağlayacaktır.

## Yasal Uyarı / Sorumluluk Reddi
Bu proje yalnızca eğitim, güvenlik araştırmaları ve yetkili sızma testi pratikleri için geliştirilmiştir. JafarovSecLab içerisinde yer alan zafiyetler ve istismar yöntemleri sadece kapalı laboratuvar ortamlarında test edilmelidir. Bu platformda öğrenilen bilgilerin yetkisiz sistemlere veya üçüncü şahıslara ait uygulamalara karşı kullanılması tamamen yasadışıdır. Ortaya çıkabilecek herhangi bir zarardan veya yasal ihlalden platformun geliştiricileri veya katkıda bulunanlar sorumlu tutulamaz. Laboratuvarı kullanan her birey, geçerli tüm yerel ve uluslararası yasalara uymayı kabul etmiş sayılır.

## Katkıda Bulunma (Contributing)
JafarovSecLab açık kaynaklı bir topluluk projesidir. Yeni zafiyet senaryoları eklemek, mevcut senaryoları geliştirmek veya hata bildiriminde bulunmak isterseniz katkılarınızı memnuniyetle kabul ediyoruz!

1. Bu depoyu Fork'layın (`Fork`).
2. Yeni bir özellik/senaryo dalı oluşturun (`git checkout -b feature/new-xss-scenario`).
3. Değişikliklerinizi commitleyin (`git commit -m 'feat: Add CSP bypass scenario'`).
4. Dalınızı push'layın (`git push origin feature/new-xss-scenario`).
5. Bir **Pull Request (PR)** açın.

### Kesin Katkı Kuralları
- **%100 Yerel Çalışma:** Yapılan güncellemelerde local'den çıkacak hiçbir dış kaynağa (HTTP/DNS vb.) istek atılması veya kullanıcıyı harici sitelere yönlendirme kesinlikle yasaktır. Tüm zafiyetler tamamen local ortamda çözülebilir olmalıdır.
- **Gerçekçi İş Mantığı:** Gelen isteklere (request) sadece senaryoyu geçmek için yapmacık (mock) cevaplar (response) dönülmemelidir. Kodun içinde gerçekten o zafiyeti doğuran, gerçek dünya senaryolarındaki gibi yazılmış mimari kusurlar ve mantık hataları bulunmalıdır.

Detaylı katkı yönergeleri ve yeni senaryo şablonu için [CONTRIBUTING.md](CONTRIBUTING.md) dosyasına göz atabilirsiniz.

## Teşekkür ve İlham Kaynakları (Acknowledgments)
Bu laboratuvardaki senaryoların birçoğu, siber güvenlik araştırmacılarının gerçek dünya sistemlerinde tespit ettiği güvenlik açıklarından ve [Pentester Land Writeups](https://pentester.land/writeups/) arşivinde paylaşılan kamuya açık hata avı (bug bounty) raporlarından esinlenerek modellenmiştir. Bilgi paylaşımında bulunan tüm topluluk üyelerine teşekkür ederiz.

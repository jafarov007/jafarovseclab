# Contributing to JafarovSecLab / JafarovSecLab'e Katkıda Bulunma

*(English follows Turkish)*

## Türkçe

JafarovSecLab açık kaynaklı bir topluluk projesidir. Yeni zafiyet senaryoları eklemek, mevcut senaryoları geliştirmek veya hata bildiriminde bulunmak isterseniz katkılarınızı memnuniyetle kabul ediyoruz!

### Katkı Adımları
1. Bu depoyu Fork'layın (`Fork`).
2. Yeni bir özellik/senaryo dalı oluşturun (`git checkout -b feature/new-xss-scenario`).
3. Değişikliklerinizi commitleyin (`git commit -m 'feat: Add CSP bypass scenario'`).
4. Dalınızı push'layın (`git push origin feature/new-xss-scenario`).
5. Bir **Pull Request (PR)** açın.

### Kesin Katkı Kuralları (Lütfen Okuyun)
Yeni senaryolar veya özellikler eklerken aşağıdaki kurallara kesinlikle uyulmalıdır:

1. **%100 Yerel (Local) Bağımlılık:** Yapılan kod güncellemelerinde, docker konteynerinin dışına (internete veya başka bir dış kaynağa) HTTP/DNS isteği atacak hiçbir kod parçası bulunamaz. Uygulama içerisinden kullanıcıları harici bağlantılara yönlendirmek yasaktır. Zafiyetlerin çözümü ve laboratuvarın çalışması **tamamen yerel ağda (local)** tamamlanabilmelidir.
2. **Gerçekçi İş Mantığı (No Fake Responses):** Gelen HTTP isteklerine sadece senaryoyu geçmek için "yapmacık" (mocked) veya manuel olarak "If user_id=2, dön: Gizli Veri" tarzı sahte cevaplar (response) verilmemelidir. Kodun temel yapısında, o zafiyeti doğuracak (örneğin IDOR, SQLi) **gerçek bir iş mantığı (business logic) hatası veya mimari kusur** bulunmalıdır. Kod, gerçek dünyada yapıldığı gibi hatalı yazılmış olmalıdır.
3. **Standartlara Uyum:** Her senaryonun mutlaka `/code` (Kaynak Kod İnceleme) uç noktası (endpoint) olmalı ve bu uç nokta kendi dosyalarını statik olarak sunabilmelidir. Tasarımlar ve CSS şablonları senaryoya özel ve profesyonel görünmelidir.

---

## English

JafarovSecLab is an open-source community project. We gladly welcome contributions if you want to add new vulnerability scenarios, improve existing ones, or report bugs!

### Contribution Steps
1. Fork this repository (`Fork`).
2. Create a new feature/scenario branch (`git checkout -b feature/new-xss-scenario`).
3. Commit your changes (`git commit -m 'feat: Add CSP bypass scenario'`).
4. Push your branch (`git push origin feature/new-xss-scenario`).
5. Open a **Pull Request (PR)**.

### Strict Contribution Rules (Must Read)
When adding new scenarios or features, you must strictly adhere to the following rules:

1. **100% Local Execution:** No code updates are allowed to make outbound requests (HTTP/DNS, etc.) to any external sources outside the local docker network. Redirecting users to external URLs is strictly prohibited. The operation of the laboratory and the exploitation of vulnerabilities must be **entirely solvable locally**.
2. **Genuine Business Logic (No Fake Responses):** Do not return fake, mocked, or artificially constructed responses (e.g., "If user_id=2, return Secret Data") just to make the scenario work. The codebase must contain a **genuine architectural flaw or business logic vulnerability** (like a real IDOR or SQLi) that naturally results in the vulnerability, exactly as it would be mistakenly written in the real world.
3. **Standardization:** Every scenario must have a working `/code` (Source Code Review) endpoint that can statically serve its own files. Designs and CSS templates should look professional and uniquely tailored for each scenario.

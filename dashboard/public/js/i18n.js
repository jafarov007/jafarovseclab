// JafarovSecLab - Internationalization Dictionary (EN / TR)

const I18N = {
  en: {
    status_idle: 'IDLE',
    status_running: 'ONLINE',
    status_loading: 'INITIALIZING...',

    search_placeholder: 'Search vulnerability labs...',
    scenarios_count: 'scenarios',
    badge_ready: 'Active',
    badge_soon: 'Coming Soon',

    welcome_title: 'Welcome to JafarovSecLab',
    welcome_subtitle: 'A specialized hands-on security research platform. Master complex vulnerability chains in realistic multi-language application environments.',
    readme_title: 'PLATFORM_GUIDE.md',
    readme_getting_started: 'Quick Start Instructions',
    readme_step_1: 'Select a vulnerability laboratory from the left sidebar navigation.',
    readme_step_2: 'Click the "Start Lab" button to launch the isolated backend environment.',
    readme_step_3: 'After the environment initializes, expand the scenarios below.',
    readme_step_4: 'Click "Launch Web Interface" to access each scenario\'s custom web app UI or "Code Review" to audit source code.',
    readme_step_5: 'To reset the database, click "Stop Lab". To completely remove the lab, click "Tear Down Lab".',
    readme_how_it_works: 'Architecture & Isolation',
    readme_how_desc: 'Each laboratory operates within isolated Docker containers backed by SQLite datastores. Every scenario features its own custom web interface and source code viewer (/code).',
    readme_code_review: 'White-Box Code Analysis',
    readme_code_desc: 'Access the /code path on any active lab subdomain to perform source code review in Python, PHP, Go, Java, Node.js, and GraphQL.',
    readme_important: 'Disclaimer',
    readme_important_desc: 'This platform is intended exclusively for educational security research and ethical authorization testing.',

    btn_start: 'Start Lab',
    btn_stop: 'Stop Lab',
    btn_delete: 'Tear Down Lab',
    btn_starting: 'Starting Environment...',
    btn_deleting: 'Tearing Down Lab...',
    lab_description_idor: 'Explore 8 distinct real-world Insecure Direct Object Reference (IDOR), BOLA, BFLA, and Data Parsing vulnerability scenarios with individual web interfaces and source code viewers.',
    lab_description_xss: 'Explore real-world Client-Side & Cross-Site Scripting (XSS) vulnerability scenarios in modern web frameworks with custom web app UIs and white-box source code viewers.',
    xss_s1_title: '1. Vue.js Client-Side Template Injection (CSTI)',
    xss_s1_desc: 'The application strips HTML script/img tags and javascript strings from email query parameters, but mounts them directly into the Vue root template.',
    xss_s1_obj: 'Bypass input sanitization using Vue.js template expression syntax to execute client-side JavaScript.',
    xss_s2_title: '2. jQuery DOM XSS & Character Limit Bypass',
    xss_s2_desc: 'The application allows users to update their profile display name via POST request, enforcing a strict 60-character length limit and sanitizing script/img tags.',
    xss_s2_obj: 'Bypass input sanitization and the 60-character length constraint by leveraging jQuery alias shortcuts to load and execute an external script payload.',
    xss_s3_title: '3. PHP Audit Log Stored XSS (X-Real-IP & Referrer Injection)',
    xss_s3_desc: 'The application logs page navigation events storing X-Real-IP header and http_referrer_url POST body parameter without HTML sanitization.',
    xss_s3_obj: 'Inject XSS payloads into X-Real-IP HTTP header or http_referrer_url POST parameter to trigger stored XSS when Admin views activity logs.',
    xss_s4_title: '4. Python Flask Filter Bypass & JavaScript Pseudo-Protocol XSS',
    xss_s4_desc: 'The application uses single-pass non-recursive tag stripping on forum comments and fails to validate URI schemes on user profile website links.',
    xss_s4_obj: '1. Bypass single-pass stripping using nested tags (&lt;scr&lt;script&gt;ipt&gt;prompt(1)&lt;/scr&lt;script&gt;ipt&gt; or &lt;img/s&lt;script&gt;rc&lt;script&gt;/oner&lt;script&gt;ror=prompt(8)&gt;).<br>2. Inject javascript: pseudo-protocol into website URL (javascript:prompt(1)).',

    terminal_title: 'Container Setup Log',
    setup_step_1: 'Booting isolated service containers...',
    setup_step_2: 'Initializing database tables and randomized user IDs...',
    setup_step_3: 'Seeding test accounts (User A & User B)...',
    setup_step_4: 'Configuring 8 scenario subdomains & web interfaces...',
    setup_step_5: 'Enabling scenario listeners...',
    setup_step_6: 'Running backend health check...',
    setup_complete: 'Lab initialized successfully!',

    scenarios_title: 'Vulnerability Scenarios & Web Interfaces',
    scenario_active: 'Active',

    label_target_url: 'Target Endpoint',
    label_subdomain: 'Subdomain Web App',
    label_hosts_entry: '/etc/hosts Configuration',
    label_credentials: 'Pre-Seeded Accounts',
    label_user_a: 'User A (Victim / Account 1)',
    label_user_b: 'User B (Attacker / Account 2)',
    label_email: 'Email',
    label_password: 'Password',
    label_launch_app: 'Launch Web App UI',
    label_code_review: 'Code Review',
    label_code_review_desc: 'Open Source Code Reviewer',

    s1_title: '1. IDOR + Weak Token Validation (Timestamp Window)',
    s1_desc: 'The corporate profile dashboard validates token timestamp and existence, but fails to check token ownership against user_id.',
    s1_obj: 'Log in as User B, extract token and timestamp, then fetch User A\'s profile.',

    s2_title: '2. Type Confusion / E-Notation IDOR (Prefix Check vs Numeric Parsing)',
    s2_desc: 'The financial analytics portal verifies ID prefix string, but backend float parser converts scientific notation (123e1 = 1230).',
    s2_obj: 'Use E-Notation on User B\'s profile request to access User A\'s financial account data.',

    s3_title: '3. HTTP Method Tampering & Path vs Body ID Mismatch',
    s3_desc: 'Settings portal blocks GET, but accepts PUT with _method=PATCH where auth checks path ID and data layer fetches body ID.',
    s3_obj: 'Send a PUT request with _method=PATCH or body ID mismatch to extract User A\'s PII.',

    s4_title: '4. File Upload & Avatar Path IDOR',
    s4_desc: 'Media manager updates avatar_url based on caller-supplied avatar_path without verifying file ownership or user identity.',
    s4_obj: 'Update avatar reference specifying User A\'s ID to overwrite or hijack stored avatar files.',

    s5_title: '5. Missing Token Binding in Password Reset Flow (Full ATO)',
    s5_desc: 'Password reset link sends reset token, but POST /passreset form updates password using id parameter without validating token.',
    s5_obj: 'Submit password reset specifying User A\'s ID without knowing their reset token.',

    s6_title: '6. Unauthenticated Privilege Escalation (BFLA) + IDOR',
    s6_desc: 'Admin console role promotion API lacks authentication and role verification middleware.',
    s6_obj: 'Promote your user account to admin role via unauthenticated API call.',

    s7_title: '7. GraphQL Introspection + BOLA Mutation',
    s7_desc: 'GraphQL API leaves schema introspection enabled, exposing deleteUser and updateUserRole mutations with no BOLA check.',
    s7_obj: 'Run introspection query, find deleteUser mutation, and delete User A\'s record.',

    s8_title: '8. JWT Signature Removal / Alg None IDOR',
    s8_desc: 'SSO portal validates HS256 tokens, but lacks an else check for alg: "none", skipping signature verification.',
    s8_obj: 'Modify user_id in JWT payload, set alg to "none", and access User A\'s session.'
  },

  tr: {
    status_idle: 'BOSTA',
    status_running: 'AKTIF',
    status_loading: 'BASLATILIYOR...',

    search_placeholder: 'Zafiyet lablarinda ara...',
    scenarios_count: 'senaryo',
    badge_ready: 'Aktif',
    badge_soon: 'Yakinda',

    welcome_title: 'JafarovSecLab\'e Hos Geldiniz',
    welcome_subtitle: 'Uzmanlasmis pratik guvenlik arastirma platformu. Gercekci cok dilli uygulama ortamlarinda karmasik zafiyet zincirlerini deneyimleyin.',
    readme_title: 'PLATFORM_REHBERI.md',
    readme_getting_started: 'Hizli Baslangic Talimatlari',
    readme_step_1: 'Sol menuden bir zafiyet laboratuvari secin.',
    readme_step_2: 'Izole arka plan ortamini baslatmak icin "Lab\'i Baslat" butonuna tiklayin.',
    readme_step_3: 'Ortam yuklendikten sonra asagidaki senaryolari genisletin.',
    readme_step_4: '"Uygulama Arayuzunu Ac" butonuna tiklayarak her senaryonun ozel web arayuzune erisin ya da "Kod Inceleme" ile kaynak kodu inceleyin.',
    readme_step_5: 'Veritabanini sifirlamak icin "Lab\'i Durdur", ortamı tamamen kaldirmak icin "Lab\'i Sil" butonunu kullanin.',
    readme_how_it_works: 'Mimari ve Izolasyon',
    readme_how_desc: 'Her laboratuvar izole Docker konteynerinde calisir. 8 senaryonun her biri kendi web arayuzune ve /code yoluna sahiptir.',
    readme_code_review: 'Beyaz Kutu Kod Analizi',
    readme_code_desc: 'Her senaryonun /code adresinden Python, PHP, Go, Java, Node.js ve GraphQL kaynak kodlarini inceleyin.',
    readme_important: 'Yasal Uyari',
    readme_important_desc: 'Bu platform yalnizca egitim, guvenlik arastirmasi ve etik sizma testi amacli tasarlanmistir.',

    btn_start: 'Lab\'i Baslat',
    btn_stop: 'Lab\'i Durdur',
    btn_delete: 'Lab\'i Sil / Kaldir',
    btn_starting: 'Ortam Baslatiliyor...',
    btn_deleting: 'Lab Kaldiriliyor...',
    lab_description_idor: 'Node.js, Python, PHP, Go ve Java ile yazilmis 8 farkli IDOR senaryosu, kendi web arayuzleri ve kaynak kod inceleyicileri ile.',
    lab_description_xss: 'Modern web çatılarındaki Client-Side ve Cross-Site Scripting (XSS) zafiyet senaryolarını kendi web arayüzleri ve kaynak kod inceleyicileri ile deneyimleyin.',
    xss_s1_title: '1. Vue.js İstemci Taraflı Şablon Enjeksiyonu (CSTI)',
    xss_s1_desc: 'Uygulama email URL parametresinden HTML script/img etiketlerini ve javascript kelimelerini temizler ancak veriyi doğrudan Vue kök şablonuna bağlar.',
    xss_s1_obj: 'Girdi filtrelemesini Vue.js şablon ifadelerini kullanarak atlatın ve istemci tarafında JavaScript çalıştırın.',
    xss_s2_title: '2. jQuery DOM XSS & Karakter Sınırı Bypass',
    xss_s2_desc: 'Uygulama kullanıcıların profil isimlerini 60 karakterlik sıkı bir sınır ve script/img filtrelemesi ile POST isteği üzerinden güncellemesine izin verir.',
    xss_s2_obj: 'Girdi filtrelemesini ve 60 karakterlik boy kısıtlamasını jQuery takma ad (alias) kısaltmalarını kullanarak atlatın ve harici script çalıştırın.',
    xss_s3_title: '3. PHP Güvenlik Logu Stored XSS (X-Real-IP & Referrer Enjeksiyonu)',
    xss_s3_desc: 'Uygulama sayfa gezinme loglarını kaydederken X-Real-IP header ve http_referrer_url POST parametrelerini filtrelemeden veritabanına kaydeder ve admin panelinde filtresiz basar.',
    xss_s3_obj: 'X-Real-IP HTTP başlığı veya http_referrer_url POST parametresi üzerinden XSS payload\'ı enjekte edin ve Admin güvenlik loglarını incelerken zararlı kodun çalışmasını sağlayın.',
    xss_s4_title: '4. Python Flask Filtre Bypass & JavaScript Pseudo-Protocol XSS',
    xss_s4_desc: 'Uygulama forum yorumlarında tek geçişli özyinelemesiz etiket temizleme kullanır ve profil web sitesi bağlantısında URI şemasını doğrulamaz.',
    xss_s4_obj: '1. İç içe etiketler kullanarak tek geçişli filtreyi atlatın (&lt;scr&lt;script&gt;ipt&gt;prompt(1)&lt;/scr&lt;script&gt;ipt&gt; veya &lt;img/s&lt;script&gt;rc&lt;script&gt;/oner&lt;script&gt;ror=prompt(8)&gt;).<br>2. Web sitesi bağlantısına javascript: protokolü enjekte edin (javascript:prompt(1)).',

    terminal_title: 'Konteyner Kurulum Logu',
    setup_step_1: 'Izole servis konteynerleri baslatiliyor...',
    setup_step_2: 'Veritabani tablolari ve rastgele kullanici ID\'leri olusturuluyor...',
    setup_step_3: 'Test hesaplari yukleniyor (Kullanici A ve Kullanici B)...',
    setup_step_4: '8 senaryo subdomain\'i ve web arayuzleri yapilandiriliyor...',
    setup_step_5: 'Senaryo dinleyicileri aktif ediliyor...',
    setup_step_6: 'Servis saglik kontrolu yapiliyor...',
    setup_complete: 'Lab basariyla kuruldu!',

    scenarios_title: 'Zafiyet Senaryolari ve Web Arayuzleri',
    scenario_active: 'Aktif',

    label_target_url: 'Hedef API Adresi',
    label_subdomain: 'Subdomain Web Uygulamasi',
    label_hosts_entry: '/etc/hosts Yapilandirmasi',
    label_credentials: 'Hazir Test Hesaplari',
    label_user_a: 'Kullanici A (Kurban / Hesap 1)',
    label_user_b: 'Kullanici B (Saldirgan / Hesap 2)',
    label_email: 'E-posta',
    label_password: 'Sifre',
    label_launch_app: 'Uygulama Arayuzunu Ac',
    label_code_review: 'Kod Inceleme',
    label_code_review_desc: 'Kaynak Kod Inceleyicisi',

    s1_title: '1. IDOR + Zayif Token Dogrulamasi (Timestamp Penceresi)',
    s1_desc: 'Kurumsal profil paneli token timestamp\'ini ve varligini dogrular fakat token sahipligini user_id ile eslestirmez.',
    s1_obj: 'Kullanici B olarak giris yapin, token ve timestamp bilgisini alarak Kullanici A\'nin profilini çekin.',

    s2_title: '2. Type Confusion / E-Notation IDOR (Prefix Kontrolu vs Sayisal Ayristirma)',
    s2_desc: 'Finansal analitik portali ID prefix stringini kontrol eder fakat backend float parser bilimsel gosterimi (123e1 = 1230) parse eder.',
    s2_obj: 'Kullanici B\'nin isteginde E-Notation kullanarak Kullanici A\'nin finansal verilerine erisin.',

    s3_title: '3. HTTP Metod Degistirme ve Path vs Body ID Uyuşmazligi',
    s3_desc: 'GET istegini engelleyen ayarlar portali, path ID\'sini kontrol edip veriyi body ID\'den ceken _method=PATCH PUT istegini kabul eder.',
    s3_obj: '_method=PATCH veya body ID uyusmazligi ile Kullanici A\'nin verisini çekin.',

    s4_title: '4. Dosya Yukleme ve Profil Resmi IDOR',
    s4_desc: 'Medya yoneticisi dosya sahipligini doğrulamadan avatar_url alanini avatar_path ile gunceller.',
    s4_obj: 'Kullanici A\'nin ID\'si ile avatar yolunu guncelleyerek dosya uzerine yazin.',

    s5_title: '5. Sifre Sifirlama Akisinda Eksik Token Baglama (Tam ATO)',
    s5_desc: 'Sifre sifirlama maili token gonderir fakat POST /passreset formu token\'i doğrulamadan id parametresi ile sifreyi degistirir.',
    s5_obj: 'Sifre sifirlama token\'ini bilmeden Kullanici A\'nin ID\'si ile sifreyi degistirin.',

    s6_title: '6. Kimlik Dogrulamasiz Yetki Yukseltme (BFLA) + IDOR',
    s6_desc: 'Admin konsolu terfi API\'sinde yetkilendirme ve rol kontrol middleware\'i yoktur.',
    s6_obj: 'Yetkisiz API çagrisi ile kendi hesabinizin rolunu admin yapin.',

    s7_title: '7. GraphQL Introspection + BOLA Mutation',
    s7_desc: 'GraphQL API introspection aciktir; deleteUser ve updateUserRole mutation\'larinda BOLA kontrolu yoktur.',
    s7_obj: 'Introspection sorgusu atin, deleteUser mutation\'ini bulun ve Kullanici A\'yi silin.',

    s8_title: '8. JWT Imza Kaldirma / Alg None IDOR',
    s8_desc: 'SSO portali HS256 token\'larini dogrular fakat alg: "none" durumu icin else kontrolu olmadigindan imzayi atlar.',
    s8_obj: 'JWT payload\'indaki user_id\'yi degistirin, alg değerini "none" yapip Kullanici A oturumuna erisin.'
  }
};

let currentLang = localStorage.getItem('jafarovseclab_lang') || 'en';

function t(key) {
  return (I18N[currentLang] && I18N[currentLang][key]) || (I18N['en'] && I18N['en'][key]) || key;
}

function toggleLanguage() {
  currentLang = currentLang === 'en' ? 'tr' : 'en';
  localStorage.setItem('jafarovseclab_lang', currentLang);
  updateLanguageUI();
  if (typeof window.renderCurrentView === 'function') {
    window.renderCurrentView();
  }
}

function updateLanguageUI() {
  const btn = document.getElementById('lang-toggle');
  if (btn) {
    btn.querySelector('.lang-flag').textContent = currentLang === 'en' ? '🇬🇧' : '🇹🇷';
    btn.querySelector('.lang-code').textContent = currentLang.toUpperCase();
  }
  const search = document.getElementById('lab-search');
  if (search) {
    search.placeholder = t('search_placeholder');
  }
}

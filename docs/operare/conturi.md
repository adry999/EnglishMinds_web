# Conturile serviciilor

**Regulă:** niciodată parole, chei sau coduri în acest fișier sau în repository. Parolele stau într-un manager de parole al clientului. Aici se trec doar proprietarul și starea 2FA.

Completează `—` pe măsură ce afli informația.

| Serviciu | Pentru ce | Cine e proprietar | Unde se administrează | 2FA activat (da/nu) | Observații |
|---|---|---|---|---|---|
| GitHub (repository + Actions) | Codul site-ului și publicarea automată | — | github.com, repository-ul proiectului | — | Secretele și variabilele de publicare sunt la Settings → Environments |
| Hosting cPanel | Găzduiește site-ul, aplicația Node și baza de date MySQL | — | Panoul cPanel al hostingului | — | Node ≥ 22.22.3 necesar |
| Registrar domeniu | Domeniul `englishminds.ro` și DNS-ul | — | — | — | DNS-ul trebuie să arate spre hosting |
| Email pe domeniu | Căsuța `MAIL_TO` (primește contactele) și contul SMTP | — | cPanel → Email Accounts | — | Valorile sunt în variabilele aplicației Node |
| Google Analytics 4 | Măsurarea vizitelor și a evenimentului `generate_lead` | — | analytics.google.com | — | |
| Google Ads | Campanii și conversia „Lead” | — | ads.google.com | — | |
| Meta Business (Pixel) | Pixelul Meta și evenimentul `Lead` | — | business.facebook.com | — | |
| WhatsApp Business | Numărul de contact și mesajele de la părinți | — | Aplicația WhatsApp Business | — | |
| Google Search Console | Indexarea și sitemap-ul | — | search.google.com/search-console | — | |
| Instagram | `@englishminds_academy` | — | instagram.com | — | |

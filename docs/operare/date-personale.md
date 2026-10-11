# Date personale: cereri GDPR

Contactele sunt în tabela `leads` din MySQL. Nu există pagină de administrare: cererile se rezolvă din phpMyAdmin.

Numărul de telefon se salvează normalizat, în formatul `+40…` (de exemplu `+40775630680`). Normalizează numărul primit în cerere în același format înainte de căutare. Înlocuiește `+407XXXXXXXX` din exemple cu numărul real și verifică de două ori că nu rămâne nimic din șablon.

## Acces / export

Cererea „ce date aveți despre mine":

```sql
SELECT * FROM leads WHERE phone = '+407XXXXXXXX';
```

În phpMyAdmin, folosește „Export" pe rezultat (format CSV) și trimite fișierul persoanei care a făcut cererea.

## Ștergere

```sql
DELETE FROM leads WHERE phone = '+407XXXXXXXX';
```

Rulează mai întâi `SELECT`-ul de mai sus ca să vezi ce se șterge. Șterge și emailurile de notificare pentru acel număr din căsuța `MAIL_TO`: jobul de 12 luni nu le acoperă. Confirmă persoanei că datele au fost șterse.

## Păstrare

Jobul zilnic (vezi `server.md`, secțiunea Cron) șterge contactele mai vechi de 12 luni și limitele de trimitere mai vechi de 24 de ore (rulând o dată pe zi, o amprentă IP dispare în cel mult 2 zile).

Jobul nu atinge emailurile de notificare din căsuța `MAIL_TO`. Șterge manual, cel puțin lunar, emailurile de notificare mai vechi de 12 luni.

## Ce NU se stochează

- Numele copilului.
- Răspunsurile la testul de nivel (se salvează doar nivelul recomandat, dacă există).
- Adresa IP în clar în baza de date (serverul o primește la cerere, iar jurnalele furnizorului de găzduire o pot păstra; aplicația stochează doar o amprentă SHA-256 cu sare, în tabela `rate_limits`, ștearsă automat în cel mult 2 zile).
- User-agent-ul.

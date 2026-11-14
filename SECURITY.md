# Xavfsizlik holati (v30)

## Himoyalar
- Seed qurilmada AES-256-GCM bilan shifrlanadi (PBKDF2 600 000 + 12 so'zdan olingan kalit).
- PIN/parol: Argon2id (64 MiB, 3 o'tish). Yangi PIN kamida 8 raqam (eski 6-7 xonali PIN ochilishda ishlaydi). Android ilovada qo'shimcha Keystore "pepper" (v3) — blob boshqa qurilmada ochilmaydi.
- Kunlik yuborish limiti (standart 1000 USD / 24 soat). Limitdan oshgan yuborish bloklanadi; limitni o'zgartirish uchun maxfiy so'zlar kerak.
- Har yuborishda maxfiy so'zlarni qayta kiritish, manzil oxirgi 6 belgisini yozish, o'xshash manzil (poisoning) ogohlantirishi.
- CSP: skriptlar faqat hash bilan, 'wasm-unsafe-eval' faqat Argon2 uchun; tarmoq faqat ruxsat etilgan RPC'lar.
- Android: FLAG_SECURE, zaxira o'chirilgan, cleartext yo'q, fayl kirishi yopiq.

## Hali yo'q (katta summa uchun muhim)
- Mustaqil xavfsizlik auditi.
- Jonli tarmoqda uzoq muddatli sinov.
- Hardware wallet / multisig qo'llab-quvvatlashi.
- Android kodi kompilyatsiya qilinmagan (faqat sintaksis tekshirilgan).
- Qisqa PIN (6 xona) Argon2id bilan ham yetarli emas: katta summa uchun uzun parol yoki maxfiy so'zlar bilan kirish tavsiya etiladi.

## Tekshirish
```
cd pwa && npm i playwright hash-wasm @ton/ton @ton/core @ton/crypto tweetnacl && node tests/run-all.js
sha256sum pwa/index.html   # SHA256SUMS bilan solishtiring
```
Uchinchi tomon kutubxonasi: hash-wasm 4.12.0 (MIT), tools/argon2.umd.min.js.

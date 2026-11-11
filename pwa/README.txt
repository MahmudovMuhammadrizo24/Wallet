MENING HAMYONIM, telefonga o'rnatiladigan (PWA) to'plam, versiya 25

Papkada: index.html (ilovaning o'zi), manifest.webmanifest, sw.js, _headers va ikonkalar.
Hammasi bitta papkada, bir xil manzilda turishi kerak. index.html ni to'g'ridan-to'g'ri ochsangiz ham ishlaydi,
lekin telefonga o'rnatish (oflayn ochilish) faqat https manzildan ishlaydi.

1) JOYLASHTIRISH (5 daqiqa): Netlify Drop
   app.netlify.com/drop sahifasiga shu papkani sudrab tashlang. Berilgan https://...netlify.app manzilini telefonda oching:
     Android Chrome: menyu -> "Bosh ekranga qo'shish" (yoki ilova ichidagi "O'rnatish" tugmasi)
     iPhone Safari:  "Ulashish" -> "Bosh ekranga qo'shish"
   Kompyuterda sinash: shu papkada  python3 -m http.server 8080  va http://localhost:8080 ni oching.
   _headers fayli Netlify/Cloudflare Pages'da o'zi ishlaydi (sahifani boshqa saytga ramka qilib joylashtirishni taqiqlaydi).

2) XAVFSIZLIK
   - Ilovani faqat O'ZINGIZ nazorat qiladigan hisobda joylashtiring. Hosting egasi fayllarni almashtira olsa,
     ilova kodini o'zgartirib, so'zlaringizni o'g'irlashi mumkin. Manzilni hech kimga bermang.
   - index.html yaxlitligi (SHA-256):
       db84302009d6aa646c0302b0ec4a0ee40942225c35e85077a039d8a2bf10e188
     Tekshirish: Linux/Mac: sha256sum index.html   Windows: certutil -hashfile index.html SHA256
   - Ma'lumotlar brauzerda MANZIL (domen) bo'yicha alohida saqlanadi. Ko'chirish uchun eskisida "Zaxira faylini yuklab olish",
     yangisida "Hamyon kiritish" -> "Zaxira faylini yuklash" va so'zlarni kiriting.
   - Ilova mustaqil xavfsizlik auditidan o'tmagan. Katta summalar uchun tekshirilgan hamyonlarni ishlating.

3) YANGILASH
   Yangi fayllarni shu manzilga qayta joylang. Ilova keyingi ochilishda o'zini yangilaydi. Eski hamyon va zaxira fayllari
   o'zgarishsiz ishlaydi (saqlash formati v9 bilan bir xil).

4) VERSIYA 12 NIMA O'ZGARTIRDI
   - PIN bilan tez kirish (Xavfsizlik sahifasida yoqiladi): 6 xonali PIN so'zlarni shu qurilmada shifrlab saqlaydi, 5 marta xato kiritilsa o'chadi.
     Yuborishda so'zlar baribir so'raladi. PIN ni yoqish ixtiyoriy.
   - Kontaktlar sahifasi (Sozlamalar ichida): manzillar kitobini qo'shish, ko'rish va o'chirish. Yuborishda ro'yxatdan tanlanadi.
   - USDC va DAI (Ethereum, ERC-20): Qo'shish sahifasidagi "Token qo'shish" tugmasi mavjud Ethereum manzillariga token qo'shadi. Balans, tarix, qabul va yuborish ishlaydi.
   - Yuborishdan oldin xavf ogohlantirishlari (Ethereum/ERC-20): smart-kontrakt manzil, hech qachon ishlatilmagan manzil; "yoqish" manzillariga yuborish rad etiladi.
   - Yangi "Mining" sahifasi (Bosh sahifadagi karta yoki Sozlamalar orqali): Bitcoin tarmog'i statistikasi
     (hashrate, qiyinlik, keyingi qiyinlik o'zgarishi, blok mukofoti, halving) va bitta qurilma uchun foyda kalkulyatori.
   - Ma'lumot faqat ommaviy manbalardan o'qiladi (mempool.space, CoinGecko). Yangi sayt ruxsati kerak bo'lmadi, manzil va kalitlar
     yuborilmaydi. Ilovaning o'zi mining qilmaydi va hamyon balansiga tegmaydi.
   - Kalkulyatorga kiritilgan qiymatlar shu qurilmada saqlanadi va "Hamyonni o'chirish" bilan birga o'chiriladi.
   - Kripto kutubxonasi (kalit hosil qilish va imzolash) v9 bilan bayt-bayt bir xil. Saqlash formati ham o'zgarmagan.

   VERSIYA 10 (qisqacha): havorang-sariq mavzu va Tizim/Och/Qorong'i tanlovi, register.js olib tashlandi,
   service worker xato sahifalarni keshlamaydi, TRX va USDT balansi bitta so'rov bilan olinadi.

5) VERSIYA 13 NIMA O'ZGARTIRDI (audit topilmalari)
   - Bitcoin balansi: blockstream.info ishlamasa avtomatik mempool.space ga o'tadi.
   - Yangi manzil ogohlantirishi endi Bitcoin va Solana uchun ham bor (Ethereum va Tron'da avvaldan bor edi).
   - PIN 6 dan 12 gacha raqam bo'lishi mumkin (8+ tavsiya etiladi). Eski 6 xonali PIN lar ishlayveradi.
   - Qulf ochishda "so'zlar mos kelmadi" va "saqlangan ma'lumot buzilgan" xabarlari ajratildi.
   - Dizayn: matn o'lchami va burchak radiusi shkalaga keltirildi, tanga ranglari CSS tokenlarida,
     sichqoncha ustiga borish (hover) holati, tugmada yuklanish holati, xato maydonlari qizil chegara bilan.
   - tests/ papkasi: avtomatik sinovlar (Node + Playwright kerak), ishga tushirish: tests/README.txt.

6) VERSIYA 14 NIMA O'ZGARTIRDI
   - Parol bilan kirish: Xavfsizlik sahifasida "Parol o'rnatish" (kamida 8 belgi, harf/raqam/belgi). 10 ta xatodan keyin o'chadi.
     PIN yoki parol: bir vaqtda bittasi. Yuborishda maxfiy so'zlar baribir so'raladi.
   - Face ID / barmoq izi bilan kirish (Touch ID, Windows Hello, Android ham): brauzerning WebAuthn "PRF" xususiyati orqali
     qurilmaning o'zi kalit beradi. PRF qo'llab-quvvatlanmasa, tugma o'chiq turadi (soxta qulf yo'q). iPhone uchun iOS 18+ kerak.
   - Face ID ham, PIN/parol ham zaxira faylga kirmaydi va "Hammasini o'chirish"da o'chadi.

7) VERSIYA 15 NIMA O'ZGARTIRDI
   - Sozlamalarda alohida "Kirish usuli" qatori (holati bilan: Yoqilgan: Parol, Face ID...).
   - Bosh sahifada, kirish usuli yoqilmagan bo'lsa, "Parol yoki Face ID o'rnating" kartasi ("Keyinroq" bilan yopiladi).
   - Kirish ekranida, usul yoqilmagan bo'lsa, qayerdan o'rnatish haqida eslatma.

8) VERSIYA 16: Android ilova (alohida zip: hamyon-android) ichida Face ID/barmoq izi telefonning Keystore xotirasi orqali ishlaydi.
   Brauzerda xatti-harakat o'zgarmagan.

9) VERSIYA 17: USDT boshqa tarmoqlarda
   Polygon, Arbitrum One, Optimism, Avalanche C-Chain va BNB Chain (ko'rish, qabul qilish, yuborish); Solana USDT (faqat ko'rish va qabul qilish).
   "Token qo'shish" bo'limidan qo'shiladi, yangi manzil kerak emas. Komissiya shu tarmoqning o'z tangasida to'lanadi (POL, AVAX, BNB, ETH).
   Kontrakt manzillari ikki manba bilan solishtirilgan, ishlatishda decimals, belgi va zanjir raqami tarmoq orqali qayta tekshiriladi.
   Yangi ulanadigan xizmatlar (faqat shu tokenlar qo'shilganda ishlatiladi): publicnode va rasmiy RPC lar, har tarmoq uchun 2 tadan.

10) VERSIYA 18: aktivlar tarmoq bo'yicha
   "Aktivlar" sahifasida va To'ldirish/Jo'natish tanlovida kriptolar tarmoq sarlavhasi ostida alohida ko'rsatiladi
   (Bitcoin, Ethereum, Tron, Solana, Polygon, Arbitrum One, Optimism, Avalanche C-Chain, BNB Chain, qo'lda qo'shilganlar).
   Har sarlavhada shu tarmoqdagi aktivlar soni va jami qiymati bor. Saqlash formati, kripto kutubxonasi va ruxsatlar o'zgarmagan.

11) VERSIYA 19: tarmoq tangalari va yangi tokenlar
   Qo'shish sahifasida "Tarmoq tangalari va tokenlar": POL (Polygon), AVAX (Avalanche), BNB (BNB Chain), ETH (Arbitrum One, Optimism),
   USDC (Ethereum, Polygon, Arbitrum, Optimism, Avalanche, BNB Chain, Tron, Solana), WBTC, LINK, UNI, SHIB (Ethereum). "Hammasini qo'shish" tanlovi bor.
   Hammasi mavjud manzilingizdan foydalanadi. Solana tokenlari faqat ko'rish va qabul qilish. Tarmoq tangalari va Tron USDC jonli tarmoqda sinalmagan:
   kichik summa bilan boshlang. BNB Chain'dagi USDC Binance-Peg (Circle emas). Arbitrum/Optimism'da yuborishda L1 komissiyasi uchun 0.0001 ETH zaxira qoldiriladi.
   Kripto kutubxonasida bitta o'zgarish: Tron imzolashda USDT bilan birga USDC kontrakti ham ruxsat etilgan.

12) VERSIYA 20: TON tarmog'i
   Yangi hamyonlarda TON manzili avtomatik hosil bo'ladi (wallet v4R2, yo'l m/44'/607'/0', SLIP-0010 ed25519). Eski hamyonlarda TON manzili
   maxfiy so'zlar bilan kirganda avtomatik qo'shiladi. TON: balans, tarix, qabul qilish, yuborish (izohsiz). USDT (Jetton, TON): faqat balans va qabul qilish.
   MUHIM: Tonkeeper'ning o'z 24 so'zli TON formati bu emas. Tonkeeper'ga shu so'zlarni kiritsangiz boshqa manzil chiqishi mumkin;
   manzilni shu ilovadagi "Qabul qilish" sahifasidan oling. Kripto qismi rasmiy @ton/ton kutubxonasi bilan solishtirilgan (manzil va imzolangan xabar bir xil).
   Jonli tarmoqda sinalmagan: kichik summa bilan boshlang. TON so'rovlari bepul toncenter orqali (soniyasiga 1 ta), shuning uchun balans sekinroq yangilanadi.
   Kripto kutubxonasida o'zgarish: TON kaliti, manzili va wallet v4R2 xabarini imzolash moduli qo'shilgan; boshqa qismlari o'zgarmagan.

13) VERSIYA 21: har bir tarmoq bo'limida token tanlash
   "Aktivlar" sahifasida har bir tarmoq (Bitcoin, Ethereum, Tron, Solana, TON, Polygon, Arbitrum One, Optimism, Avalanche, BNB Chain) bo'limida
   "+ ... tokeni qo'shish" tanlovi bor: o'sha tarmoqning mashhur tokenlari mashhurlik tartibida, hali qo'shilmaganlari. Bittasini tanlasangiz darhol qo'shiladi.
   Tarmoq tangasi (POL, AVAX, BNB, ETH) ham shu yerda. Qo'shish sahifasi avvalgidek ishlaydi. Kripto kutubxonasi o'zgarmagan.

14) VERSIYA 22: UI takomillashtirish (faqat ko'rinish va qulaylik; xavfsizlik va kripto kodi o'zgarmagan)
   - Pastki tab-bar to'liq yopiq, faol bo'lim havorang yumaloq belgi bilan ajratilgan.
   - Bosh sahifada bitta asosiy tugma (sariq "Yuborish"), nomlar bir xil: Qabul qilish, Yuborish, Qo'shish.
   - Faol tab va segment havorang (sariq faqat asosiy amalga qoldirildi).
   - Aktiv qatorida o'chirish endi qizil to'ldirishsiz axlat qutisi belgisi (tasdiq oynasi avvalgidek); barcha tugmalar kamida 44 px.
   - Har bir tarmoq bo'limida token tanlash: select o'rniga pastdan chiqadigan varaq, qidiruv bilan.
   - Qabul qilish sahifasida "Manzilni nusxalash" tugmasi to'liq kenglikda.

15) VERSIYA 23: yana UI (kripto va xavfsizlik kodi o'zgarmagan)
   - "Aktivlar" sahifasida tarmoq bo'limi sarlavhasini bossangiz bo'lim yig'iladi/ochiladi (holat shu qurilmada eslab qolinadi; summa ko'rinib turadi).
   - Sozlamalar guruhlarga bo'lindi: Hamyon, Xavfsizlik, Qo'shimcha, Ko'rinish. "Kirish usuli" uchun qulf belgisi.
   - Mavzu tanlovi havorang segmentga o'tdi. Pastki "Bosh" tabi "Hamyon" deb o'zgardi.

VERSIYA 24: xavfsizlik tuzatishlari (red-team hisobotiga javob)
   - Avto-qulf endi mutlaq vaqt (Date.now) bilan ham tekshiriladi: telefon uyquga ketsa ham, qaytganda hamyon qulflanadi.
   - Hamyon begona sahifa ramkasi (iframe) ichida ishlamaydi (clickjacking himoyasi).
   - Bitcoin komissiyasi ikkala serverdan olinadi, eng past stavka ishlatiladi; chegara 1000 dan 500 sat/vB ga tushdi;
     100 sat/vB dan yuqori yoki komissiya 0.001 BTC dan oshsa ogohlantirish chiqadi (summadan qat'i nazar).
   - Ethereum: komissiya 0.005 ETH dan yoki gas 200 gwei dan oshsa ogohlantirish.
   - Referrer yuborilmaydi (meta). Xavfsizlik sahifasida PIN haqida ochiq eslatma.
   - O'zgarmadi: PIN buzilishi (oflayn hujum) to'liq tuzatilmagan, chunki veb brauzerda qurilma kalitiga bog'lash imkoni yo'q. Android'da Keystore bilan o'rash hali qilinmagan.

VERSIYA 25: yangi imkoniyatlar
   - TON yuborishda izoh (memo/comment) maydoni: birjalar depozit uchun talab qiladi. Imzolovchi modul rasmiy @ton/ton kutubxonasi bilan solishtirilgan.
   - QR skaner: "Yuborish" sahifasida "QR" tugmasi (kamera). Faqat brauzer BarcodeDetector'ni qo'llasa ko'rinadi (Android Chrome); iPhone Safari va Android ilovasida hozircha yo'q.
     bitcoin:, ethereum:, ton:// havolalari tushuniladi (BTC summasi va TON izohi ham to'ldiriladi). Hech narsa o'z-o'zidan yuborilmaydi: baribir tekshirish va so'zlar so'raladi.
     _headers: kamera ruxsati camera=(self) ga o'zgardi (faqat shu sayt).
   - Yangi tokenlar (Ethereum): AAVE, PEPE, LDO, CRV. Kontrakt manzillari nazorat yig'indisi bilan tekshirilgan, belgi va decimals ishlatishda zanjirdan qayta tekshiriladi.
   - Hali yo'q: Solana tokenlari va USDT-TON'ni yuborish (faqat qabul qilish), umumiy tarix sahifasi.

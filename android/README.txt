MENING HAMYONIM: ANDROID ILOVA (v16)
====================================
Bu veb-hamyonning telefon ilovasi. Ichida o'sha hamyon ishlaydi, lekin:
 - Face ID / barmoq izi telefonning Keystore xotirasi orqali ishlaydi: kalit faqat barmoq izi yoki yuz tasdiqlangandan keyin ochiladi.
 - Ilovaning ekran tasviri va "so'nggi ilovalar" rasmi o'chirilgan (maxfiy so'zlar ekranda qolmasligi uchun).
 - Bulutga zaxiralash (Google Backup) o'chirilgan.
 - Faqat o'z fayllari yuklanadi; boshqa havolalar telefon brauzerida ochiladi.

ESLATMA: bu loyiha mening muhitimda yig'ilmagan (Android SDK u yerda yuklanmaydi). Birinchi yig'ishda xato chiqsa,
GitHub "Actions" sahifasidagi xato matnini yuboring, tuzataman.

APK NI QANDAY OLISH (kompyuterda bo'lsa oson, bepul)
1) github.com da hisob oching va YANGI PRIVATE (yopiq) repozitoriy yarating (masalan: hamyon-android).
2) Shu zip ni oching. Papka ichidagi HAMMA fayllarni repozitoriyga yuklang:
   "Add file > Upload files". Diqqat: ".github" papkasi yashirin bo'lishi mumkin. Agar yuklanmasa:
   "Add file > Create new file", nom maydoniga   .github/workflows/android.yml   deb yozing va
   android-workflow.yml faylining ichidagi matnni joylang.
3) Repozitoriyda "Actions" bo'limiga kiring > "Android APK" > "Run workflow".
4) 5-10 daqiqadan keyin tugagach, ishga tushirish sahifasining pastida "hamyon-apk" (Artifacts) chiqadi. Yuklab oling, zip ichida .apk bor.
5) APK ni telefonga o'tkazing va oching (telefon "noma'lum manbadan o'rnatish"ni so'raydi, ruxsat bering).

MUHIM: YANGILASHDA MA'LUMOT YO'QOLMASLIGI UCHUN IMZO KALITI
Imzo kaliti berilmasa, har yig'ishda boshqa vaqtinchalik kalit bilan imzolangan sinov APK chiqadi. Telefondagi eski ilova ustiga
yangisini o'rnatib bo'lmaydi: eskisini o'chirish kerak, bu hamyon ma'lumotini ham o'chiradi (maxfiy so'zlar bilan qayta kirasiz).
Shuning uchun maxfiy so'zlaringiz xavfsiz joyda yozib qo'yilganiga ishonch hosil qiling.
Doimiy kalit yaratish (bir marta, kompyuterda Java bo'lsa):
   keytool -genkeypair -v -keystore hamyon.jks -alias hamyon -keyalg RSA -keysize 4096 -validity 10000
   base64 -w0 hamyon.jks        (Windows: certutil -encode hamyon.jks hamyon.b64)
GitHub repozitoriy > Settings > Secrets and variables > Actions > New repository secret:
   KEYSTORE_B64      = base64 matni
   KEYSTORE_PASSWORD = kalit ombori paroli
   KEY_ALIAS         = hamyon
   KEY_PASSWORD      = kalit paroli
hamyon.jks faylini va parollarni xavfsiz joyda saqlang. Yo'qolsa, ilovani yangilab bo'lmaydi. Kimdir kalitingizni olsa, sizning
nomingizdan soxta yangilanish chiqara oladi: uni hech kimga bermang va repozitoriyga yuklamang.

ANDROID STUDIO BILAN (ixtiyoriy)
Android Studio da bu papkani oching ("Open"), u o'zi hamma narsani yuklaydi. Build > Build APK(s).

BIOMETRIK HAQIDA HALOL ESLATMA
Ilova faqat "yuqori xavfsizlik" (Class 3 / BIOMETRIC_STRONG) darajali barmoq izi yoki yuzni qabul qiladi. Ko'p Android telefonlarda
barmoq izi shu darajada, lekin oddiy "yuz bilan ochish" ko'pincha past darajali va qabul qilinmaydi. Telefon sozlamalarida barmoq izi
qo'shilmagan bo'lsa, Face ID tugmasi o'chiq turadi: bu holda PIN yoki parol ishlating.
Barmoq izi/yuz qo'shilsa yoki o'zgartirilsa, kalit avtomatik bekor bo'ladi va qayta yoqish kerak.

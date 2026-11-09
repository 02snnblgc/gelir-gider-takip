# Hatırlat

Hatırlat, kişisel gelir-gider kayıtları ve tarihli hatırlatmalar için çevrimdışı çalışmayı hedefleyen, telefon ekranlarına uygun bir uygulama başlangıç projesidir. Bu ilk sürüm HTML, CSS ve modüler JavaScript ile hazırlanmıştır; kayıtlar cihazın tarayıcı depolamasında tutulur.

## Proje yapısı

```text
.
├── index.html
├── manifest.webmanifest
├── service-worker.js
├── assets/
│   └── app-icon.svg
└── src/
    ├── css/
    │   └── style.css
    └── js/
        ├── app.js
        ├── export.js
        ├── finance.js
        ├── reminders.js
        └── storage.js
```

## Çalıştırma

ES modülleri ve Service Worker nedeniyle projeyi bir yerel web sunucusunda açın (ör. VS Code Live Server). `index.html` dosyasını doğrudan `file://` üzerinden açmak desteklenmez. Uygulama verileri bu tarayıcı/cihazda kalır; tarayıcı verileri silinirse kayıtlar da silinebilir. Düzenli JSON yedeği alın.

## Özellikler (başlangıç sürümü)

- Aylık gelir ve gider kaydı, kategori, tutar, tarih ve not
- Önceki/sonraki ay seçimi, otomatik toplam ve dönem notu
- Tarihli hatırlatmalar, tekrar seçimi, tamamlandı/erteleme durumu
- Kayıt arama, JSON yedekleme/geri yükleme ve CSV dışa aktarma
- Koyu/açık görünüm ve beş pastel vurgu rengi
- Çevrimdışı statik dosya önbelleği

## Android alarmı hakkında önemli not

Bu web başlangıç sürümü Android'in kesin zamanlı alarmı değildir. Uygulama kapalıyken, tarayıcı sonlandırıldığında veya cihaz yeniden başlatıldığında güvenilir alarm vermeyi HTML/JavaScript tek başına garanti edemez. Web bildirimleri yalnızca uygulama açıkken kontrol edilir. İstenen alarm ekranı, ses, erteleme, yeniden başlatma sonrası alarm geri yükleme ve Android exact-alarm izinleri için sonraki aşamada Capacitor tabanlı Android kabuğu ve yerel Android alarm/bildirim eklentisi gerekir. Pil optimizasyonu ve izin akışları da Android sürümüne göre ayrıca uygulanmalıdır.

Melodi seçici, profil/parola ve hassas verilerin şifrelenmesi de yerel Android entegrasyon aşamasına bırakılmıştır. Bu prototipte parola veya profil fotoğrafı saklanmaz; verileri güvenli hesap senkronizasyonuna göndermez.

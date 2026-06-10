# Dış Depolar Takip Sistemi

Fabrika dışında gerçekleşen operasyonel verilerin (dış depo stokları, fabrikaya yapılan
taşımalar, taşıma/depolama maliyetleri) takibi için geliştirilen uygulama.

## Kurulum

```bash
npm install
cp .env.local.example .env.local   # Supabase bilgilerini doldurun
npm run dev
```

## Roller

- **admin**: Depoları, ürünleri, varış noktalarını, başlangıç stoklarını, fiyat
  anlaşmalarını ve depolama ücretlerini yönetir. Tüm taşımaları ve maliyet
  raporlarını görür.
- **depo**: Sadece kendi atandığı dış depo için fabrikaya yapılan taşımaları
  (plaka, tonaj, ürün, varış yeri) girer.

## Supabase

Bu proje Supabase (proje id: `wigerxaoaeonbfedbhzq`) üzerinde çalışır. Tablolar ve
RLS politikaları migration olarak Supabase projesine uygulanmıştır.

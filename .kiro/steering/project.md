---
inclusion: always
---

# Finora — Project Steering

## Deskripsi Project
Finora adalah aplikasi web pencatat dan pengelola pengeluaran sehari-hari (expense tracker).
Dibangun dengan HTML, CSS, dan Vanilla JavaScript murni — tanpa framework atau backend.

## Struktur File
```
FINORA/
├── index.html          # Markup utama, maskot Fino SVG, layout halaman
├── css/
│   └── style.css       # Semua styling: tema, layout, dark mode, responsive
├── js/
│   └── script.js       # Semua logika: storage, form, chart, sort, tema
└── .kiro/
    └── steering/
        └── project.md  # File ini
```

## Teknologi
- HTML5 (semantik, tanpa framework)
- CSS3 (Custom Properties, Flexbox, Grid, Media Queries)
- Vanilla JavaScript ES6+ (tanpa React/Vue/Angular)
- Chart.js v4.4.0 via CDN (pie chart)
- Browser localStorage (penyimpanan data)

## Fitur Utama
1. **Form Input Transaksi** — nama item, jumlah, kategori; semua field wajib diisi
2. **Transaction List** — tampil semua transaksi, bisa di-scroll, ada tombol delete
3. **Total Balance** — total pengeluaran update otomatis
4. **Pie Chart** — distribusi pengeluaran per kategori via Chart.js
5. **Custom Category** — tambah kategori baru di luar Food/Transport/Fun
6. **Sort Transaction** — urutkan by terbaru/terlama/tertinggi/terendah/A-Z
7. **Dark/Light Mode** — toggle tema, preferensi tersimpan di localStorage

## Kategori Default
| Kategori  | Emoji | Warna Chart |
|-----------|-------|-------------|
| Food      | 🍜    | `#FF8A65`   |
| Transport | 🚗    | `#42A5F5`   |
| Fun       | 🎉    | `#AB47BC`   |
| Custom    | ✨    | `#26C6DA` (dan rotasi warna lain) |

## Tema Warna
- Background: `#FFFDE7` (kuning muda)
- Accent: `#87CEEB` (biru langit)
- Card: `#FFFFFF` (putih)
- Dark mode background: `#1A1F2E`

## localStorage Keys
| Key                   | Isi                        |
|-----------------------|----------------------------|
| `finora_transactions` | Array semua transaksi      |
| `finora_categories`   | Array kategori custom      |
| `finora_theme`        | `"light"` atau `"dark"`    |
| `finora_sort`         | Nilai sort aktif           |

## Maskot
**Fino** — anak burung hantu (owl chick) berwarna kuning dan biru langit.
Diimplementasikan sebagai SVG inline di `index.html`, bersifat dekoratif (`aria-hidden="true"`).

## Aturan Pengembangan
- Jangan menambahkan framework JavaScript (React, Vue, Angular, dsb.)
- Jangan menambahkan backend atau database
- Pertahankan struktur 1 HTML + 1 CSS + 1 JS
- Semua perubahan styling di `css/style.css`
- Semua perubahan logika di `js/script.js`
- Gunakan CSS Custom Properties untuk nilai warna dan spacing
- Pastikan tetap mobile-friendly dan responsive

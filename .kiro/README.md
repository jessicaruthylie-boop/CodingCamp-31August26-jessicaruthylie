# .kiro — Kiro IDE Configuration

Folder ini berisi konfigurasi project Finora untuk Kiro IDE.

## Isi Folder

```
.kiro/
├── README.md              # File ini
├── steering/
│   └── project.md         # Steering rules — selalu aktif saat bekerja di project ini
└── hooks/
    └── (kosong)           # Placeholder untuk hooks jika dibutuhkan
```

## Steering

File `steering/project.md` berisi aturan dan konteks project yang selalu diikutsertakan
oleh Kiro saat sesi berlangsung. Ini memastikan Kiro selalu tahu:

- Teknologi yang digunakan (HTML, CSS, Vanilla JS)
- Struktur file yang harus dipertahankan
- Fitur-fitur yang sudah ada
- Aturan pengembangan (tidak boleh pakai framework, dll.)

## Referensi

- [Kiro Steering Docs](https://kiro.dev/docs/steering)
- Project: **Finora** — expense tracker berbasis browser

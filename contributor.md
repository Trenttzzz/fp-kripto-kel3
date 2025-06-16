# Kontribusi dan Pembagian Tugas

Berikut adalah pembagian tugas untuk proyek **HMAC File Uploader & Verifier** dari Kelompok 3.

## 🔧 Tim Backend (3 orang)

1.  **Hazwan Adhikara (5027231017) - Backend Core API**

    > **Fokus pada:** `app.py`
    >
    > - Setup aplikasi Flask dan routing dasar.
    > - Implementasi endpoint untuk upload dan download (`/api/upload`, `/api/download/<filename>`).
    > - Endpoint untuk manajemen file (`/api/files`, `/api/delete/<filename>`).
    > - Logika dasar untuk penanganan dan penyimpanan file.

2.  **Azza Farichi (5027231071) - Backend Advanced Features**

    > **Fokus pada:** `app.py` (bagian fitur lanjutan)
    >
    > - Implementasi endpoint `quick-verify` dengan algoritma deteksi (`/api/quick-verify`).
    > - Endpoint untuk reset dan manajemen (`/api/reset-all`, `/api/simulate-tamper`).
    > - Penanganan error dan format respons.
    > - Integrasi dengan utilitas HMAC.

3.  **Rafael Gunawan (5027231019) - Data Management & Storage**
    > **Fokus pada:** `hmac_store.json` dan operasi file
    >
    > - Logika persistensi data JSON.
    > - Sistem upload/download file di dalam folder `uploads`.
    > - Penamaan file menggunakan UUID dan `secure_filename`.
    > - Mekanisme backup dan pembersihan.

## 🎨 Tim Frontend (2 orang)

4.  **Gallant Damas H (5027231037) - Frontend UI Design**

    > **Fokus pada:** `index.html`
    >
    > - Struktur dan layout HTML.
    > - Styling dengan Tailwind CSS dan desain responsif.
    > - Sistem navigasi tab.
    > - Dialog modal dan status loading.
    > - Desain UI/UX secara keseluruhan.

5.  **Dani Wahyu (5027231038) - Frontend JavaScript Logic**
    > **Fokus pada:** `script.js`
    >
    > - Logika untuk perpindahan dan navigasi tab.
    > - Pengiriman form dan upload file.
    > - Pemanggilan API dan penanganan AJAX.
    > - Notifikasi toast dan umpan balik untuk pengguna.
    > - Interaksi manajemen file (download, hapus, salin).

## 🔐 Tim Cryptography & Logic (2 orang)

6.  **Tio Axellino (5027231065) - HMAC Implementation**

    > **Fokus pada:** `hmac_utils.py`
    >
    > - Fungsi inti HMAC-SHA256 (`generate_hmac`, `verify_hmac`).
    > - Operasi HMAC berbasis file.
    > - Implementasi keamanan (perbandingan waktu-konstan).
    > - Utilitas kriptografi dan fungsi pembantu.

7.  **Nabiel Nizar Anwari (5027231087) - Smart Detection Algorithm**
    > **Fokus pada:** Logika deteksi multi-level
    >
    > - Algoritma deteksi modifikasi file di `quick-verify`.
    > - Algoritma pencocokan berbasis konten.
    > - Deteksi file serupa berdasarkan ukuran dan karakteristik.
    > - Logika untuk membedakan antara file yang diganti nama vs. dimodifikasi.

## 📚 Documentation & Testing (1 orang)

8.  **Veri Rahman (5027231088) - Documentation & Integration**
    > **Fokus pada:** `README.md` dan proyek secara keseluruhan
    >
    > - Dokumentasi proyek dan panduan pengguna.
    > - Pengujian semua fitur dan integrasi.
    > - Manajemen dependensi (`requirements.txt`).
    > - Persiapan presentasi akhir dan demo.

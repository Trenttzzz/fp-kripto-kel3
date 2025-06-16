# HMAC File Uploader & Verifier

Aplikasi web yang aman untuk mendemonstrasikan verifikasi integritas file menggunakan HMAC-SHA256. Proyek ini memungkinkan pengguna untuk mengunggah file teks, menghasilkan tanda tangan HMAC, dan memverifikasi keaslian file—menunjukkan praktik keamanan kriptografi dunia nyata.

**Final Project - Sistem Keamanan Kriptografi**  
**Kelompok 3 - Institut Teknologi Sepuluh Nopember**  
**Tahun Akademik 2025**

| Nama                | NRP        |
|---------------------|------------|
| Hazwan Adhikara     | 5027231017 |
| Rafael Gunawan      | 5027231019 |
| Gallant Damas H     | 5027231037 |
| Dani Wahyu          | 5027231038 |
| Tio Axellino        | 5027231065 |
| Azza Farichi        | 5027231071 |
| Nabiel Nizar Anwari | 5027231087 |
| Veri Rahman         | 5027231088 |

---

## Fitur-Fitur

### **Upload File & Generasi HMAC**
- Upload file `.txt` dengan proteksi kunci rahasia
- Generasi HMAC-SHA256 otomatis untuk file yang diunggah
- Penyimpanan aman file dan HMAC yang sesuai
- Penamaan file unik untuk mencegah konflik

### **Quick Integrity Check (Pemeriksaan Cepat)**
- **Deteksi Otomatis**: Sistem otomatis mencari file yang cocok berdasarkan konten
- **Deteksi File Dimodifikasi**: Logika cerdas untuk mendeteksi file yang telah diubah
- **Multi-Level Detection**: Berbagai tingkat deteksi untuk akurasi maksimal

### **Manajemen File**
- Lihat semua file yang diunggah dengan metadata
- Download file asli dan file HMAC
- Salin nilai HMAC ke clipboard
- Hapus file individual atau reset semua file
- Daftar file responsif dengan UI modern

### **Simulasi Tampering Edukasi**
- Simulasi perusakan file untuk tujuan edukasi
- Demonstrasi bagaimana HMAC mendeteksi modifikasi file
- Sempurna untuk mempelajari konsep integritas data

---

## Logika Deteksi File yang Dimodifikasi

Sistem kami menggunakan algoritma deteksi multi-level yang cerdas untuk mengidentifikasi file yang telah dimodifikasi:

### **1. Exact Content Match (Prioritas Tertinggi)**
```
HMAC File Saat Ini == HMAC File Tersimpan
```
- **Hasil**: ✅ File asli, tidak ada perubahan
- **Metode**: Perbandingan HMAC langsung
- **Akurasi**: 100% - file identik

### **2. Filename Match dengan Content Berbeda**
```
Nama File == Nama File Tersimpan
HMAC File Saat Ini != HMAC File Tersimpan
```
- **Hasil**: ⚠️ File dengan nama sama telah dimodifikasi
- **Metode**: Cocokkan nama file, bandingkan HMAC
- **Indikasi**: File asli telah diubah isinya

### **3. Similar File Detection (Deteksi File Serupa)**
```
|Ukuran File Saat Ini - Ukuran File Tersimpan| ≤ 50 bytes
HMAC File Saat Ini != HMAC File Tersimpan
```
- **Hasil**: ⚠️ Kemungkinan file telah dimodifikasi
- **Metode**: Perbandingan ukuran file dengan toleransi
- **Indikasi**: File dengan karakteristik serupa namun konten berbeda

### **4. No Match (Tidak Ada Kecocokan)**
```
Tidak ada kecocokan nama file, HMAC, atau ukuran
```
- **Hasil**: 🔍 File baru yang belum pernah diunggah
- **Metode**: Tidak ditemukan dalam database
- **Saran**: Upload file ini terlebih dahulu

### **Algoritma Deteksi**
```python
def detect_file_status(current_file, secret_key, stored_files):
    current_hmac = generate_hmac(current_file.content, secret_key)
    
    # 1. Cek exact content match
    for stored_file in stored_files:
        if stored_file.hmac == current_hmac:
            return "EXACT_MATCH", stored_file
    
    # 2. Cek filename match
    for stored_file in stored_files:
        if stored_file.original_name == current_file.name:
            return "FILENAME_MATCH_MODIFIED", stored_file
    
    # 3. Cek similar size (possible modification)
    for stored_file in stored_files:
        size_diff = abs(stored_file.size - current_file.size)
        if size_diff <= 50:  # Toleransi 50 bytes
            return "POSSIBLY_MODIFIED", stored_file
    
    # 4. No match found
    return "NEW_FILE", None
```

### **Keunggulan Sistem Deteksi**
- **Content-First Approach**: Prioritas pada konten, bukan nama file
- **Tolerant to Renaming**: File yang diganti namanya tetap terdeteksi jika kontennya sama
- **Smart Modification Detection**: Mendeteksi modifikasi berdasarkan karakteristik file
- **Educational Value**: Membantu pemahaman tentang integritas data

---

## Arsitektur

```
hmac-file-uploader/
├── app.py                 # Flask backend API
├── hmac_utils.py          # Fungsi kriptografi HMAC
├── requirements.txt       # Dependencies Python
├── hmac_store.json        # Penyimpanan mapping file-ke-HMAC
├── uploads/               # Direktori file yang diunggah
├── templates/
│   └── index.html         # Interface web modern
├── static/
│   └── script.js          # Logika JavaScript frontend
└── README.md              # Dokumentasi ini
```

---

## Instalasi & Setup

### Prasyarat
- Python 3.7 atau lebih tinggi
- Browser web modern

### 1. Clone atau Download
```bash
# Jika Anda memiliki file proyek, navigasi ke direktori
cd hmac-file-uploader
```

### 2. Install Dependencies
```bash
pip install -r requirements.txt
```

### 3. Jalankan Aplikasi
```bash
python app.py
```

### 4. Akses Interface Web
Buka browser Anda dan navigasi ke:
```
http://localhost:5000
```

---

## Panduan Penggunaan

### Interface Web

#### **Upload File**
1. Pilih file `.txt` menggunakan file picker atau drag & drop
2. Masukkan kunci rahasia (ingat ini untuk verifikasi!)
3. Klik "Upload & Generate HMAC"
4. Sistem akan menghasilkan dan menyimpan HMAC secara otomatis

#### **Quick Integrity Check**
1. Pilih file yang ingin diperiksa (file yang pernah di-download)
2. Masukkan kunci rahasia yang sama
3. Klik "Quick Integrity Check"
4. Sistem akan otomatis mencari dan membandingkan dengan database
5. Lihat hasil deteksi yang detail

#### **Download File**
- **File**: Download file asli yang diunggah
- **HMAC**: Download file `.hmac` yang berisi metadata
- **Copy**: Salin nilai HMAC ke clipboard
- **Tamper**: Simulasi modifikasi file (edukasi)
- **Delete**: Hapus file individual dari server

#### **Reset All Files**
- Klik tombol "Reset All" untuk menghapus semua file dan reset database HMAC

---

## Fitur Keamanan

### **HMAC-SHA256**
- Fungsi hash kriptografi standar industri
- Menggabungkan SHA-256 dengan autentikasi kunci rahasia
- Menyediakan verifikasi integritas dan keaslian

### **Perbandingan Waktu Konstan**
```python
hmac.compare_digest(calculated_hmac, expected_hmac)
```
- Mencegah kerentanan serangan timing
- Perbandingan aman nilai HMAC

### **Validasi Input**
- Pembatasan jenis file (hanya `.txt`)
- Penanganan nama file yang aman
- Sanitasi dan validasi input

### **Penyimpanan File Unik**
- Generasi nama file berbasis UUID
- Mencegah konflik penamaan file
- Penanganan path file yang aman

---

## API Endpoints

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| `GET` | `/` | Tampilkan interface web utama |
| `POST` | `/api/upload` | Upload file dan generate HMAC |
| `GET` | `/api/files` | List semua file yang diunggah |
| `GET` | `/api/download/<filename>` | Download file asli |
| `GET` | `/api/download-hmac/<filename>` | Download file metadata HMAC |
| `POST` | `/api/quick-verify` | Verifikasi integritas file (otomatis) |
| `DELETE` | `/api/delete/<filename>` | Hapus file individual |
| `POST` | `/api/reset-all` | Reset semua file dan database |
| `POST` | `/api/simulate-tamper/<filename>` | Simulasi perusakan file |

---

## Implementasi Teknis

### **Backend (Flask)**
- Desain API RESTful
- Penanganan upload file dengan pemeriksaan keamanan
- Generasi dan verifikasi HMAC
- Penyimpanan data berbasis JSON
- Error handling dan validasi

### **Frontend (HTML/CSS/JS)**
- Desain responsif dengan Tailwind CSS
- UI modern dengan ikon Lucide
- Upload file drag & drop
- Feedback dan notifikasi real-time
- Hasil verifikasi interaktif

### **Kriptografi**
- Implementasi HMAC-SHA256
- Encoding Base64 untuk penyimpanan
- Perbandingan waktu konstan
- Penanganan kunci yang aman

### **Algoritma Deteksi Modifikasi**
- Multi-level detection system
- Content-first approach untuk akurasi
- Toleransi terhadap perubahan nama file
- Deteksi berdasarkan karakteristik file

---

## Contoh Penggunaan

### **Skenario 1: File Asli**
```
1. Upload file "document.txt" dengan kunci "mykey123"
2. Download file tersebut (nama bisa berubah)
3. Quick Integrity Check dengan file yang di-download
4. Hasil: ✅ File integrity verified!
```

### **Skenario 2: File Dimodifikasi**
```
1. Upload file "document.txt" dengan kunci "mykey123"
2. Download file tersebut
3. Edit isi file (tambah/hapus teks)
4. Quick Integrity Check dengan file yang sudah diedit
5. Hasil: ⚠️ File Modified! Same name but content changed.
```

### **Skenario 3: File Baru**
```
1. Buat file baru yang belum pernah di-upload
2. Quick Integrity Check dengan file baru
3. Hasil: 🔍 No matching file found in our database.
```

---


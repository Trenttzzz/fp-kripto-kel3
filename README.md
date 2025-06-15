# HMAC File Uploader & Verifier

A secure web-based application that demonstrates file integrity verification using HMAC-SHA256. This project allows users to upload text files, generate HMAC signatures, and verify file authenticity—showcasing real-world cryptographic security practices.

**Final Project - Sistem Keamanan Kriptografi**  
**Kelompok 3 - Institut Teknologi Sepuluh Nopember**  
**Tahun Akademik 2025**

---

## Features

### **File Upload & HMAC Generation**
- Upload `.txt` files with secret key protection
- Automatic HMAC-SHA256 generation for uploaded files
- Secure storage of files and their corresponding HMACs
- Unique file naming to prevent conflicts

### **File Integrity Verification**
- Re-upload files to verify their authenticity
- Compare calculated HMAC with stored/provided HMAC
- Real-time verification results with detailed comparison
- Constant-time comparison to prevent timing attacks

### **File Management**
- View all uploaded files with metadata
- Download original files and HMAC files
- Copy HMAC values to clipboard
- Responsive file list with modern UI

### **Educational Tampering Simulation**
- Simulate file tampering for educational purposes
- Demonstrate how HMAC detects file modifications
- Perfect for learning about data integrity concepts

### **CLI Verification Tool**
- Standalone command-line verification utility
- Generate HMAC for local files
- Verify files using stored HMAC files
- Cross-platform compatibility

---

## Architecture

```
hmac-file-uploader/
├── app.py                 # Flask backend API
├── hmac_utils.py          # HMAC cryptographic functions
├── requirements.txt       # Python dependencies
├── hmac_store.json        # File-to-HMAC mapping storage
├── uploads/               # Uploaded files directory
├── templates/
│   └── index.html         # Modern web interface
├── static/
│   └── script.js          # Frontend JavaScript logic
├── cli/
│   └── verify_file.py     # Command-line verification tool
└── README.md              # This documentation
```

---

## Installation & Setup

### Prerequisites
- Python 3.7 or higher
- Modern web browser
- Terminal/Command Prompt

### 1. Clone or Download
```bash
# If you have the project files, navigate to the directory
cd hmac-file-uploader
```

### 2. Install Dependencies
```bash
pip install -r requirements.txt
```

### 3. Run the Application
```bash
python app.py
```

### 4. Access the Web Interface
Open your browser and navigate to:
```
http://localhost:5000
```

---

## Usage Guide

### Web Interface

#### **Upload a File**
1. Select a `.txt` file using the file picker or drag & drop
2. Enter a secret key (remember this for verification!)
3. Click "Upload & Generate HMAC"
4. The system will generate and store the HMAC automatically

#### **Verify File Integrity**
1. Select the file you want to verify
2. Enter the original secret key
3. Provide the expected HMAC value (copy from file list)
4. Click "Verify File Integrity"
5. View detailed verification results

#### **Download Files**
- **File**: Download the original uploaded file
- **HMAC**: Download a `.hmac` file containing metadata
- **Copy**: Copy HMAC value to clipboard
- **Tamper**: Simulate file modification (educational)

### CLI Tool

#### **Generate HMAC for a file**
```bash
python cli/verify_file.py document.txt mysecretkey
```

#### **Verify file with HMAC value**
```bash
python cli/verify_file.py document.txt mysecretkey ABC123DEF456...
```

#### **Verify using HMAC file**
```bash
python cli/verify_file.py document.txt --hmac-file document.txt.hmac
```

#### **CLI Options**
- `--quiet` or `-q`: Minimal output mode
- `--hmac-file`: Use `.hmac` file for verification
- `--help`: Show detailed help information

---

## Security Features

### **HMAC-SHA256**
- Industry-standard cryptographic hash function
- Combines SHA-256 with secret key authentication
- Provides both integrity and authenticity verification

### **Constant-Time Comparison**
```python
hmac.compare_digest(calculated_hmac, expected_hmac)
```
- Prevents timing attack vulnerabilities
- Secure comparison of HMAC values

### **Input Validation**
- File type restrictions (`.txt` only)
- Secure filename handling
- Input sanitization and validation

### **Unique File Storage**
- UUID-based filename generation
- Prevents file naming conflicts
- Secure file path handling

---

## 🛡️ API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/` | Serve main web interface |
| `POST` | `/api/upload` | Upload file and generate HMAC |
| `GET` | `/api/files` | List all uploaded files |
| `GET` | `/api/download/<filename>` | Download original file |
| `GET` | `/api/download-hmac/<filename>` | Download HMAC metadata file |
| `POST` | `/api/verify` | Verify file integrity |
| `POST` | `/api/simulate-tamper/<filename>` | Simulate file tampering |

---


## Technical Implementation

### **Backend (Flask)**
- RESTful API design
- File upload handling with security checks
- HMAC generation and verification
- JSON-based data storage
- Error handling and validation

### **Frontend (HTML/CSS/JS)**
- Responsive design with Tailwind CSS
- Modern UI with Lucide icons
- Drag & drop file upload
- Real-time feedback and notifications
- Interactive verification results

### **Cryptography**
- HMAC-SHA256 implementation
- Base64 encoding for storage
- Constant-time comparison
- Secure key handling

---

